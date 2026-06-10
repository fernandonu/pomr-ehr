import os
import httpx
import json
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.patient import Patient
from app.models.api_log import ApiLog

from app.core.config import settings

async def log_api_call(db: AsyncSession, patient_id: int, endpoint: str, method: str, req_payload: dict, res_payload: dict, status_code: int):
    log = ApiLog(
        patient_id=patient_id,
        endpoint=endpoint,
        method=method,
        request_payload=json.dumps(req_payload) if req_payload else None,
        response_payload=json.dumps(res_payload) if res_payload else None,
        status_code=status_code
    )
    db.add(log)
    await db.commit()

async def federate_patient(patient_id: int, current_user_id: int, db: AsyncSession):
    result = await db.execute(select(Patient).filter(Patient.id == patient_id))
    patient = result.scalars().first()
    if not patient:
        raise ValueError("Patient not found")

    async with httpx.AsyncClient() as client:
        # Step 1: ITI-78 - Find Patient
        find_url = f"{settings.NODO_BASE_URL}/fhir/Patient?identifier=http://www.renaper.gob.ar/dni|{patient.documento}"
        try:
            find_resp = await client.get(find_url, timeout=10.0)
            find_data = find_resp.json()
            await log_api_call(db, patient_id, "/fhir/Patient (Find)", "GET", None, find_data, find_resp.status_code)
        except Exception as e:
            await log_api_call(db, patient_id, "/fhir/Patient (Find)", "GET", None, {"error": str(e)}, 500)
            raise

        # Check if found
        if find_resp.status_code == 200 and find_data.get("entry") and len(find_data["entry"]) > 0:
            # Usually FHIR bundles have entry -> resource -> id, but prompt mentioned "entry"->"id". Let's handle both.
            entry = find_data["entry"][0]
            remote_id = entry.get("id") or (entry.get("resource") and entry["resource"].get("id"))
            
            if remote_id:
                # Step 2: ITI-78 - Get Patient
                get_url = f"{settings.NODO_BASE_URL}/fhir/Patient/{remote_id}"
                try:
                    get_resp = await client.get(get_url, timeout=10.0)
                    get_data = get_resp.json()
                    await log_api_call(db, patient_id, f"/fhir/Patient/{remote_id} (Get)", "GET", None, get_data, get_resp.status_code)
                    if get_resp.status_code == 200:
                        patient.federation_id = remote_id
                        patient.federated_by = current_user_id
                        await db.commit()
                        return {"status": "success", "message": f"El paciente ya se encuentra federado con ID: {remote_id}", "data": get_data}
                except Exception as e:
                    await log_api_call(db, patient_id, f"/fhir/Patient/{remote_id} (Get)", "GET", None, {"error": str(e)}, 500)
                    raise

        # Step 3: ITI-104 - Create/Update Patient (If not found)
        # Construct FHIR Payload
        fhir_payload = {
            "resourceType": "Patient",
            "meta": {
                "profile": ["http://fhir.msal.gob.ar/core/StructureDefinition/Patient-ar-core"]
            },
            "identifier": [
                {
                    "use": "official",
                    "system": "http://www.renaper.gob.ar/dni",
                    "value": patient.documento
                },
                {
                    "use": "usual",
                    "system": settings.URL_ALTA_ABM_DOMINIO,
                    "value": str(patient.id)
                }
            ],
            "active": True,
            "name": [
                {
                    "use": "official",
                    "text": f"{patient.nombre} {patient.apellido}",
                    "family": patient.apellido,
                    "_family": {
                        "extension": [
                            {
                                "url": "http://hl7.org/fhir/StructureDefinition/humanname-fathers-family",
                                "valueString": patient.apellido
                            },
                            {
                                "url": "http://hl7.org/fhir/StructureDefinition/humanname-mothers-family",
                                "valueString": patient.apellido_materno or patient.apellido
                            }
                        ]
                    },
                    "given": [patient.nombre]
                }
            ],
            "telecom": [
                {
                    "system": "phone",
                    "value": patient.telefono or "0000000000"
                }
            ],
            "gender": "male" if patient.sexo == "M" else "female" if patient.sexo == "F" else "other",
            "birthDate": patient.fecha_nacimiento.isoformat() if patient.fecha_nacimiento else "1900-01-01"
        }

        create_url = f"{settings.NODO_BASE_URL}/fhir/Patient"
        try:
            create_resp = await client.post(create_url, json=fhir_payload, timeout=10.0)
            create_data = create_resp.json()
            await log_api_call(db, patient_id, "/fhir/Patient (Create)", "POST", fhir_payload, create_data, create_resp.status_code)
            
            if create_resp.status_code in [200, 201]:
                remote_id = create_data.get("id") or (create_data.get("entry") and create_data["entry"][0].get("id"))
                if remote_id:
                    patient.federation_id = remote_id
                    patient.federated_by = current_user_id
                    await db.commit()
                return {"status": "success", "message": "Paciente federado exitosamente", "data": create_data}
            else:
                return {"status": "error", "message": "Error al federar el paciente", "data": create_data}
        except Exception as e:
            await log_api_call(db, patient_id, "/fhir/Patient (Create)", "POST", fhir_payload, {"error": str(e)}, 500)
            raise
