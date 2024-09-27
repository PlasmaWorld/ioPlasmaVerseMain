"use client";

import React, { FC, useState, ChangeEvent } from "react";
import { defineChain, getContract, ThirdwebContract } from "thirdweb";
import { BigNumber } from "ethers";
import styles from './explorer.module.css';
import { useActiveAccount, TransactionButton } from "thirdweb/react";
import { prepareContractCall, PreparedTransaction, resolveMethod } from "thirdweb";
import client from "@/lib/client";

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
  Ownable: {
    setOwner: { inputs: ["newOwner"] },
  },
  ContractMetadata: {
    setContractURI: { inputs: ["uri"] },
  },
};

const ExplorerWrite: FC<{ contractAddress: string; chainId: number }> = ({ contractAddress, chainId }) => {
  const account = useActiveAccount();
  const NETWORK = defineChain(chainId);
  const [selectedFunction, setSelectedFunction] = useState<string | null>(null);
  const [functionInputs, setFunctionInputs] = useState<{ [key: string]: string }>({});
  const [transactionError, setTransactionError] = useState<string | null>(null);
  const [showBaseFile, setShowBaseFile] = useState<boolean>(true);

  const contract: ThirdwebContract = getContract({
    address: contractAddress,
    client,
    chain: NETWORK,
  });

  const handleFunctionChange = (fn: string) => {
    setSelectedFunction(fn);
    setFunctionInputs({});
    setTransactionError(null);
    setShowBaseFile(true);
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFunctionInputs({ ...functionInputs, [e.target.name]: e.target.value });
  };

  const prepareTransaction = async (): Promise<PreparedTransaction<any>> => {
    if (!selectedFunction || !account) throw new Error("Account or function not selected");

    const [contractName, methodName] = selectedFunction.split(".");
    const functionDefinition = functionDefinitions[contractName][methodName];
    if (!functionDefinition) throw new Error("Unsupported function");

    const { inputs } = functionDefinition;
    const params = inputs.map((input) => {
      if (!functionInputs[input]) throw new Error(`Missing input: ${input}`);
      return input === "tokenId" ? BigNumber.from(functionInputs[input]) : functionInputs[input];
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
    if (!selectedFunction) return '';

    const [contractName, methodName] = selectedFunction.split(".");
    const functionDefinition = functionDefinitions[contractName][methodName];
    if (!functionDefinition) return '';

    const inputs = functionDefinition.inputs.map(input => `            <input
                type="text"
                name="${input}"
                placeholder="${input}"
                value={functionInputs.${input}}
                onChange={handleInputChange}
                className={\`\${styles.wFull} \${styles.mb2} \${styles.px4} \${styles.py2} \${styles.border} \${styles.rounded}\`}
            />`).join('\n');

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
  const NETWORK = defineChain(chainId);
  const [functionInputs, setFunctionInputs] = useState<{ ${functionDefinition.inputs.map(input => `${input}: string`).join('; ')} }>({ ${functionDefinition.inputs.map(input => `${input}: ''`).join(', ')} });
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

    const { ${functionDefinition.inputs.join(', ')} } = functionInputs;
    if (${functionDefinition.inputs.map(input => `!${input}`).join(' || ')}) throw new Error("Missing input");

    const method = "${methodName}";
    const params = [${functionDefinition.inputs.map(input => input === "tokenId" ? `BigNumber.from(${input})` : input).join(', ')}];

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

  return (
    <div className={`${styles.flex} ${styles.hScreen}`}>
      <div className={`${styles.w1_3} ${styles.p5} ${styles.borderR} ${styles.borderGray300} ${styles.scrollableList}`}>
        <h2 className={`${styles.mb4} ${styles.textXl} ${styles.fontBold}`}>Function Explorer - Write</h2>
        {Object.keys(functionDefinitions).map((contractName) => (
          <div key={contractName}>
            <h3 className={`${styles.mb4} ${styles.textLg} ${styles.fontBold}`}>{contractName}</h3>
            {Object.keys(functionDefinitions[contractName]).map((fn) => (
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
      <div className={`${styles.w2_3} ${styles.p5}`}>
        {selectedFunction && (
          <div>
            <h3 className={`${styles.mb4} ${styles.textXl} ${styles.fontBold}`}>{selectedFunction}</h3>
            {functionDefinitions[selectedFunction.split(".")[0]][selectedFunction.split(".")[1]].inputs.map((input, index) => (
              <input
                key={index}
                type="text"
                name={input}
                placeholder={input}
                onChange={handleInputChange}
                className={`${styles.wFull} ${styles.mb2} ${styles.px4} ${styles.py2} ${styles.border} ${styles.rounded}`}
              />
            ))}
            <TransactionButton
              transaction={prepareTransaction}
              onTransactionSent={handleTransactionSent}
              onTransactionConfirmed={handleTransactionConfirmed}
              onError={handleTransactionError}
              className={`${styles.px4} ${styles.py2} ${styles.mt4} ${styles.textWhite} ${styles.bgBlue500} ${styles.rounded} ${styles.hoverBgBlue600}`}
            >
              Run
            </TransactionButton>
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
            <div className={`${styles.mt4} ${styles.maxH60} ${styles.overflowYScroll} ${styles.bgGray900} ${styles.textWhite} ${styles.border} ${styles.rounded}`}>
              <pre className={styles.p4}>
                {showBaseFile ? getBaseFileCode() : getCssFileCode()}
              </pre>
            </div>
          </div>
        )}
        {transactionError && (
          <div className={`${styles.mt4} ${styles.textRed500}`}>{transactionError}</div>
        )}
      </div>
    </div>
  );
};

export default ExplorerWrite;
