import { useState, useEffect, useCallback, useRef } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

/**
 * Custom hook for real-time admin notifications via SSE
 * 
 * Returns:
 *   - notifications: array of notification objects (newest first)
 *   - unreadCount: number of unread notifications
 *   - markAllRead: function to mark all notifications as read
 *   - clearAll: function to clear all notifications
 *   - connected: whether the SSE connection is active
 */
const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [connected, setConnected] = useState(false);
  const eventSourceRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  const connect = useCallback(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    // EventSource doesn't support custom headers, so we pass the token as a query param
    // The backend auth middleware will need to accept this
    const url = `${API_BASE_URL}/notifications/stream?token=${encodeURIComponent(token)}`;
    
    const eventSource = new EventSource(url);
    eventSourceRef.current = eventSource;

    eventSource.addEventListener('connected', () => {
      setConnected(true);
      console.log('[Notifications] SSE connected');
    });

    eventSource.addEventListener('new_transaction', (event) => {
      const data = JSON.parse(event.data);
      addNotification(data);
    });

    eventSource.addEventListener('payment_received', (event) => {
      const data = JSON.parse(event.data);
      addNotification(data);
    });

    eventSource.addEventListener('payment_expired', (event) => {
      const data = JSON.parse(event.data);
      addNotification(data);
    });

    eventSource.onerror = () => {
      setConnected(false);
      eventSource.close();

      // Reconnect after 5 seconds
      reconnectTimeoutRef.current = setTimeout(() => {
        console.log('[Notifications] Reconnecting...');
        connect();
      }, 5000);
    };
  }, []);

  const addNotification = useCallback((data) => {
    setNotifications((prev) => {
      const updated = [{ ...data, read: false, receivedAt: Date.now() }, ...prev];
      // Keep max 50 notifications
      return updated.slice(0, 50);
    });
    setUnreadCount((prev) => prev + 1);

    // Play notification sound (subtle beep)
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      gainNode.gain.value = 0.1;

      oscillator.start();
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
      oscillator.stop(audioCtx.currentTime + 0.3);
    } catch {
      // Ignore audio errors
    }
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  useEffect(() => {
    connect();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connect]);

  return {
    notifications,
    unreadCount,
    markAllRead,
    clearAll,
    connected,
  };
};

export default useNotifications;
