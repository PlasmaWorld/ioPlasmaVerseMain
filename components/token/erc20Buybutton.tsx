"use client";
import { TransactionButton, useActiveAccount, useReadContract } from "thirdweb/react";
import {
  
  EnglishAuction,
  buyFromListing,
  buyoutAuction,
  getListing,
} from "thirdweb/extensions/marketplace";
import { MARKETPLACE, ioShiba } from "@/const/contracts";
import toastStyle from "@/util/toastConfig";
import toast from "react-hot-toast";
import { balanceOf } from "thirdweb/extensions/erc20";
import { BigNumber, ethers } from "ethers";
import { useEffect, useState } from "react";
import { Address } from "thirdweb";
import { fetchEvents } from "@/lib/fetchedEvents2";

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

const toEther = (value: BigNumber | bigint): string => {
  if (typeof value === 'bigint') {
    return ethers.utils.formatUnits(BigNumber.from(value), 9); // Assuming 9 decimals for this token
  }
  return ethers.utils.formatUnits(value, 9);
};

const toSmallestUnit = (amount: string, decimals: number): string => {
  const amountBigInt = BigInt(parseFloat(amount) * Math.pow(10, decimals));
  return amountBigInt.toString();
};

export default function BuyListingButtonErc20({
  auctionListing,
  directListing,
  account,
}: {
  auctionListing?: EnglishAuction;
  directListing?: DirectListing;
  account: Address;
}) {
  const [hasSufficientBalance, setHasSufficientBalance] = useState(false);
 

  const { data: UserTokenBalance, isLoading: loadingUserWallet } = useReadContract(
    balanceOf,
    {
      contract: ioShiba,
      address: account ,
      queryOptions: {
        enabled: !!account,
      }
    }
  );

  useEffect(() => {
    if (!loadingUserWallet && UserTokenBalance && directListing) {
      const listingPrice = BigInt(toSmallestUnit(directListing.pricePerToken, 9));
      const userBalance = BigInt(UserTokenBalance.toString());

      if (userBalance >= listingPrice) {
        setHasSufficientBalance(true);
      } else {
        setHasSufficientBalance(false);
      }
    }
  }, [UserTokenBalance, loadingUserWallet, directListing]);

  return (
    <TransactionButton
      disabled={
        account === auctionListing?.creatorAddress ||
        account === directListing?.creatorAddress ||
        (!directListing && !auctionListing) ||
        !hasSufficientBalance ||
        loadingUserWallet
      }
      transaction={async () => {
        if (!account) throw new Error("No account");
        console.log("Transaction initiated by account:", account);
        
        if (auctionListing) {
          console.log("Auction Listing ID:", auctionListing.id);
          return buyoutAuction({
            contract: MARKETPLACE,
            auctionId: auctionListing.id,
          });
        } else if (directListing) {
          console.log("Direct Listing ID:", directListing.id);
          const listingDetails = await getListingDetails(directListing.id);
          console.log("Listing Details:", listingDetails);
          return buyFromListing({
            contract: MARKETPLACE,
            listingId: directListing.id,
            recipient: account,
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
      }}
    >
      Buy with Shiba Now
    </TransactionButton>
  );
}

async function getListingDetails(listingId: bigint) {
  try {
    const listing = await getListing({
      contract: MARKETPLACE,
      listingId: listingId,
    });
    return listing;
  } catch (error) {
    console.error("Error fetching listing details:", error);
    throw error;
  }
}
