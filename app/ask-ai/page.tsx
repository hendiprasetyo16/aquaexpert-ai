// app/ask-ai/page.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useLanguage } from "@/providers/LanguageProvider";
import { ArrowLeft, Send, Bot, User, Loader2 } from "lucide-react";
import { askAquaExpert } from "@/features/ai/actions/ai.actions";
import { ChatMessage } from "@/features/ai/types/ai.types"; // 💡 Gunakan tipe data terpusat
import MarkdownRenderer from "@/components/ui/MarkdownRenderer";

export default function AskAIPage() {
  const { language } = useLanguage();
  
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll ke pesan terbaru
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatHistory, isTyping]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    const currentMessage = message.trim();
    
    // 💡 Lengkapi dengan id dan timestamp agar sesuai dengan tipe ChatMessage
    const newUserMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: currentMessage,
      timestamp: new Date(),
    };

    const newHistory: ChatMessage[] = [...chatHistory, newUserMsg];
    
    setChatHistory(newHistory);
    setMessage("");
    setIsTyping(true);

    const res = await askAquaExpert(newHistory);

    if (res?.error) {
      const errAiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "ai",
        content: `⚠️ Maaf, ada kendala: ${res.error}`,
        timestamp: new Date(),
      };
      setChatHistory(prev => [...prev, errAiMsg]);
    } else if (res?.reply) {
      const successAiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "ai",
        content: res.reply,
        timestamp: new Date(),
      };
      setChatHistory(prev => [...prev, successAiMsg]);
    }
    
    setIsTyping(false);
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors">
      
      {/* HEADER NAVIGASI */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-4 sm:px-8 py-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-slate-200 dark:hover:bg-slate-800">
              <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-600 rounded-full flex items-center justify-center text-white shadow-md shadow-teal-500/20 shrink-0">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-extrabold text-lg text-slate-800 dark:text-slate-100 leading-tight">AquaExpert AI</h1>
              <p className="text-[10px] uppercase tracking-wider text-teal-600 dark:text-teal-400 font-black">
                {language === 'id' ? 'Asisten Cerdas Aquascape' : 'Aquascape Smart Assistant'}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* RUANG OBROLAN (CHAT AREA) */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 w-full max-w-4xl mx-auto space-y-6">
        
        {/* Pesan Selamat Datang Default */}
        <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="max-w-[85%] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 p-5 rounded-3xl rounded-tl-sm text-sm sm:text-base leading-relaxed shadow-sm">
            {language === 'id' 
              ? "Halo! 👋 Saya adalah AquaExpert AI. Silakan tanyakan seputar ikan hias, tanaman, atau masalah aquascape Anda kepada saya."
              : "Hello! 👋 I am AquaExpert AI. Feel free to ask about fishes, plants, or your aquascape issues here."}
          </div>
        </div>

        {chatHistory.map((chat) => (
          <div key={chat.id} className={`flex ${chat.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
            {chat.role === 'ai' && (
               <div className="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center text-white mr-3 shrink-0 mt-2 shadow-sm">
                 <Bot className="w-4 h-4" />
               </div>
            )}
            
            <div className={`max-w-[85%] p-5 text-sm sm:text-base leading-relaxed shadow-sm whitespace-pre-wrap ${
              chat.role === 'user' 
                ? 'bg-teal-600 text-white rounded-3xl rounded-tr-sm' 
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-3xl rounded-tl-sm'
            }`}>
              {chat.role === 'user' ? (
                chat.content
              ) : (
                <MarkdownRenderer content={chat.content} />
              )}
            </div>

            {chat.role === 'user' && (
               <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-500 ml-3 shrink-0 mt-2 shadow-sm">
                 <User className="w-4 h-4" />
               </div>
            )}
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start items-end gap-3 animate-in fade-in duration-300">
            <div className="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center text-white shrink-0 shadow-sm">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-5 py-4 rounded-3xl rounded-tl-sm shadow-sm flex items-center gap-1.5">
              <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
              <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} className="h-4" />
      </main>

      {/* AREA INPUT TEKS */}
      <footer className="sticky bottom-0 z-50 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-md p-4 sm:p-6 border-t border-transparent">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSendMessage} className="flex items-center gap-3 relative bg-white dark:bg-slate-900 p-2 rounded-full border border-slate-200 dark:border-slate-800 shadow-xl focus-within:ring-2 focus-within:ring-teal-500/20 transition-all">
            <Input 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={language === 'id' ? "Ketik pertanyaan Anda di sini..." : "Type your question here..."}
              disabled={isTyping}
              className="flex-1 rounded-full h-12 sm:h-14 pl-6 pr-16 bg-transparent border-transparent focus:ring-0 focus:border-transparent text-sm sm:text-base shadow-none outline-none"
            />
            <Button 
              type="submit"
              size="icon"
              disabled={!message.trim() || isTyping}
              className="absolute right-2 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-teal-600 hover:bg-teal-500 text-white shadow-md disabled:bg-slate-200 dark:disabled:bg-slate-800 transition-all"
            >
              {isTyping ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 ml-1" />}
            </Button>
          </form>
          <p className="text-center text-[10px] sm:text-xs text-slate-400 mt-4 font-medium">
            {language === 'id' ? "AI dapat membuat kesalahan. Harap periksa kembali informasi yang penting." : "AI can make mistakes. Please verify important information."}
          </p>
        </div>
      </footer>

    </div>
  );
}