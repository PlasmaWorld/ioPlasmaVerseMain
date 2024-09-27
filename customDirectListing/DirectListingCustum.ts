import type { Address } from "abitype";
import type { ListingStatus } from "./DirectListingListingStatis.js";
import { GetBalanceResult } from "thirdweb/extensions/erc20";

/**
 * @extension MARKETPLACE
 */
export type DirectListing = {
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
  status: ListingStatus;
};
