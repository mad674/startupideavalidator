# idea validate api
from fastapi import APIRouter, Request
from pydantic import BaseModel
# from agents.clarifier import clarify_idea
# from agents.scorer import ScorerAgent
# from agents.suggester import suggest_improvements
from chains.validator import ValidatorAgent
# from memory.memory_store import MemoryStore
import json
router = APIRouter()
# memory = MemoryStore()
# ScorerAgent=ScorerAgent()

class ValidateRequest(BaseModel):
    user_id: str
    name: str
    problem_statement: str
    solution: str
    target_market: str
    business_model: str
    team: str
    api: dict

@router.post("/validate")
def validate(request: ValidateRequest):
    
    Validator_Agent = ValidatorAgent(request.api)
    data={
        "name": request.name if request.name else "No Idea Provided",
        "problem_statement": request.problem_statement if request.problem_statement else "No Problem Statement Provided",
        "solution": request.solution if request.solution else "No Solution Provided",
        "target_market": request.target_market if request.target_market else "No Target Market Provided",
        "business_model": request.business_model if request.business_model else "No Business Model Provided",
        "team": request.team   if request.team else "No Team Provided",
    }
    result=Validator_Agent.validate_idea(data)
    # print("Validation result:", result)
    if "no" == result:
        return {
            # "res":validate_idea(data),
            "success": False,
            "response": "❌ That doesn't seem like a startup idea. Please try again with a business or product idea."
        }
    # scores = score_idea(data)
    # suggestions = suggest_improvements(data, scores)
    # memory.store_idea(
    #     request.user_id,
    #     request.idea_id,
    #     data,
    #     data["name"],
    #     # scores,
    #     # suggestions
    # )
    return {
        "success": True,
        "response": "✅ That looks like a startup idea!",
        # "res":validate_idea(data),
        # "idea_id": idea_id,
        # "structured": data,
        # "scores": json.loads(scores),
        # "suggestions": json.loads(suggestions)
    }

