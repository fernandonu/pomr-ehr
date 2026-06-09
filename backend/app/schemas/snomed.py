from pydantic import BaseModel

class SnomedConceptResponse(BaseModel):
    conceptid: str
    term: str

    class Config:
        from_attributes = True
