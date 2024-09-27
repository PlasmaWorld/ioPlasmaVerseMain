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
  ownerOf,
  tokenURI,
} from "thirdweb/extensions/erc721";
import {
  tokenUri,
} from "thirdweb/extensions/erc1155";
import { decimals } from "thirdweb/src/extensions/erc20/read/decimals";
import { functionDefinitionsDefault, functionDefinitionsErc1155NFTCollection, functionDefinitionsErc1155NFTDrop, functionDefinitionsErc20TokenDrop, functionDefinitionsErc20TokenMint, functionDefinitionsERC721Drop, functionDefinitionsErc721NFTCollection, functionDefinitionsErc721OpenEdition, readFunctionsDefault, readFunctionsERC1155NFTCollection, readFunctionsERC1155NFTDrop, readFunctionsERC20Drop, readFunctionsERC20Mint, readFunctionsERC721NFTCollection, readFunctionsERC721NFTDropp, readFunctionsERC721OpenEdition } from "./ExplorerFunctionList";

interface Attribute {
  trait_type: string;
  value: string | number;
}

type FunctionDefinition = {
  inputs: string[];
};


interface ReadFunction {
  inputs: string[];
}

interface ReadFunctions {
  [key: string]: {
    [key: string]: ReadFunction;
  };
}

// Custom JSON stringify function to handle BigInt values
const stringifyWithBigInt = (obj: any) => {
  return JSON.stringify(obj, (key, value) => (typeof value === 'bigint' ? value.toString() : value), 2);
};

const Explorer: FC<{ contractAddress: string; chainId: number; type: string }> = ({
  contractAddress,
  chainId,
  type,
}) => {
  const account = useActiveAccount();
  const NETWORK = defineChain(chainId);
  const [selectedFunction, setSelectedFunction] = useState<string | null>(null);
  const [functionInputs, setFunctionInputs] = useState<{ [key: string]: string }>({});
  const [transactionError, setTransactionError] = useState<string | null>(null);
  const [output, setOutput] = useState<any>(null);
  const [showBaseFile, setShowBaseFile] = useState<boolean>(true);
  const [functionType, setFunctionType] = useState<"read" | "write">("write");
  const [readFunction, setReadFunction] = useState<ReadFunctions | null>(null);
  const [writeFunction, setWriteFunction] = useState<Record<string, Record<string, FunctionDefinition>> | null>(null);

  const contract: ThirdwebContract = getContract({
    address: contractAddress,
    client,
    chain: NETWORK,
  });

  const handleFunctionChange = (fn: string) => {
    const [contractName, methodName] = fn.split(".");
  
    // Define newInputs as an object that can have string keys and string values
    const newInputs: { [key: string]: string } = {};
  
    // Check if the function has defined inputs
    if (readFunction?.[contractName]?.[methodName]?.inputs) {
      readFunction[contractName][methodName].inputs.forEach((input: string) => {
        newInputs[input] = ""; // Initialize each input field with an empty string
      });
    }
  
    setFunctionInputs(newInputs);
    setTransactionError(null);
    setOutput(null);
    setSelectedFunction(fn);
  };
  

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFunctionInputs({ ...functionInputs, [e.target.name]: e.target.value });
  };

  const handleSelectFunctions = useCallback(() => {
    try {
      switch (type) {
        case "DropERC721":
          setReadFunction(readFunctionsERC721NFTDropp);
          setWriteFunction(functionDefinitionsERC721Drop);
          break;
        case "TokenERC721":
          setReadFunction(readFunctionsERC721NFTCollection);
          setWriteFunction(functionDefinitionsErc721NFTCollection);
          break;
        case "OpenEditionERC721":
          setReadFunction(readFunctionsERC721OpenEdition);
          setWriteFunction(functionDefinitionsErc721OpenEdition);
          break;
        case "DropERC1155":
          setReadFunction(readFunctionsERC1155NFTDrop);
          setWriteFunction(functionDefinitionsErc1155NFTDrop);
          break;
        case "TokenERC1155":
          setReadFunction(readFunctionsERC1155NFTCollection);
          setWriteFunction(functionDefinitionsErc1155NFTCollection);
          break;
        case "TokenERC20":
          setReadFunction(readFunctionsERC20Mint);
          setWriteFunction(functionDefinitionsErc20TokenMint);
          break;
        case "DropERC20":
          setReadFunction(readFunctionsERC20Drop);
          setWriteFunction(functionDefinitionsErc20TokenDrop);
          break;
        case "DefaultNFT":
          setReadFunction(readFunctionsDefault);
          setWriteFunction(functionDefinitionsDefault);
          break;
        default:
          throw new Error("Unsupported contract type");
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        setTransactionError(error.message);
      } else {
        setTransactionError(String(error));
      }
    }
  }, [type]);

  useEffect(() => {
    handleSelectFunctions();
  }, [handleSelectFunctions]);

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
          case "ERC721.ownerOf":
          result = await ownerOf({
            contract,
            tokenId:  BigInt(functionInputs.tokenId),
          });
          break;
          case "ERC721.tokenURI":
            result = await tokenURI({
              contract,
              tokenId:  BigInt(functionInputs.tokenURI),
            });
            break;
            case "ERC1155.uri":
            result = await tokenUri({
              contract,
              tokenId:  BigInt(functionInputs.uri),
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
          if (readFunction && readFunction[extension] && readFunction[extension][fnName]) {
            const { inputs } = readFunction[extension][fnName];
            const params = inputs.map((input: string) => functionInputs[input]);
            result = await readContract({
              contract,
              method: resolveMethod(fnName),
              params,
            });
          } else {
            throw new Error("Function not found");
          }
          break;
      }
      setOutput(processOutput(result));
    } catch (error) {
      setTransactionError(error instanceof Error ? error.message : String(error));
    }
  }, [selectedFunction, functionInputs, contract, readFunction]);

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
    if (!selectedFunction || !account) throw new Error("Account or function not selected");

    const [contractName, methodName] = selectedFunction.split(".");
    if (writeFunction && writeFunction[contractName] && writeFunction[contractName][methodName]) {
      const functionDefinition = writeFunction[contractName][methodName];
      const { inputs } = functionDefinition;

      const params = inputs.map((input: string) => {
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
    } else {
      throw new Error("Unsupported function");
    }
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
    <div className={styles.groupContainer}>
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

            {functionType === "read" && readFunction && (
              <div>
                <h2 className={`${styles.mb4} ${styles.textXl} ${styles.fontBold}`}>Function Explorer - Read</h2>
                {Object.keys(readFunction).map((extension) => (
                  <div key={extension}>
                    <h3 className={`${styles.mb4} ${styles.textLg} ${styles.fontBold}`}>{extension}</h3>
                    {Object.keys(readFunction[extension]).map((fn) => (
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

            {functionType === "write" && writeFunction && (
              <div>
                <h2 className={`${styles.mb4} ${styles.textXl} ${styles.fontBold}`}>Function Explorer - Write</h2>
                {Object.keys(writeFunction).map((contractName) => (
                  <div key={contractName}>
                    <h3 className={`${styles.mb4} ${styles.textLg} ${styles.fontBold}`}>{contractName}</h3>
                    {Object.keys(writeFunction[contractName]).map((fn) => (
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
                readFunction?.[selectedFunction.split(".")[0]]?.[selectedFunction.split(".")[1]]?.inputs ? (
                  readFunction[selectedFunction.split(".")[0]]?.[selectedFunction.split(".")[1]]?.inputs.map((input, index) => (
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
                  writeFunction?.[selectedFunction.split(".")[0]]?.[selectedFunction.split(".")[1]]?.inputs?.map((input, index) => (
                    <input
                      key={index}
                      type="text"
                      name={input}
                      placeholder={input}
                      onChange={handleInputChange}
                      className={`${styles.wFull} ${styles.mb2} ${styles.px4} ${styles.py2} ${styles.border} ${styles.rounded}`}
                    />
                  ))
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
                <div className={`${styles.mt4} ${styles.buttonContainer} ${styles.codeContainer}`}>
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
                  className={`${styles.mt4} ${styles.maxH60} ${styles.overflowYScroll} ${styles.bgGray900} ${styles.textWhite} ${styles.border} ${styles.rounded} ${styles.codeContainer}`}
                >
                 
                </div>
              </div>
            )}
            {transactionError && <div className={`${styles.mt4} ${styles.textRed500}`}>{transactionError}</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Explorer;