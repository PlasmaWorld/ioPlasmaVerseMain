"use client";

import { useRouter } from "next/navigation";
import { NFT as NFTType, getContract, toUnits, readContract } from "thirdweb";
import { TransactionButton, useActiveAccount } from "thirdweb/react";
import { createListing } from "thirdweb/extensions/marketplace";
import toast from "react-hot-toast";
import { MARKETPLACE, NETWORK } from "@/const/contracts";
import toastStyle from "@/util/toastConfig";
import client from "@/lib/client";
import { useState, useEffect } from "react";

// Define the ioSibaErc20 contract address and initialize the contract
const ioSibaErc20 = "0x3ea683354bf8d359cd9ec6e08b5aec291d71d880" as const;
const ioShiba = getContract({
  address: ioSibaErc20,
  client,
  chain: NETWORK,
});

export default function DirectListingParent({
  nft,
  pricePerToken,
  listingStart,
  listingEnd,
  contractAddress,
  refetchAllListings,
}: {
  nft: NFTType;
  pricePerToken: string;
  listingStart: string;
  listingEnd: string;
  contractAddress: string;
  refetchAllListings: () => void;
}) {
  const router = useRouter();
  const account = useActiveAccount();

  const address =
    contractAddress.startsWith("0x") && contractAddress.length === 42
      ? (contractAddress as `0x${string}`)
      : null;

 

 

  const handleListing = async () => {
    if (!account || !address) {
      throw new Error("Account not available");
    }

    try {
      const transaction = await createListing({
        contract: MARKETPLACE,
        assetContractAddress: address,
        tokenId: nft.id,
        pricePerToken: pricePerToken,
        startTimestamp: new Date(listingStart),
        endTimestamp: new Date(listingEnd),
        currencyContractAddress: ioSibaErc20,
      });
      console.log("Listing transaction prepared:", transaction);
      return transaction;
    } catch (error) {
      console.error("Error in creating listing:", error);
      throw error;
    }
  };

  return (
    <TransactionButton
      transaction={handleListing}
      onTransactionSent={() => {
        console.log("Transaction sent...");
        toast.loading("Listing...", {
          id: "direct",
          style: toastStyle,
          position: "bottom-center",
        });
      }}
      onError={(error) => {
        console.error("Listing Failed:", error);
        toast("Listing Failed!", {
          icon: "❌",
          id: "direct",
          style: toastStyle,
          position: "bottom-center",
        });
      }}
      onTransactionConfirmed={async (txResult) => {
        console.log("Transaction confirmed:", txResult);
        toast("Listed Successfully!", {
          icon: "🥳",
          id: "direct",
          style: toastStyle,
          position: "bottom-center",
        });
        await refetchAllListings();
        router.refresh();
      }}
    >
      List for Sale
    </TransactionButton>
  );
}
