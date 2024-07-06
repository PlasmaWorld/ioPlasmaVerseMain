"use client";

// SocialPostCreator.js
import React, { useEffect, useState } from 'react';
import Picker from 'emoji-picker-react'; 
import styles from "./SocialComment.module.css";
import { resolveMethod, prepareContractCall } from 'thirdweb';
import { useSendTransaction, TransactionButton } from 'thirdweb/react';
import { AppMint, socialChatContract } from '@/const/contracts';
import { useUser } from '@/Hooks/UserInteraction';

interface SocialPostCreatorProps {
    tokenId: string;

    isVisible: boolean;
    onClose: () => void;
  }
  
  const SocialPostCreator2: React.FC<SocialPostCreatorProps> = ({ tokenId,  isVisible, onClose }) => { 
    const [contentHash, setContentHash] = useState("");
    const [characterCount, setCharacterCount] = useState(0);
    const characterDecoration = characterCount >= 140 ? styles.characterCountOver : styles.characterCountUnder;
    const [transactionError, setTransactionError] = useState<string | null>(null);
    const { userExists: ExistUser } = useUser();

    const { mutate: sendTransaction } = useSendTransaction();

    const prepareTransaction = async () => {
        const resolvedMethod = await resolveMethod( "addComment");
        const transaction = await prepareContractCall({
            contract: socialChatContract,
            method: resolvedMethod, 
            params: [tokenId, contentHash]
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
        if (ExistUser === false) {
        }
      }, [ExistUser]);
      
    if (!isVisible) return null;

    return (
        <div className={styles.socialPostCreator}>
            <div className={styles.statusModalContainer}>
                <div className={styles.statusModal}>
                    <div className={styles.statusModalHeader}>
                        <p>Add Comment</p>
                        <button onClick={onClose}>Close</button>
                    </div>
                    <textarea
                        value={contentHash}
                        onChange={(e) => {
                            setContentHash(e.target.value);
                            setCharacterCount(e.target.value.length);
                        }}
                        placeholder="Enter your status"
                    />
                    <div className={styles.characterCountContainer}>
                        <p className={characterDecoration}>{characterCount}/140</p>
                    </div>
                    
                   
                        <TransactionButton
                        transaction={prepareTransaction}
                        onTransactionSent={handleTransactionSent}
                        onTransactionConfirmed={handleTransactionConfirmed}
                        onError={handleTransactionError}
                    >
                        Execute Transaction
                    </TransactionButton>
              <div>
              { !ExistUser && (
             <h1 className="text-lg font-semibold text-gray-700">No Account? Make an Account to Post also in Future from ioPlasmaVerse</h1>

              )}
              </div>
                </div>
            </div>
        </div>
    );
};

export default SocialPostCreator2;
