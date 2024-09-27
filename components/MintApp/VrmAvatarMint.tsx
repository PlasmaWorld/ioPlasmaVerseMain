import React, { useEffect, useRef, useState } from 'react';
import styles from './Mint2.module.css';
import { Chain, defineChain, getContract, prepareContractCall, resolveMethod, ThirdwebContract } from 'thirdweb';
import { MediaRenderer, TransactionButton, useActiveAccount, useSendTransaction } from 'thirdweb/react';
import { ChattApp, ChattApp2, NETWORK } from '@/const/contracts';
import client from '@/lib/client';
import { upload } from 'thirdweb/storage';
import VrmViewer from "@/components/AccountGroup/vrmViewer2";
import { imagePaths, imagePathsvrm } from './imagePath';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm';
import JSZip from 'jszip';

interface ClaimComponentProps {
  contractAddress: string;
  chainId: number;
}

const MintComponent: React.FC<ClaimComponentProps> = ({ contractAddress, chainId }) => {
  const [userName, setUserName] = useState<string>("");
  const [thumbnailUrl, setThumbnailUrl] = useState<string>("");
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>('accessories');
  const [transactionError, setTransactionError] = useState<string | null>(null);
  const [ipfsLink, setIpfsLink] = useState<string | null>(null);
  const { mutate: sendTransaction } = useSendTransaction();
  const account = useActiveAccount();
  const [vrmFile, setVrmFile] = useState<File | null>(null);
  const [name, setName] = useState<string>("");
  const [files, setFiles] = useState<(File | null)[]>([]);
  const [vrm_url, setVrmUrl] = useState<string>("");
  const [mediaPreview, setMediaPreview] = useState({ url: "", type: "" });
  const [mediaPreviewVideo, setMediaPreviewVideo] = useState({ url: "", type: "" });
  const [nftDescription, setNftDescription] = useState<string>("");
  const [nftName, setNftName] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attributes, setAttributes] = useState<{ trait_type: string, value: string }[]>([]);
  const [activeTab, setActiveTab] = useState<string>('vrm');
  const NETWORK = defineChain(chainId);
  const [accessories, setAccessories] = useState<File[]>([]);
  const [body, setBody] = useState<File[]>([]);
  const [chest, setChest] = useState<File[]>([]);
  const [eyes, setEyes] = useState<File[]>([]);
  const [foot, setFoot] = useState<File[]>([]);
  const [head, setHead] = useState<File[]>([]);
  const [legs, setLegs] = useState<File[]>([]);
  const [outer, setOuter] = useState<File[]>([]);

  const [accessoriesImage, setAccessoriesImage] = useState<string[]>([]);
  const [bodyImage, setBodyImage] = useState<string[]>([]);
  const [chestImage, setChestImage] = useState<string[]>([]);
  const [eyesImage, setEyesImage] = useState<string[]>([]);
  const [footImage, setFootImage] = useState<string[]>([]);
  const [headImage, setHeadImage] = useState<string[]>([]);
  const [legsImage, setLegsImage] = useState<string[]>([]);
  const [outerImage, setOuterImage] = useState<string[]>([]);

  const [images, setImages] = useState<{ [key: string]: string[] }>({
    accessories: imagePaths.accessories,
    body: imagePaths.body,
    chest: imagePaths.chest || [],
    eyes: imagePaths.eyes || [],
    foot: imagePaths.foot || [],
    head: imagePaths.head || [],
    legs: imagePaths.legs || [],
    outer: imagePaths.outer || [],
  });

  const [VrmParts, setVrmParts] = useState<{ [key: string]: string[] }>({
    accessories: imagePathsvrm.accessories,
    body: imagePathsvrm.body,
    chest: imagePathsvrm.chest || [],
    eyes: imagePathsvrm.eyes || [],
    foot: imagePathsvrm.foot || [],
    head: imagePathsvrm.head || [],
    legs: imagePathsvrm.legs || [],
    outer: imagePathsvrm.outer || [],
  });

  const [selectedImages, setSelectedImages] = useState<{ [key: string]: string }>({
    accessories: '',
    body: '',
    chest: '',
    eyes: '',
    foot: '',
    head: '',
    legs: '',
    outer: '',
  });

  const [vrmImages, setVrmImages] = useState<{ name: string, index: number }[]>([]);

  const getVrmForImage = async (imageUrl: string, category: string): Promise<File | null> => {
    console.log(`Searching for VRM file for image: ${imageUrl} in category: ${category}`);

    const folderName = imageUrl.split('/')[3];
    const vrmFileName = `/neurohacker/${category}/${folderName}.vrm`;

    console.log(`Constructed VRM file name: ${vrmFileName}`);

    const vrmFilePath = VrmParts[category].find(vrmPath => vrmPath.includes(vrmFileName));

    console.log(`Matched VRM file path: ${vrmFilePath}`);

    if (vrmFilePath) {
      const response = await fetch(vrmFilePath);
      const blob = await response.blob();
      return new File([blob], vrmFileName, { type: blob.type });
    } else {
      return null;
    }
  };

  const mapVrmImages = async (vrmFile: File) => {
    const loader = new GLTFLoader();
    loader.register(parser => new VRMLoaderPlugin(parser));

    loader.load(
      URL.createObjectURL(vrmFile),
      (gltf) => {
        const images = gltf.parser.json.images.map((image: any, index: number) => ({
          name: image.name,
          index: index,
        }));
        setVrmImages(images);
        console.log('Mapped images in VRM file:', images);
      },
      (progress) => console.log(`Loading model: ${Math.round((progress.loaded / progress.total) * 100)}%`),
      (error) => console.error('Error loading VRM:', error)
    );
  };

  const createNewVRMWithImage = async (vrmFile: File, oldImageName: string, newImageFile: File): Promise<File> => {
    const vrmZip = await JSZip.loadAsync(vrmFile);
    const vrmFiles = Object.keys(vrmZip.files);
    const oldImagePath = vrmFiles.find(file => file.endsWith(oldImageName));
    if (!oldImagePath) {
      throw new Error(`Image ${oldImageName} not found in VRM`);
    }
    const newImageBlob = await newImageFile.arrayBuffer();

    vrmZip.file(oldImagePath, newImageBlob);

    const updatedVrmBlob = await vrmZip.generateAsync({ type: 'blob' });
    return new File([updatedVrmBlob], `updated_${vrmFile.name}`, { type: vrmFile.type });
  };

  const handleImageSelect = async (category: string, imageUrl: string) => {
    const vrmFile = await getVrmForImage(imageUrl, category);

    setSelectedImages(prev => ({
      ...prev,
      [category]: imageUrl,
    }));

    if (vrmFile) {
      await mapVrmImages(vrmFile);
      switch (category) {
        case 'accessories':
          setAccessories(prev => [...prev, vrmFile]);
          setAccessoriesImage(prev => [...prev, imageUrl]);
          console.log(`Selected VRM and PNG for accessories: ${imageUrl}`);
          break;
        case 'body':
          setBody(prev => [...prev, vrmFile]);
          setBodyImage(prev => [...prev, imageUrl]);
          console.log(`Selected VRM and PNG for body: ${imageUrl}`);
          break;
        case 'chest':
          setChest(prev => [...prev, vrmFile]);
          setChestImage(prev => [...prev, imageUrl]);
          console.log(`Selected VRM and PNG for chest: ${imageUrl}`);
          break;
        case 'eyes':
          setEyes(prev => [...prev, vrmFile]);
          setEyesImage(prev => [...prev, imageUrl]);
          console.log(`Selected VRM and PNG for eyes: ${imageUrl}`);
          break;
        case 'foot':
          setFoot(prev => [...prev, vrmFile]);
          setFootImage(prev => [...prev, imageUrl]);
          console.log(`Selected VRM and PNG for foot: ${imageUrl}`);
          break;
        case 'head':
          setHead(prev => [...prev, vrmFile]);
          setHeadImage(prev => [...prev, imageUrl]);
          console.log(`Selected VRM and PNG for head: ${imageUrl}`);
          break;
        case 'legs':
          setLegs(prev => [...prev, vrmFile]);
          setLegsImage(prev => [...prev, imageUrl]);
          console.log(`Selected VRM and PNG for legs: ${imageUrl}`);
          break;
        case 'outer':
          setOuter(prev => [...prev, vrmFile]);
          setOuterImage(prev => [...prev, imageUrl]);
          console.log(`Selected VRM and PNG for outer: ${imageUrl}`);
          break;
        default:
          break;
      }
    } else {
      switch (category) {
        case 'accessories':
          setAccessoriesImage(prev => [...prev, imageUrl]);
          console.log(`Selected PNG for accessories: ${imageUrl}`);
          break;
        case 'body':
          setBodyImage(prev => [...prev, imageUrl]);
          console.log(`Selected PNG for body: ${imageUrl}`);
          break;
        case 'chest':
          setChestImage(prev => [...prev, imageUrl]);
          console.log(`Selected PNG for chest: ${imageUrl}`);
          break;
        case 'eyes':
          setEyesImage(prev => [...prev, imageUrl]);
          console.log(`Selected PNG for eyes: ${imageUrl}`);
          break;
        case 'foot':
          setFootImage(prev => [...prev, imageUrl]);
          console.log(`Selected PNG for foot: ${imageUrl}`);
          break;
        case 'head':
          setHeadImage(prev => [...prev, imageUrl]);
          console.log(`Selected PNG for head: ${imageUrl}`);
          break;
        case 'legs':
          setLegsImage(prev => [...prev, imageUrl]);
          console.log(`Selected PNG for legs: ${imageUrl}`);
          break;
        case 'outer':
          setOuterImage(prev => [...prev, imageUrl]);
          console.log(`Selected PNG for outer: ${imageUrl}`);
          break;
        default:
          break;
      }
    }

    console.log(`Selected image: ${imageUrl} for category: ${category}`);
    if (vrmFile) {
      console.log(`Corresponding VRM file: ${vrmFile.name}`);
    } else {
      console.log(`No VRM file found for image: ${imageUrl}`);
    }
  };

  const handleReplaceImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const newImageFile = event.target.files?.[0];
    if (vrmFile && newImageFile) {
      try {
        const oldImageName = prompt("Enter the name of the image to replace (including the .png extension):", vrmImages[0]?.name);
        if (oldImageName) {
          const newVrmFile = await createNewVRMWithImage(vrmFile, oldImageName, newImageFile);
          setFiles([newVrmFile]);
          console.log(`Created new VRM file: ${newVrmFile.name}`);
        }
      } catch (error) {
        console.error('Error replacing image in VRM file:', error);
      }
    }
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
  };

  const handlePrevCategory = () => {
    const categories = Object.keys(images);
    const currentIndex = categories.indexOf(selectedCategory);
    const prevIndex = (currentIndex - 1 + categories.length) % categories.length;
    setSelectedCategory(categories[prevIndex]);
  };

  const handleNextCategory = () => {
    const categories = Object.keys(images);
    const currentIndex = categories.indexOf(selectedCategory);
    const nextIndex = (currentIndex + 1) % categories.length;
    setSelectedCategory(categories[nextIndex]);
  };

  const allVrmFiles = [
    ...accessories,
    ...body,
    ...chest,
    ...eyes,
    ...foot,
    ...head,
    ...legs,
    ...outer,
  ];

  const allPngsFiles = [
    ...accessoriesImage,
    ...bodyImage,
    ...chestImage,
    ...eyesImage,
    ...footImage,
    ...headImage,
    ...legsImage,
    ...outerImage,
  ];

  const contract: ThirdwebContract = getContract({
    address: contractAddress,
    client,
    chain: NETWORK,
  });

  useEffect(() => {
    if (vrmFile) {
      mapVrmImages(vrmFile);
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
        await mapVrmImages(file);
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
      animation_url: mediaPreviewVideo.url,
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
            <h2>Select Images for Categories</h2>
            <div className={styles.customizeContainer}>
              <div className={styles.categoryHeader}>
                {Object.keys(images).map(category => (
                  <button
                    key={category}
                    onClick={() => handleCategoryChange(category)}
                    className={selectedCategory === category ? styles.activeCategory : ''}
                  >
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </button>
                ))}
              </div>
              <div className={styles.imageContainer}>
                <button onClick={handlePrevCategory} className={styles.navButton}>‹</button>
                <div className={styles.imageList}>
                  {images[selectedCategory].map(imageUrl => (
                    <div key={imageUrl} className={styles.imageItem}>
                      <img src={imageUrl} alt={selectedCategory} />
                      <button onClick={() => handleImageSelect(selectedCategory, imageUrl)}>Select</button>
                    </div>
                  ))}
                </div>
                <button onClick={handleNextCategory} className={styles.navButton}>›</button>
              </div>
            </div>
            <div className={styles.selectedImagePreview}>
              <h3>Selected Image</h3>
              <img src={selectedImages[selectedCategory] || 'default-image.png'} alt="Selected" />
            </div>
            <div className={styles.threejsContainer}>
              {files.length > 0 && (
                <>
                  <p>Sending VRM files to viewer:</p>
                  {files.map((file, index) => (
                    <p key={index}>{file?.name}</p>
                  ))}
                  <VrmViewer vrmFiles={files} />
                </>
              )}
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

        <label className={styles.fileInputLabel} htmlFor="nftImage">Upload Image</label>
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
        <label className={styles.fileInputLabel} htmlFor="replaceImage">Replace Image in VRM</label>
        <input
          id="replaceImage"
          className={styles.fileInput}
          type="file"
          accept="image/*"
          onChange={handleReplaceImage}
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
