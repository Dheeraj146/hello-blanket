import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bot, Send, User, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "What is Zero Trust Architecture?",
  "Analyze common threat patterns",
  "How to harden endpoint security?",
  "Explain network segmentation best practices",
];

export default function Chatbot() {
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
      setMessages([...newMessages, { role: "assistant", content: "⚠️ Failed to connect to AI service. Make sure the NVIDIA API key is configured." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 h-[calc(100vh-8rem)] flex flex-col">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">AI Security Assistant</h1>
        <p className="text-sm text-muted-foreground">Powered by NVIDIA NIM — Ask anything about cybersecurity</p>
      </div>

      <Card className="flex-1 bg-card border-border/50 flex flex-col min-h-0">
        <CardContent className="flex-1 flex flex-col p-4 min-h-0">
          <div ref={scrollRef} className="flex-1 overflow-auto space-y-4 scrollbar-thin min-h-0">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full gap-4">
                <Bot className="h-12 w-12 text-primary opacity-40" />
                <p className="text-sm text-muted-foreground">Start a conversation about cybersecurity</p>
                <div className="flex flex-wrap gap-2 justify-center max-w-lg">
                  {SUGGESTIONS.map((s) => (
                    <Button key={s} variant="outline" size="sm" className="text-xs border-primary/20 hover:bg-primary/10 hover:text-primary" onClick={() => sendMessage(s)}>
                      {s}
                    </Button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-3 ${m.role === "user" ? "justify-end" : ""}`}>
                {m.role === "assistant" && (
                  <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                )}
                <div className={`max-w-[75%] rounded-lg p-3 text-sm ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-secondary/50 border border-border/50"}`}>
                  {m.role === "assistant" ? (
                    <div className="prose prose-invert prose-sm max-w-none [&_p]:my-1 [&_li]:my-0.5">
                      <ReactMarkdown>{m.content}</ReactMarkdown>
                    </div>
                  ) : m.content}
                </div>
                {m.role === "user" && (
                  <div className="w-7 h-7 rounded-md bg-secondary flex items-center justify-center flex-shrink-0 mt-1">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center"><Bot className="h-4 w-4 text-primary" /></div>
                <div className="bg-secondary/50 border border-border/50 rounded-lg p-3"><Loader2 className="h-4 w-4 animate-spin text-primary" /></div>
              </div>
            )}
          </div>

          <form onSubmit={(e) => { e.preventDefault(); sendMessage(input); }} className="flex gap-2 mt-4 pt-4 border-t border-border">
            <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask about cybersecurity..." className="bg-secondary/50" disabled={loading} />
            <Button type="submit" size="icon" disabled={loading || !input.trim()} className="shrink-0">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
