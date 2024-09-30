"use client";

import React, { useEffect, useRef, useState } from 'react';
import styles from '@/components/MintApp/NftMint.module.css';
import { Chain, defineChain, getContract, prepareContractCall, PreparedTransaction, prepareTransaction, resolveMethod, ThirdwebClient, ThirdwebContract, toWei } from 'thirdweb';
import { MediaRenderer, TransactionButton, useActiveAccount, useSendTransaction } from 'thirdweb/react';
import { AppMint, ChattApp, ChattApp2, NETWORK } from '@/const/contracts';
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
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [selectedFileVideo, setSelectedFileVideo] = useState<File | null>(null);
    const address = account?.address;
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
        setVrmFile(file);
      }
    };
  
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files ? event.target.files[0] : null;
      if (file) {
        const previewUrl = URL.createObjectURL(file);
        const fileType = file.type.startsWith('video/') ? 'video' : 'image';
        setMediaPreview({ url: previewUrl, type: fileType });
        setSelectedFile(file);
        console.log("File selected for upload:", file.name);
      }
    };
  
    const handleMediaChangeVideo = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files ? event.target.files[0] : null;
      if (file) {
        const previewUrl = URL.createObjectURL(file);
        const fileType = file.type.startsWith('video/') ? 'video' : 'image';
        setMediaPreviewVideo({ url: previewUrl, type: fileType });
        setSelectedFileVideo(file);
        console.log("File selected for upload:", file.name);
      }
    };
  
    const handleMint = async () => {
      const resolvedMethod = await resolveMethod("mintTo");
  
      if (!resolvedMethod) {
        throw new Error("Failed to resolve method");
      }
  
      let ipfsUrlImage = "";
      let ipfsUrlVideo = "";
      let ipfsUrlVrm = "";
  
      try {
        if (selectedFile) {
          const imageBlob = await selectedFile.arrayBuffer().then(buffer => new Blob([buffer], { type: selectedFile.type }));
          const newFile = new File([imageBlob], "image.png", { type: selectedFile.type });
          const imageUri = await upload({
            client: client,
            files: [newFile],
          });
          ipfsUrlImage = `${imageUri}`;
        }
  
        if (selectedFileVideo) {
          const videoBlob = await selectedFileVideo.arrayBuffer().then(buffer => new Blob([buffer], { type: selectedFileVideo.type }));
          const newFileVideo = new File([videoBlob], "video.mp4", { type: selectedFileVideo.type });
          const videoUri = await upload({
            client: client,
            files: [newFileVideo],
          });
          ipfsUrlVideo = `${videoUri}`;
        }
  
        if (vrmFile) {
          const vrmBlob = await vrmFile.arrayBuffer().then(buffer => new Blob([buffer], { type: vrmFile.type }));
          const newVrmFile = new File([vrmBlob], vrmFile.name, { type: vrmFile.type });
          const vrmUri = await upload({
            client,
            files: [newVrmFile],
          });
          ipfsUrlVrm = `${vrmUri}`;
        }
  
        const metadataObject = {
          name: nftName,
          description: nftDescription,
          image: ipfsUrlImage,
          animation_url: ipfsUrlVideo,
          vrm_url: ipfsUrlVrm,
          attributes: attributes,
        };

        const response = await fetch('/api/getMint', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({  name: nftName,
            description: nftDescription,
            image: ipfsUrlImage, 
            animation_url: ipfsUrlVideo,
            vrm_url: ipfsUrlVrm,
            attributes: attributes,
            address: address}),
        });
        if (!response.ok) {
          throw new Error('Failed to update contract stats');
        }
  
        const result = await response.json();
        console.log('Updated contract stats:', result);
  
       
      } catch (error) {
        console.error("Error preparing transaction:", error);
        throw error;
      }
    };
  
    const formatMetadata = (metadata: any) => {
      return {
        name: metadata.name || "",
        description: metadata.description || "",
        image: metadata.image ? "Image Present" : "",
        animation_url: metadata.animation_url ? "Animation Present" : "",
        vrm_url: metadata.vrm_url ? "VRM Present" : "",
        attributes: metadata.attributes || [],
      };
    };

    const prepareFundTransfer = async () => {
      const transaction = prepareTransaction({
        to: "0xd0EBa99b4BA31bE62B8F41a155b299329116E7b4",  // Receiver's address
        chain: NETWORK,
        client: client,  // ThirdwebClient instance
        value: toWei("1.0"),  // Sending 1 Ether (converted to wei)
        gasPrice: 30n,  // Gas price in wei (or you can use maxFeePerGas/maxPriorityFeePerGas)
      });
      return transaction;
  };


  
  
    const handleTransactionSent = () => {
      console.log("Transaction sent");
    };
  
    const handleTransactionConfirmed = () => {
      console.log("Transaction confirmed");
      handleMint();
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
              <div className={styles.VrmContainer}>
                <div className={styles.nftCard}>
                  <div className={styles.threejsContainer}>
                    {vrmFile && <VrmViewer vrmFile={vrmFile} />}
                  </div>
                </div>
                
                  <div className={styles.Metadata}>
                  <pre>Metadata: {JSON.stringify(formatMetadata({
                    name: nftName,
                    description: nftDescription,
                    image: mediaPreview.url,
                    animation_url: mediaPreviewVideo.url,
                    vrm_url: vrm_url,
                    attributes: attributes,
                  }), null, 2)}</pre>
                      </div>
                      <div>
                </div>
              </div>
            </>
          )}
          {activeTab === 'image' && (
           <div className={styles.VrmContainer}>
           <div className={styles.nftCard}>
             <div className={styles.threejsContainer}>
                {mediaPreview.type === 'image' && <img src={mediaPreview.url} alt="Preview" />}
              </div>
              </div>
              <div className={styles.Metadata}>
                  <pre>Metadata: {JSON.stringify(formatMetadata({
                    name: nftName,
                    description: nftDescription,
                    image: mediaPreview.url,
                    animation_url: mediaPreviewVideo.url,
                    vrm_url: vrm_url,
                    attributes: attributes,
                  }), null, 2)}</pre>
                      </div>
            </div>
          )}
          {activeTab === 'animation' && (
            <div className={styles.VrmContainer}>
            <div className={styles.nftCard}>
              <div className={styles.threejsContainer}>
                {mediaPreview.type === 'video' && <video src={mediaPreview.url} controls />}
              </div>
              </div>
              <div className={styles.Metadata}>
                  <pre>Metadata: {JSON.stringify(formatMetadata({
                    name: nftName,
                    description: nftDescription,
                    image: mediaPreview.url,
                    animation_url: mediaPreviewVideo.url,
                    vrm_url: vrm_url,
                    attributes: attributes,
                  }), null, 2)}</pre>
                      </div>
            </div>
          )}
        </div>
        <div>
          <label className={styles.fileInputLabel} htmlFor="vrmFile">Upload VRM File</label>
          <div>
          <input
            id="vrmFile"
            className={styles.fileInput}
            type="file"
            onChange={handleFileChange}
          />
          </div>
          <div>
          <label className={styles.fileInputLabel} htmlFor="nftImage">Upload Image</label>
          <input
            id="nftImage"
            className={styles.fileInput}
            type="file"
            accept="image/*"
            onChange={handleChange}
          />
          </div>
          <div>
          <label className={styles.fileInputLabel} htmlFor="nftAnimation">Upload Animation</label>
          <input
            id="nftAnimation"
            className={styles.fileInput}
            type="file"
            accept="video/*"
            onChange={handleMediaChangeVideo}
          />
          </div>
        </div>
        <div>
          <input
            placeholder="Enter NFT Name"
            value={nftName}
            className={styles.input}
            onChange={(e) => setNftName(e.target.value)}
          />
        </div>
        <div>
          <input
            placeholder="Enter NFT Description"
            value={nftDescription}
            className={styles.input}
            onChange={(e) => setNftDescription(e.target.value)}
          />
        </div>
        <div className={styles.attributesContainer}>
          {attributes.map((attribute, index) => (
            <div key={index} className={styles.attributeInputGroup}>
              <input
                type="text"
                placeholder="Trait Type"
                value={attribute.trait_type}
                className={styles.input}
                onChange={(e) => handleAttributeChange(index, 'trait_type', e.target.value)}
              />
              <input
                type="text"
                placeholder="Value"
                value={attribute.value}
                className={styles.input}
                onChange={(e) => handleAttributeChange(index, 'value', e.target.value)}
              />
            </div>
          ))}
          <button onClick={addAttribute} className={styles.addAttributeButton}>Add Attribute</button>
        </div>
        

        <TransactionButton
          className={styles.mintButton}
          transaction={prepareFundTransfer}
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