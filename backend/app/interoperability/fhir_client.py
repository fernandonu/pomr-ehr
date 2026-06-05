import httpx
import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)

class FHIRClient:
    def __init__(self, base_url: str, token: str = None):
        self.base_url = base_url
        self.headers = {
            "Content-Type": "application/fhir+json",
            "Accept": "application/fhir+json"
        }
        if token:
            self.headers["Authorization"] = f"Bearer {token}"
            
    async def push_resource(self, resource_type: str, resource_id: str, payload: Dict[str, Any]) -> bool:
        url = f"{self.base_url}/{resource_type}/{resource_id}"
        try:
            async with httpx.AsyncClient() as client:
                response = await client.put(url, json=payload, headers=self.headers)
                response.raise_for_status()
                return True
        except httpx.HTTPError as e:
            logger.error(f"FHIR Push Error for {resource_type}/{resource_id}: {str(e)}")
            return False

# Dependency injection or global instance
# fhir_client = FHIRClient(base_url="https://external-hie.org/fhir", token="dummy")
