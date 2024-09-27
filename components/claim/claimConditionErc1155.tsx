'use client';
import { getActiveClaimCondition, nextTokenIdToMint,balanceOfBatch,getNFTs,setClaimConditions,getClaimConditionById, claimTo, } from "thirdweb/extensions/erc1155";

import Image from "next/image";
import { ConnectButton, MediaRenderer, TransactionButton, useActiveAccount, useReadContract } from "thirdweb/react";
import { defineChain, getContract, readContract, resolveMethod, ThirdwebContract, toEther } from "thirdweb";
import { getContractMetadata } from "thirdweb/extensions/common";
import { useCallback, useState, useEffect, useMemo, FC } from "react";
import client from "@/lib/client";
import { MARKETPLACE, NFT_COLLECTION } from "@/const/contracts";
import toastStyle from "@/util/toastConfig";
import toast from "react-hot-toast";
import { NFTCard } from "@/components/NFT/NftCardGalerie";
import { getAllValidAuctions, getAllValidListings, getAllValidOffers } from "thirdweb/extensions/marketplace";
import axios from "axios";
import styles from './claimApp.module.css';
import { ClaimCard } from "./ClaimConditionCard";


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

const ClaimConditonErc1155: FC<{ contractAddress: string; chainId: number }> = ({
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
    if (!account) return;
    setLoading(true);

    try {
      const ownedNFTs = await getNFTs({
        contract: contract,
      });

      const ids = ownedNFTs.map(nft => nft.id.toString());

      setOwnedNfts(prevState => ({
        ...prevState,
        contractAddress: ids
      }));
    } catch (err) {
    
      console.error("Error fetching owned NFTs:", err);
    } finally {
      setLoading(false);
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
        
        <div className={styles.nftListContainer}>
        <div className={styles.nftListWrapper}>
            {Object.values(ownedNfts).flat().map((id: string) => (
                <ClaimCard key={id} tokenId={BigInt(id)} contractAddress={contractAddress} chainId={4689} />
            ))}
            </div>

        </div>
      </div>
    </main>
  );
}



export default ClaimConditonErc1155;