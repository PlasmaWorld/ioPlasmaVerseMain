import React, { FC, useEffect, useState, useCallback, useMemo } from "react";
import { MediaRenderer, useActiveAccount, useReadContract } from "thirdweb/react";
import client from "@/lib/client";
import Skeleton from "@/components/Skeleton";
import styles from "./NftCard2.module.css";
import { Address, defineChain, getContract, NFT as NFTType, ThirdwebContract } from "thirdweb";
import { useSwipeable } from "react-swipeable";
import Container from "../Container/Container";
import profileStyles from "../../Style/profile.module.css";
import { SpunksRankingNew, PUNKSRanking } from "../../const/contractabi";

import { NftAttributes } from "../token/Attributes";

import { NFT_CONTRACTS } from "@/const/nft.contracts";
import { useMarketplaceData } from "@/Hooks/MarketProvider";

type NFTContract = typeof NFT_CONTRACTS[number];


interface Attribute {
    trait_type: string;
    value: string | number;
    frequency?: string;
    count?: number;
  }

type ContractMetadata = {
  tokenId? :number;
  name: string;
  description: string;
  image: string;
  attributes: Attribute[];
};


type INFTCardProps = {
  nft: ContractMetadata;
};

export const NFTCardNftGenerator: FC<INFTCardProps> = ({
  nft
}) => {
  const account = useActiveAccount();
  const [tokenUriImage, setTokenURI] = useState<string>("");
  const [currentNFT, setCurrentNFT] = useState<ContractMetadata>({
    name: "",
    description: "",
    image: "",
    attributes: [],
  });
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

  const handleCloseInfo = () => {
    setShowInfo(false);
    setVrmFile(null); // Clean up VRM file when modal is closed
  };

  const handlers = useSwipeable({
    onSwipedLeft: () => setShowInfo(false),
    trackMouse: true,
  });

  return (
    <div className={styles.nftCard} onClick={() => setShowInfo(true)} role="button" aria-label="Show more info">
      {account && ownerAddress === account.address && (
        <div>
          {/* Add content if necessary */}
        </div>
      )}

      {currentNFT ? (
        <div>
          <div>
            <MediaRenderer src={nft.image || tokenUriImage} client={client} className={styles.nftImage} />
          </div>
          <div>
            <p className={profileStyles.collectionName}>Token ID #{nft.tokenId}</p>
          </div>

          {showInfo && (
            <Container maxWidth="md">
              <div {...handlers} className="fixed inset-0 bg-gray-900 bg-opacity-75 flex justify-center items-start pt-20 overflow-auto z-50 sm:items-center" style={{ marginTop: '55px' }}>
                <div className="container max-w-3xl mx-auto p-9 rounded-lg shadow-lg mb-20 bg-[#181818] max-h-[80vh] overflow-y-auto">
                  <a>This Nft is from Your Collection</a>

                  <div className={styles.tabs}>
                    <div className={styles.nftCard}>
                      <MediaRenderer src={nft.image} client={client} className={styles.nftImage} />
                    </div>
                    <div className={profileStyles.title}>
                      <div>
                        <p className="text-white">name </p>
                        <p className="text-white">{nft.name} </p>

                        <h3 className="text-white text-xl font-bold">Description</h3>
                        <p className="text-white">{nft.description}</p>
                        <p className="text-white">name </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    {currentNFT && (
                      <NftAttributes nft={nft} contractAddress={""} />
                    )}
                  </div>
                </div>
              </div>
            </Container>
          )}
        </div>
      ) : (
        <Skeleton />
      )}
    </div>
  );
};
