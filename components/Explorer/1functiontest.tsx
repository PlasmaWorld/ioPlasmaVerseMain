"use client";

import React, { FC, useState, ChangeEvent } from "react";
import { defineChain, getContract, ThirdwebContract } from "thirdweb";
import { BigNumber } from "ethers";
import styles from './explorer.module.css';
import { useActiveAccount, useReadContract } from "thirdweb/react";
import { readContract, resolveMethod } from "thirdweb";
import client from "@/lib/client";
import { SpunksContract } from "@/const/contracts";
import { deployERC721Contract } from "thirdweb/deploys";

const stringifyWithBigInt = (obj: any) => {
  return JSON.stringify(obj, (key, value) => (typeof value === 'bigint' ? value.toString() : value), 2);
};

const ExplorerName: FC<{ contractAddress: string; chainId: number }> = ({ contractAddress, chainId }) => {
  const account = useActiveAccount();
  const NETWORK = defineChain(4689);
  const [functionInputs, setFunctionInputs] = useState<{ [key: string]: any }>({});
  const [transactionError, setTransactionError] = useState<string | null>(null);
  const [output, setOutput] = useState<any>(null);
 

  const handleRunDeployContract = async () => {
    if (!account) throw new Error("Account not connected");
  
    try {
      const contractAddresse = await deployERC721Contract({
        chain: NETWORK,
        client,
        account,
        type: "DropERC721",
        params: {
          name: "MyNFT",
          description: "My NFT contract",
          symbol: "NFT",
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
 

  return (
    <div className={`${styles.flex} ${styles.hScreen}`}>
      <div className={`${styles.wFull} ${styles.p5}`}>
        <h2 className={`${styles.mb4} ${styles.textXl} ${styles.fontBold}`}>Execute Name Function</h2>

        <button
          onClick={handleRunDeployContract}
          className={`${styles.px4} ${styles.py2} ${styles.mt4} ${styles.textWhite} ${styles.bgBlue500} ${styles.rounded} ${styles.hoverBgBlue600}`}
        >
          Run
        </button>
        {transactionError && (
          <div className={`${styles.mt4} ${styles.textRed500}`}>{transactionError}</div>
        )}
        {output && (
          <pre className={`${styles.mt4} ${styles.p4} ${styles.bgGray900} ${styles.textWhite} ${styles.border} ${styles.rounded}`}>
            {stringifyWithBigInt(output)}
          </pre>
        )}
      </div>
    </div>
  );
};

export default ExplorerName;
