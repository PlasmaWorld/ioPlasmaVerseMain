"use client";

import React, { useState, useRef, useEffect } from 'react'; // Import useEffect here
import ReactCrop, { makeAspectCrop, centerCrop } from "react-image-crop";
import 'react-image-crop/dist/ReactCrop.css';
import { convertToPixelCrop } from './utils';
import setCanvasPreview from "./setCanvasPreview"; 
import styles from "./Modal.module.css"; 
import { TransactionButton, useActiveAccount } from 'thirdweb/react';
import { AppMint } from '@/const/contracts';
import { upload } from 'thirdweb/storage';
import client from '@/lib/client';
import { mintTo } from 'thirdweb/extensions/erc721';
import NextImage from 'next/image'; // Renamed import
import { useUser } from '@/Hooks/UserInteraction';

const ASPECT_RATIO = 950 / 350;
const MIN_DIMENSION = 150;

const ImageCropperBackround = () => {
  const [mediaPreview, setMediaPreview] = useState({ url: "", type: "" });
  const account = useActiveAccount();
  const fileInputRef = useRef(null);
  const [nftDescription, setNftDescription] = useState("");
  const previewImageRef = useRef(null); 
  const previewCanvasRef = useRef(null);
  const [imgSrc, setImgSrc] = useState("");
  const [crop, setCrop] = useState(null); 
  const [error, setError] = useState("");
  const [imgDimensions, setImgDimensions] = useState({ width: 0, height: 0 });
  const { userExists: ExistUser } = useUser();

  useEffect(() => {
    if (ExistUser === true) {
    }
  }, [ExistUser]);

  const onSelectFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.addEventListener("load", () => {
      const imageElement = new window.Image(); // Use native Image constructor
      const imageUrl = reader.result?.toString() || "";
      imageElement.src = imageUrl;

      imageElement.addEventListener("load", (e) => {
        if (error) setError("");
        const { naturalWidth, naturalHeight } = e.currentTarget;
        if (naturalWidth < MIN_DIMENSION || naturalHeight < MIN_DIMENSION) {
          setError("Image must be at least 150 x 150 pixels.");
          return setImgSrc("");
        }
        setImgDimensions({ width: naturalWidth, height: naturalHeight });
      });
      setImgSrc(imageUrl);
    });
    reader.readAsDataURL(file);
  };

  const onImageLoad = (e) => {
    const { width, height } = e.target;
    if (previewImageRef.current) {
      previewImageRef.current.width = width;
      previewImageRef.current.height = height;
    }

    const cropWidthInPercent = (MIN_DIMENSION / width) * 100;

    const crop = makeAspectCrop(
      {
        unit: "%",
        width: cropWidthInPercent,
      },
      ASPECT_RATIO,
      width,
      height
    );
    const centeredCrop = centerCrop(crop, width, height);
    setCrop(centeredCrop);
  };

 

  return (
    <>
      <label className="block mb-3 w-fit">
        <span className="sr-only">Choose profile photo</span>
        <input
          type="file"
          accept="image/*"
          onChange={onSelectFile}
          className="block w-full text-sm text-slate-500 file:mr-4 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-xs file:bg-gray-700 file:text-sky-300 hover:file:bg-gray-600"
          ref={fileInputRef} 
        />  
      </label>
      {error && <p className="text-red-400 text-xs">{error}</p>}
      {imgSrc &&  (
        <div className="flex flex-col items-center">
          <ReactCrop
            crop={crop}
            onChange={(pixelCrop, percentCrop) => setCrop(percentCrop)}
            keepSelection
            aspect={ASPECT_RATIO}
            minWidth={MIN_DIMENSION}
          >
            <NextImage
              ref={previewImageRef} 
              src={imgSrc}
              alt="Upload"
              width={imgDimensions.width}
              height={imgDimensions.height}
              style={{ maxHeight: "70vh" }}
              onLoad={onImageLoad}
            />
          </ReactCrop>
          <input
            placeholder="Choose your Name"
            value={nftDescription} 
            onChange={(e) => setNftDescription(e.target.value)} 
            className={styles.textInput}
          />

          
          <TransactionButton
              transaction={async () => {
                

                try {
                  setCanvasPreview(
                    previewImageRef.current,
                    previewCanvasRef.current,
                    convertToPixelCrop(
                      crop,
                      previewImageRef.current.width,
                      previewImageRef.current.height
                    )
                  );
                  
                  const canvasData = previewCanvasRef.current.toDataURL();
                  const imageBlob = await fetch(canvasData).then((res) => res.blob());
                  const newFile = new File([imageBlob], "image.png");

          const imageUri = await upload({
                      client: client,
                      files: [newFile],
                  });
                  console.log("NewFile Data, ", imageUri)

                  if (imageUri.length === 0) {
                    throw new Error("Failed to upload metadata to IPFS");
                  }

                  return mintTo({
                    contract: AppMint,
                    to: account.address,
                    nft: {
                      name: nftDescription,
                      description:  "PlasmaVerse BackroundImage",
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
        </div>
        
      )}
      <div>
      { !ExistUser && (
             <h1 className="text-lg font-semibold text-gray-700">No Account? Make an Account to mint from ioPlasmaVerse</h1>

              )}
      </div>
      <canvas
        ref={previewCanvasRef}
        style={{ display: "none", width: "100%", height: "auto" }}
      />
    </>
  );
};

export default ImageCropperBackround;
