"use client";
import React, { FC, useEffect, useState } from "react";
import { MediaRenderer, TransactionButton, useActiveAccount, useReadContract } from "thirdweb/react";
import client from "@/lib/client";
import Skeleton from "@/components/Skeleton";
import { ADDRESS_ZERO, defineChain, getContract, NFT as NFTType } from "thirdweb";
import { useSwipeable } from "react-swipeable";
import Container from "../Container/Container";
import { getContractMetadata } from "thirdweb/extensions/common";
import { getNFT } from "thirdweb/extensions/erc721";
import { getActiveClaimCondition, nextTokenIdToMint, setClaimConditions } from "thirdweb/extensions/erc721";
import { ioUSDCondract, Merchendise } from "@/const/contracts";
import { Button, Select, TextInput } from "@mantine/core";
import toast from "react-hot-toast";
import cn from "classnames";
import { BigNumber } from "ethers";
import { useBasket } from "@/Hooks/BusketProvider";
import { getContractInstance } from "@/const/cotractInstance";
import styles from "./claim.module.css";
import toastStyle from "@/util/toastConfig";

const INPUT_STYLES = "block w-full py-3 px-4 mb-4 bg-transparent border border-white text-base box-shadow-md rounded-lg mb-4";
const LEGEND_STYLES = "mb-2 text-white/80";


type ClaimCondition = {
  pricePerToken: BigNumber;
  supplyClaimed: BigNumber;
  maxClaimableSupply: BigNumber;
  startTimestamp: BigNumber;
  quantityLimitPerWallet: BigNumber;
  merkleRoot: string;
  currency: string;
};

type INFTCardProps = {
  tokenId: bigint;
  contractAddress: string;
  chainId: number;
};

export const ClaimCardErc721: FC<INFTCardProps> = ({ tokenId, contractAddress, chainId }) => {
  const account = useActiveAccount();
  const { addProductToBasket } = useBasket();
  const [showInfo, setShowInfo] = useState(false);
  const [quantity, setQuantity] = useState<number>(1);
  const [size, setSize] = useState<string>('');
  const [customerDetails] = useState({ name: '', email: '', street: '', postcode: '', city: '', country: '' });
  const [currentNFT, setNFTY] = useState<NFTType | null>(null);
  const [previewInvoice, setPreviewInvoice] = useState(false);
  const [claimCondition2, setClaimCondition] = useState<ClaimCondition | null>(null);
  const [isMaxClaimableSupply, setMaxClaimableSupply] = useState(1);
  const [maxClaimablePerWallet, setMaxClaimablePerWallet] = useState(1);
  const [currencyAddress, setCurrencyAddress] = useState("");
  const [price, setPrice] = useState(1);
  const [SetStartTime, setStartTime] = useState(1);
  const NETWORK = defineChain(chainId); // Use chainIdNumber here

  const contract = getContract({
    address: contractAddress,
    client,
    chain: NETWORK,
  });

  const handleSetClaimCondition = async () => {
    
    const transaction = await setClaimConditions({
        contract,
        phases: [
          {
            maxClaimableSupply: BigInt(isMaxClaimableSupply),
            maxClaimablePerWallet: BigInt(maxClaimablePerWallet),
            currencyAddress: currencyAddress,
            price: price,
            startTime: new Date(),
          },
         ],
       });
       
       

    try {
      console.log("Transaction prepared:", transaction);
      return transaction;
    } catch (error) {
      console.error("Error in preparing transaction:", error);
      throw error;
    }
  };


 

  const handleSizeChange = (value: string | null) => {
    setSize(value || '');
  };

  const [ownerAddress, setOwnerAddress] = useState<string | null>(null);
  
  const handlers = useSwipeable({
    onSwipedLeft: () => setShowInfo(false),
    trackMouse: true,
  });

  const { data: contractMetadata } = useReadContract(getContractMetadata, {
    contract
  });

  const { data: totalNFTSupply } = useReadContract(nextTokenIdToMint, {
    contract
  });
  const { data: claimCondition } = useReadContract(getActiveClaimCondition, {
    contract,
  });

  const getPrice = (quantity: number): number => {
    const total = quantity * parseInt(claimCondition?.pricePerToken.toString() || "0");
    return parseFloat(total.toString());
  }
  const date = claimCondition?.startTimestamp
  ? new Date(Number(claimCondition.startTimestamp) * 1000).toLocaleString()
  : "No start date available";


  const claimedSupply = () => {
    return parseInt(claimCondition?.supplyClaimed.toString() || "0");
  }

  const maxClaimableSupply = () => {
    return parseInt(claimCondition?.maxClaimableSupply.toString() || "0");
  }

  const startTime = () => {
    const timestamp = parseInt(claimCondition?.startTimestamp.toString() || "0");
    return new Date(timestamp * 1000).toLocaleString(); // Convert to milliseconds and format as local date and time
  }

 
 


 

  return (
    <div
      className={styles.cardContainer}
      onClick={() => setShowInfo(true)}
      role="button"
      aria-label="Show more info"
    >
      {account && ownerAddress === account.address && (
        <div className={styles.topRightButton}>
          <button className={styles.iconButton}>
            {/* Add icon or text here */}
          </button>
        </div>
      )}
                                {!claimCondition && (
                                  <div>
                                     <p>Here you can set your ClaimCondition.</p>
                                     <p>
                                       Control when the NFTs get dropped, how much they cost, and
                                       more. click to set Condition
                                     </p>
                                     </div>
                                )}

                  {claimCondition &&  (
                    <div className={styles.claimConditionDetails}>
                      <p className={styles.headerText}>
                        This is currently a Public Claim Phase
                      </p>
                      <p className={styles.headerText}>
                        Allow any wallet to claim this drop during this claim
                        phase.
                      </p>

                      <div className={styles.claimDetail}>
                        Phase Start
                        <span>
                          {date}
                        </span>
                      </div>
                      <div className={styles.claimDetail}>
                        Nfts to drop
                        <span>
                          {claimCondition?.maxClaimableSupply?.toString()}
                        </span>
                      </div>
                      <div className={styles.claimDetail}>
                        Nfts Price
                        <span>
                          {claimCondition?.pricePerToken?.toString()}
                        </span>
                      </div>
                      <div className={styles.claimDetail}>
                        Limit per Wallet
                        <span>
                          {claimCondition?.quantityLimitPerWallet?.toString()}
                        </span>
                      </div>
                      <div className={styles.claimDetail}>
                        Supply claimed
                        <span>
                          {claimCondition?.supplyClaimed.toString()}
                        </span>
                      </div>
                      <div>
                        <p>click to change Phase</p>
                        </div>
                    </div>
          )}

          {showInfo && (
            <Container maxWidth="md">
              <div {...handlers} className={styles.overlay}>
              <div className={styles.contentContainer}>
                  <p>Here you can set your ClaimCondition.</p>
                  <p>
                    Control when the NFTs get dropped, how much they cost, and
                    more.
                  </p>

                  {claimCondition &&  (
                    <div className={styles.claimConditionDetails}>
                      <p className={styles.headerText}>
                        This is currently a Public Claim Phase
                      </p>
                      <p className={styles.headerText}>
                        Allow any wallet to claim this drop during this claim
                        phase.
                      </p>

                      <div className={styles.claimDetail}>
                        Phase Start
                        <span>
                          {date}
                        </span>
                      </div>
                      <div className={styles.claimDetail}>
                        Nfts to drop
                        <span>
                          {claimCondition?.maxClaimableSupply?.toString()}
                        </span>
                      </div>
                      <div className={styles.claimDetail}>
                        Nfts Price
                        <span>
                          {claimCondition?.pricePerToken?.toString()}
                        </span>
                      </div>
                      <div className={styles.claimDetail}>
                        Limit per Wallet
                        <span>
                          {claimCondition?.quantityLimitPerWallet?.toString()}
                        </span>
                      </div>
                      <div className={styles.claimDetail}>
                        Supply Claimed
                        <span>
                          {claimCondition?.quantityLimitPerWallet?.toString()}
                        </span>
                      </div>

                      <legend className={styles.legendText}>
                        Max Claim Supply
                      </legend>
                      <input
                        className={styles.inputField}
                        type="number"
                        step={1}
                        value={isMaxClaimableSupply}
                        onChange={(e) =>
                          setMaxClaimableSupply(Number(e.target.value))
                        }
                      />

                      <legend className={styles.legendText}>
                        Max Claim Supply Per Wallet
                      </legend>
                      <input
                        className={styles.inputField}
                        type="number"
                        step={0.000001}
                        value={maxClaimablePerWallet}
                        onChange={(e) =>
                          setMaxClaimablePerWallet(Number(e.target.value))
                        }
                      />

                      <legend className={styles.legendText}>
                        Currency Contract Address
                      </legend>
                      <input
                        className={styles.inputField}
                        type="text"
                        value={currencyAddress}
                        onChange={(e) =>
                          setCurrencyAddress(e.target.value)
                        }
                        placeholder="Enter the currency contract address"
                      />

                      <legend className={styles.legendText}>
                        Price per token
                      </legend>
                      <input
                        className={styles.inputField}
                        type="number"
                        step={0.000001}
                        value={price}
                        onChange={(e) =>
                          setPrice(Number(e.target.value))
                        }
                      />

                      <legend className={styles.legendText}>
                        Listing Starts on
                      </legend>
                      <input
                        className={styles.inputField}
                        type="datetime-local"
                        onChange={(e) =>
                          setStartTime(new Date(e.target.value).getTime())
                        }
                      />
                    </div>
                  )}

                  {!claimCondition && (
                    <div className={styles.claimConditionDetails}>
                      <p className={styles.headerText}>
                        You&apos;re about to set the following item to claim.
                      </p>

                      <legend className={styles.legendText}>
                        Max Claim Supply
                      </legend>
                      <input
                        className={styles.inputField}
                        type="number"
                        step={1}
                        value={isMaxClaimableSupply}
                        onChange={(e) =>
                          setMaxClaimableSupply(Number(e.target.value))
                        }
                      />

                      <legend className={styles.legendText}>
                        Max Claim Supply Per Wallet
                      </legend>
                      <input
                        className={styles.inputField}
                        type="number"
                        step={0.000001}
                        value={maxClaimablePerWallet}
                        onChange={(e) =>
                          setMaxClaimablePerWallet(Number(e.target.value))
                        }
                      />

                      <legend className={styles.legendText}>
                        Currency Contract Address
                      </legend>
                      <input
                        className={styles.inputField}
                        type="text"
                        value={currencyAddress}
                        onChange={(e) =>
                          setCurrencyAddress(e.target.value)
                        }
                        placeholder="Enter the currency contract address"
                      />

                      <legend className={styles.legendText}>
                        Price per token
                      </legend>
                      <input
                        className={styles.inputField}
                        type="number"
                        step={0.000001}
                        value={price}
                        onChange={(e) =>
                          setPrice(Number(e.target.value))
                        }
                      />

                      <legend className={styles.legendText}>
                        Listing Starts on
                      </legend>
                      <input
                        className={styles.inputField}
                        type="datetime-local"
                        onChange={(e) =>
                          setStartTime(new Date(e.target.value).getTime())
                        }
                      />
                    </div>
                  )}

                  <TransactionButton
                    transaction={handleSetClaimCondition}
                    onTransactionSent={() => {
                      console.log("Transaction sent...");
                    }}
                    onError={(error) => {
                      console.error("Approval Failed:", error);
                    }}
                    onTransactionConfirmed={(txResult) => {
                      console.log("Transaction confirmed:", txResult);
                    }}
                  >
                    SetClaimCondition
                  </TransactionButton>
                </div>
              </div>
            </Container>
          )}
      
    </div>
  );
};

export default ClaimCardErc721;