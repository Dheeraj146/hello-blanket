import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bot, Send, X, User, Loader2, MessageSquare } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "Analyze email threats",
  "What is phishing?",
  "SMTP security tips",
];

export function FloatingAIBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (content: string) => {
    if (!content.trim()) return;
    const newMessages: Message[] = [...messages, { role: "user", content }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("ai-chat", {
        body: { messages: newMessages },
      });
      if (error) throw error;
      setMessages([...newMessages, { role: "assistant", content: data.content || "I couldn't generate a response." }]);
    } catch {
      setMessages([...newMessages, { role: "assistant", content: "⚠️ Failed to connect to AI service." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-20 right-4 z-50 w-[380px] h-[500px] rounded-xl border border-border bg-card shadow-2xl shadow-primary/10 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-secondary/30">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">NAZAR AI</p>
                  <p className="text-[10px] text-muted-foreground">Email Security Assistant</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => setOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-auto p-3 space-y-3 scrollbar-thin">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full gap-3">
                  <Bot className="h-10 w-10 text-primary opacity-30" />
                  <p className="text-xs text-muted-foreground text-center">Ask me about email security, threats, or protocols</p>
                  <div className="flex flex-wrap gap-1.5 justify-center">
                    {SUGGESTIONS.map((s) => (
                      <Button key={s} variant="outline" size="sm" className="text-[10px] h-7 border-primary/20 hover:bg-primary/10 hover:text-primary" onClick={() => sendMessage(s)}>
                        {s}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
              {messages.map((m, i) => (
                <div key={i} className={`flex gap-2 ${m.role === "user" ? "justify-end" : ""}`}>
                  {m.role === "assistant" && (
                    <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Bot className="h-3 w-3 text-primary" />
                    </div>
                  )}
                  <div className={`max-w-[80%] rounded-lg p-2.5 text-xs ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-secondary/50 border border-border/50"}`}>
                    {m.role === "assistant" ? (
                      <div className="prose prose-invert prose-xs max-w-none [&_p]:my-0.5 [&_li]:my-0">
                        <ReactMarkdown>{m.content}</ReactMarkdown>
                      </div>
                    ) : m.content}
                  </div>
                  {m.role === "user" && (
                    <div className="w-6 h-6 rounded bg-secondary flex items-center justify-center flex-shrink-0 mt-0.5">
                      <User className="h-3 w-3" />
                    </div>
                  )}
                </div>
              ))}
              {loading && (
                <div className="flex gap-2">
                  <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center"><Bot className="h-3 w-3 text-primary" /></div>
                  <div className="bg-secondary/50 border border-border/50 rounded-lg p-2.5"><Loader2 className="h-3 w-3 animate-spin text-primary" /></div>
                </div>
              )}
            </div>

            {/* Input */}
            <form onSubmit={(e) => { e.preventDefault(); sendMessage(input); }} className="flex gap-2 p-3 border-t border-border">
              <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask about email security..." className="bg-secondary/50 text-xs h-8" disabled={loading} />
              <Button type="submit" size="icon" disabled={loading || !input.trim()} className="shrink-0 h-8 w-8">
                <Send className="h-3 w-3" />
              </Button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(!open)}
        className="fixed bottom-4 right-4 z-50 w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 flex items-center justify-center hover:shadow-primary/50 transition-shadow"
      >
        {open ? <X className="h-5 w-5" /> : <MessageSquare className="h-5 w-5" />}
      </motion.button>
    </>
  );
}
