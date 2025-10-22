from langchain.prompts import PromptTemplate
from langchain.chains import LLMChain
from langchain_openai import ChatOpenAI
from utils.encrypt import decrypt_api_key
import os
from dotenv import load_dotenv
prompt_template = PromptTemplate.from_template("""
You're an expert startup evaluator.

Your task is to check whether the following input is a valid startup idea or not .
respond with "yes" if it is a valid startup idea, otherwise respond with "no" .
Input contains all these details:
Idea name:{name}
problem statement:{problem_statement}
solution:{solution}
target market:{target_market}
business model:{business_model}

only respond with "yes" or "no", nothing else.
""")
load_dotenv()
# validator_chain = prompt_template | llm


def validate_idea(api,idea):
    llm = ChatOpenAI(
        model=api["model_name"], 
        temperature=api["temperature"],
        openai_api_key=decrypt_api_key(api["apikey"]),
        openai_api_base=api["provider_url"],
    )
    validator_chain = prompt_template | llm
    return validator_chain.invoke({
        "name": idea.get("name", "not available"),
        "problem_statement": idea.get("problem_statement", "not available"),
        "solution": idea.get("solution", "not available"),
        "target_market": idea.get("target_market", "not available"),
        "business_model": idea.get("business_model", "not available")
    }).content.strip().lower()

