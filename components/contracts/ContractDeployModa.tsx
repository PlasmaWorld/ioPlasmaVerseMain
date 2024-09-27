"use client";

import React, { FC, useState, ChangeEvent, useEffect } from "react";
import { defineChain, prepareTransaction, encode, getContract, readContract, resolveMethod } from "thirdweb";
import { useActiveAccount, MediaRenderer, useActiveWalletChain, useSwitchActiveWalletChain, useNetworkSwitcherModal, TransactionButton } from "thirdweb/react";
import client from "@/lib/client";
import styles from './deployModal.module.css';
import { deployERC1155Contract, deployERC20Contract, deployERC721Contract, DeployERC721ContractOptions } from "thirdweb/deploys";
import { upload } from "thirdweb/storage";
import { ChainList as FullChainList } from '@/const/ChainList';
import { Button, Modal } from "@mantine/core";
import  Service  from "@/const/owneChainList";
import { TransactionReceipt } from "thirdweb/src/transaction/types";
import { prepareEvent, getContractEvents } from "thirdweb";
import { fetchAndSaveContractDetails } from "./saveDeployedContract";
import axios from "axios";


interface EventDetails {
  contractAddress: string;
  deployer: string;
  chainId: number;
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

type ContractType = "DropERC721" | "TokenERC721" | "OpenEditionERC721" | "DropERC1155" | "TokenERC1155" | "TokenERC20" | "DropERC20";



// Get the simplified chain list
interface SocialUrl {
  name: string;
  url: string;
}

const DeployContract: FC<{ name: string; onClose: () => void, version: string }> = ({ name,version, onClose }) => {
  const account = useActiveAccount();
  const [modalOpened, setModalOpened] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(false);
  const [events, setEvents] = useState<EventDetails[]>([]);

  const [functionInputs, setFunctionInputs] = useState<{ [key: string]: any }>({});
  const [transactionError, setTransactionError] = useState<string | null>(null);
  const [output, setOutput] = useState<any>(null);
  const [image, setImage] = useState<any>(null);
  const [chainId, setChainId] = useState(4689);
  const [RpcDeploy, setRpc] = useState(4689);
  
  const [filterInput, setFilterInput] = useState<string>("");
  const switchChain = useSwitchActiveWalletChain();
  const activeChain = useActiveWalletChain();
  const NETWORK = defineChain(chainId);
  const chainrpc = NETWORK;
const [contractType, setContractType] = useState<string>("Unknown");
const [contractAddress, setContractAddress] = useState<string>("");
const networkSwitcher = useNetworkSwitcherModal();
const [selectedChain, setSelectedChain] = useState<Chain | null>(null);
const [contractName, setName] = useState<string>("");
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

const contract = getContract({
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
    title: contractMetadata.name || contractName,
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
    alert(`Contract saved successfully!:${response.status}`);
    window.location.reload();

    console.log("Contract saved successfully");
  } catch (error) {
    console.error("Error saving contract:", error);
  }
};

 
  useEffect(() => {
    if (activeChain) {
      console.log('Active Chain:', activeChain);
    }
  }, [activeChain]);
  const [social_urls, setSocialUrls] = useState<SocialUrl[]>([
    { name: "telegram", url: "" },
    { name: "discord", url: "" },
    { name: "x", url: "" },
    { name: "website", url: "" }
  ]);

  const handleFileChangeContract = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const newFile = new File([file], file.name);
        const uri = await upload({
          client,
          files: [newFile],
        });

        if (!uri || uri.length === 0) {
          throw new Error("Failed to upload metadata to IPFS");
        }

        const ipfsUrl = `${uri}`;
        setImage(ipfsUrl);
        console.log("NewFile Data, ", ipfsUrl);
      } catch (error) {
        console.error("Error uploading file:", error);
      }
    }
  };

  // Function to convert percentage to basis points (bps)
  const convertToBasisPoints = (percentage: number): bigint => {
    return BigInt(Math.round(percentage * 100));
  };

  const handleSocialUrlChange = (index: number, value: string) => {
    const updatedSocialUrls = [...social_urls];
    updatedSocialUrls[index].url = value;
    setSocialUrls(updatedSocialUrls);
  };

  const renderInputFields = () => {
    return (
      <div>
        <div className={styles.field}>
          <label>Name*</label>
          <input
            type="text"
            value={functionInputs.name || ''}
            onChange={(e) => setFunctionInputs({ ...functionInputs, name: e.target.value })}
            placeholder="Contract Name"
            className={styles.input}
          />
          <p className={styles.description}>
            The name of the contract.
          </p>
        </div>

        <div className={styles.field}>
          <label>Description*</label>
          <input
            type="text"
            value={functionInputs.description || ''}
            onChange={(e) => setFunctionInputs({ ...functionInputs, description: e.target.value })}
            placeholder="Contract Description"
            className={styles.input}
          />
          <p className={styles.description}>
            A brief description of the contract.
          </p>
        </div>

        <div className={styles.field}>
          <label>Symbol*</label>
          <input
            type="text"
            value={functionInputs.symbol || ''}
            onChange={(e) => setFunctionInputs({ ...functionInputs, symbol: e.target.value })}
            placeholder="Symbol"
            className={styles.input}
          />
          <p className={styles.description}>
          <p>The symbol of the contract (e.g., &quot;NFT&quot;, &quot;ERC20&quot;).</p>
          </p>
        </div>

        <div className={styles.field}>
          <label>Primary Sales</label>
          <input
            type="text"
            value={functionInputs.saleRecipient || ''}
            onChange={(e) => setFunctionInputs({ ...functionInputs, saleRecipient: e.target.value })}
            placeholder="Recipient Address*"
            className={styles.input}
          />
          <p className={styles.description}>
            The wallet address that should receive the revenue from initial sales of the assets.
          </p>
        </div>
        
        <div className={styles.field}>
          <label>Royalties</label>
          <input
            type="text"
            value={functionInputs.royaltyRecipient || ''}
            onChange={(e) => setFunctionInputs({ ...functionInputs, royaltyRecipient: e.target.value })}
            placeholder="Recipient Address*"
            className={styles.input}
          />
          <p className={styles.description}>
            The wallet address that should receive the revenue from royalties earned from secondary sales of the assets.
          </p>
        </div>

        <div className={styles.field}>
          <label>Percentage*</label>
          <input
            type="number"
            value={functionInputs.royaltyBps || ''}
            onChange={(e) => setFunctionInputs({ ...functionInputs, royaltyBps: e.target.value })}
            placeholder="0.00"
            className={styles.input}
          />
          <p className={styles.description}>Enter the percentage of royalties. This will be converted to basis points (1% = 100 bps).</p>
        </div>

        <div className={styles.field}>
          <label>Platform Fees</label>
          <input
            type="text"
            value={functionInputs.platformFeeRecipient || ''}
            onChange={(e) => setFunctionInputs({ ...functionInputs, platformFeeRecipient: e.target.value })}
            placeholder="Recipient Address*"
            className={styles.input}
          />
          <p className={styles.description}>
            For contracts with primary sales, get additional fees for all primary sales that happen on this contract. (This is useful if you are deploying this contract for a 3rd party and want to take fees for your service). If this contract is a marketplace, get a percentage of all the secondary sales that happen on your contract.
          </p>
        </div>

        <div className={styles.field}>
          <label>Platform Fee Percentage*</label>
          <input
            type="number"
            value={functionInputs.platformFeeBps || ''}
            onChange={(e) => setFunctionInputs({ ...functionInputs, platformFeeBps: e.target.value })}
            placeholder="0.00"
            className={styles.input}
          />
          <p className={styles.description}>Enter the percentage of platform fees. This will be converted to basis points (1% = 100 bps).</p>
        </div>

        <div className={styles.field}>
          <label>Social URLs</label>
          {social_urls.map((social, index) => (
            <input
              key={social.name}
              type="text"
              value={social.url}
              onChange={(e) => handleSocialUrlChange(index, e.target.value)}
              placeholder={`${social.name.charAt(0).toUpperCase() + social.name.slice(1)} URL`}
              className={styles.input}
            />
          ))}
          <p className={styles.description}>Provide links to your social media profiles (e.g., Telegram, Discord, X, Website).</p>
        </div>
      </div>
    );
  };
  const socialUrlsObject: SocialUrl = social_urls.reduce((acc, { name, url }) => {
    acc[name as keyof SocialUrl] = url;
    return acc;
  }, {} as SocialUrl);

  const handleRunDeployContract = async (contractType: ContractType) => {
    setIsLoading(true); // Start loading

    if (!account) throw new Error("Account not connected");
    const blockExplorerUrl = selectedChain?.blockExplorers?.default?.url || 'https://default-explorer.com';
  
    try {
      const socialUrlsRecord: Record<string, string> = social_urls.reduce((acc, { name, url }) => {
        acc[name] = url;
        return acc;
      }, {} as Record<string, string>);
  
      let contractAddress;
      const commonParams = {
        name: functionInputs.name,
        description: functionInputs.description,
        symbol: functionInputs.symbol,
        image: image,
        social_urls: socialUrlsRecord,
        saleRecipient: functionInputs.saleRecipient || account.address,
        royaltyRecipient: functionInputs.royaltyRecipient || account.address,
        royaltyBps: convertToBasisPoints(Number(functionInputs.royaltyBps) || 0),
        platformFeeBps: convertToBasisPoints(Number(functionInputs.platformFeeBps) || 0),
        platformFeeRecipient: functionInputs.platformFeeRecipient || account.address,
      };
  
      switch (contractType) {
        case "DropERC721":
        case "TokenERC721":
        case "OpenEditionERC721":
          contractAddress = await deployERC721Contract({
            chain: NETWORK,
            client,
            account,
            type: contractType,
            params: commonParams,
          });
          console.log(contractAddress);

          break;
  
        case "DropERC1155":
        case "TokenERC1155":
          contractAddress = await deployERC1155Contract({
            chain: NETWORK,
            client,
            account,
            type: contractType,
            params: commonParams,
          });
          console.log(contractAddress);

          break;
  
        case "TokenERC20":
        case "DropERC20":
          contractAddress = await deployERC20Contract({
            chain: NETWORK,
            client,
            account,
            type: contractType,
            params: commonParams,
          });
          break;
  
        default:
          throw new Error("Unsupported contract type");
      }
      console.log("OUTSIDE SWITCH CASE:", contractAddress);

      const contractData = {
        deployerAddress: account?.address || "",
        contractAddress: contractAddress,
        chain: NETWORK,
        chainId: chainId,
        title: functionInputs.name ||"My NFT Collection",
        description: functionInputs.description || "My NFT COllection",
        thumbnailUrl: image || "",
        explorer: `${blockExplorerUrl}/${contractAddress}`,
        type: name || "",
        typeBase: version || "",
        social_urls: socialUrlsRecord || { "telegram": "", "discord": "" }, // Default values here
      };

      console.log("Contract data to be saved:", contractData); // Debugging log

  
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
  
        setOutput(contractAddress);
        console.log('Raw result:', contractAddress);
  
        alert("Contract saved successfully!");
        setIsLoading(false); // End loading

        onClose();
        
      } catch (error) {
        setTransactionError(error instanceof Error ? error.message : String(error));
      }
   
  };
  


  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    let timeoutId: NodeJS.Timeout;
    const blockRange = 10000n; // Define a block range according to your needs

    const fetchEvents = async () => {
      if (!isLoading) return;

      try {
        console.log("Initializing contract with address:", contractAddress);
        const contract = getContract({
          address: contractAddress,
          client: client,
          chain: NETWORK,
        });

        console.log("Contract initialized:", contract);

        const preparedEvent = prepareEvent({
          signature: "event ProxyDeployed(address indexed implementation, address proxy, address indexed deployer)"
        });

        console.log("Event filter prepared:", preparedEvent);

        const fetchedEvents = await getContractEvents({
          contract,
          blockRange,
          events: [preparedEvent],
        });

        console.log("Fetched events:", fetchedEvents);

        if (fetchedEvents.length > 0) {
          const eventDetails = fetchedEvents
            .filter((event: any) => event.args.deployer.toLowerCase() === account?.address.toLowerCase())
            .map((event: any) => ({
              contractAddress: event.args.proxy,
              deployer: event.args.deployer,
              chainId,
            }));

          console.log("Mapped event details:", eventDetails);
          setEvents(eventDetails);
        } else {
          console.log("No events found.");
          setEvents([]);
        }
      } catch (error) {
        console.error("Error fetching contract events:", error);
      }
    };

    // Start fetching events every 3 seconds for 30 seconds
    if (isLoading) {
      intervalId = setInterval(fetchEvents, 3000);

      // Stop fetching after 30 seconds
      timeoutId = setTimeout(() => {
        clearInterval(intervalId);
        setIsLoading(false);
        console.log("Stopped fetching events after 30 seconds.");
      }, 30000);
    }

    // Cleanup intervals and timeouts when the component unmounts or when isLoading changes
    return () => {
      clearInterval(intervalId);
      clearTimeout(timeoutId);
    };
  }, [isLoading, account?.address]);




  return (
    <div className={styles.modal}>
      <div className={styles.modalContent}>
        <span className={styles.closeButton} onClick={onClose}>&times;</span>
        <h2 className={styles.heading}>Set Contract Metadata</h2>

        <div className={styles.imageContainer}>
          {image ? (
            <img src={image} alt="Uploaded" className={styles.uploadedImage} />
          ) : (
            <div className={styles.imagePlaceholder}>Click to upload an image</div>
          )}
        </div>

        <input type="file" onChange={handleFileChangeContract} className={styles.fileInput} />

        {renderInputFields()}

        {selectedChain && (
          <div>
            <p>Selected Chain: {selectedChain.name}</p>
          </div>
        )}

        <button className="p-2 border rounded-lg" onClick={() => setModalOpened(true)}>Select Chain</button>
        
        {modalOpened && (
          <Service onSelectChain={handleSelectChain} onClose={() => setModalOpened(false)} />
        )}
      {selectedChain && activeChain !== NETWORK && (
        <div>
      <button onClick={handleClick}
        className={`${styles.px4} ${styles.py2} ${styles.mt4} ${styles.textWhite} ${styles.bgBlue500} ${styles.rounded} ${styles.hoverBgBlue600}`}

          >Switch Chain</button>;
        </div>
        )}

          <button
        onClick={() => handleRunDeployContract(name as ContractType)}
        className={`${styles.px4} ${styles.py2} ${styles.mt4} ${styles.textWhite} ${styles.bgBlue500} ${styles.rounded} ${styles.hoverBgBlue600}`}
        disabled={isLoading} // Disable button when loading

      >
        Run
        </button>

        
        
        {isLoading && (
  <div className="mt-4 flex justify-center">
 {events.length === 0 && <p>No events found.</p>}
        {events.map((event, index) => (
          <div key={index} style={cardStyle}>
            <p><strong>Contract Address (Proxy):</strong> {event.contractAddress}</p>
            <p><strong>Deployer:</strong> {event.deployer}</p>
            <p><strong>Chain ID:</strong> {event.chainId}</p>
            <button
        className={`mt-4 p-2 border border-gray-300 rounded-lg hover:bg-gray-100 ${isLoading ? 'cursor-not-allowed opacity-50' : ''}`}
        onClick={handleSaveContract}
        >
          SaveContract
          </button>
          </div>
        ))}  </div>
)}

        {transactionError && (
          <div className={`${styles.mt4} ${styles.textRed500}`}>{transactionError}</div>
        )}
      </div>
    </div>
  );
};
const cardStyle = {
  border: '1px solid #ccc',
  padding: '10px',
  margin: '10px',
  borderRadius: '5px',
  width: '300px',
};

const buttonStyle = {
  backgroundColor: '#4CAF50',
  color: 'white',
  padding: '10px',
  border: 'none',
  borderRadius: '5px',
  cursor: 'pointer',
};

export default DeployContract;
