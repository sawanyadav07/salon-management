import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';
import { toast } from 'react-toastify';
import { socketURL } from '../config/api';

const LOW_STOCK_VOICE_KEY = 'salonpro-low-stock-voice-enabled';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [lowStockVoiceEnabled, setLowStockVoiceEnabled] = useState(() => localStorage.getItem(LOW_STOCK_VOICE_KEY) !== 'false');

  useEffect(() => {
    localStorage.setItem(LOW_STOCK_VOICE_KEY, String(lowStockVoiceEnabled));
  }, [lowStockVoiceEnabled]);

  useEffect(() => {
    const socket = io(socketURL, {
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

      if (payload.type === 'inventory-low-stock' && lowStockVoiceEnabled && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(payload.message || payload.title || 'Inventory stock is low.');
        utterance.lang = 'en-IN';
        utterance.rate = 0.95;
        window.speechSynthesis.speak(utterance);
      }

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
  }, [lowStockVoiceEnabled]);

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.read).length,
    [notifications]
  );

  const markAllRead = () =>
    setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAllRead, lowStockVoiceEnabled, setLowStockVoiceEnabled }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
