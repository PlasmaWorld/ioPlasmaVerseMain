import React, { FC, useEffect, useState, useCallback, useMemo, Suspense } from "react";
import { Container, Group, Skeleton } from "@mantine/core";
import { MediaRenderer, useActiveAccount, useReadContract } from "thirdweb/react";
import { AppMint, BuzzBotsContract, ChattApp, IotexPunksContract, LoxodromeContract, MARKETPLACE, MachinFiContract, MimoAlbieContract, MimoBimbyContract, MimoGizyContract, MimoPipiContract, MimoSpaceContract, RobotAiContract, SpunksContract, SumoContractContract, WebStreamContract, XSumoContract } from "@/const/contracts";
import { Address, ThirdwebContract, readContract, resolveMethod } from "thirdweb";
import client from "@/lib/client";
import ModalCreateAccount from "../AccountGroup/createAccount";
import Modal from "../ProfileImageUploader/modalbackround";
import Image from "next/image";
import { getAllValidListings, getAllValidAuctions, getAllValidOffers, Offer } from "thirdweb/extensions/marketplace";
import NewModal from "../ProfileImageUploader/modalprofil";
import NFTGridProfile from "../NFT/NftGridProfile";
import toastStyle from "@/util/toastConfig";
import toast from "react-hot-toast";
import { getNFT, getOwnedNFTs } from "thirdweb/extensions/erc721";
import styles from "../../Style/profile.module.css";
import NFTGrid, { NFTGridLoading } from "@/components/NFT/NFTGrid";
import randomColor from "@/util/randomColor";
import { FaTwitter, FaTelegram, FaGlobe } from 'react-icons/fa';  
import { getContractMetadata } from "thirdweb/extensions/common";
import { BigNumber } from "ethers";
import StoryGrid from "../AccountGroup/StoryGrid";
import { useNfts } from "@/Hooks/NftOwnedProvider";
import NFTGridOwne from "../NFT/NftGridImages";
import { ListingStatus } from "@/customDirectListing/DirectListingListingStatis";
import { useMarketplaceData } from "@/Hooks/MarketProvider";
import { NFTCard } from "../NFT/NftCardMarketplace";

interface EnglishAuction  {
  id: bigint;
  creatorAddress: Address;
  assetContractAddress: Address;
  tokenId: bigint;
  quantity: bigint;
  currencyContractAddress: Address;
  minimumBidAmount: bigint;
  minimumBidCurrencyValue: string; // GetBalanceResult
  buyoutBidAmount: bigint;
  buyoutCurrencyValue: string; // GetBalanceResult 
  timeBufferInSeconds: bigint;
  bidBufferBps: bigint;
  startTimeInSeconds: bigint;
  endTimeInSeconds: bigint;
  status: ListingStatus;
};

interface DirectListing {
  id: bigint;
  creatorAddress: Address;
  assetContractAddress: Address;
  tokenId: bigint;
  quantity: bigint;
  currencyContractAddress: Address;
  currencySymbol: string;
  pricePerToken: string;
  startTimeInSeconds: bigint;
  endTimeInSeconds: bigint;
  isReservedListing: boolean;
  status: number;
}

const [randomColor1, randomColor2, randomColor3, randomColor4] = [
  randomColor(),
  randomColor(),
  randomColor(),
  randomColor(),
];
const ASPECT_RATIO = 750 / 200;

const PencilIcon = () => (
  <svg viewBox="0 0 20 20" fill="currentColor" className="pencil w-6 h-6">
    <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z"></path>
    <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4l-6 6H2V6z" clipRule="evenodd"></path>
  </svg>
);

interface ProfilePageClientProps {
  profileAddress: string;
}

const fetchIPFSData = async (ipfsUrl: string) => {
  const url = `https://ipfs.io/ipfs/${ipfsUrl.split("ipfs://")[1]}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch IPFS data');
  }
  return await response.json();
};

type NFTData = {
  tokenId: bigint;
  contractAddress: `0x${string}`;
  listing?: DirectListing;
};

type NFTDataAuction = {
  tokenId: bigint;
  contractAddress: `0x${string}`;
  auction?: EnglishAuction;
};

const ProfilePageClient: React.FC<ProfilePageClientProps> = ({
  profileAddress,
}) => {
  const nftsPerPage = 20;
  const [page, setPage] = useState(1);
  const [ownedNfts, setOwnedNfts] = useState<{ [key: string]: number[] }>({});
  const [ownedNfts33, setOwnedNfts3] = useState<{ [key: string]: number[] }>({});
  const [userName, setUserName] = useState<string>('');
  const address = profileAddress.startsWith('0x') && profileAddress.length === 42 ? profileAddress as `0x${string}` : null;

  const [isModalVisible, setModalVisible] = useState(false);
  const [isAccountModalVisible, setAccountModalVisible] = useState(false);
  const [isGroupModalVisible, setGroupModalVisible] = useState(false);
  const [tab, setTab] = useState<"nfts" | "ProfileImages" | "listings" | "auctions">("nfts");
  const [ownedNftsProfile, setOwnedNftsProfile] = useState<any | null>(null);
  const [ownedNftsBackRound, setOwnedNftsBackRound] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nftImageUrl, setNftImageUrl] = useState<string>("");
  const { ownedNfts2, ownedNfts3 } = useNfts();
  const [modalOpen, setModalOpen] = useState(false);
  const [ProfileModalOpen, setProfileModalOpen] = useState(false);
  const [signerAddress, setSignerAddress] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const account = useActiveAccount();
  console.log("Profile Address:", profileAddress);
  const [attributes, setAttributes] = useState<Record<string, any> | undefined>(undefined);
  const [nftData, setNftData] = useState<NFTData[]>([]);
  const [NftDataAuction, setNftDataAuction] = useState<NFTDataAuction[]>([]);

  const [activeTab, setActiveTab] = useState<'listings' | 'auctions'>('listings');

  const { validListings, validAuctions } = useMarketplaceData();


  const fetchNFTData = useCallback(async (tokenId: string) => {
    if (tokenId) {
        console.log("Fetching NFT data started for tokenId:", tokenId);
        try {
            const contract = ChattApp;

            // Fetch contract metadata
            const contractMetadata = await getContractMetadata({ contract });
            const contractName = contractMetadata.name;
            console.log("Contract Name:", contractName);

            // Fetch NFT data
            const nftData = await getNFT({
                contract,
                tokenId: BigInt(tokenId),
                includeOwner: true,
            });

            console.log("Fetched NFT data:", nftData);

            if (nftData && nftData.metadata) {
                const metadata = nftData.metadata as any;
                if (metadata.attributes) {
                    setAttributes(metadata.attributes);
                    console.log("NFT attributes:", metadata.attributes);
                } else {
                    console.log("No attributes found in metadata.");
                }
            }
        } catch (error) {
            console.error("Error fetching NFT:", error);
        }
    }
}, []);
  // Get the contract
  const fetchUserInfo = useCallback(async (signerAddress: string | undefined, contract: ThirdwebContract) => {
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

              

              // Fetch NFT data using the tokenId
              fetchNFTData(tokenId);
          } else {
             
          }
      } catch (error) {
          console.error("Error fetching user info:", error);
         
      } finally {
          setIsLoading(false);    
      }
  }, [fetchNFTData]);

  
  

  useEffect(() => {
      if (profileAddress) {
          const signerAddress = profileAddress;
          fetchUserInfo(signerAddress, ChattApp);
      }

  }, [profileAddress, fetchUserInfo]);
  

 

  

  useEffect(() => {
    const fetchData = async () => {
      const filteredListings = validListings?.filter((listing) => listing.creatorAddress === profileAddress) || [];
      const filteredAuctions = validAuctions.filter((a) => a.creatorAddress === profileAddress) || [];

      const listingsData = filteredListings.map(listing => ({
        tokenId: listing.tokenId,
        contractAddress: listing.assetContractAddress,
        listing,
      }));

      const auctionsData = filteredAuctions.map(auction => ({
        tokenId: auction.tokenId,
        contractAddress: auction.assetContractAddress,
        auction,
      }));
      setNftDataAuction([...auctionsData]);

      setNftData([...listingsData]);
    };

    fetchData();
  }, [validListings, validAuctions]);
  const fetchUsername = useCallback(async (signerAddress: string | undefined, contract: ThirdwebContract) => {
    if (!signerAddress) return;
    setIsLoading(true);
    try {
        const usernameData = await readContract({
            contract,
            method: resolveMethod("getUserInfo"),
            params: [signerAddress]
        }) as unknown as string[];

        if (usernameData && usernameData.length > 0) {
            setUserName(usernameData[0]);

        } else {
            setUserName("Unknown user");
        }
    } catch (error) {
    } finally {
        setIsLoading(false);
    }
}, []);
  
  const fetchOwnedNfts = useCallback(async (contractAddress: string, contract: ThirdwebContract) => {
    if (!address) return;
    setLoading(true);

    try {
      const ownedNFTs = await getOwnedNFTs({
        contract,
        owner: address,
      });
      const ids = ownedNFTs.map(nft => Number(nft.id));
      setOwnedNfts(prevState => {
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
  }, [address]);

  useEffect(() => {
    if (profileAddress) {
      setSignerAddress(profileAddress);
      fetchUsername(profileAddress, ChattApp);
      fetchOwnedNfts("0x0c5AB026d74C451376A4798342a685a0e99a5bEe", SpunksContract);

      fetchOwnedNfts("0x0c5AB026d74C451376A4798342a685a0e99a5bEe", MachinFiContract);
      fetchOwnedNfts("0x9756e951dd76e933e34434db4ed38964951e588b", SumoContractContract);
      fetchOwnedNfts("0x7d150d3eb3ad7ab752df259c94a8ab98d700fc00", XSumoContract);
      fetchOwnedNfts("0x7f8cb1d827f26434da652b4e9bd02c698cc2842a", LoxodromeContract);
      fetchOwnedNfts("0xdfbbeba6d17b0d49861ab7f26cda495046314370", BuzzBotsContract);
      fetchOwnedNfts("0xaf1b5063a152550aebc8d6cb0da6936288eab3dc", RobotAiContract);             
    }
  }, [profileAddress, fetchOwnedNfts,fetchUsername,setSignerAddress]);

  const fetchOwnedNfts2 = useCallback(async (
    signerAddress: string | undefined,
    contract: ThirdwebContract,
    contractAddress: string,
    totalIds: number,
    batchSize: number,
    newFetch: number
  ) => {
    if (!contract || !signerAddress) return;

    const ownedIds: number[] = [];

    const fetchBatch = async (start: number, end: number) => {
      const promises = [];
      for (let i = start; i < end; i++) {
        const promise = readContract({
          contract,
          method: resolveMethod("ownerOf"),
          params: [i]
        }).catch(error => {
          return null;
        }) as unknown as Promise<string>;
        promises.push(promise);
      }

      const results = await Promise.allSettled(promises);

      results.forEach((result, index) => {
        const nftId = start + index;
        if (result.status === 'fulfilled' && result.value) {
          const ownerAddress = (result.value as string).toLowerCase();
          if (ownerAddress === signerAddress.toLowerCase()) {
            ownedIds.push(nftId);
          }
        }
      });
    };

    try {
      for (let i = 0; i < totalIds; i += batchSize) {
        await fetchBatch(i, Math.min(i + batchSize, totalIds));
        if (i + batchSize >= newFetch) {
          break;
        }
      }
    } finally {
      setOwnedNfts((prevState) => {
        const updatedNfts2 = { ...prevState, [contractAddress]: ownedIds };
        return updatedNfts2;
      });
    }
  }, []);

  const fetchOwnedNfts3 = useCallback(async (
    signerAddress: string | undefined,
    contract: ThirdwebContract,
    contractAddress: string,
    totalIds: number,
    batchSize: number,
    newFetch: number
  ) => {
    if (!contract || !signerAddress) return;

    const ownedIds: number[] = [];

    const fetchBatch = async (start: number, end: number) => {
      const promises = [];
      for (let i = start; i < end; i++) {
        const promise = readContract({
          contract,
          method: resolveMethod("ownerOf"),
          params: [i]
        }).catch(error => {
          return null;
        }) as unknown as Promise<string>;
        promises.push(promise);
      }

      const results = await Promise.allSettled(promises);

      results.forEach((result, index) => {
        const nftId = start + index;
        if (result.status === 'fulfilled' && result.value) {
          const ownerAddress = (result.value as string).toLowerCase();
          if (ownerAddress === signerAddress.toLowerCase()) {
            ownedIds.push(nftId);
          }
        }
      });
    };

    try {
      for (let i = 0; i < totalIds; i += batchSize) {
        await fetchBatch(i, Math.min(i + batchSize, totalIds));
        if (i + batchSize >= newFetch) {
          break;
        }
      }
    } finally {
      setOwnedNfts3((prevState) => {
        const updatedNfts2 = { ...prevState, [contractAddress]: ownedIds };
        return updatedNfts2;
      });
    }
  }, []);

  useEffect(() => {
    if (profileAddress) {
      const signerAddress = profileAddress;
      fetchOwnedNfts3(signerAddress, AppMint, '0x9C023CD4E58466424B7f60B32004c6B9d5596140', 100, 50, 90)

      fetchOwnedNfts2(signerAddress, WebStreamContract, '0x8aa9271665e480f0866d2F61FC436B96BF9584AD', 838, 150, 830)
       .then(() =>  fetchOwnedNfts2(signerAddress, IotexPunksContract,'0xce300b00aa9c066786D609Fc96529DBedAa30B76',10000,150,9990))

        .then(() => fetchOwnedNfts2(signerAddress, MimoPipiContract, '0xe1Bb99ed442ce6c6ad3806C3afcbd8f7733841A7', 1000, 150, 990))
        .then(() => fetchOwnedNfts2(signerAddress, MimoAlbieContract, '0x8cfE8bAeE219514bE529407207fCe9C612E705fD', 946, 150, 930))
        .then(() => fetchOwnedNfts2(signerAddress, MimoBimbyContract, '0xaa5314f9ee6a6711e5284508fec7f40e85969ed6', 1000, 150, 990))
        .then(() => fetchOwnedNfts2(signerAddress, MimoGizyContract, '0x0689021f9065b18c710f5204e41b3d20c3b7d362', 1000, 150, 990))
        .then(() => fetchOwnedNfts2(signerAddress, MimoSpaceContract, '0x778E131aA8260C1FF78007cAde5e64820744F320', 189, 150, 190))
        .catch((error) => {
          toast.error(
            "Something went wrong while fetching your NFTs!",
            {
              position: "bottom-center",
              style: toastStyle,
            }
          );
        });
    }
  }, [profileAddress,fetchOwnedNfts2,fetchOwnedNfts3]);

  

  const fetchUserProfile = useCallback(async (signerAddress: string | undefined, contract: ThirdwebContract) => {
    if (!signerAddress) return;
    try {
      console.log("Fetching profile image for:", signerAddress);
      const imageUrl = await readContract({
        contract,
        method: resolveMethod("getActiveProfileImage"),
        params: [signerAddress]
      }) as unknown as string;

      if (imageUrl.startsWith("ipfs://")) {
        const ipfsData = await fetchIPFSData(imageUrl);
        setOwnedNftsProfile(ipfsData);
      } else {
        setOwnedNftsProfile({ image: imageUrl });
      }
      setIsLoading(false);
    } catch (error) {
      console.error('Error checking user existence:', error);
      setError('Failed to load profile image.');
      setIsLoading(false);
    }
  }, []);

  const fetchUserBackround = useCallback(async (signerAddress: string | undefined, contract: ThirdwebContract) => {
    if (!signerAddress) return;
    try {
      console.log("Fetching background image for:", signerAddress);
      const exists = await readContract({
        contract,
        method: resolveMethod("getActiveBackgroundImage"),
        params: [signerAddress]
      }) as unknown as string;
      setNftImageUrl(exists);
      const ipfsData = await fetchIPFSData(exists);
      console.log("Fetched IPFS data:", ipfsData);
      setOwnedNftsBackRound(ipfsData.image);
    } catch (error) {
      console.error('Error checking user existence:', error);
    }
  }, []);

  useEffect(() => {
    if (profileAddress) {
      fetchUserProfile(profileAddress, AppMint);
      fetchUserBackround(profileAddress, AppMint);
    } else {
      console.log("No account found");
    }
  }, [profileAddress, fetchUserBackround, fetchUserProfile]);

  const refetchProfile = useCallback(() => {
    if (profileAddress) {
      fetchUserProfile(profileAddress, AppMint);
      fetchUserBackround(profileAddress, AppMint);
    }
  }, [profileAddress, fetchUserProfile, fetchUserBackround]);

  const handleOpenModal = () => setModalVisible(true);
  const handleCloseModal = () => setModalVisible(false);
  const handleOpenModalAccount = () => setAccountModalVisible(true);
  const handleCloseModalAccount = () => setAccountModalVisible(false);
  const handleOpenModalGroup = () => setGroupModalVisible(true);
  const handleCloseModalGroup = () => setGroupModalVisible(false);



  // Pagination for NFTs
  const totalNfts = useMemo(() => {
    return Object.values(ownedNfts2).flat().length;
  }, [ownedNfts2]);

  const paginatedNfts = useMemo(() => {
    const allNfts = Object.entries(ownedNfts2).flatMap(([contractAddress, nftIds]) =>
      nftIds.map((id) => ({ contractAddress, id }))
    );
    const start = (page - 1) * nftsPerPage;
    const end = start + nftsPerPage;
    return allNfts.slice(start, end);
  }, [ownedNfts2, page, nftsPerPage]);

  return (
    <div style={{ padding: '40px 0' }}>
      <Container style={{ padding: '0' }}>
        <div className={styles.profileHeader}>
        {attributes && (
    <>
        <div className="flex flex-col items-center justify-center">
            <span className="text-xl md:text-2xl font-bold text-white">
                {attributes.title}
            </span>
          </div>
    </>
)}

          <div className="relative">
            {nftImageUrl ? (
              <MediaRenderer src={nftImageUrl} client={client} className={styles.coverImage} style={{
                width: '100%',
                height: `calc(100vw / ${ASPECT_RATIO})`,
                maxHeight: '450px',
                borderRadius: '16px',
                objectFit: 'cover',
              }} />
            ) : (
              <div
                className={styles.coverImage}
                style={{
                  background: `linear-gradient(90deg, ${randomColor1}, ${randomColor2})`,
                  width: '100%',
                  height: `calc(100vw / ${ASPECT_RATIO})`,
                  maxHeight: '450px',
                  borderRadius: '16px',
                  objectFit: 'cover',
                }} />
            )}
            <button
              onClick={() => setModalOpen(true)}
              className="absolute bottom-0 right-0 m-auto p-2 rounded-full bg-gray-800 hover:bg-gray-700 border border-gray-600"
              title="Change photo"
            >
              <PencilIcon />
            </button>
          </div>
          {modalOpen && (
            <Modal onRequestClose={() => setModalOpen(false)} />
          )}
        </div>
        <div className="flex flex-col items-center">
          <div className="relative mb-4">
            {ownedNftsProfile ? (
              <Image
                src={ownedNftsProfile.image}
                alt="Profile"
                className={styles.profilePicture}
                width={125}
                height={125}
                style={{
                  background: `linear-gradient(90deg, ${randomColor3}, ${randomColor4})`,
                }} />
            ) : (
              <div
                className={styles.profilePicture}
                style={{
                  background: `linear-gradient(90deg, ${randomColor3}, ${randomColor4})`,
                }} />
            )}
            <button
              onClick={() => setProfileModalOpen(true)}
              className="absolute -bottom-3 right-0 m-auto w-fit p-2 rounded-full bg-gray-800 hover:bg-gray-700 border border-gray-600 z-20"
              title="Change photo"
            >
              <PencilIcon />
            </button>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-center text-white">{userName}</h2>
        </div>
        {ProfileModalOpen && <NewModal onRequestClose={() => setProfileModalOpen(false)} />}
    
        <div>
        {attributes && (
    <>
        <div className="flex flex-col items-center justify-center">
            <span className="text-xl md:text-2xl font-bold text-white">
                {attributes.userName}
            </span>
            <span className="text-xl md:text-2xl font-bold text-white">
                Age: {attributes.age}
            </span>
            <div className="flex justify-center mt-sm">
                {attributes.twitter && (
                    <a href={attributes.twitter} target="_blank" rel="noopener noreferrer" className="mx-2">
                        <FaTwitter />
                    </a>
                )}
                {attributes.telegram && (
                    <a href={attributes.telegram} target="_blank" rel="noopener noreferrer" className="mx-2">
                        <FaTelegram />
                    </a>
                )}
                {attributes.website && (
                    <a href={attributes.website} target="_blank" rel="noopener noreferrer" className="mx-2">
                        <FaGlobe />
                    </a>
                )}
            </div>
          </div>
        </>
    )}

        </div>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
        
                    <button
            onClick={handleOpenModalAccount}
            style={{
              padding: '10px 20px',
              fontSize: '16px',
              cursor: 'pointer',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
            }}
          >
            Account
          </button>
          <ModalCreateAccount isVisible={isAccountModalVisible} onClose={handleCloseModalAccount} />
        </div>
        <h1 className={styles.profileName}>
        {profileAddress ? (
          `${profileAddress.substring(0, 4)}...${profileAddress.substring(profileAddress.length - 4)}`
        ) : (
          <Skeleton width="320" />
        )}
        </h1>
        <div className={styles.tabs}>
          <h3
            className={`${styles.tab} ${tab === 'nfts' ? styles.activeTab : ''}`}
            onClick={() => setTab('nfts')}
          >
            NFTs
          </h3>
          <h3
            className={`${styles.tab} ${tab === 'ProfileImages' ? styles.activeTab : ''}`}
            onClick={() => setTab('ProfileImages')}
          >
            Profile Image
          </h3>
          <h3
            className={`${styles.tab} ${tab === 'listings' ? styles.activeTab : ''}`}
            onClick={() => setTab('listings')}
          >
            Listings
          </h3>
          <h3
            className={`${styles.tab} ${tab === 'auctions' ? styles.activeTab : ''}`}
            onClick={() => setTab('auctions')}
          >
            Auctions
          </h3>
        </div>
        <div className={tab === 'nfts' ? styles.activeTabContent : styles.tabContent}>
          <div className="flex flex-wrap items-center justify-center gap-8">
            {profileAddress === account?.address ? (
              paginatedNfts.length === 0 ? (
                <p>{"It Looks Like you don't have any NFTs."}</p>
              ) : (
                <Suspense fallback={<NFTGridLoading />}>
                  <NFTGridProfile
                    ownedNfts2={ownedNfts2}
                    
                  />
                </Suspense>
              )
            ) : (
              <Suspense fallback={<NFTGridLoading />}>
                <NFTGridProfile
                  ownedNfts2={ownedNfts}
                  
                />
              </Suspense>
            )}
          </div>
        </div>
        <div className={tab === 'ProfileImages' ? styles.activeTabContent : styles.tabContent}>
          <div className={styles.flexContainer}>
            {Object.entries(ownedNfts3).map(([contractAddress, nftIds]) => nftIds.length > 0 &&
              nftIds.map((id) => (
                <NFTGridOwne key={`${contractAddress}_${id}`} tokenId={id.toString()} contract={contractAddress} refetchProfileImage={refetchProfile}  />
              ))
            )}
          </div>
        </div>
        <div className={tab === 'listings' ? styles.activeTabContent : styles.tabContent}>
          <div className={styles.flexContainer}>
            {nftData.length === 0 ? (
              <p>{"Your NFTs on the market."}</p>
            ) : 
            nftData
            .map(data => (
              <NFTCard
                key={data.listing?.tokenId.toString()}
                tokenId={data.listing?.tokenId || BigInt(0)}
                contractAddresse={data.listing?.assetContractAddress.toString()}
                chainId={4689}
              />
            ))}
          </div>
        </div>
        <div className={tab === 'auctions' ? styles.activeTabContent : styles.tabContent}>
          <div className={styles.flexContainer}>
            {nftData.length === 0 ? (
              <p>{"Your NFTs on the market."}</p>
            ) : 
            NftDataAuction
                .map(data => (
                  <NFTCard
                    key={data.tokenId.toString()}
                    tokenId={data.tokenId || BigInt(1)}
                    contractAddresse={data.contractAddress.toString()}
                    chainId={4689}
                  />
                ))}
            
          </div>
        </div>
      </Container>
    </div>
  );
};

export default ProfilePageClient;
