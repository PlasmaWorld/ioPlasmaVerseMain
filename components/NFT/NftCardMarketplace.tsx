import React, { FC, useEffect, useState, useCallback, useMemo } from "react";
import { MediaRenderer, useActiveAccount, useReadContract } from "thirdweb/react";
import client from "@/lib/client";
import Skeleton from "@/components/Skeleton";
import styles from "./NftCard.module.css";
import { Address, defineChain, getContract, NFT as NFTType, ThirdwebContract } from "thirdweb";
import { useSwipeable } from "react-swipeable";
import Container from "../Container/Container";
import profileStyles from "../../Style/profile.module.css";
import { SpunksRankingNew, PUNKSRanking } from "../../const/contractabi";
import { NFTMetadata } from "thirdweb/dist/types/utils/nft/parseNft";
import CancelListingButton from "../token/CancelListing";
import { NftAttributes } from "../token/Attributes";
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
import { NftInformationPrice } from "../token/nftCardPrice";
import { NftInformation } from "../token/NftInformation";
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
  attributes: Attribute[];
};

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
   
};

export const NFTCard: FC<INFTCardProps> = ({
  tokenId,
  contractAddresse,
  chainId,
  
}) => {
  const account = useActiveAccount();
  const [tokenUriImage, setTokenURI] = useState<string>("");

  const [currentNFT, setCurrentNFT] = useState<ContractMetadata>({
    name: "",
    description: "",
    image: "",
    attributes: [],
  });  const [showInfo, setShowInfo] = useState(false);
  const [ranking, setRanking] = useState<number | null>(null);
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [rarityInfo, setRarityInfo] = useState({ name: "", APY: "", returns: "" });
  const [punkRank, setPunkRank] = useState<string | null>(null);
  const [ownerAddress, setOwnerAddress] = useState<string | null>(null);
  const [activeContract, setActiveContract] = useState<NFTContract | null>(null);

  const { validListings, validAuctions } = useMarketplaceData();

  const auctionListing = useMemo(() =>
    validAuctions?.find(
      (l): l is EnglishAuction => l.assetContractAddress === contractAddresse && l.tokenId === tokenId
    ),
    [validAuctions, contractAddresse, tokenId]);

  const directListing = useMemo(() =>
    validListings?.find(
      (l): l is DirectListing => l.assetContractAddress === contractAddresse && l.tokenId === tokenId
    ),
    [validListings, contractAddresse, tokenId]);

  useEffect(() => {
    console.log("Valid Listings:", validListings);
    console.log("Contract Address:", contractAddresse);
    console.log("Token ID:", tokenId);
    console.log("Direct Listing:", directListing);
  }, [validListings, contractAddresse, tokenId,, directListing]);

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
    address: contractAddresse ||"",
    client,
    chain: NETWORK,
  });

  


  const handleReadNft = async () => {
    try {
        const owner = await ownerOf({ contract, tokenId });
        const tokenUri = await tokenURI({ contract, tokenId });

        console.log("Received Token URI:", tokenUri); // Log the received tokenUri

        let metadataUrl;

        if (typeof tokenUri === 'string') {
            if (tokenUri.startsWith("ipfs://")) {
                const gatewayUrl = tokenUri.replace("ipfs://", "https://ipfs.io/ipfs/");
                metadataUrl = `https://nieuwe-map-5.vercel.app/metadata?url=${encodeURIComponent(gatewayUrl)}`;
            } else if (tokenUri.startsWith("data:")) {
                const base64Data = tokenUri.split(",")[1];
                const decodedData = Buffer.from(base64Data, 'base64').toString('utf-8');
                const metadata = JSON.parse(decodedData);

                console.log("Metadata from base64 data:", metadata);

                // Fetch image through backend proxy
                const proxyImageUrl = `https://nieuwe-map-5.vercel.app/metadataImage?url=${encodeURIComponent(metadata.image)}`;

                const NftMetadata = {
                    id: metadata.id || tokenId,
                    name: metadata.name || "Unknown Name",
                    description: metadata.description || "No Description",
                    image: proxyImageUrl,
                    attributes: metadata.attributes || ""
                };

                setCurrentNFT(NftMetadata);
                setOwnerAddress(owner);
                setTokenURI(tokenUri);
                return;
            } else {
                try {
                    // Try parsing the tokenUri as JSON directly
                    const metadata = JSON.parse(tokenUri);

                    console.log("Metadata from JSON tokenUri:", metadata);

                    // Fetch image through backend proxy
                    const proxyImageUrl = `https://nieuwe-map-5.vercel.app/metadataImage?url=${encodeURIComponent(metadata.image)}`;

                    const NftMetadata = {
                        id: metadata.id || tokenId,
                        name: metadata.name || "Unknown Name",
                        description: metadata.description || "No Description",
                        image: proxyImageUrl,
                        attributes: metadata.attributes || ""
                    };

                    setCurrentNFT(NftMetadata);
                    setOwnerAddress(owner);
                    setTokenURI(tokenUri);
                    return;
                } catch (error) {
                    // If parsing fails, treat it as a regular URL
                    metadataUrl = `https://nieuwe-map-5.vercel.app/metadata?url=${encodeURIComponent(tokenUri)}`;
                }
            }

            console.log("Metadata URL:", metadataUrl);
            const response = await axios.get(metadataUrl);

            console.log("Metadata response:", response.data);

            if (response.data) {
                const NftMetadata = {
                    id: response.data.id || tokenId,
                    name: response.data.name || "Unknown Name",
                    description: response.data.description || "No Description",
                    image: response.data.image,
                    attributes: response.data.attributes || ""
                };

                setCurrentNFT(NftMetadata);
                setOwnerAddress(owner);
                setTokenURI(tokenUri); // Keep the original token URI

                if (contractAddresse === "0xc52121470851d0cba233c963fcbb23f753eb8709") {
                    const ranking = getRanking(tokenId.toString());
                    setRanking(ranking);
                } else {
                    setRanking(null);
                }

                if (contractAddresse === "0xce300b00aa9c066786D609Fc96529DBedAa30B76") {
                    const rank = getPunkRank(tokenId.toString());
                    if (rank !== null) {
                        setPunkRank(rank.toString());
                    } else {
                        setPunkRank(null);
                    }
                } else {
                    setPunkRank(null);
                }
            } else {
                console.error("Invalid metadata response:", response.data);
            }
        } else {
            console.error("Invalid token URI format:", tokenUri);
        }
    } catch (error) {
        console.error("Error fetching metadata:", error);
    }
};









useEffect(() => {
  handleReadNft();
}, [contractAddresse]);

  useEffect(() => {
    if (currentNFT && currentNFT && Array.isArray(currentNFT.attributes)) {
      const rarityAttribute = currentNFT.attributes.find(attr =>
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

  return (
    <div className={styles.nftCard} onClick={() => setShowInfo(true)} role="button" aria-label="Show more info">
      {account && ownerAddress === account.address && (
        <div>
          <button onClick={() => {/* Add SetProfile function */}} className={styles.ProfileButton}>
            {/* Add icon or text here */}
          </button>
        </div>
      )}

      {currentNFT ? (
        <>
          <MediaRenderer src={currentNFT.image || tokenUriImage} client={client} className={styles.nftImage} />
          {contractAddresse !== "0xc52121470851d0cba233c963fcbb23f753eb8709" && contractAddresse !== "0xce300b00aa9c066786D609Fc96529DBedAa30B76" && (
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

        {contractAddresse ? (
            <div className={styles.priceContainer}>
              <NftInformationPrice
                contractAddress={contractAddresse || ""}
                tokenId={tokenId}
                extraProp={""}
                
              />
            </div>
          ) : (
            <Skeleton />
          )}

          {showInfo && (
            <Container maxWidth="md">
              <div {...handlers} className="fixed inset-0 bg-gray-900 bg-opacity-75 flex justify-center items-start pt-20 overflow-auto z-50 sm:items-center" style={{ marginTop: '55px' }}>
                <div className="container max-w-3xl mx-auto p-9 rounded-lg shadow-lg mb-20 bg-[#181818] max-h-[80vh] overflow-y-auto">
                {activeContract?.title && activeContract.title !== "" && (
                    <a>This Nft is from {activeContract.title} Collection
                      
                    </a>
                  )}
                  <div className={styles.nftCardImage}>
                    {currentNFT ? (
                      <MediaRenderer src={currentNFT.image || tokenUriImage} client={client} className={styles.nftImage} />
                    ) : (
                      <p>NFT metadata not available.</p>
                    )}
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

                    <h1 className={profileStyles.title}>{currentNFT?.name}</h1>
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
                    <p className="text-white">{currentNFT.description}</p>
                    <p className="text-white">ContractAddress </p>
                    <p className="text-white">{contractAddresse}</p>
                    <p className="text-white">Current Owner </p>
                    <p className="text-white">{directListing?.creatorAddress || auctionListing?.creatorAddress}</p>
                     <ProfileImage ownerAddresse={directListing?.creatorAddress || auctionListing?.creatorAddress || ""} />
                  </div>

                  <div>
                    {currentNFT  && (
                      <NftInformation
                        contractAddress={contractAddresse || ''}
                        tokenId={tokenId}
                        
                      />
                    )}

                    {account && ownerAddress === account.address &&  (
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
