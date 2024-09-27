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
import Erc20Mint from '@/components/MintApp/MintAppErc20';
import DeployContract from '@/components/contracts/ContractDeployModa';

const PlasmaWorld: React.FC = () => {
  const { typeForm } = useParams();
  const type = Array.isArray(typeForm) ? typeForm[0] : typeForm;
 
  const [showExplorer, setShowExplorere] = useState(false);
  const [showClaim, setShowClaim] = useState(false);
  const [showMint, setShowMint] = useState(false);

  const [contractData, setShowContractData] = useState(false); 
  const NETWORK = defineChain(4689); // Use chainIdNumber here
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };
  

  
  
  const contractAddress = "0x59E97bf693F05fa0ac4CAB91B01108C2871cF4ec";

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
        <title>Thirdwebs Token ERC20 Contract</title>
        <h2>Create cryptocurrency compliant with ERC20 standard.</h2>
      </Helmet>
      <div className={styles.thirdwebInfoContainer}>
        <p>
          The <strong>Token</strong> contract is suited for creating a digital currency and is compliant with the ERC20 standard. It can be purchased and traded between users on an exchange, utilized to buy and sell NFTs in a marketplace, etc.
        </p>
        <p>
          Unlike the <strong>Token Drop</strong> contract, the Token contract does not allow users to claim tokens under the criteria of claim conditions.
        </p>
        <h4>Use Cases &amp; Examples</h4>
        <ul>
          <li>Create your own cryptocurrency</li>
          <li>Sell your NFTs on the Marketplace in your custom token</li>
          <li>Reward users with tokens for some action they take</li>
        </ul>
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
        <p><strong>Publish Date:</strong> Dec 18, 2023</p>
        <p>
          <a href="https://d391b93f5f62d9c15f67142e43841acc.ipfscdn.io/ipfs/bafybeifssjetekty3ncnyf3agczckv63ygjujl545ekgn6ny5f46oyljpy/" target="_blank" rel="noopener noreferrer">
            AuditReport
          </a>
        </p>
        <h3>Licenses</h3>
        <p>MIT, Apache-2.0</p>
        <p><strong>Extensions</strong></p>
        <ul>
          <li>
            <a href="https://portal.thirdweb.com/contracts/build/extensions/erc-20/ERC20" target="_blank" rel="noopener noreferrer">
              ERC20
            </a>
          </li>
          <li>
            <a href="https://portal.thirdweb.com/contracts/build/extensions/erc-20/ERC20Burnable" target="_blank" rel="noopener noreferrer">
              ERC20Burnable
            </a>
          </li>
          <li>
            <a href="https://portal.thirdweb.com/contracts/build/extensions/erc-20/ERC20Mintable" target="_blank" rel="noopener noreferrer">
              ERC20Mintable
            </a>
          </li>
          <li>
            <a href="https://portal.thirdweb.com/contracts/build/extensions/erc-20/ERC20BatchMintable" target="_blank" rel="noopener noreferrer">
              ERC20BatchMintable
            </a>
          </li>
          <li>
            <a href="https://portal.thirdweb.com/contracts/build/extensions/erc-20/ERC20SignatureMintable" target="_blank" rel="noopener noreferrer">
              ERC20SignatureMintable
            </a>
          </li>
          <li>
            <a href="https://portal.thirdweb.com/contracts/build/extensions/erc-20/ERC20Permit" target="_blank" rel="noopener noreferrer">
              ERC20Permit
            </a>
          </li>
          <li>
            <a href="https://portal.thirdweb.com/contracts/build/extensions/PlatformFee" target="_blank" rel="noopener noreferrer">
              PlatformFee
            </a>
          </li>
          <li>
            <a href="https://portal.thirdweb.com/contracts/build/extensions/PrimarySale" target="_blank" rel="noopener noreferrer">
              PrimarySale
            </a>
          </li>
          <li>
            <a href="https://portal.thirdweb.com/contracts/build/extensions/Permissions" target="_blank" rel="noopener noreferrer">
              Permissions
            </a>
          </li>
          <li>
            <a href="https://portal.thirdweb.com/contracts/build/extensions/PermissionsEnumerable" target="_blank" rel="noopener noreferrer">
              PermissionsEnumerable
            </a>
          </li>
          <li>
            <a href="https://portal.thirdweb.com/contracts/build/extensions/ContractMetadata" target="_blank" rel="noopener noreferrer">
              ContractMetadata
            </a>
          </li>
          <li>
            <a href="https://portal.thirdweb.com/contracts/build/extensions/Gasless" target="_blank" rel="noopener noreferrer">
              Gasless
            </a>
          </li>
          <li>Fallback</li>
        </ul>
        <li>
                <button className={styles.openModalButton} onClick={handleOpenModal}>
                  Deploy Contract
                </button>
                </li>
      </div>

      <div className={styles.buttonContainer}>
        <Button onClick={toggleExplorer}>
          {showExplorer ? 'Hide Explorer' : 'Show Explorer'}
        </Button>
        <Button onClick={toggleContractData}>
          {contractData ? 'Hide ContractSettings' : 'ContractSettings'}
        </Button>
        <Button onClick={toggleContractMint}>
          {showMint ? 'Hide Mint' : 'Show Mint'}
        </Button>
        {type === "DropERC721" && (
          <Button onClick={toggleContractClaim}>
            {showClaim ? 'Hide ContractClaim' : 'ContractClaim'}
          </Button>
        )}
        {type === "OpenEditionERC721" && (
          <Button onClick={toggleContractClaim}>
            {showClaim ? 'Hide ContractClaim' : 'ContractClaim'}
          </Button>
        )}
      </div>
      {isModalOpen && <DeployContract name={"TokenERC20"} onClose={handleCloseModal} version={''} />}

      {showExplorer && (
        <div className={styles.explorer}>
          <Explorer contractAddress={contractAddress} chainId={4689} type={"TokenERC20"} />
        </div>
      )}
      {contractData && (
        <div className={styles.contractData}>
          <ContractSettings contractAddress={contractAddress} chainId={4689} />
        </div>
      )}
      {showMint && (
        <div className={styles.mint}>
          <Erc20Mint contractAddress={contractAddress} chainId={4689} />
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