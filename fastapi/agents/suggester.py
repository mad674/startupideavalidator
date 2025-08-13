from langchain.prompts import PromptTemplate
from langchain.chains import LLMChain
from langchain_openai import ChatOpenAI
import os
from dotenv import load_dotenv

prompt_template = PromptTemplate.from_template("""
You are a startup coach. Based on the following scores and idea, suggest 2–3 improvements.
in structured json format, with keys "improvements" (list of suggestions) and "rationale" (explanation).
no other text needed.
Idea:
{structured_idea}

Scores:
{scores}
""")
load_dotenv()
llm = ChatOpenAI(
    model="llama3-70b-8192", 
    temperature=0.7,
    openai_api_key=os.getenv("OPENAI_API_KEY"),
    openai_api_base=os.getenv("OPENAI_API_BASE"),
)
suggester_chain = prompt_template | llm

def suggest_improvements(structured_idea, scores):
    return suggester_chain.invoke({
        "structured_idea": structured_idea,
        "scores": scores
    }).content


  # This will print the JSON response with suggestions and rationale