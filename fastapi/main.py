from fastapi import FastAPI, Response
from contextlib import asynccontextmanager
# from fastapi.routes import feedback, suggestion
# from fastapi.routes import chatbot
# from fastapi.routes import chatbots
from routes import upload,validate,pdf,feedback,suggestion,scores,deleteidea,chatbot_agent
from fastapi.middleware.cors import CORSMiddleware
from rag.qdrant_store import QdrantStore

@asynccontextmanager
async def lifespan(app: FastAPI):
    qdrant = QdrantStore()
    qdrant.init_collection()

    print("Qdrant initialized")

    yield

    print("Shutdown complete")

app = FastAPI(title="Startup Idea Validator API",lifespan=lifespan)#,docs_url=None,redoc_url=None )# use them for remove api testing 
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # or your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    max_age=86400,
)
app.include_router(validate.router,prefix="/api")
app.include_router(pdf.router,prefix="/api") 
app.include_router(feedback.router, prefix="/api")
app.include_router(suggestion.router, prefix="/api")  
app.include_router(scores.router,prefix="/api")
app.include_router(deleteidea.router,prefix="/api")
app.include_router(chatbot_agent.router, prefix="/api")
app.include_router(upload.router, prefix="/api") 
@app.get("/")
def root():
    return {"message": "Startup Validator Agent is running 🚀"}

@app.get("/health")
def health_check():
    return {"message": "Startup Validator Agent is running 🚀"}

@app.head("/health")
def health():
    return Response(status_code=200)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)