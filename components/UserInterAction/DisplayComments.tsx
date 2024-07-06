"use client";

import React, { useEffect, useState } from 'react';
import { BigNumber } from 'ethers';
import EventCard from "./commentsCard"; 
import styles from "./CommentSection.module.css";
import { useReadContract } from 'thirdweb/react';
import { AppMint, socialChatContract } from '@/const/contracts';

interface Comment {
    commentId: string;
    ownerAddress: string;
    comment: string;
    timestamp: string;
}

interface StatusEventsProps {   
    tokenId: string;
}

export const StatusEvents: React.FC<StatusEventsProps> = ({ tokenId }) => {
    const [comments, setComments] = useState<Comment[]>([]);
    
    const { data: commentsData } = useReadContract({
        contract: socialChatContract,
        method: "getComments",
        params: [tokenId],
    });
    
   

    

    useEffect(() => {
        if (commentsData) {
            const processedComments: Comment[] = commentsData.map((comment: any) => {
                return {
                    commentId: BigNumber.from(comment[0]).toString(),
                    ownerAddress: comment[1],
                    comment: comment[2],
                    timestamp: new Date(BigNumber.from(comment[3]).toNumber() * 1000).toLocaleString()
                };
            })
            .filter((comment: Comment) => comment.comment && comment.comment.trim().length > 0)
            .reverse(); 

            setComments(processedComments);
            console.log("Received and formatted comments:", processedComments);
        }
    }, [commentsData]);

    if (commentsData) return <div>Loading comments...</div>;
    if (comments.length === 0) return <div>No comments found.</div>;

    return (
        <div className={styles.commentsContainer}>
            {comments.map((comment, index) => (
                <EventCard
                    key={index}
                    commentId={comment.commentId}
                    ownerAddress={comment.ownerAddress}
                    tokenId={tokenId}
                    comment={comment.comment}
                    timestamp={comment.timestamp}
                />
            ))}
        </div>
    );
};

export default StatusEvents;
