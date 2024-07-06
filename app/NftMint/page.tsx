'use client';

import Image from "next/image";
import { ConnectButton, MediaRenderer, TransactionButton, useActiveAccount, useReadContract } from "thirdweb/react";
import { defineChain, getContract, toEther } from "thirdweb";
import { getContractMetadata } from "thirdweb/extensions/common";
import { claimTo, getActiveClaimCondition, getOwnedNFTs, getTotalClaimedSupply, nextTokenIdToMint } from "thirdweb/extensions/erc721";
import { useCallback, useState, useEffect, useMemo } from "react";
import client from "@/lib/client";
import { MARKETPLACE, NFT_COLLECTION } from "@/const/contracts";
import toastStyle from "@/util/toastConfig";
import toast from "react-hot-toast";
import { NFTCard } from "@/components/NFT/NftCardGalerie";
import { getAllValidAuctions, getAllValidListings, getAllValidOffers } from "thirdweb/extensions/marketplace";

export default function Home() {
  const account = useActiveAccount();
  const [loading, setLoading] = useState(false);
  const [ownedNfts, setOwnedNfts] = useState<{ [key: string]: string[] }>({});
  const [quantity, setQuantity] = useState(1);

  const chain = defineChain(4689);
  const contract = NFT_COLLECTION;
  const address = account?.address;
  const fetchOwnedNFt = useCallback(async () => {
    if (!account) return;
    setLoading(true);

    try {
      const ownedNFTs = await getOwnedNFTs({
        contract: NFT_COLLECTION,
        owner: account.address,
      });

      const ids = ownedNFTs.map(nft => nft.id.toString());

      setOwnedNfts(prevState => ({
        ...prevState,
        "0x0c5AB026d74C451376A4798342a685a0e99a5bEe": ids
      }));
    } catch (err) {
      toast.error(
        "Something went wrong while fetching your NFTs!",
        {
          position: "bottom-center",
          style: toastStyle,
        }
      );
      console.error("Error fetching owned NFTs:", err);
    } finally {
      setLoading(false);
    }
  }, [account]);

  const { data: contractMetadata, isLoading: isContractMetadataLoading } = useReadContract(getContractMetadata, {
    contract: contract
  });

  const { data: claimedSupply, isLoading: isClaimedSupplyLoading } = useReadContract(getTotalClaimedSupply, {
    contract: contract
  });

  const { data: totalNFTSupply, isLoading: isTotalSupplyLoading } = useReadContract(nextTokenIdToMint, {
    contract: contract
  });

  const { data: claimCondition } = useReadContract(getActiveClaimCondition, {
    contract: contract
  });
  const {
    data: allValidListings,
    isLoading: isLoadingValidListings,
    refetch: refetchAllListings,
  } = useReadContract(getAllValidListings, {
    contract: MARKETPLACE,
  });

  const {
    data: allValidAuctions,
    isLoading: isLoadingValidAuctions,
    refetch: refetchAllAuctions,
  } = useReadContract(getAllValidAuctions, {
    contract: MARKETPLACE,
  });

  const {
    data: allValidOffers,
    isLoading: isLoadingValidOffers,
    refetch: refetchAllOffers,
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

  const tokenIds = useMemo(() => {
    return Array.from(
      new Set([
        ...allValidListings?.filter((l) => l.assetContractAddress).map((l) => l.tokenId) ?? [],
        ...allValidAuctions?.filter((a) => a.assetContractAddress).map((a) => a.tokenId) ?? [],
        ...allValidOffers?.filter((a) => a.assetContractAddress).map((a) => a.tokenId) ?? [],
      ])
    );
  }, [allValidListings, allValidAuctions, allValidOffers]);

  const nftData = useMemo(() => {
    return tokenIds.map((tokenId) => {
      const directListings = allValidListings?.filter((listing) => listing.tokenId === tokenId) ?? [];
      const auctionListings = allValidAuctions?.filter((listing) => listing.tokenId === tokenId) ?? [];
      const directOffers = allValidOffers?.filter((offer) => offer.tokenId === tokenId) ?? [];

      return {
        tokenId: tokenId,
        listing: [...directListings, ...auctionListings],
        offers: directOffers,
      };
    });
  }, [tokenIds, allValidListings, allValidAuctions, allValidOffers]);


  const getPrice = (quantity: number) => {
    const total = quantity * parseInt(claimCondition?.pricePerToken.toString() || "0");
    return toEther(BigInt(total));
  }

  useEffect(() => {
    fetchOwnedNFt();
  }, [fetchOwnedNFt]);

  return (
    <main className="p-4 pb-10 min-h-screen flex flex-col items-center justify-center container max-w-screen-lg mx-auto bg-gray-900">
      <Header />
      <div>
        <p className="text-lg text-center text-gray-400 mt-4 max-w-2xl mx-auto">
          Welcome to the Plasma World Foundation Nft-Mint! Launched on April 28, 2024, with the debut of ioPlasmaVerse, our community-driven platform is managed entirely by NFT holders. As stakeholders, NFT holders will benefit from 20% of the revenue generated by every new business venture we embark on in the years ahead. Join us in shaping the future together!
        </p>
      </div>
      <div className="py-20 text-center">
        <div className="bg-white bg-opacity-10 backdrop-blur-lg p-8 rounded-xl shadow-2xl border border-gray-300 flex flex-col items-center mt-4 transform transition-transform hover:scale-105 hover:shadow-2xl">
          {isContractMetadataLoading ? (
            <p className="text-lg text-gray-400">Loading...</p>
          ) : (
            <>
              <MediaRenderer
                client={client}
                src="ipfs://QmdccASYb46uoYKpjyFrTTNY9KBbkJUfx6t2wjMJ6JcqRd/H1.mp4"
                className="rounded-xl shadow-lg mb-4"
              />
              <h2 className="text-2xl font-semibold mt-4 text-white">
                {contractMetadata?.name}
              </h2>
              <p className="text-lg mt-2 text-gray-300">
                {contractMetadata?.description}
              </p>
            </>
          )}
          {isClaimedSupplyLoading || isTotalSupplyLoading ? (
            <p className="text-lg text-gray-400 mt-4">Loading...</p>
          ) : (
            <p className="text-lg mt-2 font-bold text-white">
              Total NFT Supply: {claimedSupply?.toString()}/{totalNFTSupply?.toString()}
            </p>
          )}
          <div className="flex flex-row items-center justify-center my-4">
            <button
              className="bg-gray-800 text-white px-4 py-2 rounded-md mr-4 hover:bg-gray-700 transition duration-300"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
            >-</button>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value))}
              className="w-12 text-center border border-gray-500 rounded-md bg-gray-900 text-white focus:outline-none"
            />
            <button
              className="bg-gray-800 text-white px-4 py-2 rounded-md ml-4 hover:bg-gray-700 transition duration-300"
              onClick={() => setQuantity(quantity + 1)}
            >+</button>
          </div>
          { address && (
            <TransactionButton
            transaction={() => claimTo({
              contract: contract,
              to: address ,
              quantity: BigInt(quantity),
            })}
            onTransactionConfirmed={async () => {
              alert("NFT Claimed!");
              setQuantity(1);
              fetchOwnedNFt();
            }}
          >
            {`Claim NFT (${getPrice(quantity)} IoTeX)`}
          </TransactionButton>                
            )}
          
        </div>
        <div className="mt-8">
          <div className="flex flex-wrap items-center justify-center gap-8">
            {ownedNfts["0x0c5AB026d74C451376A4798342a685a0e99a5bEe"]?.map(id => (
              <NFTCard key={id} tokenId={BigInt(id)} contractAddresse={"0x0c5AB026d74C451376A4798342a685a0e99a5bEe"}    nft={nftData.find(nft => nft.tokenId === BigInt(id)) || null}
              refetchAllAuctions={refetchAllAuctions} refetchAllListings={refetchAllListings} refetchAllOffers={refetchAllOffers}  />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

function Header() {
  return (
    <header className="flex item-row items-center justify-center mb-6">
      <h1 className="text-4xl md:text-6xl font-semibold md:font-bold tracking-tighter text-zinc-100">
        NFT Claim App
      </h1>
    </header>
  );
}
