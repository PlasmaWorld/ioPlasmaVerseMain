"use client";

import { TransactionButton } from "thirdweb/react";
import { approve } from "thirdweb/extensions/erc20";
import toast from "react-hot-toast";
import { MARKETPLACE, Merchendise, NETWORK, ioUSDCondract } from "@/const/contracts";
import toastStyle from "@/util/toastConfig";
import { getContract } from "thirdweb";
import client from "@/lib/client";

export default function ApprovalButtonERC20Currency({
  amount,
}: {
  amount: string;
}) {
  const currencyContract = getContract({
    address: ioUSDCondract.address,
    client,
    chain: NETWORK,
  });
  const address =
  Merchendise.address.startsWith("0x") && Merchendise.address.length === 42
      ? (Merchendise.address as `0x${string}`)
      : null;
      
      if (!address) {
        return null;
      }
    

  return (
    <TransactionButton
      transaction={() => {
        return approve({
          contract: currencyContract,
          spender: address,
          amount,
        });
      }}
      onTransactionSent={() => {
        toast.loading("Approving...", {
          id: "approveERC20",
          style: toastStyle,
          position: "bottom-center",
        });
      }}
      onError={(error) => {
        toast(`Approval Failed!`, {
          icon: "❌",
          id: "approveERC20",
          style: toastStyle,
          position: "bottom-center",
        });
      }}
      onTransactionConfirmed={(txResult) => {
        toast("Approval successful.", {
          icon: "👍",
          id: "approveERC20",
          style: toastStyle,
          position: "bottom-center",
        });
      }}
    >
      Approve ERC20
    </TransactionButton>
  );
}
