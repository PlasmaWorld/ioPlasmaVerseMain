"use client";

import React, { FC, useState, useEffect } from "react";
import { useActiveAccount } from "thirdweb/react";
import { DirectListing, EnglishAuction, Offer } from "thirdweb/extensions/marketplace";
import { useCurrency } from "@/Hooks/CurrencyProvider";

type INFTCardProps = {
  nft?: {
    tokenId: bigint;
    listing?: (DirectListing | EnglishAuction)[];
    offers?: Offer[];
  } | null;
  tokenId: bigint;
  contractAddress: string;
  refetchAllListings: () => void;
  refetchAllAuctions: () => void;
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
  nft,
  refetchAllListings,
  refetchAllAuctions,
}) => {
  const account = useActiveAccount();
  const { selectedCurrency } = useCurrency(); 

  const directListing = nft?.listing?.find(
    (l): l is DirectListing => 'currencyValuePerToken' in l && l.assetContractAddress === contractAddress && l.tokenId === tokenId
  );

  const auctionListing = nft?.listing?.find(
    (a): a is EnglishAuction => 'buyoutCurrencyValue' in a && a.assetContractAddress === contractAddress && a.tokenId === tokenId
  );

  useEffect(() => {
    console.log("Selected Currency:", selectedCurrency);
    console.log("Direct Listing:", directListing);
    console.log("Auction Listing:", auctionListing);
  }, [selectedCurrency, directListing, auctionListing]);

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
                      {directListing.currencyValuePerToken.displayValue} <span>IOTX</span>
                    </>
                  ) : directListing.currencyContractAddress === "0x3EA683354bf8d359cd9EC6E08B5AEC291D71d880" ? (
                    <>
                      {directListing.currencyValuePerToken.displayValue} <span>ioShiba</span>
                    </>
                  ) : directListing.currencyContractAddress === "0xdfF8596d62b6d35fFFfc9e465d2FDeA49Ac3c311" ? (
                    <>
                      {directListing.currencyValuePerToken.displayValue} <span>Depinny</span>
                    </>
                  ) :(
                    "Currency not supported"
                  )}
                </>
              )}
              {auctionListing && (
                <>
                  {formatPrice(auctionListing.buyoutCurrencyValue.displayValue, selectedCurrency.decimals)} <span>{selectedCurrency.symbol}</span>
                </>
              )}
            </div>
            {auctionListing && (
              <>
                <p className="mb-4 text-white/60" style={{ marginTop: 12 }}>Bids starting from</p>
                <div className="font-medium rounded-md font-lg text-white/90">
                  {formatPrice(auctionListing.minimumBidCurrencyValue.displayValue, selectedCurrency.decimals)} <span>{selectedCurrency.symbol}</span>
                </div>
              </>
            )}
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
