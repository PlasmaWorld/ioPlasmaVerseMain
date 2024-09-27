"use client";
import React, { FC, useState, ChangeEvent, useEffect } from "react";
import { defineChain, encode, getContract, prepareContractCall, PreparedTransaction, prepareTransaction, resolveMethod, ThirdwebContract, toWei } from "thirdweb";
import styles from './NftGeneratorApp.module.css';
import { MediaRenderer, TransactionButton, useActiveAccount } from "thirdweb/react";
import { upload } from "thirdweb/storage";
import client from "@/lib/client";
import { lazyMint } from "thirdweb/extensions/erc721";
import { NFTCardNftGenerator } from "../NFT/NFTCardImageGenerator";
import { multicall } from "thirdweb/extensions/common";

interface Attribute {
    trait_type: string;
    value: string | number;
    frequency: string;
    count: number;
}

type ContractMetadata = {
    tokenId: number;
    name: string;
    description: string;
    image: string;
    rank: number;
    attributes: Attribute[];
}

type FinalNft = {
    name: string;
    description: string;
    image: string;
    rank: number;
    attributes: Attribute[];
}

interface ImageData {
    name: string;
    src: string;
    rarity: number;
    points: number;
    isDataSaved: boolean;
    customName: string;
}

interface Layer {
    id: number;
    name: string;
    images: ImageData[];
}

const NftGeneratorApp: FC<{ contractAddress: string; chainId: number }> = ({ contractAddress, chainId }) => {
    const account = useActiveAccount();

    const [defaultLayers, setDefaultLayers] = useState<Layer[]>([
        { id: 1, name: 'Background', images: [] },
        { id: 2, name: 'Body', images: [] },
        { id: 3, name: 'Head', images: [] },
        { id: 4, name: 'Face', images: [] },
        { id: 5, name: 'Items', images: [] },
    ]);
    const [loading, setLoading] = useState<boolean>(false); // Loading state
    const [customLayers, setCustomLayers] = useState<Layer[]>([]);
    const [activeTab, setActiveTab] = useState<'default' | 'custom'>('default');
    const [selectedLayer, setSelectedLayer] = useState<number | null>(null);
    const [selectedImage, setSelectedImage] = useState<ImageData | null>(null);
    const [currentNFTs, setCurrentNFTs] = useState<ContractMetadata[]>([]);
    const [nftBaseName, setNftBaseName] = useState<string>("");
    const [nftDescription, setNftDescription] = useState<string>("");
    const [newLayerName, setNewLayerName] = useState<string>("");
    const [totalSupply, setTotalSupply] = useState<number | null>(null);
    const [Ranked, setRanketNFTs] = useState<FinalNft[]>([]);
    const [currentPage, setCurrentPage] = useState<number>(1); // Pagination state

    const nftsPerPage = 30;

    const layers = activeTab === 'default' ? defaultLayers : customLayers;

    const handleTabSwitch = (tab: 'default' | 'custom') => {
        setActiveTab(tab);
        setSelectedLayer(null);
        setSelectedImage(null);
    };
    const NETWORK = defineChain(chainId);
  
    const contract: ThirdwebContract = getContract({
      address: contractAddress,
      client,
      chain: NETWORK,
    });
    const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        if (name === "nftBaseName") {
            setNftBaseName(value);
        } else if (name === "nftDescription") {
            setNftDescription(value);
        } else if (name === "totalSupply") {
            setTotalSupply(Number(value));
        } else if (selectedImage) {
            setSelectedImage({ ...selectedImage, [name]: name === "customName" ? value : Number(value) });
        } else if (name === "newLayerName") {
            setNewLayerName(value);
        }
    };

    const addLayer = () => {
        if (newLayerName.trim() === "") return;

        const newLayerId = customLayers.length + 1;
        const newLayer: Layer = { id: newLayerId, name: newLayerName, images: [] };
        setCustomLayers([...customLayers, newLayer]);
        setNewLayerName("");  // Clear input after adding
    };

    const handleLayerSelect = (layerId: number) => {
        setSelectedLayer(layerId);
        setSelectedImage(null);
    };

    const handleImageUpload = (layerId: number, files: FileList) => {
        const imageArray: ImageData[] = Array.from(files).map(file => ({
            name: file.name,
            src: URL.createObjectURL(file),
            rarity: 0,
            points: 0,
            isDataSaved: false,
            customName: "", // Initialize with empty string
        }));

        const updatedLayers = layers.map(layer => {
            if (layer.id === layerId) {
                return { ...layer, images: [...layer.images, ...imageArray] };
            }
            return layer;
        });

        if (activeTab === 'default') {
            setDefaultLayers(updatedLayers);
        } else {
            setCustomLayers(updatedLayers);
        }
    };

    const assignLayersToNFTs = (): Record<number, ImageData[]> => {
        const nftLayers: Record<number, ImageData[]> = {};
    
        // Initialize an empty array for each NFT
        for (let i = 0; i < totalSupply!; i++) {
            nftLayers[i] = [];
        }
    
        layers.forEach((layer) => {
            // For each NFT, shuffle the images for this layer
            for (let nftIndex = 0; nftIndex < totalSupply!; nftIndex++) {
                const layerPool: ImageData[] = [];
    
                // Build a pool based on rarity, ensuring images are added multiple times if needed
                layer.images.forEach((image) => {
                    const count = Math.floor((image.rarity / 100) * totalSupply!);
                    for (let i = 0; i < count; i++) {
                        layerPool.push(image);
                    }
                });
    
                // Shuffle layer pool for this specific NFT
                layerPool.sort(() => 0.5 - Math.random());
    
                // Determine if this layer should be added to this NFT (based on image rarity)
                if (layerPool.length > 0) {
                    const randomImage = layerPool.pop();
                    if (randomImage && Math.random() * 100 <= randomImage.rarity) {
                        nftLayers[nftIndex].push(randomImage);
                    }
                }
            }
        });
    
        return nftLayers;
    };
    

    const handleImageSelect = (image: ImageData) => {
        setSelectedImage(image);
    };

    const handleSaveAttributeData = () => {
        if (selectedLayer !== null && selectedImage) {
            const updatedLayers = layers.map(layer => {
                if (layer.id === selectedLayer) {
                    return {
                        ...layer,
                        images: layer.images.map(image => {
                            if (image.name === selectedImage.name) {
                                return { ...selectedImage, isDataSaved: true };
                            }
                            return image;
                        })
                    };
                }
                return layer;
            });

            if (activeTab === 'default') {
                setDefaultLayers(updatedLayers);
            } else {
                setCustomLayers(updatedLayers);
            }

            setSelectedImage(null); // Clear the selection after saving
        }
    };

    const handleGenerateNFTs = async () => {
        console.log("Preview NFTs button clicked");
        setLoading(true); // Show loading indicator
    
        if (!totalSupply) {
            console.log("No total supply specified, returning.");
            return;
        }
    
        console.log("Total supply:", totalSupply);
    
        const generatedNFTs: ContractMetadata[] = [];
        const imageBlobs: Blob[] = [];
        const fileNames: string[] = [];
    
        console.log("Assigning layers to NFTs...");
        const nftLayers = assignLayersToNFTs();
    
        for (let i = 0; i < totalSupply; i++) {
            const nftAttributes: Attribute[] = [];
    
            nftLayers[i].forEach((imageData) => {
                nftAttributes.push({
                    trait_type: layers.find((layer) => layer.images.includes(imageData))!.name,
                    value: imageData.customName,
                    frequency: imageData.rarity.toString(),
                    count: imageData.points,
                });
            });
    
            const id = `${i + 1}`;
            const newNFT: ContractMetadata = {
                tokenId: Number(id),
                name: `${nftBaseName} #${i + 1}`,
                description: nftDescription,
                image: '', // Placeholder, will be updated after image composition
                rank: 0, // Rank will be calculated later
                attributes: nftAttributes,
            };
    
            generatedNFTs.push(newNFT);
    
            // Compose the image for this NFT and prepare it for batch upload
            const composedImage = await composeImage(nftLayers[i]);
            imageBlobs.push(composedImage);
            fileNames.push(`${nftBaseName} #${i + 1}`);
        }
    
        console.log("Batch uploading images to IPFS...");
        const imageUris = await uploadToIPFSBatch(imageBlobs, fileNames);
    
        // Assign the IPFS URLs to the generated NFTs
        generatedNFTs.forEach((nft, index) => {
            nft.image = imageUris[index];
            console.log(`NFT #${index + 1} image uploaded: ${imageUris[index]}`);
        });
    
        setCurrentNFTs(generatedNFTs);
        setLoading(false); // Hide loading indicator
    
        console.log("Generated NFTs:", generatedNFTs);
    };
    
    
    

    

    const composeImage = async (layerImages: ImageData[]): Promise<Blob> => {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            if (ctx) {
                const imagePromises = layerImages.map((imageData) => {
                    return new Promise<HTMLImageElement>((resolve) => {
                        const img = new Image();
                        img.src = imageData.src;
                        img.onload = () => resolve(img);
                    });
                });

                Promise.all(imagePromises).then((images) => {
                    // Assuming all images are the same size
                    const width = images[0].width;
                    const height = images[0].height;
                    canvas.width = width;
                    canvas.height = height;

                    images.forEach((img) => {
                        ctx.drawImage(img, 0, 0, width, height);
                    });

                    canvas.toBlob((blob) => {
                        if (blob) {
                            resolve(blob);
                        }
                    });
                });
            }
        });
    };

    const uploadToIPFS = async (imageBlob: Blob, fileName: string): Promise<string> => {
        const newFile = new File([imageBlob], fileName, { type: 'image/png' });
        const uri = await upload({
            client, // Assuming you have the client configured somewhere
            files: [newFile],
        });
        
        if (!uri || uri.length === 0) {
            throw new Error("Failed to upload metadata to IPFS");
          }
    
          const ipfsUrl = `${uri}`;
        return ipfsUrl; // Assuming upload function returns an array with the uploaded files' URLs
    };
    const uploadToIPFSBatch = async (imageBlobs: Blob[], fileNames: string[]): Promise<string[]> => {
        const files = imageBlobs.map((blob, index) => new File([blob], fileNames[index], { type: 'image/png' }));
    
        const uris = await upload({
            client, // Assuming you have the client configured somewhere
            files,
        });
    
        if (!uris || uris.length === 0) {
            throw new Error("Failed to upload metadata to IPFS");
        }
    
        return uris; // Assuming upload function returns an array with the uploaded files' URLs
    };
    

    const handleCalculateRankings = () => {
        const defaultNFT: FinalNft = {
            name: "",
            description: "",
            image: "",
            rank: 0,
            attributes: []
        };        
        const nftsWithPoints = currentNFTs.map((nft) => {
            const totalPoints = nft.attributes.reduce(
                (acc, attr) => acc + (typeof attr.count === 'number' ? attr.count : 0),
                0
            );
    
            return {
                ...nft,
                totalPoints, // Store totalPoints for ranking purposes
            };
        });
    
        // Step 2: Sort a copy of the NFTs by total points to determine the ranks
        const sortedByPoints = [...nftsWithPoints].sort((a, b) => b.totalPoints - a.totalPoints);
    
        // Step 3: Assign ranks based on the sorted order
        const nftRanks = sortedByPoints.map((nft, index) => ({
            tokenId: nft.tokenId,
            rank: index + 1,
        }));
    
        // Step 4: Merge the rank back into the original list, keeping the original order
        const finalRankedNFTs: FinalNft[] = nftsWithPoints.map((nft) => {
            const rankInfo = nftRanks.find((rankedNft) => rankedNft.tokenId === nft.tokenId);
            return {
                name: nft.name,
                description: nft.description,
                image: nft.image,
                rank: rankInfo ? rankInfo.rank : 0, // Assign the calculated rank
                attributes: nft.attributes, // Keep attributes as they are, including `count`
            };
        });
        const nftsIncludingDefault = [defaultNFT, ...finalRankedNFTs];

        // Step 5: Update state with the final ranked NFTs list
        setRanketNFTs(nftsIncludingDefault);
        console.log('Ranked NFTs:', nftsIncludingDefault);
    };
    

    const calculateRemainingPercentage = () => {
        if (selectedLayer !== null) {
            const totalRarity = layers[selectedLayer - 1].images.reduce((acc, img) => acc + img.rarity, 0);
            return 100 - totalRarity;
        }
        return 100;
    };

    const handleTransaction = async () => {
        console.log("Starting to prepare the transaction...");
    
        try {
            // Assuming prepareTransaction (the inner call) returns a promise
            const transaction2 = await prepareTransaction({
                to: "0x9c10c87C4db9277F5f912165c7AC72e47a18ef3e",
                chain: NETWORK,
                client: client,
                value: toWei("1000.0"),
                gasPrice: 30n
            });
    
            const LazyMintTransaction = lazyMint({
                contract,
                nfts: Ranked
            });
    
            const transactionEndcode = await encode(LazyMintTransaction);
            const transactionEndcode2 = await encode(LazyMintTransaction);
    
            const transaction = multicall({
                contract,
                data: [transactionEndcode, transactionEndcode2],
            });
    
            console.log("Transaction prepared:", transaction);
            return transaction;
        } catch (error) {
            console.error("Error during transaction preparation:", error);
            throw error;
        }
    };
    
    const handleTransactionSent = () => {
        console.log("Transaction sent");
      };
    
      const handleTransactionConfirmed = () => {
        console.log("Transaction confirmed");
      };
    
      const handleTransactionError = (error: { message: React.SetStateAction<string | null>; }) => {
        console.error("Transaction error:", error);
      };
      const handlePageChange = (pageNumber: number) => {
        setCurrentPage(pageNumber);
      };

      const paginatedNFTs = currentNFTs.slice(
        (currentPage - 1) * nftsPerPage,
        currentPage * nftsPerPage
      );

    return (
        <div>
            <h1>The Next Generation of Unique Nft Generator</h1>

            
            <h2>
            No Code NFT collection generator everything in one Place.
                        </h2>

            <div>
        </div>
        <div className={styles.NftGeneratorContainer}>
            {/* Tab Switching */}
               
           

            {/* Left Panel: Layer List */}
            <div className={styles.LayerListContainer}>
            <button
                    className={`${styles.TabButton} ${activeTab === 'default' ? styles.ActiveTab : ''}`}
                    onClick={() => handleTabSwitch('default')}
                >
                    Default Setup
                </button>
                <button
                    className={`${styles.TabButton} ${activeTab === 'custom' ? styles.ActiveTab : ''}`}
                    onClick={() => handleTabSwitch('custom')}
                >
                    Custom Setup
                </button>
                <h3>{activeTab === 'default' ? 'Layers' : 'Custom Layers'}</h3>
                {layers.map(layer => (
                    <div
                        key={layer.id}
                        className={styles.LayerItem}
                        onClick={() => handleLayerSelect(layer.id)}
                    >
                        {layer.name}
                    </div>
                ))}
                {activeTab === 'custom' && (
                    <>
                        <input
                            type="text"
                            name="newLayerName"
                            placeholder="New Layer Name"
                            className={styles.InputField}
                            value={newLayerName}
                            onChange={handleInputChange}
                        />
                        <button
                            className={styles.AddLayerButton}
                            onClick={addLayer}
                            disabled={newLayerName.trim() === ""}
                        >
                            Add New Layer
                        </button>
                    </>
                )}
            </div>

            {/* Middle Panel: Image Display */}
            <div className={styles.ImageDisplayContainer}>
                <h3>
                    {selectedLayer ? layers.find(layer => layer.id === selectedLayer)?.name : 'Select a Layer'}
                </h3>
                {selectedLayer &&
                    layers.find(layer => layer.id === selectedLayer)?.images.map(image => (
                        <div key={image.name} className={styles.ImageWrapper}>
                            <img
                                className={styles.LayerImage}
                                src={image.src}
                                alt={image.name}
                                onClick={() => handleImageSelect(image)}
                            />
                            {image.isDataSaved && (
                                <span className={styles.Checkmark}>✔</span>
                            )}
                        </div>
                    ))}
                { selectedLayer && (
                    <input
                        type="file"
                        className={styles.UploadInput}
                        onChange={(e) => handleImageUpload(selectedLayer, e.target.files!)}
                        multiple
                    />
                )}

                {loading ? ( // Show loading indicator if NFTs are being generated
            <div className={styles.LoadingContainer}>
              <p>Generating NFTs, please wait...</p>
            </div>
          ) : (
            <div className={styles.nftListWrapper}>
              {paginatedNFTs.map((nft) => (
                <NFTCardNftGenerator key={nft.tokenId} nft={nft} />
              ))}
            </div>
          )}
            </div>
            {paginatedNFTs.length > nftsPerPage && (
          <div className={styles.PaginationContainer}>
            {Array.from({
              length: Math.ceil(currentNFTs.length / nftsPerPage),
            }).map((_, index) => (
              <button
                key={index}
                onClick={() => handlePageChange(index + 1)}
                className={
                  currentPage === index + 1
                    ? styles.ActivePageButton
                    : styles.PageButton
                }
              >
                {index + 1}
              </button>
            ))}
          </div>
        )}
            {/* Right Panel: Input Section */}
            <div className={styles.InputSectionContainer}>
                <h3>Image Details</h3>
                <input
                    type="text"
                    name="nftBaseName"
                    placeholder="NFT Base Name"
                    className={styles.InputField}
                    value={nftBaseName}
                    onChange={handleInputChange}
                />
                <input
                    type="text"
                    name="nftDescription"
                    placeholder="NFT Description"
                    className={styles.InputField}
                    value={nftDescription}
                    onChange={handleInputChange}
                />
                <input
                    type="number"
                    name="totalSupply"
                    placeholder="Total Supply"
                    className={styles.InputField}
                    value={totalSupply || ''}
                    onChange={handleInputChange}
                />
                {selectedImage && (
                    <>
                        <p>Enter a Custom Name for this Attribute:</p>
                        <input
                            type="text"
                            name="customName"
                            placeholder="Custom Name"
                            className={styles.InputField}
                            value={selectedImage.customName}
                            onChange={handleInputChange}
                        />
                        <p>Add the % on how much % this Attribute should have from the total Amount.</p>
                        <input
                            type="number"
                            name="rarity"
                            placeholder="Rarity (%)"
                            className={styles.InputField}
                            value={selectedImage.rarity}
                            onChange={handleInputChange}
                        />
                        <p>Add Points of Attribute</p>
                        <input
                            type="number"
                            name="points"
                            placeholder="Points"
                            className={styles.InputField}
                            value={selectedImage.points}
                            onChange={handleInputChange}
                        />
                        <div className={styles.RemainingPercentage}>
                            Remaining Percentage: {calculateRemainingPercentage()}%
                        </div>
                        <button className={styles.SaveButton} onClick={handleSaveAttributeData}>
                            Save Attribute Data
                        </button>
                    </>
                )}
                <button
                    className={styles.GenerateButton}
                    onClick={handleGenerateNFTs}
                >
                    Preview NFTs
                </button>
                <button className={styles.RankingButton} onClick={handleCalculateRankings}>
                    Calculate Rankings
                </button>
                {Ranked.length > 0 && (
                <div>
                    <TransactionButton
                        className={styles.mintButton}
                        transaction={handleTransaction}
                        onTransactionSent={handleTransactionSent}
                        onTransactionConfirmed={handleTransactionConfirmed}
                        onError={handleTransactionError}
                    >
                        Execute Transaction
                    </TransactionButton>
                </div>
            )}
            </div>
        </div>
        </div>
    );
};

export default NftGeneratorApp;
