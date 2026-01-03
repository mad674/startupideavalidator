from langchain.prompts import PromptTemplate
from langchain.chains import LLMChain
from langchain_openai import ChatOpenAI
from utils.encrypt import Decryptor
import os

prompt_template = """
You're an AI startup advisor.

A user has submitted an idea. Analyze it and provide constructive, detailed feedback highlighting strengths, weaknesses, and potential improvements. 

- The feedback must be in 2 to 3 paragraphs.
- Each paragraph should be 3 to 4 lines long.
- Do not include suggestions or action steps, only observations and insights.
- Attrative content is key. Make it easy to read and understand.
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

Decryptor=Decryptor()
feedback_prompt = PromptTemplate.from_template(prompt_template)
# feedback_chain = feedback_prompt | llm

class FeedbackAgent:
    def __init__(self, api):
        self.llm = ChatOpenAI(
            model=api["model_name"], 
            temperature=api["temperature"],
            openai_api_key=Decryptor.decrypt_api_key(api["apikey"]),
            openai_api_base=api["provider_url"],
        )
        self.feedback_chain = feedback_prompt | self.llm

    def get_feedback(self, structured_idea: str, scores: str):
        return self.feedback_chain.invoke({
            "idea": structured_idea,
            "scores": scores
        }).content
