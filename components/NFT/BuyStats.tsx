"use client";

import React, { FC, useEffect, useState, useMemo } from "react";
import toast from "react-hot-toast";
import toastStyle from "@/util/toastConfig";
import { fetchTotalSupplys } from "@/utils/fetchTotalSupplys"; // Import the function to fetch contract data
import { defineChain, getContract } from "thirdweb";
import client from "@/lib/client";

const defaultTotalSupplies: Record<string, number> = {
  '0x8aa9271665e480f0866d2F61FC436B96BF9584AD': 837,
  '0xe1Bb99ed442ce6c6ad3806C3afcbd8f7733841A7': 1000,
  '0xaa5314f9ee6a6711e5284508fec7f40e85969ed6': 1000,
  '0x0689021f9065b18c710f5204e41b3d20c3b7d362': 1000,
  '0x8cfE8bAeE219514bE529407207fCe9C612E705fD': 1000,
  '0x778E131aA8260C1FF78007cAde5e64820744F320': 202,
  '0xc52121470851d0cba233c963fcbb23f753eb8709': 601,
  '0x7D150D3eb3aD7aB752dF259c94A8aB98d700FC00': 10000,
  '0x9756E951dd76e933e34434Db4Ed38964951E588b': 100000,
  '0x7f8Cb1d827F26434da652B4E9Bd02C698cC2842a': 528,
  '0xDFBbEbA6D17b0d49861aB7f26CdA495046314370': 1000,
  '0xAf1B5063A152550aebc8d6cB0dA6936288EAb3dc': 347,
  '0x0c5AB026d74C451376A4798342a685a0e99a5bEe': 10000,
  '0xce300b00aa9c066786D609Fc96529DBedAa30B76': 10000,
};

interface ContractData {
  totalSupply: number;
  validTotalSupply: number;
  uniqueOwners: number;
  chainId: number;

}

const Stats: FC<{ contractAddress: string, events:any }> = ({ contractAddress, events }) => {
  const [contractData, setContractData] = useState<Record<string, ContractData>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [totalVolume, setTotalVolume] = useState<number>(0);
  const [marketplaceVolumes, setMarketplaceVolumes] = useState<Record<string, number>>({});
  const [currentMarketplace, setCurrentMarketplace] = useState<string | null>(null);

  const [loadingEvents, setLoadingEvents] = useState<boolean>(true); // New loading state


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
  

  const fetchContractData = async () => {
    setLoading(true);
    setError(null);
  
    try {
      const response = await fetch('/api/fetchData');
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data: Record<string, any>[] = await response.json();
      console.log('Fetched contract data:', data);
  
      const formattedData = data.reduce((acc, item) => {
        acc[item.contract_address] = {
          totalSupply: item.total_supply,
          validTotalSupply: item.valid_total_supply,
          uniqueOwners: item.unique_owners,
          chainId: item.chain_id,
        };
        return acc;
      }, {} as Record<string, ContractData>);
  
      setContractData(formattedData);
    } catch (error) {
      console.error('Error fetching contract data:', error);
      setError('Something went wrong while fetching your NFTs!');
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
  };

  
  

  const NETWORK = defineChain(4689);

  
  const contract = getContract({
    address: contractAddress || "",
    client,
    chain: NETWORK,
  });

  const SafeContractData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch the latest data for the contract
      const data = await fetchTotalSupplys(contract.address, 4689);
      if (!data) {
        throw new Error('Failed to fetch contract data');
      }


      // Update the data on the server for this specific contract address
      const response = await fetch('/api/saveData', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ [contractAddress]: data }),
      });

      if (!response.ok) {
        throw new Error('Failed to update contract stats');
      }

      const result = await response.json();
      console.log('Updated contract stats:', result);

    } catch (error) {
      console.error('Error fetching or updating contract stats:', error);
      setError('Something went wrong while fetching or updating the contract stats!');
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
  };

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


  useEffect(() => {
    fetchContractData();
  }, [contractAddress]);

  useEffect(() => {
    SafeContractData();
  }, [contractAddress]);
  

  const contractInfo = contractData[contractAddress] || {};
  const memoizedTotalSupply = useMemo(() => contractInfo.totalSupply ?? defaultTotalSupplies[contractAddress], [contractInfo.totalSupply, contractAddress]);
  const memoizedUniqueOwners = useMemo(() => contractInfo.uniqueOwners ?? null, [contractInfo.uniqueOwners]);
  const memoizedValidTotalSupply = useMemo(() => contractInfo.validTotalSupply ?? null, [contractInfo.validTotalSupply]);

 


  return (
    <div className="pt-24 pb-32 overflow-x-auto">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between">
          <div className="flex-shrink-0 flex flex-col items-center justify-center bg-zinc-800 border border-sky-500 border-opacity-30 hover:bg-sky-700 transition duration-150 w-40 h-40 rounded-full text-white">
            <h1 className="text-3xl font-bold mt-2">
              {memoizedValidTotalSupply !== null ? memoizedValidTotalSupply : "N/A"}
            </h1>
            <p className="font-thin mt-2">Valid Total Supply</p>
          </div>

          <div className="flex-shrink-0 flex flex-col items-center justify-center bg-zinc-800 border border-sky-500 border-opacity-30 hover:bg-sky-700 transition duration-150 w-40 h-40 rounded-full text-white">
            <h1 className="text-3xl font-bold mt-2">
              {memoizedUniqueOwners !== null ? memoizedUniqueOwners : "N/A"}
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

export default Stats;
