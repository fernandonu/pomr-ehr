# Import all the models, so that Base has them before being
# imported by Alembic
from app.db.base_class import Base
from app.models.user import User
from app.models.snomed import SnomedConcept
from app.models.patient import Patient
from app.models.problem import Problem
from app.models.evolution import ClinicalEvolution
from app.models.records import Vaccine, Allergy, Procedure, Medication, LabResult
from app.models.api_log import ApiLog
