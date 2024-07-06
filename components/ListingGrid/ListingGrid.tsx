"use client";

import {
  DirectListing,
  EnglishAuction,
  Offer,
  getAllValidAuctions,
  getAllValidListings,
  getAllValidOffers,
} from "thirdweb/extensions/marketplace";
import { NFT as NFTType, ThirdwebContract } from "thirdweb";
import React, { Suspense, useState, useEffect } from "react";
import { MARKETPLACE } from "../../const/contracts";
import NFTGrid, { NFTGridLoading } from "../NFT/NFTGrid";
import { useReadContract } from "thirdweb/react";

type Props = {
  marketplace: ThirdwebContract;
  collection: ThirdwebContract;
  overrideOnclickBehavior?: (nft: NFTType) => void;
  emptyText: string;
};

export default function ListingGrid(props: Props) {
  const [nftDataListing, setNftDataListing] = useState<DirectListing[]>([]);
  const [nftDataAuction, setNftDataAuction] = useState<EnglishAuction[]>([]);
  const [nftDataOffer, setNftDataOffer] = useState<Offer[]>([]);

  const {
    data: allValidListings,
    isLoading: isLoadingValidListings,
    refetch: refetchAllListings,
    isRefetching: isRefetchingAllListings,
  } = useReadContract(getAllValidListings, {
    contract: MARKETPLACE,
  });

  const {
    data: allValidAuctions,
    isLoading: isLoadingValidAuctions,
    refetch: refetchAllAuctions,
    isRefetching: isRefetchingAllAuctions,
  } = useReadContract(getAllValidAuctions, {
    contract: MARKETPLACE,
  });

  const {
    data: allValidOffers,
    isLoading: isLoadingValidOffers,
    refetch: refetchAllOffers,
    isRefetching: isRefetchingAllOffers,
  } = useReadContract(getAllValidOffers, {
    contract: MARKETPLACE,
  });

  useEffect(() => {
    const fetchData = async () => {
      await refetchAllListings();
      await refetchAllAuctions();
      await refetchAllOffers();
    };
    fetchData();
  }, [refetchAllListings, refetchAllAuctions, refetchAllOffers]);

  if (isLoadingValidListings || isLoadingValidAuctions || isLoadingValidOffers) {
    return <NFTGridLoading />;
  }

  if (!allValidListings || !allValidAuctions || !allValidOffers) {
    return <div>{props.emptyText}</div>;
  }

  const tokenIds = Array.from(
    new Set([
      ...allValidListings.filter((l) => l.assetContractAddress).map((l) => l.tokenId),
      ...allValidAuctions.filter((a) => a.assetContractAddress).map((a) => a.tokenId),
      ...allValidOffers.filter((a) => a.assetContractAddress).map((a) => a.tokenId),
    ])
  );

  const nftData = tokenIds.map((tokenId) => {
    const directListings = allValidListings.filter((listing) => listing.tokenId === tokenId);
    const auctionListings = allValidAuctions.filter((listing) => listing.tokenId === tokenId);
    const directOffers = allValidOffers.filter((offer) => offer.tokenId === tokenId);

    return {
      tokenId: tokenId,
      listing: [...directListings, ...auctionListings],
      offers: directOffers,
    };
  });

  return (
    <Suspense fallback={<NFTGridLoading />}>
      <NFTGrid
        nftData={nftData}
        emptyText={props.emptyText}
        overrideOnclickBehavior={props.overrideOnclickBehavior}
        refetchAllListings={refetchAllListings}
        refetchAllAuctions={refetchAllAuctions}
        refetchAllOffers={refetchAllOffers}
      />
    </Suspense>
  );
}
