"use client";

import React, { FC, useState, useEffect, useMemo } from "react";
import { useActiveAccount } from "thirdweb/react";
import { useCurrency } from "@/Hooks/CurrencyProvider";
import { useMarketplaceData } from "@/Hooks/MarketProvider";
import { ListingStatus } from "@/customDirectListing/DirectListingListingStatis";
import { Address } from "thirdweb";

interface DirectListing {
  id: bigint;
  creatorAddress: Address;
  assetContractAddress: Address;
  tokenId: bigint;
  quantity: bigint;
  currencyContractAddress: Address;
  currencySymbol: string;
  pricePerToken: string;
  startTimeInSeconds: bigint;
  endTimeInSeconds: bigint;
  isReservedListing: boolean;
  status: number;
}
interface EnglishAuction {
  id: bigint;
  creatorAddress: Address;
  assetContractAddress: Address;
  tokenId: bigint;
  quantity: bigint;
  currencyContractAddress: Address;
  minimumBidAmount: bigint;
  minimumBidCurrencyValue: string;
  buyoutBidAmount: bigint;
  buyoutCurrencyValue: string;
  timeBufferInSeconds: bigint;
  bidBufferBps: bigint;
  startTimeInSeconds: bigint;
  endTimeInSeconds: bigint;
  status: ListingStatus;
}

type INFTCardProps = {
  nft?: {
    tokenId: bigint;
    listing?: (DirectListing | EnglishAuction)[];
  } | null;
  tokenId: bigint;
  contractAddress: string;
  extraProp: string;

  
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
  contractAddress,
  tokenId,
  nft,extraProp
  
}) => {
  const account = useActiveAccount();
  const { selectedCurrency } = useCurrency(); 
  const { validListings, validAuctions } = useMarketplaceData();
  
  const directListing = useMemo(() => 
    validListings?.find(
      (l): l is DirectListing => l.assetContractAddress === contractAddress && l.tokenId === tokenId
    ), 
    [validListings, contractAddress, tokenId]
  );
  

  const auctionListing = useMemo(() => 
    validAuctions?.find(
      (l): l is EnglishAuction => l.assetContractAddress === contractAddress && l.tokenId === tokenId
    ), 
    [validAuctions, contractAddress, tokenId]  );


  const formatPrice = (price: string, decimals: number) => {
    const priceInSmallestUnit = BigInt(price);
    const formattedPrice = (priceInSmallestUnit / BigInt(10 ** decimals)).toString();
    return formattedPrice;
  };

  return (
    <div>
      <div>
        {directListing || auctionListing ? (
          <div className="p-4 rounded-lg w-full ">
            <p className="mb-1 text-white/60">Price</p>
            <div className="text-lg font-medium rounded-md text-white/90">
              {directListing && (
                <>
                  {directListing.currencyContractAddress === "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" ? (
                    <>
                      {directListing.pricePerToken} <span>IOTX</span>
                    </>
                  ) : directListing.currencyContractAddress === "0x3EA683354bf8d359cd9EC6E08B5AEC291D71d880" ? (
                    <>
                      {directListing.pricePerToken} <span>ioShiba</span>
                    </>
                  ) : directListing.currencyContractAddress === "0xdfF8596d62b6d35fFFfc9e465d2FDeA49Ac3c311" ? (
                    <>
                      {directListing.pricePerToken} <span>Depinny</span>
                    </>
                  ) :(
                    "Currency not supported"
                  )}
                </>
              )}
              {auctionListing && (
                <>
                  {auctionListing.minimumBidCurrencyValue} <span>{selectedCurrency.symbol}</span>
                </>
              )}
            </div>
           
          </div>
        ) : (
          <div className="p-4 rounded-lg w-full bg-white/[.04]">
            <p className="mb-1 text-white/60">Price</p>
            <div className="text-lg font-medium rounded-md text-white/90">
              Not for sale
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
