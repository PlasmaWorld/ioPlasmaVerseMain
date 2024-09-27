"use client";

import React, { FC, useEffect, useState, useCallback } from "react";
import { useReadContract } from "thirdweb/react";
import { ChattApp, MARKETPLACE } from "@/const/contracts";
import { getAllListings, totalAuctions, totalListings, getAllAuctions } from "thirdweb/extensions/marketplace";
import { readContract, resolveMethod, ThirdwebContract } from "thirdweb";

const Stats: FC<{ contractAddress: string }> = ({ contractAddress }) => {
  const [totalListingsCount, setTotalListingsCount] = useState<number | null>(null);
  const [totalAuctionsCount, setTotalAuctionsCount] = useState<number | null>(null);
  const [allListings, setAllListings] = useState<any[]>([]);
  const [allAuctions, setAllAuctions] = useState<any[]>([]);
  const [allAppUsers, setAllAppUsers] = useState<any[]>([]);
  const [totalSales, setTotalSales] = useState<number | null>(null);
  const [totalVolume, setTotalVolume] = useState<Record<string, number>>({});
  const [activeAccountCount, setActiveAccountCount] = useState<number>(0);

  const { data: validListings, isLoading: isLoadingListings, refetch: refetchListings } = useReadContract(getAllListings, { contract: MARKETPLACE });
  const { data: validAuctions, isLoading: isLoadingAuctions, refetch: refetchAuctions } = useReadContract(getAllAuctions, { contract: MARKETPLACE });

  useEffect(() => {
    const fetchData = async () => {
      await refetchListings();
      await refetchAuctions();
    };
    fetchData();
  }, [refetchListings, refetchAuctions]);

  useEffect(() => {
    if (validListings) {
      setAllListings(validListings);
    }
  }, [validListings]);

  useEffect(() => {
    if (validAuctions) {
      setAllAuctions(validAuctions);
    }
  }, [validAuctions]);

  const fetchAllAppUsers = useCallback(async (contract: ThirdwebContract) => {
    try {
      const users = await readContract({
        contract,
        method: resolveMethod("getAllActiveAccounts"),
        params: [],
      }) as any[];
      setAllAppUsers(users);
    } catch (error) {
      console.error("Error fetching all app users:", error);
    }
  }, []);


  const calculateTotals = useCallback(() => {
    let totalSalesCount = 0;
    let volume: Record<string, number> = {};

    const processItems = (items: any[], isAuction: boolean = false) => {
      items.forEach(item => {
        const price = parseInt(item.pricePerToken.hex, 16);
        const currency = item.currency;

        if (!volume[currency]) {
          volume[currency] = 0;
        }
        volume[currency] += price;

        if (!isAuction && item.status === 1) { // Assuming status 1 means sold
          totalSalesCount += 1;
        }
      });
    };

    processItems(allListings);
    processItems(allAuctions, true);

    setTotalSales(totalSalesCount);
    setTotalVolume(volume);
  }, [allListings, allAuctions]);

  useEffect(() => {
    fetchAllAppUsers(ChattApp);
  }, [fetchAllAppUsers]);

  useEffect(() => {
    if (allListings.length > 0 || allAuctions.length > 0) {
      calculateTotals();
    }
  }, [allListings, allAuctions, calculateTotals]);

  return (
    <div className="pt-24 pb-32 overflow-x-auto">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between">
          <div className="flex-shrink-0 flex flex-col items-center justify-center bg-zinc-800 border border-sky-500 border-opacity-30 hover:bg-sky-700 transition duration-150 w-40 h-40 rounded-full text-white">
            <h1 className="text-3xl font-bold mt-2">
              {allAppUsers.length}
            </h1>
            <p className="font-thin mt-2">Total Active Accounts</p>
          </div>

          <div className="flex-shrink-0 flex flex-col items-center justify-c  enter bg-zinc-800 border border-sky-500 border-opacity-30 hover:bg-sky-700 transition duration-150 w-40 h-40 rounded-full text-white">
            <h1 className="text-3xl font-bold mt-2">
              {totalListingsCount !== null ? totalListingsCount : "N/A"}
            </h1>
            <p className="font-thin mt-2">Total Listings</p>
          </div>

          <div className="flex-shrink-0 flex flex-col items-center justify-center bg-zinc-800 border border-sky-500 border-opacity-30 hover:bg-sky-700 transition duration-150 w-40 h-40 rounded-full text-white">
            <h1 className="text-3xl font-bold mt-2">
              {totalSales !== null ? totalSales : "N/A"}
            </h1>
            <p className="font-thin mt-2">Total Sales</p>
          </div>

          <div className="flex-shrink-0 flex flex-col items-center justify-center bg-zinc-800 border border-sky-500 border-opacity-30 hover:bg-sky-700 transition duration-150 w-40 h-40 rounded-full text-white">
            <h1 className="text-3xl font-bold mt-2">
              {Object.entries(totalVolume).map(([currency, volume]) => (
                <div key={currency}>
                  {volume} {currency === "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" ? "IOTX" : currency}
                </div>
              ))}
            </h1>
            <p className="font-thin mt-2">Total Volume</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Stats;
