"use client";

import React, { FC, useState, useEffect, useMemo } from "react";
import { TransactionButton, useActiveAccount, useReadContract } from "thirdweb/react";
import BuyListingButton from "./BuyListingButton";
import BuyListingButtonErc20 from "./erc20Buybutton";
import cn from "classnames";

import ApprovalButtonERC20, { ioShiba } from "../SaleInfo/ApprovalShiba";
import { Address, ADDRESS_ZERO, readContract } from "thirdweb";
import { MARKETPLACE } from "@/const/contracts";
import { toUnits9 } from "@/util/conversion";
import { useCurrency } from "@/Hooks/CurrencyProvider";
import MakeOfferButton from "./MakeOfferButton";
import { allowance } from "thirdweb/extensions/erc20";
import ApprovalButtonERC20Depinny, { Deppiny } from "../SaleInfo/ApprovalDepinny";
import BuyListingButtonErc20Depinny from "./erc20BuyButtonDepinny";
import { useMarketplaceData } from "@/Hooks/MarketProvider";
import { ListingStatus } from "@/customDirectListing/DirectListingListingStatis";
import toastStyle from "@/util/toastConfig";
import toast from "react-hot-toast";
import { bidInAuction } from "thirdweb/extensions/marketplace";

type INFTCardProps = {
  tokenId: bigint;
  contractAddress: string;
};

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

interface Currency {
  symbol: string;
  decimals: number;
  address: string;
}

const currencies: Currency[] = [
  {
    symbol: 'IOTX',
    decimals: 18,
    address: '0x0000000000000000000000000000000000000000', // Native
  },
  {
    symbol: 'ioShiba',
    decimals: 9,
    address: '0x3ea683354bf8d359cd9ec6e08b5aec291d71d880', // ioShiba
  },
  {
    symbol: 'DEPINNY',
    decimals: 18,
    address: '0xdff8596d62b6d35ffffc9e465d2fdea49ac3c311', // DEPINNY
  },
  // Add more currencies here as needed
];

const INPUT_STYLES = "block w-full py-3 px-4 mb-4 bg-transparent border border-white text-base box-shadow-md rounded-lg mb-4";
const LEGEND_STYLES = "mb-2 text-white/80";

export const NftInformation: FC<INFTCardProps> = ({
  contractAddress,
  tokenId,
}) => {
  const account = useActiveAccount();
  const { selectedCurrency } = useCurrency();
  const [tab, setTab] = useState<"direct" | "auction">("direct");
  const [bidAmount, setBidAmount] = useState<string>("");

  const { validListings, validAuctions } = useMarketplaceData();

  const auctionListing = useMemo(() =>
    validAuctions?.find(
      (l): l is EnglishAuction => l.assetContractAddress === contractAddress && l.tokenId === tokenId
    ),
    [validAuctions, contractAddress, tokenId]);

  const directListing = useMemo(() =>
    validListings?.find(
      (l): l is DirectListing => l.assetContractAddress === contractAddress && l.tokenId === tokenId
    ),
    [validListings, contractAddress, tokenId]);

 
  const [isTokenApproved, setIsTokenApproved] = useState(false);

  const formatRemainingTime = (timestamp: bigint) => {
    const remainingTimeInSeconds = Number(timestamp) - Math.floor(Date.now() / 1000);
    if (remainingTimeInSeconds <= 0) return "Expired";

    const days = Math.floor(remainingTimeInSeconds / (24 * 60 * 60));
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} remaining`;

    const hours = Math.floor((remainingTimeInSeconds % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((remainingTimeInSeconds % (60 * 60)) / 60);
    const seconds = remainingTimeInSeconds % 60;

    return `${hours}h ${minutes}m ${seconds}s remaining`;
  };

  const formatPrice = (price: string, decimals: number) => {
    const priceInSmallestUnit = BigInt(price);
    const formattedPrice = (priceInSmallestUnit / BigInt(10 ** decimals)).toString();
    return formattedPrice;
  };

  const address = MARKETPLACE.address as `0x${string}`;

  const { data: ERC20Approval } = useReadContract(allowance, {
    contract: ioShiba,
    owner: account?.address || ADDRESS_ZERO,
    spender: address,
  });

  const { data: ERC20ApprovalDepinny } = useReadContract(allowance, {
    contract: Deppiny,
    owner: account?.address || ADDRESS_ZERO,
    spender: address,
  });

  useEffect(() => {
    if (ERC20Approval && account && directListing) {
      setIsTokenApproved(BigInt(ERC20Approval) >= toUnits9(directListing.pricePerToken.toString()));
    }
  }, [ERC20Approval, account, directListing]);

  useEffect(() => {
    const checkApprovalDepinny = async () => {
      try {
        if (ERC20ApprovalDepinny && account && directListing) {
          setIsTokenApproved(BigInt(ERC20ApprovalDepinny) >= BigInt(directListing.pricePerToken));
        }
      } catch (error) {
        console.error("Error fetching ERC20 approval Depinny:", error);
      }
    };

    checkApprovalDepinny();
  }, [ERC20ApprovalDepinny, account, directListing]);

  return (
    <div>
      <div className="">
        {directListing || auctionListing ? (
          <div className="p-4 rounded-lg w-full bg-white/[.04]">
            <p className="mb-1 text-white/60">Price</p>
            <div className="text-lg font-medium rounded-md text-white/90">
              {directListing && (
                <>
                  {directListing.currencyContractAddress === "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" ? (
                    <>
                      {directListing.pricePerToken} <p>IOTX</p>
                      <p>Currency Contract Address: {directListing.currencyContractAddress}</p>
                      <p>Start Time: {new Date(Number(directListing.startTimeInSeconds) * 1000).toLocaleString()}</p>
                      <p>End Time: {formatRemainingTime(directListing.endTimeInSeconds)}</p>
                    </>
                  ) : directListing.currencyContractAddress === "0x3EA683354bf8d359cd9EC6E08B5AEC291D71d880" ? (
                    <>
                      {directListing.pricePerToken} <p>ioShiba</p>
                      <p>Currency Contract Address: {directListing.currencyContractAddress}</p>
                      <p>Start Time: {new Date(Number(directListing.startTimeInSeconds) * 1000).toLocaleString()}</p>
                      <p>End Time: {formatRemainingTime(directListing.endTimeInSeconds)}</p>
                    </>
                  ) : directListing.currencyContractAddress === "0xdfF8596d62b6d35fFFfc9e465d2FDeA49Ac3c311" ? (
                    <>
                      {directListing.pricePerToken} <p>Depinny</p>
                      <p>Currency Contract Address: {directListing.currencyContractAddress}</p>
                      <p>Start Time: {new Date(Number(directListing.startTimeInSeconds) * 1000).toLocaleString()}</p>
                      <p>End Time: {formatRemainingTime(directListing.endTimeInSeconds)}</p>
                    </>
                  ) : (
                    "Currency not supported"
                  )}
                </>
              )}
              {auctionListing && (
                <>
                  {auctionListing.minimumBidCurrencyValue} {selectedCurrency.symbol}
                  <p>Buy Direct for: {auctionListing.buyoutCurrencyValue} {selectedCurrency.symbol}</p>

                  <p>Currency Contract Address: {auctionListing.currencyContractAddress}</p>
                  <p>Start Time: {new Date(Number(auctionListing.startTimeInSeconds) * 1000).toLocaleString()}</p>
                  <p>End Time: {formatRemainingTime(auctionListing.endTimeInSeconds)}</p>
                </>
              )}
            </div>

            {auctionListing && (
              <>
                <p className="mb-4 text-white/60" style={{ marginTop: 12 }}>Bids starting from</p>
                <div className="font-medium rounded-md font-lg text-white/90">
                  {auctionListing.minimumBidCurrencyValue} {selectedCurrency.symbol}
                </div>
                <div>
                  <p className="mb-4 text-white/60" style={{ marginTop: 12 }}>Create Bid</p>

                  <input
                    className={cn(INPUT_STYLES)}
                    type="number"
                    step={0.000001}
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                  />
                  <TransactionButton
                    transaction={() => {
                      if (!account) throw new Error("No account");
                      if (!auctionListing) throw new Error("No valid listing found for this NFT");

                      return bidInAuction({
                        contract: MARKETPLACE,
                        auctionId: auctionListing.id,
                        bidAmount: bidAmount, // Ensure this is a string or appropriate type
                      });
                    }}
                    onTransactionSent={() => {
                      console.log("Transaction sent");
                      toast.loading("Placing bid...", {
                        id: "bid",
                        style: toastStyle,
                        position: "bottom-center",
                      });
                    }}
                    onError={(error) => {
                      console.error("Transaction failed with error:", error);
                      toast(`Bid Failed! ${error.message}`, {
                        icon: "❌",
                        id: "bid",
                        style: toastStyle,
                        position: "bottom-center",
                      });
                    }}
                    onTransactionConfirmed={async (txResult) => {
                      console.log("Transaction confirmed with result:", txResult);
                      toast("Bid Placed Successfully!", {
                        icon: "🥳",
                        id: "bid",
                        style: toastStyle,
                        position: "bottom-center",
                      });
                      // Refetch the data after transaction confirmation
                    }}
                  >
                    Place Bid Now
                  </TransactionButton>
                </div>
              </>
            )}
            <div className="flex flex-col">
              {directListing && (
                <>
                  {directListing.currencyContractAddress === "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" ? (
                    <BuyListingButton
                      directListing={directListing}
                    />
                  ) : !isTokenApproved && directListing.currencyContractAddress === "0x3EA683354bf8d359cd9EC6E08B5AEC291D71d880" && <ApprovalButtonERC20 amount={directListing.pricePerToken.toString()} onApproved={() => setIsTokenApproved(true)} address={address} />}

                  {isTokenApproved && directListing.currencyContractAddress === "0x3EA683354bf8d359cd9EC6E08B5AEC291D71d880" && account && (
                    <BuyListingButtonErc20
                      directListing={directListing}
                      account={account.address as `0x${string}`}
                    />
                  )}
                  <>
                    {!isTokenApproved && directListing.currencyContractAddress === "0xdfF8596d62b6d35fFFfc9e465d2FDeA49Ac3c311" && <ApprovalButtonERC20Depinny amount={directListing.pricePerToken.toString()} onApproved={() => setIsTokenApproved(true)} address={address} />}

                    {isTokenApproved && account && directListing.currencyContractAddress === "0xdfF8596d62b6d35fFFfc9e465d2FDeA49Ac3c311" && (
                      <BuyListingButtonErc20Depinny
                        directListing={directListing}
                        account={account.address as `0x${string}`}
                      />
                    )}
                  </>
                </>
              )}

              {auctionListing && (
                <BuyListingButton
                  directListing={directListing || undefined}
                  auctionListing={auctionListing}
                />
              )}
              <div className="flex justify-center w-full my-4 text-center">
                <p className="text-white/60"></p>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-lg w-full bg-white/[.04]">
            <p className="mb-1 text-white/60">Price</p>
            <div className="text-lg font-medium rounded-md text-white/90">
              {"Not for sale"}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};