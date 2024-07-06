"use client";

import React, { FC, useState, useEffect, useMemo } from "react";
import { useActiveAccount, useReadContract } from "thirdweb/react";
import { DirectListing, EnglishAuction, Offer } from "thirdweb/extensions/marketplace";
import BuyListingButton from "./BuyListingButton";
import BuyListingButtonErc20 from "./erc20Buybutton";
import ApprovalButtonERC20, { ioShiba } from "../SaleInfo/ApprovalShiba";
import { ADDRESS_ZERO, readContract } from "thirdweb";
import { MARKETPLACE } from "@/const/contracts";
import { toUnits9 } from "@/util/conversion";
import { useCurrency } from "@/Hooks/CurrencyProvider";
import MakeOfferButton from "./MakeOfferButton";
import { allowance } from "thirdweb/extensions/erc20";
import ApprovalButtonERC20Depinny, { Deppiny } from "../SaleInfo/ApprovalDepinny";
import BuyListingButtonErc20Depinny from "./erc20BuyButtonDepinny";

type INFTCardProps = {
  nft?: {
    tokenId: bigint;
    listing?: (DirectListing | EnglishAuction)[];
    offers?: Offer[];
  } | null;
  tokenId: bigint;
  contractAddress: string;
  refetchAllListings: () => void;
  refetchAllAuctions: () => void;
};

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
    address: '0xdff8596d62b6d35ffffc9e465d2fdea49ac3c311', // ioShiba
  },
  // Add more currencies here as needed
];

const INPUT_STYLES = "block w-full py-3 px-4 mb-4 bg-transparent border border-white text-base box-shadow-md rounded-lg mb-4";
const LEGEND_STYLES = "mb-2 text-white/80";

export const NftInformation: FC<INFTCardProps> = ({
  contractAddress,
  tokenId,
  nft,
  refetchAllListings,
  refetchAllAuctions,
}) => {
  const account = useActiveAccount();
  const { selectedCurrency } = useCurrency();
  const [tab, setTab] = useState<"direct" | "auction">("direct");

  const directListing = useMemo(() => 
    nft?.listing?.find(
      (l): l is DirectListing => 'currencyValuePerToken' in l && l.assetContractAddress === contractAddress && l.tokenId === tokenId
    ), 
    [nft, contractAddress, tokenId]
  );

  const auctionListing = useMemo(() => 
    nft?.listing?.find(
      (a): a is EnglishAuction => 'buyoutCurrencyValue' in a && a.assetContractAddress === contractAddress && a.tokenId === tokenId
    ), 
    [nft, contractAddress, tokenId]
  );

  useEffect(() => {
    console.log("Selected Currency:", selectedCurrency);
    console.log("Direct Listing:", directListing);
    console.log("Auction Listing:", auctionListing);
  }, [selectedCurrency, directListing, auctionListing]);

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

  const { data: ERC20Approvel } = useReadContract(allowance, {
    contract: ioShiba,
    owner: account?.address || ADDRESS_ZERO,
    spender: address,
  });


  const { data: ERC20ApprovelDepinny } = useReadContract(allowance, {
    contract: Deppiny,
    owner: account?.address || ADDRESS_ZERO,
    spender: address,
  });

  useEffect(() => {
    if (ERC20Approvel && account && directListing) {
      setIsTokenApproved(BigInt(ERC20Approvel) >= toUnits9(directListing.pricePerToken.toString()));
    }
  }, [ERC20Approvel, account, directListing]);

  useEffect(() => {
    if (ERC20ApprovelDepinny && account && directListing) {
      setIsTokenApproved(BigInt(ERC20ApprovelDepinny) >= (directListing.pricePerToken));
    }
  }, [ERC20ApprovelDepinny, account, directListing]);

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
                      {directListing.currencyValuePerToken.displayValue} <p>IOTX</p>
                      <p>Currency Contract Address: {directListing.currencyContractAddress}</p>
                      <p>Start Time: {new Date(Number(directListing.startTimeInSeconds) * 1000).toLocaleString()}</p>
                      <p>End Time: {formatRemainingTime(directListing.endTimeInSeconds)}</p>
                    </>
                  ) : directListing.currencyContractAddress === "0x3EA683354bf8d359cd9EC6E08B5AEC291D71d880" ? (
                    <>
                      {directListing.currencyValuePerToken.displayValue} <p>ioShiba</p>
                      <p>Currency Contract Address: {directListing.currencyContractAddress}</p>
                      <p>Start Time: {new Date(Number(directListing.startTimeInSeconds) * 1000).toLocaleString()}</p>
                      <p>End Time: {formatRemainingTime(directListing.endTimeInSeconds)}</p>
                    </>
                  ) : directListing.currencyContractAddress === "0xdfF8596d62b6d35fFFfc9e465d2FDeA49Ac3c311"? (
                    <>
                      {directListing.currencyValuePerToken.displayValue} <p>Depinny</p>
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
                  {formatPrice(auctionListing.buyoutCurrencyValue.displayValue, selectedCurrency.decimals)} {selectedCurrency.symbol}
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
                  {formatPrice(auctionListing.minimumBidCurrencyValue.displayValue, selectedCurrency.decimals)} {selectedCurrency.symbol}
                </div>
              </>
            )}
            <div className="flex flex-col">
              {directListing && (
                <>
                  {directListing.currencyContractAddress === "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" ? (
                    <BuyListingButton
                      directListing={directListing}
                      auctionListing={auctionListing || undefined}
                      refetchAllListings={refetchAllListings}
                    />
                  ) : !isTokenApproved && directListing.currencyContractAddress === "0x3EA683354bf8d359cd9EC6E08B5AEC291D71d880" && <ApprovalButtonERC20 amount={directListing.pricePerToken.toString()} onApproved={() => setIsTokenApproved(true)} address={address} />}

                  {isTokenApproved && directListing.currencyContractAddress === "0x3EA683354bf8d359cd9EC6E08B5AEC291D71d880" && (
                    <BuyListingButtonErc20
                      directListing={directListing}
                      auctionListing={auctionListing || undefined}
                      refetchAllListings={refetchAllListings}
                    />

                   )} 
                    <>
                      {!isTokenApproved && directListing.currencyContractAddress === "0xdfF8596d62b6d35fFFfc9e465d2FDeA49Ac3c311" && <ApprovalButtonERC20Depinny amount={directListing.pricePerToken.toString()} onApproved={() => setIsTokenApproved(true)} address={address} />}

                      {isTokenApproved && directListing.currencyContractAddress === "0xdfF8596d62b6d35fFFfc9e465d2FDeA49Ac3c311" && (
                        <BuyListingButtonErc20Depinny
                          directListing={directListing}
                          auctionListing={auctionListing || undefined}
                          refetchAllListings={refetchAllListings}
                        />
                      )}
                    </>
                  
                </>
              )}
              {auctionListing && (
                <BuyListingButton
                  directListing={directListing || undefined}
                  auctionListing={auctionListing}
                  refetchAllListings={refetchAllListings}
                />
              )}
              <div className="flex justify-center w-full my-4 text-center">
                <p className="text-white/60">or</p>
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
