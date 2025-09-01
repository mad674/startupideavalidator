from langchain.prompts import PromptTemplate
from langchain.chains import LLMChain
from langchain_openai import ChatOpenAI
from utils.encrypt import decrypt_api_key
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

Be realistic and conservative with scores. Do not inflate ratings.
don't explain your reasoning, just return the JSON structure. no other text needed. 
Startup Idea:
{structured_idea}
""")


# scorer_chain = prompt_template | llm

def score_idea(api,structured_idea):
    llm = ChatOpenAI(
        model=api["model_name"], 
        temperature=api["temperature"],
        openai_api_key=decrypt_api_key(api["apikey"]),
        openai_api_base=api["provider_url"],
    )
    scorer_chain = prompt_template | llm
    return scorer_chain.invoke({"structured_idea": structured_idea}).content


