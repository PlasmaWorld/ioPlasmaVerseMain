import React, { FC, useEffect, useState } from "react";
import { MediaRenderer, useActiveAccount } from "thirdweb/react";
import { getNFT } from "thirdweb/extensions/erc721";
import client from "@/lib/client";
import Skeleton from "@/components/Skeleton";
import styles from "./NftCardProfile.module.css";
import { NFT as NFTType } from "thirdweb";

import { SpunksRankingNew } from "../../const/contractabi";
import { NFTMetadata } from "thirdweb/dist/types/utils/nft/parseNft";
import { useTransactionHandlerChattApp } from "@/TransactionHandler/AppMint";
import { FaUserCircle, FaImage } from "react-icons/fa";
import { getContractMetadata } from "thirdweb/extensions/common";
import axios from "axios"; // Make sure axios is imported
import { useUser } from "@/Hooks/UserInteraction";
import { getContractInstance } from "@/const/cotractInstance";

const getRanking = (id: string) => {
  const rankingData = SpunksRankingNew.find((item) => item.spunk === id);
  return rankingData ? rankingData.ranking : null;
};

interface Attribute {
  trait_type: string;
  value: string | number;
}

type INFTCardProps = {
  tokenId: string;
  contractAddress: string;
  refetchProfileImage: () => void;
};

export const NFTCard: FC<INFTCardProps> = ({ tokenId, contractAddress, refetchProfileImage }) => {
  const account = useActiveAccount();
  const [nft, setNFT] = useState<NFTType | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [auctionListing, setAuctionListing] = useState<any | null>(null);
  const [directListing, setDirectListing] = useState<any | null>(null);
  const [ranking, setRanking] = useState<number | null>(null);
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [contract, setContract] = useState("");
  const { userExists: ExistUser } = useUser();

  useEffect(() => {
    const fetchData = async () => {
      if (tokenId && contractAddress) {
        try {
          const contract = getContractInstance(contractAddress);
          const contractMetadata = await getContractMetadata({ contract });
          const result = contractMetadata.name;
          let nftData = await getNFT({
            contract,
            tokenId: BigInt(tokenId),
            includeOwner: true,
          });

          let normalizedNFT: NFTType;

          if (contractAddress === "0xce300b00aa9c066786D609Fc96529DBedAa30B76") {
            // Use the proxy server for the specific contract address
            const metadataUrl = `https://nieuwe-map-5.vercel.app/proxy/${nftData.id}`;
            console.log(`Fetching metadata from URL: ${metadataUrl}`);
            const response = await axios.get(metadataUrl);
            const metadata = response.data;
            console.log(`Fetched metadata from URL:`, metadata);

            nftData = {
              metadata,
              owner: nftData.owner,
              id: nftData.id,
              tokenURI: metadataUrl,
              type: "ERC721",
            } as NFTType;
            console.log(`Constructed NFT data from metadata URL:`, nftData);
          }

          if (contractAddress === "0x0c5AB026d74C451376A4798342a685a0e99a5bEe") {
            normalizedNFT = {
              ...nftData,
              metadata: {
                name: nftData.metadata.name || "MachineFi NFT",
                description: nftData.metadata.description || "MachineFi NFT",
                image: "ipfs://QmdLtnJRPzSFNpeZSfCSbh7YEDyyJniokRYtZwdRvfESak/Schermafbeelding%202024-06-14%20153107.png",
              } as NFTMetadata,
            };
          } else {
            normalizedNFT = nftData;
          }

          setNFT(normalizedNFT);
          setContract(result);

          if (contractAddress === "0xc52121470851d0cba233c963fcbb23f753eb8709") {
            const ranking = getRanking(String(tokenId).padStart(3, "0"));
            setRanking(ranking);
          } else {
            setRanking(null);
          }
        } catch (error) {
        }
      }
    };

    fetchData();
  }, [tokenId, contractAddress]);

  useEffect(() => {
    if (ExistUser === false) {
    }
  }, [ExistUser]);

  const { handleTransaction: SetProfile, isPending: isSettingProfile } = useTransactionHandlerChattApp(
    "setActiveProfileImage",
    [nft?.metadata.image?.toString()],
    () => {
      alert("Profile Image successfully set");
      refetchProfileImage();
    },
    (error: any) => console.error('Set profile image error:', error)
  );

  const { handleTransaction: SetBackround, isPending: isSettingBackround } = useTransactionHandlerChattApp(
    "setActiveBackgroundImage",
    [nft?.metadata.image?.toString()],
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
          <MediaRenderer src={nft.metadata.image} client={client} className="object-cover object-center" />
          {account && nft?.owner === account.address && (
            <div className={styles.buttonContainer}>
              {nft?.metadata.description  && (
                <button
                  onClick={SetProfile}
                  disabled={isSettingProfile}
                  className={`${styles.ProfileButton} ${isSettingProfile ? '' : styles.iconOnlyButton}`}
                >
                  <FaUserCircle />
                  {isSettingProfile ? "Setting..." : "Set ProfileImage"}
                </button>
              )}
              {nft?.metadata.description === "PlasmaVerse BackroundImage" && ExistUser && (
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
