import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';
import { toast } from 'react-toastify';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const socket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000', {
      transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
      // keep this log as earlier behavior for quick socket debug
      console.log('notification socket connected');
    });

    socket.on('notification', (payload) => {
      const item = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        read: false,
        ...payload
      };

      setNotifications((prev) => [item, ...prev].slice(0, 30));
      toast.info(payload.title || 'New notification');

      // Notification sound (same behavior as before)
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        const ctx = new AudioCtx();
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(880, ctx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.3);
        gainNode.gain.setValueAtTime(0.4, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.5);
      } catch {
        // no-op
      }
    });

    return () => socket.disconnect();
  }, []);

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.read).length,
    [notifications]
  );

  const markAllRead = () =>
    setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAllRead }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
