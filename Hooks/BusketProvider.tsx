"use client";

import React, { createContext, useContext, useState, FC, ReactNode } from 'react';

interface AllowlistProof {
  proof: string[];
  quantityLimitPerWallet: string;
  pricePerToken: string;
  currency: string;
}

interface Product {
  tokenId: bigint;
  product: string;
  price: number;
  size: string;
  quantity: number;
  image: string;
  allowlistProof: AllowlistProof;
  data: string;
}

interface BasketContextProps {
  basket: Product[];
  addProductToBasket: (product: Product) => void;
  removeProductFromBasket: (tokenId: bigint, size: string) => void;
  updateProductQuantity: (tokenId: bigint, size: string, quantity: number) => void;
}

const BasketContext = createContext<BasketContextProps | undefined>(undefined);

export const BasketProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [basket, setBasket] = useState<Product[]>([]);

  const addProductToBasket = (product: Product) => {
    setBasket((prevBasket) => {
      const existingProduct = prevBasket.find((p) => p.tokenId === product.tokenId && p.size === product.size);
      if (existingProduct) {
        return prevBasket.map((p) =>
          p.tokenId === product.tokenId && p.size === product.size
            ? { ...p, quantity: p.quantity + product.quantity }
            : p
        );
      }
      return [...prevBasket, product];
    });
  };

  const removeProductFromBasket = (tokenId: bigint, size: string) => {
    setBasket((prevBasket) => prevBasket.filter((p) => p.tokenId !== tokenId || p.size !== size));
  };

  const updateProductQuantity = (tokenId: bigint, size: string, quantity: number) => {
    setBasket((prevBasket) =>
      prevBasket.map((p) =>
        p.tokenId === tokenId && p.size === size
          ? { ...p, quantity }
          : p
      )
    );
  };

  return (
    <BasketContext.Provider value={{ basket, addProductToBasket, removeProductFromBasket, updateProductQuantity }}>
      {children}
    </BasketContext.Provider>
  );
};

export const useBasket = () => {
  const context = useContext(BasketContext);
  if (!context) {
    throw new Error('useBasket must be used within a BasketProvider');
  }
  return context;
};
