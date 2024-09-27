"use client";

import React, { FC, useState, ChangeEvent } from "react";
import { defineChain, getContract, ThirdwebContract } from "thirdweb";
import { BigNumber } from "ethers";
import styles from '../Explorer/explorer.module.css';
import { useActiveAccount, useReadContract } from "thirdweb/react";
import { readContract, resolveMethod } from "thirdweb";
import client from "@/lib/client";
import { SpunksContract } from "@/const/contracts";
import { deployERC721Contract } from "thirdweb/deploys";

import { deployERC1155Contract } from "thirdweb/deploys";
import { deployERC20Contract } from "thirdweb/deploys";
import { upload } from "thirdweb/storage";
import { contractData } from "@/const/smartContracts";
import { useRouter } from "next/navigation";
import ContractCard from "./contractCard";

const stringifyWithBigInt = (obj: any) => {
  return JSON.stringify(obj, (key, value) => (typeof value === 'bigint' ? value.toString() : value), 2);
};
interface SocialUrl {
    name: string;
    url: string;
  }

const DeployContract: React.FC = () => {
  const account = useActiveAccount();
  const router = useRouter();

  const NETWORK = defineChain(4689);
  const [functionInputs, setFunctionInputs] = useState<{ [key: string]: any }>({});
  const [transactionError, setTransactionError] = useState<string | null>(null);
  const [output, setOutput] = useState<any>(null);
  const [contractName, setcontractName] = useState<any>(null);
  const [contractDescription, setcontractDescription] = useState<any>(null);
  const [contractSymbol, setcontractSymbol] = useState<any>(null);
  const [saleRecipient, setsaleRecipient] = useState<any>(null);
  const [royaltyRecipient, setroyaltyRecipient] = useState<any>(null);
  const [contractURI, setcontractURI] = useState<any>(null);
  const [royaltyBps, setroyaltyBps] = useState<any>(null);
  const [platformFeeBps, setplatformFeeBps] = useState<any>(null);
  const [platformFeeRecipient, setplatformFeeRecipient] = useState<any>(null);
  const [image, setImage] = useState<any>(null);

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
        setImage(ipfsUrl);
        console.log("NewFile Data, ", ipfsUrl);
      } catch (error) {
        console.error("Error uploading file:", error);
      }
    }
  };

  const accountAddress = account
  const [social_urls, setSocialUrls] = useState<SocialUrl[]>([
    { name: "telegram", url: "" },
    { name: "discord", url: "" },
    { name: "x", url: "" },
    { name: "website", url: "" },
    { name: "github", url: "" }

  ]);
  
  const handleRunDeployContractNftDropERC721 = async () => {
    if (!account) throw new Error("Account not connected");
  
   
        try {
            // Convert SocialUrl[] to Record<string, string>
            const socialUrlsRecord: Record<string, string> = social_urls.reduce((acc, { name, url }) => {
              acc[name] = url;
              return acc;
            }, {} as Record<string, string>);

      const contractAddresse = await deployERC721Contract({
        chain: NETWORK,
        client,
        account,
        type: "DropERC721",
        params: {
            name: contractName,
            description: contractDescription,
            symbol: contractSymbol,
            image: image,
            social_urls: socialUrlsRecord,
            contractURI,
            saleRecipient: saleRecipient || accountAddress,
            royaltyRecipient: royaltyRecipient || accountAddress,
            royaltyBps: royaltyBps || 0n,
            platformFeeBps: platformFeeBps || 0n,
            platformFeeRecipient: platformFeeRecipient || accountAddress,
        } // Closing brace for params object
      });  // Closing parenthesis for the deployERC721Contract function call
  
      setOutput(contractAddresse);
      console.log('Raw result:', contractAddresse);
    } catch (error) {
      setTransactionError(error instanceof Error ? error.message : String(error));
    }
  };

  const handleRunDeployContractNFTCollectionERC721 = async () => {
    if (!account) throw new Error("Account not connected");
  
    try {
        const socialUrlsRecord: Record<string, string> = social_urls.reduce((acc, { name, url }) => {
            acc[name] = url;
            return acc;
          }, {} as Record<string, string>);
      const contractAddresse = await deployERC721Contract({
        chain: NETWORK,
        client,
        account,
        type: "TokenERC721",
        params: {
            name: contractName,
            description: contractDescription,
            symbol: contractSymbol,
            image: image,
            social_urls: socialUrlsRecord,
            contractURI,
            saleRecipient: saleRecipient || accountAddress,
            platformFeeBps: platformFeeBps || 0n,
        platformFeeRecipient: platformFeeRecipient || accountAddress,
            royaltyRecipient: royaltyRecipient || accountAddress,
            royaltyBps: royaltyBps || 0n,
        } // Closing brace for params object
      });  // Closing parenthesis for the deployERC721Contract function call
  
      setOutput(contractAddresse);
      console.log('Raw result:', contractAddresse);
    } catch (error) {
      setTransactionError(error instanceof Error ? error.message : String(error));
    }
  };

  const handleRunDeployContractSharedMetadataERC721 = async () => {
    if (!account) throw new Error("Account not connected");
  
    try {
        const socialUrlsRecord: Record<string, string> = social_urls.reduce((acc, { name, url }) => {
            acc[name] = url;
            return acc;
          }, {} as Record<string, string>);

      const contractAddresse = await deployERC721Contract({
        chain: NETWORK,
        client,
        account,
        type: "OpenEditionERC721",
        params: {
        name: contractName,
        description: contractDescription,
        symbol: contractSymbol,
        image: image,
        social_urls: socialUrlsRecord,
        contractURI,
        saleRecipient: saleRecipient || accountAddress,
        royaltyRecipient: royaltyRecipient || accountAddress,
        royaltyBps: royaltyBps || 0n,
        } // Closing brace for params object
      });  // Closing parenthesis for the deployERC721Contract function call
  
      setOutput(contractAddresse);
      console.log('Raw result:', contractAddresse);
    } catch (error) {
      setTransactionError(error instanceof Error ? error.message : String(error));
    }
  };

  const handleRunDeployContractNFTDropERC1155 = async () => {
    if (!account) throw new Error("Account not connected");
  
    try {
        const socialUrlsRecord: Record<string, string> = social_urls.reduce((acc, { name, url }) => {
            acc[name] = url;
            return acc;
          }, {} as Record<string, string>);

      const contractAddresse = await deployERC1155Contract({
        chain: NETWORK,
        client,
        account,
        type: "DropERC1155",
        params: {
        name: contractName,
        description: contractDescription,
        symbol: contractSymbol,
        image: image,
        social_urls: socialUrlsRecord,
        contractURI,
        saleRecipient: saleRecipient || accountAddress,
        platformFeeBps: platformFeeBps || 0n,
        platformFeeRecipient: platformFeeRecipient || accountAddress,
        royaltyRecipient: royaltyRecipient || accountAddress,
        royaltyBps: royaltyBps || 0n,
        } // Closing brace for params object
      });  // Closing parenthesis for the deployERC721Contract function call
  
      setOutput(contractAddresse);
      console.log('Raw result:', contractAddresse);
    } catch (error) {
      setTransactionError(error instanceof Error ? error.message : String(error));
    }
  };
  
  const handleRunDeployContractNFTCollectionERC1155 = async () => {
    if (!account) throw new Error("Account not connected");
  
    try {
        const socialUrlsRecord: Record<string, string> = social_urls.reduce((acc, { name, url }) => {
            acc[name] = url;
            return acc;
          }, {} as Record<string, string>);

      const contractAddresse = await deployERC1155Contract({
        chain: NETWORK,
        client,
        account,
        type: "TokenERC1155",
        params: {
            name: contractName,
            description: contractDescription,
            symbol: contractSymbol,
            image: image,
            social_urls: socialUrlsRecord,
            contractURI,
            saleRecipient: saleRecipient || accountAddress,
            platformFeeBps: platformFeeBps || 0n,
            platformFeeRecipient: platformFeeRecipient || accountAddress,
            royaltyRecipient: royaltyRecipient || accountAddress,
            royaltyBps: royaltyBps || 0n,
        } // Closing brace for params object
      });  // Closing parenthesis for the deployERC721Contract function call
  
      setOutput(contractAddresse);
      console.log('Raw result:', contractAddresse);
    } catch (error) {
      setTransactionError(error instanceof Error ? error.message : String(error));
    }
  };

  const handleRunDeployERC20Contract = async () => {
    if (!account) throw new Error("Account not connected");
  
    try {
        const socialUrlsRecord: Record<string, string> = social_urls.reduce((acc, { name, url }) => {
            acc[name] = url;
            return acc;
          }, {} as Record<string, string>);

      const contractAddresse = await deployERC20Contract({
        chain: NETWORK,
        client,
        account,
        type: "TokenERC20",
        params: {
            name: contractName,
            description: contractDescription,
            symbol: contractSymbol,
            image: image,
            social_urls: socialUrlsRecord,
            contractURI,
            saleRecipient: saleRecipient || accountAddress,
            platformFeeBps: royaltyRecipient || accountAddress,
            platformFeeRecipient: royaltyBps || 0n,
        } // Closing brace for params object
      });  // Closing parenthesis for the deployERC721Contract function call
  
      setOutput(contractAddresse);
      console.log('Raw result:', contractAddresse);
    } catch (error) {
      setTransactionError(error instanceof Error ? error.message : String(error));
    }
  };

  const handleRunDeployERC20DropContract = async () => {
    if (!account) throw new Error("Account not connected");
  
    try {
        const socialUrlsRecord: Record<string, string> = social_urls.reduce((acc, { name, url }) => {
            acc[name] = url;
            return acc;
          }, {} as Record<string, string>);

      const contractAddresse = await deployERC20Contract({
        chain: NETWORK,
        client,
        account,
        type: "DropERC20",
        params: {
            name: contractName,
            description: contractDescription,
            symbol: contractSymbol,
            image: image,
            social_urls: socialUrlsRecord,
            contractURI,
            saleRecipient: saleRecipient || accountAddress,
            platformFeeBps: royaltyRecipient || accountAddress,
            platformFeeRecipient: royaltyBps || 0n,
        } // Closing brace for params object
      });  // Closing parenthesis for the deployERC721Contract function call
  
      setOutput(contractAddresse);
      console.log('Raw result:', contractAddresse);
    } catch (error) {
      setTransactionError(error instanceof Error ? error.message : String(error));
    }
  };


  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFunctionInputs({ ...functionInputs, [e.target.name]: e.target.value });
  };

 

  // Filter contracts by type
  const erc721Contracts = contractData.filter(contract => contract.typeBase === 'ERC721');
  const erc1155Contracts = contractData.filter(contract => contract.typeBase === 'ERC1155');
  const erc20Contracts = contractData.filter(contract => contract.typeBase === 'ERC20');

 

  return (
    <div className={`${styles.flex} ${styles.hScreen}`}>
      <div className={`${styles.wFull} ${styles.p5}`}>
        <h2 className={`${styles.mb4} ${styles.textXl} ${styles.fontBold}`}>
          Start Deploy and Manage your Smart-Contract with ioPlasmaVerse
        </h2>
        <p>Here you can deploy and manage ERC721, ERC1155, and ERC20 contracts.</p>

        {/* ERC721 Contracts */}
        <h3 className={styles.sectionTitle}>ERC721 Contracts</h3>
        <div className={styles.contractsGrid}>
          {erc721Contracts.map((contract, index) => (
            <ContractCard 
              key={index} 
              contract={contract} 
            />
          ))}
        </div>

        {/* ERC1155 Contracts */}
        <h3 className={styles.sectionTitle}>ERC1155 Contracts</h3>
        <div className={styles.contractsGrid}>
          {erc1155Contracts.map((contract, index) => (
            <ContractCard 
              key={index} 
              contract={contract} 
            />
          ))}
        </div>

        {/* ERC20 Contracts */}
        <h3 className={styles.sectionTitle}>ERC20 Contracts</h3>
        <div className={styles.contractsGrid}>
          {erc20Contracts.map((contract, index) => (
            <ContractCard 
              key={index} 
              contract={contract} 
            />
          ))}
        </div>

      </div>
    </div>
  );
};

export default DeployContract;