from app.models.patient import Patient
from app.models.problem import Problem
from typing import Dict, Any

# Scaffold for FHIR mapping
# In a real scenario, use fhir.resources library for validation

def map_patient_to_fhir(patient: Patient) -> Dict[str, Any]:
    return {
        "resourceType": "Patient",
        "id": str(patient.id),
        "identifier": [
            {
                "system": "http://hospital.org/identifier/dni",
                "value": patient.documento
            }
        ],
        "name": [
            {
                "family": patient.apellido,
                "given": [patient.nombre]
            }
        ],
        "gender": "male" if patient.sexo.lower() in ['m', 'masculino', 'male'] else "female",
        "birthDate": patient.fecha_nacimiento.isoformat() if patient.fecha_nacimiento else None
    }

def map_problem_to_fhir_condition(problem: Problem) -> Dict[str, Any]:
    return {
        "resourceType": "Condition",
        "id": str(problem.id),
        "clinicalStatus": {
            "coding": [
                {
                    "system": "http://terminology.hl7.org/CodeSystem/condition-clinical",
                    "code": "active" if problem.estado == "activo" else "inactive"
                }
            ]
        },
        "code": {
            "coding": [
                {
                    "system": "http://snomed.info/sct",
                    "code": problem.snomed_concept_id,
                    "display": problem.description
                }
            ]
        },
        "subject": {
            "reference": f"Patient/{problem.paciente_id}"
        }
    }
