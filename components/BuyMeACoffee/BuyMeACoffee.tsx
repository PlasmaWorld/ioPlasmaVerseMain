'use client';

import React, { useCallback, useEffect, useState } from 'react';
import styles from "./user.module.css";
import { BuyCoffeeContract, AppMint, ChattApp, BuzzBotsContract } from '../../const/contracts';
import { BigNumber } from 'ethers';
import Link from 'next/link';
import { Card, Button, Text, Modal, Group } from '@mantine/core';
import { useActiveAccount } from 'thirdweb/react';
import { ThirdwebContract, readContract, resolveMethod } from 'thirdweb';
import BuyMeCoffee from './CoffeeBuy';
import randomColor from '@/util/randomColor';
import ProfileImage from '../AccountGroup/ProfileImageCoffe';
import { useUser } from '@/Hooks/UserInteraction';

const [randomColor1, randomColor2, randomColor3, randomColor4] = [
    randomColor(),
    randomColor(),
    randomColor(),
    randomColor(),
];

interface UserCardProps {
    onClose: () => void;
    ownerAddress: string;
}

const UserCard: React.FC<UserCardProps> = ({ onClose, ownerAddress }) => {
    const account = useActiveAccount();
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [amount, setAmount] = useState('');
    const [displayName, setDisplayName] = useState("Loading...");
    const [coffeeCount, setCoffeeCount] = useState(0);
    const [userCoffee, setUserCoffee] = useState(0);
    const [userName, setUserName] = useState<string>('');
    const [timestampUser, setTimestampUser] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [ownedNftsProfile, setOwnedNftsProfile] = useState<any | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [userExists, setUserExists] = useState<boolean | undefined>(undefined);
    const { userExists: ExistUser , } = useUser();
    const [tokenId, setTokenId] = useState<string>('');
    const [timestamp, setTimestamp] = useState<string>('');

    useEffect(() => {
        if (ExistUser === false) {
        }
      }, [ExistUser]);

      const signerAddress = ownerAddress;
    
    const fetchUsername = useCallback(async (signerAddress: string | undefined, contract: ThirdwebContract) => {
        if (!signerAddress) return;
        setIsLoading(true);
        console.log("Fetching user info started for signerAddress:", signerAddress);
        try {
            const userInfo = await readContract({
                contract,
                method: resolveMethod("getUserInfo"),
                params: [signerAddress]
            }) as unknown as any[];
  
            console.log("Fetched user info:", userInfo);
  
            if (userInfo && userInfo.length > 0) {
                const tokenId = BigNumber.from(userInfo[0]).toString();
                const userName = userInfo[1];
                const timestamp = new Date(BigNumber.from(userInfo[2]).toNumber() * 1000).toLocaleString();
  
                setTokenId(tokenId);
                setUserName(userName);
                setTimestamp(timestamp);
  
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

    const fetchgetCoffeeCount = useCallback(async (signerAddress: string | undefined, contract: ThirdwebContract) => {
        if (!signerAddress) return;
        setIsLoading(true);
        try {
            const CoffeeData = await readContract({
                contract,
                method: resolveMethod("getCoffeesReceived"),
                params: [signerAddress]
            }) as unknown as BigNumber;

            if (CoffeeData && BigNumber.isBigNumber(CoffeeData)) {
                setCoffeeCount(CoffeeData.toNumber());
            }
        } catch (error) {
            console.error('Error fetching coffee count:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const fetchgetCoffeesReceived = useCallback(async (signerAddress: string | undefined, contract: ThirdwebContract) => {
        if (!signerAddress) return;
        setIsLoading(true);
        try {
            const CoffeeGivenData = await readContract({
                contract,
                method: resolveMethod("getCoffeeGivenCount"),
                params: [signerAddress]
            }) as unknown as BigNumber;

            if (CoffeeGivenData && BigNumber.isBigNumber(CoffeeGivenData)) {
                setUserCoffee(CoffeeGivenData.toNumber());
            }
        } catch (error) {
            console.error('Error fetching coffee received:', error);
        } finally {
            setIsLoading(false);
        }
    }, [    ]);

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
            setOwnedNftsProfile({ imageUrl });
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

    const fetchUserExists = useCallback(async (signerAddress: string | undefined, contract: ThirdwebContract) => {
        if (!signerAddress) return;
        try {
            const exists = await readContract({
                contract,
                method: resolveMethod("checkUserExists"),
                params: [signerAddress]
            }) as unknown as boolean;
            setUserExists(exists);
            console.log("userExists", { exists });
        } catch (error) {
            console.error('Error checking user existence:', error);
            setUserExists(false);
        }
    }, []);

    useEffect(() => {
        if (ownerAddress) {
            fetchUserExists(ownerAddress, ChattApp);
        } else {
            console.log("No account found");
        }
    }, [ownerAddress, fetchUserExists]);

    useEffect(() => {
        if (userExists) {
            fetchUserProfile(ownerAddress, AppMint);
            fetchgetCoffeeCount(ownerAddress, BuyCoffeeContract);
            fetchUsername(ownerAddress, ChattApp);
            fetchgetCoffeesReceived(ownerAddress, BuzzBotsContract);
        }
    }, [userExists, ownerAddress, fetchUserProfile, fetchgetCoffeeCount, fetchUsername, fetchgetCoffeesReceived]);

    if (userExists === false) {
        return (
            <div>
                <Text align="center" weight={700} size="lg" mt="md">
                    <Link href={`/profile/${ownerAddress}`} className="text-blue-600 hover:underline">
                        {ownerAddress}
                    </Link>
                </Text>
            </div>
        );
    }

    if (userExists === undefined) {
        return (
            <div>
                <Text align="center" weight={700} size="lg" mt="md">
                    Loading...
                </Text>
            </div>
        );
    }

    return (
        <div className={styles.overlay}>
            <div className={styles.cardContainer}>
                <Card withBorder radius="md" className={styles.card}>
                    <button 
                        onClick={onClose} 
                        className={styles.buttonClose}
                    >
                        &times;
                    </button>
                    <Card.Section
                        style={{
                            backgroundImage: 'url(/hero-gradient2.png)',
                        }}
                    />
                    <Group position="center" mt="md">
                    <div className={styles.profilePictureWrapper}>
                        <ProfileImage ownerAddresse={ownerAddress} />
                    </div>
                    </Group>
                    <Text align="center" weight={700} size="lg" mt="md">
                        <Link href={`/profile/${ownerAddress}`} className="text-blue-600 hover:underline">
                            {userName}
                        </Link>
                    </Text>
                    <Group mt="md" position="center" spacing="xl">
                        <div>
                            <Text align="center" size="lg" weight={500} className={styles.statText}>
                                {coffeeCount}
                            </Text>
                            <Text align="center" size="sm" className={styles.statText}>
                                Coffees Received
                            </Text>
                        </div>
                        <div>
                            <Text align="center" size="lg" weight={500} className={styles.statText}>
                                {userCoffee}
                            </Text>
                            <Text align="center" size="sm" className={styles.statText}>
                                Coffees Given
                            </Text>
                        </div>
                        <div>
                            <Text align="center" size="lg" weight={500} className={styles.statText}>
                                Coming Soon
                            </Text>
                            <Text align="center" size="sm" className={styles.statText}>
                                Posts
                            </Text>
                        </div>
                    </Group>
                    {ExistUser && (
                        <Button fullWidth radius="md" mt="xl" size="md" variant="default" onClick={() => setModalOpen(true)}>
                            Buy Me Coffee
                        </Button>
                    )}
                </Card>

                <Modal opened={modalOpen} onClose={() => setModalOpen(false)} title="Buy Me Coffee">
                    <BuyMeCoffee userAddress={ownerAddress} onClose={() => setModalOpen(false)} />
                </Modal>

                {successMessage && <p className="text-green-500 mt-4">{successMessage}</p>}
                {errorMessage && <p className="text-red-500 mt-4">{errorMessage}</p>}
            </div>
        </div>
    );
};

export default UserCard;