"use client";

import React, { FC, useState, useEffect } from "react";
import { useActiveAccount } from "thirdweb/react";
import { DirectListing, EnglishAuction, Offer } from "thirdweb/extensions/marketplace";
import { useCurrency } from "@/Hooks/CurrencyProvider";

type INFTCardProps = {
    price: number;
    
};

interface Currency {
  symbol: string;
  decimals: number;
  address: string;
}

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

const INPUT_STYLES = "block w-full py-3 px-4 mb-4 bg-transparent border border-white text-base box-shadow-md rounded-lg mb-4";
const LEGEND_STYLES = "mb-2 text-white/80";

export const NftInformationPrice: FC<INFTCardProps> = ({
    price,
  
}) => {
  const account = useActiveAccount();
  const { selectedCurrency } = useCurrency(); 

  

  

  const formatPrice = (price: string, decimals: number) => {
    const priceInSmallestUnit = BigInt(price);
    const formattedPrice = (priceInSmallestUnit / BigInt(10 ** decimals)).toString();
    return formattedPrice;
  };

  return (
    
          <div className="p-4 rounded-lg w-full ">
            <p className="mb-1 text-white/60">Price</p>
            <div className="text-lg font-medium rounded-md text-white/90">
                    <>
                      {price} <span>USDC</span>
                    </>
                  
              
              
            
       
      </div>
    </div>
  );
};
