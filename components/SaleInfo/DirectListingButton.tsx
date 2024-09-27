"use client";

import { useRouter } from "next/navigation";
import { NFT as NFTType, getContract } from "thirdweb";
import { TransactionButton, useActiveAccount } from "thirdweb/react";
import { createListing } from "thirdweb/extensions/marketplace";
import toast from "react-hot-toast";
import { MARKETPLACE, NETWORK } from "@/const/contracts";
import toastStyle from "@/util/toastConfig";
import client from "@/lib/client";
import { isApprovedForAll, setApprovalForAll } from "thirdweb/extensions/erc721";
import { fetchEvents } from "@/lib/fetchedEvents2";

export default function DirectListingButton({
  pricePerToken,
  listingStart,
  listingEnd,
  contractAddress,
  tokenId,
  
}: {
  pricePerToken: string;
  listingStart: string;
  listingEnd: string;
  contractAddress: string;
  tokenId: bigint;

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
				return createListing({
					contract: MARKETPLACE,
					assetContractAddress: address,
					tokenId: tokenId,
					pricePerToken,
				});
			}}
			onTransactionSent={() => {
				toast.loading("Listing...", {
					id: "direct",
					style: toastStyle,
					position: "bottom-center",
				});
			}}
			onError={(error) => {
				toast(`Listing Failed!`, {
					icon: "❌",
					id: "direct",
					style: toastStyle,
					position: "bottom-center",
				});
			}}
			onTransactionConfirmed={async (txResult) => {

				toast("Listed Successfully!", {
					icon: "🥳",
					id: "direct",
					style: toastStyle,
					position: "bottom-center",
				});
        router.refresh();

			}}
		>
			List for Sale
		</TransactionButton>
	);
}