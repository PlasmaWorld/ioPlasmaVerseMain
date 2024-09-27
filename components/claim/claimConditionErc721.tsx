'use client';
import { getActiveClaimCondition, nextTokenIdToMint,getNFTs,setClaimConditions,getClaimConditionById, claimTo, } from "thirdweb/extensions/erc721";

import Image from "next/image";
import { ConnectButton, MediaRenderer, TransactionButton, useActiveAccount, useReadContract } from "thirdweb/react";
import { defineChain, getContract, readContract, resolveMethod, ThirdwebContract, toEther } from "thirdweb";
import { useCallback, useState, useEffect, useMemo, FC } from "react";
import client from "@/lib/client";
import { NFT as NFTType, Address } from "thirdweb";

import styles from './claimApp.module.css';
import { ClaimCard } from "./ClaimConditionCard";
import { ClaimCardErc721 } from "./ClaimConditionCardErc721";
import { NFTCard } from "../NFT/NftCardGalerie";


type ContractMetadata = {
  name: string;
  description: string;
  image: string;
  seller_fee_basis_points: number;
  fee_recipient: string;
  merkle: object;
  symbol: string;
  social_urls: Record<string, string>;
};

const ClaimConditonErc712: FC<{ contractAddress: string; chainId: number }> = ({
  contractAddress,
  chainId,
}) => {

  const account = useActiveAccount();
  const [loading, setLoading] = useState(false);
  const [ownedNfts, setOwnedNfts] = useState<{ [key: string]: string[] }>({});
  const [quantity, setQuantity] = useState(1);
  const NETWORK = defineChain(chainId);
  const [contractVersion, setContractVersion] = useState<string>("");
  const [ContractOwner, setGetOwner] = useState<string>("");
  const [ContractType, setContractType] = useState<string>("");
  const [getRoyaltyRecipient, setGetRoyaltyRecipient] = useState<string>("");
  const [getRoyaltyBps, setGetRoyaltyBps] = useState<string>("");
  const [nfts, setNfts] = useState<NFTType[]>([]);

  
  const chain = defineChain(4689);
  const address = account?.address;
  const [contractMetadataUri, setContractMetadata] = useState<ContractMetadata>({
    name: "",
    description: "",
    image: "",
    seller_fee_basis_points: 1,
    fee_recipient: "0x0000000000000000000000000000000000000000",
    merkle: {},
    symbol: "",
    social_urls: {}
  });
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
    <main className={styles.main}>
    <header className={styles.header}>
      <h1 className={styles.headerText}>
    Set the claim Condition for your Smart-Contract and manage everything you need without the need to code.
      </h1>
    </header>      <div className={styles.introText}>
        <ClaimCardErc721  tokenId={BigInt(1)} contractAddress={contractAddress} chainId={4689} />

        <div className={styles.nftListContainer}>
        <div className={styles.nftListWrapper}>
  {nfts.map((nft) => (
    <div key={nft.metadata.id} className={styles.nftCard}>
      {/* Displaying the NFT image */}
      <MediaRenderer client={client} src={nft.metadata.image} className={styles.nftImage} />
      <p className={styles.nftName}>{nft.metadata.name}</p>
    </div>
  ))}
</div>


        </div>
      </div>
    </main>
  );
}



export default ClaimConditonErc712;