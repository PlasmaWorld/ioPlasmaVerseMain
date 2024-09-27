"use client";

import React, { useEffect, useRef, useState } from 'react';
import styles from './NftMint.module.css';
import { Chain, defineChain, getContract, prepareContractCall, resolveMethod, ThirdwebContract } from 'thirdweb';
import { MediaRenderer, TransactionButton, useActiveAccount, useSendTransaction } from 'thirdweb/react';
import { ChattApp, ChattApp2, NETWORK } from '@/const/contracts';
import client from '@/lib/client';
import { upload } from 'thirdweb/storage';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import VrmViewer from "@/components/AccountGroup/VrmViewer";
import { findChildrenByType, getMaterialsSortedByArray } from "../../library/utils";
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { VRM, VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm';



interface ClaimComponentProps {
    contractAddress: string;
    chainId: number;
  }
  
  const MintComponent: React.FC<ClaimComponentProps> = ({ contractAddress, chainId }) => {
  
  const [userName, setUserName] = useState<string>("");
 
  const [thumbnailUrl, setThumbnailUrl] = useState<string>("");
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>("");
  
  const [transactionError, setTransactionError] = useState<string | null>(null);
  const [ipfsLink, setIpfsLink] = useState<string | null>(null);
  const { mutate: sendTransaction } = useSendTransaction();
  const account = useActiveAccount();
  const [vrmFile, setVrmFile] = useState<File | null>(null);
 
  const [meshQty, setMeshQty] = useState(0);
  const [skinnedMeshQty, setSkinnedMeshQty] = useState(0);
  const [standardMaterialQty, setStandardMaterialQty] = useState(0);
  const [standardTranspMaterialQty, setStandardTranspMaterialQty] = useState(0);
  const [standardCutoutMaterialQty, setStandardCutoutMaterialQty] = useState(0);
  const [vrmMaterialQty, setVrmMaterialQty] = useState(0);
  const [vrmTranspMaterialQty, setVrmTranspMaterialQty] = useState(0);
  const [vrmCutoutMaterialQty, setVrmCutoutMaterialQty] = useState(0);
  const [trianglesCount, setTrianglesCount] = useState(0);
  const [bonesCount, setBonesCount] = useState(0);
  const [name, setName] = useState("");
  const [files, setFiles] = useState<(File | null)[]>([]);
  const [vrm_url, setVrmUrl] = useState<string>("");
  const [mediaPreview, setMediaPreview] = useState({ url: "", type: "" });
  const [mediaPreviewVideo, setMediaPreviewVideo] = useState({ url: "", type: "" });

  const [nftDescription, setNftDescription] = useState("");
  const [nftName, setNftName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [vrmMetadata, setVrmMetadata] = useState<any>(null);
  const [vrmHumanoid, setVrmHumanoid] = useState<any>(null);
  const [vrmExpressions, setVrmExpressions] = useState<any>(null);
  const [vrmSecondaryAnimation, setVrmSecondaryAnimation] = useState<any>(null);
  const [attributes, setAttributes] = useState<{ trait_type: string, value: string }[]>([]);
  const [activeTab, setActiveTab] = useState<string>('vrm');
  const NETWORK = defineChain(chainId);


  const contract: ThirdwebContract = getContract({
    address: contractAddress,
    client,
    chain: NETWORK,
  });
  
  useEffect(() => {
    if (vrmFile) {
      const loader = new GLTFLoader();
      loader.register(parser => new VRMLoaderPlugin(parser));
      loader.load(
        URL.createObjectURL(vrmFile),
        (gltf) => {
          const vrm = gltf.userData.vrm;
          VRMUtils.rotateVRM0(vrm);
          setName(vrmFile.name);
          setFiles(prevFiles => [...prevFiles, vrmFile]);

          setVrmMetadata(vrm.meta);
          setVrmHumanoid(vrm.humanoid);
          setVrmExpressions(vrm.expressionManager);
          setVrmSecondaryAnimation(vrm.secondaryAnimation);

          const meshes = findChildrenByType(gltf.scene, "Mesh");
          const skinnedMesh = findChildrenByType(gltf.scene, "SkinnedMesh");
          setMeshQty(meshes.length);
          setSkinnedMeshQty(skinnedMesh.length);
          const allMeshes = meshes.concat(skinnedMesh);

          const {
            stdMats,
            stdCutoutpMats,
            stdTranspMats,
            mToonMats,
            mToonCutoutMats,
            mToonTranspMats
          } = getMaterialsSortedByArray(allMeshes);

          setStandardMaterialQty(stdMats.length);
          setStandardTranspMaterialQty(stdTranspMats.length);
          setStandardCutoutMaterialQty(stdCutoutpMats.length);

          setVrmMaterialQty(mToonMats.length);
          setVrmTranspMaterialQty(mToonTranspMats.length);
          setVrmCutoutMaterialQty(mToonCutoutMats.length);

          const triangles = allMeshes.reduce((sum, mesh) => sum + mesh.geometry.index.count / 3, 0);
          setTrianglesCount(triangles);

          const bones = findChildrenByType(gltf.scene, "Bone");
          setBonesCount(bones.length);

          console.log('VRM Metadata:', vrm.meta);
          console.log('VRM Humanoid:', vrm.humanoid);
          console.log('VRM Expressions:', vrm.expressionManager);
          console.log('VRM Secondary Animation:', vrm.secondaryAnimation);
          console.log('Meshes:', meshes);
          console.log('Skinned Meshes:', skinnedMesh);
          console.log('Standard Materials:', stdMats);
          console.log('Cutout Standard Materials:', stdCutoutpMats);
          console.log('Transparent Standard Materials:', stdTranspMats);
          console.log('MToon Materials:', mToonMats);
          console.log('Cutout MToon Materials:', mToonCutoutMats);
          console.log('Transparent MToon Materials:', mToonTranspMats);
          console.log('Triangles:', triangles);
          console.log('Bones:', bones);

          const images = gltf.parser.json.images;
          if (images) {
            console.log('Images found in VRM file:', images);
          } else {
            console.log('No images found in VRM file.');
          }
        },
        (progress) => console.log(`Loading model: ${Math.round((progress.loaded / progress.total) * 100)}%`),
        (error) => console.error('Error loading VRM:', error)
      );
    }
  }, [vrmFile]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const newFile = new File([file], file.name);
        const uri = await upload({
          client,
          files: [newFile],
        });

        if (!uri || uri.length === 0) {
          throw new Error("Failed to upload metadata to IPFS");
        }

        const ipfsUrl = `${uri}`;
        setVrmUrl(ipfsUrl);

        setUploadedImageUrl(ipfsUrl);
        setVrmFile(file);
        console.log("ipfs link", ipfsUrl);

      } catch (error) {
        console.error("Error uploading file:", error);
      }
    }
  };

  const handleMediaChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const newFile = new File([file], file.name);
        const uri = await upload({
          client,
          files: [newFile],
        });

        if (!uri || uri.length === 0) {
          throw new Error("Failed to upload metadata to IPFS");
        }

        const ipfsUrl = `${uri}`;
        setMediaPreview({ url: ipfsUrl, type: file.type.startsWith('image') ? 'image' : 'video' });
      } catch (error) {
        console.error("Error uploading media file:", error);
      }
    }
  };

  const handleMediaChangeVideo = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const newFile = new File([file], file.name);
        const uri = await upload({
          client,
          files: [newFile],
        });

        if (!uri || uri.length === 0) {
          throw new Error("Failed to upload metadata to IPFS");
        }

        const ipfsUrl = `${uri}`;
        setMediaPreviewVideo({ url: ipfsUrl, type: file.type.startsWith('image') ? 'image' : 'video' });
      } catch (error) {
        console.error("Error uploading media file:", error);
      }
    }
  };

  const prepareTransaction = async () => {
    const resolvedMethod = await resolveMethod("mintTo");

    if (!resolvedMethod) {
      throw new Error("Failed to resolve method");
    }

    const metadataObject = {
      name: nftName,
      description: nftDescription,
      image: mediaPreview.url,
      animation_url:mediaPreviewVideo.url,
      vrm_url: vrm_url,
      attributes: attributes, 
    };

    const metadataString = JSON.stringify(metadataObject);
    const blob = new Blob([metadataString], { type: 'application/json' });
    const file = new File([blob], 'metadata.json');

    try {
      const uri = await upload({
        client,
        files: [file],
      });

      if (!uri || uri.length === 0) {
        throw new Error("Failed to upload metadata to IPFS");
      }

      const ipfsUrl = `${uri}`;
      console.log("Metadata uploaded to IPFS: ", ipfsUrl);

      return prepareContractCall({
        contract: ChattApp2,
        method: resolvedMethod,
        params: [
          account?.address,
          ipfsUrl,
        ],
      });
    } catch (error) {
      console.error("Error uploading metadata:", error);
      throw error;
    }
  };

  const formatMetadata = (metadata: any) => {
    if (!metadata) return "No metadata available";
    return JSON.stringify(metadata, null, 2); // Pretty print JSON
  };

  const handleTransactionSent = () => {
    console.log("Transaction sent");
  };

  const handleTransactionConfirmed = () => {
    console.log("Transaction confirmed");
  };

  const handleTransactionError = (error: { message: React.SetStateAction<string | null>; }) => {
    console.error("Transaction error:", error);
    setTransactionError(error.message);
  };

  const addAttribute = () => {
    setAttributes([...attributes, { trait_type: '', value: '' }]);
  };

  const handleAttributeChange = (index: number, key: keyof { trait_type: string, value: string }, value: string) => {
    const newAttributes = [...attributes];
    newAttributes[index][key] = value;
    setAttributes(newAttributes);
  };
  

  return (
    <div className={styles.MintApp}>
      <div className={styles.statusHeader}>
        <h2>Mint Your unique NFT. You can add Images, videos, and 3D Files</h2>
      </div>
      <div className={styles.tabs}>
        <button onClick={() => setActiveTab('vrm')} className={activeTab === 'vrm' ? styles.active : ''}>VRM File</button>
        <button onClick={() => setActiveTab('image')} className={activeTab === 'image' ? styles.active : ''}>NFT Image</button>
        <button onClick={() => setActiveTab('animation')} className={activeTab === 'animation' ? styles.active : ''}>NFT Animation</button>
      </div>
      <div className={styles.tabContent}>
        {activeTab === 'vrm' && (
          <>
          <div className={styles.VrmContainer} >
            <div className={styles.threejsContainer}>
        {vrmFile && <VrmViewer vrmFile={vrmFile}  />}
        <div className={styles.Metadata}>
                <pre>Metadata: </pre>

            </div>
        </div>
      </div>
                </>
        )}
        {activeTab === 'image' && (
          <div className={styles.fileInputContainer}>
            
            {mediaPreview.type === 'image' && <img src={mediaPreview.url} alt="NFT Image Preview" />}
          </div>
        )}
        {activeTab === 'animation' && (
          <div className={styles.fileInputContainer}>
            
            {mediaPreview.type === 'video' && <video src={mediaPreview.url} controls />}
          </div>
        )}
      </div>
      <div className={styles.fileInputContainer}>
              <label className={styles.fileInputLabel} htmlFor="vrmFile">Upload VRM File</label>
              <input
                id="vrmFile"
                className={styles.fileInput}
                type="file"
                onChange={handleFileChange}
              />

<           label className={styles.fileInputLabel} htmlFor="nftImage">Upload Image</label>
            <input
              id="nftImage"
              className={styles.fileInput}
              type="file"
              accept="image/*"
              onChange={handleMediaChange}
            />

<label className={styles.fileInputLabel} htmlFor="nftAnimation">Upload Animation</label>
            <input
              id="nftAnimation"
              className={styles.fileInput}
              type="file"
              accept="video/*"
              onChange={handleMediaChangeVideo}
            />
            </div>

      <textarea placeholder="Enter NFT Name" value={nftName} onChange={(e) => setNftName(e.target.value)} />
      <input placeholder="Enter NFT Description" value={nftDescription} onChange={(e) => setNftDescription(e.target.value)} />

      <div className={styles.attributesContainer}>
        {attributes.map((attribute, index) => (
          <div key={index} className={styles.attributeInputGroup}>
            <input
              type="text"
              placeholder="Trait Type"
              value={attribute.trait_type}
              onChange={(e) => handleAttributeChange(index, 'trait_type', e.target.value)}
            />
            <input
              type="text"
              placeholder="Value"
              value={attribute.value}
              onChange={(e) => handleAttributeChange(index, 'value', e.target.value)}
            />
          </div>
        ))}
        <button onClick={addAttribute} className={styles.addAttributeButton}>Add Attribute</button>
      </div>

      <TransactionButton
        className={styles.mintButton}
        transaction={prepareTransaction}
        onTransactionSent={handleTransactionSent}
        onTransactionConfirmed={handleTransactionConfirmed}
        onError={handleTransactionError}
      >
        Execute Transaction
      </TransactionButton>
      {transactionError && <p className={styles.error}>{transactionError}</p>}
    </div>
  );
};

export default MintComponent;
