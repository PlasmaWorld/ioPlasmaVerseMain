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
import styles from '@/components/styles/plasmaWorld.module.css'; // Import your CSS module

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
import { getActiveClaimCondition, getOwnedNFTs, sharedMetadata } from 'thirdweb/extensions/erc721';
import toast from 'react-hot-toast';
import toastStyle from '@/util/toastConfig';
import Explorer from '@/components/Explorer/Explorer';
import ContractSettings from '@/components/Explorer/ContractsSettings';
import Events from '@/components/events/events';
import ClaimAppGalerie from '@/components/claim/claimApp';
import OwnedNftsComponent from '@/components/ownedNfts/getOwnedNfts';

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
  transaction: 'transaction',
  nfts: 'nfts',
  ownedNfts: 'ownedNfts',

} as const;
type SectionName = keyof typeof hashMap;


const PlasmaWorld: React.FC = () => {
  const router = useRouter();
  const { contractAddress, Chain } = useParams();
  const address = Array.isArray(contractAddress) ? contractAddress[0] : contractAddress;
  const chainId = Array.isArray(Chain) ? Chain[0] : Chain;
  const chainIdNumber = parseInt(chainId, 10); // Convert chainId to number
  const nftsPerPage = 20;
  const [isSearching, setIsSearching] = useState(false);
  const [activeContract, setActiveContract] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState<string>('');
  const debouncedSearchTerm = useDebounce(search, 500);
  const [isLoading, setIsLoading] = useState(false);
  const [detailedView, setDetailedView] = useState(false);
  const [searchedId, setSearchedId] = useState<number | null>(null);
  const [showOwned, setShowOwned] = useState(false);
  const [showExplorer, setShowExplorere] = useState(false);
  const [showClaim, setShowClaim] = useState(false);
  const [showMint, setShowMint] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [showInfo2, setShowInfo2] = useState(true);
  const [showInfo3, setShowInfo3] = useState(false);

  const [contractData, setShowContractData] = useState(false); 
  const [tokenIdHash, setTokenId] = useState<any>(null);
  const [activeSection, setActiveSection] = useState<SectionName | ''>('');

  const account = useActiveAccount();
  const isInContractList = NFT_CONTRACTS.some(contract => contract.address === address);

  const NETWORK = defineChain(chainIdNumber); // Use chainIdNumber here
  const [ownedPage, setOwnedPage] = useState(1);
  const { ownedNfts3 } = useNfts();
  const [ownedNftsdefault, setOwnedNftsdefault] = useState<{ [key: string]: number[] }>({});
  const [contractType, setContractType] = useState<any>(null);
  const [isErc721Metadata, setIsErc721MetaData] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const isSectionName = (value: string): value is SectionName => {
    return Object.values(hashMap).includes(value as SectionName);
};
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
  
 

  const contract = getContract({
    address: address as string,
    client,
    chain: NETWORK,
  });
  const { data: sharedMetadataData } = useReadContract(sharedMetadata, { contract });
  useEffect(() => {
    // If sharedMetadataData exists and is not null, set isErc721Metadata to true
    if (sharedMetadataData) {
      setIsErc721MetaData(true);
    } else {
      setIsErc721MetaData(false);
    }
  }, [sharedMetadataData]); 

  let isWatching = false;  // Track if Mimo marketplace events are being watched
  


  const { data: claimCondition } = useReadContract(getActiveClaimCondition, {
    contract: contract
  });

  const {
    data: contractMetadata,
    isLoading: isContractMetadataLoading,
    refetch: refetchContractMetadata,
  } = useReadContract(getContractMetadata, {
    contract: contract,
  });

  

  useEffect(() => {
    const hash = window.location.hash.replace('#', '');

    if (!window.location.hash) {
      // Redirect to the same URL but with "#nfts"
      const newUrl = `${window.location.pathname}${window.location.search}#nfts`;
      router.push(`/NftGalerie/${chainId}/${address}#nfts`);
      setShowInfo3(true);
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
            router.push(`/NftGalerie/${chainId}/${address}#${hashValue}`);
            setActiveSection(section);
        }else if (activeSection) {
          router.push(`/NftGalerie/${chainId}/${address}#${hashValue}`);
          setActiveSection(section);
        } else {
            router.push(`/NftGalerie/${chainId}/${address}#nfts`);
            setActiveSection('nfts');
        }
    },
    [activeSection, router, address, chainId]
  );

  useEffect(() => {
    console.log("useEffect triggered with contractAddress:", contractAddress);
    if (contractAddress) {
      const foundContract = NFT_CONTRACTS.find(c => c.address === contractAddress);
      console.log("Found contract:", foundContract);
      if (foundContract) {
        const chain = ChainList.find(c => c.chainId === chainIdNumber);
        const explorerUrl = chain?.explorers?.[0]?.url || 'https://iotexscan.io';
        const explorerLink = `${explorerUrl}/address/${contractAddress}`;

        setActiveContract({
          ...foundContract,
          Explorer: explorerLink,
          social_urls: foundContract.social_urls,
        });
        setDetailedView(true);
      } else {
        // Fetch dynamic contract metadata if not found in the predefined list
        const fetchMetadata = async () => {
          console.log("Fetching metadata for contract:", contractAddress);
          await refetchContractMetadata();
          if (contractMetadata) {
            const chain = ChainList.find(c => c.chainId === chainIdNumber);
            const explorerUrl = chain?.explorers?.[0]?.url || 'https://iotexscan.io';
            const explorerLink = `${explorerUrl}/address/${contractAddress}`;

            setActiveContract({
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
            });
            setDetailedView(true);
          }
        };
        fetchMetadata();
      }
    }
  }, [contractAddress, refetchContractMetadata, contractMetadata, chainIdNumber]);

  

  const currentIds = useMemo(() => {
    if (activeContract?.title === 'Spunks') {
      return SpunksRankingNew.slice((page - 1) * nftsPerPage, page * nftsPerPage).map(item => item.spunk);
    } else {
      const startId = (page - 1) * nftsPerPage + 1;
      return Array.from({ length: nftsPerPage }, (_, i) => startId + i);
    }
  }, [page, nftsPerPage, activeContract]);

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
        window.location.hash = `#${id}`;
        setActiveSection('nfts');
      
      } else {
        setSearchedId(null);
      }
    } else {
      setSearchedId(null);
    }
  }, [debouncedSearchTerm]);
 
  useEffect(() => {
    fetchContractType(contract);
  }, [contract]);

  
  const fetchOwnedNfts = useCallback(async (contractAddress: string, contract: ThirdwebContract) => {
    if (!account) return;

    try {
        const ownedNFTs = await getOwnedNFTs({
            contract,
            owner: account?.address,
        });

        const ids = ownedNFTs.map(nft => Number(nft.id));

        setOwnedNftsdefault(prevState => {
            const updatedNfts = { ...prevState, [contractAddress]: ids };
            return updatedNfts;
        });
        console.log("owned ids", {ids})
    } catch (err) {
        
    }
}, [account, contract]);

  useEffect(() => {
    fetchOwnedNfts(address,contract)
    setIsSearching(!!searchedId);
  }, [searchedId]);

  const ownedTokenIds = useMemo(() => {
    if (activeContract) {
      return showOwned && ownedNftsdefault[activeContract.address] 
        ? ownedNftsdefault[activeContract.address]
        : ownedNfts3[activeContract.address] || [];
    }
    return [];
  }, [activeContract, showOwned, ownedNftsdefault, ownedNfts3]);

  const paginatedOwnedTokenIds = useMemo(() => {
    const start = (ownedPage - 1) * nftsPerPage;
    return ownedTokenIds.slice(start, start + nftsPerPage);
  }, [ownedPage, ownedTokenIds, nftsPerPage]);

  

  return (
    <div className={styles.container}>
      <Helmet>
        <title>{`NftGallery - ${activeContract?.title ?? ''}`}</title>
      </Helmet>
      <div className={styles.buttonContainer}>
        <Menu trigger="click" control={<Button>Choose Collection</Button>}>
          {NFT_CONTRACTS.map((contract, index) => (
            <Menu.Item key={index} onClick={() => router.push(`/NftGalerie/${contract.chainId}/${contract.address}`)}>
              <div className={styles.menuItem}>
                {contract.title}
              </div>
            </Menu.Item>
          ))}
        </Menu>
        <Button onClick={() => toggleSection('nfts')}>
                {activeSection === 'nfts' ? 'Hide nfts' : 'Show nfts'}
            </Button>
        <Button onClick={() => toggleSection('explorer')}>
                {activeSection === 'explorer' ? 'Hide Explorer' : 'Show Explorer'}
            </Button>

            <Button onClick={() => toggleSection('ownedNfts')}>
                {activeSection === 'ownedNfts' ? 'Hide ownedNfts' : 'Show ownedNfts'}
            </Button>
            

        <Button onClick={() => toggleSection('transaction')}>
          {activeSection === 'transaction' ? 'Hide Transactions' : 'Show Transactions'}
        </Button>
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
            {isInContractList ? (
              <Stats contractAddress={activeContract.address} events={events} />
            ) : (
              <DefaultStats contractAddress={activeContract.address} chainId={chainIdNumber} events={events} />
            )}
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
              event={[]}
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
        {activeSection === 'ownedNfts' && (
          <div className={styles.contractData}>
            <OwnedNftsComponent contractAddress={address} chainId={chainIdNumber} />
          </div>
        )}
        {activeSection === 'transaction' && (
          <div className={styles.events}>
            <Events contractAddress={address} chainId={chainIdNumber} events={events} />
          </div>
        )}
        {showClaim && (
          <div className={styles.claim}>
            <ClaimAppGalerie contractAddress={address} chainId={chainIdNumber} />
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
              {(showOwned ? paginatedOwnedTokenIds : currentIds).map(id => (
                activeContract?.address && (
                  <NFTCard
                    key={id}
                    tokenId={BigInt(id)}
                    contractAddresse={activeContract.address}
                    chainId={chainIdNumber}
                    event={events}
                  />
                )
              ))}
            </div>
          )
        )}
        <div>
          {activeContract?.address && (showOwned ? (
            <PaginationHelperProfile contractAddress={activeContract.address} setPage={setOwnedPage} totalItems={ownedTokenIds.length} itemsPerPage={nftsPerPage} />
          ) : (
            isInContractList ? (
              <PaginationHelper contractAddress={activeContract.address} setPage={setPage} />
            ) : (
              <PaginationHelperDefault contractAddress={activeContract.address} setPage={setPage} chainId={chainIdNumber} />
            )
          ))}
        </div>
      </div>
    </div>
  );
};

export default PlasmaWorld;