// components/ChatWidget_DeepSeek.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { MessageCircle, X, Send } from "lucide-react";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

// Mock AI reply generator
const getMockAIResponse = (userMessage: string): string => {
  const lower = userMessage.toLowerCase();
  if (lower.includes("what should i do") || lower.includes("help")) {
    return "🔴 Stay calm. If you are in a flood‑prone area, move to higher ground immediately. Follow evacuation routes to the nearest shelter: Community Center at 5th Ave or Hilltop School. Do not walk or drive through floodwaters.";
  } else if (lower.includes("evacuat") || lower.includes("route")) {
    return "🗺️ The safest evacuation routes are: 1) North along River Road (closed beyond checkpoint 2), 2) East via Hill Street towards the high school. Emergency vehicles are on standby. Avoid low‑lying areas.";
  } else if (lower.includes("family") || lower.includes("contact")) {
    return "📞 Use SMS or emergency apps to contact family. Network may be congested – try text instead of voice calls. Report missing persons to the nearest first responder.";
  } else if (lower.includes("shelter")) {
    return "🏠 Nearest shelters: Community Center (capacity 200), Hilltop School (capacity 500). Both are equipped with food, water, and medical aid.";
  } else {
    return "I'm here to help with flood safety. You can ask: 'What should I do?', 'Evacuation routes?', 'Shelter locations?', or 'How to contact family?'.";
  }
};

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "👋 Hello! I’m your flood safety assistant. Ask me anything about evacuation, shelters, or what to do during a flash flood.",
    },
  ]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto‑scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    // Simulate AI response delay (300ms)
    setTimeout(() => {
      const aiReply: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: getMockAIResponse(userMsg.content),
      };
      setMessages((prev) => [...prev, aiReply]);
    }, 300);
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 transition-colors"
        aria-label="Open safety chat"
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {/* Chat window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-96 max-w-[calc(100vw-2rem)] h-[500px] max-h-[80vh] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-blue-600 text-white p-4 flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Safety Assistant</h3>
              <p className="text-xs text-blue-100">Powered by HillShield AI</p>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white hover:text-blue-200">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 text-sm ${
                    msg.role === "user"
                      ? "bg-blue-600 text-white rounded-br-none"
                      : "bg-white border border-gray-200 text-gray-800 rounded-bl-none"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 bg-white border-t border-gray-200">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Ask about safety..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <Button size="sm" onClick={handleSend} disabled={!input.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
