import React, { FC, useCallback, useState, useEffect } from "react";
import { useActiveAccount } from "thirdweb/react";
import { defineChain, getContract, ThirdwebContract, NFT as NFTType } from "thirdweb";
import { getNFTs } from "thirdweb/extensions/erc1155";
import { NFTCardErc1155Claim } from "./NftCard";
import styles from './claimApp.module.css';
import client from "@/lib/client";

const ClaimAppErc1155: FC<{ contractAddress: string; chainId: number }> = ({
  contractAddress,
  chainId,
}) => {
  const account = useActiveAccount();
  const [loading, setLoading] = useState(false);
  const [nfts, setNfts] = useState<NFTType[]>([]);

  const NETWORK = defineChain(chainId);
  
  const contract: ThirdwebContract = getContract({
    address: contractAddress,
    client,
    chain: NETWORK,
  });

  const fetchOwnedNFt = useCallback(async () => {
    if (!account) {
      console.log("No account connected. Aborting NFT fetch.");
      return;
    }
    
    console.log("Starting to fetch owned NFTs...");
    setLoading(true);
  
    try {
      console.log("Fetching NFTs from contract:", contract);
      const ownedNFTs = await getNFTs({
        contract: contract,
      });
      console.log("Owned NFTs fetched:", ownedNFTs);
      setNfts(ownedNFTs); // Set the entire array of NFTs
      
    } catch (err) {
      console.error("Error fetching owned NFTs:", err);
    } finally {
      setLoading(false);
      console.log("Finished fetching NFTs. Loading state:", loading);
    }
  }, [account, contract]);

  useEffect(() => {
    fetchOwnedNFt();
  }, [fetchOwnedNFt]);

  return (
    <div className="">
      <div className="my-8">
        <div className="flex flex-wrap items-center justify-center gap-8">
          {nfts.map((nft) => (
            <NFTCardErc1155Claim 
              key={nft.id.toString()} // Add a key prop to ensure unique identity
              tokenId={nft.id} 
              image={nft?.metadata.image || "/path-to-default-image.png"} // Provide a default image if undefined
              contractAddress={contractAddress} 
              chainId={chainId}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default ClaimAppErc1155;
