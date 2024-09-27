"use client";

import React, { FC, useEffect, useState, useMemo } from "react";
import { defineChain, getContract, readContract, resolveMethod, ThirdwebContract } from "thirdweb";
import { totalSupply } from "thirdweb/extensions/erc721";
import { useReadContract } from "thirdweb/react";
import client from "@/lib/client";

interface ContractData {
  totalSupply: number;
  validTotalSupply: number;
  uniqueOwners: number;
}

const DefaultStats: FC<{ contractAddress: string, chainId: number, events: any }> = ({ contractAddress, chainId, events }) => {
  const [contractData, setContractData] = useState<ContractData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const NETWORK = defineChain(chainId); // Use chainIdNumber here
  const [totalVolume, setTotalVolume] = useState<number>(0);
  const [loadingEvents, setLoadingEvents] = useState<boolean>(true); // New loading state
  const [currentMarketplace, setCurrentMarketplace] = useState<string | null>(null);
  const [marketplaceVolumes, setMarketplaceVolumes] = useState<Record<string, number>>({});

  const calculateMarketplaceVolumes = () => {
    console.log("Calculating marketplace volumes from events...");
  
    const saleEvents = events.filter((event: any) => 
      event.event_name === "Sale" && event.price.includes("Iotex")
    );
  
    const volumes: Record<string, number> = {};
  
    saleEvents.forEach((event: any) => {
      const marketplace = event.marketplace;
      const priceString = event.price;
      const priceNumber = parseFloat(priceString.split(' ')[0]); // Extract the numeric part
  
      if (!isNaN(priceNumber)) {
        if (!volumes[marketplace]) {
          volumes[marketplace] = 0;
        }
        volumes[marketplace] += priceNumber;
      }
    });
  
    console.log("Marketplace volumes calculated:", volumes);
    setMarketplaceVolumes(volumes);
  };
  useEffect(() => {
    if (events.length === 0) {
      console.log("Events not yet available. Waiting...");
      setLoadingEvents(true);
    } else {
      setLoadingEvents(false);
      calculateTotalVolume();
      calculateMarketplaceVolumes(); // Add this line

    }
  }, [events]);

  const calculateTotalVolume = () => {
    console.log("Calculating total volume from events...");
    
    // Filter Sale events and check if the price includes "Iotex"
    const saleEvents = events.filter((event: any) => 
      event.event_name === "Sale" && event.price.includes("Iotex")
    );
    
    console.log("Filtered Sale events:", saleEvents);
  
    const total = saleEvents.reduce((acc: number, event: any) => {
      const priceString = event.price; // Assuming 'price' is the field in your event data
      const priceNumber = parseFloat(priceString.split(' ')[0]); // Extract the numeric part
      console.log(`Processing event: ${JSON.stringify(event)}, Price string: ${priceString}, Price number: ${priceNumber}`);
  
      return acc + (isNaN(priceNumber) ? 0 : priceNumber);
    }, 0);
  
    console.log("Total volume calculated:", total);
    setTotalVolume(total);
  };
  

  const contract = useMemo(() => getContract({
    address: contractAddress,
    client,
    chain: NETWORK,
  }), [contractAddress]);

  const {
    data: totalSupplyContract,
    isLoading: isContractMetadataLoading,
    refetch: refetchContractMetadata,
  } = useReadContract(totalSupply, {
    contract: contract,
  });

  const fetchTotalSupplys = async (contract: ThirdwebContract, totalIds: number, batchSize: number) => {
    if (!contract) return null;

    const ownedIds: number[] = [];
    const uniqueOwnersSet = new Set<string>();
    let nonexistentCount = 0;

    const fetchBatch = async (start: number, end: number) => {
      const promises = [];
      for (let i = start; i < end; i++) {
        const promise = readContract({
          contract: contract,
          method: resolveMethod("ownerOf"),
          params: [i]
        }).catch((err) => {
          if (err.message.includes('nonexistent token')) {
            nonexistentCount++;
          } else {
            console.error(`Error fetching owner of token ${i}:`, err);
          }
          return null;
        });
        promises.push(promise);
      }
      const results = await Promise.allSettled(promises);

      results.forEach((result, index) => {
        const nftId = start + index;
        if (
          result.status === "fulfilled" &&
          typeof result.value === "string" &&
          result.value !== "0x000000000000000000000000000000000000dEaD"
        ) {
          ownedIds.push(nftId);
          uniqueOwnersSet.add(result.value);
        }
      });
    };

    for (let i = 0; i < totalIds; i += batchSize) {
      await fetchBatch(i, Math.min(i + batchSize, totalIds));
    }

    console.log(`Fetched data for contract: ${contract.address}, ownedIds: ${ownedIds.length}, uniqueOwners: ${uniqueOwnersSet.size}`);

    return {
      totalSupply: totalIds,
      validTotalSupply: ownedIds.length,
      uniqueOwners: uniqueOwnersSet.size,
    };
  };

  
  const fetchContractData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (totalSupplyContract !== undefined) {
        const totalIds = Number(totalSupplyContract); // Convert bigint to number
        const data = await fetchTotalSupplys(contract, totalIds + 1 , 100); // Adjust batchSize as needed
        if (data) {
          setContractData(data);
        }
      }
    } catch (error) {
      console.error("Failed to fetch contract data:", error);
      setError("Failed to fetch contract data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (contractAddress && totalSupplyContract !== undefined) {
      fetchContractData();
    }
  }, [contractAddress, totalSupplyContract]);

  const handlePreviousMarketplace = () => {
    const marketplaces = Object.keys(marketplaceVolumes);
    const currentIndex = currentMarketplace ? marketplaces.indexOf(currentMarketplace) : -1;
    const nextIndex = (currentIndex - 1 + marketplaces.length) % marketplaces.length;
    setCurrentMarketplace(marketplaces[nextIndex]);
  };
  
  const handleNextMarketplace = () => {
    const marketplaces = Object.keys(marketplaceVolumes);
    const currentIndex = currentMarketplace ? marketplaces.indexOf(currentMarketplace) : -1;
    const nextIndex = (currentIndex + 1) % marketplaces.length;
    setCurrentMarketplace(marketplaces[nextIndex]);
  };
  
  const currentMarketplaceVolume = currentMarketplace ? marketplaceVolumes[currentMarketplace] : 0;

  const memoizedTotalSupply = useMemo(() => contractData?.totalSupply ?? 0, [contractData]);
  const memoizedUniqueOwners = useMemo(() => contractData?.uniqueOwners ?? 0, [contractData]);
  const memoizedValidTotalSupply = useMemo(() => contractData?.validTotalSupply ?? 0, [contractData]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="pt-24 pb-32 overflow-x-auto">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between">
          <div className="flex-shrink-0 flex flex-col items-center justify-center bg-zinc-800 border border-sky-500 border-opacity-30 hover:bg-sky-700 transition duration-150 w-40 h-40 rounded-full text-white">
            <h1 className="text-3xl font-bold mt-2">
              {memoizedValidTotalSupply !== 0 ? memoizedValidTotalSupply : "N/A"}
            </h1>
            <p className="font-thin mt-2">Valid Total Supply</p>
          </div>

          <div className="flex-shrink-0 flex flex-col items-center justify-center bg-zinc-800 border border-sky-500 border-opacity-30 hover:bg-sky-700 transition duration-150 w-40 h-40 rounded-full text-white">
            <h1 className="text-3xl font-bold mt-2">
              {memoizedUniqueOwners !== 0 ? memoizedUniqueOwners : "N/A"}
            </h1>
            <p className="font-thin mt-2">Unique Owners</p>
          </div>
          <div className="flex flex-wrap justify-between mt-6">
            <div className="flex-shrink-0 flex flex-col items-center justify-center bg-zinc-800 border border-sky-500 border-opacity-30 hover:bg-sky-700 transition duration-150 w-40 h-40 rounded-full text-white">
              <h1 className="text-3xl font-bold mt-2">{Math.floor(currentMarketplaceVolume)} Iotex</h1>
              <p className="font-thin mt-2">{currentMarketplace || "Select a Marketplace"}</p>
              <div className="flex mt-2">
                <button onClick={handlePreviousMarketplace} className="text-white mr-2">&lt;</button>
                <button onClick={handleNextMarketplace} className="text-white">&gt;</button>
              </div>
            </div>
          </div>

          <div className="flex-shrink-0 flex flex-col items-center justify-center bg-zinc-800 border border-sky-500 border-opacity-30 hover:bg-sky-700 transition duration-150 w-40 h-40 rounded-full text-white">
          <h1 className="text-3xl font-bold mt-2">{Math.floor(totalVolume)} Iotex</h1>
          <p className="font-thin mt-2">total Volume</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DefaultStats;
