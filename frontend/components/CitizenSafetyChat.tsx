"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { X, Send, MapPin, Phone, History, Navigation2, CloudRain, AlertTriangle, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "bot" | "user";
  text: string;
  timestamp: Date;
}

const getResponderResponse = (input: string) => {
  const lower = input.toLowerCase();
  
  if (lower.includes("evacuat") || lower.includes("route"))
    return "The primary civilian evacuation route for Sector 4 is **Highway 9 North**. Traffic is flowing, but **Rasdale Bridge** is near breach capacity. Recommend deploying NDRF traffic units to divert civilians via the North Ridge route.";
  
  if (lower.includes("incident") || lower.includes("briefing"))
    return "There are **3 active incidents** in the last hour: \n- **1 Critical**: Rasdale Bridge Breach\n- **1 High**: Landslide Warning on Millbrook Slope\n- **1 Watch**: Heavy Rainfall.\n\nUse the Incident Command panel to acknowledge and dispatch teams.";
    
  if (lower.includes("shelter") || lower.includes("capacity"))
    return "**Shelter Status:**\n- Government Senior Secondary School: **82% capacity** (filling fast).\n- Community Center North: **30% capacity**.\nRecommend routing the next civilian convoy to Community Center North.";
    
  if (lower.includes("resource") || lower.includes("helicopter") || lower.includes("machinery") || lower.includes("hq"))
    return "To request a Helicopter Evacuation, Heavy Machinery, or additional NDRF platoons, please submit an **HQ Escalation** via the Resource Escalation panel. Do you need the exact coordinates for Sector 4?";

  return "I have logged your query. HQ sensors indicate stable conditions in this immediate grid, but please monitor the active alerts feed for real-time tactical updates.";
};

const getResidentResponse = (input: string) => {
  const lower = input.toLowerCase();
  
  if (lower.includes("where") || lower.includes("shelter") || lower.includes("go"))
    return "Your nearest safe location is the **Govt. School Shelter**, which is currently 30% full. It is a 6-minute walk north uphill from your registered home location. Do you want me to show the landmark route?";
  
  if (lower.includes("road") || lower.includes("route") || lower.includes("safe"))
    return "The main **River Road is currently blocked** due to heavy flooding. Please avoid it entirely. The safest path is the upper dirt path passing the main village square.";
    
  if (lower.includes("help") || lower.includes("stuck") || lower.includes("emergency") || lower.includes("save"))
    return "If you are in immediate danger, please click the **SOS** button at the top right of your screen to contact the HillShield Rescue Center, or dial 108 for an ambulance. Stay calm and move to higher ground.";
    
  if (lower.includes("family") || lower.includes("wife") || lower.includes("husband") || lower.includes("child"))
    return "Your registered family members have not checked in yet. You can ping them using the 'Family Safety Circle' button on your dashboard to request their status.";

  return "I am the HillShield AI assistant. I can help you find a safe shelter, check road conditions, or guide you on what to do during a flood warning. What do you need help with?";
};

export default function CitizenSafetyChat({ isOpen, onClose, userType = "responder" }: { isOpen: boolean, onClose: () => void, userType?: "resident" | "responder" }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, scrollToBottom]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    // Initial greeting based on user type
    if (messages.length === 0) {
      setMessages([
        {
          id: "1",
          role: "bot",
          text: userType === "resident" 
            ? "Hello. I am the HillShield AI. I am here to help you stay safe. Ask me about shelters, safe routes, or what to do next."
            : "HillShield Tactical AI initialized. I can provide shelter status, route analysis, and incident briefings. How can I assist Command today?",
          timestamp: new Date()
        }
      ]);
    }
  }, [userType, messages.length]);

  const sendMessage = useCallback((overrideText?: string) => {
    const textToSend = overrideText || input;
    const trimmed = textToSend.trim();
    if (!trimmed || isTyping) return;

    const userMsg: Message = {
      id: "user-" + Date.now(),
      role: "user",
      text: trimmed,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!overrideText) setInput("");
    setIsTyping(true);

    const delay = 600 + Math.random() * 800;
    setTimeout(() => {
      const botResponse = userType === "resident" ? getResidentResponse(trimmed) : getResponderResponse(trimmed);
      const botMsg: Message = {
        id: "bot-" + Date.now(),
        role: "bot",
        text: botResponse,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
    }, delay);
  }, [input, isTyping, userType]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const quickActions = userType === "resident" 
  ? [
      { label: "Nearest safe shelter?", icon: <MapPin className="size-4" /> },
      { label: "Is my route safe?", icon: <Navigation2 className="size-4" /> },
      { label: "Emergency contacts", icon: <Phone className="size-4" /> },
      { label: "What should I do now?", icon: <ShieldAlert className="size-4" /> },
    ]
  : [
      { label: "Civilian evacuation routes?", icon: <Navigation2 className="size-4" /> },
      { label: "Active incident briefing", icon: <AlertTriangle className="size-4" /> },
      { label: "Shelter capacity status", icon: <MapPin className="size-4" /> },
      { label: "Request HQ resource escalation", icon: <ShieldAlert className="size-4" /> },
    ];

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-[#0a101d] border-r border-white/5 shadow-[4px_0_24px_rgba(0,0,0,0.5)]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 shrink-0 border-b border-white/5">
        <h2 className="text-base font-medium text-slate-200 flex items-center gap-2">
          <ShieldAlert className={`size-4 ${userType === 'resident' ? 'text-emerald-500' : 'text-orange-500'}`}/>
          {userType === "resident" ? "Shield AI" : "Tactical AI Assist"}
        </h2>
        <div className="flex items-center gap-1">
          <button className="p-1.5 rounded-full hover:bg-white/5 text-slate-400 transition-colors">
            <History className="size-4" />
          </button>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-white/5 text-slate-400 transition-colors">
            <X className="size-4" />
          </button>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col relative">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col px-4 pt-8 pb-4">
            <div className="text-center mb-6">
              <h1 className={`text-xl font-semibold mb-2 ${userType === 'resident' ? 'text-emerald-400' : 'text-orange-400'}`}>
                {userType === "resident" ? "HillShield AI Assistant" : "HQ Command Assistant"}
              </h1>
              <p className="text-slate-400 text-xs px-2">
                {userType === "resident" 
                  ? "Ask about shelters, safe routes, or emergency steps." 
                  : "Ask about civilian routing, incident data, or resource deployments."}
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-2 mt-auto">
              {quickActions.map((action, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(action.label)}
                  className="text-left bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 rounded-xl p-3 transition-colors flex flex-col gap-2"
                >
                  <div className={userType === 'resident' ? "text-emerald-400/80" : "text-orange-400/80"}>
                    {action.icon}
                  </div>
                  <span className="text-[11px] text-slate-300 leading-snug">{action.label}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex-1 px-4 py-4 space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className={cn("flex flex-col max-w-[85%]", msg.role === "user" ? "ml-auto items-end" : "mr-auto items-start")}>
                <div className={cn(
                  "rounded-xl px-4 py-2.5 text-[13px] leading-relaxed",
                  msg.role === "user" 
                    ? "bg-[#2563EB] text-white rounded-br-sm shadow-sm"
                    : "bg-white/5 border border-white/5 text-slate-300 rounded-bl-sm"
                )}>
                  {msg.role === "user" ? (
                    msg.text
                  ) : (
                    <div 
                      className="prose prose-invert prose-sm max-w-none
                      [&_strong]:font-semibold [&_strong]:text-white
                      [&_ul]:mt-1 [&_ul]:mb-1 [&_ul]:pl-4
                      [&_li]:my-0.5"
                      dangerouslySetInnerHTML={{ 
                        __html: msg.text
                          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                          .replace(/\n- /g, '<br/>• ')
                          .replace(/\n/g, '<br/>')
                      }} 
                    />
                  )}
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="mr-auto items-start flex flex-col">
                <div className="rounded-xl bg-white/5 border border-white/5 rounded-bl-sm px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-500 animate-bounce [animation-delay:0ms]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-500 animate-bounce [animation-delay:150ms]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-500 animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Box */}
      <div className="p-4 pt-2 shrink-0 bg-[#0a101d]">
        <div className="relative flex items-center bg-white/[0.03] border border-white/10 rounded-2xl p-1.5 focus-within:bg-white/[0.05] focus-within:border-white/20 transition-colors">
          <form onSubmit={handleSubmit} className="flex flex-1 items-center">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              className="flex-1 bg-transparent px-3 py-2 text-[13px] text-slate-200 placeholder:text-slate-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className={`flex items-center justify-center size-8 shrink-0 rounded-full transition-all disabled:opacity-50 mr-1 ${
                userType === "resident" 
                  ? "bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600 hover:text-white"
                  : "bg-orange-600/20 text-orange-400 hover:bg-orange-600 hover:text-white"
              }`}
            >
              <Send className="size-3.5 ml-0.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
