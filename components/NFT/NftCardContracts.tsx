import React, { FC, useEffect, useState, useCallback, useMemo } from "react";
import { MediaRenderer, useActiveAccount, useReadContract } from "thirdweb/react";
import client from "@/lib/client";
import Skeleton from "@/components/Skeleton";
import styles from "./NftCard2.module.css";
import { Address, defineChain, getContract, ThirdwebContract } from "thirdweb";
import { useSwipeable } from "react-swipeable";
import Container from "../Container/Container";
import profileStyles from "../../Style/profile.module.css";
import { SpunksRankingNew, PUNKSRanking } from "../../const/contractabi";
import { NftInformation } from "../token/NftInformation";
import CancelListingButton from "../token/CancelListing";
import { NftAttributes } from "../token/AttributesThirdweb";
import { getContractMetadata } from "thirdweb/extensions/common";
import CancelOfferButton from "../token/cancelOfferButton";
import AcceptOfferButton from "../token/getOffers";
import { getNFT, ownerOf, tokenURI } from "thirdweb/extensions/erc721";
import ListingSection from "../token/listingButton";
import axios from "axios";
import { getContractInstance } from "@/const/contractInstanstGalerie";
import ProfileImage from "../AccountGroup/ProfileImage";
import { IotexPunksContract } from "@/const/contracts";
import { NFT_CONTRACTS } from "@/const/nft.contracts";
import { useMarketplaceData } from "@/Hooks/MarketProvider";
import { ListingStatus } from "@/customDirectListing/DirectListingListingStatis";
import VrmViewer from "../AccountGroup/VrmViewer";
import Events from "../events/EventsNftCard";
import EventsNFT from "../events/test";

type NFTContract = typeof NFT_CONTRACTS[number];

const getRanking = (id: string) => {
  const paddedId = id.padStart(3, '0');
  const rankingData = SpunksRankingNew.find((item) => item.spunk === paddedId);
  return rankingData ? rankingData.ranking : null;
};

const getPunkRank = (id: string) => {
  const punkData = PUNKSRanking[id as keyof typeof PUNKSRanking];
  if (punkData && typeof punkData === 'object' && 'score' in punkData) {
    return punkData.score;
  }
  return null;
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

interface Attribute {
  trait_type: string;
  value: string | number;
  frequency?: string;
  count?: number;
}

interface RarityData {
  APY: string;
  MiningRate: string;
}

interface Rarities {
  Giga: RarityData;
  Emperor: RarityData;
  King: RarityData;
  Knight: RarityData;
  Soldier: RarityData;
  Minion: RarityData;
}

type ContractMetadata = {
  name: string;
  description: string;
  image: string;
  animation_url?: string;
  vrm_file?: string;
  attributes: Attribute[];
  rank?: number; // Optional rank property
};


const rarities: Rarities = {
  Giga: { APY: "25%", MiningRate: "80 SMTX daily" },
  Emperor: { APY: "25%", MiningRate: "50 SMTX daily" },
  King: { APY: "15%", MiningRate: "6 SMTX daily" },
  Knight: { APY: "12%", MiningRate: "4 SMTX daily" },
  Soldier: { APY: "7%", MiningRate: "2 SMTX daily" },
  Minion: { APY: "1%", MiningRate: "1 SMTX daily" },
};

type INFTCardProps = {
  tokenId: bigint;
  contractAddresse?: string;
  chainId: number;
  nft: NFT;
};



export type NFTMetadata = {
  id: bigint;
  uri: string;
  name?: string;
  description?: string;
  rank?: number;
  image?: string;
  animation_url?: string;
  external_url?: string;
  background_color?: string;
  properties?: Record<string, unknown>;
  attributes?: Record<string, unknown>;
} & Record<string, unknown>;

export type NFT =
  | {
      metadata: NFTMetadata;
      owner: string | null;
      id: bigint;
      tokenURI: string;
      type: "ERC721";
    }
  | {
      metadata: NFTMetadata;
      owner: string | null;
      id: bigint;
      tokenURI: string;
      type: "ERC1155";
      supply: bigint;
    };

/**
 * @internal
 */
export type ParseNFTOptions =
  | {
      tokenId: bigint;
      tokenUri: string;
      type: "ERC721";
      owner?: string | null;
    }
  | {
      tokenId: bigint;
      tokenUri: string;
      type: "ERC1155";
      owner?: string | null;
      supply: bigint;
    };

export const NFTCardContracts: FC<INFTCardProps> = ({
  tokenId,
  contractAddresse,
  chainId,
  nft: currentNFT,
}) => {
  const account = useActiveAccount();
  const [tokenUriImage, setTokenURI] = useState<string>("");
  
  const [showInfo, setShowInfo] = useState(false);
  const [ranking, setRanking] = useState<number | null>(null);
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [rarityInfo, setRarityInfo] = useState({ name: "", APY: "", returns: "" });
  const [punkRank, setPunkRank] = useState<string | null>(null);
  const [ownerAddress, setOwnerAddress] = useState<string | null>(null);
  const [activeContract, setActiveContract] = useState<NFTContract | null>(null);
  const { validListings } = useMarketplaceData();
  const [selectedTab, setSelectedTab] = useState<string>('image'); // Add state for selected tab
  const [vrmFile, setVrmFile] = useState<File | null>(null); // State for VRM file

  const directListing = useMemo(() =>
    validListings?.find(
      (l): l is DirectListing => l.assetContractAddress === contractAddresse && l.tokenId === tokenId
    ),
    [validListings, contractAddresse, tokenId]
  );

  const handlers = useSwipeable({
    onSwipedLeft: (eventData) => {
      const { initial, absX } = eventData;
      const startY = initial[1]; // Y-coordinate of where the swipe starts
      const screenHeight = window.innerHeight;
      
      // Allow swiping only in the top 20% of the display
      const swipeThreshold = screenHeight * 0.4;

      // Prevent the swipe action if it starts outside the top 20%
      if (startY > swipeThreshold) {
        return;
      }

      // Prevent closing if the user is scrolling horizontally in a scrollable element
      if (document.activeElement?.classList.contains('scrollable')) {
        return;
      }

      // Proceed with the swipe action
      setShowInfo(false);
    },
    trackMouse: true, // Enable mouse tracking for swipe simulation
  });

  const NETWORK = defineChain(chainId);

  const contract: ThirdwebContract = getContract({
    address: contractAddresse || "",
    client,
    chain: NETWORK,
  });

  

  

  useEffect(() => {
    if (currentNFT && currentNFT && Array.isArray(currentNFT?.metadata.attributes)) {
      const rarityAttribute = currentNFT?.metadata.attributes.find(attr =>
        Object.keys(rarities).some(rarityKey => attr.trait_type.includes(rarityKey))
      );

      if (rarityAttribute) {
        const foundKey = Object.keys(rarities).find(key => rarityAttribute.trait_type.includes(key));

        if (foundKey) {
          const rarityKey = foundKey as keyof Rarities;
          const rarityData = rarities[rarityKey];
          setRarityInfo({
            name: rarityKey,
            APY: rarityData.APY,
            returns: rarityData.MiningRate,
          });
        }
      } else {
        setRarityInfo({
          name: "Giga",
          APY: rarities.Giga.APY,
          returns: rarities.Giga.MiningRate,
        });
      }
    } else {
      setRarityInfo({
        name: "Giga",
        APY: rarities.Giga.APY,
        returns: rarities.Giga.MiningRate,
      });
    }
  }, [currentNFT]);


  

  useEffect(() => {
    const fetchVrmFile = async () => {
      const vrmFile = currentNFT.metadata.vrm_file;
  
      if (typeof vrmFile === 'string') {  // Ensure it's a string
        console.log("Fetching VRM file...");
        let vrmFileUrl = null;
        
        if (vrmFile.startsWith('ipfs://')) {
          vrmFileUrl = `https://ipfs.io/ipfs/${vrmFile.slice(7)}`;
        }
  
        if (vrmFileUrl) {
          try {
            const response = await fetch(vrmFileUrl);
            const blob = await response.blob();
            const file = new File([blob], "vrmModel.vrm", { type: "application/octet-stream" });
            setVrmFile(file);
            console.log("VRM file fetched successfully");
          } catch (error) {
            console.error("Failed to fetch VRM file:", error);
          }
        }
      } else {
        console.warn("VRM file URL is not a string:", vrmFile);
      }
    };
  
    fetchVrmFile();
  }, [currentNFT]);

  const renderMedia = () => {
    switch (selectedTab) {
      case 'video':
        return <MediaRenderer src={currentNFT.metadata.animation_url} client={client} className={styles.nftImage} />;
      case 'vrm':
        return vrmFile ? (
          // Replace with the appropriate VRM viewer component and pass the vrmFile to it
          <VrmViewer vrmFile={vrmFile} />
        ) : (
          <p>Loading VRM file...</p>
        );
      case 'image':
      default:
        return <MediaRenderer src={currentNFT.metadata.image || tokenUriImage} client={client} className={styles.nftImage} />;
    }
  };

  const handleCloseInfo = () => {
    setShowInfo(false);
    setVrmFile(null); // Clean up VRM file when modal is closed
  };

  return (
    <div className={styles.nftCard} onClick={() => setShowInfo(true)} role="button" aria-label="Show more info">
      {account && ownerAddress === account.address && (
        <div>
         
        </div>
      )}

      {currentNFT ? (
        <>
                    <MediaRenderer src={currentNFT.metadata.image} client={client} className={styles.nftImage} />
                    {currentNFT?.metadata.rank && (

                <div>
                    <p>Rank {currentNFT?.metadata.rank}</p>
                </div>
                    )}
          {contractAddresse !== "0xc52121470851d0cba233c963fcbb23f753eb8709" && (
            <div>
              <p className={profileStyles.collectionName}>Token ID #{tokenId.toString()}</p>
            </div>
          )}
          {contractAddresse === "0xc52121470851d0cba233c963fcbb23f753eb8709" && ranking && (
            <p className={profileStyles.collectionName}>Rank #{ranking}</p>
          )}
          {contractAddresse === "0xce300b00aa9c066786D609Fc96529DBedAa30B76" && punkRank && (
            <p className={profileStyles.collectionName}>RANK #{punkRank}</p>
          )}
          {contractAddresse === "0x7D150D3eb3aD7aB752dF259c94A8aB98d700FC00" && (
            <p className={profileStyles.collectionName}>Rarity #{rarityInfo.name}</p>
          )}

          {showInfo && (
            <Container maxWidth="md">
              <div {...handlers} className="fixed inset-0 bg-gray-900 bg-opacity-75 flex justify-center items-start pt-20 overflow-auto z-50 sm:items-center" style={{ marginTop: '55px' }}>
                <div className="container max-w-3xl mx-auto p-9 rounded-lg shadow-lg mb-20 bg-[#181818] max-h-[80vh] overflow-y-auto">
                  {activeContract?.title && activeContract.title !== "" && (
                    <a>This Nft is from {activeContract.title} Collection
                    </a>
                  )}
                  <div className={styles.tabs}>
                  {currentNFT.metadata.image&& (

                  <button onClick={() => setSelectedTab('image')} className={selectedTab === 'image' ? styles.activeTab : ''}>Image</button>
          )}
           {currentNFT.metadata.animation_url&& (

            <button onClick={() => setSelectedTab('image')} className={selectedTab === 'image' ? styles.activeTab : ''}>Image</button>
        )}
          {currentNFT.metadata.image&& (

          <button onClick={() => setSelectedTab('vrm')} className={selectedTab === 'vrm' ? styles.activeTab : ''}>VRM</button>
            )}                     
                 <button onClick={() => setSelectedTab('vrm')} className={selectedTab === 'vrm' ? styles.activeTab : ''}>VRM</button>
                    </div>
                  <div className={styles.nftCard}>
                    
                    {renderMedia()}
                    {!currentNFT && <p>NFT metadata not available.</p>}
                  </div>
                  <div className={profileStyles.title}>
                    {account && ownerAddress === account.address && !directListing && (
                      <p>You&apos;re about to list the following item for sale.</p>
                    )}

                    {account && ownerAddress === account.address && directListing && (
                      <p>You&apos;re about to delist the Nft from the marketplace.</p>
                    )}

                    {account && ownerAddress !== account.address && directListing && (
                      <p>You&apos;re about to Buy the following item from the Marketplace.</p>
                    )}

                    <h1 className={profileStyles.title}>{currentNFT?.metadata.name}</h1>
                    {contractAddresse !== "0xc52121470851d0cba233c963fcbb23f753eb8709" && (
                      <p className={profileStyles.collectionName}>Token ID #{tokenId.toString()}</p>
                    )}        
                    {contractAddresse === "0xc52121470851d0cba233c963fcbb23f753eb8709" && ranking && (
                      <p className={profileStyles.collectionName}>Rank #{ranking}</p>
                    )}
                    {contractAddresse === "0xce300b00aa9c066786D609Fc96529DBedAa30B76" && punkRank && (
                      <p className={profileStyles.collectionName}>RANK #{punkRank}</p>
                    )}

                    {contractAddresse === "0x7D150D3eb3aD7aB752dF259c94A8aB98d700FC00" && rarityInfo && (
                      <>
                        <p className={profileStyles.collectionName}>Rarity #{rarityInfo.name}</p>
                        <p className={profileStyles.collectionName}>APY {rarityInfo.APY}</p>
                        <p className={profileStyles.collectionName}>Mining Rate {rarityInfo.returns}</p>
                      </>
                    )}
                  </div>

                  <div>
                    <h3 className="text-white text-xl font-bold">Description</h3>
                    <p className="text-white">{currentNFT.metadata.description}</p>
                    <p className="text-white">ContractAddress </p>
                    <p className="text-white">{contractAddresse}</p>
                    <p className="text-white">Current Owner </p>
                    <p className="text-white">{ownerAddress}</p>
                    {ownerAddress && <ProfileImage ownerAddresse={ownerAddress} />}
                  </div>

                  <div>
                    {currentNFT && directListing && (
                      <NftInformation
                        contractAddress={directListing.assetContractAddress || ''}
                        tokenId={directListing.tokenId}
                      />
                    )}

                    {!directListing && account && ownerAddress === account.address && (
                      <ListingSection
                        contractAddress={contractAddresse || ""}
                        tokenId={tokenId?.toString()}
                      />
                    )}

                    {account && ownerAddress === account.address && directListing && (
                      <CancelListingButton
                        account={account}
                        listingId={directListing?.id}
                      />
                    )}

                    {currentNFT && contractAddresse && (
                      <NftAttributes nft={currentNFT} contractAddress={contractAddresse} />
                    )}

                  {currentNFT && contractAddresse && (

                  <EventsNFT contractAddress={contractAddresse} tokenId={tokenId} chainId={chainId}/>
                  )}
                  </div>
                </div>
              </div>
            </Container>
          )}
        </>
      ) : (
        <Skeleton />
      )}
    </div>
  );
};
