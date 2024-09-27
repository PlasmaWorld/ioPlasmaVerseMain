"use client";
import { useRouter } from "next/navigation";
import { NFT as NFTType } from "thirdweb";
import { TransactionButton } from "thirdweb/react";
import { createAuction } from "thirdweb/extensions/marketplace";
import toast from "react-hot-toast";
import { MARKETPLACE, NFT_COLLECTION } from "@/const/contracts";
import toastStyle from "@/util/toastConfig";

export default function AuctionListingButton({
  tokenId,
  minimumBidAmount,
  buyoutBidAmount,
  auctionStart,
  auctionEnd,
  contractAddress,
}: {
  tokenId: bigint;
  minimumBidAmount: string;
  buyoutBidAmount: string;
  auctionStart: string;
  auctionEnd: string;
  contractAddress: string;
}) {
 
  const router = useRouter();
  const address =
  contractAddress.startsWith("0x") && contractAddress.length === 42
    ? (contractAddress as `0x${string}`)
    : null;

  if (!address) {
    return null;
  }

  return (
    <TransactionButton
      transaction={() => {
        return createAuction({
          contract: MARKETPLACE,
          assetContractAddress: address,
          tokenId: tokenId,
          minimumBidAmount,
          buyoutBidAmount,
          startTimestamp: new Date(auctionStart),
          endTimestamp: new Date(auctionEnd),
        });
      }}
      onTransactionSent={() => {
        toast.loading("Listing...", {
          id: "auction",
          style: toastStyle,
          position: "bottom-center",
        });
      }}
      onError={(error) => {
        toast(`Listing Failed!`, {
          icon: "❌",
          id: "auction",
          style: toastStyle,
          position: "bottom-center",
        });
      }}
      onTransactionConfirmed={async (txResult) => {
        toast("Listed Successfully!", {
          icon: "🥳",
          id: "auction",
          style: toastStyle,
          position: "bottom-center",
        });
        router.refresh();
      }}
    >
      List for Auction
    </TransactionButton>
  );
}
