// app/(dashboard)/dashboard/ai-assistant/page.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Send, Sparkles, User, Bot, Loader2, ArrowLeft, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import MarkdownRenderer from "@/components/ui/MarkdownRenderer";

import { askAquaExpert } from "@/features/ai/actions/ai.actions";
import { ChatMessage } from "@/features/ai/types/ai.types";

export default function AIAssistantPage() {
  const router = useRouter();
  const [input, setInput] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome-1",
      role: "ai",
      content: "Halo! Saya AquaExpert AI. Ada yang bisa saya bantu terkait ikan hias, tanaman, atau penyakit di akuarium Anda hari ini?",
      timestamp: new Date(),
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll ke bawah saat ada pesan baru
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userText = input.trim();
    setInput("");
    setIsLoading(true);

    const newUserMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: userText,
      timestamp: new Date(),
    };

    const newHistory = [...messages, newUserMsg];
    setMessages(newHistory);

    try {
      // Panggil Server Action RAG
      const response = await askAquaExpert(newHistory);

      if (response.error) {
        toast.error(response.error);
        setMessages((prev) => prev.slice(0, -1)); // Hapus pesan user jika error total
      } else if (response.reply) {
        const newAiMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: "ai",
          content: response.reply,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, newAiMsg]);
      }
    } catch (error) {
      toast.error("Terjadi kesalahan jaringan.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([messages[0]]);
    toast.success("Percakapan dibersihkan!");
  };

  return (
    <div className="w-full max-w-[1000px] mx-auto p-4 sm:p-6 lg:p-8 h-[calc(100vh-80px)] flex flex-col">
      
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.push("/dashboard")}
            className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center border border-violet-200 dark:border-violet-800/50">
              <Sparkles className="w-5 h-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-800 dark:text-slate-100 leading-tight">Tanya Pakar (AI)</h1>
              <p className="text-xs font-bold text-violet-600 dark:text-violet-400">Powered by RAG Engine</p>
            </div>
          </div>
        </div>
        <button 
          onClick={handleClearChat}
          className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-colors flex items-center gap-2"
          title="Bersihkan Percakapan"
        >
          <Trash2 className="w-4 h-4" />
          <span className="hidden sm:inline text-xs font-bold">Clear</span>
        </button>
      </div>

      {/* CHAT AREA */}
      <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 custom-scrollbar">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-4 max-w-[85%] ${msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"}`}>
              
              {/* AVATAR */}
              <div className={`shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center ${
                msg.role === "user" 
                  ? "bg-blue-600 text-white" 
                  : "bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400 border border-violet-200 dark:border-violet-800"
              }`}>
                {msg.role === "user" ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
              </div>

              {/* BUBBLE */}
              <div className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
                <div className={`px-4 sm:px-5 py-3 rounded-2xl text-sm sm:text-base font-medium shadow-sm whitespace-pre-wrap leading-relaxed ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white rounded-tr-sm"
                    : "bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 border border-slate-100 dark:border-slate-700/50 rounded-tl-sm"
                }`}>
                  {/* 💡 UBAH BAGIAN INI */}
                  {msg.role === "user" ? (
                  msg.content 
                  ) : (
                  <MarkdownRenderer content={msg.content} />
                  )}
                </div>
                <span className="text-[10px] font-bold text-slate-400 mt-1.5 px-1">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

            </div>
          ))}

          {/* LOADING INDICATOR */}
          {isLoading && (
            <div className="flex gap-4 max-w-[85%] mr-auto animate-in fade-in duration-300">
              <div className="shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400 border border-violet-200 dark:border-violet-800 flex items-center justify-center">
                <Bot className="w-5 h-5" />
              </div>
              <div className="px-5 py-4 rounded-2xl rounded-tl-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50 flex items-center gap-2 shadow-sm">
                <Loader2 className="w-4 h-4 animate-spin text-violet-500" />
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 animate-pulse">Sedang menganalisis database...</span>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* INPUT FORM */}
        <div className="p-4 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800">
          <form onSubmit={handleSendMessage} className="relative flex items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Tanya tentang gejala ikan, parameter air, dll..."
              className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 text-sm sm:text-base font-medium rounded-2xl pl-5 pr-14 py-4 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all shadow-sm disabled:opacity-50"
              disabled={isLoading}
              autoFocus
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="absolute right-2 p-2.5 bg-violet-600 hover:bg-violet-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white rounded-xl transition-all disabled:opacity-50"
            >
              <Send className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </form>
          <p className="text-center text-[10px] font-bold text-slate-400 mt-3">
            AI dapat membuat kesalahan. RAG Database memastikan panduan pengobatan berasal dari referensi Anda.
          </p>
        </div>
      </div>
      
    </div>
  );
}