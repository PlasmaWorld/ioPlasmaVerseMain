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
import DeployContract from '@/components/contracts/ContractDeployModa';

const PlasmaWorld: React.FC = () => {
  const router = useRouter();
  const { typeForm } = useParams();
  const type = Array.isArray(typeForm) ? typeForm[0] : typeForm;

  const [showExplorer, setShowExplorere] = useState(false);
  const [showClaim, setShowClaim] = useState(false);
  const [showMint, setShowMint] = useState(false);

  const [contractData, setShowContractData] = useState(false); 


  const NETWORK = defineChain(4689); // Use chainIdNumber here

  
  const contractAddress = "0xfc2d10Fe84fb4d671b2a5c2E69bF8243B3252083";
  const [isModalOpen, setIsModalOpen] = useState(false);

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
        <title>Thirdwebs ERC721NFTCollection</title>
        <meta name="description" content="Create a collection of unique NFTs with Thirdweb's ERC721NFTCollection contract." />
      </Helmet>
      <div className={styles.thirdwebInfoContainer}>
        <h2>NFT Collection Contract</h2>
        <p>
          The NFT Collection contract is suitable for when you want to have a collection of unique NFTs, but not &quot;drop&quot; or &quot;release&quot; them for your community to claim.
        </p>
        <p>
          Unlike the NFT Drop contract, the NFT Collection contract does not lazy mint your NFTs. Instead, NFTs are minted immediately when they are added to the collection.
        </p>
        <p>
          This means you can still transfer the NFTs or sell them on a Marketplace and perform any other actions you would expect to do with an NFT.
        </p>
        <p>
          For advanced use-cases, the NFT Collection also has signature-based minting capabilities.
        </p>
        <h3>Use Cases & Examples</h3>
        <ul>
          <li>Create a 1-of-many collection of your photography</li>
          <li>Create a 1-of-1 NFT that provides special utility</li>
          <li>Mint your artwork as NFTs and then sell them on a Marketplace</li>
          <li>Create a community-made NFT collection</li>
        </ul>
        <h3>Resources</h3>
        <p>
          For more technical details, you can check out the <a href="https://portal.thirdweb.com/contracts/design-docs/drop" target="_blank" rel="noopener noreferrer">Technical Design Doc</a>.
        </p>
      </div>
      <div className={styles.contractDetails}>
        <h3>Published by</h3>
        <p>thirdweb.eth</p>
        <div className={styles.socials}>
          <a href="https://x.com/thirdweb" target="_blank" rel="noopener noreferrer">
            <FaTwitter />
          </a>
          <a href="https://thirdweb.com" target="_blank" rel="noopener noreferrer">
            <FaGlobe />
          </a>
          <a href="https://github.com/thirdweb-dev" target="_blank" rel="noopener noreferrer">
            <FaGithub />
          </a>
          <a href="https://discord.gg/thirdweb" target="_blank" rel="noopener noreferrer">
            <FaDiscord />
          </a>
        </div>
        <h3>Details</h3>
        <p>Publish Date: Dec 18, 2023</p>
        <h3>Audit Report</h3>
        <a href="https://d391b93f5f62d9c15f67142e43841acc.ipfscdn.io/ipfs/bafybeifssjetekty3ncnyf3agczckv63ygjujl545ekgn6ny5f46oyljpy/" target="_blank" rel="noopener noreferrer">
          View Audit Report
        </a>
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
            <a href="https://portal.thirdweb.com/contracts/build/extensions/erc-721/ERC721Enumerable" target="_blank" rel="noopener noreferrer">
              ERC721Enumerable
            </a>
          </li>
          <li>
            <a href="https://portal.thirdweb.com/contracts/build/extensions/erc-721/ERC721Mintable" target="_blank" rel="noopener noreferrer">
              ERC721Mintable
            </a>
          </li>
          <li>
            <a href="https://portal.thirdweb.com/contracts/build/extensions/erc-721/ERC721BatchMintable" target="_blank" rel="noopener noreferrer">
              ERC721BatchMintable
            </a>
          </li>
          <li>
            <a href="https://portal.thirdweb.com/contracts/build/extensions/erc-721/ERC721SignatureMintV1" target="_blank" rel="noopener noreferrer">
              ERC721SignatureMintV1
            </a>
          </li>
          <li>
            <a href="https://portal.thirdweb.com/contracts/build/extensions/erc-721/ERC721UpdatableMetadata" target="_blank" rel="noopener noreferrer">
              ERC721UpdatableMetadata
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
            <a href="https://portal.thirdweb.com/contracts/build/extensions/erc-721/ERC721UpdatableMetadata" target="_blank" rel="noopener noreferrer">
              ERC721UpdatableMetadata
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
          {contractData ? 'Hide ContractSettings' : 'Show ContractSettings'}
        </Button>
        <Button onClick={toggleContractClaim}>
          {showClaim ? 'Hide ContractClaim' : 'Show ContractClaim'}
        </Button>
        <Button onClick={toggleContractMint}>
          {showMint ? 'Hide Mint' : 'Show Mint'}
        </Button>
      </div>
      <div className={styles.details}></div>
      {showExplorer && (
        <div className={styles.explorer}>
                {isModalOpen && <DeployContract name={"TokenERC721"} onClose={handleCloseModal} version={''} />}

          <Explorer contractAddress={contractAddress} chainId={4689} type={"TokenERC721"} />
        </div>
      )}
      {showClaim && (
        <div className={styles.claim}>
          <ClaimAppGalerie contractAddress={contractAddress} chainId={4689} />
        </div>
      )}
      {contractData && (
        <div className={styles.contractData}>
          <ContractSettings contractAddress={contractAddress} chainId={4689} />
        </div>
      )}
      {showMint && (
        <div className={styles.mint}>
          <MintComponent contractAddress={contractAddress} chainId={4689} />
        </div>
      )}
    </div>
  );
};

export default PlasmaWorld;