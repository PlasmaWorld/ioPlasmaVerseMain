import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useSwipeable } from "react-swipeable";
import { ADDRESS_ZERO, getContract, readContract, toUnits, NFT as NFTType } from "thirdweb";
import { getNFT, isApprovedForAll } from "thirdweb/extensions/erc721";
import { DirectListing, EnglishAuction, Offer } from "thirdweb/extensions/marketplace";
import { useActiveAccount, useReadContract } from "thirdweb/react";
import { MARKETPLACE, NETWORK } from "@/const/contracts";
import client from "@/lib/client";
import ApprovalButtonERC20 from "../SaleInfo/ApprovalShiba";
import DirectListingButtonShiba from "../SaleInfo/DirectListingButtonShiba";
import { getContractInstance } from "@/const/cotractInstance";
import styles from "../NFT/NftCard.module.css";
import cn from "classnames";
import { getContractMetadata } from "thirdweb/extensions/common";
import { SpunksRankingNew } from "@/const/contractabi";
import { NFTMetadata } from "thirdweb/dist/types/utils/nft/parseNft";

type Props = {
  tokenId?: string;
  contractAddress: string;
  nft?: {
    tokenId: bigint;
    listing?: (DirectListing | EnglishAuction)[];
    offers?: Offer[];
  } | null;
  refetchAllListings: () => void;
  refetchAllAuction: () => void;
  refetchAllOffers: () => void;
};

const INPUT_STYLES = "block w-full py-3 px-4 mb-4 bg-transparent border border-white text-base box-shadow-md rounded-lg mb-4";
const LEGEND_STYLES = "mb-2 text-white/80";

const getRanking = (id: string) => {
  const rankingData = SpunksRankingNew.find((item) => item.spunk === id);
  return rankingData ? rankingData.ranking : null;
};

const ListingSectionShiba = ({ contractAddress, nft, tokenId, refetchAllListings, refetchAllAuction, refetchAllOffers }: Props) => {
  const account = useActiveAccount();
  const [currentNFT, setCurrentNFT] = useState<NFTType | null>(null);
  const [isTokenApproved, setIsTokenApproved] = useState(false);
  const [directListingState, setDirectListingState] = useState({ price: "0" });
  const [currencyTab, setCurrencyTab] = useState<"native" | "shiba">("native");
  const address = MARKETPLACE.address as `0x${string}`;

  const { register: registerDirect, watch: watchDirect } = useForm();
  const handlers = useSwipeable({ onSwipedLeft: () => {}, trackMouse: true });

  const ioSibaErc20 = "0x3ea683354bf8d359cd9ec6e08b5aec291d71d880";
  const ioShiba = getContract({ address: ioSibaErc20, client, chain: NETWORK });

  // Fetch NFT data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const contractInstance = getContractInstance(nft?.listing?.[0].assetContractAddress || contractAddress);
        const contractMetadata = await getContractMetadata({ contract: contractInstance });
        const nftData = await getNFT({
          contract: contractInstance,
          tokenId: BigInt(tokenId || nft?.tokenId || 0),
          includeOwner: true,
        });
        const normalizedNFT = nft?.listing?.[0].assetContractAddress === "0x0c5AB026d74C451376A4798342a685a0e99a5bEe"
          ? {
              ...nftData,
              metadata: {
                name: nftData.metadata.name || "Default Name",
                description: nftData.metadata.description || "Default Description",
                image: "/MachinFi.mp4",
              } as NFTMetadata,
            }
          : nftData;

        setCurrentNFT(normalizedNFT);
      } catch (error) {
        console.error("Error fetching NFT:", error);
      }
    };

    if (nft || tokenId && contractAddress) {
      fetchData();
    }
  }, [nft, tokenId, contractAddress]);

  // Check token approval
  useEffect(() => {
    const checkApproval = async () => {
      if (!account) return;

      const allowance = await readContract({
        contract: ioShiba,
        method: "function allowance(address owner, address spender) view returns (uint256)",
        params: [account.address, address],
      });
      setIsTokenApproved(BigInt(allowance) >= toUnits(directListingState.price, 9));
    };
    checkApproval();
  }, [account, directListingState.price]);

  // Read contract approval
  const validContractAddress = contractAddress ?? "";
  const Contract = getContract({ address: validContractAddress, client, chain: NETWORK });
  const { data: hasApproval } = useReadContract(isApprovedForAll, {
    contract: Contract,
    owner: account?.address || ADDRESS_ZERO,
    operator: address,
  });

  return (
    <div>
      <div>
        <h4 className={styles.formSectionTitle}>When</h4>
        <legend className={styles.legend}>Listing Starts on</legend>
        <input className={styles.input} type="datetime-local" {...registerDirect("startDate")} aria-label="Auction Start Date" />
        <legend className={styles.legend}>Listing Ends on</legend>
        <input className={styles.input} type="datetime-local" {...registerDirect("endDate")} aria-label="Auction End Date" />
        <legend className={cn(LEGEND_STYLES)}>Price per token</legend>
        <input className={cn(INPUT_STYLES)} type="number" step={0.000001} value={directListingState.price} onChange={(e) => setDirectListingState({ price: e.target.value })} />
      </div>

      {hasApproval && currencyTab === "shiba" && currentNFT && !isTokenApproved && (
        <ApprovalButtonERC20 amount={directListingState.price} onApproved={() => setIsTokenApproved(true)} address={address} />
      )}
      {hasApproval && currencyTab === "shiba" && currentNFT && isTokenApproved && (
        <DirectListingButtonShiba
          nft={currentNFT}
          pricePerToken={directListingState.price}
          listingStart={watchDirect("startDate")}
          listingEnd={watchDirect("endDate")}
          contractAddress={validContractAddress}
          refetchAllListings={refetchAllListings}
        />
      )}
    </div>
  );
};

export default ListingSectionShiba;
