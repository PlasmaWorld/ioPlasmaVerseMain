"use client";

import React, { useState } from 'react';
import Picker from 'emoji-picker-react'; 
import styles from "../styles/Chat.module.css";
import { resolveMethod, prepareContractCall, sendAndConfirmTransaction } from 'thirdweb';
import { useSendTransaction, TransactionButton } from 'thirdweb/react';
import { ChattApp, BuyCoffeeContract } from '@/const/contracts';
import { useTransactionHandlerBuyCoffee } from '@/TransactionHandler/BuyCoffe';
import { useTransactionHandlerChattApp } from '@/TransactionHandler/ChattApp';
import { Button } from '@mantine/core';
import { IconMessageCircle } from '@tabler/icons-react';

const SendMessage = ({ Chat_Key, useCase }: { Chat_Key: string, useCase: string }) => {
    const [_msg, set_msg] = useState("");
    const [content, setContent] = useState("");
    const [characterCount, setCharacterCount] = useState(0);
    const [modalOpen, setModalOpen] = useState(false);

    const [transactionError, setTransactionError] = useState<string | null>(null);
    const { mutate: sendTransaction } = useSendTransaction();

    const { handleTransaction: sendMassage, isPending: isSendingMessage } = useTransactionHandlerChattApp(
        "sendGroupMessage",
        [Chat_Key.trim(), content],
        () => alert("Group Message successfully"),
        (error) => console.error('Add friend error:', error)
    );

    const { handleTransaction: SendMessage2, isPending: isSendMessage2 } = useTransactionHandlerChattApp(
        "sendMessage",
        [Chat_Key, content],
        () => alert("Message successfully"),
        (error) => console.error('Delete friend error:', error)
    );

    const { handleTransaction: sendMessage3, isPending: isSendMassage3 } = useTransactionHandlerBuyCoffee(
        "sendMessage",
        [Chat_Key, content],
        () => alert("Coffee Message successfully"),
        (error) => console.error('Delete friend error:', error)
    );

    const handleTransactionSent = () => {
        console.log(sendTransaction);
    };

    const handleTransactionConfirmed = () => {
        console.log("sendAndConfirmTransaction");
    };

    const handleTransactionError = (error: Error) => {
        console.error(setTransactionError, error);
        setTransactionError(error.message);
    };

    const prepareTransaction = async () => {
        let resolvedMethod;
        if (useCase === "sendGroupMessage") {
            resolvedMethod = await resolveMethod("sendGroupMessage");
        } else if (useCase === "sendMassage") {
            resolvedMethod = await resolveMethod("sendMessage");
        } else if (useCase === "CoffeeMessage") {
            resolvedMethod = await resolveMethod("sendMessage");
        }

        if (!resolvedMethod) {
            throw new Error("Failed to resolve method");
        }

        return prepareContractCall({
            contract: useCase === "CoffeeMessage" ? BuyCoffeeContract : ChattApp,
            method: resolvedMethod,
            params: [Chat_Key, content],
        });
    };

    const handleButtonClick = async () => {
        setModalOpen(true);
    };

    const handleSendMessage = async () => {
        if (useCase === "SendMassage") {
            await sendMassage();
        } else if (useCase === "GroupMassage") {
            await SendMessage2();
        } else if (useCase === "CoffeeMessage") {
            await sendMessage3();
        }
    };

    return (
        <div className={styles.socialPostCreator}>
            <Button onClick={handleButtonClick} leftIcon={<IconMessageCircle size={16} />}>
                Open Modal
            </Button>
            {modalOpen && (
                <div className={styles.statusModalContainer}>
                    <div className={styles.statusModalHeader}>
                        <p>Send Message</p>
                    </div>
                    <textarea
                        className={styles.textarea}
                        value={content}
                        onChange={(e) => {
                            setContent(e.target.value);
                            setCharacterCount(e.target.value.length);
                        }}
                        placeholder="Enter Your Message"
                    />
                    <TransactionButton
                        transaction={prepareTransaction}
                        onTransactionSent={handleTransactionSent}
                        onTransactionConfirmed={handleTransactionConfirmed}
                        onError={handleTransactionError}
                        onClick={handleSendMessage}
                        disabled={isSendingMessage || isSendMessage2 || isSendMassage3}
                    >
                        Execute Transaction
                    </TransactionButton>
                    {transactionError && <p className={styles.error}>{transactionError}</p>}
                </div>
            )}
        </div>
    );
};

export default SendMessage;
