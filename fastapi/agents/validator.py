from langchain.prompts import PromptTemplate
from langchain.chains import LLMChain
from langchain_openai import ChatOpenAI
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
""")
load_dotenv()
llm = ChatOpenAI(
    model="llama3-70b-8192", 
    temperature=0.5,
    openai_api_key=os.getenv("OPENAI_API_KEY"),
    openai_api_base=os.getenv("OPENAI_API_BASE"),
)
validator_chain = prompt_template | llm


def validate_idea(idea):
    return validator_chain.invoke({
        "name": idea.get("name", "not available"),
        "problem_statement": idea.get("problem_statement", "not available"),
        "solution": idea.get("solution", "not available"),
        "target_market": idea.get("target_market", "not available"),
        "business_model": idea.get("business_model", "not available")
    }).content.strip().lower()

