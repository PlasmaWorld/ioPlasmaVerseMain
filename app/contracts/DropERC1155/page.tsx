"use client";
import React, { useEffect, useState, useMemo, useCallback } from 'react';
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
import styles from '@/components/styles/ContractDeploy.module.css'; // Import your CSS module

import { MediaRenderer, useActiveAccount, useReadContract } from 'thirdweb/react';
import client from '@/lib/client';
import { NFTGridLoading } from '@/components/NFT/NFTGrid';
import { MARKETPLACE, NETWORK as DEFAULT_NETWORK } from '@/const/contracts';
import { getAllValidListings, getAllValidAuctions, getAllValidOffers } from 'thirdweb/extensions/marketplace';
import { useNfts } from '@/Hooks/NftOwnedProvider';
import { getContractMetadata } from 'thirdweb/extensions/common';
import { defineChain, getContract, readContract, resolveMethod, ThirdwebContract } from 'thirdweb';
import { ChainList } from '@/const/ChainList';
import { PaginationHelperDefault } from '@/components/NFT/PaginationHelperDefault';
import { getActiveClaimCondition, getOwnedNFTs } from 'thirdweb/extensions/erc721';
import toast from 'react-hot-toast';
import toastStyle from '@/util/toastConfig';
import Explorer from '@/components/Explorer/Explorer';
import ContractSettings from '@/components/Explorer/ContractsSettings';
import MintComponent from '@/components/MintApp/MintApp';
import ClaimAppGalerie from '@/components/claim/claimApp';
import ClaimConditon from '@/components/claim/claimConditionErc1155';
import LayzMintComponentErc1155 from '@/components/layzMint/LayzMintErc1155';
import ClaimAppErc1155 from '@/components/claim/claimAppERC1155';
import DeployContract from '@/components/contracts/ContractDeployModa';

const PlasmaWorld: React.FC = () => {
  const router = useRouter();
  const { typeForm } = useParams();
  const type = Array.isArray(typeForm) ? typeForm[0] : typeForm;

  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };
  
  const [showExplorer, setShowExplorere] = useState(false);
  const [showClaim, setShowClaim] = useState(false);
  const [showMint, setShowMint] = useState(false);
  const [showClaimCondition, setShowClaimCondition] = useState(false);
  const [lazyMint, setLazyMint] = useState(false);
  const [contractData, setShowContractData] = useState(false); 

  const account = useActiveAccount();

  const NETWORK = defineChain(4689); // Use chainIdNumber here

  const chainId = 4689;

  
  const contractAddress = "0x864281821E0037d5163b694DBFfCD0164d6F8e52";

  const contract = getContract({
    address: contractAddress,
    client,
    chain: NETWORK,
  });

  const toggleExplorer = useCallback(() => {
    setShowExplorere(prev => !prev);
  }, []);

  

  const toggleContractData = useCallback(() => {
    setShowContractData(prev => !prev);
  }, []);

  const toggleContractClaim = useCallback(() => {
    setShowClaim(prev => !prev);
  }, []);

  const toggleContractMint = useCallback(() => {
    setShowMint(prev => !prev);
  }, []);
  
  const toggleContractClaimConditon = useCallback(() => {
    setShowClaimCondition(prev => !prev);
  }, []);

  const toggleLazyMint = useCallback(() => {
    setLazyMint(prev => !prev);
  }, []);

  return (
    <div className={styles.container}>
      <Helmet>
        <title>Thirdwebs  Edition Drop ERC1155</title>
                    <h2>Release ERC1155 tokens for a set price.</h2>
                    </Helmet>
                    <div className={styles.thirdwebInfoContainer}>
                    <h2>Edition Drop Contract</h2>
                    <p>
                        The Edition Drop contract is best used when you want to release many NFTs based on the same asset and uses the ERC1155 Standard, also known as  &quot;Semi-Fungible Tokens&quot;.
                    </p>
                    <p>
                        The Edition Drop contract allows you to define the conditions for when and how your users can mint an NFT, including allowlists, release dates, and claim limits.
                    </p>

                    <h3>Use Cases &amp; Examples</h3>
                    <ul>
                        <li>Create NFT Memberships such as our Early Access Cards that you want your users to claim</li>
                        <li>Release an item in your game for a limited-time</li>
                        <li>Create 100 NFTs based on one art piece, and allow users to claim one per wallet</li>
                    </ul>
                    </div>

                    <div className={styles.contractDetails}>
                    <h3>Published by</h3>
                    <p>thirdweb.eth</p>
                    <div className={styles.socials}>
                    <a href={"https://x.com/thirdweb"} target="_blank" rel="noopener noreferrer">
                  <FaTwitter />
                </a>
              
                
                <a href={"https://thirdweb.com"} target="_blank" rel="noopener noreferrer">
                  <FaGlobe />
                </a>
              
                <a href={"https://github.com/thirdweb-dev"} target="_blank" rel="noopener noreferrer">
                  <FaGithub />
                </a>
              
                <a href={"https://discord.gg/thirdweb"} target="_blank" rel="noopener noreferrer">
                  <FaDiscord />
                </a>
                        </div>
            <h3>Details</h3>
            <p><strong>Publish Date:</strong> Dec 18, 2023</p>
            <p>
            <a href="https://d391b93f5f62d9c15f67142e43841acc.ipfscdn.io/ipfs/bafybeid3zrwibivvrijgggpn4kc44htb4rgs6xn26er3iqkyn3tvbmtnda/" target="_blank" rel="noopener noreferrer">
                    AuditReport
                    </a>                </p>
            
            <h3>Licenses</h3>
            <p>MIT, Apache-2.0</p>
            
            <h3>Extensions</h3>
            <ul>
                <li>
                <a href="https://portal.thirdweb.com/contracts/build/extensions/erc-1155/ERC1155" target="_blank" rel="noopener noreferrer">
                    ERC1155
                </a>
                </li>
                <li>
                <a href="https://portal.thirdweb.com/contracts/build/extensions/erc-1155/ERC1155Supply" target="_blank" rel="noopener noreferrer">
                    ERC1155Supply
                </a>
                </li>
                <li>
                <a href="https://portal.thirdweb.com/contracts/build/extensions/erc-1155/ERC1155Enumerable" target="_blank" rel="noopener noreferrer">
                    ERC1155Enumerable
                </a>
                </li>
                <li>
                <a href="https://portal.thirdweb.com/contracts/build/extensions/erc-1155/ERC1155LazyMintableV2" target="_blank" rel="noopener noreferrer">
                    ERC1155LazyMintableV2
                </a>
                </li>
                <li>
                <a href="https://portal.thirdweb.com/contracts/build/extensions/erc-1155/ERC1155ClaimPhasesV2" target="_blank" rel="noopener noreferrer">
                    ERC1155ClaimPhasesV2
                </a>
                </li>
                <li>
                <a href="https://portal.thirdweb.com/contracts/build/extensions/royalty/Royalty" target="_blank" rel="noopener noreferrer">
                    Royalty
                </a>
                </li>
                <li>
                <a href="https://portal.thirdweb.com/contracts/build/extensions/platform-fee/PlatformFee" target="_blank" rel="noopener noreferrer">
                    PlatformFee
                </a>
                </li>
                <li>
                <a href="https://portal.thirdweb.com/contracts/build/extensions/primary-sale/PrimarySale" target="_blank" rel="noopener noreferrer">
                    PrimarySale
                </a>
                </li>
                <li>
                <a href="https://portal.thirdweb.com/contracts/build/extensions/permissions/Permissions" target="_blank" rel="noopener noreferrer">
                    Permissions
                </a>
                </li>
                <li>
                <a href="https://portal.thirdweb.com/contracts/build/extensions/permissions-enumerable/PermissionsEnumerable" target="_blank" rel="noopener noreferrer">
                    PermissionsEnumerable
                </a>
                </li>
                <li>
                <a href="https://portal.thirdweb.com/contracts/build/extensions/contract-metadata/ContractMetadata" target="_blank" rel="noopener noreferrer">
                    ContractMetadata
                </a>
                </li>
                <li>
                <a href="https://portal.thirdweb.com/contracts/build/extensions/ownable/Ownable" target="_blank" rel="noopener noreferrer">
                    Ownable
                </a>
                </li>
                <li>
                <a href="https://portal.thirdweb.com/contracts/build/extensions/gasless/Gasless" target="_blank" rel="noopener noreferrer">
                    Gasless
                </a>
                </li>
                <li>
                <a href="https://portal.thirdweb.com/contracts/build/extensions/fallback/Fallback" target="_blank" rel="noopener noreferrer">
                    Fallback
                </a>
                </li>
                <li>
                <button className={styles.openModalButton} onClick={handleOpenModal}>
                  Deploy Contract
                </button>
                </li>
            </ul>
            </div>


            <div className={styles.buttonContainer}>
        <Button onClick={toggleExplorer}>
          {showExplorer ? 'Hide Explorer' : 'Show Explorer'}
        </Button>
          <Button onClick={toggleContractData}>
            {showExplorer ? 'Hide ContractSettings' : 'ContractSettings'}
          </Button>
          
          <Button onClick={toggleContractClaim}>
            {showClaim ? 'Hide ContractClaim' : 'ContractClaim'}
          </Button>
          <Button onClick={toggleContractClaimConditon}>
            {showClaimCondition ? 'Hide ClaimCondition' : 'ClaimCondition'}
          </Button>
          <Button onClick={toggleLazyMint}>
            {lazyMint ? 'Hide LazyMint' : 'LazyMint'}
          </Button>
      </div>
      <div className={styles.details}>
      </div>
      {showExplorer && (
          <div className={styles.explorer}>
            <Explorer contractAddress={contractAddress} chainId={chainId} type={"DropERC1155"} />
          </div>
        )}
                  {isModalOpen && <DeployContract name={"DropERC1155"} onClose={handleCloseModal} version={''} />}

        {contractData && (
          <div className={styles.contractData}>
            <ContractSettings contractAddress={contractAddress} chainId={chainId} />
          </div>
        )}
        {showClaim && (
          <div className={styles.claim}>
            <ClaimAppErc1155 contractAddress={contractAddress} chainId={chainId} />
          </div>
        )}
         {showClaimCondition && (
          <div className={styles.claim}>
            <ClaimConditon contractAddress={contractAddress} chainId={chainId} />
          </div>
        )}
         {lazyMint && (
          <div className={styles.claim}>
            <LayzMintComponentErc1155 contractAddress={contractAddress} chainId={chainId} />
          </div>
        )}
                </div>
  );
};

export default PlasmaWorld;