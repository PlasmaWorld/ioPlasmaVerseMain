"use client";

import React, { useState, useEffect } from "react";
import { getContract, ThirdwebContract, NFT as NFTType } from "thirdweb";
import { useMarketplaceData } from "@/Hooks/MarketProvider";
import { NFTCard } from "../NFT/NftCardMarketplace";
import { Address } from "thirdweb";
import styles from "./listingGrid.module.css";
import { ListingStatus } from "@/customDirectListing/DirectListingListingStatis";

type Props = {
  marketplace: ThirdwebContract;
  collection: ThirdwebContract;
  overrideOnclickBehavior?: (nft: NFTType) => void;
  emptyText: string;
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

type NFTData = {
  tokenId: bigint;
  contractAddress: `0x${string}`;
  listing?: DirectListing;
  auction?: EnglishAuction;
};

export default function ListingGrid(props: Props) {
  const [nftData, setNftData] = useState<NFTData[]>([]);
  const [activeTab, setActiveTab] = useState<'listings' | 'auctions'>('listings');

  const { validListings, validAuctions } = useMarketplaceData();

  useEffect(() => {
    const fetchData = async () => {
      const listingsData = validListings.map(listing => ({
        tokenId: listing.tokenId,
        contractAddress: listing.assetContractAddress,
        listing,
      }));

      const auctionsData = validAuctions.map(auction => ({
        tokenId: auction.tokenId,
        contractAddress: auction.assetContractAddress,
        auction,
      }));

      setNftData([...listingsData, ...auctionsData]);
    };

    fetchData();
  }, [validListings, validAuctions]);

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <button onClick={() => setActiveTab('listings')}>Direct Listings</button>
        <button onClick={() => setActiveTab('auctions')}>Auctions</button>
      </div>
      <div className={styles.nftContainer}>
        <div className={styles.nftGrid}>
          {nftData
            .filter(data => activeTab === 'listings' ? data.listing : data.auction)
            .map(data => (
              <NFTCard
                key={data.tokenId.toString()}
                tokenId={data.tokenId}
                contractAddresse={data.contractAddress.toString()}
                chainId={4689}
              />
            ))}
        </div>
      </div>
    </div>
  );
}
