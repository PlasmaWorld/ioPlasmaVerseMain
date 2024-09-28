"use client";

import React, { createContext, useContext, useEffect, ReactNode, useState, useRef, useCallback } from 'react';
import { useActiveAccount } from "thirdweb/react";
import { Chain, ThirdwebContract, defineChain, getContract, readContract, resolveMethod } from 'thirdweb';
import client from '@/lib/client'; // Ensure this is correctly defined and imported
import { getContractMetadata } from 'thirdweb/extensions/common';
import { getNFT } from 'thirdweb/extensions/erc721';
import { NFT as NFTType } from "thirdweb";
import { BigNumber } from 'ethers';
import { ChattApp } from '@/const/contracts';
import { fetchIoPlasmaContract, fetchMimoMarketplace } from '@/lib/watchContractEvents';

type UserContextType = {
    signerAddress?: string;
    userName: string;
    tokenId: string;
    timestamp: string;
    userExists?: boolean;
    isLoading: boolean;
    attributes?: Record<string, any>;
};

// Create a context
const UserContext = createContext<UserContextType | undefined>(undefined);

interface UserProviderProps {
    children: ReactNode;
}

export type DeliveryData = {
    street: string;
    houseNumber: string;
    postcode: string;
    city: string;
    country: string;
};

export type UserAccount = {
    userName: string;
    address: string;
    chain: Chain;
    type: "male" | "female";
    title?: string;
    name?: string;
    age?: string;
    thumbnailUrl?: string;
    explorer?: string;
    deliveryAddress?: DeliveryData;
    twitter?: string;
    telegram?: string;
    website?: string;
};

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
    const account = useActiveAccount();
    const [userName, setUserName] = useState<string>('');
    const [tokenId, setTokenId] = useState<string>('');
    const [timestamp, setTimestamp] = useState<string>('');
    const [attributes, setAttributes] = useState<Record<string, any> | undefined>(undefined);
    const [signerAddress, setSignerAddress] = useState<string | undefined>(undefined);
    const [userExists, setUserExists] = useState<boolean | undefined>(undefined);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [contract, setContract] = useState("");
    const [nft, setNFT] = useState<NFTType | null>(null);

    // Define the chain correctly
    const NETWORK3 = defineChain(4690);

    // Ensure client is properly initialized
    if (!client) {
        console.error("Client is not initialized");
        return null;
    }
    
      
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
    }, []);

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

    useEffect(() => {
        if (account) {
            const signerAddress = account.address;
            setSignerAddress(signerAddress);
            fetchUserInfo(signerAddress, ChattApp);
            fetchUserExists(signerAddress, ChattApp);
        }
    }, [account, fetchUserInfo, fetchUserExists, ChattApp]);

    return (
        <UserContext.Provider value={{
            signerAddress,
            userName,
            tokenId,
            timestamp,
            userExists,
            isLoading,
            attributes,
        }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = (): UserContextType => {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
};
