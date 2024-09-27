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
import ClaimConditonErc712 from '@/components/claim/claimConditionErc721';
import LayzMintComponentErc721 from '@/components/layzMint/LayzMintErc721';
import DeployContract from '@/components/contracts/ContractDeployModa';

const PlasmaWorld: React.FC = () => {
  
  const { typeForm } = useParams();
  const type = "DropERC721";
  const [showExplorer, setShowExplorere] = useState(false);
  const [showClaim, setShowClaim] = useState(false);
  const [showMint, setShowMint] = useState(false);
  const [showClaimCondition, setShowClaimCondition] = useState(false);
  const [lazyMint, setLazyMint] = useState(false);

  const [contractData, setShowContractData] = useState(false); 


  const NETWORK = defineChain(4689); 
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };
  

  
  const contractAddress = "0x8bA80068Ba7ba0462c3978eFd01c955064a591F0";

  const contract = getContract({
    address: "0x8bA80068Ba7ba0462c3978eFd01c955064a591F0",
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

  const toggleContractClaimConditon = useCallback(() => {
    setShowClaimCondition(prev => !prev);
  }, []);

  const toggleLazyMint = useCallback(() => {
    setLazyMint(prev => !prev);
  }, []);

  const toggleContractMint = useCallback(() => {
    setShowMint(prev => !prev);
  }, []);

  return (
    <div className={styles.container}>
      <Helmet>
        <title>Thirdwebs ERC721DropContract</title>
                    <h2>Release collection of unique NFTs for a set price</h2>
                </Helmet>
                <div className={styles.thirdwebInfoContainer}>
            <h2>NFT Drop Contract</h2>
            <p>
                The NFT Drop contract is perfect for releasing a collection of unique NFTs using the ERC721A standard. This contract allows you to set up claim phases that define when and how users can mint NFTs from your drop. These phases can include features like allowlists, release dates, claim limits, and delayed reveals.
            </p>
            <p>
                With NFT Drop, you can prepare your collection through lazy minting, which means NFTs arent minted immediately. Instead, you get everything ready for your users, and they can mint the NFTs when the conditions are met.
            </p>
            <h3>Use Cases &amp; Examples</h3>
            <ul>
                <li><strong>PFP Collections:</strong> Launch a collection where each NFT has a unique combination of traits.</li>
                <li><strong>Art Drops:</strong> Release your artwork as NFTs and allow your community to mint them at a set price.</li>
                <li><strong>Restricted Access Drops:</strong> Create exclusive drops where only a specific list of wallets can claim NFTs.</li>
            </ul>
            <p>
                For more technical details, you can check out the <a href="https://portal.thirdweb.com/contracts/design-docs/drop" target="_blank" rel="noopener noreferrer">Technical Design Doc</a>.
            </p>
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
            <a href="https://d391b93f5f62d9c15f67142e43841acc.ipfscdn.io/ipfs/bafybeicbe5haw7svi5ww4slfycrnh2snycbg5izjbrflnwi43b2rdmg25m/" target="_blank" rel="noopener noreferrer">
                    AuditReport
                    </a>                </p>
            
            <h3>Licenses</h3>
            <p>MIT, Apache-2.0</p>
            
            <h3>Extensions</h3>
            <ul>
                <li>
                    <a href="https://portal.thirdweb.com/contracts/build/extensions/erc-721/ERC721" target="_blank" rel="noopener noreferrer">
                    ERC721
                    </a>
                </li>
                <li>
                    <a href="https://portal.thirdweb.com/contracts/build/extensions/erc-721/ERC721Burnable" target="_blank" rel="noopener noreferrer">
                    ERC721Burnable
                    </a>
                </li>
                <li>
                    <a href="https://portal.thirdweb.com/contracts/build/extensions/erc-721/ERC721Supply" target="_blank" rel="noopener noreferrer">
                    ERC721Supply
                    </a>
                </li>
                <li>
                    <a href="https://portal.thirdweb.com/contracts/build/extensions/erc-721/ERC721LazyMintable" target="_blank" rel="noopener noreferrer">
                    ERC721LazyMintable
                    </a>
                </li>
                <li>
                    <a href="https://portal.thirdweb.com/contracts/build/extensions/erc-721/ERC721Revealable" target="_blank" rel="noopener noreferrer">
                    ERC721Revealable
                    </a>
                </li>
                <li>
                    <a href="https://portal.thirdweb.com/contracts/build/extensions/erc-721/ERC721ClaimPhasesV2" target="_blank" rel="noopener noreferrer">
                    ERC721ClaimPhasesV2
                    </a>
                </li>
                <li>
                    <a href="https://portal.thirdweb.com/contracts/build/extensions/royalty" target="_blank" rel="noopener noreferrer">
                    Royalty
                    </a>
                </li>
                <li>
                    <a href="https://portal.thirdweb.com/contracts/build/extensions/platform-fee" target="_blank" rel="noopener noreferrer">
                    PlatformFee
                    </a>
                </li>
                <li>
                    <a href="https://portal.thirdweb.com/contracts/build/extensions/primary-sale" target="_blank" rel="noopener noreferrer">
                    PrimarySale
                    </a>
                </li>
                <li>
                    <a href="https://portal.thirdweb.com/contracts/build/extensions/permissions" target="_blank" rel="noopener noreferrer">
                    Permissions
                    </a>
                </li>
                <li>
                    <a href="https://portal.thirdweb.com/contracts/build/extensions/permissions-enumerable" target="_blank" rel="noopener noreferrer">
                    PermissionsEnumerable
                    </a>
                </li>
                <li>
                    <a href="https://portal.thirdweb.com/contracts/build/extensions/contract-metadata" target="_blank" rel="noopener noreferrer">
                    ContractMetadata
                    </a>
                </li>
                <li>
                    <a href="https://portal.thirdweb.com/contracts/build/extensions/ownable" target="_blank" rel="noopener noreferrer">
                    Ownable
                    </a>
                </li>
                <li>
                    <a href="https://portal.thirdweb.com/contracts/build/extensions/gasless" target="_blank" rel="noopener noreferrer">
                    Gasless
                    </a>
                </li>
                <li>
                    <a href="https://portal.thirdweb.com/contracts/build/extensions/fallback" target="_blank" rel="noopener noreferrer">
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
            <Explorer contractAddress={contractAddress} chainId={4689} type={"DropERC721"} />
          </div>
        )}
          {isModalOpen && <DeployContract name={"DropERC721"} onClose={handleCloseModal} version={''} />}

        {contractData && (
          <div className={styles.contractData}>
            <ContractSettings contractAddress={contractAddress} chainId={4689} />
          </div>
        )}
        {showClaim && (
          <div className={styles.claim}>
            <ClaimAppGalerie contractAddress={contractAddress} chainId={4689} />
          </div>
        )}
        {showClaimCondition && (
          <div className={styles.claim}>
            <ClaimConditonErc712 contractAddress={contractAddress} chainId={4689} />
          </div>
        )}
         {lazyMint && (
          <div className={styles.claim}>
            <LayzMintComponentErc721 contractAddress={contractAddress} chainId={4689} />
          </div>
        )}
                </div>
  );
};

export default PlasmaWorld;