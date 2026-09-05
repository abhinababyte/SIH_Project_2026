"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

export interface FloodAlertEvent {
  type: string;
  risk_level: number;
  risk_score: number;
  location: string;
  message: string;
  timestamp: string;
}

export function useFloodWebsocket() {
  const [isConnected, setIsConnected] = useState(true);
  const [latestAlert, setLatestAlert] = useState<FloodAlertEvent | null>(null);

  useEffect(() => {
    // In the web version, we assume the user is online if they can load the site.
    // The actual offline/online toggle will be implemented in the native app.
    
    const ws = new WebSocket("ws://localhost:8000/ws/dashboard");

    ws.onopen = () => {
      console.log("Connected to HillShield Command Center");
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "EMERGENCY_ALERT") {
          setLatestAlert(data as FloodAlertEvent);
          
          // Trigger a global toast notification instantly
          toast.error(data.message, {
            description: `Location: ${data.location} | Risk Score: ${data.risk_score}`,
            duration: 10000,
          });
        }
      } catch (err) {
        console.error("Error parsing websocket message", err);
      }
    };

    ws.onclose = () => {
      console.log("Disconnected from HillShield Command Center");
    };

    return () => {
      ws.close();
    };
  }, []);

  return { isConnected, latestAlert };
}
