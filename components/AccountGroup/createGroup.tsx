"use client";

import React, { useState } from 'react';
import styles from "../UserInterAction/Social.module.css";
import { prepareContractCall, resolveMethod } from "thirdweb";
import { TransactionButton, useSendTransaction } from 'thirdweb/react';
import { ChattApp } from '@/const/contracts';

interface ModalGroupAccountProps {
  onClose: () => void;
  isVisible: boolean;
}

const ModalGroupAccount: React.FC<ModalGroupAccountProps> = ({ onClose, isVisible }) => {
    const [name, setName] = useState<string>("");
    const [isPublic, setIsPublic] = useState<boolean>(true); 
    const [useToken, setUseToken] = useState<boolean>(false);
    const [transactionError, setTransactionError] = useState<string | null>(null);
    const { mutate: sendTransaction } = useSendTransaction();

    const prepareTransaction = async () => {
        const resolvedMethod = await resolveMethod("createGroup");
        const transaction = await prepareContractCall({
            contract: ChattApp,
            method: resolvedMethod, 
            params: [name, isPublic, useToken]
        });
        return transaction;
    };

    const handleTransactionSent = () => {
        console.log(sendTransaction);
    };

    const handleTransactionConfirmed = () => {
        console.log('Transaction confirmed:');
    };

    const handleTransactionError = (error: Error) => {
        console.error(setTransactionError, error);
        setTransactionError(error.message);
    };

    if (!isVisible) return null;

    return (
        <div className={styles.socialPostCreator}>
            <div className={styles.statusModalContainer}>
                <div className={styles.statusModal}>
                    <div className={styles.statusModalHeader}>
                        <h2>Create Your Group on PlasmaVerse</h2>
                        <button onClick={onClose}>Close</button>
                    </div>
                    <textarea
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter group name"
                    />
                    <div className={styles.buttonGroup}>
                        <button onClick={() => setIsPublic(true)} className={isPublic ? styles.activeButton : ""}>
                            Public
                        </button>
                        <button onClick={() => setIsPublic(false)} className={!isPublic ? styles.activeButton : ""}>
                            Private
                        </button>
                    </div>
                    <TransactionButton
                        transaction={prepareTransaction}
                        onTransactionSent={handleTransactionSent}
                        onTransactionConfirmed={handleTransactionConfirmed}
                        onError={handleTransactionError}
                    >
                        Execute Transaction
                    </TransactionButton>
                    {transactionError && <p>Error: {transactionError}</p>}
                </div>
            </div>
        </div>
    );
};

export default ModalGroupAccount;
