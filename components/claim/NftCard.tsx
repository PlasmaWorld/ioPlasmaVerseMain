"use client";
import React, { FC, useEffect, useState } from "react";
import { MediaRenderer, TransactionButton, useActiveAccount, useReadContract } from "thirdweb/react";
import client from "@/lib/client";
import Skeleton from "@/components/Skeleton";
import { ADDRESS_ZERO, defineChain, getContract, NFT as NFTType, ThirdwebContract } from "thirdweb";
import { useSwipeable } from "react-swipeable";
import Container from "../Container/Container";
import { getContractMetadata } from "thirdweb/extensions/common";
import { claimTo, getActiveClaimCondition, nextTokenIdToMint, getNFT } from "thirdweb/extensions/erc1155";
import { ioUSDCondract, Merchendise } from "@/const/contracts";
import { Button, Select, TextInput } from "@mantine/core";
import toast from "react-hot-toast";
import { BigNumber } from "ethers";
import { useBasket } from "@/Hooks/BusketProvider";
import { getContractInstance } from "@/const/cotractInstance";
import { NftInformationPrice } from "../Merchandise/NftPrice";

type ClaimCondition = {
  pricePerToken: BigNumber;
  supplyClaimed: BigNumber;
  maxClaimableSupply: BigNumber;
  startTimestamp: BigNumber;
  quantityLimitPerWallet: BigNumber;
  merkleRoot: string;
  currency: string;
};

type INFTCardProps = {
  tokenId: bigint;
  image: string;
  contractAddress: string;
  chainId: number;
};

export const NFTCardErc1155Claim: FC<INFTCardProps> = ({ tokenId, image, contractAddress, chainId }) => {
  const account = useActiveAccount();
  const { addProductToBasket } = useBasket();
  const [showInfo, setShowInfo] = useState(false);
  const [quantity, setQuantity] = useState<number>(1);
  const [size, setSize] = useState<string>('');
  const [customerDetails] = useState({ name: '', email: '', street: '', postcode: '', city: '', country: '' });
  const [currentNFT, setNFT] = useState<NFTType | null>(null);
  const [previewInvoice, setPreviewInvoice] = useState(false);
  const [claimCondition2, setClaimCondition] = useState<ClaimCondition | null>(null);


  const chain = defineChain(chainId);

  const contract: ThirdwebContract = getContract({
    address: contractAddress,
    client,
    chain: chain,
  });
  const handleSizeChange = (value: string | null) => {
    setSize(value || '');
  };

  const [ownerAddress, setOwnerAddress] = useState<string | null>(null);
  const handlers = useSwipeable({
    onSwipedLeft: () => setShowInfo(false),
    trackMouse: true,
  });

  const { data: contractMetadata } = useReadContract(getContractMetadata, {
    contract: contract
  });

  const { data: totalNFTSupply } = useReadContract(nextTokenIdToMint, {
    contract: contract
  });
  const { data: claimCondition } = useReadContract(getActiveClaimCondition, {
    contract: contract,
    tokenId: tokenId,
  });

  const getPrice = (quantity: number): number => {
    const total = quantity * parseInt(claimCondition?.pricePerToken.toString() || "0");
    return parseFloat(total.toString());
  }

  const claimedSupply = () => {
    return parseInt(claimCondition?.supplyClaimed.toString() || "0");
  }

  const maxClaimableSupply = () => {
    return parseInt(claimCondition?.maxClaimableSupply.toString() || "0");
  }

  const startTime = () => {
    const timestamp = parseInt(claimCondition?.startTimestamp.toString() || "0");
    return new Date(timestamp * 1000).toLocaleString(); // Convert to milliseconds and format as local date and time
  }

  useEffect(() => {
    const fetchNFTAndClaimCondition = async () => {
      try {
        const contract = getContractInstance(contractAddress);

        const nft = await getNFT({
          contract: contract,
          tokenId: tokenId,
        });

        setNFT(nft);
        setOwnerAddress(nft.owner);

        const condition = await getActiveClaimCondition({ contract, tokenId });
        const transformedCondition: ClaimCondition = {
          pricePerToken: BigNumber.from(condition.pricePerToken),
          supplyClaimed: BigNumber.from(condition.supplyClaimed),
          maxClaimableSupply: BigNumber.from(condition.maxClaimableSupply),
          startTimestamp: BigNumber.from(condition.startTimestamp),
          quantityLimitPerWallet: BigNumber.from(condition.quantityLimitPerWallet),
          merkleRoot: condition.merkleRoot,
          currency: condition.currency,
        };
        setClaimCondition(transformedCondition);

      } catch (error) {
        console.error("Error fetching NFT or claim condition:", error);
      }
    };

    fetchNFTAndClaimCondition();
  }, [tokenId]);

  const addToBasket = () => {
    if (currentNFT && currentNFT.metadata.name && currentNFT.metadata.image && claimCondition) {
      const allowlistProof = {
        proof: claimCondition.merkleRoot ? [claimCondition.merkleRoot] : [],
        quantityLimitPerWallet: claimCondition.quantityLimitPerWallet.toString(),
        pricePerToken: claimCondition.pricePerToken.toString(),
        currency: claimCondition.currency,
      };

      const data = "0x"; // Example data, replace with actual data if necessary

      const product = {
        tokenId: tokenId,
        product: currentNFT.metadata.name,
        price: getPrice(quantity),
        size: size,
        quantity: quantity,
        image: currentNFT.metadata.image,
        allowlistProof: allowlistProof ,
        data: data
      };
      addProductToBasket(product);
      toast.success("Product added to basket!");
    } else {
      toast.error("Product or image is undefined");
    }
  };

 

  return (
    <div className="relative flex flex-col items-center p-4 bg-opacity-10 bg-white rounded-lg shadow-md transition duration-300 ease-in-out hover:bg-opacity-20 h-[450px] w-[300px] m-2 cursor-pointer" onClick={() => setShowInfo(true)} role="button" aria-label="Show more info">
      {account && ownerAddress === account.address && (
        <div className="absolute top-1 right-1">
          <button className="w-10 h-10 p-2 rounded-full bg-blue-500 text-white flex items-center justify-center">
            {/* Add icon or text here */}
          </button>
        </div>
      )}

      {currentNFT ? (
        <>
          <MediaRenderer src={image} client={client} className="w-full h-52 object-cover rounded-md" />
          <p className="text-white text-lg font-semibold mt-2">Name #{currentNFT.metadata.name}</p>

          <div className="flex w-full mt-4 p-2 bg-opacity-20 bg-gray-800 rounded-md justify-between items-center">
            <NftInformationPrice
              price={getPrice(quantity)}
            />
          </div>

          {showInfo && (
            <Container maxWidth="md">
              <div {...handlers} className="fixed inset-0 bg-gray-900 bg-opacity-75 flex justify-center items-start pt-20 overflow-auto z-50 sm:items-center mt-14">
                <div className="container max-w-3xl mx-auto p-9 rounded-lg shadow-lg mb-20 bg-[#181818] max-h-[80vh] overflow-y-auto">
                  <p></p>
                  
                  <div className="mt-4">
                    {currentNFT?.metadata ? (
                      <MediaRenderer src={image} client={client} className="w-full h-64 object-cover rounded-md" />
                    ) : (
                      <p className="text-white">NFT metadata not available.</p>
                    )}
                  </div>
                  <div className="mt-4 text-white">
                    <p className="text-2xl font-bold">You&apos;re about to claim the following item from the Contract.</p>
                    <p className="mt-2">This sale Starts at: {startTime()}</p>
                    <p className="mt-2">Items claimed: {claimedSupply()} </p>
                  </div>
                  <div className="mt-4">
                  </div>
                  <TextInput
                    label="Quantity"
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.currentTarget.value))}
                    required
                  />
                  { account && (
            <TransactionButton
            transaction={() => claimTo({
              contract: contract,
              to: account?.address,
              tokenId,
              quantity: BigInt(quantity),
            })}
            onTransactionConfirmed={async () => {
              alert("NFT Claimed!");
              setQuantity(1);
            }}
          >
            {`Claim NFT (${getPrice(quantity)} IoTeX)`}
          </TransactionButton>                
            )}
                </div>
              </div>
            </Container>
          )}
        </>
      ) : (
        <Skeleton />
      )}
    </div>
  );
};
