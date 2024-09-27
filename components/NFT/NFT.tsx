"use client";
import React, { useEffect, useState } from "react";
import { NFT as NFTType, Address } from "thirdweb";

import { NFT_COLLECTION } from "../../const/contracts";
import { DirectListing, EnglishAuction } from "thirdweb/extensions/marketplace";
import { MediaRenderer } from "thirdweb/react";
import { getNFT } from "thirdweb/extensions/erc721";
import client from "@/lib/client";
import Skeleton from "@/components/Skeleton";
import { useRouter } from "next/navigation";
import { getContractInstance } from "@/const/cotractInstance";

type Props = {
	tokenId: bigint;
  listing: DirectListing | EnglishAuction;

};

export default function NFTComponent({
  tokenId,
  listing,
  ...props
}: Props) {
  const router = useRouter();
  const [nft, setNFT] = useState<NFTType | null>(null);

  useEffect(() => {
    if (tokenId) {

      const contract = getContractInstance("");

      getNFT({
        contract: contract,
        tokenId: BigInt(tokenId), // Ensure tokenId is converted to bigint
        includeOwner: true,
      }).then((nft) => {
        setNFT(nft);
      }).catch((error) => {
      });
    }
  }, [tokenId, listing?.assetContractAddress]);

  if (!nft) {
    return <LoadingNFTComponent />;
  }

  return (
    <div
      className="cursor-pointer transition-all hover:scale-105 hover:shadow-lg flex flex-col w-full h-[350px] bg-white/[.04] justify-stretch border overflow-hidden border-white/10 rounded-lg"
      
    >
      <div className="relative w-full h-64 bg-white/[.04]">
        {nft.metadata.image && (
          <MediaRenderer
            src={nft.metadata.image}
            client={client}
            className="object-cover object-center"
          />
        )}
      </div>
      <div className="flex items-center justify-between flex-1 w-full px-3">
        <div className="flex flex-col justify-center py-3">
          <p className="max-w-full overflow-hidden text-lg text-white text-ellipsis whitespace-nowrap">
            {nft.metadata.name}
          </p>
          <p className="text-sm font-semibold text-white/60">
						#{nft.id.toString()}
          </p>
        </div>

        
      </div>
    </div>
  );
}

export function LoadingNFTComponent() {
  return (
    <div className="w-full h-[350px] rounded-lg">
      <Skeleton width="100%" height="100%" />
    </div>
  );
}