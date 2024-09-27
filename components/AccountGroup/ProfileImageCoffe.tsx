"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { NFT as NFTType, ThirdwebContract, readContract, resolveMethod } from "thirdweb";
import { AppMint, ChattApp } from "@/const/contracts";
import randomColor from "@/util/randomColor";
import styles from "./image.module.css";
import { BigNumber } from "ethers";
import { getContractMetadata } from "thirdweb/extensions/common";
import { getNFT } from "thirdweb/extensions/erc721";
import { FaTwitter, FaTelegram, FaGlobe } from "react-icons/fa";

const [randomColor1, randomColor2, randomColor3, randomColor4] = [
  randomColor(),
  randomColor(),
  randomColor(),
  randomColor(),
];

interface ProfilePageProps {
  ownerAddresse: string;
  
}

const PencilIcon = () => (
  <svg viewBox="0 0 20 20" fill="currentColor" className="pencil w-6 h-6">
    <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z"></path>
    <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4l-6 6H2V6z" clipRule="evenodd"></path>
  </svg>
);

const ProfileImage: React.FC<ProfilePageProps> = ({ ownerAddresse }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nft, setNFT] = useState<NFTType | null>(null);
  const [ownedNftsProfile, setOwnedNftsProfile] = useState<any | null>(null);
  const [userName, setUserName] = useState<string>('');


  const [tokenId, setTokenId] = useState<string>('');
  const [timestamp, setTimestamp] = useState<string>('');
  const [attributes, setAttributes] = useState<Record<string, any> | undefined>(undefined);
  const [signerAddress, setSignerAddress] = useState<string | undefined>(undefined);
  const [userExists, setUserExists] = useState<boolean | undefined>(undefined);
  const [contract, setContract] = useState("");




  const fetchNFTData = useCallback(async (tokenId: string) => {
    if (tokenId) {
        try {
            const contract = ChattApp;

            // Fetch contract metadata
            const contractMetadata = await getContractMetadata({ contract });
            const contractName = contractMetadata.name;

            // Fetch NFT data
            const nftData = await getNFT({
                contract,
                tokenId: BigInt(tokenId),
                includeOwner: true,
            });


            // Update state with fetched data
            setNFT(nftData);
            setContract(contractName);

            // Extract and set attributes from the NFT metadata
            if (nftData && nftData.metadata) {
                const metadata = nftData.metadata as any;
                if (metadata.attributes) {
                    setAttributes(metadata.attributes);
                } else {
                }
            }
        } catch (error) {
            console.error("Error fetching NFT:", error);
        }
    }
}, []);

  // Get the contract
  const fetchUserInfo = useCallback(async (signerAddress: string | undefined, contract: ThirdwebContract) => {
      if (!signerAddress) return;
      setIsLoading(true);
      try {
          const userInfo = await readContract({
              contract,
              method: resolveMethod("getUserInfo"),
              params: [signerAddress]
          }) as unknown as any[];


          if (userInfo && userInfo.length > 0) {
              const tokenId = BigNumber.from(userInfo[0]).toString();
              const userName = userInfo[1];
              const timestamp = new Date(BigNumber.from(userInfo[2]).toNumber() * 1000).toLocaleString();

              setTokenId(tokenId);
              setUserName(userName);
              setTimestamp(timestamp);

              // Fetch NFT data using the tokenId
              fetchNFTData(tokenId);
          } else {
              setUserName("Unknown user");
              setTokenId("");
              setTimestamp("");
          }
      } catch (error) {
          console.error("Error fetching user info:", error);
          setUserName("Error fetching user info");
          setTokenId("");
          setTimestamp("");
      } finally {
          setIsLoading(false);    
      }
  }, [fetchNFTData]);

  const fetchUserExists = useCallback(async (signerAddress: string | undefined, contract: ThirdwebContract) => {
      if (!signerAddress) return;
      try {
          const exists = await readContract({
              contract,
              method: resolveMethod("checkUserExists"),
              params: [signerAddress]
          }) as unknown as boolean;
          setUserExists(exists);
      } catch (error) {
          console.error('Error checking user existence:', error);
          setUserExists(false);
      }
  }, []);

  
  useEffect(() => {
      if (ownerAddresse) {
          const signerAddress = ownerAddresse;
          setSignerAddress(signerAddress);
          fetchUserInfo(signerAddress, ChattApp);
          fetchUserExists(signerAddress, ChattApp);
      }
  }, [ownerAddresse, fetchUserInfo, fetchUserExists, setSignerAddress]);


  const account = ownerAddresse;
  


  const fetchUserProfile = useCallback(async (signerAddress: string | undefined, contract: ThirdwebContract) => {
    if (!signerAddress) return;
    try {
      const imageUrl = await readContract({
        contract,
        method: resolveMethod("getActiveProfileImage"),
        params: [signerAddress]
      }) as unknown as string;

      if (imageUrl.startsWith("ipfs://")) {
        const ipfsData = await fetchIPFSData(imageUrl);
        setOwnedNftsProfile(ipfsData);
      } else {
        setOwnedNftsProfile({ image: imageUrl });
      }
      setIsLoading(false);
    } catch (error) {
      console.error('Error checking user existence:', error);
      setIsLoading(false);
    }
  }, []);

  const fetchIPFSData = async (ipfsUrl: string) => {
    const url = `https://ipfs.io/ipfs/${ipfsUrl.split("ipfs://")[1]}`;
    const response = await fetch(url);
    return await response.json();
  };

  useEffect(() => {
    if (account) {
      fetchUserProfile(account, AppMint);

    }
  }, [account, fetchUserProfile]);

 

  return (
    <div className="flex flex-col items-center justify-center  min-w-[120px] min-h-[180px]">
      {isLoading ? (
        <div>Loading...</div>      ) : (
        <>
            {ownedNftsProfile ? (
              <Image
                src={ownedNftsProfile.image}
                alt="Profile"
                className={styles.profilePicture}
                width={125}
                height={125}
                style={{
                  background: `linear-gradient(90deg, ${randomColor3}, ${randomColor4})`,
                }} />
            ) : (
              <div
                className={styles.profilePicture}
                style={{
                  background: `linear-gradient(90deg, ${randomColor3}, ${randomColor4})`,
                }} />
            )}

          <div>
          
          </div>

         

          {error && <div className="text-red-500">{error}</div>}
        </>
      )}
      {attributes && (
    <>
        <div className="flex flex-col items-center justify-center">
            <span className="text-xl md:text-2xl font-bold text-white">
                {attributes.userName}
            </span>
            
            <div className="flex justify-center mt-sm">
                {attributes.twitter && (
                    <a href={attributes.twitter} target="_blank" rel="noopener noreferrer" className="mx-2">
                        <FaTwitter />
                    </a>
                )}
                {attributes.telegram && (
                    <a href={attributes.telegram} target="_blank" rel="noopener noreferrer" className="mx-2">
                        <FaTelegram />
                    </a>
                )}
                {attributes.website && (
                    <a href={attributes.website} target="_blank" rel="noopener noreferrer" className="mx-2">
                        <FaGlobe />
                    </a>
                )}
            </div>
          </div>
        </>
    )}
    </div>
  );
};

export default ProfileImage;
