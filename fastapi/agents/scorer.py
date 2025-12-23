from langchain.prompts import PromptTemplate
from langchain.chains import LLMChain
from langchain_openai import ChatOpenAI
from utils.encrypt import Decryptor
import os

prompt_template = PromptTemplate.from_template("""
You are a specialist startup evaluator. 

Given the following startup idea, evaluate it and return a JSON with:

- Technical Feasibility (score 1-5, be strict)
- Market Size (score 1-5, be strict)
- Revenue Model (score 1-5, be strict)
- Uniqueness (score 1-5, be strict)
- Team Strength (score 1-5, be strict)

Also calculate:
- Average Score
- Overall Viability: "Low" if average ≤ 2.4, "Moderate" if 2.5–3.4, "High" if ≥ 3.5.

IN JSON FORMAT OUTPUT SHOULD BE NOT in string format.
example:
{{
    "Technical Feasibility": 3.1,
    "Market Size": 4,
    "Revenue Model": 4.2,
    "Uniqueness": 4,
    "Team Strength": 4,
    "Average Score": 4.5,
    "Overall Viability": "High"
}}

GIVE ME ONLY THIS TYPE OF OUTPUT NOT ANY STRING TEXT.
Be realistic and conservative with scores. Do not inflate ratings.
don't explain your reasoning, just return the JSON structure. no other text needed. 
Startup Idea:
{structured_idea}
""")

Decryptor=Decryptor()
# scorer_chain = prompt_template | llm

class ScorerAgent:
    def __init__(self, api):
        self.llm = ChatOpenAI(
            model=api["model_name"], 
            temperature=api["temperature"],
            openai_api_key=Decryptor.decrypt_api_key(api["apikey"]),
            openai_api_base=api["provider_url"],
        )
        self.scorer_chain = prompt_template | self.llm

    def score_idea(self, structured_idea: str):
        return self.scorer_chain.invoke({
            "structured_idea": structured_idea
        }).content


