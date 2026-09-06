import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { draftAgentTask, createTask, getListTasksQueryKey, useGetSession, useListUsers } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, Send, Sparkles, Check, X, Mic, MicOff } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";

type Message = { id: number; text: string; sender: 'user' | 'agent'; draft?: any };

export default function Agent() {
  const [location, setLocation] = useLocation();
  const { data: session } = useGetSession();
  const { data: users } = useListUsers();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const welcomeByLanguage = {
    en: "Hello! I am Wasl. How can I help you coordinate care today?",
    fr: "Bonjour ! Je suis Wasl. Comment puis-je vous aider à coordonner les soins aujourd’hui ?",
    ar: "مرحبًا! أنا وصل. كيف يمكنني مساعدتك في تنسيق الرعاية اليوم؟",
    fa: "سلام! من وصل هستم. امروز چگونه می‌توانم در هماهنگی مراقبت به شما کمک کنم؟",
  };
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const speechLocale = session?.user.preferredLanguage === "fr" ? "fr-FR" : session?.user.preferredLanguage === "ar" ? "ar-SA" : session?.user.preferredLanguage === "fa" ? "fa-IR" : "en-US";

  const speak = (text: string) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = speechLocale;
    window.speechSynthesis.speak(utterance);
  };

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({ title: "Voice input is not supported in this browser" });
      return;
    }
    recognitionRef.current?.stop?.();
    const recognition = new SpeechRecognition();
    recognition.lang = speechLocale;
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results).map((result: any) => result[0].transcript).join("");
      setInput(transcript);
    };
    recognitionRef.current = recognition;
    recognition.start();
  };

  useEffect(() => {
    const timer = window.setTimeout(startListening, 350);
    return () => {
      window.clearTimeout(timer);
      recognitionRef.current?.stop?.();
      window.speechSynthesis?.cancel();
    };
  }, [speechLocale]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  useEffect(() => {
    if (!session || messages.length) return;
    const welcome = welcomeByLanguage[session.user.preferredLanguage];
    setMessages([{ id: 1, text: welcome, sender: "agent" }]);
    speak(welcome);
  }, [session?.user.preferredLanguage]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { id: Date.now(), text: userMsg, sender: 'user' }]);
    setIsLoading(true);

    try {
      const response = await draftAgentTask({ message: userMsg });
      speak(response.message);
      setMessages(prev => [...prev, { 
        id: Date.now(), 
        text: response.message, 
        sender: 'agent',
        draft: response.draft 
      }]);
    } catch (err) {
      const errorMessage = session?.user.preferredLanguage === "fa" ? "متأسفم، مشکلی پیش آمد. لطفاً دوباره بگویید." : session?.user.preferredLanguage === "ar" ? "عذرًا، حدث خطأ. هل يمكنك المحاولة مرة أخرى؟" : session?.user.preferredLanguage === "fr" ? "Désolé, une erreur s’est produite. Pouvez-vous réessayer ?" : "I'm sorry, I encountered an error. Could you try saying that again?";
      setMessages(prev => [...prev, { id: Date.now(), text: errorMessage, sender: 'agent' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmDraft = async (draft: any, msgId: number) => {
    try {
      await createTask(draft);
      toast({ title: "Task added to the calendar!" });
      queryClient.invalidateQueries({ queryKey: getListTasksQueryKey() });
      
      // Update message to remove draft so we don't confirm twice
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, text: "Great, I've added that task. Anything else?", draft: null } : m));
    } catch (err) {
      toast({ title: "Failed to create task", variant: "destructive" });
    }
  };

  const handleCancelDraft = (msgId: number) => {
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, text: "Okay, I've canceled that. Let's try again.", draft: null } : m));
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-muted/30">
      <header className="sticky top-0 z-40 bg-card border-b px-4 py-4 flex items-center justify-between shadow-sm">
        <Button variant="ghost" size="icon" onClick={() => setLocation('/')} className="rounded-full">
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-secondary" />
          <h1 className="text-xl font-bold">Talk to Wasl</h1>
        </div>
        <div className="w-10" /> {/* Spacer for centering */}
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-6" ref={scrollRef}>
        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`flex gap-3 max-w-[85%] ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <Avatar className={`w-10 h-10 border ${msg.sender === 'agent' ? 'bg-secondary border-secondary' : 'border-primary/20'}`}>
                <AvatarFallback className={msg.sender === 'agent' ? 'bg-secondary text-white' : ''}>
                  {msg.sender === 'agent' ? 'W' : session?.user?.avatarInitials}
                </AvatarFallback>
              </Avatar>
              <div className={`p-4 rounded-3xl ${msg.sender === 'user' ? 'bg-primary text-primary-foreground rounded-tr-sm' : 'bg-card border shadow-sm rounded-tl-sm text-foreground'}`}>
                <p className="text-[17px] leading-relaxed whitespace-pre-wrap">{msg.text}</p>
              </div>
            </div>

            {msg.draft && (
              <Card className="mt-4 max-w-[85%] ms-12 border-secondary shadow-md animate-in slide-in-from-bottom-2">
                <CardContent className="p-5">
                  <h4 className="font-bold text-lg mb-2 text-primary">Proposed Task</h4>
                  <div className="space-y-2 mb-4 text-sm text-muted-foreground">
                    <p><span className="font-semibold text-foreground">Title:</span> {msg.draft.title}</p>
                    <p><span className="font-semibold text-foreground">For:</span> {msg.draft.label}</p>
                    <p><span className="font-semibold text-foreground">Due:</span> {new Date(msg.draft.dueAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => handleConfirmDraft(msg.draft, msg.id)} className="flex-1 rounded-xl bg-secondary text-secondary-foreground hover:bg-secondary/90">
                      <Check className="w-4 h-4 me-2" /> Confirm
                    </Button>
                    <Button variant="outline" onClick={() => handleCancelDraft(msg.id)} className="rounded-xl">
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-3 max-w-[85%]">
            <Avatar className="w-10 h-10 bg-secondary border-secondary">
              <AvatarFallback className="bg-secondary text-white">W</AvatarFallback>
            </Avatar>
            <div className="p-4 rounded-3xl bg-card border shadow-sm rounded-tl-sm">
              <div className="flex gap-1.5 items-center h-6">
                <div className="w-2 h-2 rounded-full bg-secondary animate-bounce" />
                <div className="w-2 h-2 rounded-full bg-secondary animate-bounce [animation-delay:0.2s]" />
                <div className="w-2 h-2 rounded-full bg-secondary animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-card border-t border-border">
        <div className="flex gap-2 overflow-x-auto pb-3 max-w-3xl mx-auto" aria-label="Mention a circle member">
          {users?.map(user => (
            <button key={user.id} dir="ltr" type="button" onClick={() => setInput(value => `${value}${value ? " " : ""}@${user.username} `)} className="shrink-0 rounded-full border bg-muted/40 px-3 py-1.5 text-sm font-semibold text-primary">
              @{user.username}
            </button>
          ))}
        </div>
        <form 
          className="flex items-center gap-3 relative max-w-3xl mx-auto"
          onSubmit={e => { e.preventDefault(); handleSend(); }}
        >
          <Button type="button" size="icon" variant={isListening ? "default" : "outline"} onClick={() => isListening ? recognitionRef.current?.stop?.() : startListening()} className="h-14 w-14 shrink-0 rounded-full" aria-label={isListening ? "Stop listening" : "Start voice input"}>
            {isListening ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
          </Button>
          <Input 
            value={input} 
            onChange={e => setInput(e.target.value)} 
            placeholder="Type your message..." 
            className="flex-1 pr-14 bg-muted/50 border-transparent focus-visible:ring-secondary focus-visible:border-secondary h-16 rounded-full text-lg"
          />
          <Button 
            type="submit" 
            size="icon" 
            disabled={!input.trim() || isLoading}
            className="absolute right-2 top-2 h-12 w-12 rounded-full bg-primary hover:bg-primary/90 text-white"
          >
            <Send className="w-6 h-6" />
          </Button>
        </form>
      </div>
    </div>
  );
}
