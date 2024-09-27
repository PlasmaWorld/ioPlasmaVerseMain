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
import MintComponentErc1155 from '@/components/MintApp/MintAppErc1155';
import DeployContract from '@/components/contracts/ContractDeployModa';

const PlasmaWorld: React.FC = () => {
  const { typeForm } = useParams();
  const type = Array.isArray(typeForm) ? typeForm[0] : typeForm;
  const [showExplorer, setShowExplorere] = useState(false);
  const [showClaim, setShowClaim] = useState(false);
  const [showMint, setShowMint] = useState(false);
  const [contractData, setShowContractData] = useState(false); 
  const NETWORK = defineChain(4689); // Use chainIdNumber here  
  const contractAddress = "0x3521b7214af07aBA421F7fbAb95a1Bbc8226D0f7";
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();
  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };
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

  return (
    <div className={styles.container}>
      <Helmet>
        <title>Thirdwebs  Edition Drop ERC1155</title>
                    <h2>Create editions of ERC1155 tokens.</h2>
                    </Helmet>
                    <div className={styles.thirdwebInfoContainer}>
                    <h3>The Edition Contract</h3>
                    <p>
                        The Edition contract is best used when you want to release many NFTs based on the same asset, but you don&apos;t want to &quot;drop&quot; or &quot;release&quot; them for your community to claim.
                    </p>
                    <p>
                        Unlike the Edition Drop contract, the Edition contract does not lazy mint your NFTs. Instead, NFTs are minted immediately when they are added to the collection.
                    </p>
                    <p>
                        This means you can still transfer the NFTs or sell them on a Marketplace and perform any other actions you would expect to do with an NFT.
                    </p>
                    <p>
                        For advanced use-cases, the Edition contract also has signature-based minting capabilities.
                    </p>

                    <h3>Use Cases &amp; Examples</h3>
                    <ul>
                        <li>Create an NFT Collection where each NFT has 100 copies</li>
                        <li>Airdrop an NFT to a list of addresses that all use the same asset and metadata</li>
                        <li>Create 10 &quot;copies&quot; of your artwork and sell them on a Marketplace</li>
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
            
            <h4>Extensions</h4>
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
                <a href="https://portal.thirdweb.com/contracts/build/extensions/erc-1155/ERC1155Burnable" target="_blank" rel="noopener noreferrer">
                    ERC1155Burnable
                </a>
                </li>
                <li>
                <a href="https://portal.thirdweb.com/contracts/build/extensions/erc-1155/ERC1155Enumerable" target="_blank" rel="noopener noreferrer">
                    ERC1155Enumerable
                </a>
                </li>
                <li>
                <a href="https://portal.thirdweb.com/contracts/build/extensions/erc-1155/ERC1155Mintable" target="_blank" rel="noopener noreferrer">
                    ERC1155Mintable
                </a>
                </li>
                <li>
                <a href="https://portal.thirdweb.com/contracts/build/extensions/erc-1155/ERC1155BatchMintable" target="_blank" rel="noopener noreferrer">
                    ERC1155BatchMintable
                </a>
                </li>
                <li>
                <a href="https://portal.thirdweb.com/contracts/build/extensions/erc-1155/ERC1155SignatureMintable" target="_blank" rel="noopener noreferrer">
                    ERC1155SignatureMintable
                </a>
                </li>
                <li>
                <a href="https://portal.thirdweb.com/contracts/build/extensions/erc-1155/ERC1155UpdatableMetadata" target="_blank" rel="noopener noreferrer">
                    ERC1155UpdatableMetadata
                </a>
                </li>
                <li>
                <a href="https://portal.thirdweb.com/contracts/build/extensions/erc-1155/Royalty" target="_blank" rel="noopener noreferrer">
                    Royalty
                </a>
                </li>
                <li>
                <a href="https://portal.thirdweb.com/contracts/build/extensions/erc-1155/PlatformFee" target="_blank" rel="noopener noreferrer">
                    PlatformFee
                </a>
                </li>
                <li>
                <a href="https://portal.thirdweb.com/contracts/build/extensions/erc-1155/PrimarySale" target="_blank" rel="noopener noreferrer">
                    PrimarySale
                </a>
                </li>
                <li>
                <a href="https://portal.thirdweb.com/contracts/build/extensions/erc-1155/Permissions" target="_blank" rel="noopener noreferrer">
                    Permissions
                </a>
                </li>
                <li>
                <a href="https://portal.thirdweb.com/contracts/build/extensions/erc-1155/PermissionsEnumerable" target="_blank" rel="noopener noreferrer">
                    PermissionsEnumerable
                </a>
                </li>
                <li>
                <a href="https://portal.thirdweb.com/contracts/build/extensions/erc-1155/ContractMetadata" target="_blank" rel="noopener noreferrer">
                    ContractMetadata
                </a>
                </li>
                <li>
                <a href="https://portal.thirdweb.com/contracts/build/extensions/erc-1155/Ownable" target="_blank" rel="noopener noreferrer">
                    Ownable
                </a>
                </li>
                <li>
                <a href="https://portal.thirdweb.com/contracts/build/extensions/erc-1155/Gasless" target="_blank" rel="noopener noreferrer">
                    Gasless
                </a>
                </li>
                <li>
                <a href="https://portal.thirdweb.com/contracts/build/extensions/erc-1155/Fallback" target="_blank" rel="noopener noreferrer">
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
          
        <Button onClick={toggleContractMint}>
          {showMint ? 'Hide Mint' : 'Show Mint'}
        </Button>
        
      </div>
      <div className={styles.details}>
        
            
            
         
      </div>
      
      {isModalOpen && <DeployContract name={"TokenERC1155"} onClose={handleCloseModal} version={''} />}

        {showExplorer && (
          <div className={styles.explorer}>
            <Explorer contractAddress={contractAddress} chainId={4689} type={"TokenERC1155"} />
          </div>
        )}
        {contractData && (
          <div className={styles.contractData}>
            <ContractSettings contractAddress={contractAddress} chainId={4689} />
          </div>
        )}
        {showMint && (
          <div className={styles.mint}>
            <MintComponentErc1155 contractAddress={contractAddress} chainId={4689} />
          </div>
        )}
        {showClaim && (
          <div className={styles.claim}>
            <ClaimAppGalerie contractAddress={contractAddress} chainId={4689} />
          </div>
        )}
                </div>
  );
};

export default PlasmaWorld;