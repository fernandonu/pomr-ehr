import uuid
from datetime import datetime
from app.core.config import settings

def build_ips_transaction_bundle(patient, user, records):
    transaction_id = str(uuid.uuid4())
    document_bundle_id = str(uuid.uuid4())
    composition_id = str(uuid.uuid4())
    patient_id = str(uuid.uuid4())
    practitioner_id = str(uuid.uuid4())
    
    timestamp = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
    
    # 1. Build Inner IPS Document Bundle
    document_entries = []
    
    # Composition
    document_entries.append({
        "fullUrl": f"urn:uuid:{composition_id}",
        "resource": {
            "resourceType": "Composition",
            "id": composition_id,
            "status": "final",
            "type": {
                "coding": [{"system": "http://loinc.org", "code": "60591-5", "display": "Patient Summary Document"}]
            },
            "subject": {"reference": f"urn:uuid:{patient_id}"},
            "date": timestamp,
            "author": [{"reference": f"urn:uuid:{practitioner_id}"}],
            "title": "Resumen de Paciente IPS",
            # We will populate sections later
            "section": []
        }
    })
    
    # Patient
    document_entries.append({
        "fullUrl": f"urn:uuid:{patient_id}",
        "resource": {
            "resourceType": "Patient",
            "id": patient_id,
            "identifier": [
                {
                    "system": "http://www.renaper.gob.ar/dni",
                    "value": patient.documento
                }
            ],
            "name": [{"family": patient.apellido, "given": [patient.nombre]}],
            "gender": "male" if patient.sexo == "M" else "female" if patient.sexo == "F" else "other",
            "birthDate": patient.fecha_nacimiento.strftime("%Y-%m-%d") if patient.fecha_nacimiento else None
        }
    })
    
    # Practitioner
    document_entries.append({
        "fullUrl": f"urn:uuid:{practitioner_id}",
        "resource": {
            "resourceType": "Practitioner",
            "id": practitioner_id,
            "identifier": [
                {
                    "system": "http://www.msal.gov.ar/rm",
                    "value": user.matricula or "NO-MATRICULA"
                }
            ],
            "name": [{"family": user.last_name or "", "given": [user.first_name or ""]}]
        }
    })
    
    # Sections tracking
    sections = {
        "problems": {"title": "Problemas", "code": "11450-4", "entries": []},
        "allergies": {"title": "Alergias", "code": "48765-2", "entries": []},
        "medications": {"title": "Medicamentos", "code": "10160-0", "entries": []},
        "immunizations": {"title": "Vacunas", "code": "11369-6", "entries": []}
    }
    
    # Add Problems (Condition)
    for prob in records.get("problems", []):
        res_id = str(uuid.uuid4())
        document_entries.append({
            "fullUrl": f"urn:uuid:{res_id}",
            "resource": {
                "resourceType": "Condition",
                "id": res_id,
                "clinicalStatus": {"coding": [{"system": "http://terminology.hl7.org/CodeSystem/condition-clinical", "code": "active" if prob.estado == "activo" else "inactive"}]},
                "code": {"coding": [{"system": "http://snomed.info/sct", "code": prob.snomed_concept_id, "display": prob.description}]},
                "subject": {"reference": f"urn:uuid:{patient_id}"}
            }
        })
        sections["problems"]["entries"].append({"reference": f"urn:uuid:{res_id}"})
        
    # Add Allergies
    for al in records.get("allergies", []):
        res_id = str(uuid.uuid4())
        allergy_res = {
            "resourceType": "AllergyIntolerance",
            "id": res_id,
            "clinicalStatus": {"coding": [{"system": "http://terminology.hl7.org/CodeSystem/allergyintolerance-clinical", "code": "active"}]},
            "code": {"coding": [{"system": "http://snomed.info/sct", "code": al.snomed_concept_id, "display": al.descripcion}]},
            "patient": {"reference": f"urn:uuid:{patient_id}"}
        }
        if al.reaccion_snomed_id:
            allergy_res["reaction"] = [{
                "manifestation": [{"coding": [{"system": "http://snomed.info/sct", "code": al.reaccion_snomed_id, "display": al.reaccion}]}]
            }]
        
        document_entries.append({
            "fullUrl": f"urn:uuid:{res_id}",
            "resource": allergy_res
        })
        sections["allergies"]["entries"].append({"reference": f"urn:uuid:{res_id}"})
        
    # Add Medications
    for med in records.get("medications", []):
        res_id = str(uuid.uuid4())
        document_entries.append({
            "fullUrl": f"urn:uuid:{res_id}",
            "resource": {
                "resourceType": "MedicationStatement",
                "id": res_id,
                "status": "active" if med.estado == "activo" else "completed",
                "medicationCodeableConcept": {"coding": [{"system": "http://snomed.info/sct", "code": med.snomed_concept_id, "display": med.descripcion}]},
                "subject": {"reference": f"urn:uuid:{patient_id}"},
                "dosage": [{"text": f"{med.dosis} - {med.frecuencia} - {med.via}"}]
            }
        })
        sections["medications"]["entries"].append({"reference": f"urn:uuid:{res_id}"})
        
    # Add Immunizations
    for vac in records.get("vaccines", []):
        res_id = str(uuid.uuid4())
        document_entries.append({
            "fullUrl": f"urn:uuid:{res_id}",
            "resource": {
                "resourceType": "Immunization",
                "id": res_id,
                "status": "completed",
                "vaccineCode": {"coding": [{"system": "http://snomed.info/sct", "code": vac.snomed_concept_id, "display": vac.descripcion}]},
                "patient": {"reference": f"urn:uuid:{patient_id}"},
                "occurrenceDateTime": vac.fecha.strftime("%Y-%m-%d") if vac.fecha else timestamp
            }
        })
        sections["immunizations"]["entries"].append({"reference": f"urn:uuid:{res_id}"})
        
    # Build Composition sections
    for sec_key, sec_data in sections.items():
        if sec_data["entries"]:
            document_entries[0]["resource"]["section"].append({
                "title": sec_data["title"],
                "code": {"coding": [{"system": "http://loinc.org", "code": sec_data["code"]}]},
                "entry": sec_data["entries"]
            })

    # The inner document bundle
    inner_bundle = {
        "resourceType": "Bundle",
        "id": document_bundle_id,
        "meta": {"profile": ["http://hl7.org/fhir/uv/ips/StructureDefinition/Bundle-uv-ips"]},
        "identifier": {"system": "urn:ietf:rfc:3986", "value": f"urn:uuid:{document_bundle_id}"},
        "type": "document",
        "timestamp": timestamp,
        "entry": document_entries
    }
    
    # 2. Build MHD DocumentReference
    doc_ref_id = str(uuid.uuid4())
    doc_ref = {
        "fullUrl": f"urn:uuid:{doc_ref_id}",
        "resource": {
            "resourceType": "DocumentReference",
            "id": doc_ref_id,
            "status": "current",
            "type": {"coding": [{"system": "http://loinc.org", "code": "60591-5", "display": "Patient Summary Document"}]},
            "subject": {"reference": f"urn:uuid:{patient_id}"},
            "date": timestamp,
            "author": [{"reference": f"urn:uuid:{practitioner_id}"}],
            "custodian": {"identifier": {"system": "https://federador.msal.gob.ar/uri", "value": settings.CODIGO_REFES}},
            "content": [{
                "attachment": {
                    "contentType": "application/fhir+json",
                    "url": f"urn:uuid:{document_bundle_id}",
                    "creation": timestamp
                }
            }]
        },
        "request": {
            "method": "POST",
            "url": "DocumentReference"
        }
    }
    
    # 3. Build MHD List
    list_id = str(uuid.uuid4())
    mhd_list = {
        "fullUrl": f"urn:uuid:{list_id}",
        "resource": {
            "resourceType": "List",
            "id": list_id,
            "status": "current",
            "mode": "working",
            "code": {"coding": [{"system": "https://profiles.ihe.net/ITI/MHD/CodeSystem/MHDlistTypes", "code": "folder"}]},
            "subject": {"reference": f"urn:uuid:{patient_id}"},
            "source": {"identifier": {"system": "https://federador.msal.gob.ar/uri", "value": settings.CODIGO_REFES}},
            "entry": [{"item": {"reference": f"urn:uuid:{doc_ref_id}"}}]
        },
        "request": {
            "method": "POST",
            "url": "List"
        }
    }
    
    # Outer Transaction Bundle
    transaction_bundle = {
        "resourceType": "Bundle",
        "id": transaction_id,
        "meta": {
            "profile": [
                "http://conectataton.msal.gov.ar/StructureDefinition/BundleTransaccAR"
            ]
        },
        "type": "transaction",
        "entry": [
            {
                "fullUrl": f"urn:uuid:{patient_id}",
                "resource": {
                    "resourceType": "Patient",
                    "identifier": [
                        {
                            "system": "http://www.renaper.gob.ar/dni",
                            "value": patient.documento
                        },
                        {
                            "system": "https://federador.msal.gob.ar/patient-id",
                            "value": str(patient.federation_id)
                        }
                    ],
                    "name": [{"family": patient.apellido, "given": [patient.nombre]}],
                    "gender": "male" if patient.sexo == "M" else "female" if patient.sexo == "F" else "other",
                    "birthDate": patient.fecha_nacimiento.strftime("%Y-%m-%d") if patient.fecha_nacimiento else None
                },
                "request": {
                    "method": "POST",
                    "url": "Patient",
                    "ifNoneExist": f"identifier=https://federador.msal.gob.ar/patient-id|{patient.federation_id}"
                }
            },
            {
                "fullUrl": f"urn:uuid:{practitioner_id}",
                "resource": {
                    "resourceType": "Practitioner",
                    "identifier": [
                        {
                            "system": "http://www.msal.gov.ar/rm",
                            "value": user.matricula or "NO-MATRICULA"
                        }
                    ],
                    "name": [{"family": user.last_name or "", "given": [user.first_name or ""]}]
                },
                "request": {
                    "method": "POST",
                    "url": "Practitioner",
                    "ifNoneExist": f"identifier=http://www.msal.gov.ar/rm|{user.matricula or 'NO-MATRICULA'}"
                }
            },
            mhd_list,
            doc_ref,
            {
                "fullUrl": f"urn:uuid:{document_bundle_id}",
                "resource": inner_bundle,
                "request": {
                    "method": "POST",
                    "url": "Bundle"
                }
            }
        ]
    }
    
    return transaction_bundle
