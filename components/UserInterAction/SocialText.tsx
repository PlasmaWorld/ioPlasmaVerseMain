import React, { useState, useRef, useEffect } from 'react';
import styles from "./Social.module.css";
import { mintTo } from "thirdweb/extensions/erc721";
import { upload } from "thirdweb/storage";
import { TransactionButton, useActiveAccount } from 'thirdweb/react';
import { AppMint, socialChatContract } from '@/const/contracts';
import client from '@/lib/client';
import Image from 'next/image';
import { useUser } from '@/Hooks/UserInteraction';

const SocialPostCreator = () => {
  const [mediaPreview, setMediaPreview] = useState({ url: "", type: "" });
  const [nftDescription, setNftDescription] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { userExists: ExistUser } = useUser();
  const activeAccount = useActiveAccount();
  const [signerAddress, setSignerAddress] = useState("");
  useEffect(() => {
    if (ExistUser === false) {
    }
  }, [ExistUser]);
  
  useEffect(() => {
    if (activeAccount && activeAccount.address) {
      setSignerAddress(activeAccount.address);
    } else {
      setSignerAddress("");  
    }
  }, [activeAccount]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files ? event.target.files[0] : null;
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      const fileType = file.type.startsWith('video/') ? 'video' : 'image';
      setMediaPreview({ url: previewUrl, type: fileType });
      setSelectedFile(file); // Store the file for later use
      console.log("File selected for upload:", file.name); // Debug log
    }
  };

  useEffect(() => {
    return () => {
      if (mediaPreview.url) {
        URL.revokeObjectURL(mediaPreview.url);
      }
    };
  }, [mediaPreview.url]);

  return (
    <div className={styles.socialPostCreator}>
      {mediaPreview.type === 'image' && <img src={mediaPreview.url} alt="Preview" />}
      {mediaPreview.type === 'video' && <video src={mediaPreview.url} controls />}
      <label htmlFor="file-upload" className={styles.fileInputLabel}>
        Choose Image/Video
        <input id="file-upload" type="file" accept="image/*,video/*" ref={fileInputRef} onChange={handleChange} className={styles.fileInput} />
      </label>
      <textarea placeholder="Enter NFT Description" value={nftDescription} onChange={(e) => setNftDescription(e.target.value)} />
      
                <TransactionButton
                transaction={async () => {
                  if (!selectedFile) {
                    console.error("No file selected. Please select a file to upload.");
                    throw new Error("No file selected. Please select a file to upload.");
                  }
        
                  try {
                    const file = selectedFile;
                    const imageBlob = await file.arrayBuffer().then(buffer => new Blob([buffer], { type: file.type }));
        
                    const newFile = new File([imageBlob], "image.png", { type: file.type });
                    const imageUri = await upload({
                        client: client,
                        files: [newFile],
                    });
                    
                    if (imageUri.length === 0) {
                      throw new Error("Failed to upload metadata to IPFS");
                    }
        
                    return mintTo({
                      contract: socialChatContract,
                      to: signerAddress,
                      nft: {
                        name: new Date().getTime().toString(),
                        description: nftDescription,
                        image: imageUri,
                      },
                    });
                  } catch (error) {
                    console.error("Error during transaction:", error);
                    throw error;
                  }
                }}
                onTransactionConfirmed={() => {
                  alert("NFT minted successfully!");
                  setNftDescription("");
                  setMediaPreview({ url: "", type: "" });
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                onError={(error) => {
                  console.error("Transaction error:", error);
                  alert("Transaction failed: " + error.message);
                }}
              >
                Mint NFT
              </TransactionButton>
              
      <div>
      { !ExistUser && (
                        <h1 className="text-lg font-semibold text-gray-700">No Account? Make an Account to Post also in future from ioPlasmaVerse</h1>

              )}
      </div>
    </div>
  );
};

export default SocialPostCreator;
