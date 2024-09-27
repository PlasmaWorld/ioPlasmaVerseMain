"use client";
import React, { useState, useEffect, FC } from "react";
import { defineChain, getContract, resolveMethod, readContract, ThirdwebContract } from "thirdweb";
import client from "@/lib/client";
import axios from 'axios';
import { useActiveAccount, useNetworkSwitcherModal } from "thirdweb/react";
import { ChainList as FullChainList } from '@/const/ChainList';
import Service from "@/const/owneChainList";

interface Chain {
    name: string;
    id: number;
    blockExplorers?: {
      default?: {
        name: string;
        url: string;
      };
    };
  }
  
interface SocialUrl {
  name: string;
  url: string;
}

type ContractMetadata = {
  name: string;
  description: string;
  image: string;
  seller_fee_basis_points: number;
  fee_recipient: string;
  merkle: object;
  symbol: string;
  social_urls: Record<string, string>;
};
interface Contract {
    deployeraddress: string;
    contractAddress: string;
    chain: {
      id: number;
      rpc: string;
    };
    chainId: number;
    title: string;
    description: string;
    thumbnailUrl: string;
    explorer: string;
    type: string;
    typeBase: string;
    social_urls: Record<string, string>;
  }
  

const ImportContracts: FC = () => {
    const account = useActiveAccount();
    const [contracts, setContracts] = useState<Contract[]>([]);

  const [contractVersion, setContractVersion] = useState<string>("");
  const [contractOwner, setContractOwner] = useState<string>("");
  const [contractType, setContractType] = useState<string>("Unknown");
  const [royaltyRecipient, setRoyaltyRecipient] = useState<string>("");
  const [royaltyBps, setRoyaltyBps] = useState<string>("");
  const [contractAddress, setContractAddress] = useState<string>("");
  const networkSwitcher = useNetworkSwitcherModal();
  const [selectedChain, setSelectedChain] = useState<Chain | null>(null);
  const [modalOpened, setModalOpened] = useState<boolean>(false);
  const [name, setName] = useState<string>("");
  const [Symbol, setSymbol] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [contractMetadata, setContractMetadata] = useState<ContractMetadata>({
    name: "",
    description: "",
    image: "",
    seller_fee_basis_points: 1,
    fee_recipient: "0x0000000000000000000000000000000000000000",
    merkle: {},
    symbol: "",
    social_urls: {}
  });
  const [isLoading, setIsLoading] = useState(false);


  const handleReadcontractType = async () => {
    try {
      const result = await handleReadContract("contractType", []);
      if (typeof result === "string") {
        setContractType(determineContractType(result as string));
    } else {
        console.error("Unexpected result type:", result);
      }
    } catch (error) {
      console.error("Error reading owner:", error);
    }
  };

  const NETWORK = defineChain(selectedChain?.id || 4689);

  const handleSelectChain = (chain: Chain) => {
    setSelectedChain(chain);
    setModalOpened(false);
  };

  const handleClick = () => {
    networkSwitcher.open({
      client,
      theme: 'light',
      sections: [
        { label: 'Recently used', chains: [NETWORK] },
        { label: 'Popular', chains: [NETWORK] },
      ]
    });
  };

  const contract: ThirdwebContract = getContract({
    address: contractAddress,
    client,
    chain: NETWORK,
  });

  const handleReadContract = async (methodName: string, params: any[] = []) => {
    try {
      const resolvedMethod = await resolveMethod(methodName);
      if (!resolvedMethod) {
        throw new Error("Failed to resolve method");
      }
      const result = await readContract({
        contract,
        method: resolvedMethod,
        params,
      });

      console.log(`Result of ${methodName}:`, result);
      return result;
    } catch (error) {
      console.error(`Error reading contract for ${methodName}:`, error);
      throw error;
    }
  };

  

  const handleName = async () => {
    try {
      const result = await handleReadContract("namer", []);
      if (typeof result === "string") {
        setName(result);
      } else {
        console.error("Unexpected result type:", result);
      }
    } catch (error) {
      console.error("Error reading owner:", error);
    }
  };

  const handleDescripton = async () => {
    try {
      const result = await handleReadContract("namer", []);
      if (typeof result === "string") {
        setDescription(result);
      } else {
        console.error("Unexpected result type:", result);
      }
    } catch (error) {
      console.error("Error reading owner:", error);
    }
  };
  
  const handleSymbol = async () => {
    try {
      const result = await handleReadContract("Symbol", []);
      if (typeof result === "string") {
        setSymbol(result);
      } else {
        console.error("Unexpected result type:", result);
      }
    } catch (error) {
      console.error("Error reading owner:", error);
    }
  };

  useEffect(() => {
    
    handleName();
    
    
  }, [contractAddress, selectedChain?.id ])
  useEffect(() => {
    
    handleDescripton();
    
    
  }, [contractAddress, selectedChain?.id ])

  useEffect(() => {
    handleReadcontractType();
   
    
  }, [contractAddress, selectedChain?.id])



  useEffect(() => {
    
    handleSymbol();
    
    
  }, [contractAddress, selectedChain?.id ])

  

  

  const determineContractType = (typeHex: string): string => {
    switch (typeHex) {
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
        return "Unknown";
    }
  };


  const handleReadContractURITest = async () => {
    try {
      const result = await handleReadContract("contractURI", []) as unknown;
      
      // Detailed logging of result
      console.log("Raw result from handleReadContract:", result);
      
      // Ensure metadataUri is a string and correctly formatted
      if (typeof result === 'string' && result.startsWith("ipfs://")) {
        const gatewayUrl = result.replace("ipfs://", "https://ipfs.io/ipfs/");
        console.log("Fetching metadata from IPFS URL:", gatewayUrl);
  
        try {
          const response = await axios.get(gatewayUrl);
          
          // Logging the response status and data
          console.log("HTTP response status:", response.status);
          console.log("HTTP response data:", response.data);
          
          if (response.status !== 200) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
  
          const metadata = response.data;
          
          // Logging the fetched metadata
          console.log("Fetched metadata:", metadata);
  
          setContractMetadata({
            name: metadata.name,
            description: metadata.description,
            image: metadata.image,
            seller_fee_basis_points: metadata.seller_fee_basis_points,
            fee_recipient: metadata.fee_recipient,
            merkle: metadata.merkle,
            symbol: metadata.symbol,
            social_urls: metadata.social_urls || []            });
        } catch (fetchError) {
          console.error("Error fetching metadata:", fetchError);
        }
      } else {
        console.error("Invalid metadata URI:", result);
      }
    } catch (error) {
      console.error("Error fetching metadata:", error);
    }
  };

  useEffect(() => {
    if (contractAddress && selectedChain) {
        handleReadContractURITest();
    }
  }, [contractAddress, selectedChain]);

  const handleSaveContract = async () => {
    setIsLoading(true); // Start loading

    const blockExplorerUrl = selectedChain?.blockExplorers?.default?.url || 'https://default-explorer.com';
    
    const contractData = {
      deployerAddress: account?.address || "",
      contractAddress: contractAddress,
      chain: selectedChain?.name || "Unknown",
      chainId: selectedChain?.id || 0,
      title: contractMetadata.name || name,
      description: contractMetadata.description || description,
      thumbnailUrl: contractMetadata.image || "",
      explorer: `${blockExplorerUrl}/${contractAddress}`,
      type: contractType,
      typeBase: contractType,
      social_urls: contractMetadata.social_urls,
    };
  
    console.log("Contract data to be saved:", contractData); // Debugging log
  
    try {
      const response = await fetch('/api/saveContract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contractData),
      });
  
      console.log("API response status:", response.status); // Debugging log
  
      if (!response.ok) {
        throw new Error(`Failed to save contract. Status code: ${response.status}`);
      }
      alert(`Contract saved successfully!:${contractAddress}`);
      window.location.reload();

      console.log("Contract saved successfully");
    } catch (error) {
      console.error("Error saving contract:", error);
    }
  };
  

  return (
    <div className="overflow-y-scroll max-h-screen p-4">
      <div className="border border-gray-300 p-4 rounded-lg">
        <h1>Import Contract</h1>
        <div>
          <input
            type="text"
            value={contractAddress}
            onChange={(e) => setContractAddress(e.target.value)}
            placeholder="Contract Address"
            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
  
        <button className="mt-4 p-2 border border-gray-300 rounded-lg hover:bg-gray-100" onClick={() => setModalOpened(true)}>
          Select Chain
        </button>
  
        {modalOpened && (
          <Service onSelectChain={handleSelectChain} onClose={() => setModalOpened(false)} />
        )}
  
        {selectedChain && (
          <div className="mt-4">
            <p>Selected Chain: {selectedChain.name}</p>
          </div>
        )}
  
        <button
        className={`mt-4 p-2 border border-gray-300 rounded-lg hover:bg-gray-100 ${isLoading ? 'cursor-not-allowed opacity-50' : ''}`}
        onClick={handleSaveContract}
        disabled={isLoading} // Disable button when loading
        >
        {isLoading ? 'Saving...' : 'Save Contract'}
        </button>
        {isLoading && (
  <div className="mt-4 flex justify-center">
    <div className="loader ease-linear rounded-full border-4 border-t-4 border-gray-200 h-6 w-6"></div>
  </div>
)}

      </div>
    </div>
  );  
};

export default ImportContracts;