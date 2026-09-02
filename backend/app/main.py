import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from backend.app.database.connection import engine, Base, SessionLocal
from backend.app.curriculum.loader import seed_curriculum_and_questions
from backend.app.api import auth, curriculum, assessments, roadmap, ai, telemetry

# Initialize DB tables
Base.metadata.create_all(bind=engine)

# Seed curriculum and question bank on startup
with SessionLocal() as db:
    seed_curriculum_and_questions(db)

app = FastAPI(
    title="Adaptive Student Intelligence & Roadmap Engine (JEE Main & NEET)",
    description="Offline-first, mathematically-grounded adaptive assessment, ML prediction, and dynamic roadmap engine for JEE Main and NEET.",
    version="1.1.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(auth.router, prefix="/api")
app.include_router(curriculum.router, prefix="/api")
app.include_router(assessments.router, prefix="/api")
app.include_router(roadmap.router, prefix="/api")
app.include_router(ai.router, prefix="/api")
app.include_router(telemetry.router, prefix="/api")

# Static frontend files path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
FRONTEND_DIR = os.path.join(BASE_DIR, "frontend")

if os.path.exists(FRONTEND_DIR):
    app.mount("/static", StaticFiles(directory=FRONTEND_DIR), name="static")
    app.mount("/css", StaticFiles(directory=os.path.join(FRONTEND_DIR, "css")), name="css")
    app.mount("/js", StaticFiles(directory=os.path.join(FRONTEND_DIR, "js")), name="js")

    @app.get("/")
    def serve_frontend_index():
        index_file = os.path.join(FRONTEND_DIR, "index.html")
        if os.path.exists(index_file):
            return FileResponse(
                index_file,
                headers={"Cache-Control": "no-cache, no-store, must-revalidate", "Pragma": "no-cache", "Expires": "0"}
            )
        return {"message": "Adaptive Student Intelligence Engine API is active."}

@app.get("/api/health")
def health_check():
    return {
        "status": "HEALTHY",
        "engine": "Adaptive Student Intelligence & Dynamic Roadmap Platform",
        "supported_exams": ["JEE", "NEET"],
        "models": ["MultiFactor_Mastery", "Ebbinghaus_Decay", "BKT_Knowledge_Tracing", "IRT_2PL", "NetworkX_DAG_Prerequisites"]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="127.0.0.1", port=8000, reload=True)
