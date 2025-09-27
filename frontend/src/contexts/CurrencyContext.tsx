"use client"

import React, { createContext, useContext, useEffect, useState } from 'react';
import { currencyService, CurrencyInfo, CurrencySettings } from '../services/currencyService';
import { useAuth } from './AuthContext';

interface CurrencyContextType {
  userCurrency: CurrencySettings | null;
  currencyInfo: CurrencyInfo | null;
  isLoading: boolean;
  refreshCurrency: () => Promise<void>;
  formatAmount: (amountCents: number) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userCurrency, setUserCurrency] = useState<CurrencySettings | null>(null);
  const [currencyInfo, setCurrencyInfo] = useState<CurrencyInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  const fetchUserCurrency = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const currency = await currencyService.getCurrentUserCurrency();
      setUserCurrency(currency);
      setCurrencyInfo({
        code: currency.currency_code,
        symbol: currency.currency_symbol,
        decimal_places: currency.decimal_places
      });
    } catch (error) {
      console.error('Failed to fetch user currency:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatAmount = (amountCents: number): string => {
    if (!currencyInfo) return `${amountCents} cents`;

    const amount = amountCents / Math.pow(10, currencyInfo.decimal_places);
    return `${currencyInfo.symbol}${amount.toFixed(currencyInfo.decimal_places)}`;
  };

  useEffect(() => {
    fetchUserCurrency();
  }, [user]);

  return (
    <CurrencyContext.Provider
      value={{
        userCurrency,
        currencyInfo,
        isLoading,
        refreshCurrency: fetchUserCurrency,
        formatAmount
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};