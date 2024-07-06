"use client";

import { TransactionButton } from "thirdweb/react";
import { approve } from "thirdweb/extensions/erc20";
import toast from "react-hot-toast";
import { MARKETPLACE, NETWORK } from "@/const/contracts";
import toastStyle from "@/util/toastConfig";
import { Address, getContract } from "thirdweb";
import client from "@/lib/client";

const ioDepinnyErc20 = "0xdff8596d62b6d35ffffc9e465d2fdea49ac3c311";
export const Deppiny = getContract({
  address: ioDepinnyErc20,
  client,
  chain: NETWORK,
});

export default function ApprovalButtonERC20Depinny({
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
    console.log("ERC20 Contract:", ioDepinnyErc20);
    console.log("Spender (Marketplace):", MARKETPLACE.address);
    console.log("Amount:", amount);

    try {
      const transaction = await approve({
        contract: Deppiny,
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
      Approve Depinny
    </TransactionButton>
    
  );
}
