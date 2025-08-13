from langchain.prompts import PromptTemplate
from langchain.chains import LLMChain
from langchain_openai import ChatOpenAI
import os
from dotenv import load_dotenv

prompt_template = """
You're an AI startup advisor.

A user has submitted an idea. Analyze it and provide constructive, detailed feedback highlighting strengths, weaknesses, and potential improvements. 

- The feedback must be in 2 to 3 paragraphs.
- Each paragraph should be 3 to 4 lines long.
- Do not include suggestions or action steps, only observations and insights.

This is the idea:
"{idea}"

These are the scores:
"{scores}"

Respond ONLY in valid JSON format:
{{
  "feedbacks": [
    "paragraph 1",
    "paragraph 2",
    "paragraph 3"
  ]
}}
"""

load_dotenv()
llm = ChatOpenAI(
    model="llama3-70b-8192", 
    temperature=0.6,
    openai_api_key=os.getenv("OPENAI_API_KEY"),
    openai_api_base=os.getenv("OPENAI_API_BASE"),
)
feedback_prompt = PromptTemplate.from_template(prompt_template)
feedback_chain = feedback_prompt | llm

def feedback_idea(structured_idea: str, scores: str):
    return feedback_chain.invoke({
        "idea": structured_idea,
        "scores": scores
    }).content
    