'use client';

import Image from "next/image";
import { ConnectButton, MediaRenderer, TransactionButton, useActiveAccount, useReadContract } from "thirdweb/react";
import { defineChain, getContract, readContract, resolveMethod, ThirdwebContract, toEther } from "thirdweb";
import { getContractMetadata } from "thirdweb/extensions/common";
import { claimTo, getActiveClaimCondition, getOwnedNFTs, getTotalClaimedSupply, nextTokenIdToMint } from "thirdweb/extensions/erc721";
import { useCallback, useState, useEffect, useMemo, FC } from "react";
import client from "@/lib/client";
import { MARKETPLACE, NFT_COLLECTION } from "@/const/contracts";
import toastStyle from "@/util/toastConfig";
import toast from "react-hot-toast";
import { NFTCard } from "@/components/NFT/NftCardGalerie";
import { getAllValidAuctions, getAllValidListings, getAllValidOffers } from "thirdweb/extensions/marketplace";
import axios from "axios";
import styles from './claimApp.module.css';


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

const ClaimAppGalerie: FC<{ contractAddress: string; chainId: number }> = ({
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
      const ownedNFTs = await getOwnedNFTs({
        contract: contract,
        owner: account.address,
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

  const { data: contractMetadata, isLoading: isContractMetadataLoading } = useReadContract(getContractMetadata, {
    contract: contract
  });

  const { data: claimedSupply, isLoading: isClaimedSupplyLoading } = useReadContract(getTotalClaimedSupply, {
    contract: contract
  });

  const { data: totalNFTSupply, isLoading: isTotalSupplyLoading } = useReadContract(nextTokenIdToMint, {
    contract: contract
  });

  const { data: claimCondition } = useReadContract(getActiveClaimCondition, {
    contract: contract
  });

  const getPrice = (quantity: number) => {
    const total = quantity * parseInt(claimCondition?.pricePerToken.toString() || "0");
    return toEther(BigInt(total));
  };

  useEffect(() => {
    fetchOwnedNFt();
  }, [fetchOwnedNFt]);

  const handleReadContract = async (methodName: string, params: any[]) => {
    try {
      const resolvedMethod = await resolveMethod(methodName);
      if (!resolvedMethod) {
        throw new Error("Failed to resolve method");
      }
      const result = await readContract({
        contract,
        method: resolvedMethod,
        params,
      });

      console.log(`Result of ${methodName}:`, result);
      return result;
    } catch (error) {
      console.error(`Error reading contract for ${methodName}:`, error);
      throw error;
    }
  };

  const handleReadowner = async () => {
    try {
      const result = await handleReadContract("owner", []);
      if (typeof result === "string") {
        setGetOwner(result);
      } else {
        console.error("Unexpected result type:", result);
      }
    } catch (error) {
      console.error("Error reading owner:", error);
    }
  };

  const handleReadgetDefaultRoyaltyInfo = async () => {
    const result = await handleReadContract("getDefaultRoyaltyInfo", []);
    setGetRoyaltyRecipient(result[0] as string);
    setGetRoyaltyBps(result[1] as string);
  };

  const handleReadcontractType = async () => {
    try {
      const result = await handleReadContract("contractType", []);
      if (typeof result === "string") {
        setContractType(result);
      } else {
        console.error("Unexpected result type:", result);
      }
    } catch (error) {
      console.error("Error reading contract type:", error);
    }
  };

  const handleReadContractURITest = async () => {
    try {
      const result = await handleReadContract("contractURI", []) as unknown;
      
      // Detailed logging of result
      console.log("Raw result from handleReadContract:", result);
      
      // Ensure metadataUri is a string and correctly formatted
      if (typeof result === 'string' && result.startsWith("ipfs://")) {
        const gatewayUrl = result.replace("ipfs://", "https://ipfs.io/ipfs/");
        console.log("Fetching metadata from IPFS URL:", gatewayUrl);
  
        try {
          const response = await axios.get(gatewayUrl);
          
          // Logging the response status and data
          console.log("HTTP response status:", response.status);
          console.log("HTTP response data:", response.data);
          
          if (response.status !== 200) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
  
          const metadata = response.data;
          
          // Logging the fetched metadata
          console.log("Fetched metadata:", metadata);
  
          setContractMetadata({
            name: metadata.name,
            description: metadata.description,
            image: metadata.image,
            seller_fee_basis_points: metadata.seller_fee_basis_points,
            fee_recipient: metadata.fee_recipient,
            merkle: metadata.merkle,
            symbol: metadata.symbol,
            social_urls: metadata.social_urls || []
          });
        } catch (fetchError) {
          console.error("Error fetching metadata:", fetchError);
        }
      } else {
        console.error("Invalid metadata URI:", result);
      }
    } catch (error) {
      console.error("Error fetching metadata:", error);
    }
  };

  useEffect(() => {
    handleReadowner();
  }, [contractAddress, chainId]);

  useEffect(() => {
    handleReadgetDefaultRoyaltyInfo();
  }, [contractAddress, chainId]);

  useEffect(() => {
    handleReadcontractType();
  }, [contractAddress, chainId]);

  useEffect(() => {
    handleReadContractURITest();
  }, [contractAddress, chainId]);

  return (
    <main className={styles.main}>
    <header className={styles.header}>
      <h1 className={styles.headerText}>
      {contractMetadataUri?.name || contractMetadata?.name}
      </h1>
    </header>      <div className={styles.introText}>
        <p>
                   {contractMetadataUri?.description || contractMetadata?.description} 

        </p>
      </div>
      <div className={styles.py20TextCenter}> 
        <div className={styles.claimCard}>
          {isContractMetadataLoading ? (
            <p className={styles.loading}>Loading...</p>
          ) : (
            <>
              <MediaRenderer
                client={client}
                src={contractMetadataUri?.image || contractMetadata?.image}
                className={styles.mediaRenderer}
              />
              <h2 className={styles.claimCardTitle}>
                {contractMetadata?.name}
              </h2>
              <p className={styles.claimCardDescription}>
              <p>Contract Owner: {ContractOwner}</p>
              <p>Contract Symbol: {contractMetadataUri.symbol}</p>
                </p>
            </>
          )}
          {isClaimedSupplyLoading || isTotalSupplyLoading ? (
            <p className={styles.loading}>Loading...</p>
          ) : (
            <p className={styles.claimedSupply}>
              Total NFT Supply: {claimedSupply?.toString()}/{totalNFTSupply?.toString()}
            </p>
          )}
          <div className={styles.quantitySelector}>
            <button
              className={styles.quantityButton}
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
            >-</button>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value))}
              className={styles.quantityInput}
            />
            <button
              className={styles.quantityButton}
              onClick={() => setQuantity(quantity + 1)}
            >+</button>
          </div>
          { address && (
            <TransactionButton
            transaction={() => claimTo({
              contract: contract,
              to: address,
              quantity: BigInt(quantity),
            })}
            onTransactionConfirmed={async () => {
              alert("NFT Claimed!");
              setQuantity(1);
              fetchOwnedNFt();
            }}
          >
            {`Claim NFT (${getPrice(quantity)} IoTeX)`}
          </TransactionButton>                
            )}
          
        </div>
        <div className={styles.nftListContainer}>
          <div className={styles.nftListWrapper}>
            {ownedNfts["0x0c5AB026d74C451376A4798342a685a0e99a5bEe"]?.map(id => (
              <NFTCard key={id} tokenId={BigInt(id)} contractAddresse={"0x0c5AB026d74C451376A4798342a685a0e99a5bEe"} chainId={4689} event={[]}/>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}



export default ClaimAppGalerie;