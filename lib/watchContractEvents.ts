import { getContract, prepareEvent, getContractEvents, defineChain, eth_blockNumber, getRpcClient, ThirdwebContract, Address, eth_getTransactionByHash, readContract, createThirdwebClient } from "thirdweb";
import { pool } from "./db";
import { ownerOf, tokenURI } from "thirdweb/extensions/erc721";
import { getAuction, getListing ,getWinningBid} from "thirdweb/extensions/marketplace";
import { FaSalesforce } from "react-icons/fa";
import { getContractMetadata, name } from 'thirdweb/extensions/common';
import axios from "axios";
const clientId = process.env.TW_SECRET_KEY;
if (!clientId) {
  throw new Error("Client ID not set");
}
const client = createThirdwebClient({
  secretKey: clientId,
});  
interface CurrencyData {
  symbol: string;
  decimals: number;
  address: Address;
}

type sharedMetadataDetails = {
  name: string;
  description: string;
  image: string;
  metadata: string;  // Ensure this is just 'string'
};


type TransactionDetails = {
  transactionHash: string;
  eventName: string;
  price: string;
  marketplace: string;  // Ensure this is just 'string'
 };


const CURRENCY_DATA: CurrencyData[] = [
  { symbol: 'IOTX', decimals: 18, address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE' }, // Native
  { symbol: 'ioShiba', decimals: 9, address: '0x3EA683354bf8d359cd9EC6E08B5AEC291D71d880' }, // ioShiba
  { symbol: 'dePinny', decimals: 18, address: '0xdfF8596d62b6d35fFFfc9e465d2FDeA49Ac3c311' }  // depinny
];
interface EventDetailsIoPlasma {
  contractAddress: string;
  auctionId?: bigint;
  listingId?: bigint;           // Some events like AuctionClosed may not have listingId
  tokenId: string;
  bidAmount: bigint;
  quantity?: string;
  pricePerToken?: string;
  startTimestamp?: string;
  endTimestamp?: string;
  listingCreator?: string;
  auctionCreator?: string;
  assetContract: string;
  currency?: string;
  tokenType?: number;
  status?: number;
  reserved?: boolean;
  bidder?: string;
  winningBidder?: string;
  chainId: number;
  blockNumber: string;
  transactionHash: string;
  eventName: string;
  timestamp: string;
}


export interface EventDetails {
  contractAddress: string;
  from?: string;
  to?: string;
  tokenId: string;
  listingId: string;
  chainId: number;
  blockNumber: string;
  transactionHash: string;
  eventName: string;
  timestamp: string;
  price?: string;
  marketplace: string;  // Ensure this is just 'string'
}

function sanitizeTableName(name: string): string {
  return name.replace(/[^a-z0-9_]/gi, '_').toLowerCase();
}

async function createTableIfNotExists(tableName: string) {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "${tableName}" (
        contract_address TEXT,
        from_address TEXT,
        to_address TEXT,
        token_id TEXT,
        listing_id TEXT,
        chain_id BIGINT,
        block_number TEXT,
        transaction_hash TEXT,
        event_name TEXT,
        price TEXT,
        marketplace TEXT,
        timestamp TEXT,
        UNIQUE (block_number, transaction_hash, event_name, token_id) -- Ensure unique events
      )
    `);
    console.log(`Table "${tableName}" created or already exists.`);
  } catch (error) {
    console.error(`Error creating table "${tableName}":`, error);
    throw error;
  }
}

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
      return null;
    }

    // Convert the readonly array into a mutable array, and map it to the correct type
    const contractTypeData = contractType;

    return {
      contractType: contractTypeData,
    };

  } catch (error) {
    return null;
  }
}






async function findFirstMintedTokenId(nftContract: ThirdwebContract, startBlock: bigint, blockBatchSize: bigint): Promise<BigInt | null> {
  let tokenId = BigInt(0);


  while (startBlock >= 0n) {
    try {
      await ownerOf({ contract: nftContract, tokenId });
      return tokenId;
    } catch {
      tokenId += BigInt(1);
    }

    startBlock -= blockBatchSize;
  }

  return null;
}
async function findAuctiomId(marketplaceContract2: ThirdwebContract, listingId: bigint): Promise<{ symbol: string, price: string, tokenId: string } | null> {
  try {
    // Fetch the listing information
    const listing = await getWinningBid({ contract: marketplaceContract2, auctionId: listingId });
    const listing2 = await getAuction({ contract: marketplaceContract2, auctionId: listingId });

    // Ensure the listing contains expected fields
    if (!listing || !listing.currencyAddress || !listing.currencyValue) {
      return null;
    }

    const { currencyAddress, bidAmountWei } = listing;

    // Find the corresponding currency data
    const currency = CURRENCY_DATA.find(c => c.address.toLowerCase() === currencyAddress.toLowerCase());

    if (!currency) {
      console.log("Currency not found in CURRENCY_DATA.");
      return null;
    }

    // Check for decimal transformation using BigInt
    const decimalsBigInt = BigInt(10 ** currency.decimals); // Convert decimals to BigInt safely
    const transformedPrice = (BigInt(bidAmountWei) / decimalsBigInt).toString(); // Perform division with BigInt

    return {
      symbol: currency.symbol,
      price: transformedPrice,
      tokenId: listing2.tokenId.toString()
    };
  } catch (error) {
    console.error("Error fetching listing or currency data:", error);
    return null;
  }
}

async function findAuctiomId2(marketplaceContract2: ThirdwebContract, listingId: bigint, bidAmount?: bigint): Promise<{ symbol: string, price: string, bidAmount?:string, tokenId: string } | null> {
  try {
    // Fetch the listing information
    const listing = await getAuction({ contract: marketplaceContract2, auctionId: listingId });

    // Ensure the listing contains expected fields
    if (!listing || !listing.currencyContractAddress || !listing.minimumBidAmount) {
      return null;
    }

    const { currencyContractAddress, minimumBidAmount } = listing;

    // Find the corresponding currency data
    const currency = CURRENCY_DATA.find(c => c.address.toLowerCase() === currencyContractAddress.toLowerCase());

    if (!currency) {
      console.log("Currency not found in CURRENCY_DATA.");
      return null;
    }

    // Check for decimal transformation using BigInt
    const decimalsBigInt = BigInt(10 ** currency.decimals); // Convert decimals to BigInt safely
    const transformedPrice = (BigInt(minimumBidAmount) / decimalsBigInt).toString(); // Perform division with BigInt
    const transformedPrice2 = (BigInt(bidAmount!) / decimalsBigInt).toString(); // Perform division with BigInt

    return {
      symbol: currency.symbol,
      price: transformedPrice,
      bidAmount: transformedPrice2,
      tokenId: listing.tokenId.toString()

    };
  } catch (error) {
    console.error("Error fetching listing or currency data:", error);
    return null;
  }
}


async function handleReadNft(nftContractAddress: string, tokenId: bigint): Promise<{ name: string; imageUrl: string } | null> {
  const NETWORK = defineChain(4689)
   const contract = getContract({
     address: nftContractAddress,
     client: client,
     chain: NETWORK,
   });
   try {
     const tokenUri = await tokenURI({ contract, tokenId });
     const nftName = await name({ contract });
 
     let metadataUrl;
 
     if (typeof tokenUri === 'string') {
       if (tokenUri.startsWith("ipfs://")) {
         const gatewayUrl = tokenUri.replace("ipfs://", "https://ipfs.io/ipfs/");
         metadataUrl = `https://nieuwe-map-5.vercel.app/metadata?url=${encodeURIComponent(gatewayUrl)}`;
       } else if (tokenUri.startsWith("data:")) {
         const base64Data = tokenUri.split(",")[1];
         const decodedData = Buffer.from(base64Data, 'base64').toString('utf-8');
         const metadata = JSON.parse(decodedData);
 
         const proxyImageUrl = `https://nieuwe-map-5.vercel.app/metadataImage?url=${encodeURIComponent(metadata.image)}`;
 
         return {
           name: metadata.name || nftName || "Unknown Name",
           imageUrl: proxyImageUrl
         };
       } else {
         try {
           const metadata = JSON.parse(tokenUri);
           const proxyImageUrl = `https://nieuwe-map-5.vercel.app/metadataImage?url=${encodeURIComponent(metadata.image)}`;
 
           return {
             name: metadata.name || nftName || "Unknown Name",
             imageUrl: proxyImageUrl
           };
         } catch (error) {
           metadataUrl = `https://nieuwe-map-5.vercel.app/metadata?url=${encodeURIComponent(tokenUri)}`;
         }
       }
 
       const response = await axios.get(metadataUrl);
 
       if (response.data) {
         return {
           name: response.data.name || nftName || "Unknown Name",
           imageUrl: response.data.image
         };
       } else {
         console.error("Invalid metadata response:", response.data);
       }
     } else {
       console.error("Invalid token URI format:", tokenUri);
     }
   } catch (error) {
     console.error("Error fetching metadata:", error);
   }
 
   return null; // Return null if no valid data was found
 }



export async function fetchIoPlasmaContract(
  
) {

  const allFetchedEvents: EventDetails[] = [];
  const blockBatchSize = 10000n;
  const chainId = 4689;
  const NETWORK = defineChain(4689)
  const rpcClient = getRpcClient({ client, chain: NETWORK });
  

  const marketplaceContract2 = getContract({
    address: "0xF87c2066577f2e1c799C4e5628d578B623F5481f", // Placeholder marketplace address
    client: client,
    chain: NETWORK,
  });
  const tableName =  `api_route_marketplace_${chainId}_${sanitizeTableName(marketplaceContract2.address)}`;
  const tableExistsResult = await pool.query(`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_name = '${tableName}'
    ) AS exists
  `);
  const tableExists = tableExistsResult.rows[0].exists;
  let currentBlock: bigint = 1n;

  if (tableExists) {
    // Table exists, check if it has data
    const { rows } = await pool.query(`
      SELECT block_number FROM "${tableName}" ORDER BY block_number DESC LIMIT 1
    `);
    const startBlock = BigInt(rows[0].block_number) + 1n;
     currentBlock = startBlock;
        }    
    const latestBlockNumber = await eth_blockNumber(rpcClient);
 
   
    const preparedEvent1 = prepareEvent({
      signature: "event NewListing(address indexed listingCreator, uint256 indexed listingId, address indexed assetContract, (uint256 listingId, uint256 tokenId, uint256 quantity, uint256 pricePerToken, uint128 startTimestamp, uint128 endTimestamp, address listingCreator, address assetContract, address currency, uint8 tokenType, uint8 status, bool reserved) listing)"
    });

    const preparedEvent2 = prepareEvent({
      signature: "event UpdatedListing(address indexed listingCreator, uint256 indexed listingId, address indexed assetContract, (uint256 listingId, uint256 tokenId, uint256 quantity, uint256 pricePerToken, uint128 startTimestamp, uint128 endTimestamp, address listingCreator, address assetContract, address currency, uint8 tokenType, uint8 status, bool reserved) listing)"
    });

    const preparedEvent3 = prepareEvent({
      signature: "event NewAuction(address indexed auctionCreator, uint256 indexed auctionId, address indexed assetContract, (uint256 auctionId, uint256 tokenId, uint256 quantity, uint256 minimumBidAmount, uint256 buyoutBidAmount, uint64 timeBufferInSeconds, uint64 bidBufferBps, uint64 startTimestamp, uint64 endTimestamp, address auctionCreator, address assetContract, address currency, uint8 tokenType, uint8 status) auction)"
    });
    

    const preparedEvent4 = prepareEvent({
      signature: "event AuctionClosed(uint256 indexed auctionId, address indexed assetContract, address indexed closer, uint256 tokenId, address auctionCreator, address winningBidder)"
    });
    
    const preparedEvent5 = prepareEvent({
      signature: "event NewBid(uint256 indexed auctionId, address indexed bidder, address indexed assetContract, uint256 bidAmount, (uint256 auctionId, uint256 tokenId, uint256 quantity, uint256 minimumBidAmount, uint256 buyoutBidAmount, uint64 timeBufferInSeconds, uint64 bidBufferBps, uint64 startTimestamp, uint64 endTimestamp, address auctionCreator, address assetContract, address currency, uint8 tokenType, uint8 status) auction)" 
    });

    const marketplaceEventIoPlasma2 = prepareEvent({
      signature: "event NewSale(address indexed listingCreator, uint256 indexed listingId, address indexed assetContract, uint256 tokenId, address buyer, uint256 quantityBought, uint256 totalPricePaid)"
    });

    const marketplaceEvents4 = await getContractEvents({
      contract: marketplaceContract2,
      fromBlock: currentBlock,
      toBlock: latestBlockNumber,
      events: [marketplaceEventIoPlasma2,preparedEvent5,preparedEvent4,preparedEvent3,preparedEvent2,preparedEvent1],
    });
    
    


    // Combine and process events
      let eventName: string = "Transfer";
      let blockNumber: string= "";

      let price: string | undefined = undefined;
      let marketplace: string | undefined = undefined;
      let from: string | undefined = undefined;
      let to: string | undefined = undefined;
      let tokenId: string= "";
      let listingId: string= "";

      let transactionHash: string = "";
      let timestamp: any = "";

      let imageUrl: string= "";

      let name: string = "";
      const relatedSale4 = marketplaceEvents4.find(sale => 
        sale.args?.assetContract.toLowerCase() 
      );

      // Check if this transfer matches a marketplace sale
      

      if (relatedSale4?.eventName === "NewBid") {
        eventName = relatedSale4.eventName;
        listingId = relatedSale4.args.auctionId.toString();
        from = relatedSale4.args?.bidder;
        to = "";
        blockNumber = relatedSale4.blockNumber.toString();
        tokenId = relatedSale4.args?.auction.tokenId.toString();
        transactionHash = relatedSale4.transactionHash;
        marketplace = "ioPlasma Marketplace";
        const listingInfo = await findAuctiomId2(marketplaceContract2, relatedSale4.args?.auction.auctionId, relatedSale4.args?.bidAmount);
        if (listingInfo) {
          price = `Bid ${listingInfo.bidAmount} ${listingInfo.symbol} New Price${listingInfo.price} ${listingInfo.symbol}`;
        }
        const blockNumberHex = `0x${relatedSale4.blockNumber.toString(16)}`;
      const blockDetails = await getRpcClient({ client, chain: NETWORK })({
        method: "eth_getBlockByNumber",
        params: [blockNumberHex as `0x${string}`, false],
      });

      timestamp = blockDetails?.timestamp
      ? new Date(parseInt(blockDetails.timestamp, 16) * 1000).toISOString()
      : '';
   


      } else if (relatedSale4?.eventName === "AuctionClosed") {
        eventName = relatedSale4.eventName;
        from = relatedSale4.args?.auctionCreator;
        to = relatedSale4.args?.winningBidder;
        listingId = relatedSale4.args.auctionId.toString();
        blockNumber = relatedSale4.blockNumber.toString();
        tokenId = relatedSale4.args?.tokenId.toString();
        transactionHash = relatedSale4.transactionHash;
        marketplace = "ioPlasma Marketplace";
        const blockNumberHex = `0x${relatedSale4.blockNumber.toString(16)}`;
        const blockDetails = await getRpcClient({ client, chain: NETWORK })({
          method: "eth_getBlockByNumber",
          params: [blockNumberHex as `0x${string}`, false],
        });
  
        timestamp = blockDetails?.timestamp
        ? new Date(parseInt(blockDetails.timestamp, 16) * 1000).toISOString()
        : '';
        const listingInfo = await findAuctiomId(marketplaceContract2, relatedSale4.args.auctionId);
        if (listingInfo) {
          price = `${listingInfo.price} ${listingInfo.symbol}`;
        }
       


      } else if (relatedSale4?.eventName === "NewAuction") {
        eventName = relatedSale4.eventName;
        from = relatedSale4.args?.auction.auctionCreator;
        to = ""
        listingId = relatedSale4.args.auctionId.toString()
        blockNumber = relatedSale4.blockNumber.toString();
        tokenId = relatedSale4.args?.auction.tokenId.toString();
        transactionHash = relatedSale4.transactionHash;
        marketplace = "ioPlasma Marketplace";
        const listingInfo = await findAuctiomId2(marketplaceContract2, relatedSale4.args.auction.auctionId, relatedSale4.args.auction.buyoutBidAmount) ;
        const blockNumberHex = `0x${relatedSale4.blockNumber.toString(16)}`;
        const blockDetails = await getRpcClient({ client, chain: NETWORK })({
          method: "eth_getBlockByNumber",
          params: [blockNumberHex as `0x${string}`, false],
        });
  
        timestamp = blockDetails?.timestamp
        ? new Date(parseInt(blockDetails.timestamp, 16) * 1000).toISOString()
        : '';
        if (listingInfo) {
          price = `Buyout${listingInfo.bidAmount} ${listingInfo.symbol} Aucion starts from ${listingInfo.price} ${listingInfo.symbol}`;
        }
      } else if (relatedSale4?.eventName === "UpdatedListing") {
        eventName = relatedSale4.eventName;
        from = relatedSale4.args?.listing.listingCreator;
        to = ""
        listingId = relatedSale4.args?.listingId.toString();
        blockNumber = relatedSale4.blockNumber.toString();
        tokenId = relatedSale4.args?.listing.tokenId.toString();
        transactionHash = relatedSale4.transactionHash;
        marketplace = "ioPlasma Marketplace";
        const blockNumberHex = `0x${relatedSale4.blockNumber.toString(16)}`;
      const blockDetails = await getRpcClient({ client, chain: NETWORK })({
        method: "eth_getBlockByNumber",
        params: [blockNumberHex as `0x${string}`, false],
      });

      timestamp = blockDetails?.timestamp
      ? new Date(parseInt(blockDetails.timestamp, 16) * 1000).toISOString()
      : '';
        const listingInfo = await findListingId(marketplaceContract2, relatedSale4.args.listingId);

        if (listingInfo) {
          price = `${listingInfo.price} ${listingInfo.symbol}`;
        }
      } else if (relatedSale4?.eventName === "NewSale") {
        eventName = "Sale";
              marketplace = marketplaceContract2.address;
              listingId = relatedSale4.args.listingId.toString();
              from = relatedSale4.args?.listingCreator;
              to = relatedSale4.args?.buyer;
              tokenId = relatedSale4.args?.tokenId.toString();
              const listingInfo = await findListingId(marketplaceContract2, relatedSale4.args?.listingId);
              console.log("Fetched listing info for Sale event:", listingInfo);
              blockNumber = relatedSale4.blockNumber.toString();
              if (listingInfo) {
                price = `${listingInfo.price} ${listingInfo.symbol}`;
              }
              transactionHash = relatedSale4.transactionHash;
        marketplace = "ioPlasma Marketplace";
        const blockNumberHex = `0x${relatedSale4.blockNumber.toString(16)}`;
      const blockDetails = await getRpcClient({ client, chain: NETWORK })({
        method: "eth_getBlockByNumber",
        params: [blockNumberHex as `0x${string}`, false],
      });

      timestamp = blockDetails?.timestamp
      ? new Date(parseInt(blockDetails.timestamp, 16) * 1000).toISOString()
      : '';
      const imageUrl2 = await handleReadNft(relatedSale4?.args.assetContract, BigInt(tokenId));
      if (imageUrl2) {
        imageUrl = imageUrl2?.imageUrl;
        name = imageUrl2?.name;

      }  
      } else if (relatedSale4?.eventName === "NewListing") {
        eventName = relatedSale4.eventName;
        from = relatedSale4.args?.listing.listingCreator;
        to = "";
        listingId = relatedSale4.args?.listingId.toString();
        blockNumber = relatedSale4.blockNumber.toString();
        tokenId = relatedSale4.args?.listing.tokenId.toString();
        transactionHash = relatedSale4.transactionHash;
        marketplace = "ioPlasma Marketplace";
        const blockNumberHex = `0x${relatedSale4.blockNumber.toString(16)}`;
      const blockDetails = await getRpcClient({ client, chain: NETWORK })({
        method: "eth_getBlockByNumber",
        params: [blockNumberHex as `0x${string}`, false],
      });

      timestamp = blockDetails?.timestamp
      ? new Date(parseInt(blockDetails.timestamp, 16) * 1000).toISOString()
      : '';
        const listingInfo = await findListingId(marketplaceContract2, relatedSale4.args.listingId);
        if (listingInfo) {
          price = `${listingInfo.price} ${listingInfo.symbol}`;
        }
        const imageUrl2 = await handleReadNft(relatedSale4?.args.assetContract, BigInt(tokenId));
        if (imageUrl2) {
          imageUrl = imageUrl2?.imageUrl;
          name = imageUrl2?.name;

        }     
      }


      const eventDetail: EventDetails = {
        contractAddress: marketplaceContract2.address,
        from ,
        to,
        tokenId,
        listingId,
        chainId,
        blockNumber,
        transactionHash,
        eventName,
        price,
        marketplace: marketplaceContract2.address,
        timestamp,
      };

      allFetchedEvents.push(eventDetail);

    

      if (imageUrl && relatedSale4?.eventName == "NewSale") {
        const response = await fetch('https://www.ioplasmaverse.com/api/sendTelegramMessageSale', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            buyer: relatedSale4.args.buyer,
            seller: relatedSale4.args.listingCreator,
            price: price,
            collection: name,
            tokenId: relatedSale4.args.tokenId.toString(),
            marketplace: "ioPlasmaVerse Marketplace",
            imageUrl: imageUrl,
          }),
        });
  
        const result = await response.json();
      
      
    } else if (relatedSale4?.eventName === "NewListing") {
      const response = await fetch('https://www.ioplasmaverse.com/api/sendTelegramMessageListing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          seller: relatedSale4.args.listingCreator,
          price: price,
          collection: name,
          tokenId: relatedSale4.args.listing.tokenId.toString(),
          marketplace: "ioPlasma Marketplace",
          imageUrl: imageUrl, // Replace with the actual image URL
        }),
      });
    
      const result = await response.json();
    
    }
    const filteredAndSortedEvents = allFetchedEvents
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());  allFetchedEvents.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  // Insert fetched events into the database in ascending order
  for (const event of filteredAndSortedEvents) {
    await pool.query(`
      INSERT INTO "${tableName}" (
        contract_address, from_address, to_address, token_id,listing_id, chain_id, block_number, transaction_hash, event_name, price, marketplace, timestamp
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11 , $12
      ) ON CONFLICT (block_number, transaction_hash, event_name, token_id) DO NOTHING
    `, [
      event.contractAddress,
      event.from,
      event.to,
      event.tokenId,
      event.listingId,
      event.chainId,
      event.blockNumber,
      event.transactionHash,
      event.eventName,
      event.price,
      event.marketplace,
      event.timestamp
    ]);
  }
  
  console.log(`Successfully fetched and inserted events for contract ${allFetchedEvents} on chain ${chainId}.`);

  return allFetchedEvents;
}




export async function fetchMimoMarketplace() {
  const allFetchedEvents: EventDetails[] = [];
  const blockBatchSize = 10000n;
  const chainId = 4689;
  const NETWORK = defineChain(4689);
  const rpcClient = getRpcClient({ client, chain: NETWORK });
  const marketplaceContract2 = getContract({
    address: "0x7499e71FF8a472D1d82Aa2e68e868B5B92896B0E", // Placeholder marketplace address
    client: client,
    chain: NETWORK,
  });
  const tableName = `api_route_marketplace_${chainId}_${sanitizeTableName(marketplaceContract2.address)}`;

  const tableExistsResult = await pool.query(`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_name = '${tableName}'
    ) AS exists
  `);
  const tableExists = tableExistsResult.rows[0].exists;
  let currentBlock: bigint = 1n;

  if (tableExists) {
    const { rows } = await pool.query(`
      SELECT block_number FROM "${tableName}" ORDER BY block_number DESC LIMIT 1
    `);
    const startBlock = BigInt(rows[0].block_number) + 1n;
    currentBlock = startBlock;
  }

  const latestBlockNumber = await eth_blockNumber(rpcClient);
  console.log(`Latest block number: ${latestBlockNumber.toString()}`);

  const preparedEvent3 = prepareEvent({
    signature: "event TakerBid(bytes32 orderHash, uint256 orderNonce, address indexed taker, address indexed maker, address indexed strategy, address currency, address collection, uint256 tokenId, uint256 amount, uint256 price)"
  });

  const preparedEvent2 = prepareEvent({
    signature: "event TakerAsk(bytes32 orderHash, uint256 orderNonce, address indexed taker, address indexed maker, address indexed strategy, address currency, address collection, uint256 tokenId, uint256 amount, uint256 price)"
  });

  const marketplaceEvents2 = await getContractEvents({
    contract: marketplaceContract2,
    fromBlock: currentBlock,
    toBlock: latestBlockNumber,
    events: [preparedEvent2, preparedEvent3]
  });

  const decimalsBigInt = BigInt(10 ** 18); // Convert decimals to BigInt safely

  for (const relatedSaleMimo of marketplaceEvents2) {
    let eventName = "Transfer";
    let price: string | undefined;
    let marketplace = "Mimo Marketplace";
    let from = relatedSaleMimo.args?.maker;
    let to = relatedSaleMimo.args?.taker;
    let tokenId = relatedSaleMimo.args?.tokenId.toString();
    let transactionHash = relatedSaleMimo.transactionHash;
    let blockNumber = relatedSaleMimo.blockNumber.toString();

    // Convert block number to timestamp
    const blockNumberHex = `0x${relatedSaleMimo.blockNumber.toString(16)}`;
    const blockDetails = await getRpcClient({ client, chain: NETWORK })({
      method: "eth_getBlockByNumber",
      params: [blockNumberHex as `0x${string}`, false]
    });

    const timestamp = blockDetails?.timestamp
      ? new Date(parseInt(blockDetails.timestamp, 16) * 1000).toISOString()
      : '';

    // Calculate the price in Iotex
    const transformedPrice = (BigInt(relatedSaleMimo.args.price.toString()) / decimalsBigInt).toString();
    price = `${transformedPrice} Iotex`;

    // Fetch the image URL from the NFT contract
    const imageUrl = await handleReadNft(relatedSaleMimo.args.collection, relatedSaleMimo.args?.tokenId);

    // Create event details
    const eventDetail: EventDetails = {
      contractAddress: marketplaceContract2.address,
      from,
      to,
      tokenId,
      listingId: "", // Add if necessary
      chainId,
      blockNumber,
      transactionHash,
      eventName: "Sale",
      price,
      marketplace,
      timestamp
    };

    allFetchedEvents.push(eventDetail);

    // Send a message to Telegram
    if (imageUrl) {
      const response = await fetch('https://www.ioplasmaverse.com/api/sendTelegramMessageSale', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          buyer: relatedSaleMimo.args.taker,
          seller: relatedSaleMimo.args.maker,
          price: `${transformedPrice} Iotex`,
          collection: imageUrl?.name,
          tokenId: relatedSaleMimo.args.tokenId.toString(),
          marketplace: "Mimo Marketplace",
          imageUrl: imageUrl?.imageUrl,
        }),
      });

      const result = await response.json();
    }
  }

  const filteredAndSortedEvents = allFetchedEvents.sort((a, b) =>
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  // Insert fetched events into the database
  for (const event of filteredAndSortedEvents) {
    await pool.query(`
      INSERT INTO "${tableName}" (
        contract_address, from_address, to_address, token_id,listing_id, chain_id, block_number, transaction_hash, event_name, price, marketplace, timestamp
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
      ) ON CONFLICT (block_number, transaction_hash, event_name, token_id) DO NOTHING
    `, [
      event.contractAddress,
      event.from,
      event.to,
      event.tokenId,
      event.listingId,
      event.chainId,
      event.blockNumber,
      event.transactionHash,
      event.eventName,
      event.price,
      event.marketplace,
      event.timestamp
    ]);
  }


  return allFetchedEvents;
}

export async function fetchEventsWhenTableExists(
  

  nftContractAddress: string,
) {
  let currentBlock = 1n;
  const allFetchedEvents: EventDetails[] = [];
  const telegramApiUrl = '/api/sendTelegramMessageSale'; // Adjust this URL if needed
  const blockBatchSize = 25000n;
  const chainId = 4689;
  const NETWORK = defineChain(4689)
  const rpcClient = getRpcClient({ client, chain: NETWORK });
  
  const marketplaceContract = getContract({
    address: "0x7499e71FF8a472D1d82Aa2e68e868B5B92896B0E", // Placeholder marketplace address
    client: client,
    chain: NETWORK,
  });

  const marketplaceContract2 = getContract({
    address: "0xF87c2066577f2e1c799C4e5628d578B623F5481f", // Placeholder marketplace address
    client: client,
    chain: NETWORK,
  });

  const nftContract = getContract({
    address: nftContractAddress,
    client: client,
    chain: NETWORK,
  });

  const tableName = `api_route_contract_events_${chainId}_${sanitizeTableName(nftContractAddress)}`;
  const tableExistsResult = await pool.query(`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_name = '${tableName}'
    ) AS exists
  `);
  const tableExists = tableExistsResult.rows[0].exists;

  if (tableExists) {
    // Table exists, check if it has data
    const { rows } = await pool.query(`
      SELECT block_number FROM "${tableName}" ORDER BY block_number DESC LIMIT 1
    `);
    const startBlock = BigInt(rows[0].block_number) + 1n;
     currentBlock = startBlock;
    }

    const latestBlockNumber = await eth_blockNumber(rpcClient);

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
    preparedEvent24,
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
    preparedEvent24,
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
  preparedEvent24,
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
  preparedEvent24,
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
  preparedEvent24,
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

const data = await getContractVersion(nftContract);

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
    const sharedMetadataResult = await getSharedMetadata(nftContract);

    if (sharedMetadataResult) {
      eventsData = eventsErc721SharedMetadata;
    } else {
      eventsData = ERCDefault; // Fallback if no sharedMetadata or known contractType
    }
    break;
}

  while (currentBlock <= latestBlockNumber) {
    const toBlock = currentBlock + blockBatchSize > latestBlockNumber ? latestBlockNumber : currentBlock + blockBatchSize;
    const preparedEventMimo = prepareEvent({
      signature: "event TakerAsk(bytes32 orderHash, uint256 orderNonce, address indexed taker, address indexed maker, address indexed strategy, address currency, address collection, uint256 tokenId, uint256 amount, uint256 price)"
    });
  
    const preparedEventMimo2 = prepareEvent({
      signature: "event TakerBid(bytes32 orderHash, uint256 orderNonce, address indexed taker, address indexed maker, address indexed strategy, address currency, address collection, uint256 tokenId, uint256 amount, uint256 price)"
    });

    const preparedEvent1 = prepareEvent({
      signature: "event NewListing(address indexed listingCreator, uint256 indexed listingId, address indexed assetContract, (uint256 listingId, uint256 tokenId, uint256 quantity, uint256 pricePerToken, uint128 startTimestamp, uint128 endTimestamp, address listingCreator, address assetContract, address currency, uint8 tokenType, uint8 status, bool reserved) listing)"
    });

    const preparedEvent2 = prepareEvent({
      signature: "event UpdatedListing(address indexed listingCreator, uint256 indexed listingId, address indexed assetContract, (uint256 listingId, uint256 tokenId, uint256 quantity, uint256 pricePerToken, uint128 startTimestamp, uint128 endTimestamp, address listingCreator, address assetContract, address currency, uint8 tokenType, uint8 status, bool reserved) listing)"
    });

    const preparedEvent3 = prepareEvent({
      signature: "event NewAuction(address indexed auctionCreator, uint256 indexed auctionId, address indexed assetContract, (uint256 auctionId, uint256 tokenId, uint256 quantity, uint256 minimumBidAmount, uint256 buyoutBidAmount, uint64 timeBufferInSeconds, uint64 bidBufferBps, uint64 startTimestamp, uint64 endTimestamp, address auctionCreator, address assetContract, address currency, uint8 tokenType, uint8 status) auction)"
    });
    

    const preparedEvent4 = prepareEvent({
      signature: "event AuctionClosed(uint256 indexed auctionId, address indexed assetContract, address indexed closer, uint256 tokenId, address auctionCreator, address winningBidder)"
    });
    
    const preparedEvent5 = prepareEvent({
      signature: "event NewBid(uint256 indexed auctionId, address indexed bidder, address indexed assetContract, uint256 bidAmount, (uint256 auctionId, uint256 tokenId, uint256 quantity, uint256 minimumBidAmount, uint256 buyoutBidAmount, uint64 timeBufferInSeconds, uint64 bidBufferBps, uint64 startTimestamp, uint64 endTimestamp, address auctionCreator, address assetContract, address currency, uint8 tokenType, uint8 status) auction)" 
    });
    const marketplaceEventIoPlasma2 = prepareEvent({
      signature: "event NewSale(address indexed listingCreator, uint256 indexed listingId, address indexed assetContract, uint256 tokenId, address buyer, uint256 quantityBought, uint256 totalPricePaid)"
    });
    const marketplaceEvents6 = await getContractEvents({
      contract: marketplaceContract2,
      fromBlock: currentBlock,
      toBlock: toBlock,
      events: [preparedEvent5,preparedEvent4,preparedEvent3,preparedEvent2,preparedEvent1,marketplaceEventIoPlasma2],
    });
  
    const marketplaceEvents2 = await getContractEvents({
      contract: marketplaceContract,
      fromBlock: currentBlock,
      toBlock: toBlock,
      events: [preparedEventMimo,preparedEventMimo2],
    });
  
  

    const nftTransferEvents = await getContractEvents({
      contract: nftContract,
      fromBlock: currentBlock,
      toBlock: toBlock,
      events: eventsData,
    });
    
    

   

    // Combine and process events
    if (nftTransferEvents.length > 0) {
      // Combine and process events
      const eventDetails = await Promise.all(
        nftTransferEvents.map(async (event: any) => {
          const blockNumberHex = `0x${event.blockNumber.toString(16)}`;
          const blockDetails = await getRpcClient({ client, chain: NETWORK })({
            method: "eth_getBlockByNumber",
            params: [blockNumberHex as `0x${string}`, false],
          });

          if (blockDetails && typeof blockDetails === "object" && "timestamp" in blockDetails) {
            let eventName: string = "";
            let blockNumber: string = "";
            let price: string | undefined = undefined;
            let marketplace: string | undefined = undefined;
            let from: string | undefined = undefined;
            let to: string | undefined = undefined;
            let tokenId: string = "";
            let listingId: string = "";
            let imageUrlNft: string = "";

            let transactionHash: string = "";

            

            const relatedSaleMimo = marketplaceEvents2?.find(sale =>
              sale.args?.collection?.toLowerCase() === nftContract.address.toLowerCase() &&
              sale.args?.tokenId?.toString() === event.args?.tokenId?.toString() &&
              sale.blockNumber?.toString() === event.blockNumber?.toString()
            );

            const relatedSale4 = marketplaceEvents6.find(sale => 
              sale.args?.assetContract.toLowerCase() === nftContractAddress.toLowerCase()
            );
            

             if (event.args?.from === "0x0000000000000000000000000000000000000000") {
              
              const listingInfo = await fetchNftMint(event.transactionHash, chainId);

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
            } else if (relatedSaleMimo) {
              eventName = "Sale";
              marketplace = marketplaceContract.address;
              const decimalsBigInt = BigInt(10 ** 18); // Convert decimals to BigInt safely
              const transformedPrice = (BigInt(relatedSaleMimo.args.price.toString()) / decimalsBigInt).toString(); // Perform division with BigInt
              price = `${transformedPrice} Iotex`;
             
            } else if (relatedSale4?.eventName === "NewSale") {
              eventName = "Sale";
              marketplace = marketplaceContract2.address;
              from = relatedSale4.args?.listingCreator;
              listingId = relatedSale4.args?.listingId.toString();
              to = relatedSale4.args?.buyer;
              const listingInfo = await findListingId(marketplaceContract2, relatedSale4.args?.listingId);

              if (listingInfo) {
                price = `${listingInfo.price} ${listingInfo.symbol}`;
              }
            } else if (event.eventName === "Transfer") {
              const listingInfo = await fetchNftSaleSale(event.transactionHash, chainId);

              if (listingInfo) {
                price = `${listingInfo.price}` || "";
                marketplace = listingInfo.marketplace || "";
                eventName = listingInfo.eventName || "";
              }
              from = event.args?.from;
              to = event.args?.to;
              blockNumber = event.blockNumber.toString();
              tokenId = event.args.tokenId.toString() || "";
              transactionHash = event.transactionHash;


              const imageUrl = await handleReadNft(nftContractAddress, event.args?.tokenId);

              if ( imageUrl && listingInfo?.eventName === "Sale" ) {
                const response = await fetch('http://localhost:3000/api/sendTelegramMessageSale', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    buyer: event.args.from,
                    seller: event.args.to,
                    price: `${listingInfo?.price} Iotex`,
                    collection: imageUrl?.name,
                    tokenId: event.args.tokenId.toString(),
                    marketplace: listingInfo?.marketplace,
                    imageUrl: imageUrl?.imageUrl, 
                  }),
                });
              
                const result = await response.json();
              }
              
            

            } else if (relatedSale4?.eventName === "NewBid") {
              eventName = relatedSale4.eventName;
              listingId = relatedSale4.args.auctionId.toString();
              from = relatedSale4.args?.bidder;
              to = "";
              blockNumber = relatedSale4.blockNumber.toString();
              tokenId = relatedSale4.args?.auction.tokenId.toString();
              transactionHash = relatedSale4.transactionHash;
              marketplace = "ioPlasma Marketplace";
              const listingInfo = await findAuctiomId2(marketplaceContract2, relatedSale4.args?.auction.auctionId, relatedSale4.args?.bidAmount);
              if (listingInfo) {
                price = `Bid ${listingInfo.bidAmount} ${listingInfo.symbol} New Price${listingInfo.price} ${listingInfo.symbol}`;
              }
              const blockNumberHex = `0x${relatedSale4.blockNumber.toString(16)}`;
            const blockDetails = await getRpcClient({ client, chain: NETWORK })({
              method: "eth_getBlockByNumber",
              params: [blockNumberHex as `0x${string}`, false],
            });   
            } else if (relatedSale4?.eventName === "AuctionClosed") {
              eventName = relatedSale4.eventName;
              from = relatedSale4.args?.auctionCreator;
              to = relatedSale4.args?.winningBidder;
              listingId = relatedSale4.args.auctionId.toString();
              blockNumber = relatedSale4.blockNumber.toString();
              tokenId = relatedSale4.args?.tokenId.toString();
              transactionHash = relatedSale4.transactionHash;
              marketplace = "ioPlasma Marketplace";
              const blockNumberHex = `0x${relatedSale4.blockNumber.toString(16)}`;
              const blockDetails = await getRpcClient({ client, chain: NETWORK })({
                method: "eth_getBlockByNumber",
                params: [blockNumberHex as `0x${string}`, false],
              });
        
             
              const listingInfo = await findAuctiomId(marketplaceContract2, relatedSale4.args.auctionId);
              if (listingInfo) {
                price = `${listingInfo.price} ${listingInfo.symbol}`;
              }
             
      
      
            } else if (relatedSale4?.eventName === "NewAuction") {
              eventName = relatedSale4.eventName;
              from = relatedSale4.args?.auction.auctionCreator;
              to = ""
              listingId = relatedSale4.args.auctionId.toString()
              blockNumber = relatedSale4.blockNumber.toString();
              tokenId = relatedSale4.args?.auction.tokenId.toString();
              transactionHash = relatedSale4.transactionHash;
              marketplace = "ioPlasma Marketplace";
              const listingInfo = await findAuctiomId2(marketplaceContract2, relatedSale4.args.auction.auctionId, relatedSale4.args.auction.buyoutBidAmount) ;
              const blockNumberHex = `0x${relatedSale4.blockNumber.toString(16)}`;
              const blockDetails = await getRpcClient({ client, chain: NETWORK })({
                method: "eth_getBlockByNumber",
                params: [blockNumberHex as `0x${string}`, false],
              });
        
              
              if (listingInfo) {
                price = `Buyout${listingInfo.bidAmount} ${listingInfo.symbol} Aucion starts from ${listingInfo.price} ${listingInfo.symbol}`;
              }
            } else if (relatedSale4?.eventName === "UpdatedListing") {
              eventName = relatedSale4.eventName;
              from = relatedSale4.args?.listing.listingCreator;
              to = ""
              listingId = relatedSale4.args?.listingId.toString();
              blockNumber = relatedSale4.blockNumber.toString();
              tokenId = relatedSale4.args?.listing.tokenId.toString();
              transactionHash = relatedSale4.transactionHash;
              marketplace = "ioPlasma Marketplace";
              const blockNumberHex = `0x${relatedSale4.blockNumber.toString(16)}`;
            const blockDetails = await getRpcClient({ client, chain: NETWORK })({
              method: "eth_getBlockByNumber",
              params: [blockNumberHex as `0x${string}`, false],
            });
      
            
              const listingInfo = await findListingId(marketplaceContract2, relatedSale4.args.listingId);
      
              if (listingInfo) {
                price = `${listingInfo.price} ${listingInfo.symbol}`;
              }
           
            } else if (relatedSale4?.eventName === "NewListing") {
              eventName = relatedSale4.eventName;
              from = relatedSale4.args?.listing.listingCreator;
              to = "";
              listingId = relatedSale4.args?.listingId.toString();
              blockNumber = relatedSale4.blockNumber.toString();
              tokenId = relatedSale4.args?.listing.tokenId.toString();
              transactionHash = relatedSale4.transactionHash;
              marketplace = "ioPlasma Marketplace";
              const blockNumberHex = `0x${relatedSale4.blockNumber.toString(16)}`;
            const blockDetails = await getRpcClient({ client, chain: NETWORK })({
              method: "eth_getBlockByNumber",
              params: [blockNumberHex as `0x${string}`, false],
            });
      
           
              const listingInfo = await findListingId(marketplaceContract2, relatedSale4.args.listingId);
              if (listingInfo) {
                price = `${listingInfo.price} ${listingInfo.symbol}`;
              }
               
            }

            const timestamp = blockDetails.timestamp;

            const eventDetail: EventDetails = {
              contractAddress: nftContract.address,
              from: from || event.args?.from || event.args?.owner || "",
              to: to || event.args?.to || "",
              tokenId: event.args?.tokenId?.toString() ?? "",
              listingId: listingId,
              chainId,
              blockNumber: event.blockNumber.toString() ?? "",
              transactionHash: event.transactionHash,
              eventName: eventName || event.eventName,
              price: price || "",
              marketplace: marketplace || "",
              timestamp: new Date(parseInt(timestamp, 16) * 1000).toISOString() || "",
            };

            return eventDetail;
          } else {
            throw new Error(`Failed to fetch block details for block ${event.blockNumber}`);
          }
        })
      );

      allFetchedEvents.push(...eventDetails);
    }

    // Move the current block forward
    currentBlock = toBlock + 1n;
  }

  // Combine all events and sort by timestamp
  allFetchedEvents.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  


  // Insert fetched events into the database in ascending order
  for (const event of allFetchedEvents) {
    await pool.query(`
      INSERT INTO "${tableName}" (
        contract_address, from_address, to_address, token_id, listing_id, chain_id, block_number, transaction_hash, event_name, price, marketplace, timestamp
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12 
      ) ON CONFLICT (block_number, transaction_hash, event_name, token_id) DO NOTHING
    `, [
      event.contractAddress,
      event.from,
      event.to,
      event.tokenId,
      event.listingId,

      event.chainId,
      event.blockNumber,
      event.transactionHash,
      event.eventName,
      event.price,
      event.marketplace,
      event.timestamp
    ]);
  }

  return allFetchedEvents;
}




async function fetchNftSaleSale(
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

    // Check if `transaction.value` exists and log it
    const value = transaction.value ? transaction.value.toString() : "undefined";

    // Determine the event name
    const eventName = transaction.value.toString() && transaction.value.toString() !== "0"
    ? "Sale"
    : "Transfer";

    // Determine the marketplace address
    const marketplace = transaction.value && transaction.value.toString() !== "0" 
    ? transaction.to 
    : ""; 

    // Define the transaction details to return
    const transactionDetails: TransactionDetails = {
      transactionHash: transactionHash,
      eventName: eventName,
      price: value !== "undefined" ? `${(Number(value) / 1e18).toString()} Iotex` : "",
      marketplace: marketplace || "",
    };

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

    // Ensure the listing contains expected fields
    if (!listing || !listing.currencyContractAddress || !listing.pricePerToken) {
      console.log("Listing data is incomplete:", listing);
      return null;
    }

    const { currencyContractAddress, pricePerToken } = listing;
    

    // Find the corresponding currency data
    const currency = CURRENCY_DATA.find(c => c.address.toLowerCase() === currencyContractAddress.toLowerCase());

    if (!currency) {
      console.log("Currency not found in CURRENCY_DATA.");
      return null;
    }

    // Check for decimal transformation using BigInt
    const decimalsBigInt = BigInt(10 ** currency.decimals); // Convert decimals to BigInt safely
    const transformedPrice = (BigInt(pricePerToken) / decimalsBigInt).toString(); // Perform division with BigInt

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





  
    