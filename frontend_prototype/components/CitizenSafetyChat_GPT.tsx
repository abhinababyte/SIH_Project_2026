"use client";

import { useState } from "react";
import {
  Bot,
  ChevronDown,
  MapPin,
  MessageCircle,
  Send,
  ShieldAlert,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Message = {
  id: number;
  sender: "user" | "ai";
  text: string;
};

const INITIAL_MESSAGES: Message[] = [
  {
    id: 1,
    sender: "ai",
    text:
      "Hello! I'm HillShield AI. I can help you with evacuation routes, flood safety, and emergency guidance.",
  },
];

const quickQuestions = [
  "What should I do?",
  "Where is the evacuation route?",
  "Is my area safe?",
];

export default function CitizenSafetyChat() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);

  const generateMockResponse = (question: string) => {
    const normalized = question.toLowerCase();

    if (
      normalized.includes("route") ||
      normalized.includes("evacuat")
    ) {
      return "Please move toward the nearest marked evacuation center shown on the HillShield map. Avoid river channels, low-lying roads, bridges, and areas with active flooding. Follow instructions from local emergency authorities.";
    }

    if (
      normalized.includes("safe") ||
      normalized.includes("area")
    ) {
      return "HillShield is monitoring rainfall, soil saturation, and river conditions. Move to higher ground immediately if you receive an emergency evacuation alert. Do not wait for water levels to rise.";
    }

    return "Stay calm and move to higher ground. Keep away from rivers, streams, bridges, and flooded roads. Carry essential medicines, identification, drinking water, and a charged phone. Follow the safest evacuation route shown by HillShield.";
  };

  const sendMessage = (text?: string) => {
    const messageText = (text ?? input).trim();

    if (!messageText) return;

    const userMessage: Message = {
      id: Date.now(),
      sender: "user",
      text: messageText,
    };

    const aiMessage: Message = {
      id: Date.now() + 1,
      sender: "ai",
      text: generateMockResponse(messageText),
    };

    setMessages((current) => [...current, userMessage, aiMessage]);
    setInput("");
  };

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {/* Chat Window */}
      {open && (
        <div className="mb-3 flex h-[560px] w-[360px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-950 shadow-2xl shadow-black/40">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 bg-slate-900 px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-600/20">
                <ShieldAlert className="h-5 w-5 text-red-400" />
              </div>

              <div>
                <h3 className="text-sm font-semibold text-white">
                  HillShield Safety
                </h3>
                <div className="flex items-center gap-1.5 text-xs text-green-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
                  Emergency AI online
                </div>
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="text-slate-400 hover:bg-white/5 hover:text-white"
              onClick={() => setOpen(false)}
              aria-label="Close chat"
            >
              <ChevronDown className="h-5 w-5" />
            </Button>
          </div>

          {/* Messages */}
          <div className="flex-1 space-y-4 overflow-y-auto bg-slate-950 p-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-2 ${
                  message.sender === "user"
                    ? "justify-end"
                    : "justify-start"
                }`}
              >
                {message.sender === "ai" && (
                  <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-600/20">
                    <Bot className="h-4 w-4 text-red-400" />
                  </div>
                )}

                <div
                  className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                    message.sender === "user"
                      ? "rounded-br-sm bg-red-600 text-white"
                      : "rounded-bl-sm border border-white/5 bg-slate-900 text-slate-200"
                  }`}
                >
                  {message.text}
                </div>

                {message.sender === "user" && (
                  <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10">
                    <User className="h-4 w-4 text-slate-300" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Quick Questions */}
          <div className="border-t border-white/5 bg-slate-950 px-3 py-2">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {quickQuestions.map((question) => (
                <button
                  key={question}
                  onClick={() => sendMessage(question)}
                  className="whitespace-nowrap rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-slate-300 transition hover:bg-white/10 hover:text-white"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>

          {/* Input */}
          <div className="border-t border-white/10 bg-slate-900 p-3">
            <div className="flex items-center gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    sendMessage();
                  }
                }}
                placeholder="Ask HillShield AI..."
                className="border-white/10 bg-slate-950 text-white placeholder:text-slate-500"
              />

              <Button
                size="icon"
                className="shrink-0 bg-red-600 hover:bg-red-700"
                onClick={() => sendMessage()}
                aria-label="Send message"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>

            <p className="mt-2 text-[10px] text-slate-500">
              For emergencies, follow official local authority instructions.
            </p>
          </div>
        </div>
      )}

      {/* Floating Button */}
      <Button
        onClick={() => setOpen((value) => !value)}
        className="h-14 w-14 rounded-full bg-red-600 p-0 shadow-xl shadow-red-900/30 transition hover:scale-105 hover:bg-red-700"
        aria-label={open ? "Close safety assistant" : "Open safety assistant"}
      >
        {open ? (
          <ChevronDown className="h-6 w-6" />
        ) : (
          <MessageCircle className="h-6 w-6" />
        )}
      </Button>
    </div>
  );
}
