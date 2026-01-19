"use client";

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { useTicketFilters } from '@/contexts/TicketFilterContext';
import { Ticket } from '@/types';
import { useCallback } from 'react';

export const useTickets = () => {
  const { user } = useAuth();
  const { statusFilter, coproFilter, periodFilter } = useTicketFilters();
  const queryClient = useQueryClient();

  const fetchTickets = useCallback(async () => {
    if (!user) {
      return [];
    }

    let query = supabase
      .from('tickets')
      .select('*, createur:user_informations!createur_id(first_name, last_name), cloture_par_user:user_informations!cloture_par(first_name, last_name)');

    // Apply role-based filtering
    if (user.role === 'Proprietaire') {
      query = query.eq('createur_id', user.id);
    } else if (user.role === 'Conseil_Syndical') {
      query = query.eq('copro', user.copro).in('destinataire_role', ['Conseil_Syndical', 'Proprietaire']);
    } else if (user.role === 'Syndicat_Copropriete') {
      query = query.eq('copro', user.copro).in('destinataire_role', ['Syndicat_Copropriete', 'Conseil_Syndical']);
    } else if (user.role === 'ASL' || user.role === 'Superadmin') {
      // ASL and Superadmin can see all tickets
    } else {
      // For 'En attente' or other roles, return empty array without making API call
      return [];
    }

    // Apply additional filters from sidebar
    if (statusFilter && statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }
    if (coproFilter && coproFilter !== 'all') {
      query = query.eq('copro', coproFilter);
    }
    if (periodFilter && periodFilter !== 'all') {
      const now = new Date();
      const days = parseInt(periodFilter);
      if (!isNaN(days)) {
        const cutoffDate = new Date(now.setDate(now.getDate() - days)).toISOString();
        query = query.gte('date_create', cutoffDate);
      }
    }

    const { data, error } = await query.order('date_create', { ascending: false });

    if (error) {
      throw error;
    }
    return data as Ticket[];
  }, [user, statusFilter, coproFilter, periodFilter]);

  const { data, isLoading, error, refetch } = useQuery<Ticket[], Error>({
    queryKey: ['tickets', user?.id, statusFilter, coproFilter, periodFilter],
    queryFn: fetchTickets,
    enabled: !!user, // Only run query if user is authenticated
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2, // Only retry twice before giving up
  });

  const invalidateTickets = () => {
    queryClient.invalidateQueries({ queryKey: ['tickets'] });
  };

  return {
    tickets: data || [],
    isLoading,
    error,
    refetch,
    invalidateTickets,
  };
};