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
import { FaTwitter, FaTelegram, FaLink, FaDiscord, FaGlobe, FaGithub, FaAddressCard } from 'react-icons/fa';
import { NFT_CONTRACTS } from '@/const/nft.contracts';
import styles from '@/components/styles/plasmaWorld.module.css'; // Import your CSS module

import { MediaRenderer, useActiveAccount, useReadContract } from 'thirdweb/react';
import client from '@/lib/client';
import { NFTGridLoading } from '@/components/NFT/NFTGrid';
import { MARKETPLACE, NETWORK as DEFAULT_NETWORK } from '@/const/contracts';
import { useNfts } from '@/Hooks/NftOwnedProvider';
import { getContractMetadata, name } from 'thirdweb/extensions/common';
import { defineChain, getContract, readContract, resolveMethod, ThirdwebContract } from 'thirdweb';
import { ChainList } from '@/const/ChainList';
import { PaginationHelperDefault } from '@/components/NFT/PaginationHelperDefault';
import { getActiveClaimCondition, getNFTs, getOwnedNFTs, isERC721, nextTokenIdToMint, totalSupply,getTotalUnclaimedSupply } from 'thirdweb/extensions/erc721';
import toast from 'react-hot-toast';
import toastStyle from '@/util/toastConfig';
import Explorer from '@/components/Explorer/Explorer';
import ContractSettings from '@/components/Explorer/ContractsSettings';
import MintComponent from '@/components/MintApp/MintApp';
import ClaimAppGalerie from '@/components/claim/claimApp';
import { getNFTs as getErc1155NFTs, getOwnedNFTs as getOwned1155NFTs ,sharedMetadata} from 'thirdweb/extensions/erc721';
import { NFT as NFTType } from "thirdweb";
import { NFTCardContracts } from '@/components/NFT/NftCardContracts';
import { isERC1155 } from 'thirdweb/extensions/erc1155';
import { PaginationHelperContracts } from '@/components/NFT/paginationHelperContracts';
import { Footer } from '@/components/Navbar/Footer';
import LayzMintComponentErc721 from '@/components/layzMint/LayzMintErc721';
import ClaimConditonErc712 from '@/components/claim/claimConditionErc721';
import SetMetadataComponent from '@/components/Metadata/setNftMetadata';
import ClaimConditonErc1155 from '@/components/claim/claimConditionErc1155';
import LayzMintComponentErc1155 from '@/components/layzMint/LayzMintErc1155';
import ClaimAppErc1155 from '@/components/claim/claimAppERC1155';
import MintComponentErc1155 from '@/components/MintApp/MintAppErc1155';
import NftGeneratorApp from '@/components/NftMintApp/NftGenerator';

type TokenData = {
  value: number; // You can define more fields as needed
};

const numbers: string[] = Array.from({ length: 10000 }, (_, i) => (i + 1).toString());

const hashMap = {
  explorer: 'explorer',
  contractData: 'contractData',
  lazyMint: 'lazyMint',
  claim: 'claim',
  mint: 'mint',
  claimConditionErc721: 'claimConditionErc721',
  claimCondition: 'claimCondition',
  metadata: 'metadata',
  claimConditionErc1155: 'claimConditionErc1155',
  lazyMintErc1155: 'lazyMintErc1155',
  claimErc1155: 'claimErc1155',
  mintErc1155: 'mintErc1155',
  appGenerator: 'appGenerator',
  nfts: 'nfts',
} as const;
type SectionName = keyof typeof hashMap;


const PlasmaWorld: React.FC = () => {
  const router = useRouter();
  const { contractAddress, Chain } = useParams();
  const address = Array.isArray(contractAddress) ? contractAddress[0] : contractAddress;
  const chainId = Array.isArray(Chain) ? Chain[0] : Chain;
  const chainIdNumber = parseInt(chainId, 10); // Convert chainId to number
  const nftsPerPage = 30;
  const [activeContract, setActiveContract] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchedId, setSearchedId] = useState<number | null>(null);
  const [showOwned, setShowOwned] = useState(false);
  const [showExplorer, setShowExplorere] = useState(false);
  const [showClaim, setShowClaim] = useState(false);
  const [showClaimConditionErc721, setShowClaimConditionErc721] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [showInfo2, setShowInfo2] = useState(true);

  const [showMetaData, setShowMetadata] = useState(false);
  const [showClaimConditionErc1155, setShowClaimConditionErc1155] = useState(false);
  const [showLazyMintErc1155, setShowLazyMintErc1155] = useState(false);
  const [showClaimErc1155, setShowClaimErc1155] = useState(false);
  const [showMint, setShowMint] = useState(false);
  const [showMintErc1155, setShowMintErc1155] = useState(false);
  const [showAppGenerator, setShowAppGenerator] = useState(false);
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch(`/api/fetchContractEvents/${chainId}/${contractAddress}`);
        const result = await response.json();

        if (response.ok) {
          setEvents(result.events); // Save all events
        }
      } catch (err) {
        console.error("An unexpected error occurred:", err);
      }
    };

    fetchEvents();
  }, [chainId, contractAddress]);

  const [showLayzMint, setShowLazyMint] = useState(false);
  const [contractData, setShowContractData] = useState(false);
  const [isErc721Contract, setIsErc721Contract] = useState(false);
  const [isErc721Metadata, setIsErc721MetaData] = useState(false);
  const [isErc721MintTo, setIsErc721MintTo] = useState(false);

  const [isErc1155Contract, setIsErc1155Contract] = useState(false);
  const [nfts, setNfts] = useState<NFTType[]>([]);
  const [ownedNfts, setOwnedNfts] = useState<NFTType[]>([]);
  const [detailedView, setDetailedView] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const debouncedSearchTerm = useDebounce(search, 500);
  const account = useActiveAccount();
  const isInContractList = NFT_CONTRACTS.some(contract => contract.address === address);
  const NETWORK = defineChain(chainIdNumber); // Use chainIdNumber here
  const contract = useMemo(() => getContract({ address: address as string, client, chain: NETWORK }), [address, NETWORK]);
  const [contractType, setContractType] = useState<any>(null);
  const [tokenIdHash, setTokenId] = useState<any>(null);
  const { data: isERC721ContractData } = useReadContract(isERC721, { contract });
  const { data: isERC1155ContractData } = useReadContract(isERC1155, { contract });
  const { data: contractMetadata, refetch: refetchContractMetadata } = useReadContract(getContractMetadata, { contract });
  const { data: claimCondition } = useReadContract(getActiveClaimCondition, { contract });
  const [loading, setLoading] = useState(false);
  const { data: isErc721DropData } = useReadContract(getTotalUnclaimedSupply, { contract });
  const { data: nextTokenIdToMintContract } = useReadContract(nextTokenIdToMint, { contract });
  const { data: sharedMetadataData } = useReadContract(sharedMetadata, { contract });
  const [activeSection, setActiveSection] = useState<SectionName | ''>('');

  // List of hash mappings
  
  const start = useMemo(() => (page - 1) * nftsPerPage, [page, nftsPerPage]);

  useEffect(() => {
    // Check if nextTokenIdToMintContract exists and set the isErc721MintTo state
    if (isErc721DropData) {
      setIsErc721MintTo(true);
    } else {
      setIsErc721MintTo(false);
    }
  }, [nextTokenIdToMintContract]);
  const { data: nftsfetch } = useReadContract(getNFTs, {
    contract: contract,
    count: nftsPerPage,
    start: (page - 1) * nftsPerPage,
  });

  // Manage NFT data and loading state
  useEffect(() => {
    if (nftsfetch) {
      setNfts(nftsfetch);
      setIsLoading(false); // Loading finished once data is fetched
    }
  }, [nftsfetch]);
  const isSectionName = (value: string): value is SectionName => {
    return Object.values(hashMap).includes(value as SectionName);
};

  // Pagination handler
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    setIsLoading(true); // Start loading when page changes
  };
 
  

  useEffect(() => {
    const hash = window.location.hash.replace('#', '');

    if (!window.location.hash) {
      // Redirect to the same URL but with "#nfts"
      const newUrl = `${window.location.pathname}${window.location.search}#nfts`;
      router.push(`/contracts/${chainId}/${address}#nfts`);
      setActiveSection('nfts');

    } else if (isSectionName(hash)) {
          setActiveSection(hash);
        }else if (hash && /^[0-9]+$/.test(hash)) {
          setActiveSection('nfts');

          setTokenId(hash);
          setSearch(hash);
          
      } else {
          setActiveSection('');
      }
      

    const handleHashChange = () => {
        const currentHash = window.location.hash.replace('#', '');
        if (isSectionName(currentHash)) {
            setActiveSection(currentHash);
            
        }else if (currentHash && /^[0-9]+$/.test(currentHash)) {
          setTokenId(currentHash);
          setActiveSection('nfts');

          setSearch(currentHash);
        } else {
            setActiveSection('');
        }
    };
  

    window.addEventListener('hashchange', handleHashChange);

    return () => {
        window.removeEventListener('hashchange', handleHashChange);
    };
}, []);

const toggleSection = useCallback(
    (section: SectionName) => {
        const hashValue = hashMap[section]; // This line should work correctly now
        if (activeSection !== section) {
            router.push(`/contracts/${chainId}/${address}#${hashValue}`);
            setActiveSection(section);
        }else if (activeSection) {
          router.push(`/contracts/${chainId}/${address}#${hashValue}`);
          setActiveSection(section);
        } else {
            router.push(`/contracts/${chainId}/${address}#nfts`);
            setActiveSection('nfts');
        }
    },
    [activeSection, router, address, chainId]
  );


  const fetchContractType = useCallback(async (contract: ThirdwebContract) => {
    if (!contract) return;
    try {
      const type = await readContract({
        contract,
        method: resolveMethod("contractType"),
        params: [],
      });

      if (type && type.length > 0) {
        setContractType(type);
      } else {
        setContractType("Unknown");
      }
    } catch (error) {
      console.error(error);
    }
  }, []);

  useEffect(() => {
    fetchContractType(contract);
  }, [contract]);

  
  const paginatedNfts = useMemo(() => {
    const startIndex = (page - 1) * nftsPerPage;
    return (showOwned ? ownedNfts : nfts).slice(startIndex, startIndex + nftsPerPage);
  }, [page, showOwned, nfts, ownedNfts, nftsPerPage]);
  
  const { data: totalCount } = useReadContract(totalSupply, {
    contract,
  });
 

  useEffect(() => {
    if (nftsfetch && nftsfetch.length > 0) {
      setNfts(nftsfetch);
    }
  }, [nftsfetch]);

  const fetchNftsOwnedErc721 = useCallback(async () => {
    if (!account) return;

    
    console.log("Starting to fetch owned NFTs...");
    setLoading(true);
  
    try {
      console.log("Fetching NFTs from contract:", contract);
      const ownedNFTs = await getOwnedNFTs({
        contract: contract,
        owner: account?.address,
      });
      console.log("Owned NFTs fetched:", ownedNFTs);
      setOwnedNfts(ownedNFTs); // Set the entire array of NFTs
      
    } catch (err) {
      console.error("Error fetching owned NFTs:", err);
    } finally {
      setLoading(false);
      console.log("Finished fetching NFTs. Loading state:", loading);
    }
  }, [account, contract]);

  const fetchOwnedNftsErc1155 = useCallback(async () => {
    if (!account) return;

    
    console.log("Starting to fetch owned NFTs...");
    setLoading(true);
  
    try {
      console.log("Fetching NFTs from contract:", contract);
      const ownedNFTs = await getOwned1155NFTs({
        contract: contract,
        owner: account?.address,
      });
      console.log("Owned NFTs fetched:", ownedNFTs);
      setOwnedNfts(ownedNFTs); // Set the entire array of NFTs
      
    } catch (err) {
      console.error("Error fetching owned NFTs:", err);
    } finally {
      setLoading(false);
      console.log("Finished fetching NFTs. Loading state:", loading);
    }
  }, [account, contract]);

  const fetchNftsErc1155 = useCallback(async () => {
    
    
    console.log("Starting to fetch owned NFTs...");
    setLoading(true);
  
    try {
      console.log("Fetching NFTs from contract:", contract);
      const ownedNFTs = await getErc1155NFTs({
        contract: contract,
      });
      console.log("Owned NFTs fetched:", ownedNFTs);
      setNfts(ownedNFTs); // Set the entire array of NFTs
      
    } catch (err) {
      console.error("Error fetching owned NFTs:", err);
    } finally {
      setLoading(false);
      console.log("Finished fetching NFTs. Loading state:", loading);
    }
  }, [account, contract]);
  

 

  useEffect(() => {
    if (isERC721ContractData) {
      setLoading(true);

      console.log(isERC721ContractData)
      setIsErc721Contract(true);
      setIsErc1155Contract(false);
    } else if (isERC1155ContractData) {
      console.log(isERC1155ContractData)
      setLoading(true);

      setIsErc721Contract(false);
      setIsErc1155Contract(true);
    }
  }, [isERC721ContractData, isERC1155ContractData]);

  
  useEffect(() => {
    if (isERC1155ContractData == true) {
      fetchNftsErc1155();
    }
  }, [fetchNftsErc1155, activeContract]);

  useEffect(() => {
    // If sharedMetadataData exists and is not null, set isErc721Metadata to true
    if (sharedMetadataData) {
      setIsErc721MetaData(true);
    } else {
      setIsErc721MetaData(false);
    }
  }, [sharedMetadataData]); 

  useEffect(() => {
    if (contractAddress) {
      const foundContract = NFT_CONTRACTS.find(c => c.address === contractAddress);
  
      if (foundContract) {
        const chain = ChainList.find(c => c.chainId === chainIdNumber);
        const explorerUrl = chain?.explorers?.[0]?.url || 'https://iotexscan.io';
        const explorerLink = `${explorerUrl}/address/${contractAddress}`;
  
        const newActiveContract = {
          ...foundContract,
          Explorer: explorerLink,
          social_urls: foundContract.social_urls,
        };
  
        // Only update state if the data has changed
        if (JSON.stringify(activeContract) !== JSON.stringify(newActiveContract)) {
          setActiveContract(newActiveContract);
        }
      } else {
        const fetchMetadata = async () => {
          await refetchContractMetadata();
          if (contractMetadata) {
            const chain = ChainList.find(c => c.chainId === chainIdNumber);
            const explorerUrl = chain?.explorers?.[0]?.url || 'https://iotexscan.io';
            const explorerLink = `${explorerUrl}/address/${contractAddress}`;
  
            const newActiveContract = {
              address: contractAddress,
              chain: NETWORK,
              type: 'ERC721', // or dynamically determine type if necessary
              title: contractMetadata.name || "",
              description: contractMetadata.description || "",
              thumbnailUrl: contractMetadata.image || "",
              Explorer: explorerLink,
              social_urls: {
                x: contractMetadata.social_urls?.x || "",
                telegram: contractMetadata.social_urls?.telegram || "",
                website: contractMetadata.social_urls?.website || "",
                discord: contractMetadata.social_urls?.discord || "",
                github: contractMetadata.social_urls?.github || "",
              },
            };
  
            // Only update state if the data has changed
            if (JSON.stringify(activeContract) !== JSON.stringify(newActiveContract)) {
              setActiveContract(newActiveContract);
            }
          }
        };
        fetchMetadata();
      }
    }
  }, [contractAddress, refetchContractMetadata, contractMetadata, chainIdNumber, activeContract]);
  
  useEffect(() => {
    setIsSearching(!!searchedId);
  }, [searchedId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d+$/.test(value)) {
      setShowInfo(false);
      setSearch(value);
      setActiveSection('nfts');

    } else {
      setSearch('');
    }
  };

  useEffect(() => {
    if (debouncedSearchTerm) {
      const id = parseInt(debouncedSearchTerm, 10);
      if (!isNaN(id)) {
        setShowInfo2(false)
        setSearchedId(id);
        router.push(`/contracts/${chainId}/${contractAddress}#${id}`);
        window.location.hash = `#${id}`;
        setActiveSection('nfts');
      
      } else {
        setSearchedId(null);
      }
    } else {
      setSearchedId(null);
    }
  }, [debouncedSearchTerm]);

 
  const handleShowOwnedClick = useCallback(() => {
    if (!showOwned && isERC721ContractData == true) {

      fetchNftsOwnedErc721();
    }
    if (!showOwned && isERC1155ContractData == true) {
      fetchOwnedNftsErc1155();
    }
    setShowOwned(prev => !prev);
  }, [showOwned, activeContract, fetchNftsOwnedErc721, fetchOwnedNftsErc1155,isERC721ContractData,isERC1155ContractData]);

  
  // Update the showExplorer state based on the URL hash when the component first loads
  useEffect(() => {
    const hash = window.location.hash;

    // If the hash is #explorer, show the explorer
    if (hash === '#explorer') {
      setShowExplorere(true);
    } else {
      setShowExplorere(false);
    }

    // Listen for hash changes to handle manual URL changes
    const handleHashChange = () => {
      if (window.location.hash === '#explorer') {
        setShowExplorere(true);
      } else {
        setShowExplorere(false);
      }
    };

    window.addEventListener('hashchange', handleHashChange);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  const toggleContractData = useCallback(() => {
    setShowContractData(prev => !prev);
  }, []);

  const toggleContractLazyMint = useCallback(() => {
    setShowLazyMint(prev => !prev);
  }, []);

  const toggleContractClaim = useCallback(() => {
    setShowClaim(prev => !prev);
  }, []);

  const toggleContractMint = useCallback(() => {
    setShowMint(prev => !prev);
  }, []);

  const toggleContractClaimCondition = useCallback(() => {
    setShowClaimConditionErc721(prev => !prev);
  }, []);

  const toggleMetadata = useCallback(() => {
    setShowMetadata(prev => !prev);
  }, []);

  const toggleContractClaimConditonErc1155 = useCallback(() => {
    setShowClaimConditionErc1155(prev => !prev);
  }, []);

  const toggleLazyMintErc1155 = useCallback(() => {
    setShowLazyMintErc1155(prev => !prev);
  }, []);

  const toggleContractClaimErc1155 = useCallback(() => {
    setShowClaimErc1155(prev => !prev);
  }, []);

  const toggleMintErc1155 = useCallback(() => {
    setShowMintErc1155(prev => !prev);
  }, []);
  const toggleContractAppGenerator = useCallback(() => {
    setShowAppGenerator(prev => !prev);
  }, []);
  
  
  return (
    <div className={styles.container}>
      <Helmet>
        <title>{`NftGallery - ${activeContract?.title ?? ''}`}</title>
      </Helmet>
      <div className={styles.buttonContainer}>
        <Menu trigger="click" control={<Button>Choose Collection</Button>}>
          {NFT_CONTRACTS.map((contract, index) => (
            <Menu.Item key={index} onClick={() => router.push(`/NftGalerie/${contract.chainId}/${contract.address}`)}>
              <div className={styles.menuItem}>{contract.title}</div>
            </Menu.Item>
          ))}
        </Menu>


        <Button onClick={handleShowOwnedClick}>
                {showOwned ? 'Show All NFTs' : 'Show Owned NFTs'}
            </Button>

            <Button onClick={() => toggleSection('explorer')}>
                {activeSection === 'explorer' ? 'Hide Explorer' : 'Show Explorer'}
            </Button>

            <Button onClick={() => toggleSection('contractData')}>
                {activeSection === 'contractData' ? 'Hide ContractSettings' : 'ContractSettings'}
            </Button>

            {contractType === "0x44726f7045524337323100000000000000000000000000000000000000000000" && (
                <Button onClick={() => toggleSection('lazyMint')}>
                    {activeSection === 'lazyMint' ? 'Hide LazyMint' : 'Show LazyMint'}
                </Button>
            )}

            {address.toLowerCase() === "0x600DA20E193624fbbbe1dE8324f8CCfcf2A4a63D".toLowerCase() && (
                <Button onClick={() => toggleSection('lazyMint')}>
                    {activeSection === 'lazyMint' ? 'Hide LazyMint' : 'Show LazyMint'}
                </Button>
            )}

            {isERC721ContractData && !isErc721MintTo && (
                <Button onClick={() => toggleSection('mint')}>
                    {activeSection === 'mint' ? 'Hide Mint' : 'Show Mint'}
                </Button>
            )}

            {contractType === "0x44726f7045524337323100000000000000000000000000000000000000000000" && (
                <Button onClick={() => toggleSection('claim')}>
                    {activeSection === 'claim' ? 'Hide ContractClaim' : 'ContractClaim'}
                </Button>
            )}

            {contractType === "0x44726f7045524331313535000000000000000000000000000000000000000000" && (
                <>
                    <Button onClick={() => toggleSection('claimErc1155')}>
                        {activeSection === 'claimErc1155' ? 'Hide ContractClaim' : 'ContractClaim'}
                    </Button>
                    <Button onClick={() => toggleSection('claimConditionErc1155')}>
                        {activeSection === 'claimConditionErc1155' ? 'Hide ClaimCondition' : 'ClaimCondition'}
                    </Button>
                    <Button onClick={() => toggleSection('lazyMintErc1155')}>
                        {activeSection === 'lazyMintErc1155' ? 'Hide LazyMint' : 'LazyMint'}
                    </Button>
                </>
            )}

            {contractType === "0x44726f7045524337323100000000000000000000000000000000000000000000" && (
                <Button onClick={() => toggleSection('claimCondition')}>
                    {activeSection === 'claimCondition' ? 'Hide ContractClaimCondition' : 'ContractClaimCondition'}
                </Button>
            )}

            {contractType === "0x44726f7045524337323100000000000000000000000000000000000000000000" && (
                <Button onClick={() => toggleSection('appGenerator')}>
                    {activeSection === 'appGenerator' ? 'Hide NftGenerator' : 'NftGenerator'}
                </Button>
            )}

            {isERC721ContractData && isErc721Metadata && (
                <Button onClick={() => toggleSection('metadata')}>
                    {activeSection === 'metadata' ? 'Hide ContractMetadata' : 'ContractMetadata'}
                </Button>
            )}

            {contractType === "0x546f6b656e455243313135350000000000000000000000000000000000000000" && (
                <Button onClick={() => toggleSection('mintErc1155')}>
                    {activeSection === 'mintErc1155' ? 'Hide Mint' : 'Mint'}
                </Button>
            )}


      </div>
      <div className={styles.details}>
        {activeContract && (
          <>
            <h1>{activeContract.title}</h1>
            <MediaRenderer src={activeContract.thumbnailUrl} client={client} className="object-cover object-center w-full h-96" />
            <div className={styles.socials}>
              {activeContract.social_urls?.x && (
                <a href={activeContract.social_urls.x} target="_blank" rel="noopener noreferrer">
                  <FaTwitter />
                </a>
              )}
              {activeContract.social_urls?.telegram && (
                <a href={activeContract.social_urls.telegram} target="_blank" rel="noopener noreferrer">
                  <FaTelegram />
                </a>
              )}
              {activeContract.social_urls?.website && (
                <a href={activeContract.social_urls.website} target="_blank" rel="noopener noreferrer">
                  <FaGlobe />
                </a>
              )}
              {activeContract.social_urls?.github && (
                <a href={activeContract.social_urls.github} target="_blank" rel="noopener noreferrer">
                  <FaGithub />
                </a>
              )}
              {activeContract.social_urls?.discord && (
                <a href={activeContract.social_urls.discord} target="_blank" rel="noopener noreferrer">
                  <FaDiscord />
                </a>
              )}
            </div>
            <p className={styles.description}>{activeContract.description}</p>
            <DefaultStats contractAddress={activeContract.address} chainId={chainIdNumber} events={events}/>

            <button onClick={() => router.push('/NftGalerie')} className={styles.backButton}>Back to gallery</button>
          </>
        )}
      </div>
      <div className={styles.searchContainer}>
        <div className={styles.searchBar}>
          <SearchIcon />
          <input
            type="text"
            onChange={handleInputChange}
            placeholder="Search by ID"
            className={styles.searchInput}
          />
        </div>
        {activeContract?.address && searchedId && (
          <div className={styles.searchedNFT}>
            <NFTCard
              key={searchedId}
              tokenId={BigInt(searchedId)}
              contractAddresse={activeContract.address}
              chainId={chainIdNumber}
              event={[""]}
              autoShowInfo={showInfo}
            />
          </div>
        )}

      {activeSection === 'explorer' && (
        <div className={styles.explorer}>
          <Explorer
            contractAddress={address}
            chainId={chainIdNumber}
            type={(() => {
              switch (contractType) {
                case "0x44726f7045524337323100000000000000000000000000000000000000000000":
                  return "DropERC721";
                case "0x546f6b656e455243373231000000000000000000000000000000000000000000":
                  return "TokenERC721";
                case "0x546f6b656e455243313135350000000000000000000000000000000000000000":
                  return "TokenERC1155";
                case "0x44726f7045524331313535000000000000000000000000000000000000000000":
                  return "DropERC1155";
                case "0x546f6b656e455243323000000000000000000000000000000000000000000000":
                  return "TokenERC20";
                case "0x44726f7045524332300000000000000000000000000000000000000000000000":
                  return "DropERC20";
                default:
                  if (isErc721Metadata === true) {
                    return "DropERC20";
                  } else {
                    return "DefaultNFT";
                  }
              }
            })()}
          />
        </div>
      )}
        
        
        {activeSection === 'contractData' && (
          <div className={styles.contractData}>
            <ContractSettings contractAddress={address} chainId={chainIdNumber} />
          </div>
        )}
        {activeSection === 'mint' && (
          <div className={styles.mint}>
            <MintComponent contractAddress={address} chainId={chainIdNumber} />
          </div>
        )}
        {activeSection === 'claim' && (
          <div className={styles.claim}>
            <ClaimAppGalerie contractAddress={address} chainId={chainIdNumber} />
          </div>
        )}
         {activeSection === 'metadata' && (
        <div className={styles.claim}>
          <SetMetadataComponent contractAddress={address} chainId={chainIdNumber} />
        </div>
      )}
      

        {activeSection === 'claimConditionErc721' && (
          <div className={styles.claim}>
            <ClaimConditonErc712 contractAddress={address} chainId={chainIdNumber} />
          </div>
        )}
         {activeSection === 'lazyMint' && (
          <div className={styles.claim}>
            <LayzMintComponentErc721 contractAddress={address} chainId={chainIdNumber} />
          </div>
        )}
        
        {activeSection === 'claimErc1155' && (
          <div className={styles.claim}>
            <ClaimAppErc1155 contractAddress={address} chainId={chainIdNumber} />
          </div>
        )}
         {activeSection === 'claimConditionErc1155' && (
          <div className={styles.claim}>
            <ClaimConditonErc1155 contractAddress={address} chainId={chainIdNumber} />
          </div>
        )}
         {activeSection === 'lazyMintErc1155' && (
          <div className={styles.claim}>
            <LayzMintComponentErc1155 contractAddress={address} chainId={chainIdNumber} />
          </div>
        )}
        {activeSection === 'mintErc1155' && (
          <div className={styles.mint}>
            <MintComponentErc1155 contractAddress={address} chainId={chainIdNumber} />
          </div>
        )}
        {activeSection === 'appGenerator' && (
          <div className={styles.mint}>
            <NftGeneratorApp contractAddress={address} chainId={chainIdNumber} />
          </div>
        )}
        {activeSection === 'nfts' && (
          isLoading ? (
            <div className={styles.loadingContainer}>
              {Array.from({ length: nftsPerPage }).map((_, i) => (
                <div className={styles.loadingCard} key={i} />
              ))}
            </div>
          ) : (
            <div className={styles.nftGrid}>
          {nfts.map((nft) => (
                <NFTCardContracts
                  key={nft.id.toString()}
                  tokenId={BigInt(nft.id)}
                  contractAddresse={address}
                  chainId={chainIdNumber}
                  nft={nft}
                />
              ))}
            </div>
          )
        )}
        <div>
        {activeContract?.address && (showOwned ? (
            <PaginationHelperProfile contractAddress={activeContract.address} setPage={setPage} totalItems={ownedNfts.length} itemsPerPage={nftsPerPage} />
          ) : (
            isInContractList ? (
              <PaginationHelper contractAddress={activeContract.address} setPage={setPage} />
            ) : (
              <Footer 
              page={page}
              setPage={setPage}
              nftsPerPage={nftsPerPage}
              totalCount={nextTokenIdToMintContract ? Number(nextTokenIdToMintContract) : totalCount ? Number(totalCount) : undefined}
              loading={isLoading}

              />
            )
          ))}
        </div>
      </div>
    </div>
  );
};

export default PlasmaWorld;
