"use client";

import React, { useCallback, useEffect, useState } from "react";
import styles from "./NftSocial.module.css";
import Link from "next/link";
import StatusEvents from "./DisplayComments";
import { BigNumber } from "ethers";
import { useReadContract, MediaRenderer } from "thirdweb/react";
import { AppMint, ChattApp, socialChatContract } from "@/const/contracts";
import client from "@/lib/client";
import SocialPostCreator2 from "./SocialComment";
import { FaFireAlt, FaThumbsUp } from "react-icons/fa";
import { useTransactionHandler } from "./TransactionHandler"; // Assuming you save the hook in the same directory
import { ThirdwebContract, readContract, resolveMethod } from "thirdweb";
import Image from "next/image";
import randomColor from "@/util/randomColor";

const MAX_LENGTH = 100;

const [randomColor1, randomColor2, randomColor3, randomColor4] = [
  randomColor(),
  randomColor(),
  randomColor(),
  randomColor(),
];

interface NFT {
  metadata: {
    image: string;
  };
  owner: string;
}

interface INFTCardProps {
  tokenId: BigNumber;
  imageUrl: string;
  name: string;
  description: string;
  ownerAddress: string;
}

const defaultPlaceholder = "/path/to/default-placeholder.png";

const PencilIcon = () => (
  <svg viewBox="0 0 20 20" fill="currentColor" className="pencil w-1 h-1">
    <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z"></path>
    <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4l-6 6H2V6z" clipRule="evenodd"></path>
  </svg>
);

const convertIpfsToHttp = (ipfsUrl: string) => {
  return `https://ipfs.io/ipfs/${ipfsUrl.split("ipfs://")[1]}`;
};

export const NFTCard: React.FC<INFTCardProps> = ({
  tokenId,
  imageUrl,
  name,
  description,
  ownerAddress,
}) => {
  const initialProfileImageUrl = "https://avatarfiles.alphacoders.com/161/161002.jpg";
  const [modalOpen, setModalOpen] = useState(false);

  const [profileImageUrl, setProfileImageUrl] = useState(initialProfileImageUrl);
  const [displayName, setDisplayName] = useState("Loading...");
  const [isSocialModalOpen, setSocialModalOpen] = useState(false);
  const [isCommentsModalOpen, setCommentsModalOpen] = useState(false);
  const showReadMoreLink = description.length > MAX_LENGTH;
  const toggleSocialModal = () => setSocialModalOpen(!isSocialModalOpen);
  const toggleDescription = () => setDescriptionExpanded(!isDescriptionExpanded);
  const [isDescriptionExpanded, setDescriptionExpanded] = useState(false);
  const date = new Date(parseInt(name)).toLocaleString(); 
  const [likingInProgress, setLikingInProgress] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const tokenIdString = tokenId.toString();
  const [nftImageUrl, setNftImageUrl] = useState<string>(imageUrl);
  const [Profile, setProfile] = useState("profileImage");
  const [userName, setUserName] = useState<string>('');
  const [signerAddress, setSignerAddress] = useState(ownerAddress);
  const [userExists, setUserExists] = useState<boolean | undefined>(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [ownedNftsProfile, setOwnedNftsProfile] = useState<any | null>(null);
  const [ownedNftsBackRound, setOwnedNftsBackRound] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  console.log("Profile Address:", ownerAddress); // Debugging line

  const fetchUserProfile = useCallback(async (signerAddress: string | undefined, contract: ThirdwebContract) => {
    if (!signerAddress) return;
    try {
      console.log("Fetching profile image for:", signerAddress);
      const imageUrl = await readContract({
        contract,
        method: resolveMethod("getActiveProfileImage"),
        params: [signerAddress]
      }) as unknown as string;
      console.log("Profile image fetched:", imageUrl);

      if (imageUrl.startsWith("ipfs://")) {
        const ipfsData = await fetchIPFSData(imageUrl);
        setOwnedNftsProfile(ipfsData);
      } else {
        setOwnedNftsProfile({ image: imageUrl });
      }
      setIsLoading(false);
    } catch (error) {
      console.error('Error checking user existence:', error);
      setError('Failed to load profile image.');
      setIsLoading(false);
    }
  }, []);

  

  const fetchIPFSData = async (ipfsUrl: string) => {
    const url = `https://ipfs.io/ipfs/${ipfsUrl.split("ipfs://")[1]}`;
    const response = await fetch(url);
    return await response.json();
  };

  useEffect(() => {
    if (ownerAddress) {
      console.log("Account address:", ownerAddress);
      fetchUserProfile(ownerAddress, AppMint);
    } else {
      console.log("No account found");
    }
  }, [ownerAddress, fetchUserProfile]);

  const fetchUsername = useCallback(async (signerAddress: string | undefined, contract: ThirdwebContract) => {
    if (!signerAddress) return;
    setIsLoading(true);
    try {
        const usernameData = await readContract({
            contract,
            method: resolveMethod("getUserInfo"),
            params: [signerAddress]
        }) as unknown as string[];

        if (usernameData && usernameData.length > 0) {
            setUserName(usernameData[0]);

        } else {
            setUserName("Unknown user");
        }
    } catch (error) {
        console.error('Error fetching username:', error);
    } finally {
        setIsLoading(false);
    }
}, []);

useEffect(() => {
  if (ownerAddress) {
      const signerAddress = ownerAddress;
      setSignerAddress(signerAddress);
      fetchUsername(signerAddress, ChattApp);
  }
}, [ownerAddress, fetchUsername]);

  let descriptionContent;
  if (isDescriptionExpanded) {
    descriptionContent = description;
  } else {
    descriptionContent = description.substring(0, MAX_LENGTH) + (showReadMoreLink ? '...' : '');
  }
  const readMoreButtonText = isDescriptionExpanded ? "Show Less" : "Read More";

 
  const { data: likesData, isLoading: likesLoading, error: likesError } = useReadContract({
    contract: socialChatContract,
    method: "getLikes",
    params: [tokenId],
  });

  useEffect(() => {
    if (likesData && likesData.length > 0) {
      const likeCount = likesData[0] as string; 
      setLikeCount(parseInt(likesData.toString()));
    }
  }, [likesData]);

  const handleTransactionError = (error: Error) => {
    console.error(error);
    alert(error.message);
  };

  const { handleTransaction: handleBurn, isPending: isBurning } = useTransactionHandler(
    "burn",
    [tokenId.toString()],
    () => alert("Burn successful"),
    handleTransactionError
  );

  const { handleTransaction: handleLike, isPending: isLiking } = useTransactionHandler(
    "like",
    [tokenId.toString()],
    () => setLikeCount(prev => prev + 1),
    handleTransactionError
  );

  return (
    <div className={styles.nftCard}>
      <div className={styles.topContainer}>
        {ownedNftsProfile ? (
          <Image
          src={ownedNftsProfile.image}
          alt="Profile"
          className={styles.profilePicture}
          width={125}
          height={125}
          style={{
            background: `linear-gradient(90deg, ${randomColor3}, ${randomColor4})`,
          }}
        />
        ) : (
          <Image 
            src={defaultPlaceholder} 
            alt="Profile" 
            className="rounded-full h-10 w-10 object-cover" // Smaller size
            width={32} // Adjust width
            height={32} // Adjust height
          />
        )}
        <button
          onClick={() => setModalOpen(true)}
          className="absolute upstairs-0 left-0 m-auto w-fit p-2 rounded-full bg-gray-800 hover:bg-gray-700 border border-gray-600"
          title="Change photo"
        >
          <PencilIcon />
        </button>        
        <p className={styles.timestampText}>{date}</p>
        <button
          onClick={handleBurn}
          disabled={isBurning}
          className={`${styles.burnButton} ${isBurning ? '' : styles.iconOnlyButton}`}
        >
          <FaFireAlt />
        </button>
      </div>

      <div className={styles.imageContainer}>
        <MediaRenderer
          client={client}
          src={nftImageUrl}
          alt="NFT Image"
          className={styles.nftImage}
        />
      </div>

      <div className={styles.infoContainer}>
        <div className={styles.infoTopRow}>
          <Link href={`/profile/${ownerAddress}`} className={styles.connectedAddress}>
            {userName}
          </Link>
          <button
            aria-label="Add Comment"
            onClick={toggleSocialModal}
            className={styles.addCommentButton}
          >
            <Image src="/Comment.jpg" alt="Add Comment" width={24} height={24} />
          </button>
          <button
            onClick={handleLike}
            disabled={isLiking}
            className={styles.iconButton}
          >
            <FaThumbsUp />
          </button>
        </div>
        <div className={`${styles.nftDescription} ${isDescriptionExpanded ? styles.expanded : ''}`}>
          {descriptionContent}
        </div>
        {showReadMoreLink && (
          <button onClick={toggleDescription} className={styles.readMoreLink}>
            {readMoreButtonText}
          </button>
        )}
        <button onClick={() => setCommentsModalOpen(true)} className={styles.readCommentsButton}>
          Read Comments
        </button>
      </div>

      {isCommentsModalOpen && (
        <div className={`${styles.commentsContainer} bg-#0056b3 p-4 rounded-lg`}>
          <button onClick={() => setCommentsModalOpen(false)}>Close</button>
          <StatusEvents tokenId={tokenIdString} />
        </div>
      )}
      
      <SocialPostCreator2 tokenId={tokenId.toString()} isVisible={isSocialModalOpen} onClose={() => setSocialModalOpen(false)} />
    </div>
  );
};

export default NFTCard;
