import React, { useState, useEffect, useCallback } from "react";
import { AiFillFire } from "react-icons/ai";
import { TbArrowBigLeftLines, TbArrowBigRightLine } from "react-icons/tb";
import { MediaRenderer, useActiveAccount } from "thirdweb/react";
import axios from "axios";
import { getContract, type Address, type ThirdwebContract } from "thirdweb";
import Style from "./BigNFTSlider.module.css";
import ProfileImage from "./ProfileImage";
import { PUNKSRanking, SpunksRankingNew } from "@/const/contractabi";
import { ownerOf, tokenURI } from "thirdweb/extensions/erc721";
import { NETWORK } from "@/const/contracts";

import client from "@/lib/client";
import NftInformation from "./NftInformation"
import Skeleton from "@/components/Skeleton";
import { useMarketplaceData } from "@/Hooks/MarketProvider";

const getRanking = (id: string) => {
  const rankingData = SpunksRankingNew.find((item) => item.spunk === id);
  return rankingData ? rankingData.ranking : null;
};

const getPunkRank = (id: string) => {
  const punkData = PUNKSRanking[id as keyof typeof PUNKSRanking];
  return punkData && typeof punkData === 'object' && 'score' in punkData ? punkData.score : null;
};

type ContractMetadata = {
  name: string;
  description: string;
  image: string;
};

export default function BigNFTSlider() {
  const [idNumber, setIdNumber] = useState(0);
  const [ownerAddress, setOwnerAddress] = useState<string | null>(null);
  const account = useActiveAccount();
  const [punkRank, setPunkRank] = useState<string | null>(null);
  const [ranking, setRanking] = useState<number | null>(null);
  const [tokenUriImage, setTokenURI] = useState<string>("");
  const { validListings } = useMarketplaceData();

  const [currentNFT, setCurrentNFT] = useState<ContractMetadata>({
    name: "",
    description: "",
    image: "",
  });

  const inc = useCallback(() => {
    if (idNumber + 1 < validListings.length) {
      setIdNumber(idNumber + 1);
    }
  }, [idNumber, validListings.length]);

  const dec = useCallback(() => {
    if (idNumber > 0) {
      setIdNumber(idNumber - 1);
    }
  }, [idNumber]);

  useEffect(() => {
    if (validListings.length > 0) {
      const listing = validListings[idNumber];
      const contractAddress = listing.assetContractAddress;
      const tokenId = listing.tokenId;

      const contract: ThirdwebContract = getContract({
        address: contractAddress,
        client,
        chain: NETWORK,
      });

      const handleReadNft = async () => {
        try {
          const owner = await ownerOf({ contract, tokenId });
          const tokenUri = await tokenURI({ contract, tokenId });

          let metadataUrl: string;

          if (typeof tokenUri === 'string') {
            if (tokenUri.startsWith("ipfs://")) {
              const gatewayUrl = tokenUri.replace("ipfs://", "https://ipfs.io/ipfs/");
              metadataUrl = `https://nieuwe-map-5.vercel.app/metadata?url=${encodeURIComponent(gatewayUrl)}`;
            } else if (tokenUri.startsWith("data:")) {
              const base64Data = tokenUri.split(",")[1];
              const decodedData = Buffer.from(base64Data, 'base64').toString('utf-8');
              const metadata = JSON.parse(decodedData);

              const NftMetadata = {
                id: metadata.id || tokenId,
                name: metadata.name || "Unknown Name",
                description: metadata.description || "No Description",
                image: metadata.image || "No Image URL",
              };

              setCurrentNFT(NftMetadata);
              setOwnerAddress(owner);
              setTokenURI(tokenUri);
              return;
            } else {
              metadataUrl = `https://nieuwe-map-5.vercel.app/metadata?url=${encodeURIComponent(tokenUri)}`;
            }

            const response = await axios.get(metadataUrl);

            if (response.data) {
              const NftMetadata = {
                id: response.data.id || tokenId,
                name: response.data.name || "Unknown Name",
                description: response.data.description || "No Description",
                image: response.data.image || "No Image URL",
              };

              setCurrentNFT(NftMetadata);
              setOwnerAddress(owner);
              setTokenURI(tokenUri);

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

      handleReadNft();
    }
  }, [idNumber, validListings]);

  const listing = validListings[idNumber] || {};

  return (
    <div className={Style.scrollContainer}>
      <div className={Style.bigNFTSlider}>
        <div className={Style.bigNFTSlider_box}>
          <div className={Style.bigNFTSlider_box_left}>
            <div className={Style.bigNFTSlider_box_left_bidding}>
              <small>Current Listing</small>
              <div>
                {validListings.length ? (
                  <div className={Style.priceContainer}>
                    <NftInformation
                      contractAddress={listing.assetContractAddress || ''}
                      tokenId={listing.tokenId || BigInt(0)}
                    />
                  </div>
                ) : (
                  <Skeleton />
                )}
              </div>
            </div>
            <div className={Style.bigNFTSlider_box_left_sliderBtn}>
              <TbArrowBigLeftLines className={Style.bigNFTSlider_box_left_sliderBtn_icon} onClick={dec} />
              <TbArrowBigRightLine className={Style.bigNFTSlider_box_left_sliderBtn_icon} onClick={inc} />
            </div>
          </div>
          <div className={Style.bigNFTSlider_box_right}>
            <div className={Style.bigNFTSlider_box_right_box}>
              <AiFillFire className={Style.bigNFTSlider_box_right_creator_collection_icon} />
              <h2>{currentNFT?.name || "Hello NFT"}</h2>
              <div className={Style.bigNFTSlider_box_right_creator}>
                <div className={Style.bigNFTSlider_box_right_creator_profile}>
                  <div className={Style.bigNFTSlider_box_right_creator_profile_info}>
                    {listing.assetContractAddress === "0xc52121470851d0cba233c963fcbb23f753eb8709" && ranking && (
                      <p>Rank #{ranking}</p>
                    )}
                    {listing.assetContractAddress === "0xce300b00aa9c066786D609Fc96529DBedAa30B76" && punkRank && (
                      <p>RANK #{punkRank}</p>
                    )}
                    <div className={Style.nftCard}>
                      <MediaRenderer src={currentNFT?.image || ""} className={Style.nftImage} client={client} />
                    </div>
                    <div>|</div>
                    {ownerAddress && <ProfileImage ownerAddresse={ownerAddress} />}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
