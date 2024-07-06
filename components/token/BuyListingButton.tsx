"use client";
import { TransactionButton, useActiveAccount } from "thirdweb/react";
import {
  DirectListing,
  EnglishAuction,
  buyFromListing,
  buyoutAuction,
} from "thirdweb/extensions/marketplace";
import { MARKETPLACE } from "@/const/contracts";
import toastStyle from "@/util/toastConfig";
import toast from "react-hot-toast";

export default function BuyListingButton({
  auctionListing,
  directListing,
  refetchAllListings,
}: {
  auctionListing?: EnglishAuction;
  directListing?: DirectListing;
  refetchAllListings: () => void;
}) {
  const account = useActiveAccount();

  return (
    <TransactionButton
      disabled={
        account?.address === auctionListing?.creatorAddress ||
        account?.address === directListing?.creatorAddress ||
        (!directListing && !auctionListing)
      }
      transaction={() => {
        if (!account) throw new Error("No account");
        console.log("Transaction initiated by account:", account.address);
        
        if (auctionListing) {
          console.log("Auction Listing ID:", auctionListing.id);
          return buyoutAuction({
            contract: MARKETPLACE,
            auctionId: auctionListing.id,
          });
        } else if (directListing) {
          console.log("Direct Listing ID:", directListing.id);
          return buyFromListing({
            contract: MARKETPLACE,
            listingId: directListing.id,
            recipient: account.address,
            quantity: BigInt(1),
          });
        } else {
          throw new Error("No valid listing found for this NFT");
        }
      }}
      onTransactionSent={() => {
        console.log("Transaction sent");
        toast.loading("Purchasing...", {
          id: "buy",
          style: toastStyle,
          position: "bottom-center",
        });
      }}
      onError={(error) => {
        console.error("Transaction failed with error:", error);
        toast(`Purchase Failed! ${error.message}`, {
          icon: "❌",
          id: "buy",
          style: toastStyle,
          position: "bottom-center",
        });
      }}
      onTransactionConfirmed={async (txResult) => {
        console.log("Transaction confirmed with result:", txResult);
        toast("Purchased Successfully!", {
          icon: "🥳",
          id: "buy",
          style: toastStyle,
          position: "bottom-center",
        });
        // Refetch the data after transaction confirmation
        await refetchAllListings();
      }}
    >
      Buy with Iotex Now
    </TransactionButton>
  );
}
