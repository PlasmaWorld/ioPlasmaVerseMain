"use client";

import React, { FC, useState, ChangeEvent, useCallback, useEffect } from "react";
import { TransactionButton, useActiveAccount } from "thirdweb/react";
import {
  defineChain,
  getContract,
  prepareContractCall,
  PreparedTransaction,
  readContract,
  resolveMethod,
  ThirdwebContract,
} from "thirdweb";
import { BigNumber } from "ethers";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { coy } from "react-syntax-highlighter/dist/esm/styles/prism";
import client from "@/lib/client";
import styles from './explorer.module.css';
import {
  claimTo,
  getOwnedTokenIds,
  getAllOwners,
  tokenOfOwnerByIndex,
} from "thirdweb/extensions/erc721";

interface Attribute {
  trait_type: string;
  value: string | number;
}

type FunctionDefinition = {
  inputs: string[];
};

const functionDefinitions: Record<string, Record<string, FunctionDefinition>> = {
  ERC721: {
    approve: { inputs: ["to", "tokenId"] },
    safeTransferFrom: { inputs: ["from", "to", "tokenId"] },
    safeTransferFromWithData: { inputs: ["from", "to", "tokenId", "data"] },
    setApprovalForAll: { inputs: ["operator"] },
    transferFrom: { inputs: ["from", "to", "tokenId"] },
  },
  ERC721Burnable: {
    burn: { inputs: ["tokenId"] },
  },
  ERC721LazyMintable: {
    lazyMint: { inputs: ["amount", "baseURI", "extraData"] },
  },
  ERC721Revealable: {
    reveal: { inputs: ["identifier", "key"] },
  },
  ERC721ClaimPhasesV2: {
    claim: { inputs: ["receiver", "quantity", "currency", "pricePerToken", "allowlistProof", "data"] },
    claimTo: { inputs: ["toAddress", "quantity"] },
    setClaimConditions: { inputs: ["phases"] },
  },
  Royalty: {
    setDefaultRoyaltyInfo: { inputs: ["royaltyRecipient", "royaltyBps"] },
    setRoyaltyInfoForToken: { inputs: ["tokenId", "royaltyRecipient", "royaltyBps"] },
  },
  PlatformFee: {
    setPlatformFeeInfo: { inputs: ["platformFeeRecipient", "platformFeeBps"] },
  },
  PrimarySale: {
    setPrimarySaleRecipient: { inputs: ["saleRecipient"] },
  },
  Permissions: {
    grantRole: { inputs: ["role","saleRecipient"] },
    renounceRole: { inputs: ["role","saleRecipient"] },
    revokeRole: { inputs: ["role","saleRecipient"] },

  },
  Ownable: {
    setOwner: { inputs: ["newOwner"] },
  },
  ContractMetadata: {
    setContractURI: { inputs: ["uri"] },
  },
  OtherFunctions: {
    freezeBatchBaseURI: { inputs: ["index"] },
    multicall: { inputs: ["data"] },
    setFlatPlatformFeeInfo: { inputs: ["PlatformFeeRecipient", "Flat Fee"] },
    setMaxTotalSupply: { inputs: ["MaxTotalSupply"]  },
    setPlatformFeeType: { inputs: ["FeeType"]  },
    updateBatchBaseURI: { inputs: ["index", "uri"]  },



  },
};

const functionDefinitionsDefault: Record<string, Record<string, FunctionDefinition>> = {
  ERC721: {
    approve: { inputs: ["to", "tokenId"] },
    safeTransferFrom: { inputs: ["from", "to", "tokenId"] },
    safeTransferFromWithData: { inputs: ["from", "to", "tokenId", "data"] },
    setApprovalForAll: { inputs: ["operator"] },
    transferFrom: { inputs: ["from", "to", "tokenId"] },
  },
  };

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
    getOwnedTokenIds: { inputs: ["owner"] },
    getAllOwners: { inputs: ["start", "count"] },
    tokenOfOwnerByIndex: { inputs: ["ownerAddress", "index"] },
  },
};

const readFunctionsDefault: ReadFunctions = {
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
    getAllOwners: { inputs: ["start", "count"] },
    tokenOfOwnerByIndex: { inputs: ["ownerAddress", "index"] },
  },
};

// Custom JSON stringify function to handle BigInt values
const stringifyWithBigInt = (obj: any) => {
  return JSON.stringify(obj, (key, value) => (typeof value === 'bigint' ? value.toString() : value), 2);
};

const Explorer: FC<{ contractAddress: string; chainId: number }> = ({
  contractAddress,
  chainId,
}) => {
  const account = useActiveAccount();
  const NETWORK = defineChain(chainId);
  const [selectedFunction, setSelectedFunction] = useState<string | null>(null);
  const [functionInputs, setFunctionInputs] = useState<{ [key: string]: string }>({});
  const [transactionError, setTransactionError] = useState<string | null>(null);
  const [output, setOutput] = useState<any>(null);
  const [showBaseFile, setShowBaseFile] = useState<boolean>(true);
  const [functionType, setFunctionType] = useState<"read" | "write">("write");
  const [contractType, setContractType] = useState<any>(null);

  const contract: ThirdwebContract = getContract({
    address: contractAddress,
    client,
    chain: NETWORK,
  });

  const handleFunctionChange = (fn: string) => {
    setSelectedFunction(fn);
    setFunctionInputs({});
    setTransactionError(null);
    setOutput(null);
    setShowBaseFile(true);
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFunctionInputs({ ...functionInputs, [e.target.name]: e.target.value });
  };

  const handleRunFunctionCustom = async () => {
    try {
      let result;
      switch (selectedFunction) {
        case "OtherFunctions.getOwnedTokenIds":
          result = await getOwnedTokenIds({
            contract,
            owner: functionInputs.owner,
          });
          break;
        case "OtherFunctions.getAllOwners":
          result = await getAllOwners({
            contract,
            start: Number(functionInputs.start),
            count: Number(functionInputs.count),
          });
          break;
        case "OtherFunctions.tokenOfOwnerByIndex":
          result = await tokenOfOwnerByIndex({
            contract,
            owner: functionInputs.ownerAddress,
            index: BigInt(functionInputs.index),
          });
          break;
        default:
          throw new Error("Function not supported");
      }
      setOutput(result);
    } catch (error: unknown) {
      if (error instanceof Error) {
        setTransactionError(error.message);
      } else {
        setTransactionError(String(error));
      }
    }
  };

  useEffect(() => {
    fetchContractType(contract);
  }, [contract]);

  const fetchContractType = useCallback(async (contract: ThirdwebContract) => {
    if (!contract) return;
    try {
      const type = await readContract({
        contract,
        method: resolveMethod("contractType"),
        params: [],
      });

      if (type && type.length > 0) {
        setContractType(type);
      } else {
        setContractType("Unknown");
      }
    } catch (error) {
      console.error(error);
    }
  }, []);

  const handleRunFunction = useCallback(async () => {
    if (!selectedFunction) return;

    try {
      let result;
      switch (selectedFunction) {
        case "getOwnedTokenIds":
          result = await getOwnedTokenIds({
            contract,
            owner: functionInputs.owner,
          });
          break;
        case "getAllOwners":
          result = await getAllOwners({
            contract,
            start: Number(functionInputs.start),
            count: Number(functionInputs.count),
          });
          break;
        case "tokenOfOwnerByIndex":
          result = await tokenOfOwnerByIndex({
            contract,
            owner: functionInputs.ownerAddress,
            index: BigInt(functionInputs.index),
          });
          break;
        default:
          const [extension, fnName] = selectedFunction.split(".");
          const { inputs } = readFunctions[extension]?.[fnName] ?? { inputs: [] };
          const params = inputs.map((input) => functionInputs[input]);
          result = await readContract({
            contract,
            method: resolveMethod(fnName),
            params,
          });
          break;
      }
      setOutput(processOutput(result));
    } catch (error) {
      setTransactionError(error instanceof Error ? error.message : String(error));
    }
  }, [selectedFunction, functionInputs, contract]);

  const processOutput = (output: any) => {
    if (typeof output === "bigint") {
      return output.toString();
    } else if (output instanceof BigNumber) {
      return output.toString();
    } else if (Array.isArray(output)) {
      return output.map((item) =>
        typeof item === "bigint" || item instanceof BigNumber ? item.toString() : item
      );
    } else if (typeof output === "object" && output !== null) {
      const processed: { [key: string]: any } = {};
      for (const key in output) {
        processed[key] =
          typeof output[key] === "bigint" || output[key] instanceof BigNumber
            ? output[key].toString()
            : output[key];
      }
      return processed;
    } else {
      return output;
    }
  };

  const prepareTransaction = async (): Promise<PreparedTransaction<any>> => {
    if (!selectedFunction || !account)
      throw new Error("Account or function not selected");

    const [contractName, methodName] = selectedFunction.split(".");
    const functionDefinition = functionDefinitions[contractName]?.[methodName];
    if (!functionDefinition) throw new Error("Unsupported function");

    const { inputs } = functionDefinition;
    const params = inputs.map((input) => {
      if (!functionInputs[input]) throw new Error(`Missing input: ${input}`);
      return input === "tokenId"
        ? BigNumber.from(functionInputs[input])
        : functionInputs[input];
    });

    const resolvedMethod = await resolveMethod(methodName);
    const transaction = await prepareContractCall({
      contract,
      method: resolvedMethod,
      params,
    });

    return transaction;
  };

  const handleTransactionSent = () => {
    console.log("Transaction sent");
  };

  const handleTransactionConfirmed = () => {
    console.log("Transaction confirmed");
  };

  const handleTransactionError = (error: Error) => {
    console.error(error);
    setTransactionError(error.message);
  };

  const getBaseFileCode = () => {
    if (!selectedFunction) return "";

    const [contractName, methodName] = selectedFunction.split(".");
    const functionDefinition = functionDefinitions[contractName]?.[methodName];
    if (!functionDefinition) return "";

    const inputs = functionDefinition.inputs
      .map(
        (input) => `            <input
                type="text"
                name="${input}"
                placeholder="${input}"
                value={functionInputs.${input}}
                onChange={handleInputChange}
                className={\`\${styles.wFull} \${styles.mb2} \${styles.px4} \${styles.py2} \${styles.border} \${styles.rounded}\`}
            />`
      )
      .join("\n");

    return `
"use client";

import React, { FC, useState, ChangeEvent } from "react";
import { defineChain, getContract, ThirdwebContract } from "thirdweb";
import { BigNumber } from "ethers";
import styles from './explorer.module.css';
import { useActiveAccount, TransactionButton } from "thirdweb/react";
import { prepareContractCall, PreparedTransaction, resolveMethod } from "thirdweb";
import client from "@/lib/client";

const Explorer${methodName.charAt(0).toUpperCase() + methodName.slice(1)}: FC<{ contractAddress: string; chainId: number }> = ({ contractAddress, chainId }) => {
  const account = useActiveAccount();
  const NETWORK = defineChain(${chainId});
  const [functionInputs, setFunctionInputs] = useState<{ ${functionDefinition.inputs
      .map((input) => `${input}: string`)
      .join("; ")} }>({ ${functionDefinition.inputs
      .map((input) => `${input}: ''`)
      .join(", ")} });
  const [transactionError, setTransactionError] = useState<string | null>(null);

  const contract: ThirdwebContract = getContract({
    address: contractAddress,
    client,
    chain: NETWORK,
  });

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFunctionInputs({ ...functionInputs, [e.target.name]: e.target.value });
  };

  const prepareTransaction = async (): Promise<PreparedTransaction<any>> => {
    if (!account) throw new Error("Account not connected");

    const { ${functionDefinition.inputs.join(", ")} } = functionInputs;
    if (${functionDefinition.inputs.map((input) => `!${input}`).join(" || ")})
      throw new Error("Missing input");

    const method = "${methodName}";
    const params = [${functionDefinition.inputs
      .map((input) =>
        input === "tokenId" ? `BigNumber.from(${input})` : input
      )
      .join(", ")}];

    const resolvedMethod = await resolveMethod(method);
    const transaction = await prepareContractCall({
      contract,
      method: resolvedMethod,
      params,
    });

    return transaction;
  };

  const handleTransactionSent = () => {
    console.log("Transaction sent");
  };

  const handleTransactionConfirmed = () => {
    console.log("Transaction confirmed");
  };

  const handleTransactionError = (error: Error) => {
    console.error(error);
    setTransactionError(error.message);
  };

  return (
    <div className={\`\${styles.flex} \${styles.hScreen}\`}>
      <div className={\`\${styles.wFull} \${styles.p5}\`}>
        <h2 className={\`\${styles.mb4} \${styles.textXl} \${styles.fontBold}\`}>Execute ${methodName.charAt(0).toUpperCase() + methodName.slice(1)} Function</h2>
${inputs}
        <TransactionButton
          transaction={prepareTransaction}
          onTransactionSent={handleTransactionSent}
          onTransactionConfirmed={handleTransactionConfirmed}
          onError={handleTransactionError}
          className={\`\${styles.px4} \${styles.py2} \${styles.mt4} \${styles.textWhite} \${styles.bgBlue500} \${styles.rounded} \${styles.hoverBgBlue600}\`}
        >
          Run
        </TransactionButton>
        {transactionError && (
          <div className={\`\${styles.mt4} \${styles.textRed500}\`}>{transactionError}</div>
        )}
      </div>
    </div>
  );
};

export default Explorer${methodName.charAt(0).toUpperCase() + methodName.slice(1)};
    `;
  };

  const getCssFileCode = () => `
/* explorer.module.css */
.flex {
  display: flex;
}
.hScreen {
  height: 100vh;
}
.wFull {
  width: 100%;
}
.p5 {
  padding: 1.25rem;
}
.mb4 {
  margin-bottom: 1rem;
}
.textXl {
  font-size: 1.25rem;
}
.fontBold {
  font-weight: bold;
}
.mb2 {
  margin-bottom: 0.5rem;
}
.px4 {
  padding-left: 1rem;
  padding-right: 1rem;
}
.py2 {
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
}
.border {
  border: 1px solid #ddd;
}
.rounded {
  border-radius: 0.25rem;
}
.mt4 {
  margin-top: 1rem;
}
.textWhite {
  color: #fff;
}
.bgBlue500 {
  background-color: #4299e1;
}
.hoverBgBlue600:hover {
  background-color: #3182ce;
}
.textRed500 {
  color: #f56565;
}
.borderR {
  border-right: 1px solid #ddd;
}
.borderGray300 {
  border-color: #d1d5db;
}
.scrollableList {
  overflow-y: auto;
}
.w1_3 {
  width: 33.333%;
}
.w2_3 {
  width: 66.666%;
}
.block {
  display: block;
}
.textLeft {
  text-align: left;
}
.hoverBgGray200:hover {
  background-color: #edf2f7;
}
`;

  const getBaseFileCodeRead = () => {
    if (!selectedFunction) return "";

    const [contractName, methodName] = selectedFunction.split(".");
    const functionDefinition = readFunctions[contractName]?.[methodName];
    if (!functionDefinition) return "";

    const inputs = functionDefinition.inputs
      .map(
        (input) => `            <input
                type="text"
                name="${input}"
                placeholder="${input}"
                value={functionInputs.${input}}
                onChange={handleInputChange}
                className={\`\${styles.wFull} \${styles.mb2} \${styles.px4} \${styles.py2} \${styles.border} \${styles.rounded}\`}
            />`
      )
      .join("\n");

    return `
"use client";

import React, { FC, useState, ChangeEvent } from "react";
import { defineChain, getContract, ThirdwebContract } from "thirdweb";
import { BigNumber } from "ethers";
import styles from './explorer.module.css';
import { useActiveAccount } from "thirdweb/react";
import { readContract, resolveMethod } from "thirdweb";
import client from "@/lib/client";

const Explorer${methodName.charAt(0).toUpperCase() + methodName.slice(1)}: FC<{ contractAddress: string; chainId: number }> = ({ contractAddress, chainId }) => {
  const account = useActiveAccount();
  const NETWORK = defineChain(${chainId});
  const [functionInputs, setFunctionInputs] = useState<{ ${functionDefinition.inputs
      .map((input) => `${input}: string`)
      .join("; ")} }>({ ${functionDefinition.inputs
      .map((input) => `${input}: ''`)
      .join(", ")} });
  const [transactionError, setTransactionError] = useState<string | null>(null);
  const [output, setOutput] = useState<any>(null);

  const contract: ThirdwebContract = getContract({
    address: contractAddress,
    client,
    chain: NETWORK,
  });

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFunctionInputs({ ...functionInputs, [e.target.name]: e.target.value });
  };

  const handleRunFunction = async () => {
    if (!account) throw new Error("Account not connected");

    const { ${functionDefinition.inputs.join(", ")} } = functionInputs;
    if (${functionDefinition.inputs.map((input) => `!${input}`).join(" || ")})
      throw new Error("Missing input");

    const method = "${methodName}";
    const params = [${functionDefinition.inputs
      .map((input) =>
        input === "tokenId" ? `BigNumber.from(${input})` : input
      )
      .join(", ")}];

    const result = await readContract({
      contract,
      method: resolveMethod(method),
      params,
    });

    setOutput(result);
  };

  const processOutput = (output: any) => {
    if (typeof output === "bigint") {
      return output.toString();
    } else if (output instanceof BigNumber) {
      return output.toString();
    } else if (Array.isArray(output)) {
      return output.map((item) =>
        typeof item === "bigint" || item instanceof BigNumber ? item.toString() : item
      );
    } else if (typeof output === "object" && output !== null) {
      const processed: { [key: string]: any } = {};
      for (const key in output) {
        processed[key] =
          typeof output[key] === "bigint" || output[key] instanceof BigNumber
            ? output[key].toString()
            : output[key];
      }
      return processed;
    } else {
      return output;
    }
  };

  return (
    <div className={\`\${styles.flex} \${styles.hScreen}\`}>
      <div className={\`\${styles.wFull} \${styles.p5}\`}>
        <h2 className={\`\${styles.mb4} \${styles.textXl} \${styles.fontBold}\`}>Execute ${methodName.charAt(0).toUpperCase() + methodName.slice(1)} Function</h2>
${inputs}
        <button
          onClick={handleRunFunction}
          className={\`\${styles.px4} \${styles.py2} \${styles.mt4} \${styles.textWhite} \${styles.bgBlue500} \${styles.rounded} \${styles.hoverBgBlue600}\`}
        >
          Run
        </button>
        {transactionError && (
          <div className={\`\${styles.mt4} \${styles.textRed500}\`}>{transactionError}</div>
        )}
        {output && (
          <pre className={\`\${styles.mt4} \${styles.p4} \${styles.bgGray900} \${styles.textWhite} \${styles.border} \${styles.rounded}\`}>
            {stringifyWithBigInt(output)}
          </pre>
        )}
      </div>
    </div>
  );
};

export default Explorer${methodName.charAt(0).toUpperCase() + methodName.slice(1)};
    `;
  };

  const getCssFileCodeRead = () => `
/* explorer.module.css */
.flex {
  display: flex;
}
.hScreen {
  height: 100vh;
}
.wFull {
  width: 100%;
}
.p5 {
  padding: 1.25rem;
}
.mb4 {
  margin-bottom: 1rem;
}
.textXl {
  font-size: 1.25rem;
}
.fontBold {
  font-weight: bold;
}
.mb2 {
  margin-bottom: 0.5rem;
}
.px4 {
  padding-left: 1rem;
  padding-right: 1rem;
}
.py2 {
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
}
.border {
  border: 1px solid #ddd;
}
.rounded {
  border-radius: 0.25rem;
}
.mt4 {
  margin-top: 1rem;
}
.textWhite {
  color: #fff;
}
.bgBlue500 {
  background-color: #4299e1;
}
.hoverBgBlue600:hover {
  background-color: #3182ce;
}
.textRed500 {
  color: #f56565;
}
.borderR {
  border-right: 1px solid #ddd;
}
.borderGray300 {
  border-color: #d1d5db;
}
.scrollableList {
  overflow-y: auto;
}
.w1_3 {
  width: 33.333%;
}
.w2_3 {
  width: 66.666%;
}
.block {
  display: block;
}
.textLeft {
  text-align: left;
}
.hoverBgGray200:hover {
  background-color: #edf2f7;
}
`;

  return (
    <div className={styles.container}>
      <div className={styles.flex}>
        <div className={`${styles.w1_3} ${styles.scrollableListRead}`}>
          <button
            onClick={() => setFunctionType("write")}
            className={`${styles.px4} ${styles.py2} ${styles.mr2} ${styles.rounded} ${
              functionType === "write" ? styles.bgBlue500 + " " + styles.textWhite : styles.bgGray200
            }`}
          >
            Write Functions
          </button>
          <button
            onClick={() => setFunctionType("read")}
            className={`${styles.px4} ${styles.py2} ${styles.rounded} ${
              functionType === "read" ? styles.bgBlue500 + " " + styles.textWhite : styles.bgGray200
            }`}
          >
            Read Functions
          </button>

          {functionType === "read" && (
            <div>
              <h2 className={`${styles.mb4} ${styles.textXl} ${styles.fontBold}`}>Function Explorer - Read</h2>
              {Object.keys(contractType === "0x44726f7045524337323100000000000000000000000000000000000000000000" ? readFunctions : readFunctionsDefault).map((extension) => (
                <div key={extension}>
                  <h3 className={`${styles.mb4} ${styles.textLg} ${styles.fontBold}`}>{extension}</h3>
                  {Object.keys(contractType === "0x44726f7045524337323100000000000000000000000000000000000000000000" ? readFunctions[extension] : readFunctionsDefault[extension]).map((fn) => (
                    <button
                      key={fn}
                      className={`${styles.block} ${styles.wFull} ${styles.mb2} ${styles.px4} ${styles.py2} ${styles.textLeft} ${styles.border} ${styles.rounded} ${styles.hoverBgGray200}`}
                      onClick={() => handleFunctionChange(`${extension}.${fn}`)}
                    >
                      {fn}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          )}

          {functionType === "write" && (
            <div>
              <h2 className={`${styles.mb4} ${styles.textXl} ${styles.fontBold}`}>Function Explorer - Write</h2>
              {Object.keys(contractType === "0x44726f7045524337323100000000000000000000000000000000000000000000" ? functionDefinitions : functionDefinitionsDefault).map((contractName) => (
                <div key={contractName}>
                  <h3 className={`${styles.mb4} ${styles.textLg} ${styles.fontBold}`}>{contractName}</h3>
                  {Object.keys(contractType === "0x44726f7045524337323100000000000000000000000000000000000000000000" ? functionDefinitions[contractName] : functionDefinitionsDefault[contractName]).map((fn) => (
                    <button
                      key={fn}
                      className={`${styles.block} ${styles.wFull} ${styles.mb2} ${styles.px4} ${styles.py2} ${styles.textLeft} ${styles.border} ${styles.rounded} ${styles.hoverBgGray200}`}
                      onClick={() => handleFunctionChange(`${contractName}.${fn}`)}
                    >
                      {fn}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={`${styles.w2_3} ${styles.scrollableList}`}>
          {selectedFunction && (
            <div>
              <h3 className={`${styles.mb4} ${styles.textXl} ${styles.fontBold}`}>{selectedFunction}</h3>
              {functionType === "read" && selectedFunction.split(".").length === 2 &&
              (contractType === "0x44726f7045524337323100000000000000000000000000000000000000000000" ? readFunctions : readFunctionsDefault)[selectedFunction.split(".")[0]]?.[selectedFunction.split(".")[1]]?.inputs ? (
                (contractType === "0x44726f7045524337323100000000000000000000000000000000000000000000" ? readFunctions : readFunctionsDefault)[selectedFunction.split(".")[0]]?.[selectedFunction.split(".")[1]]?.inputs.map((input, index) => (
                  <input
                    key={index}
                    type="text"
                    name={input}
                    placeholder={input}
                    onChange={handleInputChange}
                    className={`${styles.wFull} ${styles.mb2} ${styles.px4} ${styles.py2} ${styles.border} ${styles.rounded}`}
                  />
                ))
              ) : (
                functionType === "write" && selectedFunction.split(".").length === 2 &&
                (contractType === "0x44726f7045524337323100000000000000000000000000000000000000000000" ? functionDefinitions : functionDefinitionsDefault)[selectedFunction.split(".")[0]]?.[selectedFunction.split(".")[1]]?.inputs && (
                  (contractType === "0x44726f7045524337323100000000000000000000000000000000000000000000" ? functionDefinitions : functionDefinitionsDefault)[selectedFunction.split(".")[0]][selectedFunction.split(".")[1]].inputs.map((input, index) => (
                    <input
                      key={index}
                      type="text"
                      name={input}
                      placeholder={input}
                      onChange={handleInputChange}
                      className={`${styles.wFull} ${styles.mb2} ${styles.px4} ${styles.py2} ${styles.border} ${styles.rounded}`}
                    />
                  ))
                )
              )}
              {functionType === "write" && selectedFunction === "ERC721ClaimPhasesV2.claimTo" ? (
                <TransactionButton
                  transaction={() =>
                    claimTo({
                      contract,
                      to: functionInputs.toAddress,
                      quantity: BigInt(functionInputs.quantity),
                    })
                  }
                  onTransactionConfirmed={() => {
                    alert("NFT Claimed!");
                    setFunctionInputs({});
                  }}
                  className={`${styles.px4} ${styles.py2} ${styles.mt4} ${styles.textWhite} ${styles.bgBlue500} ${styles.rounded} ${styles.hoverBgBlue600}`}
                >
                  Claim NFT
                </TransactionButton>
              ) : (
                functionType === "write" ? (
                  <TransactionButton
                    transaction={prepareTransaction}
                    onTransactionSent={handleTransactionSent}
                    onTransactionConfirmed={handleTransactionConfirmed}
                    onError={handleTransactionError}
                    className={`${styles.px4} ${styles.py2} ${styles.mt4} ${styles.textWhite} ${styles.bgBlue500} ${styles.rounded} ${styles.hoverBgBlue600}`}
                  >
                    Run
                  </TransactionButton>
                ) : (
                  <>
                    {selectedFunction === "OtherFunctions.getOwnedTokenIds" ? (
                      <button
                        onClick={handleRunFunctionCustom}
                        className={`${styles.px4} ${styles.py2} ${styles.mt4} ${styles.textWhite} ${styles.bgBlue500} ${styles.rounded} ${styles.hoverBgBlue600}`}
                      >
                        Run
                      </button>
                    ) : selectedFunction === "OtherFunctions.getAllOwners" ? (
                      <button
                        onClick={handleRunFunctionCustom}
                        className={`${styles.px4} ${styles.py2} ${styles.mt4} ${styles.textWhite} ${styles.bgBlue500} ${styles.rounded} ${styles.hoverBgBlue600}`}
                      >
                        Run
                      </button>
                    ) : selectedFunction === "OtherFunctions.tokenOfOwnerByIndex" ? (
                      <button
                        onClick={handleRunFunctionCustom}
                        className={`${styles.px4} ${styles.py2} ${styles.mt4} ${styles.textWhite} ${styles.bgBlue500} ${styles.rounded} ${styles.hoverBgBlue600}`}
                      >
                        Run
                      </button>
                    ) : (
                      <button
                        onClick={handleRunFunction}
                        className={`${styles.px4} ${styles.py2} ${styles.mt4} ${styles.textWhite} ${styles.bgBlue500} ${styles.rounded} ${styles.hoverBgBlue600}`}
                      >
                        Run
                      </button>
                    )}
                  </>
                )
              )}
              {output && (
                <pre className={`${styles.mt4} ${styles.p4} ${styles.bgGray900} ${styles.textWhite} ${styles.border} ${styles.rounded}`}>
                  {stringifyWithBigInt(output)}
                </pre>
              )}
                            <div className={styles.codeContainer}>

              <div className={styles.buttonContainer}>
                <button
                  onClick={() => setShowBaseFile(true)}
                  className={`${styles.px4} ${styles.py2} ${styles.mt4} ${showBaseFile ? styles.bgBlue500 : styles.bgGray500} ${styles.rounded} ${styles.hoverBgBlue600}`}
                >
                  Code
                </button>
                <button
                  onClick={() => setShowBaseFile(false)}
                  className={`${styles.px4} ${styles.py2} ${styles.mt4} ${!showBaseFile ? styles.bgBlue500 : styles.bgGray500} ${styles.rounded} ${styles.hoverBgBlue600}`}
                >
                  CSS
                </button>
              </div>
              <div
                className={`${styles.mt4} ${styles.maxH60} ${styles.overflowYScroll} ${styles.bgGray900} ${styles.textWhite} ${styles.border} ${styles.rounded}`}
              >
                <SyntaxHighlighter language="javascript" style={coy}>
                  {showBaseFile ? (functionType === "read" ? getBaseFileCodeRead() : getBaseFileCode()) : (functionType === "read" ? getCssFileCodeRead() : getCssFileCode())}
                </SyntaxHighlighter>
              </div>
            </div>
            </div>
          )}
          {transactionError && <div className={`${styles.mt4} ${styles.textRed500}`}>{transactionError}</div>}
        </div>
      </div>
    </div>
  );
};

export default Explorer;