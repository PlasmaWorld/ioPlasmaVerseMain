"use client";

import React, { useState, useEffect, useCallback } from "react";
import { getOwnedNFTs } from "thirdweb/extensions/erc721";
import { NFT, ThirdwebContract, readContract, resolveMethod } from "thirdweb";
import { useUser } from "@/Hooks/UserInteraction";
import { AppMint } from "@/const/contracts";
import Image from "next/image";

interface ProfilePageProps {
    friend_key: string;
}

const PencilIcon = () => (
    <svg viewBox="0 0 20 20" fill="currentColor" className="pencil w-6 h-6">
        <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z"></path>
        <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4l-6 6H2V6z" clipRule="evenodd"></path>
    </svg>
);

const ProfilePage: React.FC<ProfilePageProps> = ({ friend_key }) => {
    const [profileImageUrl, setProfileImageUrl] = useState("https://avatarfiles.alphacoders.com/161/161002.jpg");
    const [modalOpen, setModalOpen] = useState(false);
    const { userName } = useUser();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastNFT, setLastNFT] = useState<NFT | null>(null);
    const [ownedNftsProfile, setOwnedNftsProfile] = useState<any | null>(null);

  const fetchUsercProfile = useCallback(async (signerAddress: string | undefined, contract: ThirdwebContract) => {
    if (!signerAddress) return;
    try {
      console.log("Fetching profile image for:", signerAddress);
      const exists = await readContract({
        contract,
        method: resolveMethod("getActiveProfileImage"),
        params: [signerAddress]
      }) as unknown as string;
      console.log("Profile image fetched:", exists);
      setOwnedNftsProfile(await fetchIPFSData(exists));
    } catch (error) {
      console.error('Error checking user existence:', error);
    }
  }, []);

  const fetchIPFSData = async (ipfsUrl: string) => {
    const url = `https://ipfs.io/ipfs/${ipfsUrl.split("ipfs://")[1]}`;
    const response = await fetch(url);
    return await response.json();
  };

  useEffect(() => {
    if (friend_key) {
      const signerAddress = friend_key;
      console.log("Account address:", signerAddress);
      fetchUsercProfile(signerAddress, AppMint);
    } else {
      console.log("No account found");
    }
  }, [friend_key, fetchUsercProfile]);

    
    return (
        <div className="flex flex-col items-center justify-center p-4 min-w-[200px] min-h-[300px]">
            {isLoading ? (
                <div>Loading...</div>
            ) : (
                <>
                    <Image
                        src={profileImageUrl + `?${Date.now()}`}
                        alt="Profile"
                        className="rounded-full h-45 w-45 object-cover"
                    />
                    <button
                        onClick={() => setModalOpen(true)}
                        className="rounded-full h-45 w-45 object-cover"
                        title="Change photo">
                        <PencilIcon />
                    </button>
                    <div className="text-white font-bold text-center text-md md:text-lg">{userName}</div>
                    {error && <div className="text-red-500">{error}</div>}
                </>
            )}
        </div>
    );
};

export default ProfilePage;
