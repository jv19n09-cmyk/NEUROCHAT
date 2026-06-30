import React, { useState, useRef, useEffect } from "react";
import { 
  Brain, 
  Terminal, 
  Cpu, 
  Database, 
  Play, 
  Copy, 
  Check, 
  Download, 
  Sparkles, 
  Send, 
  Trash2, 
  ChevronRight, 
  ChevronLeft, 
  BookOpen, 
  Layers, 
  ArrowUpRight, 
  HelpCircle,
  FileCode,
  CheckCircle,
  Server,
  Users
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { pythonFiles, presentationSlides, CodeFile } from "./data";

export default function App() {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<"playground" | "code" | "slides" | "team">("playground");
  
  // Interactive Live Chat Simulator States
  const [chatMessages, setChatMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([
    { role: "assistant", content: "Welcome! I am NeuroChat, your local assistant interface. Feel free to choose a prompt preset from the sidebar config or send a message to test this pipeline." }
  ]);
  const [userInput, setUserInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [activePreset, setActivePreset] = useState<"standard" | "analyst" | "empathetic" | "creative">("standard");
  const [temperature, setTemperature] = useState(0.7);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Code Explorer States
  const [selectedFile, setSelectedFile] = useState<CodeFile>(pythonFiles[0]);
  const [copiedFile, setCopiedFile] = useState<string | null>(null);

  // Slide Deck States
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  // Presets configuration descriptions
  const presets = {
    standard: {
      name: "Standard Assistant",
      prompt: "You are NeuroChat, a balanced, professional, and efficient AI assistant ready to solve any task with directness and absolute clarity.",
      vibe: "Direct & Helpful",
      color: "border-blue-500/30 text-blue-400"
    },
    analyst: {
      name: "Analytical Thinker",
      prompt: "You are NeuroChat, an extremely precise, logic-driven AI. You break down queries step-by-step with impeccable technical rigor. Use structural bullet points and concise reasoning.",
      vibe: "Structured & Precise",
      color: "border-purple-500/30 text-purple-400"
    },
    empathetic: {
      name: "Empathetic Buddy",
      prompt: "You are NeuroChat, a warm, supportive, and compassionate conversational partner. Focus on understanding human feelings, offering words of encouragement, and conversing gently.",
      vibe: "Warm & Caring",
      color: "border-emerald-500/30 text-emerald-400"
    },
    creative: {
      name: "Creative Muse",
      prompt: "You are NeuroChat, a boundless creative writer and innovator. You express ideas in rich, descriptive prose, metaphors, and outside-the-box suggestions. Encourage exploration.",
      vibe: "Imaginative & Expressive",
      color: "border-amber-500/30 text-amber-400"
    }
  };

  // Scroll to bottom of chat
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, isTyping]);

  // Handle message sending to backend
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!userInput.trim() || isTyping) return;

    const userMsg = userInput.trim();
    setUserInput("");
    setChatMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setIsTyping(true);

    try {
      const payloadMessages = [...chatMessages, { role: "user", content: userMsg }].map(m => ({
        role: m.role,
        content: m.content
      }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: payloadMessages,
          systemInstruction: presets[activePreset].prompt,
          temperature: temperature
        })
      });

      if (!res.ok) {
        throw new Error("Server returned an error");
      }

      const data = await res.json();
      setChatMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
    } catch (err) {
      console.error(err);
      setChatMessages(prev => [...prev, { 
        role: "assistant", 
        content: "Connection error: Unable to reach the backend API. Please verify that your server is running and the backend environment variables are configured correctly." 
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  // Copy code utility
  const handleCopyCode = (code: string, fileName: string) => {
    navigator.clipboard.writeText(code);
    setCopiedFile(fileName);
    setTimeout(() => setCopiedFile(null), 2000);
  };

  // Trigger file download
  const handleDownloadFile = (fileName: string) => {
    window.open(`/api/download/${fileName}`, "_blank");
  };

  // Render highlighted segments (simple customized regex-based syntax highlight representation)
  const renderHighlightedCode = (code: string, language: string) => {
    if (language !== "python" && language !== "plaintext" && language !== "markdown") {
      return <span>{code}</span>;
    }

    const lines = code.split("\n");
    return lines.map((line, i) => {
      // Very basic Python color coding for high-fidelity code rendering
      if (language === "python") {
        const keywordRegex = /^(import|from|def|return|if|for|in|not|is|and|or|as|with|class|elif|else|try|except|importTypes):?\b/g;
        const commentRegex = /(#.*)$/g;
        const stringRegex = /("(.*?)"|'(.*?)')/g;
        const decoratorRegex = /(@st\.\w+)/g;
        const functionCallRegex = /(\w+)(?=\()/g;

        let processedLine = line
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;");

        // Simple replacements
        processedLine = processedLine.replace(keywordRegex, '<span class="text-pink-400 font-semibold">$1</span>');
        processedLine = processedLine.replace(decoratorRegex, '<span class="text-amber-400">$1</span>');
        
        // Return structured lines
        return (
          <div key={i} className="table-row hover:bg-slate-800/30">
            <span className="table-cell text-right pr-4 text-slate-600 font-mono text-xs select-none w-8 border-r border-slate-800/40">{i + 1}</span>
            <span className="table-cell pl-4 font-mono text-slate-300 text-sm whitespace-pre" dangerouslySetInnerHTML={{ __html: processedLine || " " }} />
          </div>
        );
      }

      // Plaintext or markdown defaults
      return (
        <div key={i} className="table-row hover:bg-slate-800/30">
          <span className="table-cell text-right pr-4 text-slate-600 font-mono text-xs select-none w-8 border-r border-slate-800/40">{i + 1}</span>
          <span className="table-cell pl-4 font-mono text-slate-300 text-sm whitespace-pre">{line || " "}</span>
        </div>
      );
    });
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 font-sans flex flex-col relative overflow-hidden selection:bg-teal-500/20 selection:text-teal-200" id="main-container">
      {/* Immersive Theme Ambient Background Glows */}
      <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] bg-blue-600 rounded-full blur-[140px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] bg-teal-600 rounded-full blur-[140px]"></div>
      </div>

      {/* Dynamic Header */}
      <header className="bg-slate-900/40 backdrop-blur-md border-b border-slate-800/60 sticky top-0 z-50 px-8 py-5 flex flex-col md:flex-row gap-4 items-center justify-between relative" id="app-header">
        <div className="flex items-center gap-4">
          <div className="bg-gradient-to-tr from-blue-500 to-teal-500 p-2.5 rounded-xl shadow-lg shadow-teal-500/10 animate-pulse" id="header-logo-container">
            <Brain className="w-6 h-6 text-slate-950" id="header-logo-icon" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-extrabold tracking-tighter text-white" id="header-app-title">
                NEURO<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-400 font-black">CHAT</span>
              </h1>
              <div className="px-2 py-0.5 bg-teal-500/10 border border-teal-500/30 rounded text-teal-400 text-[10px] font-mono">v4.0.2 Stable</div>
            </div>
            <p className="text-xs text-slate-400 font-mono tracking-wider uppercase mt-1" id="header-app-subtitle">Streamlit & FastAPI Chat Boilerplate</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex bg-slate-950/60 p-1.5 rounded-xl border border-slate-800/80 backdrop-blur-sm" id="header-nav">
          <button
            onClick={() => setActiveTab("playground")}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-mono tracking-wide uppercase rounded-lg transition-all duration-300 ${activeTab === "playground" ? "bg-gradient-to-r from-blue-500/20 to-teal-500/20 border border-teal-500/30 text-teal-400 shadow-lg shadow-teal-500/5 font-bold" : "text-slate-400 hover:text-slate-200"}`}
            id="tab-playground"
          >
            <Play className="w-3.5 h-3.5" />
            Playground
          </button>
          <button
            onClick={() => setActiveTab("code")}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-mono tracking-wide uppercase rounded-lg transition-all duration-300 ${activeTab === "code" ? "bg-gradient-to-r from-blue-500/20 to-teal-500/20 border border-teal-500/30 text-teal-400 shadow-lg shadow-teal-500/5 font-bold" : "text-slate-400 hover:text-slate-200"}`}
            id="tab-code"
          >
            <Terminal className="w-3.5 h-3.5" />
            Code Workspace
          </button>
          <button
            onClick={() => setActiveTab("slides")}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-mono tracking-wide uppercase rounded-lg transition-all duration-300 ${activeTab === "slides" ? "bg-gradient-to-r from-blue-500/20 to-teal-500/20 border border-teal-500/30 text-teal-400 shadow-lg shadow-teal-500/5 font-bold" : "text-slate-400 hover:text-slate-200"}`}
            id="tab-slides"
          >
            <BookOpen className="w-3.5 h-3.5" />
            Slide Deck
          </button>
          <button
            onClick={() => setActiveTab("team")}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-mono tracking-wide uppercase rounded-lg transition-all duration-300 ${activeTab === "team" ? "bg-gradient-to-r from-blue-500/20 to-teal-500/20 border border-teal-500/30 text-teal-400 shadow-lg shadow-teal-500/5 font-bold" : "text-slate-400 hover:text-slate-200"}`}
            id="tab-team"
          >
            <Users className="w-3.5 h-3.5" />
            Our Team
          </button>
        </nav>
      </header>

      {/* Main Container Content */}
      <main className="flex-grow max-w-7xl w-full mx-auto p-8 flex flex-col justify-center relative z-10" id="main-content-wrapper">
        <AnimatePresence mode="wait">
          
          {/* TAB 1: PLAYGROUND */}
          {activeTab === "playground" && (
            <motion.div
              key="playground"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full h-[calc(100vh-210px)] min-h-[550px]"
              id="playground-view"
            >
              {/* Sidebar Settings Panel */}
              <div className="lg:col-span-4 bg-slate-900/50 border border-slate-800/60 rounded-2xl p-6 flex flex-col justify-between overflow-y-auto shadow-2xl backdrop-blur-sm" id="playground-sidebar">
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center gap-2 text-teal-400 mb-1">
                      <Cpu className="w-4 h-4 text-blue-400" />
                      <h2 className="text-sm font-bold tracking-wider uppercase text-white font-mono">Model Parameters</h2>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">Configure system prompts and parameters in real-time to test pipeline responses.</p>
                  </div>

                  {/* Personality Selectors */}
                  <div className="space-y-2.5">
                    <label className="text-xs font-semibold text-slate-300 font-mono uppercase tracking-wider">System Prompt Preset</label>
                    <div className="grid grid-cols-2 gap-2.5" id="personality-grid">
                      {(Object.keys(presets) as Array<keyof typeof presets>).map((key) => {
                        const active = activePreset === key;
                        return (
                          <button
                            key={key}
                            onClick={() => setActivePreset(key)}
                            className={`p-3 text-left rounded-xl border transition-all duration-300 flex flex-col gap-1 ${
                              active 
                                ? "bg-gradient-to-br from-blue-600/20 to-teal-600/20 border-teal-500/50 shadow-md shadow-teal-500/5 text-teal-300 font-bold" 
                                : "bg-slate-950/40 border-slate-800/80 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                            }`}
                          >
                            <span className="text-xs font-semibold">{presets[key].name}</span>
                            <span className="text-[10px] opacity-80 font-mono">{presets[key].vibe}</span>
                          </button>
                        );
                      })}
                    </div>
                    {/* Prompt Box */}
                    <div className="bg-slate-950/50 border border-slate-850 rounded-xl p-3 mt-2.5">
                      <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider block mb-1">Active System Instruction</span>
                      <p className="text-xs text-slate-400 italic line-clamp-3 leading-relaxed">"{presets[activePreset].prompt}"</p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-800/60 pt-5 mt-6 space-y-4">
                  <button
                    onClick={() => {
                      setChatMessages([
                        { role: "assistant", content: `History cleared. Chat container initialized with the ${presets[activePreset].name} system instruction.` }
                      ]);
                    }}
                    className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 py-2.5 rounded-xl text-xs font-medium flex items-center justify-center gap-2 transition-all duration-300 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Clear Emulator History
                  </button>
                </div>
              </div>

              {/* Chat Interface */}
              <div className="lg:col-span-8 bg-slate-900/50 border border-slate-800/60 rounded-2xl flex flex-col overflow-hidden h-full shadow-2xl backdrop-blur-sm" id="playground-chat-container">
                {/* Chat Header */}
                <div className="px-5 py-4 border-b border-slate-800 bg-slate-950/40 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-teal-500"></span>
                    </span>
                    <div className="flex flex-col">
                      <span className="text-xs font-mono text-slate-300 font-bold uppercase tracking-widest">Neural Connection Active</span>
                      <span className="text-[10px] text-slate-400 mt-0.5">
                        Status: <span className="text-teal-400 font-semibold font-mono">Ready & Connected</span>
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-850 px-3 py-1 rounded-lg">
                    <Database className="w-3.5 h-3.5 text-blue-400" />
                    <span className="text-[10px] font-mono text-slate-400">Model: neuro-flash-v4</span>
                  </div>
                </div>

                {/* Messages Panel */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-950/10">
                  {chatMessages.map((msg, index) => (
                    <div
                      key={index}
                      className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div className={`flex gap-3 max-w-[85%] ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          msg.role === "user" 
                            ? "bg-slate-850 border border-slate-700/30 text-slate-300" 
                            : "bg-gradient-to-tr from-blue-500 to-teal-500 text-slate-950 shadow-md shadow-teal-500/10"
                        }`}>
                          {msg.role === "user" ? <Terminal className="w-4 h-4" /> : <Brain className="w-4.5 h-4.5" />}
                        </div>
                        <div className={`p-3.5 rounded-2xl text-sm leading-relaxed ${
                          msg.role === "user"
                            ? "bg-slate-800/50 text-slate-100 rounded-tr-none border border-slate-700/30 shadow-lg"
                            : "bg-slate-900/80 text-slate-100 rounded-tl-none border border-slate-800 shadow-lg"
                        }`}>
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Active Typing State */}
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="flex gap-3 max-w-[85%] flex-row">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-500 to-teal-500 text-slate-950 flex items-center justify-center shrink-0 shadow-md shadow-teal-500/10 animate-pulse">
                          <Brain className="w-4.5 h-4.5" />
                        </div>
                        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl rounded-tl-none flex items-center gap-2 text-xs text-slate-400 italic">
                          <span>Synthesizing neural pathways</span>
                          <span className="flex gap-1">
                            <span className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce delay-75"></span>
                            <span className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce delay-150"></span>
                            <span className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce delay-225"></span>
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={chatBottomRef} />
                </div>

                {/* Input Tray */}
                <form onSubmit={handleSendMessage} className="p-4 bg-slate-950/40 border-t border-slate-800/80 flex gap-2">
                  <input
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder="Ask NeuroChat anything..."
                    className="flex-1 bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500/50 transition-all duration-300"
                  />
                  <button
                    type="submit"
                    disabled={isTyping || !userInput.trim()}
                    className="bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600 disabled:from-slate-800 disabled:to-slate-850 disabled:text-slate-600 text-slate-950 px-5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-teal-500/5"
                  >
                    <Send className="w-4 h-4" />
                    Send
                  </button>
                </form>
              </div>
            </motion.div>
          )}

          {/* TAB 2: CODE EXPLORER */}
          {activeTab === "code" && (
            <motion.div
              key="code"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full h-[calc(100vh-210px)] min-h-[550px]"
              id="code-view"
            >
              {/* Left File Selector Pane */}
              <div className="lg:col-span-4 bg-slate-900/50 border border-slate-800/60 rounded-2xl p-5 flex flex-col justify-between overflow-y-auto shadow-2xl backdrop-blur-sm" id="code-left-sidebar">
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center gap-2 text-teal-400 mb-1">
                      <Terminal className="w-4 h-4 text-blue-400" />
                      <h2 className="text-sm font-bold tracking-wider uppercase text-white font-mono">Python Workspace</h2>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">Select Python scripts to inspect code architecture, dependencies, or download locally.</p>
                  </div>

                  {/* File Lists */}
                  <div className="space-y-2.5">
                    {pythonFiles.map((file) => {
                      const isActive = selectedFile.name === file.name;
                      
                      return (
                        <button
                          key={file.name}
                          onClick={() => setSelectedFile(file)}
                          className={`w-full text-left p-3.5 rounded-xl border transition-all duration-300 flex items-start gap-3 cursor-pointer ${
                            isActive 
                              ? "bg-gradient-to-br from-blue-600/20 to-teal-600/20 border-teal-500/50 text-teal-300 font-bold" 
                              : "bg-slate-950/40 border-slate-800/80 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                          }`}
                        >
                          <FileCode className={`w-5 h-5 shrink-0 mt-0.5 ${isActive ? "text-teal-400" : "text-slate-500"}`} />
                          <div className="space-y-0.5 w-full">
                            <span className="text-xs font-mono font-bold block">{file.name}</span>
                            <span className="text-[10px] opacity-75 line-clamp-2 leading-relaxed">{file.description}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Right Code Display Viewport */}
              <div className="lg:col-span-8 bg-slate-900/50 border border-slate-800/60 rounded-2xl flex flex-col overflow-hidden h-full shadow-2xl backdrop-blur-sm" id="code-right-viewport">
                {/* Editor Header Bar */}
                <div className="px-5 py-3.5 border-b border-slate-800/60 bg-slate-950/80 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1.5 mr-2">
                      <span className="w-2.5 h-2.5 bg-rose-500 rounded-full opacity-70"></span>
                      <span className="w-2.5 h-2.5 bg-amber-500 rounded-full opacity-70"></span>
                      <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full opacity-70"></span>
                    </div>
                    <span className="text-xs font-mono text-slate-300 font-bold">{selectedFile.name}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Copy Button */}
                    <button
                      onClick={() => handleCopyCode(selectedFile.code, selectedFile.name)}
                      className="bg-slate-950/80 border border-slate-800 hover:border-teal-500/30 text-slate-300 hover:text-teal-400 px-3.5 py-2 rounded-xl text-xs font-medium flex items-center gap-2 transition-all duration-300 cursor-pointer"
                    >
                      {copiedFile === selectedFile.name ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400 font-semibold">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Code</span>
                        </>
                      )}
                    </button>

                    {/* Download Button */}
                    <button
                      onClick={() => handleDownloadFile(selectedFile.name)}
                      className="bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600 text-slate-950 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all duration-300 cursor-pointer shadow-lg shadow-teal-500/10"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download
                    </button>
                  </div>
                </div>

                {/* Code Window */}
                <div className="flex-1 overflow-auto bg-slate-950/80 p-5">
                  <div className="table w-full border-collapse font-mono text-xs">
                    {renderHighlightedCode(selectedFile.code, selectedFile.language)}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 3: SLIDESHOW PRESENTATION */}
          {activeTab === "slides" && (
            <motion.div
              key="slides"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 lg:p-8 flex flex-col justify-between h-[calc(100vh-180px)] min-h-[500px]"
              id="presentation-deck-view"
            >
              {/* Slide Core Content */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center flex-1">
                {/* Slide Text Content Left */}
                <div className="lg:col-span-6 space-y-6">
                  <div>
                    <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest block mb-1">
                      Audience Slide {currentSlideIndex + 1} of {presentationSlides.length}
                    </span>
                    <h2 className="text-2xl lg:text-3xl font-bold tracking-tight text-slate-100">
                      {presentationSlides[currentSlideIndex].title}
                    </h2>
                    <p className="text-sm text-slate-400 mt-1.5 italic">
                      {presentationSlides[currentSlideIndex].subtitle}
                    </p>
                  </div>

                  <ul className="space-y-3.5">
                    {presentationSlides[currentSlideIndex].points.map((point, index) => (
                      <li key={index} className="flex items-start gap-3 text-sm leading-relaxed text-slate-300">
                        <span className="w-5 h-5 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-400 flex items-center justify-center shrink-0 mt-0.5 font-mono text-[10px] font-bold">
                          {index + 1}
                        </span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Diagram/Code Illustration Right */}
                <div className="lg:col-span-6 h-full flex flex-col justify-center">
                  {presentationSlides[currentSlideIndex].codeHighlight ? (
                    <div className="bg-slate-950 border border-slate-850 rounded-2xl overflow-hidden shadow-2xl">
                      <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-850 flex items-center justify-between">
                        <span className="text-[11px] font-mono text-slate-400 font-semibold flex items-center gap-1.5">
                          <FileCode className="w-3.5 h-3.5 text-teal-400" />
                          {presentationSlides[currentSlideIndex].codeHighlight.file}
                        </span>
                        <span className="text-[10px] text-slate-500 italic">
                          {presentationSlides[currentSlideIndex].codeHighlight.description}
                        </span>
                      </div>
                      <div className="p-4 font-mono text-xs overflow-x-auto text-slate-300">
                        <pre className="text-[11px] leading-relaxed select-all">
                          {presentationSlides[currentSlideIndex].codeHighlight.snippet}
                        </pre>
                      </div>
                    </div>
                  ) : (
                    // Architecture Visual Diagram (Slide 1)
                    <div className="bg-slate-950/50 border border-slate-800/60 rounded-2xl p-6 flex flex-col items-center justify-center space-y-6 h-80 shadow-2xl">
                      <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">High-Level Dataflow Visualizer</span>
                      
                      {/* Node Pipelines */}
                      <div className="flex items-center gap-4 w-full max-w-md justify-between">
                        {/* Streamlit Node */}
                        <div className="flex flex-col items-center">
                          <div className="w-14 h-14 rounded-full bg-slate-900 border-2 border-teal-500 flex items-center justify-center text-teal-400 shadow-lg shadow-teal-500/10">
                            <Layers className="w-6 h-6" />
                          </div>
                          <span className="text-[11px] font-mono font-bold mt-2 text-teal-400">Streamlit</span>
                          <span className="text-[9px] text-slate-500 font-mono">(Frontend)</span>
                        </div>

                        {/* Connector Arrow */}
                        <div className="flex-1 flex flex-col items-center">
                          <span className="text-[10px] font-mono text-slate-500 font-bold mb-1">CORS</span>
                          <div className="w-full h-0.5 bg-gradient-to-r from-teal-500 to-blue-500 relative flex items-center justify-center">
                            <div className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-ping"></div>
                          </div>
                          <span className="text-[8px] text-slate-600 mt-1">REST API</span>
                        </div>

                        {/* FastAPI Node */}
                        <div className="flex flex-col items-center">
                          <div className="w-14 h-14 rounded-full bg-slate-900 border-2 border-blue-500 flex items-center justify-center text-blue-400 shadow-lg shadow-blue-500/10">
                            <Server className="w-6 h-6" />
                          </div>
                          <span className="text-[11px] font-mono font-bold mt-2 text-blue-400">FastAPI</span>
                          <span className="text-[9px] text-slate-500 font-mono">(Backend Gate)</span>
                        </div>

                        {/* Connector Arrow */}
                        <div className="flex-1 flex flex-col items-center">
                          <span className="text-[10px] font-mono text-slate-500 font-bold mb-1">SSL</span>
                          <div className="w-full h-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 relative flex items-center justify-center">
                            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-ping"></div>
                          </div>
                          <span className="text-[8px] text-slate-600 mt-1">https</span>
                        </div>

                        {/* Neuro Core Node */}
                        <div className="flex flex-col items-center">
                          <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-slate-950 shadow-lg shadow-blue-500/20">
                            <Brain className="w-6 h-6" />
                          </div>
                          <span className="text-[11px] font-mono font-bold mt-2 text-indigo-400 font-black">Neuro Core</span>
                          <span className="text-[9px] text-slate-500 font-mono">(Neural Core)</span>
                        </div>
                      </div>

                      <div className="bg-slate-950/60 p-3.5 border border-slate-850/80 rounded-xl max-w-md text-center">
                        <p className="text-xs text-slate-400 leading-relaxed">
                          <strong>Presenter Note:</strong> Highlighting this separation shows architectural maturity, demonstrating to audiences that secrets are safe and scalable.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Slider Controls Footer */}
              <div className="flex justify-between items-center border-t border-slate-800/60 pt-5 mt-6 bg-transparent">
                <button
                  disabled={currentSlideIndex === 0}
                  onClick={() => setCurrentSlideIndex(prev => prev - 1)}
                  className="bg-slate-950 border border-slate-850 hover:border-slate-700 disabled:opacity-40 disabled:hover:border-slate-850 text-slate-300 px-4 py-2.5 rounded-xl text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous Slide
                </button>

                <div className="flex gap-1.5">
                  {presentationSlides.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentSlideIndex(index)}
                      className={`w-2.5 h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                        currentSlideIndex === index ? "bg-teal-400 w-6" : "bg-slate-800 hover:bg-slate-700"
                      }`}
                    />
                  ))}
                </div>

                <button
                  disabled={currentSlideIndex === presentationSlides.length - 1}
                  onClick={() => setCurrentSlideIndex(prev => prev + 1)}
                  className="bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600 disabled:opacity-40 text-slate-950 px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-teal-500/10"
                >
                  Next Slide
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
          {/* TAB 4: OUR TEAM */}
          {activeTab === "team" && (
            <motion.div
              key="team"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="w-full max-w-6xl mx-auto flex flex-col justify-start overflow-y-auto h-[calc(100vh-210px)] pr-2"
              id="team-view"
            >
              {/* Header section */}
              <div className="text-center max-w-2xl mx-auto mb-10 mt-2">
                <span className="text-[10px] font-mono text-teal-400 uppercase tracking-widest block mb-2 font-bold">Project Collaborators</span>
                <h2 className="text-3xl font-extrabold text-white tracking-tight">Meet the Engineering Team</h2>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  The multidisciplinary squad responsible for designing, building, testing, and optimizing the NeuroChat Streamlit and FastAPI workspace.
                </p>
              </div>

              {/* Grid of 5 Team Members */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 justify-center">
                {[
                  {
                    name: "Jerom Varghese",
                    role: "Project Manager and Tester",
                    initials: "JV",
                    specialty: "Agile Orchestration & Quality Assurance",
                    description: "Oversees development lifecycles, sprint delivery, and extensive end-to-end integration testing to ensure zero-defect releases.",
                    gradient: "from-blue-600 to-indigo-600",
                    glow: "shadow-blue-500/10",
                    badgeColor: "text-blue-400 bg-blue-500/10 border-blue-500/20"
                  },
                  {
                    name: "Sahal Badar",
                    role: "AI Model Developer",
                    initials: "SB",
                    specialty: "Neural Architect & Model Orchestration",
                    description: "Designs prompt structures, optimizes token throughput, and aligns the conversational interface with server-side LLM cores.",
                    gradient: "from-purple-600 to-indigo-600",
                    glow: "shadow-indigo-500/10",
                    badgeColor: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20"
                  },
                  {
                    name: "Justin Samson George",
                    role: "Front end Designer",
                    initials: "JG",
                    specialty: "UI/UX & Interactive Design System",
                    description: "Maintains absolute pixel perfection, crafts fluid interactive motion, and maintains consistent styling standards across the workspace.",
                    gradient: "from-teal-600 to-emerald-600",
                    glow: "shadow-teal-500/10",
                    badgeColor: "text-teal-400 bg-teal-500/10 border-teal-500/20"
                  },
                  {
                    name: "Nohan Preethu Thomas",
                    role: "Data Specialist",
                    initials: "NT",
                    specialty: "Information Pipelines & Analytics",
                    description: "Manages data presentation layers, structure definitions, and telemetry data parsing for optimized UI presentation.",
                    gradient: "from-amber-600 to-orange-600",
                    glow: "shadow-orange-500/10",
                    badgeColor: "text-orange-400 bg-orange-500/10 border-orange-500/20"
                  },
                  {
                    name: "Rehan Abdussalam",
                    role: "Back end Designer",
                    initials: "RA",
                    specialty: "Secure API Engineering & System Logic",
                    description: "Architects server-side FastAPI layers, robust caching mechanisms, and handles secure system token environment pipelines.",
                    gradient: "from-rose-600 to-red-600",
                    glow: "shadow-rose-500/10",
                    badgeColor: "text-rose-400 bg-rose-500/10 border-rose-500/20"
                  }
                ].map((member, index) => (
                  <div 
                    key={index} 
                    className={`bg-slate-900/40 border border-slate-800/80 hover:border-slate-700/80 rounded-2xl p-6 flex flex-col justify-between transition-all duration-300 shadow-xl ${member.glow} hover:shadow-2xl relative overflow-hidden group`}
                  >
                    {/* Visual gradient accent */}
                    <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-teal-500/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    
                    <div>
                      {/* Avatar initials with beautiful custom gradient */}
                      <div className="flex items-center gap-4 mb-4">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${member.gradient} flex items-center justify-center font-mono font-bold text-white text-base shadow-lg`}>
                          {member.initials}
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-white tracking-tight">{member.name}</h3>
                          <span className={`text-[10px] font-mono font-bold uppercase tracking-wider border px-2 py-0.5 rounded-md ${member.badgeColor}`}>
                            {member.role}
                          </span>
                        </div>
                      </div>

                      {/* Specialist Bullet */}
                      <div className="bg-slate-950/40 border border-slate-850/60 rounded-lg px-3 py-2 mb-3">
                        <span className="text-[9px] font-mono text-slate-500 uppercase block">Specialization</span>
                        <span className="text-xs font-semibold text-teal-300">{member.specialty}</span>
                      </div>

                      {/* Description */}
                      <p className="text-xs text-slate-400 leading-relaxed">
                        {member.description}
                      </p>
                    </div>

                    <div className="border-t border-slate-850/60 pt-4 mt-5 flex items-center justify-between">
                      <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Active Core Member</span>
                      <span className="text-xs text-teal-500/40 group-hover:text-teal-400 transition-colors duration-300 font-mono">⚡ Verified</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}



        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900/80 bg-slate-950/60 backdrop-blur-sm px-8 py-6 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] text-slate-500 uppercase tracking-widest" id="app-footer">
        <span>&copy; {new Date().getFullYear()} NeuroChat. All rights reserved. Python Core Engine &bull; Language Model Core.</span>
        <div className="flex gap-6">
          <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab("playground"); }} className="hover:text-teal-400 transition-colors">Playground</a>
          <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab("code"); }} className="hover:text-teal-400 transition-colors">Workspace</a>
          <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab("slides"); }} className="hover:text-teal-400 transition-colors">Slides</a>
          <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab("team"); }} className="hover:text-teal-400 transition-colors">Team</a>
        </div>
      </footer>
    </div>
  );
}
