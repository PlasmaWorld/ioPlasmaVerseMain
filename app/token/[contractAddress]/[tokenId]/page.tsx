import { getAllValidListings, getAllValidAuctions } from "thirdweb/extensions/marketplace";
import { ChattApp2, MARKETPLACE } from "@/const/contracts";
import { getNFT } from "thirdweb/extensions/erc721";
import TokenPage from '@/components/TokenPage/TokenPage';
import { Metadata } from 'next';
import React from 'react';

export const revalidate = 0;

async function fetchNFTData(contractAddress: string, tokenId: string) {
  const listingsPromise = getAllValidListings({
    contract: MARKETPLACE,
  });
  const auctionsPromise = getAllValidAuctions({
    contract: MARKETPLACE,
  });
  const nftPromise = getNFT({
    contract: ChattApp2,
    tokenId: BigInt(tokenId),
    includeOwner: true,
  });

  const [listings, auctions, nft] = await Promise.all([
    listingsPromise,
    auctionsPromise,
    nftPromise,
  ]);

  const directListing = listings?.find(
    (l) =>
      l.assetContractAddress === contractAddress &&
      l.tokenId === BigInt(tokenId)
  );

  const auctionListing = auctions?.find(
    (a) =>
      a.assetContractAddress === contractAddress &&
      a.tokenId === BigInt(tokenId)
  );

  let vrmFileUrl = null;
  if (typeof nft.metadata.vrm_url === 'string' && nft.metadata.vrm_url.startsWith('ipfs://')) {
    vrmFileUrl = `https://ipfs.io/ipfs/${nft.metadata.vrm_url.slice(7)}`;
  }

  return {
    nft,
    directListing: directListing || null,
    auctionListing: auctionListing || null,
    vrmFileUrl,
  };
}

export default async function Page({ params }: { params: { contractAddress: string; tokenId: string } }) {
  const { contractAddress, tokenId } = params;
  const data = await fetchNFTData(contractAddress, tokenId);

  return <TokenPage {...data} />;
}
