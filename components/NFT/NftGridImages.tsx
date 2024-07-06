"use client";
import type { NFT as NFTType } from "thirdweb";
import React from "react";
import { NFTCard } from "./NFTCard";

type Props = {
  tokenId: string;
  contract: string;
  refetchProfileImage: () => void;

};

export default function NFTGridOwne({ tokenId, contract, refetchProfileImage }: Props) {
  if (tokenId) {
    return (
      <div className="grid justify-start grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <NFTCard tokenId={tokenId} contractAddress={contract} refetchProfileImage={refetchProfileImage} />
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center h-[500px]">
      <p className="max-w-lg text-lg font-semibold text-center text-white/60">
        No NFTs to display.
      </p>
    </div>
  );
}

