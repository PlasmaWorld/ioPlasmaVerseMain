"use client";

import React, { createContext, useContext, useState, FC, ReactNode } from 'react';

interface Currency {
  symbol: string;
  decimals: number;
  address: string;
}

interface CurrencyContextProps {
  selectedCurrency: Currency;
  setSelectedCurrency: (currency: Currency) => void;
  currencies: Currency[];
}

const CurrencyContext = createContext<CurrencyContextProps | undefined>(undefined);

const currencies: Currency[] = [
  {
    symbol: 'IOTX',
    decimals: 18,
    address: '0x0000000000000000000000000000000000000000', // Native
  },
  {
    symbol: 'ioShiba',
    decimals: 9,
    address: '0x3ea683354bf8d359cd9ec6e08b5aec291d71d880', // ioShiba
  },
  // Add more currencies here as needed
];

export const CurrencyProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(currencies[0]);

  return (
    <CurrencyContext.Provider value={{ selectedCurrency, setSelectedCurrency, currencies }}>
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
