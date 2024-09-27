"use client";

import React, { FC, useState, useEffect, ChangeEvent, useCallback } from "react";
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

const stringifyWithBigInt = (obj: any) => {
  return JSON.stringify(obj, (key, value) => (typeof value === 'bigint' ? value.toString() : value), 2);
};

const ExplorerRead: FC<{ contractAddress: string; chainId: number; abi: any[] }> = ({
  contractAddress,
  chainId,
  abi,
}) => {
  const account = useActiveAccount();
  const NETWORK = defineChain(chainId);
  const [selectedFunction, setSelectedFunction] = useState<string | null>(null);
  const [functionInputs, setFunctionInputs] = useState<{ [key: string]: string }>({});
  const [transactionError, setTransactionError] = useState<string | null>(null);
  const [output, setOutput] = useState<any>(null);
  const [showBaseFile, setShowBaseFile] = useState<boolean>(true);
  const [functionType, setFunctionType] = useState<"read" | "write">("write");
  const [verifiedFunctions, setVerifiedFunctions] = useState<{ read: any[], write: any[] }>({ read: [], write: [] });

  const contract: ThirdwebContract = getContract({
    address: contractAddress,
    client,
    chain: NETWORK,
  });

  useEffect(() => {
    const verifyFunctions = async () => {
      const readFunctions: any[] = [];
      const writeFunctions: any[] = [];
      
      for (const item of abi) {
        if (item.type === "function") {
          try {
            if (item.stateMutability === 'view' || item.stateMutability === 'pure') {
              await readContract({
                contract,
                method: resolveMethod(item.name),
                params: item.inputs.map(() => "1"), // Dummy parameters
              });
              readFunctions.push(item);
            } else {
              writeFunctions.push(item);
            }
          } catch (error) {
            console.log(`Could not verify function: ${item.name}`);
          }
        }
      }

      setVerifiedFunctions({ read: readFunctions, write: writeFunctions });
    };

    verifyFunctions();
  }, [abi, contract]);

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

  const handleRunFunction = useCallback(async () => {
    if (!selectedFunction) return;

    try {
      let result;
      const fnName = selectedFunction.split(".")[1];
      const inputs = abi.find((item: any) => item.name === fnName)?.inputs || [];
      const params = inputs.map((input: any) => functionInputs[input.name]);

      result = await readContract({
        contract,
        method: resolveMethod(fnName),
        params,
      });

      setOutput(processOutput(result));
    } catch (error) {
      setTransactionError(error instanceof Error ? error.message : String(error));
    }
  }, [selectedFunction, functionInputs, contract, abi]);

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

    const fnName = selectedFunction.split(".")[1];
    const functionDefinition = abi.find((item: any) => item.name === fnName);
    if (!functionDefinition) throw new Error("Unsupported function");

    const { inputs } = functionDefinition;
    const params = inputs.map((input: any) => {
      if (!functionInputs[input.name]) throw new Error(`Missing input: ${input.name}`);
      return input.type === "uint256"
        ? BigNumber.from(functionInputs[input.name])
        : functionInputs[input.name];
    });

    const resolvedMethod = await resolveMethod(fnName);
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

    const fnName = selectedFunction.split(".")[1];
    const functionDefinition = abi.find((item: any) => item.name === fnName);
    if (!functionDefinition) return "";

    const inputs = functionDefinition.inputs
      .map(
        (input: any) => `            <input
                type="text"
                name="${input.name}"
                placeholder="${input.name}"
                value={functionInputs.${input.name}}
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

const Explorer${fnName.charAt(0).toUpperCase() + fnName.slice(1)}: FC<{ contractAddress: string; chainId: number }> = ({ contractAddress, chainId }) => {
  const account = useActiveAccount();
  const NETWORK = defineChain(${chainId});
  const [functionInputs, setFunctionInputs] = useState<{ ${functionDefinition.inputs
      .map((input: any) => `${input.name}: string`)
      .join("; ")} }>({ ${functionDefinition.inputs
      .map((input: any) => `${input.name}: ''`)
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

    const { ${functionDefinition.inputs.map((input: any) => input.name).join(", ")} } = functionInputs;
    if (${functionDefinition.inputs.map((input: any) => `!${input.name}`).join(" || ")})
      throw new Error("Missing input");

    const method = "${fnName}";
    const params = [${functionDefinition.inputs
      .map((input: any) =>
        input.type === "uint256" ? `BigNumber.from(${input.name})` : input.name
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
        <h2 className={\`\${styles.mb4} \${styles.textXl} \${styles.fontBold}\`}>Execute ${fnName.charAt(0).toUpperCase() + fnName.slice(1)} Function</h2>
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

export default Explorer${fnName.charAt(0).toUpperCase() + fnName.slice(1)};
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
    const functionDefinition = abi.find((item: any) => item.name === methodName);
    if (!functionDefinition) return "";

    const inputs = functionDefinition.inputs
      .map(
        (input: any) => `            <input
                type="text"
                name="${input.name}"
                placeholder="${input.name}"
                value={functionInputs.${input.name}}
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
      .map((input: any) => `${input.name}: string`)
      .join("; ")} }>({ ${functionDefinition.inputs
      .map((input: any) => `${input.name}: ''`)
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

    const { ${functionDefinition.inputs.map((input: any) => input.name).join(", ")} } = functionInputs;
    if (${functionDefinition.inputs.map((input: any) => `!${input.name}`).join(" || ")})
      throw new Error("Missing input");

    const method = "${methodName}";
    const params = [${functionDefinition.inputs
      .map((input: any) =>
        input.type === "uint256" ? `BigNumber.from(${input.name})` : input.name
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

  const { read: readFunctions, write: writeFunctions } = verifiedFunctions;

  return (
    <div className={styles.container}>
      <div className={styles.flex}>
        <div className={`${styles.w1_3} ${styles.scrollableList}`}>
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
              {readFunctions.map((fn: any, index: number) => (
                <button
                  key={index}
                  className={`${styles.block} ${styles.wFull} ${styles.mb2} ${styles.px4} ${styles.py2} ${styles.textLeft} ${styles.border} ${styles.rounded} ${styles.hoverBgGray200}`}
                  onClick={() => handleFunctionChange(`read.${fn.name}`)}
                >
                  {fn.name}
                </button>
              ))}
            </div>
          )}

          {functionType === "write" && (
            <div>
              <h2 className={`${styles.mb4} ${styles.textXl} ${styles.fontBold}`}>Function Explorer - Write</h2>
              {writeFunctions.map((fn: any, index: number) => (
                <button
                  key={index}
                  className={`${styles.block} ${styles.wFull} ${styles.mb2} ${styles.px4} ${styles.py2} ${styles.textLeft} ${styles.border} ${styles.rounded} ${styles.hoverBgGray200}`}
                  onClick={() => handleFunctionChange(`write.${fn.name}`)}
                >
                  {fn.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className={`${styles.w2_3} ${styles.scrollableList}`}>
          {selectedFunction && (
            <div>
              <h3 className={`${styles.mb4} ${styles.textXl} ${styles.fontBold}`}>{selectedFunction}</h3>
              {functionType === "read" && selectedFunction.split(".").length === 2 &&
              readFunctions.find((fn: any) => fn.name === selectedFunction.split(".")[1])?.inputs ? (
                readFunctions.find((fn: any) => fn.name === selectedFunction.split(".")[1])?.inputs.map((input: any, index: number) => (
                  <input
                    key={index}
                    type="text"
                    name={input.name}
                    placeholder={input.name}
                    onChange={handleInputChange}
                    className={`${styles.wFull} ${styles.mb2} ${styles.px4} ${styles.py2} ${styles.border} ${styles.rounded}`}
                  />
                ))
              ) : (
                functionType === "write" && selectedFunction.split(".").length === 2 &&
                writeFunctions.find((fn: any) => fn.name === selectedFunction.split(".")[1])?.inputs && (
                  writeFunctions.find((fn: any) => fn.name === selectedFunction.split(".")[1]).inputs.map((input: any, index: number) => (
                    <input
                      key={index}
                      type="text"
                      name={input.name}
                      placeholder={input.name}
                      onChange={handleInputChange}
                      className={`${styles.wFull} ${styles.mb2} ${styles.px4} ${styles.py2} ${styles.border} ${styles.rounded}`}
                    />
                  ))
                )
              )}
              {functionType === "write" && (
                <TransactionButton
                  transaction={prepareTransaction}
                  onTransactionSent={handleTransactionSent}
                  onTransactionConfirmed={handleTransactionConfirmed}
                  onError={handleTransactionError}
                  className={`${styles.px4} ${styles.py2} ${styles.mt4} ${styles.textWhite} ${styles.bgBlue500} ${styles.rounded} ${styles.hoverBgBlue600}`}
                >
                  Run
                </TransactionButton>
              )}
              {functionType === "read" && (
                <button
                  onClick={handleRunFunction}
                  className={`${styles.px4} ${styles.py2} ${styles.mt4} ${styles.textWhite} ${styles.bgBlue500} ${styles.rounded} ${styles.hoverBgBlue600}`}
                >
                  Run
                </button>
              )}
              {output && (
                <pre className={`${styles.mt4} ${styles.p4} ${styles.bgGray900} ${styles.textWhite} ${styles.border} ${styles.rounded}`}>
                  {stringifyWithBigInt(output)}
                </pre>
              )}
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
          )}
          {transactionError && <div className={`${styles.mt4} ${styles.textRed500}`}>{transactionError}</div>}
        </div>
      </div>
    </div>
  );
};

export default ExplorerRead;
