"use client";

import React, { FC, useEffect, useState, useMemo } from "react";
import toast from "react-hot-toast";
import toastStyle from "@/util/toastConfig";

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
}

const Stats: FC<{ contractAddress: string }> = ({ contractAddress }) => {
  const [contractData, setContractData] = useState<Record<string, ContractData>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContractData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/fetchData');
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      console.log('Fetched contract data:', data); // Debugging line
      setContractData(data);
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

  useEffect(() => {
    fetchContractData();
  }, []);

  const contractInfo = contractData[contractAddress] || {};
  const memoizedTotalSupply = useMemo(() => contractInfo.totalSupply ?? defaultTotalSupplies[contractAddress], [contractInfo.totalSupply, contractAddress]);
  const memoizedUniqueOwners = useMemo(() => contractInfo.uniqueOwners ?? null, [contractInfo.uniqueOwners]);
  const memoizedValidTotalSupply = useMemo(() => contractInfo.validTotalSupply ?? null, [contractInfo.validTotalSupply]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  console.log('Contract Info:', contractInfo); // Debugging line

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

          <div className="flex-shrink-0 flex flex-col items-center justify-center bg-zinc-800 border border-sky-500 border-opacity-30 hover:bg-sky-700 transition duration-150 w-40 h-40 rounded-full text-white">
            <h1 className="text-3xl font-bold mt-2">coming soon</h1>
            <p className="font-thin mt-2">floor Price</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Stats;
