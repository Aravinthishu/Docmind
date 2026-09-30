from decouple import config
from groq import Groq

from .retrieval import retrieve

GROQ_API_KEY = config('GROQ_API_KEY')
HISTORY_TURNS = 4


def build_system_prompt(chunks, bot_name):
    if chunks:
        context = "\n\n".join(f"[{i + 1}] {c}" for i, c in enumerate(chunks))
    else:
        context = "No relevant information found."

    return f"""You are {bot_name}, a helpful support assistant. Answer the user's question using ONLY the context below. If the answer isn't in the context, say you don't have that information and suggest contacting support. Keep answers concise.

Context:
{context}"""


def generate_answer(organization, query, history=None):
    """
    history: ChatLog rows (oldest first) from the same session.
    Returns (answer_text, source_filenames).
    """
    history = history or []

    # follow-ups like "and how much is it?" need the previous question to retrieve well
    retrieval_query = f"{history[-1].question} {query}" if history else query

    results = retrieve(organization, retrieval_query)
    chunks = [r['text'] for r in results]
    sources = list(dict.fromkeys(r['filename'] for r in results if r['filename']))

    bot_name = organization.widget_config.bot_name
    messages = [{"role": "system", "content": build_system_prompt(chunks, bot_name)}]
    for log in history:
        messages.append({"role": "user", "content": log.question})
        messages.append({"role": "assistant", "content": log.answer})
    messages.append({"role": "user", "content": query})

    client = Groq(api_key=GROQ_API_KEY)
    response = client.chat.completions.create(
        model="openai/gpt-oss-20b",
        messages=messages,
        temperature=0.2,
    )
    return response.choices[0].message.content, sources