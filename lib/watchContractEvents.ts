import { eth_blockNumber, getContract, getRpcClient, prepareEvent, watchContractEvents } from "thirdweb";
import { NETWORK } from "@/const/contracts";
import client from '@/lib/client';

type EventArgsA = {
  orderHash: `0x${string}`;
  orderNonce: bigint;
  taker: string;
  maker: string;
  strategy: string;
  currency: string;
  collection: string;
  tokenId: bigint;
  amount: bigint;
  price: bigint;
};

type EventArgsB = {
  orderHash: `0x${string}`;
  // Add other specific properties for this shape as needed
  price: bigint;
};

// Helper function to serialize BigInt data recursively
function serializeBigInts(data: any): any {
  if (typeof data === 'bigint') {
    return data.toString(); // Convert BigInt to string
  } else if (Array.isArray(data)) {
    return data.map(serializeBigInts); // Handle arrays
  } else if (typeof data === 'object' && data !== null) {
    const serializedObj: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      serializedObj[key] = serializeBigInts(value); // Recursively serialize each property
    }
    return serializedObj;
  }
  return data; // Return as-is for other types
}

let isWatching = false;  // Track if Mimo marketplace events are being watched
let isWatching2 = false; // Track if ioPlasma marketplace events are being watched

export async function fetchMimoMarketplace() {
  if (isWatching) return;  // Prevent multiple calls
  isWatching = true;

  const chainIdNumber = 4689;
  const rpcClient = getRpcClient({ client, chain: NETWORK });

  const latestBlockNumber = await eth_blockNumber(rpcClient);

  // Get the marketplace contract
  const marketplaceContract = getContract({
    address: "0x7499e71FF8a472D1d82Aa2e68e868B5B92896B0E", // Marketplace contract address
    client: client,
    chain: NETWORK,
  });

  // Prepare events for TakerBid and TakerAsk
  const preparedEventTakerBid = prepareEvent({
    signature: "event TakerBid(bytes32 orderHash, uint256 orderNonce, address indexed taker, address indexed maker, address indexed strategy, address currency, address collection, uint256 tokenId, uint256 amount, uint256 price)"
  });

  const preparedEventTakerAsk = prepareEvent({
    signature: "event TakerAsk(bytes32 orderHash, uint256 orderNonce, address indexed taker, address indexed maker, address indexed strategy, address currency, address collection, uint256 tokenId, uint256 amount, uint256 price)"
  });

  // Watch for contract events
  watchContractEvents({
    contract: marketplaceContract,
    events: [preparedEventTakerBid, preparedEventTakerAsk],
    onEvents: async (events) => {
      for (const event of events) {
        const collectionAddress = event.args.collection;
        const serializedData = JSON.stringify(serializeBigInts(event)); // Serialize BigInt

        // Retry logic for API call
        let success = false;
        let retries = 3;
        while (!success && retries > 0) {
          try {
            console.log('Sending event data to API...');
            const response = await fetch(`http://localhost:3000/api/saveContractEvents/${chainIdNumber}/${collectionAddress}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: serializedData
            });
            if (response.ok) {
              success = true; // Mark success if response is ok
            } else {
              console.error('Failed to send event:', response.statusText);
            }
          } catch (error) {
            console.error('Error sending event data:', error);
            retries--;
            if (retries > 0) {
              console.log('Retrying...');
            }
          }
        }

        if (!success) {
          console.error('Failed to send event after retries.');
        }
      }
    },
    latestBlockNumber // Start from the latest block
  });

  console.log('Started watching contract events...');
}

export async function fetchioPlasmaMarketplace() {
  if (isWatching2) return;  // Prevent multiple calls
  isWatching2 = true;

  const chainIdNumber = 4689;
  const rpcClient = getRpcClient({ client, chain: NETWORK });

  const latestBlockNumber = await eth_blockNumber(rpcClient);

  const marketplaceContract = getContract({
    address: "0xF87c2066577f2e1c799C4e5628d578B623F5481f", // Marketplace contract address
    client: client,
    chain: NETWORK,
  });

  // Prepare events for NewSale and NewListing
  const marketplaceEventNewSale = prepareEvent({
    signature: "event NewSale(address indexed listingCreator, uint256 indexed listingId, address indexed assetContract, uint256 tokenId, address buyer, uint256 quantityBought, uint256 totalPricePaid)"
  });

  const preparedEventNewListing = prepareEvent({
    signature: "event NewListing(address indexed listingCreator, uint256 indexed listingId, address indexed assetContract, (uint256 listingId, uint256 tokenId, uint256 quantity, uint256 pricePerToken, uint128 startTimestamp, uint128 endTimestamp, address listingCreator, address assetContract, address currency, uint8 tokenType, uint8 status, bool reserved) listing)"
  });

  // Watch for contract events
  watchContractEvents({
    contract: marketplaceContract,
    events: [marketplaceEventNewSale, preparedEventNewListing],
    onEvents: async (events) => {
      for (const event of events) {
        const collectionAddress = event.args.assetContract; // Adjust as needed
        const serializedData = JSON.stringify(serializeBigInts(event)); // Serialize BigInt

        // Retry logic for API call
        let success = false;
        let retries = 3;
        while (!success && retries > 0) {
          try {
            console.log('Sending event data to API...');
            const response = await fetch(`http://localhost:3000/api/saveContractEvents/${chainIdNumber}/${collectionAddress}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: serializedData
            });
            if (response.ok) {
              success = true;
            } else {
              console.error('Failed to send event:', response.statusText);
            }
          } catch (error) {
            console.error('Error sending event data:', error);
            retries--;
            if (retries > 0) {
              console.log('Retrying...');
            }
          }
        }

        if (!success) {
          console.error('Failed to send event after retries.');
        }
      }
    },
    latestBlockNumber // Start from the latest block
  });

  console.log('Started watching contract events...');
}
