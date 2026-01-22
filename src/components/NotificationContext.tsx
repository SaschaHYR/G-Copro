"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Commentaire } from '@/types'; // Only import Commentaire since Ticket is not used

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
    } else if (user && readTickets.size === 0) {
      // Clear localStorage if all tickets are read
      localStorage.removeItem(`readTickets_${user.id}`);
    }
  }, [readTickets, user]);

  const markTicketAsRead = useCallback((ticketId: string) => {
    setReadTickets(prev => {
      const newSet = new Set(prev);
      if (!newSet.has(ticketId)) {
        newSet.add(ticketId);
        setNotificationCount(prevCount => Math.max(0, prevCount - 1));
      }
      return newSet;
    });
  }, []);

  const hasNewActions = useCallback((ticketId: string) => {
    return !readTickets.has(ticketId);
  }, [readTickets]);

  const resetNotifications = useCallback(() => {
    setReadTickets(new Set());
    setNotificationCount(0);
  }, []);

  // Initial fetch and realtime listener for notifications
  useEffect(() => {
    if (!user) {
      setNotificationCount(0);
      return;
    }

    const fetchInitialNotifications = async () => {
      // Fetch tickets where the current user is the creator or involved in the recipient role
      const { data: userTicketsData, error: ticketsError } = await supabase
        .from('tickets')
        .select('id, createur_id, destinataire_role, copro')
        .or(`createur_id.eq.${user.id},destinataire_role.eq.${user.role}`); // Simplified for example, adjust as needed

      if (ticketsError) {
        console.error("[NotificationContext] Error fetching user tickets:", ticketsError);
        return;
      }

      let unreadCount = 0;
      const newReadTickets = new Set(readTickets); // Use a mutable copy for this calculation

      for (const ticket of userTicketsData || []) {
        // Fetch the latest comment for each ticket
        const { data: latestCommentData, error: commentError } = await supabase
          .from('commentaires')
          .select('auteur, date')
          .eq('ticket_id', ticket.id)
          .order('date', { ascending: false })
          .limit(1); // Changed from .single() to .limit(1)

        if (commentError) {
          console.error(`[NotificationContext] Error fetching latest comment for ticket ${ticket.id}:`, commentError);
          continue;
        }
        
        const latestComment = latestCommentData?.[0]; // Get the first item if data exists

        if (latestComment) {
          // Check if the latest action was by another user and the ticket is not marked as read
          if (latestComment.auteur !== user.id && !newReadTickets.has(ticket.id)) {
            unreadCount++;
          }
        }
      }
      setNotificationCount(unreadCount);
    };

    fetchInitialNotifications();

    // Realtime listener for new comments
    const commentsChannel = supabase
      .channel('new_comments')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'commentaires',
        },
        async (payload) => {
          if (payload.new && typeof payload.new === 'object' && 'auteur' in payload.new && 'ticket_id' in payload.new) {
            const newComment = payload.new as Commentaire;
            // Check if the new comment is from another user and the ticket is not yet read
            if (newComment.auteur !== user.id && !readTickets.has(newComment.ticket_id)) {
              // Also ensure the ticket is relevant to the current user (e.g., they are the creator or recipient)
              const { data: ticketDataResult, error: ticketError } = await supabase
                .from('tickets')
                .select('id, createur_id, destinataire_role')
                .eq('id', newComment.ticket_id)
                .single();

              if (ticketError) {
                console.error("[NotificationContext] Error fetching ticket for new comment:", ticketError);
                return;
              }

              if (ticketDataResult && (ticketDataResult.createur_id === user.id || ticketDataResult.destinataire_role === user.role)) {
                setNotificationCount(prev => prev + 1);
              }
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(commentsChannel);
    };
  }, [user, readTickets, markTicketAsRead]);

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