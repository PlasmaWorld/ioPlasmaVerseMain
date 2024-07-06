"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { Helmet } from "react-helmet";
import { Button, Menu } from '@mantine/core';
import { SearchIcon } from '@/components/Icons/SearchIcon';
import { SpunksRankingNew } from '@/const/contractabi';
import useDebounce from '@/const/useDebounce';
import { PaginationHelper } from '@/components/NFT/PaginationHelper';
import { PaginationHelperProfile } from '@/components/NFT/PaginationHelperOwned';

import { NFTCard } from '@/components/NFT/NftCardGalerie';
import Stats from '@/components/NFT/BuyStats';
import { FaTwitter, FaTelegram, FaLink, FaDiscord, FaGlobe } from 'react-icons/fa';
import { NFT_CONTRACTS } from '@/const/nft.contracts';
import { MediaRenderer, useReadContract } from 'thirdweb/react';
import client from '@/lib/client';
import { NFTGridLoading } from '@/components/NFT/NFTGrid';
import { MARKETPLACE } from '@/const/contracts';
import { getAllValidListings, getAllValidAuctions, getAllValidOffers } from 'thirdweb/extensions/marketplace';
import { useNfts } from '@/Hooks/NftOwnedProvider';

type NFTContract = typeof NFT_CONTRACTS[number];

const PlasmaWorld: React.FC = () => {
  const nftsPerPage = 20;
  const [isSearching, setIsSearching] = useState(false);
  const [activeContract, setActiveContract] = useState<NFTContract | null>(NFT_CONTRACTS[0]);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState<string>("");
  const debouncedSearchTerm = useDebounce(search, 500);
  const [isLoading, setIsLoading] = useState(false);
  const [detailedView, setDetailedView] = useState(false);
  const [searchedId, setSearchedId] = useState<number | null>(null);
  const [showOwned, setShowOwned] = useState(false); // State to toggle owned NFTs

  const [ownedPage, setOwnedPage] = useState(1); // State for owned NFTs pagination

  const { ownedNfts3 } = useNfts(); // Get the owned NFTs from the context

  const {
    data: allValidListings,
    isLoading: isLoadingValidListings,
    refetch: refetchAllListings,
  } = useReadContract(getAllValidListings, {
    contract: MARKETPLACE,
  });

  const {
    data: allValidAuctions,
    isLoading: isLoadingValidAuctions,
    refetch: refetchAllAuctions,
  } = useReadContract(getAllValidAuctions, {
    contract: MARKETPLACE,
  });

  const {
    data: allValidOffers,
    isLoading: isLoadingValidOffers,
    refetch: refetchAllOffers,
  } = useReadContract(getAllValidOffers, {
    contract: MARKETPLACE,
  });

  useEffect(() => {
    const fetchData = async () => {
      await refetchAllListings();
      await refetchAllAuctions();
      await refetchAllOffers();
    };
    fetchData();
  }, [refetchAllListings, refetchAllAuctions, refetchAllOffers]);

  const tokenIds = useMemo(() => {
    return Array.from(
      new Set([
        ...allValidListings?.filter((l) => l.assetContractAddress).map((l) => l.tokenId) ?? [],
        ...allValidAuctions?.filter((a) => a.assetContractAddress).map((a) => a.tokenId) ?? [],
        ...allValidOffers?.filter((a) => a.assetContractAddress).map((a) => a.tokenId) ?? [],
      ])
    );
  }, [allValidListings, allValidAuctions, allValidOffers]);

  const nftData = useMemo(() => {
    return tokenIds.map((tokenId) => {
      const directListings = allValidListings?.filter((listing) => listing.tokenId === tokenId) ?? [];
      const auctionListings = allValidAuctions?.filter((listing) => listing.tokenId === tokenId) ?? [];
      const directOffers = allValidOffers?.filter((offer) => offer.tokenId === tokenId) ?? [];

      return {
        tokenId: tokenId,
        listing: [...directListings, ...auctionListings],
        offers: directOffers,
      };
    });
  }, [tokenIds, allValidListings, allValidAuctions, allValidOffers]);

  const handleTabClick = (contract: NFTContract) => {
    setActiveContract(contract);
    setDetailedView(true);
    window.scrollTo(0, 0);
  };

  const handleThumbnailClick = (contract: NFTContract) => {
    setActiveContract(contract);
    setDetailedView(true);
    window.scrollTo(0, 0);
  };

  const currentIds = useMemo(() => {
    if (activeContract?.title === "Spunks") {
      return SpunksRankingNew.slice((page - 1) * nftsPerPage, page * nftsPerPage).map(item => item.spunk);
    } else {
      const startId = (page - 1) * nftsPerPage + 1;
      return Array.from({ length: nftsPerPage }, (_, i) => startId + i);
    }
  }, [page, nftsPerPage, activeContract]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d+$/.test(value)) {
      setSearch(value);
    } else {
      setSearch("");
    }
  };

  useEffect(() => {
    if (debouncedSearchTerm) {
      const id = parseInt(debouncedSearchTerm, 10);
      if (!isNaN(id)) {
        setSearchedId(id);
      } else {
        setSearchedId(null);
      }
    } else {
      setSearchedId(null);
    }
  }, [debouncedSearchTerm]);

  useEffect(() => {
    setIsSearching(!!searchedId);
  }, [searchedId]);

  const ownedTokenIds = useMemo(() => {
    if (activeContract) {
      return ownedNfts3[activeContract.address] || [];
    }
    return [];
  }, [activeContract, ownedNfts3]);

  // Calculate paginated owned NFTs
  const paginatedOwnedTokenIds = useMemo(() => {
    const start = (ownedPage - 1) * nftsPerPage;
    return ownedTokenIds.slice(start, start + nftsPerPage);
  }, [ownedPage, ownedTokenIds, nftsPerPage]);

  return (
    <div className="m-0 p-10 font-inter text-neutral-200">
      <Helmet>
        <title>NftGallery - {activeContract?.title}</title>
      </Helmet>
      <div className="flex justify-center gap-2 my-4" style={{ marginTop: '100px' }}>
        <Menu trigger="click" control={<Button>Choose Collection</Button>}>
          {NFT_CONTRACTS.map((contract, index) => (
            <Menu.Item key={index} onClick={() => handleTabClick(contract)}>
              <div className="flex items-center">
                {contract.title}
              </div>
            </Menu.Item>
          ))}
        </Menu>
        <Button onClick={() => setShowOwned(prev => !prev)}>
          {showOwned ? 'Show All NFTs' : 'Show Owned NFTs'}
        </Button>
      </div>
      <div className="m-0 p-0 font-inter text-neutral-200">
        {!detailedView ? (
          <div className="thumbnails grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {NFT_CONTRACTS.map((contract, index) => (
              <div key={index} className="thumbnail border rounded-lg p-4" onClick={() => handleThumbnailClick(contract)}>
                <MediaRenderer src={contract.thumbnailUrl} client={client} className="object-cover object-center w-full h-48" />
                <h3 className="mt-2 text-center">{contract.title}</h3>
              </div>
            ))}
          </div>
        ) : (
          <div className="details">
            {activeContract && (
              <>
                <h1>{activeContract.title}</h1>
                <MediaRenderer src={activeContract.thumbnailUrl} client={client} className="object-cover object-center w-full h-96" />
                <div className="socials flex justify-center mt-4">
                  {activeContract.twitter && activeContract.twitter !== "" && (
                    <a href={activeContract.twitter} target="_blank" rel="noopener noreferrer" className="mx-2">
                      <FaTwitter />
                    </a>
                  )}
                  {activeContract.telegram && activeContract.telegram !== "" && (
                    <a href={activeContract.telegram} target="_blank" rel="noopener noreferrer" className="mx-2">
                      <FaTelegram />
                    </a>
                  )}
                  {activeContract.explorer && activeContract.explorer !== "" && (
                    <a href={activeContract.explorer} target="_blank" rel="noopener noreferrer" className="mx-2">
                      <FaLink />
                    </a>
                  )}
                  {activeContract.website && activeContract.website !== "" && (
                    <a href={activeContract.website} target="_blank" rel="noopener noreferrer" className="mx-2">
                      <FaGlobe />
                    </a>
                  )}
                  {activeContract.discord && activeContract.discord !== "" && (
                    <a href={activeContract.discord} target="_blank" rel="noopener noreferrer" className="mx-2">
                      <FaDiscord />
                    </a>
                  )}
                </div>
                <p className="mt-4">{activeContract.description}</p>
                <Stats contractAddress={activeContract.address} />
                <button onClick={() => setDetailedView(false)} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded">Back to gallery</button>
              </>
            )}
          </div>
        )}
        {detailedView && (
          <div className="z-20 mx-auto flex min-h-screen w-full flex-col px-4">
            <div className="mx-auto mb-8 flex h-12 w-96 max-w-full items-center rounded-lg border border-white/10 bg-white/5 px-4 text-xl text-white">
              <SearchIcon />
              <input
                type="text"
                onChange={handleInputChange}
                placeholder="Search by ID"
                className="w-full bg-transparent px-4 text-white focus:outline-none"
              />
            </div>
            {activeContract?.address && searchedId ? (
              <div className="flex justify-center">
                <NFTCard
                  key={searchedId}
                  tokenId={BigInt(searchedId)}
                  contractAddresse={activeContract.address}
                  nft={nftData.find(nft => nft.tokenId === BigInt(searchedId)) || null}
                  refetchAllAuctions={refetchAllAuctions}
                  refetchAllListings={refetchAllListings}
                  refetchAllOffers={refetchAllOffers}
                />
              </div>
            ) : null}

            {isLoading ? (
              <div className="mx-auto flex flex-wrap items-center justify-center gap-8">
                {Array.from({ length: nftsPerPage }).map((_, i) => (
                  <div className="!h-60 !w-60 animate-pulse rounded-lg bg-gray-800" key={i} />
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-center gap-8">
                {(showOwned ? paginatedOwnedTokenIds : currentIds).map(id => (
                  activeContract?.address && (
                    <NFTCard
                      key={id}
                      tokenId={BigInt(id)}
                      contractAddresse={activeContract.address}
                      nft={nftData.find(nft => nft.tokenId === BigInt(id)) || null}
                      refetchAllAuctions={refetchAllAuctions}
                      refetchAllListings={refetchAllListings}
                      refetchAllOffers={refetchAllOffers}
                    />
                  )
                ))}
              </div>
            )}
            <div>
              {activeContract?.address && (showOwned ? (
                <PaginationHelperProfile contractAddress={activeContract.address} setPage={setOwnedPage} totalItems={ownedTokenIds.length} itemsPerPage={nftsPerPage} />
              ) : (
                <PaginationHelper contractAddress={activeContract.address} setPage={setPage} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlasmaWorld;
