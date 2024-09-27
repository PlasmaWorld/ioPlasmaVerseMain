'use client';

import { useActiveAccount, TransactionButton } from "thirdweb/react";
import { defineChain, getContract, PreparedTransaction, ThirdwebContract } from "thirdweb";
import { useState, FC } from "react";
import client from "@/lib/client";
import styles from './Mint2.module.css';
import { mintTo } from "thirdweb/extensions/erc20";

/**
 * Erc20Mint Component
 * 
 * This component allows users to mint ERC20 tokens directly to their wallet.
 * It is designed to be simple, modern, and user-friendly, integrating seamlessly
 * into dApps or admin panels for managing token supply.
 * 
 * @param contractAddress The address of the deployed ERC20 contract.
 * @param chainId The ID of the blockchain network where the contract is deployed.
 */
const Erc20Mint: FC<{ contractAddress: string; chainId: number }> = ({
  contractAddress,
  chainId,
}) => {
  // Active user account information
  const account = useActiveAccount();
  
  // State to manage the quantity of tokens to mint
  const [quantity, setQuantity] = useState(1);

  // Define the network chain based on the provided chainId
  const NETWORK = defineChain(chainId);

  // Get the contract instance using the thirdweb framework
  const contract: ThirdwebContract = getContract({
    address: contractAddress,
    client,
    chain: NETWORK,
  });

  // Prepare the transaction for minting tokens
  const prepareTransaction = async (): Promise<PreparedTransaction<any>> => {
    if (!account) {
      console.log("No account connected. Aborting transaction.");
      throw new Error("No account connected.");
    }

    try {
      // Prepare the mintTo transaction
      const transaction = await mintTo({
        contract,
        to: account.address,
        amount: quantity,
      });

      return transaction;
    } catch (error) {
      console.error("Error preparing transaction:", error);
      throw error;
    }
  };

  // JSX rendering the minting interface
  return (
    <div className={styles.MintApp}>
      <header className={styles.header}>
        <h1 className={styles.title}>Mint Your ERC20 Tokens</h1>
        <p className={styles.description}>
        Use this interface to mint new ERC20 tokens directly to your connected wallet. Adjust the quantity below and click &quot;Mint ERC20&quot; to proceed.
      </p>

  
        {/* Quantity Selector for Tokens to Mint */}
        <div className={styles.quantitySelector}>
          <label className={styles.quantityLabel}>Select Quantity:</label>
          <button
            className={styles.quantityButton}
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
          >
            -
          </button>
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value))}
            className={styles.quantityInput}
          />
          <button
            className={styles.quantityButton}
            onClick={() => setQuantity(quantity + 1)}
          >
            +
          </button>
        </div>
  
        {/* Transaction Button to Mint Tokens */}
        {account?.address ? (
          <TransactionButton
            transaction={prepareTransaction}
            onTransactionConfirmed={async () => {
              alert("ERC20 Tokens Minted!");
              setQuantity(1); // Reset quantity after minting
            }}
          >
            Mint ERC20
          </TransactionButton>
        ) : (
          <p className={styles.warning}>
            Please connect your wallet to mint tokens.
          </p>
        )}
      </header>
  
      <footer className={styles.footer}>
      <p>
      Make sure your wallet is connected and you&apos;re on the correct network to mint tokens successfully.
    </p>

      </footer>
    </div>
  );
};

export default Erc20Mint;  