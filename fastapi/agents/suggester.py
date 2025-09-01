import json
from langchain.prompts import PromptTemplate
from langchain_openai import ChatOpenAI
from utils.encrypt import decrypt_api_key

prompt_template = PromptTemplate.from_template("""
You are a startup coach. Based on the following scores and idea, suggest 2–3 improvements .
Return ONLY valid JSON, no explanations, no markdown, no text outside JSON.
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

def suggest_improvements(api, structured_idea, scores):
    llm = ChatOpenAI(
        model=api["model_name"], 
        temperature=api["temperature"],
        openai_api_key=decrypt_api_key(api["apikey"]),
        openai_api_base=api["provider_url"],
    )
    suggester_chain = prompt_template | llm

    return suggester_chain.invoke({
        "structured_idea": structured_idea,
        "scores": scores
    }).content
