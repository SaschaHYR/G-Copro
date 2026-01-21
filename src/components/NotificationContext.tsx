"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthProvider';
import { supabase } from '@/integrations/supabase/client';

interface NotificationContextType {
  notificationCount: number;
  markTicketAsRead: (ticketId: string) => void;
  hasNewActions: (ticketId: string) => boolean;
  resetNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notificationCount, setNotificationCount] = useState(0);
  const [readTickets, setReadTickets] = useState<Set<string>>(new Set());
  const { user } = useAuth();

  // Load read tickets from localStorage
  useEffect(() => {
    if (user) {
      const savedReadTickets = localStorage.getItem(`readTickets_${user.id}`);
      if (savedReadTickets) {
        setReadTickets(new Set(JSON.parse(savedReadTickets)));
      }
    }
  }, [user]);

  // Save read tickets to localStorage
  useEffect(() => {
    if (user && readTickets.size > 0) {
      localStorage.setItem(`readTickets_${user.id}`, JSON.stringify(Array.from(readTickets)));
    }
  }, [readTickets, user]);

  const markTicketAsRead = (ticketId: string) => {
    setReadTickets(prev => {
      const newSet = new Set(prev);
      newSet.add(ticketId);
      return newSet;
    });
    setNotificationCount(prev => Math.max(0, prev - 1));
  };

  const hasNewActions = (ticketId: string) => {
    return !readTickets.has(ticketId);
  };

  const resetNotifications = () => {
    setReadTickets(new Set());
    setNotificationCount(0);
  };

  // Listen for realtime updates on tickets
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('ticket_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tickets',
        },
        (payload) => {
          // Type guard for payload
          if (payload.new && typeof payload.new === 'object' && 'createur_id' in payload.new) {
            const newTicket = payload.new as { createur_id: string };
            // Only count updates from other users
            if (newTicket.createur_id !== user.id) {
              setNotificationCount(prev => prev + 1);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return (
    <NotificationContext.Provider
      value={{
        notificationCount,
        markTicketAsRead,
        hasNewActions,
        resetNotifications
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};