"use client";
import type { Address } from "thirdweb";
import React, { useMemo, useState } from "react";
import { EnglishAuction, Offer } from "thirdweb/extensions/marketplace";
import { NFTCard } from "./NftCardGalerie";
import { LoadingNFTComponent } from "./NFT";
import { PaginationHelperProfile } from "../NFT/PaginationProfile";
import { ListingStatus } from "@/customDirectListing/DirectListingListingStatis";
import { useMarketplaceData } from "@/Hooks/MarketProvider";

type Props = {
  ownedNfts2?: { [key: string]: number[] };
};

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

export default function NFTGridProfile({
  ownedNfts2,
}: Props) {
  const nftsPerPage = 20;
  const [page, setPage] = useState(1);

  const { validListings } = useMarketplaceData();

  const totalNfts = useMemo(() => {
    return ownedNfts2 ? Object.values(ownedNfts2).flat().length : 0;
  }, [ownedNfts2]);

  const paginatedNfts = useMemo(() => {
    if (!ownedNfts2) return [];
    const allNfts = Object.entries(ownedNfts2).flatMap(([contractAddress, nftIds]) =>
      nftIds.map((id) => ({ contractAddress, id }))
    );
    const start = (page - 1) * nftsPerPage;
    const end = start + nftsPerPage;
    return allNfts.slice(start, end);
  }, [ownedNfts2, page, nftsPerPage]);

  // If ownedNfts2 is provided, show owned NFTs grid
  if (ownedNfts2 && totalNfts > 0) {
    return (
      <div>
        <div className="grid justify-start grid-cols-1 gap-6 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-2">
          {paginatedNfts.map(({ contractAddress, id }) => {
            const marketData = validListings.find(
              (listing: DirectListing) =>
                listing.tokenId === BigInt(id) &&
                listing.assetContractAddress === contractAddress
            );
            return (
              <NFTCard
                key={`${contractAddress}_${id}`}
                tokenId={BigInt(id)}
                contractAddresse={contractAddress}
                chainId={4689}
                event={[]}
              />
            );
          })}
        </div>
        <PaginationHelperProfile totalSupplProfile={totalNfts} setPage={setPage} />
      </div>
    );
  }

  // If nftData is provided and there are no owned NFTs, show marketplace NFTs grid
  // If neither ownedNfts2 nor nftData is provided, show empty state
  return (
    <div className="flex justify-center items-center h-[500px]">
      <p className="max-w-lg text-lg font-semibold text-center text-white/60">
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
