"use client";

import Link from "next/link";
import styles from "../styles/CommentSection.module.css";
import { useCallback, useEffect, useState } from "react";
import { TransactionButton, useReadContract, useSendTransaction } from "thirdweb/react";
import { getOwnedNFTs } from "thirdweb/extensions/erc721";
import { resolveMethod, prepareContractCall, NFT, ThirdwebContract, readContract } from "thirdweb";
import { useTransactionHandlerChattApp } from "@/TransactionHandler/ChattApp";
import { useTransactionHandler } from "../UserInterAction/TransactionHandler";
import { FaFireAlt } from "react-icons/fa";
import { AppMint, socialChatContract } from '@/const/contracts';
import Image from "next/image";
import { useUser } from "@/Hooks/UserInteraction";

interface EventCardProps {
    ownerAddress: string; 
    comment: string;
    tokenId: string;
    commentId: string;
    timestamp: string;  
    useCase: string;
}

export const EventCard: React.FC<EventCardProps> = ({ 
    comment,
    ownerAddress,
    tokenId,
    commentId,
    timestamp,
    useCase }) => {

    const [nftImageUrl, setNftImageUrl] = useState<string>("");
    const { userName } = useUser();

    const [transactionError, setTransactionError] = useState<string | null>(null);
    const { mutate: sendTransaction } = useSendTransaction();
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
      if (ownerAddress) {
        const signerAddress = ownerAddress;
        console.log("Account address:", signerAddress);
        fetchUsercProfile(signerAddress, AppMint);
      } else {
        console.log("No account found");
      }
    }, [ownerAddress, fetchUsercProfile]);
  
        
    
      
    const { handleTransaction: handleDeleteCommentNft, isPending: isDeleteCommentNft } = useTransactionHandler(
        "deleteComment",
        [tokenId, commentId],
        () => alert("Comment deleted successfully"),
        (error) => console.error('Delete comment error:', error)
    );

    const { handleTransaction: handleDeleteCommentGroup, isPending: isDeleteCommentGroup } = useTransactionHandlerChattApp(
        "deleteGroupMessage",
        [tokenId, commentId],
        () => alert("Group comment deleted successfully"),
        (error) => console.error('Delete group comment error:', error)
    );

    const { handleTransaction: handleDeleteCommentFriend, isPending: isDeleteCommentFriend } = useTransactionHandlerChattApp(
        "deleteMessage",
        [tokenId, commentId],
        () => alert("Friend comment deleted successfully"),
        (error) => console.error('Delete friend comment error:', error)
    );

    const handleTransactionSent = () => {
        console.log("Transaction sent");
    };

    const handleTransactionConfirmed = () => {
        console.log("Transaction confirmed");
    };

    const handleTransactionError = (error: Error) => {
        console.error(error);
        setTransactionError(error.message);
    };

    const handleBurn = async () => {
        switch (useCase) {
            case 'fetchNftComments':
                await handleDeleteCommentNft();
                break;
            case 'fetchGetGroupMessage':
                await handleDeleteCommentGroup();
                break;
            case 'fetchGetFriendMessage':
                await handleDeleteCommentFriend();
                break;
            default:
                console.error("Invalid use case");
        }
    };

    const isBurning = isDeleteCommentNft || isDeleteCommentGroup || isDeleteCommentFriend;

    return (
        <div className={styles.eventCard}>
            <div className={styles.eventHeader}>
                <Image src={ownedNftsProfile.image} alt="Profile" className="rounded-full h-10 w-10 object-cover" />
                <Link href={`/profile/${ownerAddress}`} className={styles.connectedAddress}>
                    {userName}
                </Link>
                <p className={styles.timestampText}>{timestamp}</p>
                <button
                    onClick={handleBurn}
                    disabled={isBurning}
                    className={`${styles.burnButton} ${isBurning ? '' : styles.iconOnlyButton}`}
                >
                    <FaFireAlt />
                </button>
            </div>
            <p style={{ fontSize: "16px" }}>{comment}</p>
            {transactionError && <p className={styles.error}>{transactionError}</p>}
        </div>
    );
};

export default EventCard;
