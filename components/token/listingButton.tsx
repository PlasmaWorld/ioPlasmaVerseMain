import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useSwipeable } from "react-swipeable";
import { ADDRESS_ZERO, getContract, NFT as NFTType, toUnits } from "thirdweb";
import { getNFT, isApprovedForAll } from "thirdweb/extensions/erc721";
import { DirectListing, EnglishAuction, Offer } from "thirdweb/extensions/marketplace";
import { useActiveAccount, useReadContract } from "thirdweb/react";
import { MARKETPLACE, NETWORK } from "@/const/contracts";
import client from "@/lib/client";
import ApprovalButton from "../SaleInfo/ApproveButton";
import ApprovalButtonERC20 from "../SaleInfo/ApprovalShiba";
import AuctionListingButton from "../SaleInfo/AuctionListingButton";
import DirectListingButton from "../SaleInfo/DirectListingButton";
import DirectListingDeppiny from "../SaleInfo/DirectListingErc20";
import DirectListingButtonShiba from "../SaleInfo/DirectListingButtonShiba";
import { getContractInstance } from "@/const/cotractInstance";
import styles from "../NFT/NftCard.module.css";
import cn from "classnames";
import { getContractMetadata } from "thirdweb/extensions/common";
import { SpunksRankingNew } from "@/const/contractabi";
import { NFTMetadata } from "thirdweb/dist/types/utils/nft/parseNft";
import { toUnits9 } from "@/util/conversion";
import { allowance } from "thirdweb/extensions/erc20";
import { Deppiny } from "../SaleInfo/ApprovalDepinny";
import { useUser } from "@/Hooks/UserInteraction";

type Props = {
  tokenId?: string;
  contractAddress: string;  
};

const INPUT_STYLES = "block w-full py-3 px-4 mb-4 bg-transparent border border-white text-base box-shadow-md rounded-lg mb-4";
const LEGEND_STYLES = "mb-2 text-white/80";

const getRanking = (id: string) => {
  const rankingData = SpunksRankingNew.find((item) => item.spunk === id);
  return rankingData ? rankingData.ranking : null;
};

const ListingSection = ({ contractAddress, tokenId }: Props) => {
  const account = useActiveAccount();
  const [showInfo, setShowInfo] = useState(false);
  const [ranking, setRanking] = useState<number | null>(null);
  const [contract, setContract] = useState("");
  const [tab, setTab] = useState<"direct" | "auction">("direct");
  const [currencyTab, setCurrencyTab] = useState<"native" | "shiba" | "Depinny">("native");
  const [isTokenApproved, setIsTokenApproved] = useState(false);
  const [currentNFT, setCurrentNFT] = useState<NFTType | null>(null);
  const [directListingState, setDirectListingState] = useState({ price: "0" });
  const [auctionListingState, setAuctionListingState] = useState({ minimumBidAmount: "0", buyoutPrice: "0" });
  const [directListingShibaState, setDirectListingShibaState] = useState({ price: "0" });
  const toUnits = (value: string) => BigInt(value) * BigInt(10 ** 18);
  const { userExists: ExistUser , } = useUser();

  const { register: registerDirect, watch: watchDirect } = useForm();
  const { register: registerAuction, watch: watchAuction } = useForm();
  const handlers = useSwipeable({ onSwipedLeft: () => setShowInfo(false), trackMouse: true });

  const ioSibaErc20 = "0x3ea683354bf8d359cd9ec6e08b5aec291d71d880";
  const ioShiba = getContract({ address: ioSibaErc20, client, chain: NETWORK });

  const handlePriceChange = (e: { target: { value: any; }; }) => {
    const inputPrice = e.target.value;
    setDirectListingShibaState({ price: inputPrice });
  };
  const address = MARKETPLACE.address as `0x${string}`;


  
  const { data: ERC20Approvel } = useReadContract(allowance, {
    contract: ioShiba,
    owner: account?.address || ADDRESS_ZERO,
    spender: address,
  });

  useEffect(() => {
    if (ERC20Approvel) {
      setIsTokenApproved(BigInt(ERC20Approvel) >= toUnits9(directListingShibaState.price));
    }
  }, [ERC20Approvel, directListingShibaState.price]);

  const { data: ERC20ApprovelDepinny } = useReadContract(allowance, {
    contract: Deppiny,
    owner: account?.address || ADDRESS_ZERO,
    spender: address,
  });

  useEffect(() => {
    if (ERC20ApprovelDepinny) {
      setIsTokenApproved(BigInt(ERC20ApprovelDepinny) >= toUnits(directListingState.price)); // Using appropriate units conversion
    } 
  }, [ERC20ApprovelDepinny, directListingState.price]);

  const validContractAddress = contractAddress ?? "";
  const Contract = getContract({ address: validContractAddress, client, chain: NETWORK });
  const { data: hasApproval } = useReadContract(isApprovedForAll, { contract: Contract, owner: account?.address || ADDRESS_ZERO, operator: address });
  
  
  return (
    <div>
      <div className="flex justify-start w-full mb-6 border-b border-white/60">
        <h3 className={cn("px-4 h-12 flex items-center justify-center text-base font-semibold cursor-pointer transition-all hover:text-white/80", tab === "direct" && "text-[#0294fe] border-b-2 border-[#0294fe]")} onClick={() => setTab("direct")}>Direct</h3>
        <h3 className={cn("px-4 h-12 flex items-center justify-center text-base font-semibold cursor-pointer transition-all hover:text-white/80", tab === "auction" && "text-[#0294fe] border-b-2 border-[#0294fe]")} onClick={() => setTab("auction")}>Auction</h3>
      </div>

      <div className="flex justify-start w-full mb-6 border-b border-white/60">
        <h3 className={cn("px-4 h-12 flex items-center justify-center text-base font-semibold cursor-pointer transition-all hover:text-white/80", currencyTab === "native" && "text-[#0294fe] border-b-2 border-[#0294fe]")} onClick={() => setCurrencyTab("native")}>Native</h3>
        <h3 className={cn("px-4 h-12 flex items-center justify-center text-base font-semibold cursor-pointer transition-all hover:text-white/80", currencyTab === "shiba" && "text-[#0294fe] border-b-2 border-[#0294fe]")} onClick={() => setCurrencyTab("shiba")}>Shiba</h3>
        <h3 className={cn("px-4 h-12 flex items-center justify-center text-base font-semibold cursor-pointer transition-all hover:text-white/80", currencyTab === "Depinny" && "text-[#0294fe] border-b-2 border-[#0294fe]")} onClick={() => setCurrencyTab("Depinny")}>Depinny</h3>
      </div>

      <div className={cn(tab === "direct" ? "flex" : "hidden", "flex-col")}>
        {hasApproval && currencyTab === "native"  && (
          <div>
            <h4 className={styles.formSectionTitle}>When</h4>
            <legend className={styles.legend}>Listing Starts on</legend>
            <input className={styles.input} type="datetime-local" {...registerDirect("startDate")} aria-label="Auction Start Date" />
            <legend className={styles.legend}>Listing Ends on</legend>
            <input className={styles.input} type="datetime-local" {...registerDirect("endDate")} aria-label="Auction End Date" />
            <legend className={cn(LEGEND_STYLES)}>Price per token</legend>
            <input className={cn(INPUT_STYLES)} type="number" step={0.000001} value={directListingState.price} onChange={(e) => setDirectListingState({ price: e.target.value })} />
          </div>
        )}
        {hasApproval && currencyTab === "native" && tokenId && (
          <DirectListingButton tokenId={BigInt(tokenId)} pricePerToken={directListingState.price} listingStart={watchDirect("startDate")} listingEnd={watchDirect("endDate")} contractAddress={validContractAddress}  />
        )}
        {hasApproval && currencyTab === "shiba"  && (
          <div>
            <h4 className={styles.formSectionTitle}>When</h4>
            <legend className={styles.legend}>Listing Starts on</legend>
            <input className={styles.input} type="datetime-local" {...registerDirect("startDate")} aria-label="Auction Start Date" />
            <legend className={styles.legend}>Listing Ends on</legend>
            <input className={styles.input} type="datetime-local" {...registerDirect("endDate")} aria-label="Auction End Date" />
            <legend className={cn(LEGEND_STYLES)}>Price per token</legend>
            <input className={cn(INPUT_STYLES)} type="number" step={0.000001} value={directListingState.price} onChange={(e) => setDirectListingState({ price: e.target.value })} />
          </div>
        )}
        {!hasApproval && currencyTab === "shiba" &&  <ApprovalButton contractAddress={validContractAddress} address={address} />}
          
        {hasApproval && currencyTab === "shiba" && tokenId &&  (
          <DirectListingButtonShiba
          tokenId={BigInt(tokenId)}
            pricePerToken={toUnits9(directListingState.price).toString()}
            listingStart={watchDirect("startDate")}
            listingEnd={watchDirect("endDate")}
            contractAddress={validContractAddress}
          />
        
        )}

        {hasApproval && currencyTab === "Depinny"  && (
          <div>
          <h4 className={styles.formSectionTitle}>When</h4>
          <legend className={styles.legend}>Listing Starts on</legend>
          <input className={styles.input} type="datetime-local" {...registerDirect("startDate")} aria-label="Auction Start Date" />
          <legend className={styles.legend}>Listing Ends on</legend>
          <input className={styles.input} type="datetime-local" {...registerDirect("endDate")} aria-label="Auction End Date" />
          <legend className={cn(LEGEND_STYLES)}>Price per token</legend>
          <input className={cn(INPUT_STYLES)} type="number" step={0.000001} value={directListingState.price} onChange={(e) => setDirectListingState({ price: e.target.value })} />
        </div>
        )}
        {!hasApproval && currencyTab === "Depinny" &&  <ApprovalButton contractAddress={validContractAddress} address={address} />}
          
        {hasApproval && currencyTab === "Depinny"  && tokenId && (
          <DirectListingDeppiny
          tokenId={BigInt(tokenId)}   
           pricePerToken={directListingState.price}
            listingStart={watchDirect("startDate")}
            listingEnd={watchDirect("endDate")}
            contractAddress={validContractAddress}
          />
        )}
      </div>

      <div className={cn(tab === "auction" ? "flex" : "hidden", "flex-col")}>
        <h4 className={styles.formSectionTitle}>When</h4>
        <legend className={styles.legend}>Auction Starts on</legend>
        <input className={styles.input} type="datetime-local" {...registerAuction("startDate")} aria-label="Auction Start Date" />
        <legend className={styles.legend}>Auction Ends on</legend>
        <input className={styles.input} type="datetime-local" {...registerAuction("endDate")} aria-label="Auction End Date" />
        <legend className={cn(LEGEND_STYLES)}>Allow bids starting from</legend>
        <input className={cn(INPUT_STYLES)} step={0.000001} type="number" value={auctionListingState.minimumBidAmount} onChange={(e) => setAuctionListingState({ ...auctionListingState, minimumBidAmount: e.target.value })} />
        <legend className={cn(LEGEND_STYLES)}>Buyout price</legend>
        <input className={cn(INPUT_STYLES)} type="number" step={0.000001} value={auctionListingState.buyoutPrice} onChange={(e) => setAuctionListingState({ ...auctionListingState, buyoutPrice: e.target.value })} />
        {!hasApproval ? (
          <ApprovalButton contractAddress={validContractAddress} address={address} />
        ) : (
          tokenId && (
            <AuctionListingButton tokenId={BigInt(tokenId)} minimumBidAmount={auctionListingState.minimumBidAmount} buyoutBidAmount={auctionListingState.buyoutPrice} auctionStart={watchAuction("startDate")} auctionEnd={watchAuction("endDate")} contractAddress={validContractAddress}  />
          )
        )}
      </div>
    </div>
  );
};

export default ListingSection;
