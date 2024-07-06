import { TransactionButton } from "thirdweb/react";
import { setApprovalForAll } from "thirdweb/extensions/erc721";
import toast from "react-hot-toast";
import { NFT_COLLECTION, MARKETPLACE, NETWORK } from "@/const/contracts";
import toastStyle from "@/util/toastConfig";
import { Address, getContract } from "thirdweb";
import client from "@/lib/client";

export default function ApprovalButton({
  contractAddress,
  address
}: {
  contractAddress: string;
  address: Address;
}) {
  const contractApproval = contractAddress;
  const Contract = getContract({
    address: contractApproval,
    client,
    chain: NETWORK,
  });

    return (
      <TransactionButton
        transaction={() => {
          return setApprovalForAll({
            contract: Contract,
            operator: address,
            approved: true,
          });
        }}
        onTransactionSent={() => {
          toast.loading("Approving...", {
            id: "approve",
            style: toastStyle,
            position: "bottom-center",
          });
        }}
        onError={(error) => {
          toast(`Approval Failed!`, {
            icon: "❌",
            id: "approve",
            style: toastStyle,
            position: "bottom-center",
          });
        }}
        onTransactionConfirmed={(txResult) => {
          toast("Approval successful.", {
            icon: "👍",
            id: "approve",
            style: toastStyle,
            position: "bottom-center",
          });
        }}
      >
        Approve
      </TransactionButton>
    );
  }