"""
LangChain integration example for AgentID Python SDK.

This example shows how to use AgentID with LangChain agents
to automatically include credentials in tool calls.
"""


def callback_example():
    """Example using AgentIDCallback with LangChain agents."""
    print("=== LangChain Callback Example ===\n")

    code = '''
from langchain.agents import create_react_agent, AgentExecutor
from langchain_openai import ChatOpenAI
from langchain.tools import Tool
from langchain import hub
from agentid.integrations.langchain import AgentIDCallback

# Create your tools
def search_api(query: str) -> str:
    """Search an external API."""
    # This request will include AgentID headers automatically
    import httpx
    response = httpx.get(
        "https://api.example.com/search",
        params={"q": query},
    )
    return response.text

tools = [
    Tool(
        name="search",
        func=search_api,
        description="Search for information",
    ),
]

# Create agent
llm = ChatOpenAI(model="gpt-4")
prompt = hub.pull("hwchase17/react")
agent = create_react_agent(llm, tools, prompt)
executor = AgentExecutor(agent=agent, tools=tools)

# Run with AgentID callback
result = executor.invoke(
    {"input": "Search for AI agent frameworks"},
    config={"callbacks": [AgentIDCallback("cred_xxx")]},
)
print(result["output"])
'''
    print(code)


def tools_example():
    """Example using AgentID tools in LangChain."""
    print("\n=== LangChain Tools Example ===\n")

    code = '''
from langchain.agents import create_react_agent, AgentExecutor
from langchain_openai import ChatOpenAI
from langchain import hub
from agentid.integrations.langchain import (
    create_credential_tool,
    create_verification_tool,
)

# Create AgentID tools
credential_tool = create_credential_tool("cred_xxx")
verification_tool = create_verification_tool()

tools = [
    credential_tool,      # Lets agent present its own credential
    verification_tool,    # Lets agent verify other agents
    # ...your other tools...
]

# Create agent with these tools
llm = ChatOpenAI(model="gpt-4")
prompt = hub.pull("hwchase17/react")
agent = create_react_agent(llm, tools, prompt)
executor = AgentExecutor(agent=agent, tools=tools)

# The agent can now:
# 1. Present its credential when asked
# 2. Verify credentials of other agents it interacts with

result = executor.invoke({
    "input": "What is my credential information?"
})
print(result["output"])
# Output: Agent: MyBot (agent_123)
#         Issuer: Acme Corp
#         Valid until: 2025-12-31...
'''
    print(code)


def decorator_example():
    """Example using the @with_agentid decorator."""
    print("\n=== Decorator Example ===\n")

    code = '''
from langchain.tools import tool
from agentid.integrations.langchain import with_agentid
import httpx

@tool
@with_agentid("cred_xxx")
def fetch_data(url: str) -> str:
    """Fetch data from a URL with AgentID credentials."""
    # The decorator ensures credential is loaded
    # You still need to add headers manually in this pattern
    response = httpx.get(url)
    return response.text

# Better approach: Use AgentIDCallback instead
# The callback handles header injection automatically
'''
    print(code)


def multi_agent_example():
    """Example of agents verifying each other."""
    print("\n=== Multi-Agent Verification Example ===\n")

    code = '''
"""
Scenario: Agent A needs to call Agent B's API.
Both agents verify each other's credentials.
"""

from agentid import AgentCredential, CredentialVerifier

# Agent A's perspective
class AgentA:
    def __init__(self):
        self.credential = AgentCredential("cred_agent_a")
        self.verifier = CredentialVerifier()

    async def call_agent_b(self, task: str):
        # Make request to Agent B with our credential
        response = await self.credential.request_async(
            "https://agent-b.example.com/api/task",
            method="POST",
            json={"task": task},
        )

        # Verify Agent B's credential from response
        agent_b_cred = response.headers.get("X-AgentID-Credential")
        if agent_b_cred:
            result = self.verifier.verify_credential(agent_b_cred)
            if result.valid and result.trust_score >= 70:
                print(f"Verified Agent B: {result.credential.agent_name}")
                return response.json()
            else:
                raise Exception("Agent B verification failed")

        return response.json()


# Agent B's perspective (the service)
from fastapi import FastAPI, Request, HTTPException
from agentid import CredentialVerifier

app = FastAPI()
verifier = CredentialVerifier()
our_credential = AgentCredential("cred_agent_b")

@app.post("/api/task")
async def handle_task(request: Request):
    # Verify Agent A
    result = verifier.verify_request(
        headers=dict(request.headers),
        method="POST",
        url=str(request.url),
    )

    if not result.valid:
        raise HTTPException(401, "Invalid credential")

    if result.trust_score < 50:
        raise HTTPException(403, "Insufficient trust score")

    # Process the task
    body = await request.json()
    response_data = {"result": f"Processed: {body['task']}"}

    # Include our credential in response for mutual verification
    headers = our_credential.get_headers("POST", str(request.url))

    return Response(
        content=json.dumps(response_data),
        headers=headers,
    )
'''
    print(code)


if __name__ == "__main__":
    callback_example()
    tools_example()
    decorator_example()
    multi_agent_example()
