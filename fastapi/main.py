from fastapi import FastAPI
# from fastapi.routes import feedback, suggestion
from routes import chatbot, validate,pdf,feedback,suggestion,scores,deleteidea
from fastapi.middleware.cors import CORSMiddleware


app = FastAPI(title="Startup Idea Validator API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # or your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(validate.router,prefix="/api")
# app.include_router(pdf.router,prefix="/api")
# app.include_router(chatbot.router,prefix="/api")  
app.include_router(feedback.router, prefix="/api")
app.include_router(suggestion.router, prefix="/api")  
app.include_router(scores.router,prefix="/api")
app.include_router(deleteidea.router,prefix="/api")
@app.get("/")
def root():
    return {"message": "Startup Validator Backend is running 🚀"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)