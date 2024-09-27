"use client";

import React, { FC, useEffect, useState, useCallback, useMemo } from "react";
import { useReadContract } from "thirdweb/react";
import { ChattApp, MARKETPLACE } from "@/const/contracts";
import { Address, readContract, resolveMethod, ThirdwebContract } from "thirdweb";
import { ListingStatus } from "@/customDirectListing/DirectListingListingStatis";
import { BigNumber } from "ethers";
import { totalAuctions, totalListings } from "thirdweb/extensions/marketplace";

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

type ContractAddresses = {
  [key: string]: string;
};

interface CurrencyData {
  symbol: string;
  decimals: number;
  address: Address;
}

const CURRENCY_DATA: CurrencyData[] = [
  { symbol: 'IOTX', decimals: 18, address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE' }, // Native
  { symbol: 'ioShiba', decimals: 9, address: '0x3EA683354bf8d359cd9EC6E08B5AEC291D71d880' }, // ioShiba
  { symbol: 'dePinny', decimals: 18, address: '0xdfF8596d62b6d35fFFfc9e465d2FDeA49Ac3c311' }  // depinny
];

const Stats: FC<{ contractAddress: string }> = ({ contractAddress }) => {

  const [totalListingsCount, setTotalListingsCount] = useState<number | null>(null);
  const [totalAuctionsCount, setTotalAuctionsCount] = useState<number | null>(null);
  const [allListings, setAllListings] = useState<DirectListing[]>([]);
  const [allAuctions, setAllAuctions] = useState<EnglishAuction[]>([]);
  const [activeAccountCount, setActiveAccountCount] = useState<number>(0);
  const [totalVolume2, setTotalVolume2] = useState<Record<string, number>>({});
  const [transactionsCount, setTransactionsCount] = useState<Record<string, number>>({});
  const [currentCurrencyIndex, setCurrentCurrencyIndex] = useState<number>(0);
  const [allValidAuctions, setAllValidAuctions] = useState<EnglishAuction[]>([]);
  const [allValidListings, setAllValidListings] = useState<DirectListing[]>([]);
  const [validListings, setValidListings] = useState<DirectListing[]>([]);
  const [validAuctions, setValidAuctions] = useState<EnglishAuction[]>([]);
  const [totalCountAuctions, setTotalCountAuctions] = useState<number | undefined>(undefined);
  const [totalCount, setTotalCount] = useState<number | undefined>(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(false);

 
  const fetchTotalCountAuctions = useCallback(async (contract: ThirdwebContract) => {
    try {
      const result = await totalAuctions({
        contract: MARKETPLACE,
       });
  
        const totalCount = Number(result);
  
        if (!Number.isSafeInteger(totalCount)) {
            throw new Error('The total count value exceeds the safe integer range.');
        }
  
        setTotalCountAuctions(totalCount - 1); // Adjust totalCount
    } catch (error) {
        console.error('Error fetching total count of auctions:', error);
    }
  }, []);
  
  const fetchTotalCountListing = useCallback(async (contract: ThirdwebContract) => {
    try {
      const result = await totalListings({
        contract: MARKETPLACE,
       });
  
        const totalCount = Number(result);
  
        if (!Number.isSafeInteger(totalCount)) {
            throw new Error('The total count value exceeds the safe integer range.');
        }
  
        setTotalCount(totalCount - 1); // Adjust totalCount
    } catch (error) {
        console.error('Error fetching total count of listings:', error);
    }
  }, []);


  const fetchGetAllListings = useCallback(async (contract: ThirdwebContract) => {
    if (totalCount === undefined) return;
    setIsLoading(true);
    try {
        const listingsData = await readContract({
            contract,
            method: "function getAllListings(uint256 _startId, uint256 _endId) view returns ((uint256 listingId, uint256 tokenId, uint256 quantity, uint256 pricePerToken, uint128 startTimestamp, uint128 endTimestamp, address listingCreator, address assetContract, address currency, uint8 tokenType, uint8 status, bool reserved)[] listings)",       
            params: [BigInt(0), BigInt(59)]
        }) as unknown as any[];
  
  
        if (!Array.isArray(listingsData) || listingsData.length === 0) {
            console.error("Listings data is not an array or is empty.");
            return;
        }
  
        const listings = await Promise.all(listingsData.map(async (listing, index) => {
  
            if (!listing || typeof listing !== 'object') {
                console.error(`Invalid listing data at index ${index}:`, listing);
                return null;
            }
  
            try {
                // Ensure fields are accessed correctly
                const id = listing.listingId ? BigNumber.from(listing.listingId).toBigInt() : BigInt(0);
                const tokenId = listing.tokenId ? BigNumber.from(listing.tokenId).toBigInt() : BigInt(0);
                const quantity = listing.quantity ? BigNumber.from(listing.quantity).toBigInt() : BigInt(0);
                const pricePerTokenBigNumber = listing.pricePerToken ? BigNumber.from(listing.pricePerToken) : BigNumber.from(0);
                const startTimeInSeconds = listing.startTimestamp ? BigNumber.from(listing.startTimestamp).toBigInt() : BigInt(0);
                const endTimeInSeconds = listing.endTimestamp ? BigNumber.from(listing.endTimestamp).toBigInt() : BigInt(0);
                const creatorAddress = listing.listingCreator;
                const assetContractAddress = listing.assetContract;
                const currencyContractAddress = listing.currency;
                const status = listing.status;
                const isReservedListing = listing.reserved !== undefined ? listing.reserved : false;
  
                // Find currency data
                const currency = CURRENCY_DATA.find(c => c.address.toLowerCase() === currencyContractAddress.toLowerCase());
                if (!currency) {
                    console.error(`Currency data not found for address: ${currencyContractAddress}`);
                    return null;
                }
  
                // Calculate price per token
                const pricePerToken = pricePerTokenBigNumber.div(BigNumber.from(10).pow(currency.decimals)).toString();
                const currencySymbol = currency.symbol;
  
                return {
                    id,
                    creatorAddress,
                    assetContractAddress,
                    tokenId,
                    quantity,
                    currencyContractAddress,
                    currencySymbol,
                    pricePerToken: pricePerToken,
                    startTimeInSeconds,
                    endTimeInSeconds,
                    isReservedListing,
                    status
                };
            } catch (error) {
                console.error(`Error processing listing data at index ${index}:`, error);
                return null;
            }
        }));
  
        // Filter out null values
        const validListings = listings.filter(listing => listing !== null) as DirectListing[];
  
        setAllValidListings(validListings); // Set the valid listings state
  
    } catch (error) {
        console.error("Error fetching listings:", error);
    } finally {
        setIsLoading(false);
    }
  }, [totalCount]);

  const fetchGetAllAuctions = useCallback(async (contract: ThirdwebContract) => {
    if (totalCountAuctions === undefined) return;
    setIsLoading(true);
    try {
      const auctionsData = await readContract({
        contract,
        method: "function getAllListings(uint256 _startId, uint256 _endId) view returns ((uint256 listingId, uint256 tokenId, uint256 quantity, uint256 pricePerToken, uint128 startTimestamp, uint128 endTimestamp, address listingCreator, address assetContract, address currency, uint8 tokenType, uint8 status, bool reserved)[] listings)",       
        params: [BigInt(0), BigInt(2)]
      }) as unknown as any[];
  
  
      if (!Array.isArray(auctionsData) || auctionsData.length === 0) {
        console.error("Auctions data is not an array or is empty.");
        return;
      }
  
      const auctions = await Promise.all(auctionsData.map(async (auction, index) => {
  
        if (!auction || typeof auction !== 'object') {
          console.error(`Invalid auction data at index ${index}:`, auction);
          return null;
        }
  
        try {
          const id = auction.auctionId ? BigNumber.from(auction.auctionId).toBigInt() : BigInt(0);
          const tokenId = auction.tokenId ? BigNumber.from(auction.tokenId).toBigInt() : BigInt(0);
          const quantity = auction.quantity ? BigNumber.from(auction.quantity).toBigInt() : BigInt(0);
          const minimumBidAmount = auction.minimumBidAmount ? BigNumber.from(auction.minimumBidAmount).toBigInt() : BigInt(0);
          const buyoutBidAmount = auction.buyoutBidAmount ? BigNumber.from(auction.buyoutBidAmount).toBigInt() : BigInt(0);
          const timeBufferInSeconds = auction.timeBufferInSeconds ? BigNumber.from(auction.timeBufferInSeconds).toBigInt() : BigInt(0);
          const bidBufferBps = auction.bidBufferBps ? BigNumber.from(auction.bidBufferBps).toBigInt() : BigInt(0);
          const startTimeInSeconds = auction.startTimestamp ? BigNumber.from(auction.startTimestamp).toBigInt() : BigInt(0);
          const endTimeInSeconds = auction.endTimestamp ? BigNumber.from(auction.endTimestamp).toBigInt() : BigInt(0);
          const creatorAddress = auction.auctionCreator;
          const assetContractAddress = auction.assetContract;
          const currencyContractAddress = auction.currency;
          const status: ListingStatus = auction.status;
  
          const currency = CURRENCY_DATA.find(c => c.address.toLowerCase() === currencyContractAddress.toLowerCase());
          if (!currency) {
            console.error(`Currency data not found for address: ${currencyContractAddress}`);
            return null;
          }
          const minimumBidCurrencyValue = BigNumber.from(minimumBidAmount).div(BigNumber.from(10).pow(currency.decimals)).toString();
          const buyoutCurrencyValue = BigNumber.from(buyoutBidAmount).div(BigNumber.from(10).pow(currency.decimals)).toString();
  
          return {
            id,
            creatorAddress,
            assetContractAddress,
            tokenId,
            quantity,
            currencyContractAddress,
            minimumBidAmount,
            minimumBidCurrencyValue,
            buyoutBidAmount,
            buyoutCurrencyValue,
            bidBufferBps,
            timeBufferInSeconds,
            startTimeInSeconds,
            endTimeInSeconds,
            status
          };
        } catch (error) {
          console.error(`Error processing auction data at index ${index}:`, error);
          return null;
        }
      }));
  
      const validAuctions = auctions.filter(auction => auction !== null) as EnglishAuction[];
      setAllValidAuctions(validAuctions);
    } catch (error) {
      console.error("Error fetching auctions:", error);
    } finally {
      setIsLoading(false);
    }
  }, [totalCountAuctions]);

  const contractAddresses: ContractAddresses = useMemo(() => ({
    "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE": "IOTX",
    "0x3EA683354bf8d359cd9EC6E08B5AEC291D71d880": "Shiba",
    "0xdfF8596d62b6d35fFFfc9e465d2FDeA49Ac3c311": "Depinny"
  }), []);

  
useEffect(() => {
  fetchTotalCountAuctions(MARKETPLACE);
}, [fetchTotalCountAuctions]);

useEffect(() => {
  fetchTotalCountListing(MARKETPLACE);
}, [fetchTotalCountListing]);

useEffect(() => {
  if (totalCountAuctions !== undefined) {
    fetchGetAllAuctions(MARKETPLACE);
  }
}, [totalCountAuctions, fetchGetAllAuctions]);

useEffect(() => {
  if (totalCount !== undefined) {
    fetchGetAllListings(MARKETPLACE);
  }
}, [totalCount, fetchGetAllListings]);

  useEffect(() => {
    const fetchVolumes = async () => {
      try {
        if (!allValidListings || !allValidAuctions) {
          return;
        }

        const completedListings = allValidListings.filter(listing => listing.status === 2);
        const completedAuctions = allValidAuctions.filter(auction => auction.status === "COMPLETED");

        const volumeByCurrency: Record<string, number> = {
          IOTX: 0,
          Shiba: 0,
          Depinny: 0
        };

        const transactionsCountByCurrency: Record<string, number> = {
          IOTX: 0,
          Shiba: 0,
          Depinny: 0
        };

        completedListings.forEach(listing => {
          const currency = contractAddresses[listing.currencyContractAddress];
          if (currency) {
            const price = parseFloat(listing.pricePerToken);
            volumeByCurrency[currency] += price;
            transactionsCountByCurrency[currency] += 1;
          }
        });

        completedAuctions.forEach(auction => {
          const currency = contractAddresses[auction.currencyContractAddress];
          if (currency) {
            const price = parseFloat(auction.buyoutCurrencyValue);
            volumeByCurrency[currency] += price;
            transactionsCountByCurrency[currency] += 1;
          }
        });

        

        setTotalVolume2(volumeByCurrency);
        setTransactionsCount(transactionsCountByCurrency);
      } catch (error) {
        console.error("Failed to fetch volumes:", error);
      }
    };

    fetchVolumes();
  }, [allValidListings, allValidAuctions, contractAddresses]);

  useEffect(() => {
    if (allValidListings) {
      setAllListings(allValidListings as DirectListing[]);
      setTotalListingsCount(allValidListings.length);
    }
  }, [allValidListings]);

  useEffect(() => {
    if (allValidAuctions) {
      setAllAuctions(allValidAuctions as EnglishAuction[]);
      setTotalAuctionsCount(allValidAuctions.length);
    }
  }, [allValidAuctions]);

  const fetchActiveAccountCount = useCallback(async () => {
    try {
      const users = await readContract({
        contract: ChattApp,
        method: resolveMethod("getAllActiveAccounts"),
        params: [],
      }) as any[];
      setActiveAccountCount(users.length);
    } catch (error) {
      console.error("Error fetching all app users:", error);
    }
  }, []);

  useEffect(() => {
    fetchActiveAccountCount();
  }, [fetchActiveAccountCount]);

  const handleNextCurrency = () => {
    setCurrentCurrencyIndex((prevIndex) => (prevIndex + 1) % Object.keys(totalVolume2).length);
  };

  const handlePreviousCurrency = () => {
    setCurrentCurrencyIndex((prevIndex) => (prevIndex - 1 + Object.keys(totalVolume2).length) % Object.keys(totalVolume2).length);
  };

  const currencyKeys = Object.keys(totalVolume2);
  const currentCurrency = currencyKeys[currentCurrencyIndex];
  const currentVolume = totalVolume2[currentCurrency];
  const currentSales = transactionsCount[currentCurrency];

  const totalSalesCount = Object.values(transactionsCount).reduce((acc, count) => acc + count, 0);

  return (
    <div className="pt-24 pb-32 overflow-x-auto">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between">
          <div className="flex-shrink-0 flex flex-col items-center justify-center bg-zinc-800 border border-sky-500 border-opacity-30 hover:bg-sky-700 transition duration-150 w-40 h-40 rounded-full text-white">
            <h1 className="text-3xl font-bold mt-2">
              {activeAccountCount}
            </h1>
            <p className="font-thin mt-2">Total Active Accounts</p>
          </div>

          <div className="flex-shrink-0 flex flex-col items-center justify-center bg-zinc-800 border border-sky-500 border-opacity-30 hover:bg-sky-700 transition duration-150 w-40 h-40 rounded-full text-white">
            <h1 className="text-3xl font-bold mt-2">
              {totalListingsCount !== null ? totalListingsCount : "N/A"}
            </h1>
            <p className="font-thin mt-2">Total Listings</p>
          </div>

          <div className="flex-shrink-0 flex flex-col items-center justify-center bg-zinc-800 border border-sky-500 border-opacity-30 hover:bg-sky-700 transition duration-150 w-40 h-40 rounded-full text-white">
            <h1 className="text-3xl font-bold mt-2">
              {totalSalesCount !== null ? totalSalesCount : "N/A"}
            </h1>
            <p className="font-thin mt-2">Total Sales</p>
          </div>

          <div className="flex-shrink-0 flex flex-col items-center justify-center bg-zinc-800 border border-sky-500 border-opacity-30 hover:bg-sky-700 transition duration-150 w-40 h-40 rounded-full text-white">
            <h1 className="text-3xl font-bold mt-2">
              {currentSales !== undefined ? currentSales : "N/A"}
            </h1>
            <p className="font-thin mt-2">Sales from ({currentCurrency})</p>
          </div>

          <div className="flex-shrink-0 flex flex-col items-center justify-center bg-zinc-800 border border-sky-500 border-opacity-30 hover:bg-sky-700 transition duration-150 w-40 h-40 rounded-full text-white">
            <h1 className="text-3xl font-bold mt-2">
              {currentVolume !== undefined ? currentVolume : "N/A"}
            </h1>
            <p className="font-thin mt-2">Total Volume ({currentCurrency})</p>
            <div className="flex mt-2">
              <button onClick={handlePreviousCurrency} className="text-white mr-2">&lt;</button>
              <button onClick={handleNextCurrency} className="text-white">&gt;</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Stats;
