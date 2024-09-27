import React, { FC, useEffect, useState } from "react";
import { MediaRenderer, useActiveAccount } from "thirdweb/react";
import { getNFT, ownerOf, tokenURI } from "thirdweb/extensions/erc721";
import client from "@/lib/client";
import Skeleton from "@/components/Skeleton";
import styles from "./NftCardProfile.module.css";
import { getContract, NFT as NFTType, ThirdwebContract } from "thirdweb";

import { PUNKSRanking, SpunksRankingNew } from "../../const/contractabi";
import { NFTMetadata } from "thirdweb/dist/types/utils/nft/parseNft";
import { useTransactionHandlerChattApp } from "@/TransactionHandler/AppMint";
import { FaUserCircle, FaImage } from "react-icons/fa";
import { getContractMetadata } from "thirdweb/extensions/common";
import axios from "axios"; // Make sure axios is imported
import { useUser } from "@/Hooks/UserInteraction";
import { getContractInstance, NETWORK } from "@/const/cotractInstance";

const getPunkRank = (id: string) => {
  const punkData = PUNKSRanking[id as keyof typeof PUNKSRanking];
  if (punkData && typeof punkData === 'object' && 'score' in punkData) {
    return punkData.score;
  }
  return null;
};

const getRanking = (id: string) => {
  const rankingData = SpunksRankingNew.find((item) => item.spunk === id);
  return rankingData ? rankingData.ranking : null;
};

interface Attribute {
  trait_type: string;
  value: string | number;
}
type ContractMetadata = {
  name: string;
  description: string;
  image: string;
  attributes: Attribute[];
};

type INFTCardProps = {
  tokenId: string;
  contractAddress: string;
  refetchProfileImage: () => void;
};

export const NFTCard: FC<INFTCardProps> = ({ tokenId, contractAddress, refetchProfileImage }) => {
  const account = useActiveAccount();
  const [showInfo, setShowInfo] = useState(false);
  const [auctionListing, setAuctionListing] = useState<any | null>(null);
  const [directListing, setDirectListing] = useState<any | null>(null);
  const [ranking, setRanking] = useState<number | null>(null);
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const { userExists: ExistUser } = useUser();
  const [tokenUriImage, setTokenURI] = useState<string>("");

  const [nft, setCurrentNFT] = useState<ContractMetadata>({
    name: "",
    description: "",
    image: "",
    attributes: [],
  });

  const [rarityInfo, setRarityInfo] = useState({ name: "", APY: "", returns: "" });
  const [punkRank, setPunkRank] = useState<string | null>(null);
  const [ownerAddress, setOwnerAddress] = useState<string | null>(null);

  const contract: ThirdwebContract = getContract({
    address: contractAddress || "",
    client,
    chain: NETWORK,
  });

  const handleReadNft = async () => {
    try {
      const tokenIdBigInt = BigInt(tokenId); // Convert tokenId to bigint
      const owner = await ownerOf({ contract, tokenId: tokenIdBigInt });
      const tokenUri = await tokenURI({ contract, tokenId: tokenIdBigInt });

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
                const proxyImageUrl = `https://your-backend-domain.com/proxy-image?url=${encodeURIComponent(metadata.image)}`;

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
                    const proxyImageUrl = `https://your-backend-domain.com/proxy-image?url=${encodeURIComponent(metadata.image)}`;

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

                if (contractAddress === "0xc52121470851d0cba233c963fcbb23f753eb8709") {
                    const ranking = getRanking(tokenId.toString());
                    setRanking(ranking);
                } else {
                    setRanking(null);
                }

                if (contractAddress === "0xce300b00aa9c066786D609Fc96529DBedAa30B76") {
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
  }, [contractAddress]);

  useEffect(() => {
    if (ExistUser === false) {
    }
  }, [ExistUser]);

  const { handleTransaction: SetProfile, isPending: isSettingProfile } = useTransactionHandlerChattApp(
    "setActiveProfileImage",
    [nft?.image?.toString()],
    () => {
      alert("Profile Image successfully set");
      refetchProfileImage();
    },
    (error: any) => console.error('Set profile image error:', error)
  );

  const { handleTransaction: SetBackround, isPending: isSettingBackround } = useTransactionHandlerChattApp(
    "setActiveBackgroundImage",
    [nft?.image?.toString()],
    () => {
      alert("Background Image successfully set");
      refetchProfileImage();
    },
    (error: any) => console.error('Set background image error:', error)
  );

  return (
    <div className={styles.nftCard}>
      {nft ? (
        <>
          <MediaRenderer src={nft.image} client={client} className="object-cover object-center" />
          {account && ownerAddress === account.address && (
            <div className={styles.buttonContainer}>
              {nft?.description && (
                <button
                  onClick={SetProfile}
                  disabled={isSettingProfile}
                  className={`${styles.ProfileButton} ${isSettingProfile ? '' : styles.iconOnlyButton}`}
                >
                  <FaUserCircle />
                  {isSettingProfile ? "Setting..." : "Set ProfileImage"}
                </button>
              )}
              {nft?.description === "PlasmaVerse BackroundImage" && ExistUser && (
                <button
                  onClick={SetBackround}
                  disabled={isSettingBackround}
                  className={`${styles.ProfileButton} ${isSettingBackround ? '' : styles.iconOnlyButton}`}
                >
                  <FaImage />
                  {isSettingBackround ? "Setting..." : "Set Background"}
                </button>
              )}
            </div>
          )}
        </>
      ) : (
        <Skeleton />
      )}
    </div>
  );
};
