"use client";

import { TransactionButton } from "thirdweb/react";
import { approve } from "thirdweb/extensions/erc20";
import toast from "react-hot-toast";
import { MARKETPLACE, NETWORK } from "@/const/contracts";
import toastStyle from "@/util/toastConfig";
import { Address, getContract } from "thirdweb";
import client from "@/lib/client";

const ioSibaErc20 = "0x3ea683354bf8d359cd9ec6e08b5aec291d71d880";
export const ioShiba = getContract({
  address: ioSibaErc20,
  client,
  chain: NETWORK,
});

export default function ApprovalButtonERC20({
  amount,
  address,
  	onApproved
}: {
  amount: string;
  address: Address;
  onApproved: () => void;}) {

  const handleApproval = async () => {
    console.log("Preparing to approve ERC20 token for marketplace...");
    console.log("Parameters:");
    console.log("ERC20 Contract:", ioSibaErc20);
    console.log("Spender (Marketplace):", MARKETPLACE.address);
    console.log("Amount:", amount);

    try {
      const transaction = await approve({
        contract: ioShiba,
        spender: address,
        amount,
      });
      console.log("Transaction prepared:", transaction);
      return transaction;
    } catch (error) {
      console.error("Error in preparing transaction:", error);
      throw error;
    }
  };

  return (
    <TransactionButton
      transaction={handleApproval}
      onTransactionSent={() => {
        console.log("Transaction sent...");
        toast.loading("Approving ERC20 token...", {
          id: "approveERC20",
          style: toastStyle,
          position: "bottom-center",
        });
      }}
      onError={(error) => {
        console.error("Approval Failed:", error);
        toast(`Approval Failed!`, {
          icon: "❌",
          id: "approveERC20",
          style: toastStyle,
          position: "bottom-center",
        });
      }}
      onTransactionConfirmed={(txResult) => {
        console.log("Transaction confirmed:", txResult);
        toast("Approval successful.", {
          icon: "👍",
          id: "approveERC20",
          style: toastStyle,
          position: "bottom-center",
        });
        onApproved();
      }}
    >
      Approve Shiba
    </TransactionButton>
  );
}
