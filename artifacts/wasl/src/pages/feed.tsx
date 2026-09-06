import { useState, useRef, useEffect } from "react";
import {
  useListFeed,
  useCreateFeedNote,
  getListFeedQueryKey,
  useGetSession,
  useListUsers,
  useListMessages,
  useSendMessage,
  getListMessagesQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useQueryClient } from "@tanstack/react-query";
import { formatDate } from "@/lib/utils";
import { format } from "date-fns";
import {
  MessageSquare,
  Activity as ActivityIcon,
  Info,
  Send,
  X,
  Users
} from "lucide-react";
import { useLocation } from "wouter";
import { useAppTranslation } from "@/lib/language-context";

export default function Feed() {
  const { data: session } = useGetSession();
  const { data: users } = useListUsers();
  const { data: feed, isLoading: isFeedLoading } = useListFeed();
  const { data: messages } = useListMessages({ query: { queryKey: getListMessagesQueryKey(), refetchInterval: 5000 } });
  
  const createFeedNote = useCreateFeedNote();
  const sendMessage = useSendMessage();
  const queryClient = useQueryClient();
  const [location, setLocation] = useLocation();
  const { t } = useAppTranslation();

  const [noteBody, setNoteBody] = useState("");
  const [isUrgent, setIsUrgent] = useState(false);
  
  const chatOpen = new URLSearchParams(window.location.search).get("chat") === "open";
  const toggleChat = () => {
    setLocation(chatOpen ? "/feed" : "/feed?chat=open");
  };

  const [chatBody, setChatBody] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages?.length, chatOpen]);

  const handlePostNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteBody.trim()) return;

    createFeedNote.mutate(
      { data: { body: noteBody, isUrgent } },
      {
        onSuccess: () => {
          setNoteBody("");
          setIsUrgent(false);
          queryClient.invalidateQueries({ queryKey: getListFeedQueryKey() });
        },
      },
    );
  };

  const handleSendChat = () => {
    const text = chatBody.trim();
    if (!text || sendMessage.isPending) return;
    sendMessage.mutate({ data: { body: text } }, {
      onSuccess: () => {
        setChatBody("");
        queryClient.invalidateQueries({ queryKey: getListMessagesQueryKey() });
      },
    });
  };

  if (isFeedLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-40 bg-muted rounded-3xl" />
        <div className="h-24 bg-muted rounded-3xl" />
        <div className="h-24 bg-muted rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-4 md:pb-0">
      <div className="py-2 flex items-center gap-4 mb-4">
        <button
          onClick={toggleChat}
          className={`inline-flex items-center justify-center h-14 w-14 rounded-full shadow-lg shrink-0 transition-colors ${chatOpen ? 'bg-secondary text-secondary-foreground hover:bg-secondary/90' : 'bg-primary text-primary-foreground hover:bg-primary/90'}`}
        >
          {chatOpen ? <X className="w-6 h-6" /> : <Send className="w-6 h-6 ml-1" />}
        </button>
        <div>
          <h1 className="text-3xl font-bold text-primary mb-1">
            {chatOpen ? "Circle Chat" : "Circle Activity"}
          </h1>
          <p className="text-muted-foreground text-lg">
            {chatOpen ? "Private group messages." : "Updates and messages."}
          </p>
        </div>
      </div>

      {chatOpen ? (
        <Card className="flex flex-col h-[calc(100dvh-15rem)] md:h-[600px] shadow-sm overflow-hidden border-border/50">
          <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4 bg-muted/20">
            {messages?.map(message => {
              const mine = message.authorUserId === session?.user.id;
              return (
                <div key={message.id} className={`flex gap-2 ${mine ? "flex-row-reverse" : ""}`}>
                  <Avatar className="h-9 w-9 shrink-0 shadow-sm border border-background">
                    <AvatarFallback className="text-xs">{message.authorInitials}</AvatarFallback>
                  </Avatar>
                  <div className={`max-w-[78%] rounded-2xl px-4 py-3 ${mine ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-card border shadow-sm rounded-tl-sm"}`}>
                    <div className={`mb-1 flex items-center gap-2 text-[10px] ${mine ? "text-primary-foreground/75" : "text-muted-foreground"}`}>
                      <span className="font-bold text-xs">{message.authorName}</span><span dir="ltr">@{message.authorUsername}</span>
                    </div>
                    <p className="whitespace-pre-wrap leading-relaxed text-sm md:text-base">{message.body}</p>
                    <p className={`mt-1 text-right text-[10px] ${mine ? "text-primary-foreground/65" : "text-muted-foreground"}`}>{format(new Date(message.createdAt), "h:mm a")}</p>
                  </div>
                </div>
              );
            })}
            <div ref={chatEndRef} />
          </div>

          <div className="p-3 bg-card border-t border-border/50">
            <div className="mb-2 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {users?.filter(user => user.id !== session?.user.id).map(user => (
                <button key={user.id} dir="ltr" onClick={() => setChatBody(value => `${value}${value ? " " : ""}@${user.username} `)} className="shrink-0 rounded-full border border-border bg-muted/50 px-3 py-1.5 text-xs font-semibold hover:bg-muted transition-colors text-foreground">@{user.username}</button>
              ))}
            </div>
            <form className="relative" onSubmit={event => { event.preventDefault(); handleSendChat(); }}>
              <Input value={chatBody} onChange={event => setChatBody(event.target.value)} placeholder={t("Type your message...")} className="h-14 rounded-full bg-muted/30 pr-14 text-base border-border/50 shadow-inner focus-visible:ring-primary/20" />
              <Button type="submit" size="icon" disabled={!chatBody.trim() || sendMessage.isPending} className="absolute right-1 top-1 h-12 w-12 rounded-full shadow-sm"><Send className="h-5 w-5" /></Button>
            </form>
          </div>
        </Card>
      ) : (
        <>
          <Card className="bg-secondary/5 border-secondary/20 shadow-none">
            <CardContent className="p-4 sm:p-6">
              <form onSubmit={handlePostNote} className="space-y-4">
                <Textarea
                  placeholder="Share an update or note with the circle..."
                  value={noteBody}
                  onChange={(e) => setNoteBody(e.target.value)}
                  className="bg-background border-transparent shadow-inner focus-visible:ring-secondary focus-visible:border-secondary min-h-[100px]"
                />
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center space-x-3">
                    <Switch
                      id="urgent-mode"
                      checked={isUrgent}
                      onCheckedChange={setIsUrgent}
                    />
                    <Label
                      htmlFor="urgent-mode"
                      className="text-muted-foreground cursor-pointer"
                    >
                      Mark as urgent
                    </Label>
                  </div>
                  <Button
                    type="submit"
                    disabled={!noteBody.trim() || createFeedNote.isPending}
                    className="rounded-xl w-full sm:w-auto"
                  >
                    Post Note
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <div className="space-y-4 relative before:absolute before:inset-0 before:ms-7 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-border">
            {feed?.map((item) => (
              <div
                key={item.id}
                className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active"
              >
                <div className="flex items-center justify-center w-14 h-14 rounded-full border-4 border-background bg-muted text-primary shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                  {item.type === "manual_note" ? (
                    <MessageSquare className="w-5 h-5" />
                  ) : item.type === "status_change" ? (
                    <ActivityIcon className="w-5 h-5" />
                  ) : (
                    <Info className="w-5 h-5" />
                  )}
                </div>

                <Card
                  className={`w-[calc(100%-4.5rem)] md:w-[calc(50%-2.5rem)] ${item.isUrgent ? "border-red-200 bg-red-50/50 dark:bg-red-950/20" : ""}`}
                >
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 font-bold text-primary">
                        <Avatar className="w-6 h-6 border">
                          <AvatarFallback className="text-[10px]">
                            {item.authorName?.charAt(0) || "S"}
                          </AvatarFallback>
                        </Avatar>
                        <span>{item.authorName || "System"}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(item.createdAt)}
                      </span>
                    </div>
                    <p className="text-foreground/90 whitespace-pre-wrap">
                      {item.body}
                    </p>
                    {item.isUrgent && (
                      <span className="mt-3 inline-block px-2 py-1 bg-red-100 text-red-800 text-xs font-bold rounded">
                        URGENT
                      </span>
                    )}
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
