"use client";
import React, { useState, useEffect, useCallback, FC } from "react";
import styles from './ContractSettings.module.css';
import { defineChain, getContract, prepareContractCall, resolveMethod, ThirdwebContract, readContract } from "thirdweb";
import { upload } from "thirdweb/storage";
import client from "@/lib/client";
import { MediaRenderer, TransactionButton, useActiveAccount } from "thirdweb/react";
import axios from 'axios';
import { FaTwitter, FaTelegram, FaGlobe, FaDiscord, FaGithub } from "react-icons/fa";
import { ChainList as FullChainList } from '@/const/ChainList';

type FunctionDefinition = {
  inputs: string[];
};
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

const ChainList: Chain[] = extractChainList();

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

const functionDefinitionsRead: Record<string, Record<string, FunctionDefinition>> = {
  ERCGetContractUri: {
    contractURI: { inputs: [] },
    name: { inputs: [] },
    symbol: { inputs: [] },
  },
  ERCGetOwner: {
    owner: { inputs: [] },
  },
  ERCGetDefaultRoyaltyInfo: {
    getDefaultRoyaltyInfo: { inputs: [] },
  },
  ERCGetDefaultRoyaltyToken: {
    getDefaultRoyaltyToken: { inputs: ["tokenId"] },
  },
  ERCGetPlatformFeeInfo: {
    getPlatformFeeInfo: { inputs: [] },
  },
  ERCGetPrimarySaleRecipient: {
    primarySaleRecipient: { inputs: [] },
  },
  ERCGetFlatPlatformFeeInfo: {
    getFlatPlatformFeeInfo: { inputs: [] },
  },
  ERCGetContractType: {
    contractType: { inputs: [] },
  },
  ERCGetContractVersion: {
    contractVersion: { inputs: [] },
  },
};

const functionDefinitions: Record<string, Record<string, FunctionDefinition>> = {
  ERCSetContractUri: {
    setContractURI: { inputs: ["uri"] },
  },
  ERCSetsetDefaultRoyaltyInfo: {
    setDefaultRoyaltyInfo: { inputs: ["royaltyRecipient", "royaltyBps"] },
  },
  ERCSetRoyaltyInfoForToken: {
    setRoyaltyInfoForToken: { inputs: ["tokenId", "royaltyRecipient", "royaltyBps"] },
  },
  ERCSetPlatformFeeInfo: {
    setPlatformFeeInfo: { inputs: ["platformFeeRecipient", "platformFeeBps"] },
  },
  ERCSetPrimarySaleRecipient: {
    setPrimarySaleRecipient: { inputs: ["saleRecipient"] },
  },
  ERCSetOwner: {
    setOwner: { inputs: ["newOwner"] },
  },
};

const ContractSettings: FC<{ contractAddress: string; chainId: number }> = ({
  contractAddress,
  chainId,
}) => {
  const account = useActiveAccount();
  const NETWORK = defineChain(chainId);
  const [contractVersion, setContractVersion] = useState<string>("");
  const [ContractOwner, setGetOwner] = useState<string>("");
  const [ContractType, setContractType] = useState<string>("");
  const [getRoyaltyRecipient, setGetRoyaltyRecipient] = useState<string>("");
  const [getRoyaltyBps, setGetRoyaltyBps] = useState<string>("");
 


  

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

  const contract: ThirdwebContract = getContract({
    address: contractAddress,
    client,
    chain: NETWORK,
  });

  const handleTransactionError = (error: any) => {
    console.error("Transaction error:", error);
  };

  const handleReadContract = async (methodName: string, params: any[]) => {
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
 
 
 
  const handleReadowner = async () => {
    try {
      const result = await handleReadContract("owner", []);
      if (typeof result === "string") {
        setGetOwner(result);
      } else {
        console.error("Unexpected result type:", result);
      }
    } catch (error) {
      console.error("Error reading owner:", error);
    }
  };
  
  
  
  
  const handleReadgetDefaultRoyaltyInfo = async () => {
    const result = await handleReadContract("getDefaultRoyaltyInfo", []);
    setGetRoyaltyRecipient(result[0] as string);
    setGetRoyaltyBps(result[1] as string);
  };

 
  useEffect(() => {
    
    handleReadgetDefaultRoyaltyInfo();
    
    
  }, [contractAddress, chainId])
  const handleReadcontractType = async () => {
    try {
      const result = await handleReadContract("contractType", []);
      if (typeof result === "string") {
        setContractType(result);
      } else {
        console.error("Unexpected result type:", result);
      }
    } catch (error) {
      console.error("Error reading owner:", error);
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
    handleReadcontractType();
   
    
  }, [contractAddress, chainId])

  

  const handleReadContractVersion = async () => {
    try {
      const result = await handleReadContract("contractVersion", []);
  
      // Logging the result type and value for debugging
      console.log("Result of contractVersion:", result);
      console.log("Type of result:", typeof result);
  
      if (typeof result === 'number' || (typeof result === 'string' && !isNaN(Number(result)))) {
        setContractVersion(result as string);
      } else {
        console.warn("Unexpected result type for contractVersion:", result);
        setContractVersion("Unknown");
      }
    } catch (error) {
      console.error("Error reading contractVersion:", error);
      setContractVersion("Error");
    }
  };
  useEffect(() => {
    
    handleReadContractVersion();
    
    
  }, [contractAddress, chainId])

  useEffect(() => {
    
    handleReadContractURITest();
    
    
  }, [contractAddress, chainId])

  useEffect(() => {
    
    handleReadowner();
    
    
  }, [contractAddress, chainId])

  const getChainName = (chainId: number): string => {
    const chain = ChainList.find(chain => chain.chainId === chainId);
    return chain ? chain.name : "Unknown Chain";
  };

  const chainName = getChainName(chainId);

  const ContractUriContainer = () => (
    <div className={styles.scrollContainer}>
      <div className={styles.containerWithBorderContracts}>
        <div className={styles.topRightCorner}>
          {contractMetadata.social_urls.x && (
            <a
              href={contractMetadata.social_urls.x}
              target="_blank"
              rel="noopener noreferrer"
              className="mx-2"
            >
              <FaTwitter />
            </a>
          )}
          {contractMetadata.social_urls.telegram && (
            <a
              href={contractMetadata.social_urls.telegram}
              target="_blank"
              rel="noopener noreferrer"
              className="mx-2"
            >
              <FaTelegram />
            </a>
          )}
          {contractMetadata.social_urls.website && (
            <a
              href={contractMetadata.social_urls.website}
              target="_blank"
              rel="noopener noreferrer"
              className="mx-2"
            >
              <FaGlobe />
            </a>
          )}
          {contractMetadata.social_urls.github && (
            <a
              href={contractMetadata.social_urls.github}
              target="_blank"
              rel="noopener noreferrer"
              className="mx-2"
            >
              <FaGithub />
            </a>
          )}
          {contractMetadata.social_urls.discord && (
            <a
              href={contractMetadata.social_urls.discord}
              target="_blank"
              rel="noopener noreferrer"
              className="mx-2"
            >
              <FaDiscord />
            </a>
          )}
          <p>
            {chainName} (ID: {chainId})
          </p>
        </div>
        <h2 className={styles.heading}>{contractMetadata.name}</h2>
        <div className={styles.imageAndInfoContainer}>
          <div className={styles.imageContainer}>
            {contractMetadata.image && (
              <MediaRenderer
                src={contractMetadata.image}
                client={client}
                className={styles.nftmetadataimage}
              />
            )}
          </div>
          <div className={styles.ContractInfo}>
            <div className={styles.ContractOwner}>
              <p>Contract Owner: {ContractOwner}</p>
            </div>
            <div className={styles.Symbol}>
              <p>Contract Symbol: {contractMetadata.symbol}</p>
            </div>
            <div className={styles.contractVersion}>
              <p>Contract Version: {contractVersion}</p>
            </div>
            <div className={styles.contractType}>
            </div>
            <div className={styles.fee_recipient}>
              <p>Fee Recipient: {contractMetadata.fee_recipient}</p>
            </div>
            <div className={styles.Royalty}>
              <p>
                Royalty Wallet: {getRoyaltyRecipient} : {getRoyaltyBps}
              </p>
            </div>
          </div>
        </div>
        <div className={styles.Description}>
          <p>Contract Description: {contractMetadata.description}</p>
          <p>Contract abi: {contract.abi}</p>
        </div>
      </div>
    </div>
  );

  

  const ContractMetadataComponent = () => {
    const [contractName, setContractName] = useState<string>("");
    const [contractDescription, setContractDescription] = useState<string>("");
    const [contractTelegram, setContractTelegram] = useState<string>("");
    const [contractDiscord, setContractDiscord] = useState<string>("");
    const [contractX, setContractX] = useState<string>("");
    const [socialUrls, setSocialUrls] = useState<SocialUrl[]>([
      { name: "telegram", url: "" },
      { name: "discord", url: "" },
      { name: "x", url: "" },
      { name: "website", url: "" },
      { name: "github", url: "" }

    ]);
    const [metadataImage, setMetadataImage] = useState<string>("");
    const [platformFeeInfoRecipient, setPlatformFeeInfoRecipient] = useState<string>("");
    const [platformFeeBps, setPlatformFeeBps] = useState<string>("");
    const [symbol, setSymbol] = useState<string>("");
    const [additionalSocialUrls, setAdditionalSocialUrls] = useState<SocialUrl[]>([]);

    const [isEditing, setIsEditing] = useState(false);

    const addSocialUrlInput = () => {
      setAdditionalSocialUrls([...additionalSocialUrls, { name: "", url: "" }]);
    };

    const handleReadPlatformFeeInfo = async () => {
      const result = await handleReadContract("getPlatformFeeInfo", []);
      setPlatformFeeInfoRecipient(result[0] as string);
      setPlatformFeeBps(result[1] as string);
    };

    const handleReadSymbol = async () => {  
      const result = await handleReadContract("symbol", []);
      setSymbol(result as unknown as string);
    };

    const handleFileChangeContract = async (event: React.ChangeEvent<HTMLInputElement>) => {
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
          setMetadataImage(ipfsUrl);
          console.log("NewFile Data, ", ipfsUrl);
        } catch (error) {
          console.error("Error uploading file:", error);
        }
      }
    };

    const prepareTransaction = async () => {
      const resolvedMethod = await resolveMethod("setContractURI");

      if (!resolvedMethod) {
        throw new Error("Failed to resolve method");
      }

      const socialUrlsObject: Record<string, string> = {};
      [...socialUrls, ...additionalSocialUrls].forEach(({ name, url }) => {
        if (name && url) {
          socialUrlsObject[name] = url;
        }
      });

      const metadataObject = {
        name: contractName,
        description: contractDescription,
        image: metadataImage,
        seller_fee_basis_points: platformFeeBps,
        fee_recipient: platformFeeInfoRecipient,
        merkle: {},
        symbol:symbol,
        social_urls: socialUrlsObject,
      };

      const metadataString = JSON.stringify(metadataObject);
      const blob = new Blob([metadataString], { type: 'application/json' });
      const file = new File([blob], 'metadata.json');

      try {
        const uriContract = await upload({
          client,
          files: [file],
        });

        if (!uriContract || uriContract.length === 0) {
          throw new Error("Failed to upload metadata to IPFS");
        }

        return prepareContractCall({
          contract,
          method: resolvedMethod,
          params: [uriContract],
        });
      } catch (error) {
        console.error("Error uploading metadata:", error);
        throw error;
      }
    };

    const handleTransactionSent = () => {
      console.log("Transaction sent");
    };

    const handleTransactionConfirmed = () => {
      console.log("Transaction confirmed");
    };

    const handleSocialUrlChange = (index: number, field: string, value: string) => {
      if (index < 5) {
        const newSocialUrls = [...socialUrls];
        newSocialUrls[index] = { ...newSocialUrls[index], [field]: value };
        setSocialUrls(newSocialUrls);
      } else {
        const newAdditionalSocialUrls = [...additionalSocialUrls];
        newAdditionalSocialUrls[index - 3] = { ...newAdditionalSocialUrls[index - 3], [field]: value };
        setAdditionalSocialUrls(newAdditionalSocialUrls);
      }
    };
    useEffect(() => {
      handleReadPlatformFeeInfo();
    }, [contractAddress, chainId]);
    useEffect(() => {
      handleReadSymbol();
    }, [contractAddress, chainId]);

    

    return (
      <div className={styles.containerWithBorder}>
        <h2 className={styles.heading}>Set Contract Metadata</h2>
        <MediaRenderer src={metadataImage || contractMetadata.image} client={client} className="object-cover object-center" />

        <input type="file" onChange={handleFileChangeContract} />
        <div>
        <input
          type="text"
          value={contractName}
          onChange={(e) => setContractName(e.target.value)}
          placeholder="Name"
          className={styles.input}
          disabled={!isEditing}
        /></div><div>
        <input
          type="text"
          value={contractDescription}
          onChange={(e) => setContractDescription(e.target.value)}
          placeholder="Description"
          className={styles.input}
          disabled={!isEditing}
        /></div><div>
        <input
          type="text"
          value={socialUrls[0].url}
          onChange={(e) => handleSocialUrlChange(0, 'url', e.target.value)}
          placeholder="telegram"
          className={styles.input}
          disabled={!isEditing}
        />
        </div><div>
        <input
          type="text"
          value={socialUrls[1].url}
          onChange={(e) => handleSocialUrlChange(1, 'url', e.target.value)}
          placeholder="discord"
          className={styles.input}
          disabled={!isEditing}
        />
        </div>
        <div>
        <input
          type="text"
          value={socialUrls[2].url}
          onChange={(e) => handleSocialUrlChange(2, 'url', e.target.value)}
          placeholder="x"
          className={styles.input}
          disabled={!isEditing}
        />
        </div>
        <div>
        <input
          type="text"
          value={socialUrls[3].url}
          onChange={(e) => handleSocialUrlChange(3, 'url', e.target.value)}
          placeholder="website"
          className={styles.input}
          disabled={!isEditing}
        />
        </div>
        <div>
        <input
          type="text"
          value={socialUrls[4].url}
          onChange={(e) => handleSocialUrlChange(4, 'url', e.target.value)}
          placeholder="github"
          className={styles.input}
          disabled={!isEditing}
        />
        </div>
        {additionalSocialUrls.map((socialUrl, index) => (
          <div key={index + 3} className="socialUrlGroup">
            <div className="inputGroup">
              <label htmlFor={`socialName-${index + 3}`}>Name:</label>
              <input
                id={`socialName-${index + 3}`}
                type="text"
                value={socialUrl.name}
                onChange={(e) => handleSocialUrlChange(index + 3, 'name', e.target.value)}
                className={styles.input}
                disabled={!isEditing}
              />
            </div>
            <div className="inputGroup">
              <label htmlFor={`socialUrl-${index + 3}`}>URL:</label>
              <input
                id={`socialUrl-${index + 3}`}
                type="text"
                value={socialUrl.url}
                onChange={(e) => handleSocialUrlChange(index + 3, 'url', e.target.value)}
                className={styles.input}
                disabled={!isEditing}
              />
            </div>
          </div>
        ))}
        <div>
        <button onClick={addSocialUrlInput} className="addButton">
          Add More URLs
        </button>
        </div>
        <div className={styles.Buttons}>
        <button
          onClick={() => setIsEditing(true)}
          className="px-4 py-2 mt-4 text-white bg-green-500 rounded hover:bg-green-600"
        >
          Edit
        </button>
        <TransactionButton
          transaction={prepareTransaction}
          onTransactionSent={handleTransactionSent}
          onTransactionConfirmed={handleTransactionConfirmed}
          disabled={!isEditing}
          onError={handleTransactionError}
          className="px-4 py-2 mt-4 text-white bg-blue-500 rounded hover:bg-blue-600"
        >
          Run
        </TransactionButton>
      </div>
      </div>
    );
  };

  const DefaultRoyaltyInfoContainer = () => {
    const [royaltyRecipient, setRoyaltyRecipient] = useState("");
    const [royaltyBps, setRoyaltyBps] = useState("");
    const [getRoyaltyRecipient, setGetRoyaltyRecipient] = useState<string>("");
    const [getRoyaltyBps, setGetRoyaltyBps] = useState<string>("");
    const [isEditing, setIsEditing] = useState(false);

    const handleTransactionSent = () => {
      console.log("Transaction sent");
    };

    const handleTransactionConfirmed = () => {
      console.log("Transaction confirmed");
    };

    const prepareTransactionSetDefault = async () => {
      const resolvedMethod = await resolveMethod("setDefaultRoyaltyInfo");
      const transaction = await prepareContractCall({
        contract,
        method: resolvedMethod, 
        params: [royaltyRecipient, royaltyBps]
      });
      return transaction;
    };

    
    return (
      <div className={styles.containerWithBorder}>
       <h2 className={styles.heading}>Set Default Royalty Info</h2>
        
        <div>
        <input
          type="text"
          value={royaltyRecipient}
          onChange={(e) => setRoyaltyRecipient(e.target.value)}
          placeholder={ "Royalty Recipient (Wallet-Address)"}
          className={styles.input}
          disabled={!isEditing}
        />
        </div>
        <div>
        <input
          type="text"
          value={royaltyBps}
          onChange={(e) => setRoyaltyBps(e.target.value)}
          placeholder={ "Royalty BPS (Number 100 = 1%)"}
          className={styles.input}
          disabled={!isEditing}
        />
        </div>
        <div className={styles.Buttons}>

        <button
          onClick={() => setIsEditing(true)}
          className={`${styles.px4} ${styles.py2} ${styles.mt4} ${styles.textWhite} ${styles.bgGreen500} ${styles.rounded} ${styles.hoverBgGreen600}`}
        >
          Edit
        </button>
        <TransactionButton
          transaction={prepareTransactionSetDefault}
          onTransactionSent={handleTransactionSent}
          onTransactionConfirmed={handleTransactionConfirmed}
          disabled={!isEditing}

          onError={handleTransactionError}
          className={`${styles.px4} ${styles.py2} ${styles.mt4} ${styles.textWhite} ${styles.bgBlue500} ${styles.rounded} ${styles.hoverBgBlue600}`}
        >
          Run
        </TransactionButton>
        </div>
      </div>
    );
  };

  const RoyaltyInfoForTokenContainer = () => {
    const [tokenId, setTokenId] = useState("");
    const [royaltyRecipient, setRoyaltyRecipient] = useState("");
    const [royaltyBps, setRoyaltyBps] = useState("");
    const [getRoyaltyRecipient, setGetRoyaltyRecipient] = useState<string>("");
    const [getRoyaltyBps, setGetRoyaltyBps] = useState<string>("");
    
    const [isEditing, setIsEditing] = useState(false);

    const handleTransactionSent = () => {
      console.log("Transaction sent");
    };

    const handleTransactionConfirmed = () => {
      console.log("Transaction confirmed");
    };

    const prepareTransaction = async () => {
      const resolvedMethod = await resolveMethod("setRoyaltyInfoForToken");
      const transaction = await prepareContractCall({
        contract,
        method: resolvedMethod, 
        params: [tokenId, royaltyRecipient, royaltyBps]
      });
      return transaction;
    };

    
    return (
      <div className={styles.containerWithBorder}>
        <h2 className={styles.heading}>Set Royalty Info for Token</h2>
        <div>
        <input
          type="text"
          value={tokenId}
          onChange={(e) => setTokenId(e.target.value)}
          placeholder="Token ID (Number)"
          className={styles.input}
        />
        </div>
        <div>
        <input
          type="text"
          value={royaltyRecipient}
          onChange={(e) => setRoyaltyRecipient(e.target.value)}
          placeholder={ "Royalty Recipient (Wallet-Address)"}
          className={styles.input}
          disabled={!isEditing}
        />
        </div>
        <div>
        <input
          type="text"
          value={royaltyBps}
          onChange={(e) => setRoyaltyBps(e.target.value)}
          placeholder={ "Royalty BPS (Number 100 = 1%)"}
          className={styles.input}
          disabled={!isEditing}
        />
        </div>
        <div className={styles.Buttons}>
        <button
          onClick={() => setIsEditing(true)}
          className={`${styles.px4} ${styles.py2} ${styles.mt4} ${styles.textWhite} ${styles.bgGreen500} ${styles.rounded} ${styles.hoverBgGreen600}`}
        >
          Edit
        </button>
        <TransactionButton
          transaction={prepareTransaction}
          onTransactionSent={handleTransactionSent}
          onTransactionConfirmed={handleTransactionConfirmed}
          onError={handleTransactionError}
          className={`${styles.px4} ${styles.py2} ${styles.mt4} ${styles.textWhite} ${styles.bgBlue500} ${styles.rounded} ${styles.hoverBgBlue600}`}
          disabled={!isEditing}
        >
          Run
        </TransactionButton>
      </div>
      </div>
    );
  };

  const PlatformFeeInfoContainer = () => {
    const [platformFeeRecipient, setPlatformFeeRecipient] = useState("");
    const [platformFeeBps, setPlatformFeeBps] = useState("");
    const [getPlatformFeeInfoRecipient, setGetPlatformFeeInfoRecipient] = useState<string>("");
    const [getPlatformFeeBps, setGetPlatformFeeBps] = useState<string>("");
    const [isEditing, setIsEditing] = useState(false);

    const handleTransactionSent = () => {
      console.log("Transaction sent");
    };

    const handleTransactionConfirmed = () => {
      console.log("Transaction confirmed");
    };

    const prepareTransaction = async () => {
      const resolvedMethod = await resolveMethod("setPlatformFeeInfo");
      const transaction = await prepareContractCall({
        contract,
        method: resolvedMethod, 
        params: [platformFeeRecipient, platformFeeBps]
      });
      return transaction;
    };

    
    return (
      <div className={styles.containerWithBorder}>
        <h2 className={styles.heading}>Set Platform Fee Info</h2>
        <div>
        <input
          type="text"
          value={platformFeeRecipient}
          onChange={(e) => setPlatformFeeRecipient(e.target.value)}
          placeholder={"Platform Fee Recipient (Wallet-Address)"}
          className={styles.input}
          disabled={!isEditing}
        />
        </div>
        <div>
        <input
          type="text"
          value={platformFeeBps}
          onChange={(e) => setPlatformFeeBps(e.target.value)}
          placeholder={ "Platform Fee BPS (Number 100 = 1%)"}
          className={styles.input}
          disabled={!isEditing}
        />
        </div>
        <div className={styles.Buttons}>
        <button
          onClick={() => setIsEditing(true)}
          className={`${styles.px4} ${styles.py2} ${styles.mt4} ${styles.textWhite} ${styles.bgGreen500} ${styles.rounded} ${styles.hoverBgGreen600}`}
        >
          Edit
        </button>
        <TransactionButton
          transaction={prepareTransaction}
          onTransactionSent={handleTransactionSent}
          onTransactionConfirmed={handleTransactionConfirmed}
          onError={handleTransactionError}
          className={`${styles.px4} ${styles.py2} ${styles.mt4} ${styles.textWhite} ${styles.bgBlue500} ${styles.rounded} ${styles.hoverBgBlue600}`}
          disabled={!isEditing}
        >
          Run
        </TransactionButton>
      </div>
      </div>
    );
  };

  const PrimarySaleRecipientContainer = () => {
    const [saleRecipient, setSaleRecipient] = useState("");
    const [getSaleRecipient, setGetSaleRecipient] = useState<string>("");
    const [isEditing, setIsEditing] = useState(false);

    const handleTransactionSent = () => {
      console.log("Transaction sent");
    };

    const handleTransactionConfirmed = () => {
      console.log("Transaction confirmed");
    };

    const prepareTransaction = async () => {
      const resolvedMethod = await resolveMethod("setPrimarySaleRecipient");
      const transaction = await prepareContractCall({
        contract,
        method: resolvedMethod, 
        params: [saleRecipient]
      });
      return transaction;
    };

   
    return (
      <div className={styles.containerWithBorder}>
        <h2 className={styles.heading}>Set Primary Sale Recipient</h2>
        <div>
        <input
          type="text"
          value={saleRecipient}
          onChange={(e) => setSaleRecipient(e.target.value)}
          placeholder={ "Sale Recipient (Wallet-Address)"}
          className={styles.input}
          disabled={!isEditing}
        />
        </div>
        <div className={styles.Buttons}>
        <button
          onClick={() => setIsEditing(true)}
          className={`${styles.px4} ${styles.py2} ${styles.mt4} ${styles.textWhite} ${styles.bgGreen500} ${styles.rounded} ${styles.hoverBgGreen600}`}
        >
          Edit
        </button>
        <TransactionButton
          transaction={prepareTransaction}
          onTransactionSent={handleTransactionSent}
          onTransactionConfirmed={handleTransactionConfirmed}
          onError={handleTransactionError}
          className={`${styles.px4} ${styles.py2} ${styles.mt4} ${styles.textWhite} ${styles.bgBlue500} ${styles.rounded} ${styles.hoverBgBlue600}`}
          disabled={!isEditing}
        >
          Run
        </TransactionButton>
      </div>
      </div>

    );
  };

  const OwnerContainer = () => {
    const [newOwner, setNewOwner] = useState("");
    const [currentOwner, setCurrentOwner] = useState<string>("");
    const [isEditing, setIsEditing] = useState(false);

    const handleTransactionSent = () => {
      console.log("Transaction sent");
    };

    const handleTransactionConfirmed = () => {
      console.log("Transaction confirmed");
      setIsEditing(false); // Disable editing after transaction is confirmed
    };

    const prepareTransaction = async () => {
      const resolvedMethod = await resolveMethod("setOwner");
      const transaction = await prepareContractCall({
        contract,
        method: resolvedMethod, 
        params: [newOwner]
      });
      return transaction;
    };

    
    return (
      <div className={styles.containerWithBorder}>
        <h2 className={styles.heading}>Set Owner</h2>
        <div>
        <input
          type="text"
          value={newOwner}
          onChange={(e) => setNewOwner(e.target.value)}
          placeholder={ "New Owner  (Wallet-Address)"}
          className={styles.input}
          disabled={!isEditing} // Disable input if not editing
        />
        </div>
        <div className={styles.Buttons}>
        <button
          onClick={() => setIsEditing(true)}
          className={`${styles.px4} ${styles.py2} ${styles.mt4} ${styles.textWhite} ${styles.bgGreen500} ${styles.rounded} ${styles.hoverBgGreen600}`}
        >
          Change Owner
        </button>
        

        <TransactionButton
          transaction={prepareTransaction}
          onTransactionSent={handleTransactionSent}
          onTransactionConfirmed={handleTransactionConfirmed}
          onError={handleTransactionError}
          className={`${styles.px4} ${styles.py2} ${styles.mt4} ${styles.textWhite} ${styles.bgBlue500} ${styles.rounded} ${styles.hoverBgBlue600}`}
          disabled={!isEditing}
        >
          Run
        </TransactionButton>
      </div>
      </div>
    );
  };

  return (
    <div className={styles.container}>
      
      
      <div className={styles.explorerContainer}>
        <ContractUriContainer />
        <ContractMetadataComponent />
        <DefaultRoyaltyInfoContainer />
        <RoyaltyInfoForTokenContainer />
        <PlatformFeeInfoContainer />
        <PrimarySaleRecipientContainer />
        <OwnerContainer />
      </div>
    </div>
  );
};

export default ContractSettings;
