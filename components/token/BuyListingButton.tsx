"use client";
import { TransactionButton, useActiveAccount } from "thirdweb/react";
import {
    buyFromListing,
  buyoutAuction,
} from "thirdweb/extensions/marketplace";
import { MARKETPLACE } from "@/const/contracts";
import toastStyle from "@/util/toastConfig";
import toast from "react-hot-toast";
import { Address } from "thirdweb";
import { ListingStatus } from "@/customDirectListing/DirectListingListingStatis";
import { fetchEvents } from "@/lib/fetchedEvents2";
interface EnglishAuction {
  id: bigint;
  creatorAddress: Address;
  assetContractAddress: Address;
  tokenId: bigint;
  quantity: bigint;
  currencyContractAddress: Address;
  minimumBidAmount: bigint;
  minimumBidCurrencyValue: string;
  buyoutBidAmount: bigint;
  buyoutCurrencyValue: string;
  timeBufferInSeconds: bigint;
  bidBufferBps: bigint;
  startTimeInSeconds: bigint;
  endTimeInSeconds: bigint;
  status: ListingStatus;
}

interface DirectListing {
  id: bigint;
  creatorAddress: Address;
  assetContractAddress: Address;
  tokenId: bigint;
  quantity: bigint;
  currencyContractAddress: Address;
  currencySymbol: string;
  pricePerToken: string;
  startTimeInSeconds: bigint;
  endTimeInSeconds: bigint;
  isReservedListing: boolean;
  status: number;
}
export default function BuyListingButton({
  auctionListing,
  directListing,

}: {
  auctionListing?: EnglishAuction;
  directListing?: DirectListing;
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
      }}
    >
      Buy with Iotex Now
    </TransactionButton>
  );
}
