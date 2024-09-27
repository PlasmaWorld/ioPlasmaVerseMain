"use client";
import { useEffect, useState } from "react";
import { defineChain } from "thirdweb";
import { ChainList } from "@/const/ChainList";

export default function Events({
  tokenId,
  contractAddress,
  chainId,
}: {
  tokenId: bigint;
  contractAddress: string;
  chainId: number;
}) {
  const [filteredEvents, setFilteredEvents] = useState<any[]>([]);
  const NETWORK = defineChain(chainId);
  const chain = ChainList.find((c) => c.chainId === chainId);
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    const fetchEvents = async () => {

      try {
        const response = await fetch(`/api/fetchContractEvents/${chainId}/${contractAddress}/${tokenId.toString()}`);

        const result = await response.json();

        if (response.ok) {
          setEvents(result.events);
          console.log('Events fetched:', result.events);
        } else {
        }
      } catch (err) {
        console.error('An unexpected error occurred:', err);
      } finally {
      }
    };

    fetchEvents();

  }, [chainId, contractAddress, tokenId]); 
 

  const formatAddress = (address: string) => {
    return `${address.slice(0, 3)}...${address.slice(-3)}`;
  };

  const TARGET_ADDRESSES = [
    { Address: "0x8C9413291fc98bF9556d0Fb3A9A052164e37aeC2".toLowerCase(), Marketplace: "IotexPunks" },
    { Address: "0x7499e71FF8a472D1d82Aa2e68e868B5B92896B0E".toLowerCase(), Marketplace: "Mimo" },
    { Address: "0xa6436681b12D0499a8280378057FCd6ab9bb1B3A".toLowerCase(), Marketplace: "Treasureland" },
    { Address: "0x260128f8a312184b9b5cba84a87ef7e82b732f0b".toLowerCase(), Marketplace: "IotexPunks" },
    { Address: "0x7c3cacc88e469ed9365fede9426e947a985ae495".toLowerCase(), Marketplace: "ioPlasmaVerse" },
  ];

  // Helper function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = (`0${date.getMonth() + 1}`).slice(-2);
    const day = (`0${date.getDate()}`).slice(-2);
    const hours = (`0${date.getHours()}`).slice(-2);
    const minutes = (`0${date.getMinutes()}`).slice(-2);
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  };

  // Function to get marketplace or formatted address
  const getMarketplaceOrAddress = (address: string) => {
    const found = TARGET_ADDRESSES.find((entry) => entry.Address === address.toLowerCase());
    return found ? found.Marketplace : formatAddress(address);
  };

  // Organize events by type
  const eventsByType = events.reduce((acc: any, event: any) => {
    const { event_name } = event;
    if (!acc[event_name]) {
      acc[event_name] = [];
    }
    acc[event_name].push(event);
    return acc;
  }, {});

  return (
    <div className="flex flex-col mt-3">
      {Object.keys(eventsByType).length > 0 ? (
        Object.keys(eventsByType).map((eventName, index) => (
          <div key={index} className="mb-6">
            {/* Render event name as a header */}
            <h2 className="text-xl font-bold text-white mb-2">{eventName}</h2>

            {/* Table headers */}
            <div className="overflow-x-auto">
              <div className="grid grid-cols-7 gap-4 text-white/60 font-semibold mb-2" style={{ minWidth: '1000px' }}>
                <div className="text-center" style={{ minWidth: '150px' }}>Transaction Hash</div>
                <div className="text-center" style={{ minWidth: '150px' }}>From</div>
                <div className="text-center" style={{ minWidth: '150px' }}>To</div>
                <div className="text-center" style={{ minWidth: '150px' }}>Price</div>
                <div className="text-center" style={{ minWidth: '150px' }}>Marketplace</div>
                <div className="text-center" style={{ minWidth: '150px' }}>Time</div>
              </div>

              {/* Table rows for each event of this type */}
              {eventsByType[eventName].map((event: any, idx: number) => (
                <div key={idx} className="grid grid-cols-7 gap-4 text-white mb-2" style={{ minWidth: '1000px' }}>
                  <div className="text-center">
                    {event.transaction_hash ? (
                      <a
                        href={`https://iotexscan.io/tx/${event.transaction_hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 underline"
                      >
                        {formatAddress(event.transaction_hash)}
                      </a>
                    ) : (
                      "-"
                    )}
                  </div>
                  <div className="text-center">
                    {event.from_address ? (
                      <a
                        href={`https://www.ioplasmaverse.com/profile/${event.from_address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 underline"
                      >
                        {formatAddress(event.from_address)}
                      </a>
                    ) : (
                      "-"
                    )}
                  </div>
                  <div className="text-center">
                    {event.to_address ? (
                      <a
                        href={`https://www.ioplasmaverse.com/profile/${event.to_address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 underline"
                      >
                        {formatAddress(event.to_address)}
                      </a>
                    ) : (
                      "-"
                    )}
                  </div>
                  <div className="text-center">{event.price || "-"}</div>
                  <div className="text-center">
                    {event.marketplace ? getMarketplaceOrAddress(event.marketplace.toLowerCase()) : "-"}
                  </div>
                  <div className="text-center">{event.timestamp ? formatDate(event.timestamp) : "-"}</div>
                </div>
              ))}
            </div>
          </div>
        ))
      ) : (
        <p>No events found for this token and contract address.</p>
      )}
    </div>
  );
}
