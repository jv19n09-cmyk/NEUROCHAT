// Static data for Python code templates, presentation slides, and deployment guides.

export interface CodeFile {
  name: string;
  language: string;
  description: string;
  code: string;
}

export const pythonFiles: CodeFile[] = [
  {
    name: "app_single.py",
    language: "python",
    description: "Monolithic single-file Streamlit AI chatbot. Perfect for quick prototypes and zero-configuration hosting on Streamlit Community Cloud.",
    code: `import streamlit as st
import os
from google import genai
from google.genai import types

# Set page configurations
st.set_page_config(
    page_title="NeuroChat - Python AI Assistant",
    page_icon="🧠",
    layout="centered",
    initial_sidebar_state="expanded"
)

# Custom CSS for modern visual styling
st.markdown("""
<style>
    .main {
        background-color: #0b0f19;
        color: #f3f4f6;
    }
    .stSidebar {
        background-color: #111827;
        border-right: 1px solid #1f2937;
    }
    h1, h2, h3 {
        color: #60a5fa !important;
    }
    .stTextInput>div>div>input {
        background-color: #1f2937;
        color: #f3f4f6;
        border: 1px solid #374151;
    }
</style>
""", unsafe_allow_html=True)

st.title("🧠 NeuroChat")
st.write("A fully functional AI chatbot constructed entirely in Python using Streamlit & an advanced LLM backend.")

# Sidebar Configuration
st.sidebar.title("NeuroChat Control")
preset_name = st.sidebar.selectbox(
    "AI Brain Personality",
    options=["Standard AI Assistant", "Analytical Thinker", "Empathetic Buddy", "Creative Muse"],
    index=0
)

personality_presets = {
    "Standard AI Assistant": "You are NeuroChat, a helpful assistant.",
    "Analytical Thinker": "You are NeuroChat, a logical and precise solver.",
    "Empathetic Buddy": "You are NeuroChat, a supportive, gentle listener.",
    "Creative Muse": "You are NeuroChat, a highly imaginative creator."
}
system_instruction = personality_presets[preset_name]

temperature = st.sidebar.slider(
    "Temperature (Creativity)",
    min_value=0.0, max_value=2.0, value=0.7, step=0.1
)

# Initialize AI Client
api_key = os.environ.get("GEMINI_API_KEY")
if not api_key:
    st.error("Please configure GEMINI_API_KEY in secrets or env variables.")
    st.stop()

@st.cache_resource
def get_client(key):
    return genai.Client(apiKey=key)

client = get_client(api_key)

# Initialize Session Chat History
if "messages" not in st.session_state:
    st.session_state.messages = []

# Display current chat history
for message in st.session_state.messages:
    with st.chat_message(message["role"]):
        st.write(message["content"])

# User Input Box
if user_prompt := st.chat_input("Ask NeuroChat..."):
    st.session_state.messages.append({"role": "user", "content": user_prompt})
    with st.chat_message("user"):
        st.write(user_prompt)

    with st.chat_message("assistant"):
        placeholder = st.empty()
        placeholder.markdown("🧠 *Synthesizing neural response...*")
        
        try:
            # Format chat payload for AI SDK
            contents_payload = []
            for msg in st.session_state.messages:
                role_val = "model" if msg["role"] == "assistant" else "user"
                contents_payload.append(
                    types.Content(
                        role=role_val,
                        parts=[types.Part.from_text(text=msg["content"])]
                    )
                )

            # Generate reply
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=contents_payload,
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    temperature=temperature,
                )
            )
            
            ai_reply = response.text
            placeholder.markdown(ai_reply)
            st.session_state.messages.append({"role": "assistant", "content": ai_reply})
            
        except Exception as e:
            placeholder.error(f"Error: {str(e)}")`
  },
  {
    name: "backend_api.py",
    language: "python",
    description: "FastAPI-powered Python backend. Serves as a secured, high-performance API endpoint that connects to the LLM core. Perfect for production separation.",
    code: `import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from google import genai
from google.genai import types
import uvicorn

app = FastAPI(title="NeuroChat API Backend", version="1.0.0")

# CORS middleware to allow cross-origin requests from Streamlit UI
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Message(BaseModel):
    role: str
    content: str

class ChatPayload(BaseModel):
    messages: List[Message]
    system_instruction: Optional[str] = "You are NeuroChat, a robust AI assistant."
    temperature: Optional[float] = 0.7

@app.post("/api/chat")
async def chat_endpoint(payload: ChatPayload):
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="API Key is missing on the server.")
        
    try:
        client = genai.Client(apiKey=api_key)
        
        # Transform payload to modern AI SDK format
        contents_payload = []
        for msg in payload.messages:
            role_val = "model" if msg.role == "assistant" else "user"
            contents_payload.append(
                types.Content(
                    role=role_val,
                    parts=[types.Part.from_text(text=msg.content)]
                )
            )
            
        # Call AI model
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=contents_payload,
            config=types.GenerateContentConfig(
                system_instruction=payload.system_instruction,
                temperature=payload.temperature,
            )
        )
        
        return {"reply": response.text or "Error: Empty response."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("backend_api:app", host="0.0.0.0", port=port, reload=True)`
  },
  {
    name: "frontend_ui.py",
    language: "python",
    description: "Streamlit-powered client application. Provides an interactive chat experience that offloads AI thinking to the FastAPI backend. Fully decoupled and secure.",
    code: `import streamlit as st
import requests

st.set_page_config(page_title="NeuroChat UI", page_icon="🧠")
st.title("🧠 NeuroChat Client")

# Configure connection to backend API
backend_url = st.sidebar.text_input("FastAPI Server URL", value="http://localhost:8000")
personality = st.sidebar.selectbox("Brain Vibe", ["Balanced", "Deep Analyst", "Cheerleader"])

presets = {
    "Balanced": "You are a direct and helpful AI companion.",
    "Deep Analyst": "You are extremely logical, writing responses in neat code blocks and step-by-step math.",
    "Cheerleader": "You are warm, incredibly positive, encouraging the user at every turn!"
}

if "messages" not in st.session_state:
    st.session_state.messages = []

# Display logs
for m in st.session_state.messages:
    with st.chat_message(m["role"]):
        st.write(m["content"])

# Chat prompt
if prompt := st.chat_input("Communicate through FastAPI gateway..."):
    st.session_state.messages.append({"role": "user", "content": prompt})
    with st.chat_message("user"):
        st.write(prompt)
        
    with st.chat_message("assistant"):
        placeholder = st.empty()
        placeholder.markdown("📡 *Communicating with FastAPI backend...*")
        
        try:
            # Structure messages lists
            payload_messages = [{"role": msg["role"], "content": msg["content"]} for msg in st.session_state.messages]
            payload = {
                "messages": payload_messages,
                "system_instruction": presets[personality],
                "temperature": 0.7
            }
            
            res = requests.post(f"{backend_url}/api/chat", json=payload, timeout=30)
            if res.status_code == 200:
                reply = res.json().get("reply", "")
                placeholder.markdown(reply)
                st.session_state.messages.append({"role": "assistant", "content": reply})
            else:
                placeholder.error(f"Backend returned error {res.status_code}")
        except Exception as e:
            placeholder.error(f"Failed to connect to backend: {str(e)}")`
  },
  {
    name: "requirements.txt",
    language: "plaintext",
    description: "Defines Python packages needed to run monolithic or decoupled setups.",
    code: `google-genai>=0.1.0
streamlit>=1.30.0
fastapi>=0.100.0
uvicorn>=0.22.0
requests>=2.31.0
pydantic>=2.0.0`
  },
  {
    name: "README.md",
    language: "markdown",
    description: "Comprehensive local configuration, environment variable instructions, and installation scripts for showcasing NeuroChat on local systems.",
    code: `# 🧠 NeuroChat: Python AI Chatbot Setup

NeuroChat runs on pure Python using Streamlit for frontend UI and FastAPI for decoupled backend APIs.

## 🛠️ Installation Guide

1. **Virtual Environment Set Up**:
   \`\`\`bash
   python -m venv venv
   source venv/bin/activate  # macOS/Linux
   venv\\Scripts\\activate     # Windows
   \`\`\`

2. **Install Dependencies**:
   \`\`\`bash
   pip install -r requirements.txt
   \`\`\`

3. **API Key Setup**:
   \`\`\`bash
   # Linux/macOS
   export GEMINI_API_KEY="your-api-key-here"
   # Windows Command Prompt
   set GEMINI_API_KEY="your-api-key-here"
   # Windows PowerShell
   $env:GEMINI_API_KEY="your-api-key-here"
   \`\`\`

4. **Launch Application**:
   - Monolithic version: \`streamlit run app_single.py\`
   - Decoupled version: Run \`python backend_api.py\` in terminal 1, and \`streamlit run frontend_ui.py\` in terminal 2!\``
  }
];

export interface PresentationSlide {
  title: string;
  subtitle: string;
  points: string[];
  codeHighlight?: {
    file: string;
    description: string;
    snippet: string;
  };
}

export const presentationSlides: PresentationSlide[] = [
  {
    title: "1. Making AI Simple with Python",
    subtitle: "No advanced math required—just clear Python steps",
    points: [
      "Modern AI engineering is about teaching models how to behave, not building brains from scratch.",
      "Python is the friendly language we use to direct the AI and control its settings.",
      "In this short walkthrough, we will look at 10 simple steps we code in Python to create our chatbot.",
      "Every step is written in plain, human-readable Python code that anyone can understand!"
    ]
  },
  {
    title: "2. Keeping Our Secret Keys Safe",
    subtitle: "Protecting our digital keys from unauthorized eyes",
    points: [
      "To talk to the AI, we need a special password called an API key.",
      "If we write this key directly in our public code, anyone can copy it and use it.",
      "Instead, we use Python to load the key safely from a hidden vault in the system.",
      "Python checks at startup that the key is valid, preventing mistakes before we start chatting."
    ],
    codeHighlight: {
      file: "app_single.py",
      description: "Safely grabbing our secret key",
      snippet: `import os
from dotenv import load_dotenv

# Load secret files
load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    raise ValueError("Oops! The secret key is missing from the vault.")`
    }
  },
  {
    title: "3. Making the Initial Connection",
    subtitle: "Setting up our Python helper to talk to the AI",
    points: [
      "Before we ask questions, we must open a communication channel with the AI service.",
      "We use Google's official Python connector to make this connection.",
      "This acts like setting up a telephone line that handles all dialing and calling rules behind the scenes.",
      "Once established, we can send messages instantly with simple commands."
    ],
    codeHighlight: {
      file: "backend_api.py",
      description: "Setting up our connection line",
      snippet: `from google import genai

# Creating our connection channel
client = genai.Client(api_key=api_key)
print("Connected! We are ready to talk to the AI.")`
    }
  },
  {
    title: "4. Turning the AI's Creativity Dial",
    subtitle: "Adjusting settings to make the AI logical or imaginative",
    points: [
      "AI models are highly adjustable—we can tune how 'creative' or factual they are.",
      "We control this using a setting called 'temperature' inside our Python configuration.",
      "A low temperature (like 0.1) makes the AI extremely logical, consistent, and factual.",
      "A high temperature (like 1.0) lets the AI get creative, poetic, and write in varied styles."
    ],
    codeHighlight: {
      file: "backend_api.py",
      description: "Setting the creativity level",
      snippet: `from google.genai import types

# Tuning our settings
config = types.GenerateContentConfig(
    temperature=0.7,        # Balanced creativity
    max_output_tokens=800,  # Length limit
    top_p=0.95
)`
    }
  },
  {
    title: "5. Giving the AI a Persona",
    subtitle: "Instructing our AI how to act and behave before we talk to it",
    points: [
      "Without guidance, an AI might talk too much or wander off-topic.",
      "We write 'System Instructions' in Python to lock the AI into a specific job or personality.",
      "We can instruct it to 'Be a helpful math tutor' or 'Speak only in clear bullet points'.",
      "This is locked on the server so regular users cannot rewrite its core identity."
    ],
    codeHighlight: {
      file: "backend_api.py",
      description: "Giving our bot a specific identity",
      snippet: `system_instruction = """
You are NeuroChat, a helpful assistant.
Always speak clearly and write short answers.
"""
config.system_instruction = system_instruction`
    }
  },
  {
    title: "6. Asking Our First Question",
    subtitle: "How Python sends our prompt and gets a reply back",
    points: [
      "With our connection set up and our settings tuned, we are ready to ask a question.",
      "We send our user text along with our configuration settings using a single Python action.",
      "The AI processes the text on Google's cloud servers and returns a formatted response.",
      "Python automatically extracts the answer so we can show it to our user."
    ],
    codeHighlight: {
      file: "backend_api.py",
      description: "Sending a prompt",
      snippet: `response = client.models.generate_content(
    model="gemini-2.5-flash",
    contents="Explain static electricity in one simple sentence.",
    config=config
)

print("AI replied:", response.text)`
    }
  },
  {
    title: "7. Streaming Words Like Water",
    subtitle: "Typing out answers live instead of waiting in silence",
    points: [
      "Waiting for a long essay to generate can feel slow and laggy.",
      "To fix this, Python lets us stream the answer, showing words as soon as they are ready.",
      "This makes the experience feel alive—just like a human typing on the other end.",
      "We use a simple Python loop to catch and print each piece of text as it arrives."
    ],
    codeHighlight: {
      file: "app_single.py",
      description: "Streaming words dynamically",
      snippet: `response_stream = client.models.generate_content_stream(
    model="gemini-2.5-flash",
    contents="Write a quick joke about computers.",
    config=config
)

# Print each word as it arrives
for chunk in response_stream:
    print(chunk.text, end="", flush=True)`
    }
  },
  {
    title: "8. Building a Secure Receptionist",
    subtitle: "Using a backend service to keep our app safe",
    points: [
      "We don't want users talking directly to our AI server, or they might see our passwords.",
      "We use Python to build a secure backend gateway (called an API) that acts like a receptionist.",
      "The client talks to our receptionist, and our receptionist securely talks to the AI.",
      "This dual-layer setup is the golden industry standard for safety and reliability."
    ],
    codeHighlight: {
      file: "backend_api.py",
      description: "A friendly, secure receptionist",
      snippet: `from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

class ChatMessage(BaseModel):
    user_prompt: str

@app.post("/api/chat")
async def chat_receptionist(msg: ChatMessage):
    # Secret keys stay safe inside this Python function
    return {"reply": "Hello! I am safe backend code."}`
    }
  },
  {
    title: "9. Remembering What was Said",
    subtitle: "Giving the AI a memory so it understands follow-ups",
    points: [
      "Naturally, AI models have no memory. They forget everything as soon as they reply.",
      "To give them a memory, we store the chat history in a simple Python list.",
      "Every time the user asks a new question, Python sends the whole history back to the AI.",
      "This lets the AI answer follow-up questions like 'What was the first thing I asked you?'"
    ],
    codeHighlight: {
      file: "app_single.py",
      description: "Passing conversation logs",
      snippet: `chat_history = [
    {"role": "user", "parts": ["Hi, I have a cat named Oliver."]},
    {"role": "model", "parts": ["Oliver is a wonderful name!"]},
    {"role": "user", "parts": ["What was my cat's name again?"]}
]

response = client.models.generate_content(
    model="gemini-2.5-flash",
    contents=chat_history
)`
    }
  },
  {
    title: "10. Recovering from Mistakes Gracefully",
    subtitle: "Preventing crashes when the internet drops or things go wrong",
    points: [
      "In the real world, the internet drops, servers go offline, or connections timeout.",
      "A good program shouldn't crash or display messy errors to users.",
      "We wrap our AI calls in simple protective Python structures called 'try/except' blocks.",
      "If anything goes wrong, Python catches it, logs it, and gives the user a helpful, friendly message."
    ],
    codeHighlight: {
      file: "backend_api.py",
      description: "Catching errors safely",
      snippet: `try:
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents="Hello!"
    )
except Exception as e:
    # If the internet drops, print a clean backup message
    print("System offline. Please try again soon!")`
    }
  }
];

export interface DeploymentGuide {
  title: string;
  provider: string;
  badge: string;
  steps: {
    heading: string;
    details: string[];
  }[];
}

export const deploymentGuides: DeploymentGuide[] = [
  {
    title: "Deploying Monolithic App to Streamlit Community Cloud",
    provider: "Streamlit Cloud",
    badge: "100% Free • Perfect for Monoliths",
    steps: [
      {
        heading: "1. Push Code to GitHub",
        details: [
          "Create a new public or private repository on GitHub.",
          "Commit both your python monolithic script and requirements file: `app_single.py` and `requirements.txt`."
        ]
      },
      {
        heading: "2. Connect to Streamlit Cloud",
        details: [
          "Navigate to [share.streamlit.io](https://share.streamlit.io) and log in with your GitHub account.",
          "Click 'New app', select your repository, specify the branch, and set the Main file path to `app_single.py`."
        ]
      },
      {
        heading: "3. Inject Secrets securely",
        details: [
          "Before clicking deploy, open 'Advanced settings' in Streamlit Cloud.",
          "Paste your API key inside the Secrets text field in TOML format:",
          "`GEMINI_API_KEY = \"your_actual_api_key_here\"`",
          "Click 'Deploy'. Streamlit will install your dependencies automatically and serve your chat live!"
        ]
      }
    ]
  },
  {
    title: "Deploying Decoupled Server to Render.com",
    provider: "Render",
    badge: "Free Tier Available • Perfect for APIs",
    steps: [
      {
        heading: "1. Create Render Web Service",
        details: [
          "Push `backend_api.py` and `requirements.txt` to GitHub.",
          "Sign in to [Render.com](https://render.com) and create a new Web Service connecting to your GitHub repository."
        ]
      },
      {
        heading: "2. Configure Build & Start Commands",
        details: [
          "Set the Environment/Runtime to **Python**.",
          "Set the Build Command to: `pip install -r requirements.txt`",
          "Set the Start Command to: `uvicorn backend_api:app --host 0.0.0.0 --port $PORT`"
        ]
      },
      {
        heading: "3. Define Environment Variables",
        details: [
          "Navigate to the 'Environment' tab in your Render dashboard.",
          "Add a new Environment Variable with Key: `GEMINI_API_KEY` and Value: your actual secret key.",
          "Deploy! Render will host your FastAPI server and provide a public URL (e.g., `https://neurochat-api.onrender.com`). Use this URL as the backend server address in your Streamlit client!"
        ]
      }
    ]
  }
];
