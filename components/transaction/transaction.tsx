import React, { useEffect, useState } from "react";
import client from "@/lib/client";
import {
  Address,
  defineChain,
  eth_getTransactionByHash,
  eth_getTransactionReceipt,
  getContract,
  getContractEvents,
  getRpcClient,
  parseEventLogs,
  prepareEvent,
  ThirdwebContract,
} from "thirdweb";
import styles from './modal.module.css'; // Import CSS module
import { getWinningBid, getAuction, getListing, newBidEvent } from "thirdweb/extensions/marketplace";
import { isERC1155 } from "thirdweb/extensions/erc1155";

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

interface TransactionDetails {
  status: string;
  transactionHash: string;
  interactedWith?: string;
  chainId: number;
  eventName: string;
  from: string;
  to: string;
  timestamp: string;
  blockHeight: string;
  TokenTransfer: string;
  price?: string;
  gasFee?: string;
  gasLimit?: string;
  maxFeePerGas?: string;
  maxFeePerBlobGas?: string;
  nonce: number;
  type: string;
  input: any;
  logs?: any;
  r: string;
  s: string;
  yParity?: string;
}

interface NftMintModalProps {
  transactionHash: string;
  chainId: number;
  contractAddress: string;
  tokenId: string;
  listingId: string;
  eventName: string;
  from: string;
  to: string;
  marketplace: string;
  timestamp: string;
  price: string;
  isOpen: boolean;
  onClose: () => void;
}

type ListingData = {
  symbol: string;
  price: string;
  tokenId: string;
  startTimestamp: string;
  endTimestamp: string;
  status: string;
};

type AuctionData = {
    bidAmount?: string;
    tokenId: string;
    startTimestamp: string;
    endTimestamp: string;
    minimumBidAmount: string;
    timeBufferInSeconds:string;
    buyoutBidAmount: string;
    bidBufferBps: string;
    currency: string;
};

const TransactionModal: React.FC<NftMintModalProps> = ({
  transactionHash,
  chainId,
  eventName,
  marketplace,
  from,
  tokenId,
  listingId,
  contractAddress,
  to,
  timestamp,
  price,
  isOpen,
  onClose
}) => {
  const [transactionDetails, setTransactionDetails] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  

  const NETWORK = defineChain(chainId);

  const marketplaceContract2 = getContract({
    address: marketplace, // Placeholder marketplace address
    client: client,
    chain: NETWORK,
  });
 

  

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = (`0${date.getMonth() + 1}`).slice(-2);
    const day = (`0${date.getDate()}`).slice(-2);
    const hours = (`0${date.getHours()}`).slice(-2);
    const minutes = (`0${date.getMinutes()}`).slice(-2);
    const seconds = (`0${date.getSeconds()}`).slice(-2);

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };


  

  
  

      


  useEffect(() => {
    const fetchNftMint = async () => {
      try {
        
        
        const formattedHash = transactionHash.startsWith("0x")
          ? transactionHash
          : `0x${transactionHash}`;
        console.log("Formatted Hash:", formattedHash);

        const transaction = await eth_getTransactionByHash(
          getRpcClient({ client, chain: NETWORK }),
          { hash: formattedHash as `0x${string}` }
        );
        console.log("Transaction:", transaction);

        const receipt = await eth_getTransactionReceipt(
          getRpcClient({ client, chain: NETWORK }),
          { hash: formattedHash as `0x${string}` }
        );
          
       
         console.log("Receipt:", receipt);
            
         if (receipt.logs.length > 0) {
          const log = receipt.logs[0];
         

          
        }
       
        let auctionData;
        let listing
      try {
        auctionData = await getAuction({
          contract: marketplaceContract2,
          auctionId: BigInt(listingId), // Ensure listingId is being passed correctly as BigInt
        });
       
        console.log("Auction data:", auctionData);
      } catch (error) {
        console.error("Error fetching auction data:", error);
        auctionData = undefined; // Or set some default value if needed
      }
      try {
        listing = await getListing({
          contract: marketplaceContract2,
          listingId: BigInt(listingId), // Ensure listingId is being passed correctly as BigInt
        });
        console.log("Auction data:", auctionData);
      } catch (error) {
        console.error("Error fetching auction data:", error);
        auctionData = undefined; // Or set some default value if needed
      }
              

       
        const transactionInputs = receipt?.logs?.length > 0 && receipt.logs[0]?.topics 
        ? (() => {
          switch (eventName) {
            case 'Approval':
              return [
                {
                  function: "approve(address to, uint256 tokenId)",
                  inputs: {
                    to: receipt.logs[0]?.topics[2] ? `0x${receipt.logs[0].topics[2].slice(26)}` : "N/A",
                    tokenId: receipt.logs[0]?.topics[3] ? parseInt(receipt.logs[0].topics[3], 16).toString() : "0"
                  }
                }
              ];
            case 'NewListing':
              return [
                {
                  function: "function createListing((address assetContract, uint256 tokenId, uint256 quantity, address currency, uint256 pricePerToken, uint128 startTimestamp, uint128 endTimestamp, bool reserved) _params) returns (uint256 listingId)",
                  inputs: {
                    assetContract: contractAddress,
                    tokenId: tokenId,
                    quantity: 1,
                    currency: listing?.currencyContractAddress,
                    pricePerToken: price,
                    startTimestamp: new Date(Number(auctionData?.startTimeInSeconds) * 1000).toLocaleString(),
                    endTimestamp: new Date(Number(auctionData?.endTimeInSeconds) * 1000).toLocaleString(),
                    reserved: "false"
                  },
                  return: {
                    listingId: listingId
                  }
                }
              ];
            case 'Transfer':
              return [
                {
                  function: "transfer(address from, address to, uint256 tokenId)",
                  inputs: {
                    from: receipt.logs[0]?.topics[1] ? `0x${receipt.logs[0].topics[1].slice(26)}` : "N/A",
                    to: receipt.logs[0]?.topics[2] ? `0x${receipt.logs[0].topics[2].slice(26)}` : "N/A",
                    tokenId: receipt.logs[0]?.topics[3] ? parseInt(receipt.logs[0].topics[3], 16).toString() : "0"
                  }
                }
              ];
            case 'Mint':
              return [
                {
                  function: "mint(address to, uint256 tokenId)",
                  inputs: {
                    to: receipt.logs[0]?.topics[2] ? `0x${receipt.logs[0].topics[2].slice(26)}` : "N/A",
                    tokenId: receipt.logs[0]?.topics[3] ? parseInt(receipt.logs[0].topics[3], 16).toString() : "0"
                  }
                }
              ];
            case 'Sale':
              return [
                {
                  function: "transfer(address from, address to, uint256 tokenId)",
                  inputs: {
                    from: from,
                    to: to,
                    tokenId: receipt.logs[0]?.topics[3] ? parseInt(receipt.logs[0].topics[3], 16).toString() : "0"
                  }
                }
              ];
            case 'NewBid':
                return [
                  {
                    function: "function bidInAuction(uint256 _auctionId, uint256 _bidAmount) payable",
                    inputs: {
                      auctionId: listingId,  // This is coming from your external source
                      bidAmount: price,
                    }
                  }
                ];
              
            default:
              return []; // Handle other events or return empty
          }
        })() : [];
      
        
        const transactionLogs  = receipt?.logs?.length > 0 && receipt.logs[0]?.topics
        ? (() => {
          switch (eventName) {
            case 'Approval':
              return [
                {
                  name: 'Approval',
                  events: [
                    {
                      name: "owner",
                      type: "address",
                      value: receipt.logs[0]?.topics[1] ? `0x${receipt.logs[0].topics[1].slice(26)}` : "N/A"
                    },
                    {
                      name: "approved",
                      type: "address",
                      value: receipt.logs[0]?.topics[2] ? `0x${receipt.logs[0].topics[2].slice(26)}` : "N/A"
                    },
                    {
                      name: "tokenId",
                      type: "uint256",
                      value: receipt.logs[0]?.topics[3] ? parseInt(receipt.logs[0].topics[3], 16).toString() : "0"
                    }
                  ]
                }
              ];
              case 'NewListing':
               return [
                {
                  name: 'NewListing',
                  events: [
                    {
                      name: "listingCreator",
                      type: "address",
                      value: receipt.logs[0]?.topics[1] ? `0x${receipt.logs[0].topics[1].slice(26)}` : "N/A"
                    },
                    {
                      name: "listingId",
                      type: "uint256",
                      value: listingId
                    },
                    {
                      name: "assetContract",
                      type: "address",
                      value: contractAddress
                    }
                  ],
                  data: {
                    listingId: listingId,
                    tokenId: tokenId,
                    quantity: 1,
                    pricePerToken: price,
                    startTimestamp: new Date(Number(listing?.startTimeInSeconds) * 1000).toLocaleString(),
                    endTimestamp: new Date(Number(listing?.endTimeInSeconds) * 1000).toLocaleString(),
                    listingCreator: receipt.logs[0]?.topics[1] ? `0x${receipt.logs[0].topics[1].slice(26)}` : "N/A",
                    assetContract: contractAddress,
                    currency: listing?.currencyContractAddress,
                    tokenType: "ERC721",
                    status: listing?.status,
                    reserved:  "false"
                  }
                }
              ];
              
            case 'Transfer':
              return [
                {
                  name: 'Transfer',
                  events: [
                    {
                      name: "from",
                      type: "address",
                      value: receipt.logs[0]?.topics[1] ? `0x${receipt.logs[0].topics[1].slice(26)}` : "N/A"
                    },
                    {
                      name: "to",
                      type: "address",
                      value: receipt.logs[0]?.topics[2] ? `0x${receipt.logs[0].topics[2].slice(26)}` : "N/A"
                    },
                    {
                      name: "tokenId",
                      type: "uint256",
                      value: receipt.logs[0]?.topics[3] ? parseInt(receipt.logs[0].topics[3], 16).toString() : "0"
                    }
                  ]
                }
              ];
              case 'Mint':
              return [
                {
                  name: 'Transfer',
                  events: [
                    {
                      name: "from",
                      type: "address",
                      value: receipt.logs[0]?.topics[1] ? `0x${receipt.logs[0].topics[1].slice(26)}` : "N/A"
                    },
                    {
                      name: "to",
                      type: "address",
                      value: receipt.logs[0]?.topics[2] ? `0x${receipt.logs[0].topics[2].slice(26)}` : "N/A"
                    },
                    {
                      name: "tokenId",
                      type: "uint256",
                      value: receipt.logs[0]?.topics[3] ? parseInt(receipt.logs[0].topics[3], 16).toString() : "0"
                    }
                  ]
                }
              ];
              case 'Sale':
              return [
                {
                  name: 'Sale',
                  events: [
                    {
                      name: "interacted with Marketplace",
                      type: "address",
                      value: receipt.logs[0]?.topics[1] ? `0x${receipt.logs[0].topics[1].slice(26)}` : "N/A"
                    }
                  ]
                }
              ];
              case 'NewBid':
                const currency = CURRENCY_DATA.find(c => c.address.toLowerCase() === auctionData?.currencyContractAddress.toLowerCase());
                console.log("Currency data found:", currency);
            
                if (!currency) {
                  console.log("Currency not found in CURRENCY_DATA.");
                  return null;
                }
            
                // Check for decimal transformation using BigInt
                const decimalsBigInt = BigInt(10 ** currency.decimals); // Convert decimals to BigInt safely
                const minimumBidAmountBigInt = BigInt(auctionData?.minimumBidAmount ?? "0");
                const buyoutBidAmountBigInt = BigInt(auctionData?.buyoutBidAmount ?? "0");
                const transformedPrice = (minimumBidAmountBigInt / decimalsBigInt).toString();
                const transformedBuyoutBidAmount = (buyoutBidAmountBigInt / decimalsBigInt).toString();
                return [

                {
                    name: 'NewBid',
                    events: [
                      {
                        name: "auctionId",
                        type: "uint256",
                        value: listingId
                      },
                      {
                        name: "bidder",
                        type: "address",
                        value: receipt.logs[0]?.topics[2] ? `0x${receipt.logs[0].topics[2].slice(26)}` : "N/A"
                      },
                      {
                        name: "assetContract",
                        type: "address",
                        value: contractAddress
                      },
                      {
                        name: "bidAmount",
                        type: "uint256",
                        value: receipt.logs[0]?.topics[3] ? parseInt(receipt.logs[0].topics[3], 16).toString() : "0"
                      }
                    ],
                    data: {
                      auctionId: listingId,
                      tokenId: tokenId,
                      quantity: 1,
                      minimumBidAmount: transformedPrice,
                      buyoutBidAmount: transformedBuyoutBidAmount,
                      bidAmount: price,
                      bidBufferBps: auctionData?.bidBufferBps.toString(),
                      timeBufferInSeconds: auctionData?.timeBufferInSeconds.toString(),
  
                      startTimestamp: new Date(Number(auctionData?.startTimeInSeconds) * 1000).toLocaleString(),
                      endTimestamp: new Date(Number(auctionData?.endTimeInSeconds) * 1000).toLocaleString(),
                      listingCreator: receipt.logs[0]?.topics[1] ? `0x${receipt.logs[0].topics[1].slice(26)}` : "N/A",
                      assetContract: contractAddress,
                      currency: auctionData?.currencyContractAddress,
                      tokenType: "ERC721",
                      reserved:  "false"
                    }
                  }
                ];
              
            default:
              return []; // Handle other events or return empty
          }
        })() : [];

        const interactedWith = receipt?.logs?.length > 0 && receipt.logs[0]?.topics
        ? (() => {
      switch (eventName) {
        case 'Approval':
          return contractAddress; // Removed unreachable code

        case 'Transfer':
          return receipt.logs[0]?.topics[1] ? `0x${receipt.logs[0].topics[1].slice(26)}` : "N/A";
        
        case 'Mint':
          return contractAddress; 
        case 'Sale':
          return marketplace;
          case 'NewListing':
            // Assuming you need to return something for Mint; if not, you may want to remove this case or handle it
            return marketplace;
            case 'NewBid':
          return marketplace;
        default:
          return []; // Handle other events or return empty
      }
    })()
  : []; 
  
        const eventNameFromValue = transaction.value && transaction.value > 0 ? "Sale" : "Transfer";

        const transactionDetails = {
          status: "Success",
          transactionHash: transactionHash,
          eventName: eventNameFromValue,
          blockHeight: transaction?.blockNumber?.toString() || '',
          timestamp:timestamp ? formatDate(timestamp) : "-",
          from: transaction.from,
          interactedWith: interactedWith,
          to: transaction.to || to,
          price: transaction.value
            ? (Number(transaction.value) / 1e18).toString()
            : undefined,
          type: "Execution",
          gasFee: (Number(transaction.gasPrice) * Number(transaction.gas) / 1e18).toFixed(6) + " IOTX", // Convert gas fee to IOTX
          gasLimit: Number(transaction.gas).toLocaleString(), // Format gas limit with commas
          gasPrice: (Number(transaction.gasPrice) / 1e6).toLocaleString(undefined, { minimumFractionDigits: 6 }) + " Qev" ,          
          maxFeePerGas: transaction.maxFeePerGas?.toString(),
          maxFeePerBlobGas: transaction.maxFeePerBlobGas?.toString(),
          nonce: transaction.nonce,
          chainId: chainId,
          TokenTransfer: `from "${from}" to "${to}"`,
          input: transactionInputs ,
          logs: transactionLogs,
          r: transaction.r,
          s: transaction.s,
          yParity: transaction.yParity?.toString(),
        };

        setTransactionDetails(transactionDetails);
      } catch (error) {
        console.error("Error fetching transaction details:", error);
        setTransactionDetails(null);
      } finally {
        setLoading(false);
      }
    };

    fetchNftMint();
  }, [transactionHash, chainId, eventName, from, to, timestamp]);

  if (!isOpen) return null;

  if (loading) {
    return (
      <div className={styles['modal-overlay']}>
        <div className={styles['modal-content']}>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!transactionDetails) {
    return (
      <div className={styles['modal-overlay']}>
        <div className={styles['modal-content']}>
          <p>No transaction details available.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles['modal-overlay']} onClick={onClose}>
      <div className={styles['modal-content']} onClick={e => e.stopPropagation()}>
        <button className={styles['modalClose']} onClick={onClose}>&times;</button>
        <h2 className={styles['modal-title']}>Transaction Details</h2>
  
        <div className={styles['transaction-section']}>
          <div className={styles['row']}><strong>Transaction Hash:</strong> <span className={styles['value']}>{transactionHash}</span></div>
          <div className={styles['row']}><strong>Status:</strong> <span className={styles['value']}>{transactionDetails.status}</span></div>
          <div className={styles['row']}><strong>Block Height:</strong> <span className={styles['value']}>{transactionDetails.blockHeight}</span></div>
          <div className={styles['row']}><strong>Timestamp:</strong> <span className={styles['value']}>{timestamp}</span></div>
          <div className={styles['row']}><strong>From:</strong> <span className={styles['value']}>{from}</span></div>
          <div className={styles['row']}><strong>Interacted With:</strong> <span className={styles['value']}>{transactionDetails.interactedWith}</span></div>
          <div className={styles['row']}><strong>To:</strong> <span className={styles['value']}>{to}</span></div>
          <div className={styles['row']}><strong>Price:</strong> <span className={styles['value']}>{price}</span></div>
          <div className={styles['row']}><strong>Gas Fee:</strong> <span className={styles['value']}>{transactionDetails.gasFee}</span></div>
          <div className={styles['row']}><strong>Gas Limit:</strong> <span className={styles['value']}>{transactionDetails.gasLimit}</span></div>
          <div className={styles['row']}><strong>Gas Price:</strong> <span className={styles['value']}>{transactionDetails.gasPrice}</span></div>
          <div className={styles['row']}><strong>Nonce:</strong> <span className={styles['value']}>{transactionDetails.nonce}</span></div>
          <div className={styles['row']}><strong>ChainId:</strong> <span className={styles['value']}>{chainId}</span></div>
          {transactionDetails.tokenTransfer && (
            <div className={styles['row']}><strong>Token Transfer:</strong> <span className={styles['value']}>{transactionDetails.tokenTransfer}</span></div>
          )}
        </div>
  
        <div className={styles['input-section']}>
          <h3>Input Data</h3>
          {transactionDetails.input.map((item: any, index: number) => (
            <div key={index} className={styles['input-item']}>
              <div className={styles['row']}><strong>Function:</strong> <span className={styles['value']}>{item.function}</span></div>
              {Object.keys(item.inputs).map((key: string) => (
                <div className={styles['row']} key={key}><strong>{key}:</strong> <span className={styles['value']}>{item.inputs[key]}</span></div>
              ))}
            </div>
          ))}
        </div>
  
        <div className={styles['logs-section']}>
          <h3>Logs</h3>
          {transactionDetails.logs && transactionDetails.logs.length > 0 ? (
            <div>
              {transactionDetails.logs.map((log: any, index: number) => (
                <div key={index} className={styles['log-item']}>
                  <h4>{log.name}</h4>
                  {log.events && log.events.length > 0 && (
                    <div className={styles['log-events']}>
                      <h5>Events:</h5>
                      {log.events.map((event: any, i: number) => (
                        <div className={styles['row']} key={i}><strong>{event.name}:</strong> <span className={styles['value']}>{event.value}</span></div>
                      ))}
                    </div>
                  )}
                  {log.data && (
                    <div className={styles['log-data']}>
                      <h5>Data:</h5>
                      {Object.keys(log.data).map((key, i) => (
                        <div className={styles['row']} key={i}><strong>{key}:</strong> <span className={styles['value']}>{log.data[key]}</span></div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p>No logs available.</p>
          )}
        </div>
  
        <button className={styles['modalCloseButton']} onClick={onClose}>Close</button>
      </div>
    </div>
  );  
};

export default TransactionModal;