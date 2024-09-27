"use client";

import React, { FC, useState, useCallback } from "react";
import { useActiveAccount } from "thirdweb/react";
import { defineChain, getContract, readContract, resolveMethod, ThirdwebContract } from "thirdweb";
import { BigNumber } from "ethers";
import client from "@/lib/client";
import styles from './explorer.module.css';

interface Attribute {
  trait_type: string;
  value: string | number;
}

interface ReadFunction {
  inputs: string[];
}

interface ReadFunctions {
  [key: string]: {
    [key: string]: ReadFunction;
  };
}

const readFunctions: ReadFunctions = {
  ERC721: {
    balanceOf: { inputs: ["Owner"] },
    getApproved: { inputs: ["tokenId"] },
    isApprovedForAll: { inputs: ["Owner", "Operator"] },
    ownerOf: { inputs: ["tokenId"] },
    name: { inputs: [] },
    symbol: { inputs: [] },
    tokenURI: { inputs: ["tokenId"] },
  },
  ERC721Supply: {
    totalSupply: { inputs: [] },
  },
  ERC721Revealable: {
    encryptDecrypt: { inputs: ["Data", "Key"] },
  },
  Royalty: {
    getDefaultRoyaltyInfo: { inputs: [] },
    getDefaultRoyaltyToken: { inputs: ["tokenId"] },
    royaltyInfo: { inputs: ["tokenId", "SalePrice"] },
    supportsInterface: { inputs: ["InterfaceId"] },
  },
  PlatformFee: {
    getPlatformFeeInfo: { inputs: [] },
  },
  PrimarySale: {
    primarySaleRecipient: { inputs: [] },
  },
  Permissions: {
    getRoleAdmin: { inputs: ["Role"] },
    hasRole: { inputs: ["Role", "Account"] },
  },
  PermissionsEnumerable: {
    getRoleMember: { inputs: ["Role", "Index"] },
    getRoleMemberCount: { inputs: ["Role"] },
  },
  ContractMetadata: {
    contractURI: { inputs: [] },
  },
  Ownable: {
    owner: { inputs: [] },
  },
  Gasless: {
    isTrustedForwarder: { inputs: ["Forwarder"] },
  },
  OtherFunctions: {
    DEFAULT_ADMIN_ROLE: { inputs: [] },
    batchFrozen: { inputs: ["Key"] },
    claimCondition: { inputs: [] },
    contractType: { inputs: [] },
    contractVersion: { inputs: [] },
    encryptedData: { inputs: ["Key"] },
    getActiveClaimConditionId: { inputs: [] },
    getBaseURICount: { inputs: [] },
    getBatchIdAtIndex: { inputs: ["Index"] },
    getClaimConditionById: { inputs: ["ConditionId"] },
    getFlatPlatformFeeInfo: { inputs: [] },
    getPlatformFeeType: { inputs: [] },
    getRevealURI: { inputs: ["BatchId", "Key"] },
    getSupplyClaimedByWallet: { inputs: ["ConditionId", "Claimer"] },
    hasRoleWithSwitch: { inputs: ["Role", "Account"] },
    isEncryptedBatch: { inputs: ["BatchId"] },
    maxTotalSupply: { inputs: [] },
    nextTokenIdToClaim: { inputs: [] },
    nextTokenIdToMint: { inputs: [] },
    totalMinted: { inputs: [] },
    totalMintedByCondition: { inputs: ["ConditionId", "Claimer", "Quantity", "Currency", "PricePerToken", "AllowListProof"] },
  },
};


const ExplorerRead: FC<{ contractAddress: string; chainId: number }> = ({ contractAddress, chainId }) => {
  const account = useActiveAccount();
  const NETWORK = defineChain(chainId);
  const [selectedFunction, setSelectedFunction] = useState<string | null>(null);
  const [functionInputs, setFunctionInputs] = useState<any>({});
  const [transactionError, setTransactionError] = useState<string | null>(null);
  const [output, setOutput] = useState<any>(null);

  const contract: ThirdwebContract = getContract({
    address: contractAddress,
    client,
    chain: NETWORK,
  });

  const handleFunctionChange = (fn: string) => {
    setSelectedFunction(fn);
    setFunctionInputs({});
    setOutput(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFunctionInputs({ ...functionInputs, [e.target.name]: e.target.value });
  };

  const handleRunFunction = useCallback(async () => {
    if (!selectedFunction) return;

    const [extension, fnName] = selectedFunction.split(".");
    const { inputs } = readFunctions[extension][fnName];

    try {
      const params = inputs.map((input) => functionInputs[input]);
      const result = await readContract({
        contract,
        method: resolveMethod(fnName),
        params,
      });
      console.log('Raw result:', result);
      setOutput(processOutput(result));
    } catch (error: unknown) {
      console.error('Error:', error);
      setTransactionError(error instanceof Error ? error.message : String(error));
    }
  }, [selectedFunction, functionInputs, contract]);

  const processOutput = (output: any) => {
    if (typeof output === "bigint") {
      return output.toString();
    } else if (output instanceof BigNumber) {
      return output.toString();
    } else if (Array.isArray(output)) {
      return output.map(item => (typeof item === "bigint" || item instanceof BigNumber ? item.toString() : item));
    } else if (typeof output === 'object' && output !== null) {
      const processed: { [key: string]: any } = {};
      for (const key in output) {
        processed[key] = typeof output[key] === "bigint" || output[key] instanceof BigNumber ? output[key].toString() : output[key];
      }
      return processed;
    } else {
      return output;
    }
  };

  return (
    <div className={styles.flex + ' ' + styles.hScreen}>
      <div className={styles.w1_3 + ' ' + styles.p5 + ' ' + styles.borderR + ' ' + styles.borderGray300 + ' ' + styles.scrollableList}>
        <h2 className={styles.mb4 + ' ' + styles.textXl + ' ' + styles.fontBold}>Function Explorer - Read</h2>
        {Object.keys(readFunctions).map((extension) => (
          <div key={extension}>
            <h3 className={styles.mb4 + ' ' + styles.textLg + ' ' + styles.fontBold}>{extension}</h3>
            {Object.keys(readFunctions[extension]).map((fn) => (
              <button
                key={fn}
                className={styles.block + ' ' + styles.wFull + ' ' + styles.mb2 + ' ' + styles.px4 + ' ' + styles.py2 + ' ' + styles.textLeft + ' ' + styles.border + ' ' + styles.rounded + ' ' + styles.hoverBgGray200}
                onClick={() => handleFunctionChange(`${extension}.${fn}`)}
              >
                {fn}
              </button>
            ))}
          </div>
        ))}
      </div>
      <div className={styles.w2_3 + ' ' + styles.p5}>
        {selectedFunction && (
          <div>
            <h3 className={styles.mb4 + ' ' + styles.textXl + ' ' + styles.fontBold}>{selectedFunction}</h3>
            {readFunctions[selectedFunction.split(".")[0]][selectedFunction.split(".")[1]].inputs.map((input, index) => (
              <input
                key={index}
                type="text"
                name={input}
                placeholder={input}
                onChange={handleInputChange}
                className={styles.wFull + ' ' + styles.mb2 + ' ' + styles.px4 + ' ' + styles.py2 + ' ' + styles.border + ' ' + styles.rounded}
              />
            ))}
            <button
              onClick={handleRunFunction}
              className={styles.px4 + ' ' + styles.py2 + ' ' + styles.mt4 + ' ' + styles.textWhite + ' ' + styles.bgBlue500 + ' ' + styles.rounded + ' ' + styles.hoverBgBlue600}
            >
              Run
            </button>
          </div>
        )}
        {transactionError && (
          <div className={styles.mt4 + ' ' + styles.textRed500}>{transactionError}</div>
        )}
        {output && (
          <pre className={styles.mt4 + ' ' + styles.p4 + ' ' + styles.bgGray900 + ' ' + styles.textWhite + ' ' + styles.border + ' ' + styles.rounded}>
            {JSON.stringify(output, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
};

export default ExplorerRead;
