# POMR EHR - Historia Clínica Orientada a Problemas

A modern, scalable, and FHIR-ready Problem Oriented Medical Record (POMR) system.

## Architecture
- **Backend:** FastAPI (Python 3.11), SQLAlchemy 2.0 (Async), PostgreSQL.
- **Frontend:** React + TypeScript (Vite), Material UI, Zustand, TanStack Query.
- **Interoperability:** Modular FHIR mappers and client ready for HIE integration.
- **DevOps:** Fully containerized with Docker, automated CI/CD via GitHub Actions.

## Getting Started

### Local Development
1. **Database:** Start the Postgres database via Docker.
   ```bash
   docker-compose up -d db
   ```
2. **Backend:**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # or venv\Scripts\activate on Windows
   pip install -r requirements.txt
   alembic upgrade head
   uvicorn app.main:app --reload
   ```
3. **Frontend:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

### Production Deployment
Use the provided `Dockerfile` in each directory to build the production images, or run the full stack using a production Docker Compose file.

## Clinical Workflow Supported
- Patient Management (Search, Create, Update)
- POMR Flow: Active / Inactive Problems tracking.
- Clinical Evolutions attached to Problems.
- Structured Records: Vaccines, Allergies, Procedures, Medications, Labs.
- Terminology: Pre-integrated SNOMED CT schema.
