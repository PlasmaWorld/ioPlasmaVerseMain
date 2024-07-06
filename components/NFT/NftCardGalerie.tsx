import React, { FC, useEffect, useState, useCallback } from "react";
import { MediaRenderer, useActiveAccount, useReadContract } from "thirdweb/react";
import client from "@/lib/client";
import Skeleton from "@/components/Skeleton";
import styles from "./NftCard2.module.css";
import { NFT as NFTType } from "thirdweb";
import { useSwipeable } from "react-swipeable";
import Container from "../Container/Container";
import profileStyles from "../../Style/profile.module.css";
import { SpunksRankingNew, PUNKSRanking } from "../../const/contractabi";
import { NFTMetadata } from "thirdweb/dist/types/utils/nft/parseNft";
import { NftInformation } from "../token/NftInformation";
import CancelListingButton from "../token/CancelListing";
import { NftAttributes } from "../token/Attributes";
import { getContractMetadata } from "thirdweb/extensions/common";
import CancelOfferButton from "../token/cancelOfferButton";
import AcceptOfferButton from "../token/getOffers";
import { DirectListing, EnglishAuction, Offer } from "thirdweb/extensions/marketplace";
import { getNFT, ownerOf } from "thirdweb/extensions/erc721";
import ListingSection from "../token/listingButton";
import axios from "axios";
import { getContractInstance } from "@/const/cotractInstance";
import ProfileImage from "../AccountGroup/ProfileImage";
import { IotexPunksContract } from "@/const/contracts";
import { NFT_CONTRACTS } from "@/const/nft.contracts";

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

const rarities: Rarities = {
  Giga: { APY: "25%", MiningRate: "80 SMTX daily" },
  Emperor: { APY: "25%", MiningRate: "50 SMTX daily" },
  King: { APY: "15%", MiningRate: "6 SMTX daily" },
  Knight: { APY: "12%", MiningRate: "4 SMTX daily" },
  Soldier: { APY: "7%", MiningRate: "2 SMTX daily" },
  Minion: { APY: "1%", MiningRate: "1 SMTX daily" },
};

type INFTCardProps = {
  tokenId?: bigint;
  contractAddresse?: string;
  nft?: {
    tokenId: bigint;
    listing?: (DirectListing | EnglishAuction)[];
    offers?: Offer[];
  } | null;
  overrideOnclickBehavior?: (nft: NFTType) => void;
  refetchAllListings: () => void;
  refetchAllAuctions: () => void;
  refetchAllOffers: () => void;
};

export const NFTCard: FC<INFTCardProps> = ({
  tokenId,
  contractAddresse,
  nft,
  overrideOnclickBehavior,
  refetchAllListings,
  refetchAllAuctions,
  refetchAllOffers,
}) => {
  const account = useActiveAccount();
  const [currentNFT, setCurrentNFT] = useState<NFTType | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [ranking, setRanking] = useState<number | null>(null);
  const [contract, setContract] = useState("");
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [rarityInfo, setRarityInfo] = useState({ name: "", APY: "", returns: "" });
  const [punkRank, setPunkRank] = useState<string | null>(null);
  const [ownerAddress, setOwnerAddress] = useState<string | null>(null);
  const [activeContract, setActiveContract] = useState<NFTContract | null>(null);

  const handlers = useSwipeable({
    onSwipedLeft: () => setShowInfo(false),
    trackMouse: true,
  });

  const fetchNFTData = useCallback(async () => {
    if (!nft && !tokenId && !contractAddresse) return;

    try {
      let nftData: NFTType | null = null;
      let contractAddress = contractAddresse || "";

      if (nft) {
        contractAddress = nft.listing?.[0]?.assetContractAddress || "";
      }

      const id = nft?.tokenId || tokenId;
      if (!id) return;

      if (contractAddress === "0xce300b00aa9c066786D609Fc96529DBedAa30B76") {
        const metadataUrl = `https://nieuwe-map-5.vercel.app/proxy/${id.toString()}`;
        const response = await axios.get(metadataUrl);
        const metadata = response.data;

        nftData = {
          metadata,
          owner: null,
          id: id,
          tokenURI: metadataUrl,
          type: "ERC721",
        } as NFTType;

        // Fetch owner using ownerOf function
        const owner = await ownerOf({ contract: IotexPunksContract, tokenId: id });
        setOwnerAddress(owner);

      } else {
        const contractInstance = getContractInstance(contractAddress);
        const contractMetadata = await getContractMetadata({ contract: contractInstance });
        nftData = await getNFT({
          contract: contractInstance,
          tokenId: id,
          includeOwner: true,
        });

        if (contractAddress === "0x0c5AB026d74C451376A4798342a685a0e99a5bEe") {
          nftData = {
            ...nftData,
            metadata: {
              name: nftData.metadata.name || "MachineFi NFT",
              description: nftData.metadata.description || "The MachineFi NFT.",
              image: "ipfs://QmdLtnJRPzSFNpeZSfCSbh7YEDyyJniokRYtZwdRvfESak/Schermafbeelding%202024-06-14%20153107.png",
            } as NFTMetadata,
          };
        }
        setContract(contractMetadata.name);
        setOwnerAddress(nftData.owner);
      }

      setCurrentNFT(nftData);

      if (contractAddress === "0xc52121470851d0cba233c963fcbb23f753eb8709") {
        const ranking = getRanking(id.toString());
        setRanking(ranking);
      } else {
        setRanking(null);
      }

      if (contractAddress === "0xce300b00aa9c066786D609Fc96529DBedAa30B76") {
        const rank = getPunkRank(id.toString());
        if (rank !== null) {
          setPunkRank(rank.toString());
        } else {
          setPunkRank(null);
        }
      } else {
        setPunkRank(null);
      }
    } catch (error) {
    }
  }, [nft, tokenId, contractAddresse]);

  useEffect(() => {
    fetchNFTData();
  }, [fetchNFTData]);

  useEffect(() => {
    if (currentNFT && currentNFT.metadata && Array.isArray(currentNFT.metadata.attributes)) {
      const rarityAttribute = currentNFT.metadata.attributes.find(attr =>
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
          <MediaRenderer src={currentNFT.metadata.image} client={client} className={styles.nftImage} />
          {contractAddresse !== "0xc52121470851d0cba233c963fcbb23f753eb8709" && (
            <div>
              <p className={profileStyles.collectionName}>Token ID #{currentNFT.id.toString()}</p>
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
                  <div className={styles.nftCard}>
                    {currentNFT?.metadata ? (
                      <MediaRenderer src={currentNFT.metadata.image} client={client} className="object-cover object-center" />
                    ) : (
                      <p>NFT metadata not available.</p>
                    )}
                  </div>
                  <div className={profileStyles.title}>
                    {account && ownerAddress === account.address && !nft?.listing && (
                      <p>You&apos;re about to list the following item for sale.</p>
                    )}

                    {account && ownerAddress === account.address && nft?.listing && (
                      <p>You&apos;re about to delist the Nft from the marketplace.</p>
                    )}

                    {account && ownerAddress !== account.address && nft?.listing && (
                      <p>You&apos;re about to Buy the following item from the Marketplace.</p>
                    )}

                    <h1 className={profileStyles.title}>{currentNFT?.metadata.name}</h1>
                    {contractAddresse !== "0xc52121470851d0cba233c963fcbb23f753eb8709" && (
                      <p className={profileStyles.collectionName}>Token ID #{currentNFT?.id.toString()}</p>
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
                    {currentNFT && nft?.listing && (
                      <NftInformation
                        contractAddress={nft.listing[0].assetContractAddress || ''}
                        tokenId={nft.tokenId}
                        nft={nft}
                        refetchAllListings={refetchAllListings}
                        refetchAllAuctions={refetchAllAuctions}
                      />
                    )}

                    {!nft   &&account && ownerAddress === account.address &&  (
                      <ListingSection
                        contractAddress={contractAddresse || ""}
                        tokenId={tokenId?.toString()}
                        nft={nft}
                        refetchAllListings={refetchAllListings}
                        refetchAllAuction={refetchAllAuctions}
                        refetchAllOffers={refetchAllOffers}
                      />
                    )}

                    {account && ownerAddress === account.address && nft?.listing && (
                      <CancelListingButton
                        account={account}
                        listingId={nft.listing[0].id}
                        refetchAllListings={refetchAllListings}
                      />
                    )}
                    {account?.address && nft?.offers && nft?.offers.length > 0 && (
                      <>
                        {nft.offers.map((offer) => (
                          <div key={offer.id}>
                            <CancelOfferButton account={account} offer={offer} refetchAllOffers={refetchAllOffers} />
                            <AcceptOfferButton account={account} offer={offer} refetchAllOffers={refetchAllOffers} />
                          </div>
                        ))}
                      </>
                    )}

                    {currentNFT?.metadata && contractAddresse && (
                      <NftAttributes nft={currentNFT} contractAddress={contractAddresse} />
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
