import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Initialize AI Client on server-side
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// API Routes
app.post("/api/chat", async (req, res) => {
  try {
    const { messages, systemInstruction, temperature } = req.body;
    
    // Map incoming message list to content structure
    const contents = messages.map((m: any) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        systemInstruction: systemInstruction || "You are NeuroChat, an advanced neural-inspired AI assistant.",
        temperature: temperature !== undefined ? Number(temperature) : 0.7,
      }
    });

    const reply = response.text || "I apologize, but I could not formulate a response at this time.";
    res.json({ reply });
  } catch (error: any) {
    console.error("Model API Error in NeuroChat:", error);
    res.status(500).json({ error: error?.message || "An error occurred while communicating with the AI model." });
  }
});

// Serve compiled Python files as a download API
app.get("/api/download/:file", (req, res) => {
  const fileName = req.params.file;
  let fileContent = "";
  let contentType = "text/plain";
  
  if (fileName === "app_single.py") {
    fileContent = getSingleFileStreamlitCode();
    contentType = "text/x-python";
  } else if (fileName === "backend_api.py") {
    fileContent = getFastAPIBackendCode();
    contentType = "text/x-python";
  } else if (fileName === "frontend_ui.py") {
    fileContent = getStreamlitFrontendCode();
    contentType = "text/x-python";
  } else if (fileName === "requirements.txt") {
    fileContent = getRequirementsCode();
    contentType = "text/plain";
  } else if (fileName === "README.md") {
    fileContent = getReadmeCode();
    contentType = "text/markdown";
  } else {
    return res.status(404).send("File not found");
  }
  
  res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);
  res.setHeader("Content-Type", contentType);
  res.send(fileContent);
});

// Vite integration
async function setupVite() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }
}

setupVite().then(() => {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});

// Python Code Assets definitions
function getSingleFileStreamlitCode(): string {
  return `import streamlit as st
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
    .sidebar .sidebar-content {
        color: #f3f4f6;
    }
    h1, h2, h3 {
        color: #60a5fa !important;
        font-family: 'Inter', sans-serif;
    }
    .stTextInput>div>div>input {
        background-color: #1f2937;
        color: #f3f4f6;
        border: 1px solid #374151;
        border-radius: 8px;
    }
    /* Style Chat bubbles */
    .stChatMessage {
        border-radius: 12px;
        padding: 10px;
        margin-bottom: 12px;
    }
</style>
""", unsafe_allow_html=True)

st.title("🧠 NeuroChat")
st.write("A fully functional AI chat application constructed entirely in Python using Streamlit & an advanced language model.")

# Sidebar Configuration
st.sidebar.title("NeuroChat Control Center")
st.sidebar.subheader("Configuration Engine")

# Mode & Personality Selection
personality_presets = {
    "Analytical Thinker": "You are NeuroChat, an extremely precise, logic-driven AI. You break down queries step-by-step with impeccable technical rigor. Use structural bullet points and concise reasoning.",
    "Empathetic Buddy": "You are NeuroChat, a warm, supportive, and compassionate conversational partner. Focus on understanding human feelings, offering words of encouragement, and conversing gently.",
    "Creative Muse": "You are NeuroChat, a boundless creative writer and innovator. You express ideas in rich, descriptive prose, metaphors, and outside-the-box suggestions. Encourage exploration.",
    "Standard AI Assistant": "You are NeuroChat, a balanced, professional, and efficient AI assistant ready to solve any task with directness and absolute clarity."
}

preset_name = st.sidebar.selectbox(
    "AI Brain Personality",
    options=list(personality_presets.keys()),
    index=3
)
system_instruction = personality_presets[preset_name]

# Creative scale
temperature = st.sidebar.slider(
    "Creative Level (Temperature)",
    min_value=0.0,
    max_value=2.0,
    value=0.7,
    step=0.1,
    help="Higher values make outputs more creative and unpredictable; lower values make them stable and factual."
)

# API Key check & override
api_key = os.environ.get("GEMINI_API_KEY")
if not api_key:
    api_key = st.sidebar.text_input(
        "Enter API Key (Optional)", 
        type="password",
        help="If not set as an environment variable, enter your API key here."
    )

st.sidebar.markdown("---")
st.sidebar.markdown("""
### 💡 Audience Showcase Guide:
1. **The Backend**: Uses a modern Python SDK.
2. **The Frontend**: Streamlit manages rendering and active session states automatically in real-time.
3. **No HTML/JS Required**: Entire stack defined in under 120 lines of pure Python!
""")

# Initialize AI Client
if not api_key:
    st.warning("⚠️ No API key detected! Please set the GEMINI_API_KEY environment variable or enter it in the sidebar.")
    st.stop()

@st.cache_resource
def get_model_client(key):
    return genai.Client(api_key=key)

client = get_model_client(api_key)

# Initialize Session Chat History
if "messages" not in st.session_state:
    st.session_state.messages = []

# Display current chat history
for message in st.session_state.messages:
    with st.chat_message(message["role"]):
        st.write(message["content"])

# User Input Box
if user_prompt := st.chat_input("Enter message for NeuroChat..."):
    # Append user message
    st.session_state.messages.append({"role": "user", "content": user_prompt})
    with st.chat_message("user"):
        st.write(user_prompt)

    # Call AI model
    with st.chat_message("assistant"):
        message_placeholder = st.empty()
        message_placeholder.markdown("🧠 *Synthesizing neural response...*")
        
        try:
            # Map chat history to structure
            contents_payload = []
            for msg in st.session_state.messages:
                role_val = "model" if msg["role"] == "assistant" else "user"
                contents_payload.append(
                    types.Content(
                        role=role_val,
                        parts=[types.Part.from_text(text=msg["content"])]
                    )
                )

            # Request generation
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=contents_payload,
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    temperature=temperature,
                )
            )
            
            ai_reply = response.text
            message_placeholder.markdown(ai_reply)
            
            # Record assistant response
            st.session_state.messages.append({"role": "assistant", "content": ai_reply})
            
        except Exception as e:
            message_placeholder.error(f"Error communicating with the model: {str(e)}")

# Clear History button
if st.sidebar.button("🧹 Clear Chat History", use_container_width=True):
    st.session_state.messages = []
    st.rerun()
`;
}

function getFastAPIBackendCode(): string {
  return `import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from google import genai
from google.genai import types
import uvicorn

app = FastAPI(
    title="NeuroChat API Backend",
    description="Python API serving the NeuroChat AI model",
    version="1.0.0"
)

# Set CORS origins for frontend-backend separation
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict this to your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize SDK Client
api_key = os.environ.get("GEMINI_API_KEY")
if not api_key:
    print("WARNING: GEMINI_API_KEY is not defined in the environment.")

def get_client() -> genai.Client:
    key = os.environ.get("GEMINI_API_KEY")
    if not key:
        raise HTTPException(status_code=500, detail="API Key is missing on the server.")
    return genai.Client(api_key=key)

# Pydantic Schemas for Validation
class Message(BaseModel):
    role: str  # 'user' or 'assistant'
    content: str

class ChatPayload(BaseModel):
    messages: List[Message]
    system_instruction: Optional[str] = "You are NeuroChat, a robust AI assistant."
    temperature: Optional[float] = 0.7

class ChatResponse(BaseModel):
    reply: str

@app.get("/")
def health_check():
    return {
        "status": "online",
        "engine": "FastAPI + AI Engine",
        "model": "gemini-2.5-flash"
    }

@app.post("/api/chat", response_model=ChatResponse)
async def chat_endpoint(payload: ChatPayload):
    try:
        client = get_client()
        
        # Transform message list to content format
        contents_payload = []
        for msg in payload.messages:
            role_val = "model" if msg.role == "assistant" else "user"
            contents_payload.append(
                types.Content(
                    role=role_val,
                    parts=[types.Part.from_text(text=msg.content)]
                )
            )
            
        # Call AI Model
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=contents_payload,
            config=types.GenerateContentConfig(
                system_instruction=payload.system_instruction,
                temperature=payload.temperature,
            )
        )
        
        reply_text = response.text or "Error: No text generated by AI."
        return ChatResponse(reply=reply_text)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI Synthesis failed: {str(e)}")

if __name__ == "__main__":
    # Get port from env (standard for cloud deployments)
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("backend_api:app", host="0.0.0.0", port=port, reload=True)
`;
}

function getStreamlitFrontendCode(): string {
  return `import streamlit as st
import requests

st.set_page_config(
    page_title="NeuroChat - Python Client",
    page_icon="🧠",
    layout="centered"
)

# Custom Styling for Dark UI
st.markdown("""
<style>
    .main { background-color: #0b0f19; color: #f3f4f6; }
    h1 { color: #60a5fa !important; }
</style>
""", unsafe_allow_html=True)

st.title("🧠 NeuroChat Frontend")
st.write("A Python-only chat UI connecting to the decoupled FastAPI backend.")

# Sidebar Controls
st.sidebar.title("NeuroChat Panel")
backend_url = st.sidebar.text_input(
    "FastAPI Server URL", 
    value="http://localhost:8000",
    help="Enter the endpoint URL of your decoupled FastAPI Python backend."
)

personality = st.sidebar.selectbox(
    "AI Vibe",
    ["Standard AI", "Logical Nerd", "Warm Motivator"]
)

system_presets = {
    "Standard AI": "You are NeuroChat, a clean, direct, and factual assistant.",
    "Logical Nerd": "You are NeuroChat, obsessed with formulas, technical accuracy, and code optimization.",
    "Warm Motivator": "You are NeuroChat, a highly positive, encouraging coach who speaks with empathy."
}

st.sidebar.markdown("---")
st.sidebar.markdown("""
### 💡 Audience Showcase Guide:
This decoupled setup separates:
1. **Frontend (Streamlit)**: Purely handles layout, user actions, and animations.
2. **Backend (FastAPI)**: Secures API keys, formats chat payloads, and queries the AI model.
""")

# Initialize Chat States
if "messages" not in st.session_state:
    st.session_state.messages = []

# Show historical chats
for msg in st.session_state.messages:
    with st.chat_message(msg["role"]):
        st.write(msg["content"])

# Send messages
if user_prompt := st.chat_input("Connect with backend neural network..."):
    # Render user prompt
    st.session_state.messages.append({"role": "user", "content": user_prompt})
    with st.chat_message("user"):
        st.write(user_prompt)
        
    # Render API response
    with st.chat_message("assistant"):
        placeholder = st.empty()
        placeholder.markdown("📡 *Sending request to FastAPI backend...*")
        
        try:
            # Map state messages for FastAPI payload structure
            messages_payload = []
            for m in st.session_state.messages:
                messages_payload.append({
                    "role": m["role"],
                    "content": m["content"]
                })
                
            payload = {
                "messages": messages_payload,
                "system_instruction": system_presets[personality],
                "temperature": 0.7
            }
            
            # Post request to FastAPI
            response = requests.post(f"{backend_url}/api/chat", json=payload, timeout=30)
            
            if response.status_code == 200:
                ai_reply = response.json().get("reply", "No reply received.")
                placeholder.markdown(ai_reply)
                st.session_state.messages.append({"role": "assistant", "content": ai_reply})
            else:
                placeholder.error(f"Backend returned error {response.status_code}: {response.text}")
                
        except Exception as e:
            placeholder.error(f"Could not connect to FastAPI server at {backend_url}. Make sure your backend API is running!\\n\\nDetail: {str(e)}")

# Clear Button
if st.sidebar.button("Sweep Terminal Logs"):
    st.session_state.messages = []
    st.rerun()
`;
}

function getRequirementsCode(): string {
  return `google-genai>=0.1.0
streamlit>=1.30.0
fastapi>=0.100.0
uvicorn>=0.22.0
requests>=2.31.0
pydantic>=2.0.0
`;
}

function getReadmeCode(): string {
  return `# 🧠 NeuroChat: A Fully Python-Only AI Chat Application

NeuroChat is built entirely using Python. It supports two different architectural options:

1. **Monolithic Design (\`app_single.py\`)**:
   - Single-file setup.
   - Streamlit manages both UI and AI backend connections.
   - Easiest for deployment and rapid prototype testing.

2. **Decoupled Architecture (\`backend_api.py\` + \`frontend_ui.py\`)**:
   - Split into FastAPI (Backend Core) and Streamlit (Client Interface).
   - Recommended for scalable applications, professional showcases, or multi-user designs.

---

## 🚀 Quick Start Guide

### Step 1: Clone or save the scripts
Download \`app_single.py\`, \`backend_api.py\`, \`frontend_ui.py\`, and \`requirements.txt\`.

### Step 2: Establish Python Environment
\`\`\`bash
# Create a virtual environment
python -m venv venv

# Activate Virtual Environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
venv\\Scripts\\activate

# Install dependencies
pip install -r requirements.txt
\`\`\`

### Step 3: Secure Your API Key
Export your API Key in your terminal:
\`\`\`bash
# On macOS/Linux:
export GEMINI_API_KEY="your_api_key_here"

# On Windows (Command Prompt):
set GEMINI_API_KEY="your_api_key_here"

# On Windows (PowerShell):
$env:GEMINI_API_KEY="your_api_key_here"
\`\`\`

### Step 4: Launch Applications

#### Option A: Running the Monolithic App
\`\`\`bash
streamlit run app_single.py
\`\`\`
The application will open automatically at \`http://localhost:8501\`.

#### Option B: Running Decoupled Architecture
First, start the FastAPI Backend:
\`\`\`bash
python backend_api.py
\`\`\`
The backend launches on \`http://localhost:8000\`. Check the API docs at \`http://localhost:8000/docs\`.

Next, in a separate terminal (with venv activated), run the Streamlit UI:
\`\`\`bash
streamlit run frontend_ui.py
\`\`\`
It launches at \`http://localhost:8501\` and targets the FastAPI server URL!
`;
}
