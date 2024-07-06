'use client';

import { BuyCoffeeContract } from "@/const/contracts";
import client from "@/lib/client";
import { FC, useState, useEffect } from "react";
import { prepareContractCall, toWei } from "thirdweb";
import { ConnectButton, TransactionButton, useActiveAccount } from "thirdweb/react";
import styles from "./BuyMeCoffee.module.css";

const BuyMeCoffee: FC<{ userAddress: string; onClose: () => void }> = ({ userAddress, onClose }) => {
  const account = useActiveAccount();
  const [buyAmount, setBuyAmount] = useState(0);
  const [message, setMessage] = useState("");
  

  const truncateWalletAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const convertDate = (timestamp: bigint) => {
    const timestampNumber = Number(timestamp);
    return new Date(timestampNumber * 1000).toLocaleString();
  };

  
  const address = userAddress.startsWith('0x') && userAddress.length === 42 ? userAddress as `0x${string}` : null;

  return (
    <div className={styles.container}>
      <button 
        onClick={onClose} 
        className={styles.closeButton}
      >
        &times;
      </button>
      <div className={styles.header}>
        <h2>Buy Me Coffee</h2>
      </div>
      <div className={styles.form}>
        <label className={styles.label}>Tip amount</label>
        <p className={styles.tipNote}>*Must be greater than 0.</p>
        <input
          type="number"
          value={buyAmount}
          onChange={(e) => setBuyAmount(Number(e.target.value))}
          step={0.1}
          className={styles.input}
        />
        <label className={styles.label}>Message</label>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Enter a message..."
          className={styles.input}
        />
        {message && buyAmount > 0 && address && (
          <TransactionButton
            transaction={() => (
              prepareContractCall({
                contract: BuyCoffeeContract,
                method: "function buyCoffeeWithIOTX(address recipient, string message) payable",
                params: [address, message],
                value: BigInt(toWei(buyAmount.toString())),
              })
            )}
            onTransactionConfirmed={() => {
              alert("Thank you for the coffee!");
              setBuyAmount(0);
              setMessage("");
            }}
            className={styles.transactionButton}
          >
            Buy Coffee
  
            </TransactionButton>
        )}
      </div>
      <div className={styles.recentCoffees}>
        <p className={styles.recentCoffeesTitle}>Recent Coffees:</p>
        {/* Recent coffees section can be added here */}
      </div>
    </div>
  );
};

export default BuyMeCoffee;
