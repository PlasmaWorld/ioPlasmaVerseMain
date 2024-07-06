"use client";
import { TransactionButton, useActiveAccount } from "thirdweb/react";
import {
  DirectListing,
  EnglishAuction,
  bidInAuction,
  makeOffer,
} from "thirdweb/extensions/marketplace";
import { MARKETPLACE } from "@/const/contracts";
import toastStyle from "@/util/toastConfig";
import toast from "react-hot-toast";
import { useState } from "react";

export default function MakeOfferButton({
  auctionListing,
  directListing,
  refetchAllListings,
  refetchAllAuctions,
}: {
  auctionListing?: EnglishAuction;
  directListing?: DirectListing;
  refetchAllListings: () => void;
  refetchAllAuctions: () => void;
}) {
  const account = useActiveAccount();
  const [bid, setBid] = useState("0");

  return (
    <div className="flex flex-col">
      <input
        className="block w-full px-4 py-3 mb-4 text-base bg-transparent border border-white rounded-lg box-shadow-md"
        type="number"
        step={0.000001}
        value={bid}
        onChange={(e) => setBid(e.target.value)}
      />
      <TransactionButton
        disabled={
          account?.address === auctionListing?.creatorAddress ||
          account?.address === directListing?.creatorAddress ||
          (!directListing && !auctionListing)
        }
        transaction={() => {
          console.log("Transaction initiated");
          if (!account) {
            console.error("No account found");
            throw new Error("No account");
          }
          if (auctionListing) {
            console.log("Bidding in auction", { auctionId: auctionListing.id, bidAmount: bid });
            return bidInAuction({
              contract: MARKETPLACE,
              auctionId: auctionListing.id,
              bidAmount: bid,
            });
          } else if (directListing) {
            console.log("Making offer", {
              assetContractAddress: directListing.assetContractAddress,
              tokenId: directListing.tokenId,
              currencyContractAddress: directListing.currencyContractAddress,
              totalOffer: bid,
            });
            return makeOffer({
              contract: MARKETPLACE,
              assetContractAddress: directListing.assetContractAddress,
              tokenId: directListing.tokenId,
              currencyContractAddress: directListing.currencyContractAddress,
              totalOffer: bid,
              offerExpiresAt: new Date(
                Date.now() + 10 * 365 * 24 * 60 * 60 * 1000
              ),
            });
          } else {
            console.error("No valid listing found for this NFT");
            throw new Error("No valid listing found for this NFT");
          }
        }}
        onTransactionSent={() => {
          console.log("Transaction sent");
          toast.loading("Making offer...", {
            id: "buy",
            style: toastStyle,
            position: "bottom-center",
          });
        }}
        onError={(error) => {
          console.error("Transaction error:", error);
          toast(`Offer Failed!`, {
            icon: "❌",
            id: "buy",
            style: toastStyle,
            position: "bottom-center",
          });
        }}
        onTransactionConfirmed={async (txResult) => {
          console.log("Transaction confirmed", txResult);
          toast("Offer Placed Successfully!", {
            icon: "🥳",
            id: "buy",
            style: toastStyle,
            position: "bottom-center",
          });
          // Refetch the data after transaction confirmation
          await refetchAllListings();
          await refetchAllAuctions();
        }}
      >
        Make Offer
      </TransactionButton>
    </div>
  );
}
