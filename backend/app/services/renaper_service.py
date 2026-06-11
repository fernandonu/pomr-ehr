import httpx
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.services.federation import log_api_call

async def validate_renaper_cobertura(documento: str, sexo: str, db: AsyncSession):
    # Mapping sexo to idSexo
    id_sexo = "1" if sexo == "F" else ("2" if sexo == "M" else "1")

    # 1. Login to get token
    login_url = "https://federador.msal.gob.ar/masterfile-federacion-service/api/usuarios/aplicacion/login"
    login_payload = {
        "nombre": settings.RENAPER_NOMBRE,
        "clave": settings.RENAPER_CLAVE,
        "codDominio": settings.RENAPER_COD_DOMINIO
    }

    async with httpx.AsyncClient() as client:
        try:
            login_res = await client.post(login_url, json=login_payload, timeout=10.0)
            login_res.encoding = 'utf-8'
            await log_api_call(db, None, "(Login Renaper) " + login_url, "POST", login_payload, login_res.json() if login_res.text else None, login_res.status_code)
            
            if login_res.status_code != 200:
                raise Exception("Error al obtener token del BUS MSAL")
            
            # The token could be raw text or a JSON. In Postman, we see the token is a JWT.
            # We'll try to parse it. It's usually plain text or {"token": "..."}
            login_data = login_res.text
            token = ""
            try:
                json_login = login_res.json()
                token = json_login.get("token", login_data)
            except:
                token = login_data.strip()

        except Exception as e:
            await log_api_call(db, None, "(Login Renaper) " + login_url, "POST", login_payload, {"error": str(e)}, 500)
            raise e

        # 2. Call Renaper
        renaper_url = f"https://federador.msal.gob.ar/masterfile-federacion-service/api/personas/renaper?nroDocumento={documento}&idSexo={id_sexo}"
        renaper_headers = {
            "token": token,
            "codDominio": "DOMINIOSINAUTORIZACIONDEALTA"
        }
        
        renaper_data = None
        try:
            renaper_res = await client.get(renaper_url, headers=renaper_headers, timeout=15.0)
            renaper_res.encoding = 'utf-8'
            
            # Read response
            try:
                renaper_data = renaper_res.json()
            except:
                renaper_data = {"raw": renaper_res.text}

            await log_api_call(db, None, "(Renaper) " + renaper_url, "GET", None, renaper_data, renaper_res.status_code)
            
        except Exception as e:
            await log_api_call(db, None, "(Renaper) " + renaper_url, "GET", None, {"error": str(e)}, 500)

        # 3. Call Cobertura
        cobertura_url = f"https://federador.msal.gob.ar/masterfile-federacion-service/api/personas/cobertura?nroDocumento={documento}&idSexo={id_sexo}"
        cobertura_headers = {
            "token": token,
            "codDominio": "2.16.840.1.113883.2.10.58",
            "Content-Type": "application/json"
        }
        
        cobertura_data = None
        try:
            cobertura_res = await client.get(cobertura_url, headers=cobertura_headers, timeout=15.0)
            cobertura_res.encoding = 'utf-8'
            try:
                cobertura_data = cobertura_res.json()
            except:
                cobertura_data = {"raw": cobertura_res.text}
            
            await log_api_call(db, None, "(Cobertura) " + cobertura_url, "GET", None, cobertura_data, cobertura_res.status_code)
        except Exception as e:
            await log_api_call(db, None, "(Cobertura) " + cobertura_url, "GET", None, {"error": str(e)}, 500)

    # 4. Map the response
    result = {
        "nombre": "",
        "apellido": "",
        "fecha_nacimiento": "",
        "cobertura": "",
        "calle": "",
        "numero": "",
        "piso": "",
        "departamento": "",
        "cpostal": "",
        "barrio": "",
        "monoblock": "",
        "ciudad": "",
        "municipio": "",
        "provincia": "",
        "pais": ""
    }

    if isinstance(renaper_data, dict):
        result["nombre"] = renaper_data.get("nombres", "")
        result["apellido"] = renaper_data.get("apellido", "")
        result["fecha_nacimiento"] = renaper_data.get("fechaNacimiento", "")
        result["calle"] = renaper_data.get("calle", "")
        result["numero"] = renaper_data.get("numero", "")
        result["piso"] = renaper_data.get("piso", "")
        result["departamento"] = renaper_data.get("departamento", "")
        result["cpostal"] = renaper_data.get("cpostal", "")
        result["barrio"] = renaper_data.get("barrio", "")
        result["monoblock"] = renaper_data.get("monoblock", "")
        result["ciudad"] = renaper_data.get("ciudad", "")
        result["municipio"] = renaper_data.get("municipio", "")
        result["provincia"] = renaper_data.get("provincia", "")
        result["pais"] = renaper_data.get("pais", "")

    if cobertura_data:
        import json
        if isinstance(cobertura_data, dict) and "cobertura" in cobertura_data:
            result["cobertura"] = str(cobertura_data["cobertura"])
        elif isinstance(cobertura_data, list) and len(cobertura_data) > 0 and isinstance(cobertura_data[0], dict) and "cobertura" in cobertura_data[0]:
            result["cobertura"] = str(cobertura_data[0]["cobertura"])
        else:
            result["cobertura"] = json.dumps(cobertura_data, ensure_ascii=False)

    return result
