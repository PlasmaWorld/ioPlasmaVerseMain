"use client";
import React, { useEffect, useRef, useState } from 'react';
import { maxUint256 } from "viem";
import styles from './NftMint.module.css';
import { Chain, defineChain, getContract, prepareContractCall, PreparedTransaction, resolveMethod, ThirdwebContract } from 'thirdweb';
import { MediaRenderer, TransactionButton, useActiveAccount, useSendTransaction } from 'thirdweb/react';
import client from '@/lib/client';
import { upload } from 'thirdweb/storage';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import VrmViewer from "@/components/AccountGroup/VrmViewer";
import { findChildrenByType, getMaterialsSortedByArray } from "../../library/utils";
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { VRM, VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm';
import { mintTo } from 'thirdweb/extensions/erc1155';



interface ClaimComponentProps {
    contractAddress: string;
    chainId: number;
  }
  
  const MintComponentErc1155: React.FC<ClaimComponentProps> = ({ contractAddress, chainId }) => {
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
    const [tokenId, setTokenId] = useState(1);
    const [amount, setAmount] = useState(1);

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
  
    const prepareTransaction = async () => {
        const resolvedMethod = await resolveMethod("mintTo");
        if (!account?.address) {
            throw new Error("Account address is undefined. Please connect your wallet.");
          }
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
    
          const metadataString = JSON.stringify(metadataObject);
          const metadataBlob = new Blob([metadataString], { type: 'application/json' });
          const metadataFile = new File([metadataBlob], 'metadata.json');
    
          const metadataUri = await upload({
            client,
            files: [metadataFile],
          });
    
          if (!metadataUri || metadataUri.length === 0) {
            throw new Error("Failed to upload metadata to IPFS");
          }
    
          const ipfsUrl = `${metadataUri}`;
          console.log("Metadata uploaded to IPFS: ", ipfsUrl);
    
          const transaction = await mintTo({
            contract: contract,
            to: account?.address,
                supply: BigInt(amount),
                
                nft: {
                  name: nftName,
                  description: nftDescription,
                  image: ipfsUrlImage,
                  animation_url: ipfsUrlVideo,
                  external_url: ipfsUrlVrm,
                  
                },
                });
                return transaction;
                
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
    const prepareTransactionTest = async (): Promise<PreparedTransaction<any>> => {
        try {
          if (!account?.address) {
            throw new Error("Account address is undefined. Please connect your wallet.");
          }
      
          let ipfsUrlImage = "";
          let ipfsUrlVideo = "";
          let ipfsUrlVrm = "";
      
          // Upload files to IPFS
          if (selectedFile) {
            const imageBlob = await selectedFile.arrayBuffer().then(buffer => new Blob([buffer], { type: selectedFile.type }));
            const newFile = new File([imageBlob], "image.png", { type: selectedFile.type });
            const imageUri = await upload({ client, files: [newFile] });
            ipfsUrlImage = `${imageUri}`;
          }
      
          if (selectedFileVideo) {
            const videoBlob = await selectedFileVideo.arrayBuffer().then(buffer => new Blob([buffer], { type: selectedFileVideo.type }));
            const newFileVideo = new File([videoBlob], "video.mp4", { type: selectedFileVideo.type });
            const videoUri = await upload({ client, files: [newFileVideo] });
            ipfsUrlVideo = `${videoUri}`;
          }
      
          if (vrmFile) {
            const vrmBlob = await vrmFile.arrayBuffer().then(buffer => new Blob([buffer], { type: vrmFile.type }));
            const newVrmFile = new File([vrmBlob], vrmFile.name, { type: vrmFile.type });
            const vrmUri = await upload({ client, files: [newVrmFile] });
            ipfsUrlVrm = `${vrmUri}`;
          }
      
          // Prepare metadata for IPFS
          const metadataObject = {
            name: nftName,
            description: nftDescription,
            image: ipfsUrlImage,
            animation_url: ipfsUrlVideo,
            vrm_url: ipfsUrlVrm,
            attributes: attributes,
          };
      
          const metadataString = JSON.stringify(metadataObject);
          const metadataBlob = new Blob([metadataString], { type: 'application/json' });
          const metadataFile = new File([metadataBlob], 'metadata.json');
          const metadataUri = await upload({ client, files: [metadataFile] });
      
          if (!metadataUri || metadataUri.length === 0) {
            throw new Error("Failed to upload metadata to IPFS");
          }
      
          const ipfsUrl = `${metadataUri}`;
          console.log("Metadata uploaded to IPFS: ", ipfsUrl);
      
          // Double-check that the values are valid
          const tokenIdBigInt = BigInt(tokenId);
          const amountBigInt = BigInt(amount);
      
          console.log("Preparing contract call with the following params:");
          console.log("Address:", account.address);
          console.log("Token ID:", tokenIdBigInt);
          console.log("IPFS URL:", ipfsUrl);
          console.log("Amount:", amountBigInt);
      
          // Prepare the contract call
          const transaction = await prepareContractCall({
            contract: contract,
            method: "function mintTo(address _to, uint256 _tokenId, string _uri, uint256 _amount)",
            params: [
              account.address,  // address _to
              maxUint256,    // uint256 _tokenId
              ipfsUrl,          // string _uri
              amountBigInt      // uint256 _amount
            ],
          });
      
          return transaction;
      
        } catch (error) {
          console.error("Error preparing transaction:", error);
          throw error;
        }
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
        <div>
        <legend className={styles.legendText}>
                        Set Amount to Mint
                      </legend>
                      <input
                        className={styles.inputField}
                        type="number"
                        step={1}
                        value={amount}
                        onChange={(e) =>
                          setAmount(Number(e.target.value))
                        }
                      />
  
        </div>
                        <div>
        <legend className={styles.legendText}>
                        set tokenId
                      </legend>
                      <input
                        className={styles.inputField}
                        type="number"
                        step={1}
                        value={tokenId}
                        onChange={(e) =>
                          setTokenId(Number(e.target.value))
                        }
                      />
  
        </div>
  
        <TransactionButton
          className={styles.mintButton}
          transaction={prepareTransactionTest}
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
  
  export default MintComponentErc1155;