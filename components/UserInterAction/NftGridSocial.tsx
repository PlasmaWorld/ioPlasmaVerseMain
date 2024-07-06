"use client";

import React, { useEffect, useState } from 'react';
import { Helmet } from "react-helmet";
import { NFTCard } from './NftCardSocial';
import styles from "./NftSocial.module.css";
import { BigNumber } from 'ethers';
import { getNFTs } from 'thirdweb/extensions/erc721';
import { NFT } from "thirdweb";
import { useReadContract } from 'thirdweb/react';
import useDebounce from '@/const/useDebounce';
import { AppMint, socialChatContract } from '@/const/contracts';

const defaultPlaceholder = "/path/to/default-placeholder.png";

export default function CommunityChat() {
  const nftsPerPage = 30;
  const [search, setSearch] = useState("");
  const debouncedSearchTerm = useDebounce(search, 500);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nfts, setNfts] = useState<NFT[]>([]); // State to store fetched NFTs
  const BURN_WALLET_ADDRESS = "0xD424730cBE3B711d45e54B5caD63acb344068BD2";
  
  

  useEffect(() => {
    async function fetchNFTs() {
      setIsLoading(true);
      try {
        const fetchedNFTs = await getNFTs({
          contract: socialChatContract,
          count: nftsPerPage,
          includeOwners: true,
        });
  
        const validNFTs = fetchedNFTs.filter(nft => {
          const hasOwner = nft.owner && nft.owner !== BURN_WALLET_ADDRESS;
          const hasData = nft.metadata && nft.metadata.image && nft.metadata.name;
          return hasOwner && hasData; 
        });

        const sortetNfts = validNFTs.sort((a, b) => {
          if (b.id > a.id) {
            return 1;
          } else if (a.id > b.id) {
            return -1;
          } else {
            return 0;
          }
        });
        
  
        setNfts(sortetNfts as NFT[]);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("An unknown error occurred");
        }
      } finally {
        setIsLoading(false);
      }
    }
  
    fetchNFTs();
  }, [debouncedSearchTerm, nftsPerPage]);
  
  
  

  return (
    <div className="m-0  p-0 font-inter text-neutral-200">
      <Helmet>
        <title>NFT Community Chat</title>
      </Helmet>

      <div className="z-20 mx-auto min-h-screen w-full flex-col px-4">
        {isLoading ? (
          <div>Loading NFTs...</div>
        ) : (
          <div className={styles.nftContainer}>
            {nfts.map(nft => (  
               <NFTCard
               key={nft.id.toString()}
               tokenId={BigNumber.from(nft.id)} 
               imageUrl={nft.metadata.image || defaultPlaceholder}
               name={nft.metadata.name || 'Unnamed NFT'} 
               description={nft.metadata.description || 'No description available.'} 
               ownerAddress={nft.owner || 'Unknown Owner'} 
             />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}