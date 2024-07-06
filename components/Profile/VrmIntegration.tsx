"use client";

import React, { useEffect, useRef, useState } from 'react';
import styles from '@/components/AccountGroup/Social.module.css';
import { Chain, prepareContractCall, resolveMethod } from 'thirdweb';
import { MediaRenderer, TransactionButton, useActiveAccount, useSendTransaction } from 'thirdweb/react';
import { ChattApp, NETWORK } from '@/const/contracts';
import client from '@/lib/client';
import { upload } from 'thirdweb/storage';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import VrmViewer from "@/components/AccountGroup/VrmViewer";
import { findChildrenByType, getMaterialsSortedByArray } from "../../library/utils";

import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { VRM, VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm';

interface ModalGroupAccountProps {
  onClose: () => void;
  isVisible: boolean;
}

export type UserAccount = {
  userName: string;
  address: string;
  chain: Chain;
  type: "male" | "female";
  title?: string;
  name?: string;
  age?: string;
  thumbnailUrl?: string;
  explorer?: string;
  deliveryAddress?: DeliveryData;
  twitter?: string;
  telegram?: string;
  website?: string;
};

export type DeliveryData = {
  street: string;
  houseNumber: string;
  postcode: string;
  city: string;
  country: string;
};

const Modal: React.FC<ModalGroupAccountProps> = ({ onClose, isVisible }) => {
  const [nftName, setNftName] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  const [userType, setUserType] = useState<"male" | "female">("male");
  const [title, setTitle] = useState<string>("");
  const [age, setAge] = useState<string>("");
  const [thumbnailUrl, setThumbnailUrl] = useState<string>("");
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>("");
  const [explorer, setExplorer] = useState<string>("");
  const [deliveryAddress, setDeliveryAddress] = useState<DeliveryData>({
    street: "",
    houseNumber: "",
    postcode: "",
    city: "",
    country: ""
  });
  const [twitter, setTwitter] = useState<string>("");
  const [telegram, setTelegram] = useState<string>("");
  const [website, setWebsite] = useState<string>("");
  const [transactionError, setTransactionError] = useState<string | null>(null);
  const [ipfsLink, setIpfsLink] = useState<string | null>(null);
  const { mutate: sendTransaction } = useSendTransaction();
  const account = useActiveAccount();
  const [vrmFile, setVrmFile] = useState<File | null>(null);
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const vrmModelRef = useRef<VRM | null>(null);
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [vrmMetadata, setVrmMetadata] = useState<any>(null);
  const [vrmHumanoid, setVrmHumanoid] = useState<any>(null);
  const [vrmExpressions, setVrmExpressions] = useState<any>(null);
  const [vrmSecondaryAnimation, setVrmSecondaryAnimation] = useState<any>(null);

  const handleDeliveryAddressChange = (field: keyof DeliveryData, value: string) => {
    setDeliveryAddress(prevState => ({
      ...prevState,
      [field]: value
    }));
  };

  useEffect(() => {
    if (vrmFile) {
      const url = URL.createObjectURL(vrmFile);
      const loader = new GLTFLoader();
      loader.register(parser => new VRMLoaderPlugin(parser));
      loader.load(
        url,
        (gltf) => {
          const vrm = gltf.userData.vrm;
          VRMUtils.rotateVRM0(vrm);
          setName(vrmFile.name);
          setFiles(prevFiles => [...prevFiles, vrmFile]);

          // Set the VRM metadata for display
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

          // Log extracted information for debugging
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

        setUploadedImageUrl(URL.createObjectURL(file)); // Display the selected file
        setVrmFile(file); // Set the VRM file for the viewer
      } catch (error) {
        console.error("Error uploading file:", error);
      }
    }
  };

  const prepareTransaction = async () => {
    const resolvedMethod = await resolveMethod("mintTo");

    if (!resolvedMethod) {
      throw new Error("Failed to resolve method");
    }

    const userAccount: UserAccount = {
      userName,
      address: account?.address || "",
      chain: NETWORK, // Replace with the appropriate chain
      type: userType,
      title,
      name: nftName,
      age,
      thumbnailUrl,
      explorer,
      deliveryAddress,
      twitter,
      telegram,
      website,
    };

    // Create the metadata object
    const metadataObject = {
      name: "ioPlasmaVerse Unique Username Account",
      description: "ioPlasmaVerse is leveraging NFT technology to build an active community for open-source development, aiming to create a more connected world",
      image: thumbnailUrl, // Use the uploaded IPFS URL
      attributes: userAccount,
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
        contract: ChattApp,
        method: resolvedMethod,
        params: [
          account?.address,
          ipfsUrl, // Use the IPFS metadata URL
          userName, // Passing the username as the third parameter
        ],
      });
    } catch (error) {
      console.error("Error uploading metadata:", error);
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
    setTransactionError(error.message);
  };

  return (
    <div>
      <div className={styles.statusModalHeader}>
        <h2>Create Your Avatar on PlasmaVerse</h2>
      </div>
      <input
        className={styles.inputField}
        type="text"
        placeholder="Enter your Username"
        value={userName}
        onChange={(e) => setUserName(e.target.value)}
      />
      <div className={styles.fileInputContainer}>
        <label className={styles.fileInputLabel} htmlFor="vrmFile">Upload VRM File</label>
        <input
          id="vrmFile"
          className={styles.fileInput}
          type="file"
          onChange={handleFileChange}
        />
      </div>
      <div className={styles.threejsContainer}>
        {vrmFile && <VrmViewer vrmFile={vrmFile} />}
      </div>
      {ipfsLink && (
        <div>
          <p>IPFS Link: <a href={ipfsLink} target="_blank" rel="noopener noreferrer">{ipfsLink}</a></p>
        </div>
      )}

      {vrmMetadata && (
        <div>
          <h3>VRM Metadata</h3>
          <ul>
            <li><strong>Title:</strong> {vrmMetadata.title}</li>
            <li><strong>Version:</strong> {vrmMetadata.version}</li>
            <li><strong>Author:</strong> {vrmMetadata.author}</li>
            <li><strong>Contact Information:</strong> {vrmMetadata.contactInformation || 'N/A'}</li>
            <li><strong>Reference:</strong> {vrmMetadata.reference || 'N/A'}</li>
            <li><strong>Allowed User Name:</strong> {vrmMetadata.allowedUserName}</li>
            <li><strong>Violent Usage:</strong> {vrmMetadata.violentUssageName}</li>
            <li><strong>Sexual Usage:</strong> {vrmMetadata.sexualUssageName}</li>
            <li><strong>Commercial Usage:</strong> {vrmMetadata.commercialUssageName}</li>
            <li><strong>License:</strong> {vrmMetadata.licenseName}</li>
            <li><strong>Other License URL:</strong> {vrmMetadata.otherLicenseUrl || 'N/A'}</li>
            <li><strong>Other Permission URL:</strong> {vrmMetadata.otherPermissionUrl}</li>
          </ul>
        </div>
      )}

      {vrmHumanoid && (
        <div>
          <h3>VRM Humanoid</h3>
          <p>Auto Update Human Bones: {vrmHumanoid.autoUpdateHumanBones.toString()}</p>
          <p>Raw Human Bones Count: {Object.keys(vrmHumanoid._rawHumanBones.humanBones).length}</p>
          <p>Normalized Human Bones Count: {Object.keys(vrmHumanoid._normalizedHumanBones.humanBones).length}</p>
        </div>
      )}

      {vrmExpressions && (
        <div>
          <h3>VRM Expressions</h3>
          <p>Blink Expressions: {vrmExpressions.blinkExpressionNames.join(', ')}</p>
          <p>Look At Expressions: {vrmExpressions.lookAtExpressionNames.join(', ')}</p>
          <p>Mouth Expressions: {vrmExpressions.mouthExpressionNames.join(', ')}</p>
        </div>
      )}

      <div className={styles["traitInfoTitle"]}>Geometry info:</div>
      <div className={styles["traitInfoText"]}>Meshes: {meshQty}</div>
      <div className={styles["traitInfoText"]}>SkinnedMeshes: {skinnedMeshQty}</div>
      <div className={styles["traitInfoText"]}>Triangles: {trianglesCount}</div>
      <div className={styles["traitInfoText"]}>Bones: {bonesCount}</div>

      <div className={styles["traitInfoTitle"]}>Standard Material Count:</div>
      <div className={styles["traitInfoText"]}>Opaque: {standardMaterialQty}</div>
      <div className={styles["traitInfoText"]}>Cutout: {standardCutoutMaterialQty}</div>
      <div className={styles["traitInfoText"]}>Transparent: {standardTranspMaterialQty}</div>

      <div className={styles["traitInfoTitle"]}>MToon Material Count:</div>
      <div className={styles["traitInfoText"]}>Opaque: {vrmMaterialQty}</div>
      <div className={styles["traitInfoText"]}>Cutout: {vrmCutoutMaterialQty}</div>
      <div className={styles["traitInfoText"]}>Transparent: {vrmTranspMaterialQty}</div>
    </div>
  );
};

export default Modal;
