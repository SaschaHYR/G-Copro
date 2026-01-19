"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface TicketFilterContextType {
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  coproFilter: string;
  setCoproFilter: (copro: string) => void;
  periodFilter: string;
  setPeriodFilter: (period: string) => void;
}

const TicketFilterContext = createContext<TicketFilterContextType | undefined>(undefined);

export const TicketFilterProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [statusFilter, setStatusFilter] = useState('');
  const [coproFilter, setCoproFilter] = useState('');
  const [periodFilter, setPeriodFilter] = useState('');

  return (
    <TicketFilterContext.Provider
      value={{
        statusFilter,
        setStatusFilter,
        coproFilter,
        setCoproFilter,
        periodFilter,
        setPeriodFilter,
      }}
    >
      {children}
    </TicketFilterContext.Provider>
  );
};

export const useTicketFilters = () => {
  const context = useContext(TicketFilterContext);
  if (context === undefined) {
    throw new Error('useTicketFilters must be used within a TicketFilterProvider');
  }
  return context;
};