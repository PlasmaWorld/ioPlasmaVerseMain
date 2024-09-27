"use client";
import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import toast from "react-hot-toast";
import { Address, ThirdwebContract, readContract, resolveMethod } from 'thirdweb';
import { useActiveAccount } from "thirdweb/react";
import { BigNumber } from "ethers";
import { ListingStatus } from "thirdweb/dist/types/extensions/marketplace/types";
import {
  MARKETPLACE
} from '@/const/contracts';
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
interface EnglishAuction  {
  id: bigint;
  creatorAddress: Address;
  assetContractAddress: Address;
  tokenId: bigint;
  quantity: bigint;
  currencyContractAddress: Address;
  minimumBidAmount: bigint;
  minimumBidCurrencyValue: string; // GetBalanceResult
  buyoutBidAmount: bigint;
  buyoutCurrencyValue: string; // GetBalanceResult 
  timeBufferInSeconds: bigint;
  bidBufferBps: bigint;
  startTimeInSeconds: bigint;
  endTimeInSeconds: bigint;
  status: ListingStatus;
};


interface ContractData {
  totalSupply: number;
  validTotalSupply: number;
  uniqueOwners: number;
}

interface MarketplaceContextProps {
  validListings: DirectListing[];
  validAuctions: EnglishAuction[];
  allValidAuctions: EnglishAuction[];

  allValidListings: DirectListing[];
  loading: boolean;
}

interface MarketplaceDataProviderProps {
  children: ReactNode;
}

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

const MarketplaceDataContext = createContext<MarketplaceContextProps | undefined>(undefined);

export const MarketplaceProvider: React.FC<MarketplaceDataProviderProps> = ({ children }) => {
  const [validListings, setValidListings] = useState<DirectListing[]>([]);
  const [validAuctions, setValidAuctions] = useState<EnglishAuction[]>([]);
  const [allValidListings, setAllValidListings] = useState<DirectListing[]>([]);
  const [allValidAuctions, setAllValidAuctions] = useState<EnglishAuction[]>([]);
  const [totalCountAuctions, setTotalCountAuctions] = useState<number>(2);

  const [totalCount, setTotalCount] = useState<number | undefined>(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const account = useActiveAccount();

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
    }
  }, []);

  const fetchGetAllValidListings = useCallback(async (contract: ThirdwebContract) => {
    if (totalCount === undefined) return;
    setIsLoading(true);
    try {
        const listingsData = await readContract({
            contract,
            method: "function getAllValidListings(uint256 _startId, uint256 _endId) view returns ((uint256 listingId, uint256 tokenId, uint256 quantity, uint256 pricePerToken, uint128 startTimestamp, uint128 endTimestamp, address listingCreator, address assetContract, address currency, uint8 tokenType, uint8 status, bool reserved)[] listings)", 
           params: [BigInt(0), BigInt(totalCount)]
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
                return null;
            }
        }));

        // Filter out null values
        const validListings = listings.filter(listing => listing !== null) as DirectListing[];

        setValidListings(validListings); // Set the valid listings state

    } catch (error) {
        console.error("Error fetching listings:", error);
    } finally {
        setIsLoading(false);
    }
}, [totalCount]);

const fetchGetAllListings = useCallback(async (contract: ThirdwebContract) => {
  if (totalCount === undefined) return;
  setIsLoading(true);
  try {
      const listingsData = await readContract({
          contract,
          method: "function getAllListings(uint256 _startId, uint256 _endId) view returns ((uint256 listingId, uint256 tokenId, uint256 quantity, uint256 pricePerToken, uint128 startTimestamp, uint128 endTimestamp, address listingCreator, address assetContract, address currency, uint8 tokenType, uint8 status, bool reserved)[] listings)",       
          params: [BigInt(0), BigInt(totalCount)]
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



const fetchGetAllValidAuctions = useCallback(async (contract: ThirdwebContract) => {
  setIsLoading(true);
  try {
    const auctionsData = await readContract({
      contract,
      method: "function getAllValidAuctions(uint256 _startId, uint256 _endId) view returns ((uint256 auctionId, uint256 tokenId, uint256 quantity, uint256 minimumBidAmount, uint256 buyoutBidAmount, uint64 timeBufferInSeconds, uint64 bidBufferBps, uint64 startTimestamp, uint64 endTimestamp, address auctionCreator, address assetContract, address currency, uint8 tokenType, uint8 status)[] auctions)", 
            params: [BigInt(0), BigInt(totalCountAuctions)]
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
    setValidAuctions(validAuctions);
  } catch (error) {
    console.error("Error fetching auctions:", error);
  } finally {
    setIsLoading(false);
  }
}, [totalCountAuctions]);

const fetchGetAllAuctions = useCallback(async (contract: ThirdwebContract) => {
  setIsLoading(true);
  try {
    const auctionsData = await readContract({
      contract,
      method: "function getAllAuctions(uint256 _startId, uint256 _endId) view returns ((uint256 auctionId, uint256 tokenId, uint256 quantity, uint256 minimumBidAmount, uint256 buyoutBidAmount, uint64 timeBufferInSeconds, uint64 bidBufferBps, uint64 startTimestamp, uint64 endTimestamp, address auctionCreator, address assetContract, address currency, uint8 tokenType, uint8 status)[] auctions)", 
            params: [BigInt(0), BigInt(totalCountAuctions)]
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

useEffect(() => {
  fetchTotalCountAuctions(MARKETPLACE);
}, [fetchTotalCountAuctions]);

useEffect(() => {
  fetchTotalCountListing(MARKETPLACE);
}, [fetchTotalCountListing]);

useEffect(() => {
  if (totalCountAuctions !== undefined) {

    fetchGetAllValidAuctions(MARKETPLACE);
  }
}, [totalCountAuctions, fetchGetAllValidAuctions]);

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
    if (totalCount !== undefined) {
      fetchGetAllValidListings(MARKETPLACE);
    }
  }, [totalCount, fetchGetAllValidListings]);

  return (
    <MarketplaceDataContext.Provider value={{ validListings, validAuctions,allValidAuctions,allValidListings,  loading: isLoading }}>
      {children}
    </MarketplaceDataContext.Provider>
  );
};

export const useMarketplaceData = () => {
  const context = useContext(MarketplaceDataContext);
  if (!context) {
    throw new Error('useContractData must be used within a MarketplaceProvider');
  }
  return context;
};
