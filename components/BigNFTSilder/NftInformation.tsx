import React, { FC, useState, useEffect, useMemo } from "react";
import { useActiveAccount, useReadContract } from "thirdweb/react";
import {  EnglishAuction, Offer } from "thirdweb/extensions/marketplace";
import BuyListingButton from "@/components/token/BuyListingButton";
import BuyListingButtonErc20 from "@/components/token/erc20Buybutton";
import ApprovalButtonERC20, { ioShiba } from "@/components/SaleInfo/ApprovalShiba";
import { Address, ADDRESS_ZERO, readContract } from "thirdweb";
import { MARKETPLACE } from "@/const/contracts";
import { toUnits9 } from "@/util/conversion";
import { useCurrency } from "@/Hooks/CurrencyProvider";
import MakeOfferButton from "@/components/token/MakeOfferButton";
import { allowance } from "thirdweb/extensions/erc20";
import ApprovalButtonERC20Depinny, { Deppiny } from "@/components/SaleInfo/ApprovalDepinny";
import BuyListingButtonErc20Depinny from "@/components/token/erc20BuyButtonDepinny";
import Style from "./BigNFTSlider.module.css";
import { MdTimer } from "react-icons/md";
import { useMarketplaceData } from "@/Hooks/MarketProvider";
import { ListingStatus } from "@/customDirectListing/DirectListingListingStatis";

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

type INFTCardProps = {
  tokenId: bigint;
  contractAddress: string;
};

const NftInformation: FC<INFTCardProps> = ({ contractAddress, tokenId }) => {
  const account = useActiveAccount();
  const { selectedCurrency } = useCurrency();
  const [tab, setTab] = useState<"direct" | "auction">("direct");
  const { validListings } = useMarketplaceData();

  const directListing = useMemo(() => 
    validListings?.find(
      (l): l is DirectListing => l.assetContractAddress === contractAddress && l.tokenId === tokenId
    ), 
    [validListings, contractAddress, tokenId]
  );

  
  const [isTokenApproved, setIsTokenApproved] = useState(false);

  const formatRemainingTime = (timestamp: bigint) => {
    const remainingTimeInSeconds = Number(timestamp) - Math.floor(Date.now() / 1000);
    if (remainingTimeInSeconds <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };

    const days = Math.floor(remainingTimeInSeconds / (24 * 60 * 60));
    const hours = Math.floor((remainingTimeInSeconds % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((remainingTimeInSeconds % (60 * 60)) / 60);
    const seconds = remainingTimeInSeconds % 60;

    return { days, hours, minutes, seconds };
  };

  const formattedTime = (time: { days: number, hours: number, minutes: number, seconds: number }) => {
    if (window.innerWidth <= 768) { // Adjust based on your breakpoints
      if (time.days > 0) {
        return (
          <>
            <div className={Style.bigNFTSlider_box_left_bidding_box_timer_item}>
              <div>{time.days}</div>
              <span>D</span>
            </div>
            <div className={Style.bigNFTSlider_box_left_bidding_box_timer_item}>
              <div>{time.hours}</div>
              <span>H</span>
            </div>
            <div className={Style.bigNFTSlider_box_left_bidding_box_timer_item}>
              <div>{time.minutes}</div>
              <span>Min</span>
            </div>
            <div className={Style.bigNFTSlider_box_left_bidding_box_timer_item}>
              <div>{time.seconds}</div>
              <span>Sec</span>
            </div>
          </>
        );
      } else if (time.hours > 0) {
        return (
          <>
            <div className={Style.bigNFTSlider_box_left_bidding_box_timer_item}>
              <div>{time.hours}</div>
              <span>Hours</span>
            </div>
            <div className={Style.bigNFTSlider_box_left_bidding_box_timer_item}>
              <div>{time.minutes}</div>
              <span>Minutes</span>
            </div>
            <div className={Style.bigNFTSlider_box_left_bidding_box_timer_item}>
              <div>{time.minutes}</div>
              <span>Minutes</span>
            </div>
          </>
        );
      } else {
        return (
          <>
            <div className={Style.bigNFTSlider_box_left_bidding_box_timer_item}>
              <div>{time.minutes}</div>
              <span>Minutes</span>
            </div>
            <div className={Style.bigNFTSlider_box_left_bidding_box_timer_item}>
              <div>{time.seconds}</div>
              <span>Seconds</span>
            </div>
          </>
        );
      }
    } else {
      return (
        <>
          <div className={Style.bigNFTSlider_box_left_bidding_box_timer_item}>
            <div>{time.days}</div>
            <span>Days</span>
          </div>
          <div className={Style.bigNFTSlider_box_left_bidding_box_timer_item}>
            <div>{time.hours}</div>
            <span>Hours</span>
          </div>
          <div className={Style.bigNFTSlider_box_left_bidding_box_timer_item}>
            <div>{time.minutes}</div>
            <span>Minutes</span>
          </div>
          <div className={Style.bigNFTSlider_box_left_bidding_box_timer_item}>
            <div>{time.seconds}</div>
            <span>Seconds</span>
          </div>
        </>
      );
    }
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
    const checkApproval = async () => {
      try {
        if (ERC20Approvel && account && directListing) {
          setIsTokenApproved(BigInt(ERC20Approvel) >= toUnits9(directListing.pricePerToken.toString()));
        }
      } catch (error) {
        console.error("Error fetching ERC20 approval:", error);
      }
    };

    checkApproval();
  }, [ERC20Approvel, account, directListing]);

  useEffect(() => {
    const checkApprovalDepinny = async () => {
      try {
        if (ERC20ApprovelDepinny && account && directListing) {
          setIsTokenApproved(BigInt(ERC20ApprovelDepinny) >= (BigInt(directListing.pricePerToken)));
        }
      } catch (error) {
        console.error("Error fetching ERC20 approval Depinny:", error);
      }
    };

    checkApprovalDepinny();
  }, [ERC20ApprovelDepinny, account, directListing]);

  const time = directListing ? formatRemainingTime(directListing.endTimeInSeconds) :
      { days: 0, hours: 0, minutes: 0, seconds: 0 };

  return (
    <div>
      <div className="">
        {directListing ? (
          <div className={Style.bigNFTSlider_box_left_bidding}>
            <div className={Style.bigNFTSlider_box_left_bidding_box}>
              <small>Price</small>
              <div>
                {directListing ? (
                  <>
                    {directListing.pricePerToken} <span>{directListing.currencyContractAddress === "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" ? "IOTX" : directListing.currencyContractAddress === "0x3EA683354bf8d359cd9EC6E08B5AEC291D71d880" ? "ioShiba" : directListing.currencyContractAddress === "0xdfF8596d62b6d35fFFfc9e465d2FDeA49Ac3c311" ? "Depinny" : "N/A"}</span>
                  </>
                ) : (
                  "N/A"
                )}
              </div>
            </div>

            {directListing && (
              <>
                <div className={Style.bigNFTSlider_box_left_bidding_box_auction}>
                  <MdTimer className={Style.bigNFTSlider_box_left_bidding_box_icon} />
                  <span>Start Time</span>
                </div>
                <div className={Style.bigNFTSlider_box_left_bidding_box_timer}>
                  <div>{new Date(Number(directListing.startTimeInSeconds) * 1000).toLocaleString()}</div>
                </div>
                <div className={Style.bigNFTSlider_box_left_bidding_box_auction}>
                  <MdTimer className={Style.bigNFTSlider_box_left_bidding_box_icon} />
                  <span>End Time</span>
                </div>
                <div className={Style.bigNFTSlider_box_left_bidding_box_timer}>
                  {formattedTime(time)}
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
              
              <div className="flex justify-center w-full my-4 text-center">
                <div className="text-white/60"></div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-lg w-full bg-white/[.04]">
            <div className="mb-1 text-white/60">Price</div>
            <div className="text-lg font-medium rounded-md text-white/90">
              {"Not for sale"}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default  NftInformation;