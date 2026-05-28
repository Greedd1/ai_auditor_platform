import os
from typing import TypedDict, List
from pydantic import BaseModel, Field
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langgraph.graph import StateGraph, END
from dotenv import load_dotenv

# Load API keys from your .env file
load_dotenv()

# Connect to Gemini 1.5 Pro
llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0.0)
# 1. Define the Graph State
class AuditState(TypedDict):
    source_code: str
    vulnerabilities: List[str]
    gas_optimizations: List[str]
    final_report: str

# 2. Force the AI to output exact JSON structures (Pydantic Models)
class SecurityOutput(BaseModel):
    vulnerabilities: List[str] = Field(description="List of critical and medium vulnerabilities found.")

class GasOutput(BaseModel):
    optimizations: List[str] = Field(description="List of specific EVM gas optimization techniques.")

# 3. Build the Security Agent
def security_agent(state: AuditState):
    print("Agent 1: Scanning for Security Vulnerabilities...")
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", "You are an elite Smart Contract Security Auditor. Analyze the provided Solidity code for reentrancy, integer overflows, access control flaws, and oracle manipulation. Be ruthless and precise."),
        ("human", "Audit this code:\n\n{code}")
    ])
    
    chain = prompt | llm.with_structured_output(SecurityOutput)
    response = chain.invoke({"code": state["source_code"]})
    
    return {"vulnerabilities": response.vulnerabilities}

# 4. Build the Gas Agent
def gas_agent(state: AuditState):
    print("Agent 2: Scanning for Gas Optimizations...")
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", "You are an EVM Gas Optimization expert. Find ways to reduce deployment and runtime gas costs (e.g., packing variables, memory vs storage, caching loops)."),
        ("human", "Optimize this code:\n\n{code}")
    ])
    
    chain = prompt | llm.with_structured_output(GasOutput)
    response = chain.invoke({"code": state["source_code"]})
    
    return {"gas_optimizations": response.optimizations}

# 5. Build the Editor Agent
def editor_agent(state: AuditState):
    print("Agent 3: Compiling Final Audit Report...")
    report = {
        "critical_vulnerabilities": state["vulnerabilities"],
        "gas_optimizations": state["gas_optimizations"],
        "status": "Audit Complete"
    }
    return {"final_report": str(report)}

# 6. Wire the Graph Together
workflow = StateGraph(AuditState)
workflow.add_node("security", security_agent)
workflow.add_node("gas", gas_agent)
workflow.add_node("editor", editor_agent)

workflow.set_entry_point("security")
workflow.add_edge("security", "gas")
workflow.add_edge("gas", "editor")
workflow.add_edge("editor", END)

# THIS IS THE VARIABLE UVICORN IS LOOKING FOR:
app_graph = workflow.compile()