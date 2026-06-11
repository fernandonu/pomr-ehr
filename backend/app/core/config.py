from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "POMR EHR API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    POSTGRES_SERVER: str = "localhost" # Use 'db' when running within docker network
    POSTGRES_USER: str = "pomr_user"
    POSTGRES_PASSWORD: str = "pomr_password"
    POSTGRES_DB: str = "pomr_db"
    POSTGRES_PORT: str = "5432"

    @property
    def SQLALCHEMY_DATABASE_URI(self) -> str:
        return f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    SECRET_KEY: str = "CHANGEME_IN_PRODUCTION"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    
    NODO_BASE_URL: str = "https://ipsgarrahan.fgnu.ar"
    URL_ALTA_ABM_DOMINIO: str = "https://sigep.saludtdf.gob.ar/"
    CODIGO_REFES: str = "2004010004"
    
    RENAPER_NOMBRE: str = "AwAfBhRGFggUDAQAH10TABMCHA=="
    RENAPER_CLAVE: str = "P00cG1EaPSAjVjQVAUZGWUQ="
    RENAPER_COD_DOMINIO: str = "https://hc.salud.chaco.gob.ar"

    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()
