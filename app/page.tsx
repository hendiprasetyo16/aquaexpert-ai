"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useLanguage } from "@/providers/LanguageProvider";
import { Sparkles, X, Send, Bot, User, Loader2 } from "lucide-react";
import { askAquaExpert } from "@/features/ai/actions/ai.actions";

type ChatMessage = {
  role: "user" | "ai";
  content: string;
};

export default function Home() {
  const { dict, language } = useLanguage();
  
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll ke bawah saat ada pesan baru
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatHistory, isTyping]);

  // 💡 FITUR BARU: Tutup modal AI dengan menekan tombol ESC di keyboard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isAiOpen) {
        setIsAiOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isAiOpen]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    const currentMessage = message;
    const newHistory: ChatMessage[] = [...chatHistory, { role: "user", content: currentMessage }];
    
    setChatHistory(newHistory);
    setMessage("");
    setIsTyping(true);

    const res = await askAquaExpert(newHistory);

    if (res?.error) {
      setChatHistory(prev => [...prev, { role: "ai", content: `⚠️ Maaf, ada kendala: ${res.error}` }]);
    } else if (res?.reply) {
      setChatHistory(prev => [...prev, { role: "ai", content: res.reply }]);
    }
    
    setIsTyping(false);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-6 text-foreground transition-colors duration-300 relative">
      
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-teal-500/10 dark:from-teal-900/40 via-background to-background"></div>
      </div>

      <div className="z-10 flex max-w-3xl flex-col items-center text-center animate-in fade-in slide-in-from-bottom-4 duration-1000">
        <h1 className="mb-4 text-5xl font-extrabold tracking-tight sm:text-7xl drop-shadow-sm">
          <span className="text-teal-600 dark:text-teal-400">Aqua</span>Expert AI
        </h1>
        
        <p className="mb-8 text-lg text-muted-foreground sm:text-xl max-w-2xl leading-relaxed">
          {dict.landing?.subtitle || "Platform Cerdas Manajemen Aquascape Anda"}
        </p>

        <div className="flex flex-col gap-4 sm:flex-row w-full sm:w-auto px-4">
          <Link href="/dashboard" className="w-full sm:w-auto">
            <Button className="w-full bg-teal-600 px-8 py-6 text-lg hover:bg-teal-500 text-white font-semibold shadow-lg shadow-teal-600/20 rounded-xl transition-all active:scale-95">
              {dict.landing?.enterDashboard || "Masuk Dashboard"}
            </Button>
          </Link>
          
          <Button 
            onClick={() => setIsAiOpen(true)}
            variant="outline" 
            className="w-full sm:w-auto border-2 border-teal-600 dark:border-teal-800 px-8 py-6 text-lg text-teal-700 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/30 bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm rounded-xl font-bold transition-all active:scale-95 group flex items-center gap-2"
          >
            <Sparkles className="w-5 h-5 text-teal-500 group-hover:animate-pulse" />
            {dict.landing?.askAI || "Tanya AI"}
          </Button>
        </div>
      </div>

      {/* ========================================= */}
      {/* MODAL POP-UP AI (Sudah Bersih dari Portal) */}
      {/* ========================================= */}
      {isAiOpen && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 sm:p-6">
          
          <div 
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setIsAiOpen(false)}
          />
          
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="relative z-10 bg-white dark:bg-slate-950 w-full max-w-lg h-[600px] max-h-[85vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 slide-in-from-bottom-10 duration-300"
          >
            
            <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 bg-teal-50/50 dark:bg-teal-950/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-teal-600 rounded-full flex items-center justify-center text-white shadow-md shadow-teal-500/20">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 leading-tight">AquaExpert AI</h3>
                  <p className="text-[10px] uppercase tracking-wider text-teal-600 dark:text-teal-400 font-black">
                    {language === 'id' ? 'Asisten Cerdas Aquascape' : 'Aquascape Smart Assistant'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsAiOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-900 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-50/50 dark:bg-slate-950/50">
              
              <div className="flex justify-start">
                <div className="max-w-[85%] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 p-4 rounded-2xl rounded-tl-sm text-sm leading-relaxed shadow-sm">
                  {language === 'id' 
                    ? "Halo! 👋 Saya adalah AquaExpert AI. Silakan tanyakan seputar ikan hias, tanaman, atau masalah aquascape Anda kepada saya."
                    : "Hello! 👋 I am AquaExpert AI. Feel free to ask about fishes, plants, or your aquascape issues here."}
                </div>
              </div>

              {chatHistory.map((chat, index) => (
                <div key={index} className={`flex ${chat.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {chat.role === 'ai' && (
                     <div className="w-6 h-6 rounded-full bg-teal-600 flex items-center justify-center text-white mr-2 shrink-0 mt-2">
                       <Bot className="w-3.5 h-3.5" />
                     </div>
                  )}
                  
                  <div className={`max-w-[85%] p-4 text-sm leading-relaxed shadow-sm whitespace-pre-wrap ${
                    chat.role === 'user' 
                      ? 'bg-teal-600 text-white rounded-2xl rounded-tr-sm' 
                      : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-2xl rounded-tl-sm'
                  }`}>
                    {chat.content}
                  </div>

                  {chat.role === 'user' && (
                     <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-500 ml-2 shrink-0 mt-2">
                       <User className="w-3.5 h-3.5" />
                     </div>
                  )}
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start items-end gap-2">
                  <div className="w-6 h-6 rounded-full bg-teal-600 flex items-center justify-center text-white shrink-0">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                    <div className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="p-4 bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800">
              <form onSubmit={handleSendMessage} className="flex items-center gap-2 relative">
                <Input 
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={language === 'id' ? "Ketik pertanyaan Anda..." : "Type your question..."}
                  disabled={isTyping}
                  className="flex-1 rounded-full h-12 pl-5 pr-14 bg-slate-100 dark:bg-slate-900 border-transparent focus:border-teal-500 focus:bg-white dark:focus:bg-slate-950 transition-all"
                />
                <Button 
                  type="submit"
                  size="icon"
                  disabled={!message.trim() || isTyping}
                  className="absolute right-1 w-10 h-10 rounded-full bg-teal-600 hover:bg-teal-500 text-white shadow-md disabled:bg-slate-300 dark:disabled:bg-slate-800"
                >
                  {isTyping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 ml-0.5" />}
                </Button>
              </form>
            </div>

          </div>
        </div>
      )}
    </main>
  );
}