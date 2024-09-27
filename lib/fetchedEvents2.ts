import { getContract, prepareEvent, getContractEvents, defineChain, eth_blockNumber, getRpcClient, ThirdwebContract, Address, eth_getTransactionByHash, readContract } from "thirdweb";
import client from '@/lib/client';
import { pool } from "./db";
import { ownerOf, tokenURI } from "thirdweb/extensions/erc721";
import { getAuction, getListing ,getWinningBid} from "thirdweb/extensions/marketplace";
import { FaSalesforce } from "react-icons/fa";
import axios from "axios";
import { getContractMetadata, name } from 'thirdweb/extensions/common';
import { NETWORK } from "@/const/contracts";

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
  { symbol: 'Iotex', decimals: 18, address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE' }, // Native
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
async function handleReadNft(nftContractAddress: string, tokenId: bigint): Promise<{ name: string; imageUrl: string } | null> {
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

  console.log(`Finding first minted token, starting from block: ${startBlock.toString()}`);

  while (startBlock >= 0n) {
    try {
      await ownerOf({ contract: nftContract, tokenId });
      console.log(`Found first minted token ID: ${tokenId}`);
      return tokenId;
    } catch {
      tokenId += BigInt(1);
    }

    startBlock -= blockBatchSize;
  }

  console.log("No minted tokens found.");
  return null;
}
async function findAuctiomId(marketplaceContract2: ThirdwebContract, listingId: bigint): Promise<{ symbol: string, price: string, tokenId: string } | null> {
  try {
    // Fetch the listing information
    const listing = await getWinningBid({ contract: marketplaceContract2, auctionId: listingId });
    const listing2 = await getAuction({ contract: marketplaceContract2, auctionId: listingId });

    // Ensure the listing contains expected fields
    if (!listing || !listing.currencyAddress || !listing.currencyValue) {
      console.log("Listing data is incomplete.");
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
      console.log("Listing data is incomplete.");
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






async function fetchIoPlasmaContract(
  marketplaceContract2: ThirdwebContract,
  tableName: string,
  startBlock: bigint,
  latestBlockNumber: bigint,
  NETWORK: any,
  nftContractAddress: string,
  chainId: number,
) {
  let currentBlock = startBlock;
  const allFetchedEvents: EventDetails[] = [];
  const blockBatchSize = 30000n;
  const telegramApiUrl = 'http://localhost:3000/app/api/sendTelegramMessageListing'; // Adjust this URL if needed

  while (currentBlock <= latestBlockNumber) {
    const toBlock = currentBlock + blockBatchSize > latestBlockNumber ? latestBlockNumber : currentBlock + blockBatchSize;
    console.log(`Fetching events from block ${currentBlock.toString()} to ${toBlock.toString()}`);

   
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

    

    const marketplaceEvents4 = await getContractEvents({
      contract: marketplaceContract2,
      fromBlock: currentBlock,
      toBlock: toBlock,
      events: [preparedEvent5],
    });
    
    const marketplaceEvents = await getContractEvents({
      contract: marketplaceContract2,
      fromBlock: currentBlock,
      toBlock: toBlock,
      events: [preparedEvent1],
    });
    

    const marketplaceEventsIoPlasma = await getContractEvents({
      contract: marketplaceContract2,
      fromBlock: currentBlock,
      toBlock: toBlock,
      events: [preparedEvent2],
    });

    const marketplaceEvents2 = await getContractEvents({
      contract: marketplaceContract2,
      fromBlock: currentBlock,
      toBlock: toBlock,
      events: [preparedEvent3],
    });

    const marketplaceEvents3 = await getContractEvents({
      contract: marketplaceContract2,
      fromBlock: currentBlock,
      toBlock: toBlock,
      events: [preparedEvent4],
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

      const relatedSale = marketplaceEvents.find(sale => 
        sale.args?.listing.assetContract.toLowerCase() === nftContractAddress.toLowerCase()
      );
      const relatedSale2 = marketplaceEvents2.find(sale => 
        sale.args?.auction.assetContract.toLowerCase() === nftContractAddress.toLowerCase()
      );
      const relatedSale3 = marketplaceEvents3.find(sale => 
        sale.args?.assetContract.toLowerCase() === nftContractAddress.toLowerCase()
      );
      const relatedSale4 = marketplaceEvents4.find(sale => 
        sale.args?.assetContract.toLowerCase() === nftContractAddress.toLowerCase()
      );

      // Check if this transfer matches a marketplace sale
      const relatedSaleIoPlasma = marketplaceEventsIoPlasma.find(sale =>
        sale.args?.listing.assetContract.toLowerCase() === nftContractAddress 
       
      );

      if (relatedSale4) {
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
   


      } else if (relatedSale3) {
        eventName = relatedSale3.eventName;
        from = relatedSale3.args?.auctionCreator;
        to = relatedSale3.args?.winningBidder;
        listingId = relatedSale3.args.auctionId.toString();
        blockNumber = relatedSale3.blockNumber.toString();
        tokenId = relatedSale3.args?.tokenId.toString();
        transactionHash = relatedSale3.transactionHash;
        marketplace = "ioPlasma Marketplace";
        const blockNumberHex = `0x${relatedSale3.blockNumber.toString(16)}`;
        const blockDetails = await getRpcClient({ client, chain: NETWORK })({
          method: "eth_getBlockByNumber",
          params: [blockNumberHex as `0x${string}`, false],
        });
  
        timestamp = blockDetails?.timestamp
        ? new Date(parseInt(blockDetails.timestamp, 16) * 1000).toISOString()
        : '';
        const listingInfo = await findAuctiomId(marketplaceContract2, relatedSale3.args.auctionId);
        if (listingInfo) {
          price = `${listingInfo.price} ${listingInfo.symbol}`;
        }
       


      } else if (relatedSale2) {
        eventName = relatedSale2.eventName;
        from = relatedSale2.args?.auction.auctionCreator;
        to = ""
        listingId = relatedSale2.args.auctionId.toString()
        blockNumber = relatedSale2.blockNumber.toString();
        tokenId = relatedSale2.args?.auction.tokenId.toString();
        transactionHash = relatedSale2.transactionHash;
        marketplace = "ioPlasma Marketplace";
        const listingInfo = await findAuctiomId2(marketplaceContract2, relatedSale2.args.auction.auctionId, relatedSale2.args.auction.buyoutBidAmount) ;
        const blockNumberHex = `0x${relatedSale2.blockNumber.toString(16)}`;
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
      } else if (relatedSaleIoPlasma) {
        eventName = relatedSaleIoPlasma.eventName;
        from = relatedSaleIoPlasma.args?.listing.listingCreator;
        to = ""
        listingId = relatedSaleIoPlasma.args?.listingId.toString();
        blockNumber = relatedSaleIoPlasma.blockNumber.toString();
        tokenId = relatedSaleIoPlasma.args?.listing.tokenId.toString();
        transactionHash = relatedSaleIoPlasma.transactionHash;
        marketplace = "ioPlasma Marketplace";
        const blockNumberHex = `0x${relatedSaleIoPlasma.blockNumber.toString(16)}`;
      const blockDetails = await getRpcClient({ client, chain: NETWORK })({
        method: "eth_getBlockByNumber",
        params: [blockNumberHex as `0x${string}`, false],
      });
      
      timestamp = blockDetails?.timestamp
      ? new Date(parseInt(blockDetails.timestamp, 16) * 1000).toISOString()
      : '';
        const listingInfo = await findListingId(marketplaceContract2, relatedSaleIoPlasma.args.listingId);

        if (listingInfo) {
          price = `${listingInfo.price} ${listingInfo.symbol}`;
        }
      } else if (relatedSale) {
        eventName = relatedSale.eventName;
        from = relatedSale.args?.listing.listingCreator;
        to = "";
        listingId = relatedSale.args?.listingId.toString();
        blockNumber = relatedSale.blockNumber.toString();
        tokenId = relatedSale.args?.listing.tokenId.toString();
        transactionHash = relatedSale.transactionHash;
        marketplace = "ioPlasma Marketplace";
        const blockNumberHex = `0x${relatedSale.blockNumber.toString(16)}`;
      const blockDetails = await getRpcClient({ client, chain: NETWORK })({
        method: "eth_getBlockByNumber",
        params: [blockNumberHex as `0x${string}`, false],
      });

      timestamp = blockDetails?.timestamp
      ? new Date(parseInt(blockDetails.timestamp, 16) * 1000).toISOString()
      : '';
        const listingInfo = await findListingId(marketplaceContract2, relatedSale.args.listingId);
        if (listingInfo) {
          price = `${listingInfo.price} ${listingInfo.symbol}`;
        }

        const imageUrl = await handleReadNft(nftContractAddress, relatedSale.args?.listing.tokenId);

              
        if (listingInfo && imageUrl) {
          const response = await fetch('http://localhost:3000/api/sendTelegramMessageListing', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              seller: relatedSale.args.listingCreator,
              price: `${listingInfo?.price} ${listingInfo?.symbol}`,
              collection: imageUrl?.name,
              tokenId: relatedSale.args.listing.tokenId.toString(),
              marketplace: "ioPlasma Marketplace",
              imageUrl: imageUrl?.imageUrl, // Replace with the actual image URL
            }),
          });
        
          const result = await response.json();
          console.log('Response from server:', result); // Log the server response
        }
     
      }


      const eventDetail: EventDetails = {
        contractAddress: nftContractAddress,
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
      currentBlock = toBlock + 1n;

    }

    // Move the current block forward
  
    
    const filteredAndSortedEvents = allFetchedEvents
    .filter(event => event.contractAddress.toLocaleLowerCase() === nftContractAddress.toLowerCase())
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());  allFetchedEvents.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  console.log(`Inserting ${filteredAndSortedEvents.length} events into the database.`);

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


async function fetchMimoMarketplace(
  marketplaceContract2: ThirdwebContract,
  tableName: string,
  startBlock: bigint,
  latestBlockNumber: bigint,
  NETWORK: any,
  nftContractAddress: string,
  chainId: number,
) {
  let currentBlock = startBlock;
  const allFetchedEvents: EventDetails[] = [];
  const blockBatchSize = 10000n;

  while (currentBlock <= latestBlockNumber) {
    const toBlock = currentBlock + blockBatchSize > latestBlockNumber ? latestBlockNumber : currentBlock + blockBatchSize;
    console.log(`Fetching events from block ${currentBlock.toString()} to ${toBlock.toString()}`);

   
    

    

    const preparedEvent3 = prepareEvent({
      signature: "event TakerBid(bytes32 orderHash, uint256 orderNonce, address indexed taker, address indexed maker, address indexed strategy, address currency, address collection, uint256 tokenId, uint256 amount, uint256 price)"
    });
    


    const preparedEvent2 = prepareEvent({
      signature: "event TakerAsk(bytes32 orderHash, uint256 orderNonce, address indexed taker, address indexed maker, address indexed strategy, address currency, address collection, uint256 tokenId, uint256 amount, uint256 price)"
    });

    const marketplaceEvents2 = await getContractEvents({
      contract: marketplaceContract2,
      fromBlock: currentBlock,
      toBlock: toBlock,
      events: [preparedEvent2],
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

     
      const relatedSale2 = marketplaceEvents2.find(sale => 
        sale.args?.collection.toLowerCase() === nftContractAddress.toLowerCase()
      );
      
      // Check if this transfer matches a marketplace sale
      

       if (relatedSale2) {
        eventName = "Sale";
        from = relatedSale2.args?.maker;
        to = relatedSale2.args?.taker;
        blockNumber = relatedSale2.blockNumber.toString();
        tokenId = relatedSale2.args?.tokenId.toString();
        transactionHash = relatedSale2.transactionHash;
        marketplace = "0x7499e71FF8a472D1d82Aa2e68e868B5B92896B0E";
        const blockNumberHex = `0x${relatedSale2.blockNumber.toString(16)}`;
      const blockDetails = await getRpcClient({ client, chain: NETWORK })({
        method: "eth_getBlockByNumber",
        params: [blockNumberHex as `0x${string}`, false],
      });


      timestamp = blockDetails?.timestamp
      ? new Date(parseInt(blockDetails.timestamp, 16) * 1000).toISOString()
      : '';
      const decimalsBigInt = BigInt(10 ** 18); // Convert decimals to BigInt safely
      const transformedPrice = (BigInt(relatedSale2.args.price.toString()) / decimalsBigInt).toString(); // Perform division with BigInt
      price = `${transformedPrice} Iotex`;
      
        
      } 

      const eventDetail: EventDetails = {
        contractAddress: nftContractAddress,
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
      currentBlock = toBlock + 1n;

    }

    // Move the current block forward
  
    
    const filteredAndSortedEvents = allFetchedEvents
    .filter(event => event.contractAddress.toLocaleLowerCase() === nftContractAddress.toLowerCase())
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());  allFetchedEvents.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  console.log(`Inserting ${filteredAndSortedEvents.length} events into the database.`);

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



async function fetchEventsWhenTableExists(
  nftContract: ThirdwebContract,
  marketplaceContract2: ThirdwebContract,
  marketplaceContract: ThirdwebContract,

  tableName: string,
  startBlock: bigint,
  latestBlockNumber: bigint,
  NETWORK: any,
  nftContractAddress: string,
  chainId: number,
) {
  let currentBlock = startBlock;
  const allFetchedEvents: EventDetails[] = [];
  const blockBatchSize = 30000n;
  const telegramApiUrl = '/api/sendTelegramMessageSale'; // Adjust this URL if needed

 

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
    
    const marketplaceEventIoPlasma2 = prepareEvent({
      signature: "event NewSale(address indexed listingCreator, uint256 indexed listingId, address indexed assetContract, uint256 tokenId, address buyer, uint256 quantityBought, uint256 totalPricePaid)"
    });

    const marketplaceEventsIoPlasma = await getContractEvents({
      contract: marketplaceContract2,
      fromBlock: currentBlock,
      toBlock: toBlock,
      events: [marketplaceEventIoPlasma2],
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

            const relatedSaleIoPlasma = marketplaceEventsIoPlasma?.find(sale =>
              sale.args?.assetContract?.toLowerCase() === nftContract.address.toLowerCase() &&
              sale.args?.tokenId?.toString() === event.args?.tokenId?.toString() &&
              sale.blockNumber?.toString() === event.blockNumber?.toString()
            );

            const relatedSaleMimo = marketplaceEvents2?.find(sale =>
              sale.args?.collection?.toLowerCase() === nftContract.address.toLowerCase() &&
              sale.args?.tokenId?.toString() === event.args?.tokenId?.toString() &&
              sale.blockNumber?.toString() === event.blockNumber?.toString()
            );

           

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
            } else if (relatedSaleMimo) {
              eventName = "Sale";
              marketplace = marketplaceContract.address;
              const decimalsBigInt = BigInt(10 ** 18); // Convert decimals to BigInt safely
              const transformedPrice = (BigInt(relatedSaleMimo.args.price.toString()) / decimalsBigInt).toString(); // Perform division with BigInt
              price = `${transformedPrice} Iotex`;
              const imageUrl = await handleReadNft(nftContractAddress, relatedSaleMimo.args?.tokenId);

              

              if ( imageUrl) {
                const response = await fetch('http://localhost:3000/api/sendTelegramMessageSale', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    buyer: relatedSaleMimo.args.taker,
                  seller: relatedSaleMimo.args.maker,
                  price: `${transformedPrice} Iotex`,
                  collection: imageUrl?.name,
                  tokenId: event.args.tokenId.toString(),
                  marketplace: "Mimo Marketpace",
                  imageUrl: imageUrl?.imageUrl, 
                  }),
                });
              
                const result = await response.json();
                console.log('Response from server:', result); // Log the server response
              }
            } else if (relatedSaleIoPlasma) {
              eventName = "Sale";
              marketplace = marketplaceContract2.address;
              from = relatedSaleIoPlasma.args?.listingCreator;
              listingId = relatedSaleIoPlasma.args?.listingId.toString();
              to = relatedSaleIoPlasma.args?.buyer;
              const listingInfo = await findListingId(marketplaceContract2, relatedSaleIoPlasma.args?.listingId);

              if (listingInfo) {
                price = `${listingInfo.price} ${listingInfo.symbol}`;
              }

              const imageUrl = await handleReadNft(nftContractAddress, relatedSaleIoPlasma.args?.tokenId);

              if ( imageUrl && listingInfo) {
                const response = await fetch('http://localhost:3000/api/sendTelegramMessageSale', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    buyer: relatedSaleIoPlasma.args.buyer,
                    seller: relatedSaleIoPlasma.args.listingCreator,
                    price: `${listingInfo?.price} ${listingInfo?.symbol}`,
                    collection: imageUrl?.name,
                    tokenId: event.args.tokenId.toString(),
                    marketplace: "ioPlasmaVerse Marketplace",
                    imageUrl: imageUrl?.imageUrl, 
                  }),
                });
              
                const result = await response.json();
                console.log('Response from server:', result); // Log the server response
              }
              


            
            } else if (event.eventName === "Transfer") {
              const listingInfo = await fetchNftSaleSale(event.transactionHash, chainId);
              console.log("Fetched listing info for Transfer event:", listingInfo);

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
                console.log('Response from server:', result); // Log the server response
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
  const listingEvents = await fetchIoPlasmaContract(
    marketplaceContract2,
    tableName,
    startBlock,
    latestBlockNumber,
    NETWORK,
    nftContractAddress,
    chainId,
    
  );

  console.log(`Inserting ${allFetchedEvents.length} events into the database.`);

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
  
  console.log(`Successfully fetched and inserted events for contract ${listingEvents} on chain ${chainId}.`);

  return allFetchedEvents;
}


async function fetchEventsWhenTableDoesNotExist(
  nftContract: ThirdwebContract,
  marketplaceContract2: ThirdwebContract,
  marketplaceContract: ThirdwebContract,

  tableName: string,
  latestBlockNumber: bigint,
  NETWORK: any,
  nftContractAddress: string,
  chainId: number
) {
  const blockBatchSize = 15000n; // Reduced block size for more precision
  const firstMintedTokenId = await findFirstMintedTokenId(nftContract, latestBlockNumber, blockBatchSize);

  if (firstMintedTokenId === null) {
    throw new Error("First minted token ID could not be found.");
  }

  console.log(`First minted token ID is: ${firstMintedTokenId}`);

  let currentBlock = latestBlockNumber;
  const allFetchedEvents: EventDetails[] = [];
  let hasFoundFirstMint = false; // Flag to stop fetching after finding the first mint

  // Fetch events starting from the latest block
  while (currentBlock >= 0n && !hasFoundFirstMint) {
    const toBlock = currentBlock - blockBatchSize < 0n ? 0n : currentBlock - blockBatchSize;
    console.log(`Fetching events from block ${toBlock.toString()} to ${currentBlock.toString()}`);

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

  const preparedEventMimo = prepareEvent({
    signature: "event TakerAsk(bytes32 orderHash, uint256 orderNonce, address indexed taker, address indexed maker, address indexed strategy, address currency, address collection, uint256 tokenId, uint256 amount, uint256 price)"
  });

  const preparedEventMimo2 = prepareEvent({
    signature: "event TakerBid(bytes32 orderHash, uint256 orderNonce, address indexed taker, address indexed maker, address indexed strategy, address currency, address collection, uint256 tokenId, uint256 amount, uint256 price)"
  });

  const marketplaceEvents2 = await getContractEvents({
    contract: marketplaceContract,
    fromBlock: toBlock,
    toBlock: currentBlock,
    events: [preparedEventMimo,preparedEventMimo2],
  });
  


    const nftTransferEvents = await getContractEvents({
      contract: nftContract,
      fromBlock: toBlock,
      toBlock: currentBlock,
      events: eventsData,
    });

    const marketplaceEventIoPlasma2 = prepareEvent({
      signature: "event NewSale(address indexed listingCreator, uint256 indexed listingId, address indexed assetContract, uint256 tokenId, address buyer, uint256 quantityBought, uint256 totalPricePaid)"
    });

    const marketplaceEventsIoPlasma = await getContractEvents({
      contract: marketplaceContract2,
      fromBlock: toBlock,
      toBlock: currentBlock,
      events: [marketplaceEventIoPlasma2],
    });

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

            let transactionHash: string = "";

            const relatedSaleIoPlasma = marketplaceEventsIoPlasma?.find(sale =>
              sale.args?.assetContract?.toLowerCase() === nftContract.address.toLowerCase() &&
              sale.args?.tokenId?.toString() === event.args?.tokenId?.toString() &&
              sale.blockNumber?.toString() === event.blockNumber?.toString()
            );

            const relatedSaleMimo = marketplaceEvents2?.find(sale =>
              sale.args?.collection?.toLowerCase() === nftContract.address.toLowerCase() &&
              sale.args?.tokenId?.toString() === event.args?.tokenId?.toString() &&
              sale.blockNumber?.toString() === event.blockNumber?.toString()
            );

           

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
              if (event.args?.tokenId.toString() === firstMintedTokenId.toString()) {
                hasFoundFirstMint = true;  // Stop fetching further events
              }

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
            

            } else if (relatedSaleIoPlasma) {
              eventName = "Sale";
              marketplace = marketplaceContract2.address;
              from = relatedSaleIoPlasma.args?.listingCreator;
              listingId = relatedSaleIoPlasma.args?.listingId.toString();
              to = relatedSaleIoPlasma.args?.buyer;
              const listingInfo = await findListingId(marketplaceContract2, relatedSaleIoPlasma.args?.listingId);
              console.log("Fetched listing info for Sale event:", listingInfo);

              if (listingInfo) {
                price = `${listingInfo.price} ${listingInfo.symbol}`;
              }
            
            } else if (event.eventName === "Transfer") {
              const listingInfo = await fetchNftSaleSale(event.transactionHash, chainId);
              console.log("Fetched listing info for Transfer event:", listingInfo);

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

    // Move the current block backwards
    currentBlock = toBlock - 1n;
  }

  const filteredEvents = allFetchedEvents
  .filter(event => 
    event.marketplace.toLowerCase() !== "0xD088619251877e7fA5b661e0d3AbD6b82FeA4D14".toLowerCase()
  )
  .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  const listingEvents = await fetchIoPlasmaContract(
    marketplaceContract2,
    tableName,
    30000000n,
    latestBlockNumber,
    NETWORK,
    nftContractAddress,
    chainId,
    
  );
  
  
  const batchSize = 200; // Adjust this size based on your performance testing
  let batchStart = 0;
  while (batchStart < filteredEvents.length) {
    // Create a batch slice
    const batchEvents = filteredEvents.slice(batchStart, batchStart + batchSize);

    // Construct values for bulk insert
    const values = batchEvents.map(event => `(
      '${event.contractAddress}',
      '${event.from}',
      '${event.to}',
      '${event.tokenId}',
      '${event.listingId}',
      '${event.chainId}',
      '${event.blockNumber}',
      '${event.transactionHash}',
      '${event.eventName}',
      '${event.price}',
      '${event.marketplace}',
      '${event.timestamp}'
    )`).join(",\n");

    // Bulk insert query
    const query = `
      INSERT INTO "${tableName}" (
        contract_address, from_address, to_address, token_id, listing_id, chain_id, block_number, transaction_hash, event_name, price, marketplace, timestamp
      ) VALUES
      ${values}
      ON CONFLICT (block_number, transaction_hash, event_name, token_id) DO NOTHING;
    `;

    // Execute bulk insert
    await pool.query(query);

    // Move to the next batch
    batchStart += batchSize;
  }

  console.log(`Successfully fetched and inserted events for contract ${nftContractAddress} on chain ${chainId}.`);

  return filteredEvents;
}

export async function fetchEvents(chainId: number, contractAddress:  string) {
  const nftContractAddress = contractAddress.toLowerCase();
  const NETWORK = defineChain(chainId);
  const tableName = `api_route_contract_events_${chainId}_${sanitizeTableName(nftContractAddress)}`;

  try {

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

    const rpcClient = getRpcClient({ client, chain: NETWORK });

    // Get the latest block number from the chain
    const latestBlockNumber = await eth_blockNumber(rpcClient);
    console.log(`Latest block number: ${latestBlockNumber.toString()}`);

    // Check if the table exists
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
      
      if (rows.length === 0) {
        // Table exists but is empty, fetch events from the latest block
        console.log(`Table exists but is empty. Fetching events from latest block: ${latestBlockNumber.toString()}`);
        return fetchEventsWhenTableDoesNotExist(nftContract, marketplaceContract2,marketplaceContract, tableName, latestBlockNumber, NETWORK, nftContractAddress, chainId);
      } else {
        // Table exists and has data, fetch events forward from the latest stored block to the latest block number
        const startBlock = BigInt(rows[0].block_number) + 1n;
        console.log(`Table exists. Starting from block: ${startBlock.toString()}`);
        return fetchEventsWhenTableExists(nftContract, marketplaceContract2,marketplaceContract, tableName, startBlock, latestBlockNumber, NETWORK, nftContractAddress, chainId);
      }
    } else {
      // Table does not exist, create table and fetch events backward from the latest block
      await createTableIfNotExists(tableName);
      console.log(`Table created. Fetching events from latest block: ${latestBlockNumber.toString()}`);
      return fetchEventsWhenTableDoesNotExist(nftContract, marketplaceContract2,marketplaceContract, tableName, latestBlockNumber, NETWORK, nftContractAddress, chainId);
    }
  } catch (error) {
    console.error("Error fetching events:", error);
    throw error;
  }
}
