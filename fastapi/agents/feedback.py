from langchain.prompts import PromptTemplate
from langchain.chains import LLMChain
from langchain_openai import ChatOpenAI
from utils.encrypt import decrypt_api_key
import os

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


feedback_prompt = PromptTemplate.from_template(prompt_template)
# feedback_chain = feedback_prompt | llm

def feedback_idea(api,structured_idea: str, scores: str):
    llm = ChatOpenAI(
        model=api["model_name"], 
        temperature=api["temperature"],
        openai_api_key=decrypt_api_key(api["apikey"]),
        openai_api_base=api["provider_url"],
    )
    feedback_chain = feedback_prompt | llm
    return feedback_chain.invoke({
        "idea": structured_idea,
        "scores": scores
    }).content
    