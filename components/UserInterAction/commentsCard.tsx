"use client";

import Link from "next/link";
import styles from "./CommentSection.module.css"; 
import { useCallback, useEffect, useState } from "react";
import { TransactionButton, useReadContract, useSendTransaction } from "thirdweb/react";
import { getOwnedNFTs } from "thirdweb/extensions/erc721";
import { resolveMethod, prepareContractCall, NFT, ThirdwebContract, readContract } from "thirdweb";
import { AppMint, ChattApp, socialChatContract } from "@/const/contracts";
import Image from "next/image";

    interface EventCardProps {
    ownerAddress: string; 
    comment: string;
    tokenId: string;
    commentId: string;
    timestamp: string;  
    };
    export const EventCard: React.FC<EventCardProps> = ({ 
        comment,
        ownerAddress,
        tokenId,
        commentId,
        timestamp  }) => {

    
    ;
    const [userName, setUserName] = useState("Fetching Username...");
    const [nftImageUrl, setNftImageUrl] = useState<string>("");
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
  
    const [transactionError, setTransactionError] = useState<string | null>(null);
        const { mutate: sendTransaction } = useSendTransaction();
        
        
      
        const { data: UsernameData } = useReadContract({
            contract: ChattApp,
            method: "GetUsername",
            params: [ownerAddress],
        });

        const prepareTransaction = async () => {
            const resolvedMethod = await resolveMethod( "deleteComment");
            const transaction = await prepareContractCall({
                contract: socialChatContract,
                method: resolvedMethod, 
                params: [tokenId.toString(), commentId.toString()]
            });
        return transaction;
    };

        
    const handleTransactionSent = () => {
        console.log(sendTransaction,);
    };

    const handleTransactionConfirmed = () => {
        console.log("sendAndConfirmTransaction");
    };

    const handleTransactionError = (error: Error) => {
        console.error(setTransactionError, error);
        setTransactionError(error.message);
    };
        

  
    useEffect(() => {
        if (UsernameData && UsernameData.length > 0) {
            const username = UsernameData[0] as string; 
            setUserName(username);
        }
    }, [UsernameData]);

  return (
      <div className={styles.eventCard}>
          <div className={styles.eventHeader}>
              <Image src={nftImageUrl} alt="Profile" className="rounded-full h-10 w-10 object-cover" />
              <Link href={`/profile/${ownerAddress}`} className={styles.connectedAddress}>
                  {userName}
              </Link>
              <p className={styles.timestampText}>{timestamp}</p>
          </div>
          <p style={{ fontSize: "16px" }}>{comment}</p>
          <TransactionButton
                        transaction={prepareTransaction}
                        onTransactionSent={handleTransactionSent}
                        onTransactionConfirmed={handleTransactionConfirmed}
                        onError={handleTransactionError}
                    >
                        Execute Transaction
                    </TransactionButton>
      </div>
  );
};

export default EventCard;