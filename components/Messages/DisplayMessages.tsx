"use client";

import React, { useCallback, useEffect, useState } from 'react';
import { BigNumber } from 'ethers';
import EventCard from "./CommentsCard"; 
import styles from "../styles/CommentSection.module.css";
import { useActiveAccount, useReadContract } from 'thirdweb/react';
import { AppMint, BuyCoffeeContract, ChattApp, socialChatContract } from '@/const/contracts';
import { ThirdwebContract, readContract, resolveMethod } from 'thirdweb';

interface Comment {
    ownerAddress: string;
    comment: string;
    timestamp: string;
    commentId?: string;
    isRead?: boolean;
    useCase: string;
}

interface StatusEventsProps { 
    useCase: string;  
    messageId: string;
    friend_key?: string;
}

export const DisplayMessage: React.FC<StatusEventsProps> = ({ useCase, messageId, friend_key }) => {
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setIsLoading] = useState(false);
    const account = useActiveAccount();
    const signerAddress = account?.address;

    const fetchNftComments = useCallback(async (contract: ThirdwebContract, messageId: string) => {
        if (!contract) return;
        setIsLoading(true);
        try {
            const commentsData = await readContract({
                contract,
                method: resolveMethod("getComments"),
                params: [messageId]
            }) as unknown as Array<any>;

            if (commentsData && Array.isArray(commentsData)) {
                const processedComments = commentsData.map(comment => ({
                    ownerAddress: comment[0],
                    comment: comment[2],
                    timestamp: new Date(BigNumber.from(comment[3]).toNumber() * 1000).toLocaleString(),
                    useCase: 'fetchNftComments'
                }))
                .filter(comment => comment.comment && comment.comment.trim().length > 0)
                .reverse();

                setComments(processedComments);
            }
        } catch (error) {
            console.error('Error fetching NFT comments:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const fetchGetFriendMessage = useCallback(async (contract: ThirdwebContract, friend_key: string) => {
        if (!contract) return;
        setIsLoading(true);
        try {
            const messages = await readContract({
                contract,
                method: resolveMethod("readMessage"),
                params: [friend_key]
            }) as unknown as Array<any>;

            if (messages) {
                const formattedMessages = messages.map(message => ({
                    commentId: BigNumber.from(message.commentId).toString(),
                    ownerAddress: message.ownerAddress,
                    comment: message.comment,
                    timestamp: new Date(BigNumber.from(message.timestamp).toNumber() * 1000).toLocaleString(),
                    isRead: message.isRead,
                    useCase: 'fetchGetFriendMessage'
                }));
                setComments(formattedMessages);
            }
        } catch (error) {
            console.error('Error fetching friend messages:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const fetchGetGroupMessage = useCallback(async (contract: ThirdwebContract, messageId: string) => {
        if (!contract) return;
        setIsLoading(true);
        try {
            const groupMessages = await readContract({
                contract,
                method: resolveMethod("readGroupMessages"),
                params: [messageId]
            }) as unknown as Array<any>;

            if (groupMessages) {
                const formattedMessages = groupMessages.map(message => ({
                    commentId: BigNumber.from(message.commentId).toString(),
                    ownerAddress: message.ownerAddress,
                    comment: message.comment,
                    timestamp: new Date(BigNumber.from(message.timestamp).toNumber() * 1000).toLocaleString(),
                    useCase: 'fetchGetGroupMessage'
                }))
                .filter(message => message.comment && message.comment.trim().length > 0)
                .reverse();
                setComments(formattedMessages);
            }
        } catch (error) {
            console.error('Error fetching group messages:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const fetchBuyCoffeeMessage = useCallback(async (contract: ThirdwebContract, signerAddress: string) => {
        if (!signerAddress) return;
        setIsLoading(true);
        try {
            const commentsData = await readContract({
                contract,
                method: resolveMethod("getCoffeesReceived"),
                params: []
            }) as unknown as Array<any>;

            if (commentsData && Array.isArray(commentsData)) {
                const processedComments = commentsData.map(comment => ({
                    ownerAddress: comment[0],
                    comment: comment[2],
                    timestamp: new Date(BigNumber.from(comment[3]).toNumber() * 1000).toLocaleString(),
                    useCase: 'fetchBuyCoffeeMessage'
                }));
                setComments(processedComments);
            }
        } catch (error) {
            console.error('Error fetching coffee messages:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (useCase && messageId && signerAddress) {
            switch (useCase) {
                case "fetchNftComments":
                    fetchNftComments(socialChatContract, messageId);
                    break;
                case "fetchGetFriendMessage":
                    if (friend_key) fetchGetFriendMessage(ChattApp, friend_key);
                    break;
                case "fetchGetGroupMessage":
                    fetchGetGroupMessage(ChattApp, messageId);
                    break;
                case "fetchBuyCoffeeMessage":
                    fetchBuyCoffeeMessage(BuyCoffeeContract, signerAddress);
                    break;
                default:
                    break;
            }
        }
    }, [useCase, messageId, friend_key, fetchNftComments, fetchGetFriendMessage, fetchGetGroupMessage, fetchBuyCoffeeMessage, signerAddress]);

    return (
        <div className={styles.commentsContainer}>
            {comments.map((comment, index) => (
                <EventCard
                    key={index}
                    commentId={comment.commentId || ""}
                    ownerAddress={comment.ownerAddress}
                    tokenId={messageId}
                    comment={comment.comment}
                    timestamp={comment.timestamp}
                    useCase={comment.useCase}
                />
            ))}
        </div>
    );
};

export default DisplayMessage;
