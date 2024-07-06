"use client";
import type { Address, NFT as NFTType } from "thirdweb";
import React, { useMemo, useState } from "react";
import { DirectListing, EnglishAuction, Offer } from "thirdweb/extensions/marketplace";
import { NFTCard } from "./NftCardMarketplace";
import { LoadingNFTComponent } from "./NFT";
import { PaginationHelperProfile } from "../NFT/PaginationProfile";

type Props = {
  ownedNfts2?: { [key: string]: number[] };
  nftData?: {
    tokenId: bigint;
    listing?: (DirectListing | EnglishAuction)[];
    offers?: Offer[];
  }[];
  overrideOnclickBehavior?: (nft: NFTType) => void;
  emptyText?: string;
  refetchAllListings: () => void;
  refetchAllAuctions: () => void;
  refetchAllOffers: () => void;
};

export default function NFTGrid({
  ownedNfts2,
  nftData = [],
  overrideOnclickBehavior,
  emptyText = "No NFTs found for this collection.",
  refetchAllListings,
  refetchAllAuctions,
  refetchAllOffers,
}: Props) {
  const nftsPerPage = 20;
  const [page, setPage] = useState(1);

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
            const marketData = nftData.find(
              (nft) =>
                nft.tokenId === BigInt(id) &&
                nft.listing?.some((listing) => listing.assetContractAddress === contractAddress)
            );
            return (
              <NFTCard
                key={`${contractAddress}_${id}`}
                tokenId={BigInt(id)}
                contractAddresse={contractAddress}
                overrideOnclickBehavior={overrideOnclickBehavior}
                refetchAllListings={refetchAllListings}
                refetchAllAuctions={refetchAllAuctions}
                refetchAllOffers={refetchAllOffers}
                nft={marketData || null} // Pass marketData if available, otherwise null
              />
            );
          })}
        </div>
        <PaginationHelperProfile totalSupplProfile={totalNfts} setPage={setPage} />
      </div>
    );
  }

  // If nftData is provided and there are no owned NFTs, show marketplace NFTs grid
  if (nftData.length > 0) {
    return (
      <div className="grid justify-start grid-cols-1 gap-6 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-2">
        {nftData.map((data) => (
          <NFTCard
            key={data.tokenId.toString()}
            nft={data}
            overrideOnclickBehavior={overrideOnclickBehavior}
            refetchAllListings={refetchAllListings}
            refetchAllAuctions={refetchAllAuctions}
            refetchAllOffers={refetchAllOffers}
          />
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
