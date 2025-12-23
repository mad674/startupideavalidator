import json
from langchain.prompts import PromptTemplate
from langchain_openai import ChatOpenAI
from utils.encrypt import Decryptor

prompt_template = PromptTemplate.from_template("""
You are a startup coach. Based on the following scores and idea, suggest 2–3 improvements .
Return ONLY valid JSON, no explanations, no markdown, no text outside JSON.
- Attrative content is key. Make it easy to read and understand.
Each improvement and rationale should be **2–3 sentences long** (detailed, not short phrases).

Format:
{{
  "improvements": [
    "detailed suggestion 1",
    "detailed suggestion 2"
  ],
  "rationale": [
    "detailed reason 1",
    "detailed reason 2"
  ]
}}

Idea:
{structured_idea}

Scores:
{scores}
""")

Decryptor=Decryptor()

class SuggesterAgent:
    def __init__(self, api):
        self.llm = ChatOpenAI(
            model=api["model_name"], 
            temperature=api["temperature"],
            openai_api_key=Decryptor.decrypt_api_key(api["apikey"]),
            openai_api_base=api["provider_url"],
        )
        self.suggester_chain = prompt_template | self.llm

    def suggest_improvements(self, structured_idea: str, scores: str):
        return self.suggester_chain.invoke({
            "structured_idea": structured_idea,
            "scores": scores
        }).content
