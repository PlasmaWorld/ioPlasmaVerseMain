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
import SetMetadataComponent from '@/components/Metadata/setNftMetadata';
import DeployContract from '@/components/contracts/ContractDeployModa';

const PlasmaWorld: React.FC = () => {
  const router = useRouter();
  const { typeForm } = useParams();
  const type = Array.isArray(typeForm) ? typeForm[0] : typeForm;

  const [showClaimCondition, setShowClaimCondition] = useState(false);
  const [lazyMint, setLazyMint] = useState(false);
  const [showExplorer, setShowExplorere] = useState(false);
  const [showClaim, setShowClaim] = useState(false);
  const [showMint, setShowMint] = useState(false);

  const [contractData, setShowContractData] = useState(false); 
  const NETWORK = defineChain(4689); // Use chainIdNumber here

  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };
  const contractAddress = "0x4f2573f80823b9ac1CD3fD15A7f0d8CeD2837400";

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
        <title>Thirdwebs OpenEditionERC721</title>
        <h2>An open-to-mint ERC-721 NFT collection, where all NFTs have shared metadata.</h2>
      </Helmet>
      <div className={styles.thirdwebInfoContainer}>
        <h2>OpenEditionERC721 Contract</h2>
        <p>
          The <strong>OpenEditionERC721</strong> contract is an &quot;open edition&quot; ERC721 NFT collection. The contract uses the ERC-721A standard.
        </p>
        <p>
          The OpenEdition ERC-721 contract is ideal when you want to release an open edition of NFTs like the Base, Introduced collection.
        </p>
        <p>
          All NFTs in the contract have shared metadata except that each NFT has its unique token ID appended to the NFT&apos;s name. An admin can set this shared metadata at any time.
        </p>
        <p>
          The contract does not require the admin to set a limit to the total supply of NFTs. The admin can set claim phases (like in NFT Drop) to apply restrictions on the minting of NFTs, such as a price, mint start and end times, etc.
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
        <p>Publish Date</p>
        <p>Dec 18, 2023</p>
  
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
            <a href="https://portal.thirdweb.com/contracts/build/extensions/erc-721/ERC721AQueryable" target="_blank" rel="noopener noreferrer">
              ERC721AQueryable
            </a>
          </li>
          <li>
            <a href="https://portal.thirdweb.com/contracts/build/extensions/erc-721/ERC721ClaimPhasesV2" target="_blank" rel="noopener noreferrer">
              ERC721ClaimPhasesV2
            </a>
          </li>
          <li>
            <a href="https://portal.thirdweb.com/contracts/build/extensions/erc-721/ERC721SharedMetadata" target="_blank" rel="noopener noreferrer">
              ERC721SharedMetadata
            </a>
          </li>
          <li>
            <a href="https://portal.thirdweb.com/contracts/build/extensions/royalty" target="_blank" rel="noopener noreferrer">
              Royalty
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
          {contractData ? 'Hide ContractSettings' : 'ContractSettings'}
        </Button>
        <Button onClick={toggleContractClaim}>
          {showClaim ? 'Hide ContractClaim' : 'ContractClaim'}
        </Button>
        <Button onClick={toggleContractClaimConditon}>
          {showClaimCondition ? 'Hide ContractCondition' : 'ContractCondition'}
        </Button>
        <Button onClick={toggleLazyMint}>
          {lazyMint ? 'Hide ContractMetadata' : 'ContractMetadata'}
        </Button>
      </div>
      <div className={styles.details}></div>
      {isModalOpen && <DeployContract name={"OpenEditionERC721"} onClose={handleCloseModal} version={''} />}

      {showExplorer && (
        <div className={styles.explorer}>
          <Explorer contractAddress={contractAddress} chainId={4689} type={"OpenEditionERC721"} />
        </div>
      )}
      {contractData && (
        <div className={styles.contractData}>
          <ContractSettings contractAddress={contractAddress} chainId={4689} />
        </div>
      )}
      {showClaimCondition && (
        <div className={styles.claim}>
          <ClaimConditonErc712 contractAddress={contractAddress} chainId={4689} />
        </div>
      )}
      {lazyMint && (
        <div className={styles.claim}>
          <SetMetadataComponent contractAddress={contractAddress} chainId={4689} />
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