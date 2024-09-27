"use client";
import client from "@/lib/client";
import React, { useEffect, useState } from "react";
import {
  getContract,
  prepareEvent,
  getContractEvents,
  defineChain,
  getRpcClient,
  eth_getTransactionByHash,
  ThirdwebContract,
  Address,
  readContract,
  resolveMethod,
} from "thirdweb";
import { getListing } from "thirdweb/extensions/marketplace";

interface CurrencyData {
  symbol: string;
  decimals: number;
  address: Address;
}

type TransactionDetails = {
  transactionHash: string;
  eventName: string;
  price: string;
  marketplace: string;  // Ensure this is just 'string'
 };

 type sharedMetdataDetails = {
  name: string;
  descripon: string;
  image: string;
  metadata: string;  // Ensure this is just 'string'
 };


const CURRENCY_DATA: CurrencyData[] = [
  { symbol: 'IOTX', decimals: 18, address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE' }, // Native
  { symbol: 'ioShiba', decimals: 9, address: '0x3EA683354bf8d359cd9EC6E08B5AEC291D71d880' }, // ioShiba
  { symbol: 'dePinny', decimals: 18, address: '0xdfF8596d62b6d35fFFfc9e465d2FDeA49Ac3c311' }  // depinny
];

interface EventDetails {
  contractAddress: string;
  from?: string;
  to?: string;
  tokenId: string;
  chainId: number;
  blockNumber: string;
  transactionHash: string;
  eventName: string;
  price: string;
  marketplace: string;
  timestamp:string;
 }

const FetchAndDisplayEvents: React.FC = () => {
  const [events, setEvents] = useState<EventDetails[]>([]); // More specific type
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const contractAddress = "0xe1Bb99ed442ce6c6ad3806C3afcbd8f7733841A7";
  const blockBatchSize = 30000n;
  const chainId = 4689;
  const NETWORK = defineChain(chainId);

  async function fetchNftSaleSale(
    transactionHash: string,
    chainId: number
  ): Promise<TransactionDetails | null> {
    try {
      const NETWORK = defineChain(chainId);
  
      // Ensure the transaction hash has the '0x' prefix
      const formattedHash = transactionHash.startsWith('0x') ? transactionHash : `0x${transactionHash}`;
      console.log("Formatted hash:", formattedHash);
  
      // Fetch transaction details
      const transaction = await eth_getTransactionByHash(
        getRpcClient({ client, chain: NETWORK }),
        { hash: formattedHash as `0x${string}` } // Type assertion to ensure correct type
      );
      console.log("Fetched transaction:", transaction);
  
      // Check if `transaction.value` exists and log it
      const value = transaction.value ? transaction.value.toString() : "undefined";
      console.log("Transaction value:", value);
  
      // Determine the event name
      const eventName = value !== "0" ? "Sale" : "Transfer";
      console.log("Event name:", eventName);
  
      // Determine the marketplace address
      const marketplace = value !== "0" ? transaction.to : "";
      console.log("Marketplace address:", marketplace);
  
      // Define the transaction details to return
      const transactionDetails: TransactionDetails = {
        transactionHash: transactionHash,
        eventName: eventName,
        price: value !== "undefined" ? `${(Number(value) / 1e18).toString()} Iotex` : "",
        marketplace: marketplace || "",
      };
      console.log("Transaction details to return:", transactionDetails);
  
      return transactionDetails;
    } catch (error) {
      console.error("Error fetching transaction details:", error);
      return null;
    }
  }

  async function findListingId(marketplaceContract2: ThirdwebContract, listingId: bigint): Promise<{ symbol: string, price: string, tokenId: string } | null> {
    try {
      // Fetch the listing information
      const listing = await getListing({ contract: marketplaceContract2, listingId: listingId });
      console.log("Fetched listing:", listing);
  
      // Ensure the listing contains expected fields
      if (!listing || !listing.currencyContractAddress || !listing.pricePerToken) {
        console.log("Listing data is incomplete:", listing);
        return null;
      }
  
      const { currencyContractAddress, pricePerToken } = listing;
      console.log("Currency contract address:", currencyContractAddress);
      console.log("Price per token:", pricePerToken);
  
      // Find the corresponding currency data
      const currency = CURRENCY_DATA.find(c => c.address.toLowerCase() === currencyContractAddress.toLowerCase());
      console.log("Currency data found:", currency);
  
      if (!currency) {
        console.log("Currency not found in CURRENCY_DATA.");
        return null;
      }
  
      // Check for decimal transformation using BigInt
      const decimalsBigInt = BigInt(10 ** currency.decimals); // Convert decimals to BigInt safely
      const transformedPrice = (BigInt(pricePerToken) / decimalsBigInt).toString(); // Perform division with BigInt
      console.log("Transformed price:", transformedPrice);
  
      return {
        symbol: currency.symbol,
        price: transformedPrice,
        tokenId: listing.tokenId.toString(),
      };
    } catch (error) {
      console.error("Error fetching listing or currency data:", error);
      return null;
    }
  }

  
  async function fetchNftMint(
    transactionHash: string,
    chainId: number
  ): Promise<TransactionDetails | null> {
    try {
      
  
      const NETWORK = defineChain(chainId);
  
      // Ensure the transaction hash has the '0x' prefix
      const formattedHash = transactionHash.startsWith('0x') ? transactionHash : `0x${transactionHash}`;
  
      // Fetch transaction details
      const transaction = await eth_getTransactionByHash(
        getRpcClient({ client, chain: NETWORK }),
        { hash: formattedHash as `0x${string}` } // Type assertion to ensure correct type
      );
  
  
      
  
        // Define the transaction details to return
        const transactionDetails: TransactionDetails = {
          transactionHash: transactionHash,
          eventName: "Mint", 
          price: transaction.value
            ? `${(Number(transaction.value) / 1e18).toString()} Iotex` : "",
          marketplace: "", // Assign undefined if null
        };
        
  
        
      return transactionDetails;
    } catch (error) {
      console.error("Error fetching transaction details:", error);
      return null;
    }
  }

  type sharedMetadataDetails = {
    name: string;
    description: string;
    image: string;
    metadata: string;  // Ensure this is just 'string'
  };
  
  async function getSharedMetadata(contract: ThirdwebContract): Promise<{ sharedMetadata: sharedMetadataDetails[] } | null> {
    try {
      // Fetch the listing information
      const sharedMetadataRaw = await readContract({
        contract,
        method: "function sharedMetadata() view returns (string name, string description, string imageURI, string animationURI)",
        params: []
      });
  
      // Ensure the listing contains expected fields
      if (!sharedMetadataRaw) {
        console.log("Metadata is not available.");
        return null;
      }
  
      // Convert the readonly array into a mutable array, and map it to the correct type
      const sharedMetadata: sharedMetadataDetails[] = [{
        name: sharedMetadataRaw[0] as string,
        description: sharedMetadataRaw[1] as string,
        image: sharedMetadataRaw[2] as string,
        metadata: sharedMetadataRaw[3] as string
      }];
  
      return {
        sharedMetadata: sharedMetadata,
      };
  
    } catch (error) {
      console.error("Error fetching metadata:", error);
      return null;
    }
  }
  
  async function getContractVersion(contract: ThirdwebContract): Promise<{ contractType:string } | null> {
    try {
      // Fetch the listing information
      const contractType = await readContract({
        contract,
        method: "function contractType() pure returns (bytes32)", 
        params: []
      });
  
      // Ensure the listing contains expected fields
      if (!contractType) {
        console.log("Metadata is not available.");
        return null;
      }
  
      // Convert the readonly array into a mutable array, and map it to the correct type
      const contractTypeData = contractType;
  
      return {
        contractType: contractTypeData,
      };
  
    } catch (error) {
      console.error("Error fetching metadata:", error);
      return null;
    }
  }

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        console.log("Starting fetch process...");
        setLoading(true);

        const contract = getContract({
          address: contractAddress,
          client,
          chain: NETWORK,
        });


        

       
        
        
        // Prepare the events (only showing a few here for brevity)
        const preparedEvent1 = prepareEvent({
          signature: "event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId)"
        });
        const preparedEvent2 = prepareEvent({
          signature: "event ApprovalForAll(address indexed owner, address indexed operator, bool approved)"
        });
        const preparedEvent3 = prepareEvent({
          signature: "event BatchMetadataUpdate(uint256 _fromTokenId, uint256 _toTokenId)"
        });
        const preparedEvent4 = prepareEvent({
          signature: "event ClaimConditionsUpdated((uint256 startTimestamp, uint256 maxClaimableSupply, uint256 supplyClaimed, uint256 quantityLimitPerWallet, bytes32 merkleRoot, uint256 pricePerToken, address currency, string metadata)[] claimConditions, bool resetEligibility)"
        });
        const preparedEvent5 = prepareEvent({
          signature: "event ContractURIUpdated(string prevURI, string newURI)"
        });
        const preparedEvent6 = prepareEvent({
          signature: "event DefaultRoyalty(address indexed newRoyaltyRecipient, uint256 newRoyaltyBps)"
        });
        const preparedEvent7 = prepareEvent({
          signature: "event FlatPlatformFeeUpdated(address platformFeeRecipient, uint256 flatFee)"
        });
        const preparedEvent8 = prepareEvent({
          signature: "event Initialized(uint8 version)"
        });
        const preparedEvent9 = prepareEvent({
          signature: "event MaxTotalSupplyUpdated(uint256 maxTotalSupply)"         });
      
        const preparedEvent10 = prepareEvent({
          signature: "event MetadataFrozen()"
        });
        const preparedEvent11 = prepareEvent({
          signature: "event OwnerUpdated(address indexed prevOwner, address indexed newOwner)"
        });
        const preparedEvent12 = prepareEvent({
          signature: "event PlatformFeeInfoUpdated(address indexed platformFeeRecipient, uint256 platformFeeBps)"
        });
        const preparedEvent13 = prepareEvent({
          signature: "event PlatformFeeTypeUpdated(uint8 feeType)"
        });
        const preparedEvent14 = prepareEvent({
          signature: "event PrimarySaleRecipientUpdated(address indexed recipient)"
        });
        const preparedEvent15 = prepareEvent({
          signature: "event RoleAdminChanged(bytes32 indexed role, bytes32 indexed previousAdminRole, bytes32 indexed newAdminRole)"
        });
        const preparedEvent16 = prepareEvent({
          signature: "event RoleGranted(bytes32 indexed role, address indexed account, address indexed sender)"
        });
        const preparedEvent17 = prepareEvent({
          signature: "event RoleRevoked(bytes32 indexed role, address indexed account, address indexed sender)"
        });
        const preparedEvent18 = prepareEvent({
          signature: "event RoyaltyForToken(uint256 indexed tokenId, address indexed royaltyRecipient, uint256 royaltyBps)"
        });
        const preparedEvent19 = prepareEvent({
          signature: "event TokenURIRevealed(uint256 indexed index, string revealedURI)"
        });
        const preparedEvent20 = prepareEvent({
          signature: "event TokensClaimed(uint256 indexed claimConditionIndex, address indexed claimer, address indexed receiver, uint256 startTokenId, uint256 quantityClaimed)"
        });
        const preparedEvent21 = prepareEvent({
          signature: "event TokensLazyMinted(uint256 indexed startTokenId, uint256 endTokenId, string baseURI, bytes encryptedBaseURI)"         });
        
        const preparedEventTransfer = prepareEvent({
          signature: "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)"
        });
        const preparedEvent22 = prepareEvent({ 
          signature: "event ConsecutiveTransfer(uint256 indexed fromTokenId, uint256 toTokenId, address indexed from, address indexed to)" 
        });
        const preparedEvent23 = prepareEvent({ 
          signature: "event MetadataUpdate(uint256 _tokenId)" 
        });
        const preparedEvent24 = prepareEvent({ 
          signature: "event RoyaltyForToken(uint256 indexed tokenId, address indexed royaltyRecipient, uint256 royaltyBps)" 
        });
        const preparedEvent25 = prepareEvent({ 
          signature: "event SharedMetadataUpdated(string name, string description, string imageURI, string animationURI)" 
        });
        const preparedEvent26 = prepareEvent({ 
          signature: "event MetadataUpdate(uint256 _tokenId)" 
        });
        const preparedEvent27 = prepareEvent({ 
          signature: "event EIP712DomainChanged()" 
        });
        const preparedEvent28 = prepareEvent({ 
          signature: "event TokensMinted(address indexed mintedTo, uint256 indexed tokenIdMinted, string uri)" 
        });
        const preparedEvent29 = prepareEvent({ 
          signature: "event TokensMintedWithSignature(address indexed signer, address indexed mintedTo, uint256 indexed tokenIdMinted, (address to, address royaltyRecipient, uint256 royaltyBps, address primarySaleRecipient, string uri, uint256 price, address currency, uint128 validityStartTimestamp, uint128 validityEndTimestamp, bytes32 uid) mintRequest)" 
        });
        const preparedEvent30 = prepareEvent({ 
          signature: "event TransferBatch(address indexed operator, address indexed from, address indexed to, uint256[] ids, uint256[] values)" 
        });
        const preparedEvent31 = prepareEvent({ 
          signature: "event TransferSingle(address indexed operator, address indexed from, address indexed to, uint256 id, uint256 value)" 
        });
        const preparedEvent32 = prepareEvent({ 
          signature: "event URI(string value, uint256 indexed id)" 
        });

        const eventsErc721drop =  [
          preparedEvent1,
          preparedEvent2,
          preparedEvent3,
          preparedEvent4,
          preparedEvent5,
          preparedEvent6,
          preparedEvent7,
          preparedEvent8,
          preparedEvent9,
          preparedEvent10,
          preparedEvent11,
          preparedEvent12,
          preparedEvent13,
          preparedEvent14,
          preparedEvent15,
          preparedEvent16,
          preparedEvent17,
          preparedEvent18,
          preparedEvent19,
          preparedEvent20,
          preparedEvent21,
          preparedEventTransfer
        ];
        const eventsErc721SharedMetadata =  [
          preparedEvent1,
          preparedEvent2,
          preparedEvent3,
          preparedEvent4,
          preparedEvent5,
          preparedEvent6,
          preparedEvent7,
          preparedEvent8,
          preparedEvent11,
          preparedEvent14,
          preparedEvent15,
          preparedEvent16,
          preparedEvent17,
          preparedEvent18,
          preparedEvent20,
          preparedEvent22,
          preparedEvent23,
          preparedEvent25,
          preparedEventTransfer
        ];

      const eventsErc1155Collection =  [
        preparedEvent2,
        preparedEvent3,
        preparedEvent5,
        preparedEvent6,
        preparedEvent7,
        preparedEvent8,
        preparedEvent10,
        preparedEvent11,
        preparedEvent12,
        preparedEvent13,
        preparedEvent14,
        preparedEvent15,
        preparedEvent16,
        preparedEvent17,
        preparedEvent18,
        preparedEvent26,
        preparedEvent27,
        preparedEvent28,
        preparedEvent29,        
        preparedEvent30,       
        preparedEvent31,
        preparedEventTransfer
      ];

      const eventsErc1155Drop =  [
        preparedEvent2,
        preparedEvent3,
        preparedEvent4,        
        preparedEvent5,
        preparedEvent6,
        preparedEvent7,
        preparedEvent8,
        preparedEvent9,
        preparedEvent10,
        preparedEvent11,
        preparedEvent12,
        preparedEvent13,
        preparedEvent14,
        preparedEvent15,
        preparedEvent16,
        preparedEvent17,
        preparedEvent18,
        preparedEvent20,
       preparedEvent30,
       preparedEvent31,
        preparedEvent21,
        preparedEvent32,
        preparedEventTransfer
      ];

      const eventsErc721Collection =  [
        preparedEvent1,
        preparedEvent2,
        preparedEvent3,
        preparedEvent5,
        preparedEvent6,
        preparedEvent7,
        preparedEvent8,
        preparedEvent10,
        preparedEvent11,
        preparedEvent12,
        preparedEvent13,
        preparedEvent14,
        preparedEvent15,
        preparedEvent16,
        preparedEvent17,
        preparedEvent18,
        preparedEvent26,
        preparedEvent27,
        preparedEvent28,
        preparedEvent29,        
        preparedEventTransfer
      ];
        

      const ERCDefault =  [
        preparedEvent1,
        preparedEvent2,       
        preparedEventTransfer
      ];

      // If type is supposed to be a string, cast it explicitly
      let eventsData: any; // Assign appropriate type if available
      let contractType: string | undefined;
      
      const data = await getContractVersion(contract);
      
      if (data) {
        contractType = data.contractType as string; // Ensure this is string
      }
      
      switch (contractType) {
        case "0x44726f7045524337323100000000000000000000000000000000000000000000":
          eventsData = eventsErc721drop;
          break;
        case "0x546f6b656e455243373231000000000000000000000000000000000000000000":
          eventsData = eventsErc721Collection;
          break;
        case "0x546f6b656e455243313135350000000000000000000000000000000000000000":
          eventsData = eventsErc1155Collection;
          break;
        case "0x44726f7045524331313535000000000000000000000000000000000000000000":
          eventsData = eventsErc1155Drop;
          break;
        case "0x546f6b656e455243323000000000000000000000000000000000000000000000":
        default:
          // If contract type isn't one of the above, check for sharedMetadata
          const sharedMetadataResult = await getSharedMetadata(contract);
      
          if (sharedMetadataResult) {
            eventsData = eventsErc721SharedMetadata;
          } else {
            eventsData = ERCDefault; // Fallback if no sharedMetadata or known contractType
          }
          break;
      }
      


      const marketplaceEventIoPlasma2 = prepareEvent({
        signature: "event NewSale(address indexed listingCreator, uint256 indexed listingId, address indexed assetContract, uint256 tokenId, address buyer, uint256 quantityBought, uint256 totalPricePaid)"
      });
      
  
            const marketplaceContract2 = getContract({
              address: "0xF87c2066577f2e1c799C4e5628d578B623F5481f", // Placeholder marketplace address
              client: client,
              chain: NETWORK,
            });
  
                const latestBlockNumber = 32001690n;
                let currentBlock = 30000000n;
        
                while (currentBlock <= latestBlockNumber) {
                  const toBlock =
                    currentBlock + blockBatchSize - 1n > latestBlockNumber
                      ? latestBlockNumber
                      : currentBlock + blockBatchSize - 1n;

                      const marketplaceEventsIoPlasma = await getContractEvents({
                        contract: marketplaceContract2,
                        fromBlock: currentBlock,
                        toBlock,
                        events: [marketplaceEventIoPlasma2],
                      });
        
        
                  const fetchedEvents = await getContractEvents({
                    contract,
                    fromBlock: currentBlock,
                    toBlock,
                    events: eventsData,
                  });

          console.log(`Fetched ${fetchedEvents.length} events`);

          if (fetchedEvents.length > 0) {
            const eventDetails = await Promise.all(
              fetchedEvents.map(async (event: any) => {
                const blockNumberHex = `0x${event.blockNumber.toString(16)}`;
                const blockDetails = await getRpcClient({ client, chain: NETWORK })({
                  method: "eth_getBlockByNumber",
                  params: [blockNumberHex as `0x${string}`, false],
                });

                if (blockDetails && typeof blockDetails === "object" && "timestamp" in blockDetails) {
                  let eventName: string = "";
                  let blockNumber: string= "";
            
                  let price: string | undefined = undefined;
                  let marketplace: string | undefined = undefined;
                  let from: string | undefined = undefined;
                  let to: string | undefined = undefined;
                  let tokenId: string= "";
                  let transactionHash: string = "";

                  const relatedSaleIoPlasma = marketplaceEventsIoPlasma.find(sale =>
                    sale.args?.assetContract.toLowerCase() === contract.address.toLowerCase() && 
                    sale.args?.tokenId.toString() === event.args?.tokenId.toString() &&
                    sale.blockNumber.toString() === event.blockNumber.toString()
                  );

                  console.log("Related Sale IoPlasma:", relatedSaleIoPlasma);


                  if (event.args?.from === "0x0000000000000000000000000000000000000000") {
                    const listingInfo = await fetchNftMint(event.transactionHash, chainId);
                    console.log("Fetched listing info for Mint event:", listingInfo);
                    
                    if (listingInfo) {
                      price = listingInfo.price;
                    } 
                    marketplace = "";
                    eventName = "Mint";
                    from = event.args?.from;
                    to = event.args?.to;
                    blockNumber = event.blockNumber.toString();
                    tokenId = event.args.tokenId.toString();
                    transactionHash = event.transactionHash;
                    
                  } else if (event.args?.to === "0x000000000000000000000000000000000000dEaD") {
                    eventName = "Burn"; // Burn event
                    from = event.args?.from;
                    to = event.args?.to;
                    blockNumber = event.blockNumber.toString();
                    tokenId = event.args.tokenId.toString();
                    transactionHash = event.transactionHash;
                
                  } 
                  else if (relatedSaleIoPlasma) {
                    eventName = "Sale";
                    marketplace = marketplaceContract2.address;
                    from = relatedSaleIoPlasma.args?.listingCreator;
                    to = relatedSaleIoPlasma.args?.buyer;                
                    const listingInfo = await findListingId(marketplaceContract2, relatedSaleIoPlasma.args?.listingId);
                    console.log("Fetched listing info for Sale event:", listingInfo);
                    
                    if (listingInfo) {
                      price = `${listingInfo.price} ${listingInfo.symbol}`;
                    }
                  }    
                    else if (event.eventName === "Transfer") {
                      const listingInfo = await fetchNftSaleSale(event.transactionHash, chainId);
                      console.log("Fetched listing info for Transfer event:", listingInfo);
                      
                      if (listingInfo) {
                        price = `${listingInfo.price}` ||"";
                        marketplace = listingInfo.marketplace || "";
                      }
                      eventName = event.eventName;
                      from = event.args?.from;
                      to = event.args?.to;
                      blockNumber = event.blockNumber.toString();
                      tokenId = event.args.tokenId.toString() || "";
                      transactionHash = event.transactionHash;
                  
                  }

                  const timestamp = blockDetails.timestamp;
                  const eventWithTimestamp: EventDetails = {
                    contractAddress: contractAddress,
                    from: from || event.args?.from ,
                    to: to || event.args?.to ,
                    tokenId: event.args?.tokenId?.toString() ?? "",
                    chainId,
                    blockNumber: event.blockNumber.toString() ?? "",
                    transactionHash: event.transactionHash,
                    eventName: event.eventName,
                    price: price || "",
                    marketplace: marketplace || "",
                    timestamp: new Date(parseInt(timestamp, 16) * 1000).toISOString() || "",
                  };

                  return eventWithTimestamp;
                } else {
                  throw new Error(`Failed to fetch block details for block ${event.blockNumber}`);
                }
              })
            );

            setEvents((prevEvents) => [...prevEvents, ...eventDetails]);

          }

          currentBlock = toBlock + 1n;
        }
        
      } catch (error) {
        console.error("Error fetching contract events:", error);
        setError("Failed to fetch events. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [chainId, contractAddress]);

  const serializeTransactionDetails = (details: EventDetails) => {
    return JSON.stringify(details, null, 2);
  };

  return (
    <div>
      <h1>Fetched Events</h1>
      {loading && <p>Loading events, please wait...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
      {!loading && events.length === 0 && !error && <p>No events found.</p>}
      {events.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Transaction Details</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event, index) => (
              <tr key={index}>
                <td>
                  <pre>{serializeTransactionDetails(event)}</pre>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default FetchAndDisplayEvents;
