"use client";

import type { Address, NFT as NFTType } from "thirdweb";
import React, { useMemo, useState } from "react";
import { Offer } from "thirdweb/extensions/marketplace";
import { NFTCard } from "./NftCardMarketplace";
import { LoadingNFTComponent } from "./NFT";
import { PaginationHelperProfile } from "../NFT/PaginationProfile";
import { ListingStatus } from "@/customDirectListing/DirectListingListingStatis";

// Ensure types match your data
interface EnglishAuction {
  id: bigint;
  creatorAddress: Address;
  assetContractAddress: Address;
  tokenId: bigint;
  quantity: bigint;
  currencyContractAddress: Address;
  minimumBidAmount: bigint;
  minimumBidCurrencyValue: string; // GetBalanceResult
  buyoutBidAmount: bigint;
  buyoutCurrencyValue: string; // GetBalanceResult 
  timeBufferInSeconds: bigint;
  bidBufferBps: bigint;
  startTimeInSeconds: bigint;
  endTimeInSeconds: bigint;
  status: ListingStatus;
}

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
  status: ListingStatus;
}

type Props = {
  ownedNfts2?: { [key: string]: number[] };
  
  nftData?: {
    tokenId: bigint;
    contractAddress: Address; // Ensure this is compatible with your data
    listing?: DirectListing[];
    auction?: EnglishAuction[];
  }[];
  overrideOnclickBehavior?: (nft: NFTType) => void;
  emptyText?: string;
};

export default function NFTGrid({
  ownedNfts2,
  
  nftData = [],
  overrideOnclickBehavior,
  emptyText = "No NFTs found for this collection.",
}: Props) {
  const nftsPerPage = 20;
  const [page, setPage] = useState(1);

  

  // If nftData is provided and there are no owned NFTs, show marketplace NFTs grid
  if (nftData.length > 0) {
    return (
      <div className="grid justify-start grid-cols-1 gap-6 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-2">
        {nftData.map((data) => (
          <NFTCard
            key={data.tokenId.toString()}
            tokenId={data.tokenId}
            contractAddresse={data.contractAddress.toString()} chainId={0}          />
        ))}

      </div>
    );
  }

  // If neither ownedNfts2 nor nftData is provided, show empty state
  return (
    <div className="flex justify-center items-center h-[500px]">
      <p className="max-w-lg text-lg font-semibold text-center text-white/60">
        {emptyText}
      </p>
    </div>
  );
}

export function NFTGridLoading() {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {[...Array(20)].map((_, index) => (
        <LoadingNFTComponent key={index} />
      ))}
    </div>
  );
}
