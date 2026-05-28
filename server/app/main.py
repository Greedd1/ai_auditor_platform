from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uuid

# Import your graph directly
from app.agents.graph import app_graph 

app = FastAPI(title="AI Smart Contract Auditor API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AuditRequest(BaseModel):
    source_code: str = None
    contract_address: str = None

@app.post("/api/audit")
async def start_audit(request: AuditRequest):
    if not request.source_code:
        raise HTTPException(status_code=400, detail="Must provide code.")
    
    # Run the AI workflow synchronously and wait for Gemini to finish
    initial_state = {
        "source_code": request.source_code,
        "vulnerabilities": [],
        "gas_optimizations": [],
        "final_report": ""
    }
    
    final_state = app_graph.invoke(initial_state)
    
    # Return the exact lists to the frontend
    return {
        "vulnerabilities": final_state.get("vulnerabilities", []),
        "gas_optimizations": final_state.get("gas_optimizations", [])
    }