import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

export default function useSocket({ onSnapshot, onTasks, onMilestones, onPresence, onActivity, onTyping }) {
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    const socket = io();
    socketRef.current = socket;

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    socket.on("board:snapshot", onSnapshot);
    socket.on("tasks:update", onTasks);
    socket.on("milestones:update", onMilestones);
    socket.on("presence:update", onPresence);
    socket.on("activity:add", onActivity);
    socket.on("typing", onTyping);

    return () => {
      socket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const emit = (event, payload) => socketRef.current?.emit(event, payload);

  return { connected, emit };
}