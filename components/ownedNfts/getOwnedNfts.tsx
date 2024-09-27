"use client";
import React, { useEffect, useState, useMemo, useCallback, FC } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Helmet } from 'react-helmet';
import { Button, Menu } from '@mantine/core';
import { SearchIcon } from '@/components/Icons/SearchIcon';
import { SpunksRankingNew } from '@/const/contractabi';
import useDebounce from '@/const/useDebounce';
import { PaginationHelper } from '@/components/NFT/PaginationHelper';
import { PaginationHelperProfile } from '@/components/NFT/PaginationHelperOwned';
import { NFTCard } from '@/components/NFT/NftCardGalerie';
import Stats from '@/components/NFT/BuyStats';
import DefaultStats from '@/components/Stats/DefaultStats';
import { FaTwitter, FaTelegram, FaLink, FaDiscord, FaGlobe, FaGithub } from 'react-icons/fa';
import { NFT_CONTRACTS } from '@/const/nft.contracts';
import styles from '@/components/styles/plasmaWorld.module.css'; // Import your CSS module

import { MediaRenderer, useActiveAccount, useReadContract } from 'thirdweb/react';
import client from '@/lib/client';
import { useNfts } from '@/Hooks/NftOwnedProvider';
import { defineChain, getContract, readContract, resolveMethod, ThirdwebContract } from 'thirdweb';
import { PaginationHelperDefault } from '@/components/NFT/PaginationHelperDefault';
import { getActiveClaimCondition, getOwnedNFTs } from 'thirdweb/extensions/erc721';
import toast from 'react-hot-toast';
import toastStyle from '@/util/toastConfig';


const OwnedNftsComponent: FC<{ contractAddress: string; chainId: number; type: string }> = ({
    contractAddress,
    chainId,
    type,
  }) => {  
    const router = useRouter();
    const address = Array.isArray(contractAddress) ? contractAddress[0] : contractAddress;
    const nftsPerPage = 20;
    const [isSearching, setIsSearching] = useState(false);
    const [activeContract, setActiveContract] = useState<any>(null);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState<string>('');
    const [showOwned, setShowOwned] = useState(false);
    const [contractData, setShowContractData] = useState(false); 

    const account = useActiveAccount();
    const isInContractList = NFT_CONTRACTS.some(contract => contract.address === address);
    const [signerAddress, setSignerAddress] = useState<string | undefined>(undefined);
    const NETWORK = defineChain(chainId); // Use chainId here
    const [ownedPage, setOwnedPage] = useState(1);
    const { ownedNfts3 } = useNfts();
    const [ownedNftsdefault, setOwnedNftsdefault] = useState<{ [key: string]: number[] }>({});
    const [ownedNfts2, setOwnedNfts2] = useState<{ [key: string]: number[] }>({});
    const [loading, setLoading] = useState(false);

    const contract = getContract({
        address: address as string,
        client,
        chain: NETWORK,
    });

    const fetchOwnedNfts = useCallback(async (contractAddress: string, contract: ThirdwebContract) => {
        if (!account) return;
        setLoading(true);

        try {
            const ownedNFTs = await getOwnedNFTs({
                contract,
                owner: account?.address,
            });

            const ids = ownedNFTs.map(nft => Number(nft.id));

            setOwnedNfts2(prevState => {
                const updatedNfts = { ...prevState, [contractAddress]: ids };
                return updatedNfts;
            });
            
        } catch (err) {
            toast.error(
                "Something went wrong while fetching your NFTs!",
                {
                    position: "bottom-center",
                    style: toastStyle,
                }
            );
        } finally {
            setLoading(false);
        }
    }, [account]);

    useEffect(() => {
        if (account) {
            setSignerAddress(account.address);
            fetchOwnedNfts(contractAddress, contract);
        }
    }, [account, fetchOwnedNfts]);

    const ownedTokenIds = useMemo(() => {
        if (contract) {
            return ownedNfts2[contractAddress] 
            ? ownedNfts2[contractAddress]
                : ownedNfts3[contractAddress] || [];
        }
        return [];
    }, [contract, ownedNfts2, contractAddress, ownedNfts3]);

    const paginatedOwnedTokenIds = useMemo(() => {
        const start = (ownedPage - 1) * nftsPerPage;
        return ownedTokenIds.slice(start, start + nftsPerPage);
    }, [ownedPage, ownedTokenIds, nftsPerPage]);

    return (
        <div className={styles.container}>
            <div className={styles.nftGrid}>
            {paginatedOwnedTokenIds.map(id => (
                    contract?.address && (
                        <NFTCard
                            key={id}
                            tokenId={BigInt(id)}
                            contractAddresse={contract.address}
                            chainId={chainId}
                            event={[]}
                        />
                    )
                ))}
            </div>
        
            <div>
                
                    <PaginationHelperProfile contractAddress={activeContract.address} setPage={setOwnedPage} totalItems={ownedTokenIds.length} itemsPerPage={nftsPerPage} />
               
            </div>
        </div>
    );
};

export default OwnedNftsComponent;
