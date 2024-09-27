"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import toast from "react-hot-toast";
import toastStyle from "@/util/toastConfig";
import { ThirdwebContract, readContract, resolveMethod } from 'thirdweb';
import {
  WebStreamContract,
  SpunksContract,
  RobotAiContract,
  LoxodromeContract,
  MimoSpaceContract,
  MimoPipiContract,
  MimoAlbieContract,
  MimoBimbyContract,
  MimoGizyContract,
  BuzzBotsContract,
  MachinFiContract,
  SumoContractContract,
  IotexPunksContract,
  XSumoContract,
  StarCrazyContract,
} from '@/const/contracts';
import { useActiveAccount } from "thirdweb/react";

const contractsMap: Record<string, { contract: ThirdwebContract, totalSupply: number }> = {
  '0x8aa9271665e480f0866d2F61FC436B96BF9584AD': { contract: WebStreamContract, totalSupply: 837 },
  '0xe1Bb99ed442ce6c6ad3806C3afcbd8f7733841A7': { contract: MimoPipiContract, totalSupply: 1001 },
  '0xaa5314f9ee6a6711e5284508fec7f40e85969ed6': { contract: MimoBimbyContract, totalSupply: 1001 },
  '0x0689021f9065b18c710f5204e41b3d20c3b7d362': { contract: MimoGizyContract, totalSupply: 1001 },
  '0x8cfE8bAeE219514bE529407207fCe9C612E705fD': { contract: MimoAlbieContract, totalSupply: 1001 },
  '0x778E131aA8260C1FF78007cAde5e64820744F320': { contract: MimoSpaceContract, totalSupply: 203 },
  '0xc52121470851d0cba233c963fcbb23f753eb8709': { contract: SpunksContract, totalSupply: 777 },
  '0x9756E951dd76e933e34434Db4Ed38964951E588b': { contract: SumoContractContract, totalSupply: 6500 },
  '0x7f8Cb1d827F26434da652b4e9bd02c698cc2842a': { contract: LoxodromeContract, totalSupply: 1000 },
  '0xDFBbEbA6D17b0d49861aB7f26CdA495046314370': { contract: BuzzBotsContract, totalSupply: 1001 },
  '0xAf1B5063A152550aebc8d6cB0dA6936288EAb3dc': { contract: RobotAiContract, totalSupply: 1000 },
  '0x0c5AB026d74C451376A4798342a685a0e99a5bEe': { contract: MachinFiContract, totalSupply: 10001 },
  '0xce300b00aa9c066786D609Fc96529DBedAa30B76': { contract: IotexPunksContract, totalSupply: 10001 },
  '0x7D150D3eb3aD7aB752dF259c94A8aB98d700FC00': { contract: XSumoContract, totalSupply: 3442 },

};

interface ContractData {
  chainId: number;
  totalSupply: number;
  validTotalSupply: number;
  uniqueOwners: number;
}

interface ContractDataContextProps {
  contractData: Record<string, ContractData>;
  loading: boolean;
}

interface ContractDataProviderProps {
  children: ReactNode;
}

const ContractDataContext = createContext<ContractDataContextProps | undefined>(undefined);

export const ContractDataProvider: React.FC<ContractDataProviderProps> = ({ children }) => {
  const [contractData, setContractData] = useState<Record<string, ContractData>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const account = useActiveAccount();
  const chainId = 4689;
  
  const fetchContractData = async () => {
    setLoading(true);
    try {
      const contractData: Record<string, ContractData> = {};
  
      for (const [address, { contract, totalSupply }] of Object.entries(contractsMap)) {
        const data = await fetchTotalSupplys(contract, totalSupply, 50); // Adjust batchSize as needed
        if (data) {
          contractData[address] = data;
  
          // Send data to the API route to save/update it for each contract
          const response = await fetch('/api/saveData', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ [address]: data }), // Send only the current contract data
          });
  
          if (!response.ok) {
            throw new Error(`Failed to save data for contract ${address}`);
          }
  
          const result = await response.json();
          console.log(`Save data result for ${address}:`, result);
        }
      }
  
      setContractData(contractData);
  
    } catch (error) {
      console.error('Error fetching or saving contract data:', error);
      toast.error('Something went wrong while fetching your NFTs!', {
        position: 'bottom-center',
        style: toastStyle,
      });
    } finally {
      setLoading(false);
    }
  };
  

  useEffect(() => {
    if (account && account.address === "x0x515D1BcEf9536075CC6ECe0ff21eCCa044Db9446") {
      fetchContractData();
    }
  }, [account]);
  

  return (
    <ContractDataContext.Provider value={{ contractData, loading }}>
      {children}
    </ContractDataContext.Provider>
  );
};

export const useContractData = () => {
  const context = useContext(ContractDataContext);
  if (!context) {
    throw new Error('useContractData must be used within a ContractDataProvider');
  }
  return context;
};

// Function to fetch total supplies
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
    chainId: 4689,

  };
};
