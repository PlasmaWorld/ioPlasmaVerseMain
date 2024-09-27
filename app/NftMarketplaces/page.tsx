"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Menu, Modal } from '@mantine/core';
import { NFT_CONTRACTS } from '@/const/nft.contracts';
import { MediaRenderer, useReadContract } from 'thirdweb/react';
import client from '@/lib/client';
import { defineChain, getContract } from 'thirdweb';
import { getContractMetadata } from 'thirdweb/extensions/common';
import { ChainList as FullChainList } from '@/const/ChainList';

// Define a simple Chain interface
interface Chain {
  name: string;
  chainId: number;
}

// Extract only name and chainId
const extractChainList = (): Chain[] => {
  return FullChainList.map(chain => ({
    name: chain.name,
    chainId: chain.chainId
  }));
}

// Get the simplified chain list
const ChainList: Chain[] = extractChainList();

// Define a default chainId
const DEFAULT_CHAIN_ID = 4689; // You can set this to any default chainId you prefer

interface FetchedContract {
  address: string;
  name: string;
}

const NftCollection: React.FC = () => {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState<string>("");
  const [contractAddress, setContractAddress] = useState<string>("");
  const [modalOpened, setModalOpened] = useState<boolean>(false);
  const [selectedChain, setSelectedChain] = useState<Chain | null>(null);
  const [fetchedContract, setFetchedContract] = useState<FetchedContract | null>(null);
  const [filterInput, setFilterInput] = useState<string>("");

  // Use selectedChain or default to DEFAULT_CHAIN_ID
  const NETWORK = defineChain(selectedChain ? selectedChain.chainId : DEFAULT_CHAIN_ID);

  const contract = getContract({
    address: contractAddress,
    client,
    chain: NETWORK,
  });

  const {
    data: contractMetadata,
    isLoading: isContractMetadataLoading,
    refetch: refetchContractMetadata,
  } = useReadContract(getContractMetadata, {
    contract: contract,
  });

  useEffect(() => {
    if (contractMetadata && contractAddress && selectedChain) {
      setFetchedContract({
        address: contractAddress,
        name: contractMetadata.name,
      });

      // Redirect to the new page with the fetched contract address
    }
  }, [contractMetadata, contractAddress, selectedChain, router]);

  const handleSearchwithChain = () => {
    if (!selectedChain || !contractAddress) return;

    router.push(`/NftGalerie/${selectedChain.chainId}/${contractAddress}`);
  };

  const filteredChains = ChainList.filter(chain =>
    chain.chainId.toString().startsWith(filterInput)
  );

  return (
    <div className="m-0 font-inter text-neutral-200">
      <div className="flex justify-center gap-2 my-4" style={{ marginTop: '100px' }}>
      </div>
      <h2>Select a connected Marketplace</h2>
      
      <div className="flex justify-center gap-2 my-4">
      </div>
      <div className="m-0 p-0 font-inter text-neutral-200">
        <div className="thumbnails grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {NFT_CONTRACTS.map((contract, index) => (
            <div key={index} className="thumbnail border rounded-lg p-4" onClick={() => router.push(`/NftGalerie/${contract.chainId}/${contract.address}`)}>
              <MediaRenderer src={contract.thumbnailUrl} client={client} className="object-cover object-center w-full h-48" />
              <h3 className="mt-2 text-center">{contract.title}</h3>
            </div>
          ))}
        </div>
      </div>
      <Modal
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        title="Select Chain"
        styles={{ modal: { marginTop: '50px' } }} // Inline styles for padding from the top
      >
        <div className="p-4">
          <input
            type="text"
            placeholder="Enter Chain ID"
            value={filterInput}
            onChange={(e) => setFilterInput(e.target.value)}
            className="p-2 border rounded-lg mb-4 w-full"
          />
          <div className="chain-list-container" style={{ maxHeight: '200px', overflowY: 'scroll' }}>
            {filteredChains.map((chain, index) => (
              <div key={index} className="chain-item border rounded-lg p-2 mb-2" onClick={() => {
                setSelectedChain(chain);
                setModalOpened(false);
              }}>
                <div className="flex justify-between">
                  <span>{chain.name}</span>
                  <span>{chain.chainId}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default NftCollection;
