"use client";
import { useEffect, useState } from "react";
import { defineChain } from "thirdweb";
import { ChainList } from "@/const/ChainList";
import TransactionModal from "@/components/transaction/transaction"; // Import the NftMintModal
import styles from "./transaction.module.css"; // Import the CSS module

export default function EventsNFT({
  contractAddress,
  chainId,
  tokenId

}: {
  contractAddress: string;
  chainId: number;
  tokenId: bigint;
}) {
  const [page, setPage] = useState(1); // Current page
  const [eventsPerPage] = useState(20); // Number of events per page
  const [filteredEvents, setFilteredEvents] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<any>(null); // Track selected event for modal
  const [isModalOpen, setIsModalOpen] = useState(false); // Track if modal is open

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

  // Update filtered events when page changes
  useEffect(() => {
    const startIndex = (page - 1) * eventsPerPage;
    const endIndex = startIndex + eventsPerPage;
    setFilteredEvents(events.slice(startIndex, endIndex)); // Show events for the current page
  }, [page, events, eventsPerPage]);

  const formatAddress = (address: string) => `${address.slice(0, 3)}...${address.slice(-3)}`;

  const TARGET_ADDRESSES = [
    { Address: "0x8C9413291fc98bF9556d0Fb3A9A052164e37aeC2".toLowerCase(), Marketplace: "IotexPunks" },
    { Address: "0x7499e71FF8a472D1d82Aa2e68e868B5B92896B0E".toLowerCase(), Marketplace: "Mimo" },
    { Address: "0xa6436681b12D0499a8280378057FCd6ab9bb1B3A".toLowerCase(), Marketplace: "Treasureland" },
    { Address: "0x260128f8a312184b9b5cba84a87ef7e82b732f0b".toLowerCase(), Marketplace: "IotexPunks" },
    { Address: "0x7c3cacc88e469ed9365fede9426e947a985ae495".toLowerCase(), Marketplace: "ioPlasmaVerse" },
  ];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = (`0${date.getMonth() + 1}`).slice(-2);
    const day = (`0${date.getDate()}`).slice(-2);
    const hours = (`0${date.getHours()}`).slice(-2);
    const minutes = (`0${date.getMinutes()}`).slice(-2);
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  };

  const getMarketplaceOrAddress = (address: string) => {
    const found = TARGET_ADDRESSES.find((entry) => entry.Address === address.toLowerCase());
    return found ? found.Marketplace : formatAddress(address);
  };

  const openModal = (event: any) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedEvent(null);
  };

  return (
    <div className={styles.container}>
    <div className={styles.flex}>

      {filteredEvents.length > 0 ? (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead className={styles.tableHead}>
              <tr>
                <th className={styles.tableCell}>Transaction Hash</th>
                <th className={styles.tableCell}>Event</th>
                <th className={styles.tableCell}>From</th>
                <th className={styles.tableCell}>To</th>
                <th className={styles.tableCell}>Price</th>
                <th className={styles.tableCell}>Marketplace</th>
                <th className={styles.tableCell}>Time</th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.map((event, idx) => (
                <tr key={idx} className={`${styles.tableRowOdd} ${idx % 2 === 0 ? styles.tableRowEven : ''}`}>
                  <td className={styles.tableCell}>
                    {event.transaction_hash ? (
                      <button onClick={() => openModal(event)} className={styles.underlineButton}>
                        {formatAddress(event.transaction_hash)}
                      </button>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className={styles.tableCell}>{event.event_name}</td>
                  <td className={styles.tableCell}>{event.from_address ? formatAddress(event.from_address) : "-"}</td>
                  <td className={styles.tableCell}>{event.to_address ? formatAddress(event.to_address) : "-"}</td>
                  <td className={styles.tableCell}>{event.price || "-"}</td>
                  <td className={styles.tableCell}>{event.marketplace ? getMarketplaceOrAddress(event.marketplace.toLowerCase()) : "-"}</td>
                  <td className={styles.tableCell}>{event.timestamp ? formatDate(event.timestamp) : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
         
      </div>
      ) : (
        <p className={styles.noEvents}>No events found.</p>
      )}

          
  
  
      {selectedEvent && (
     <div className={styles.transaction}>

        <TransactionModal
        transactionHash={selectedEvent.transaction_hash || ""}
        chainId={chainId}
        marketplace={selectedEvent.marketplace}
        tokenId={selectedEvent.token_id}
        listingId={selectedEvent.listing_id}
        contractAddress={contractAddress}
        eventName={selectedEvent.event_name}
        from={selectedEvent.from_address}
        to={selectedEvent.to_address}
        timestamp={selectedEvent.timestamp}
        price={selectedEvent.price}
        isOpen={isModalOpen}
        onClose={closeModal}
      />
      </div>
      )}
    </div>
    <div className="flex justify-between mt-4">

          {page > 1 && (

            <button

              onClick={() => setPage((prev) => prev - 1)}

              className="px-4 py-2 bg-blue-500 text-white rounded"

            >

              Previous Events

            </button>

          )}

          {filteredEvents.length === eventsPerPage && (

            <button

              onClick={() => setPage((prev) => prev + 1)}

              className="px-4 py-2 bg-blue-500 text-white rounded"

            >

              Next Events

            </button>

          )}
          </div>
    </div>
  );
}