"use client";

import React, { useState } from 'react';
import styles from "../UserInterAction/Social.module.css";
import { Chain, prepareContractCall, resolveMethod } from 'thirdweb';
import { TransactionButton, useActiveAccount, useSendTransaction } from 'thirdweb/react';
import { ChattApp, NETWORK } from '@/const/contracts';
import client from '@/lib/client';
import { upload } from 'thirdweb/storage';

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
  country?: string;
  thumbnailUrl?: string;
  explorer?: string;
  deliveryAddress?: DeliveryData;
  twitter?: string;
  telegram?: string;
  website?: string;
  favoriteProjects?: Project[];
};

export type DeliveryData = {
  street: string;
  houseNumber: string;
  postcode: string;
  city: string;
  country: string;
};

export type Project = {
  name: string;
  url: string;
};

export type UploadedFile = {
  file: File | null;
  url: string;
  type: string;
  description: string;
};

const ModalCreateAccount: React.FC<ModalGroupAccountProps> = ({ onClose, isVisible }) => {
  const [userName, setUserName] = useState<string>("");
  const [userType, setUserType] = useState<"male" | "female">("male");
  const [title, setTitle] = useState<string>("");
  const [age, setAge] = useState<string>("");
  const [name, setName] = useState<string>("");

  const [thumbnailUrl, setThumbnailUrl] = useState<string>("");
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
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  const [country, setCountry] = useState<string>("");
  const [projects, setProjects] = useState<Project[]>([{ name: "", url: "" }]);
  const [transactionError, setTransactionError] = useState<string | null>(null);
  const { mutate: sendTransaction } = useSendTransaction();
  const account = useActiveAccount();

  const handleDeliveryAddressChange = (field: keyof DeliveryData, value: string) => {
    setDeliveryAddress(prevState => ({
      ...prevState,
      [field]: value
    }));
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>, index: number) => {
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
        const updatedFiles = [...uploadedFiles];
        updatedFiles[index] = { file, url: URL.createObjectURL(file), type: file.type, description: "" };
        setUploadedFiles(updatedFiles);
        setThumbnailUrl(ipfsUrl); // Use the IPFS URL
        console.log("NewFile Data, ", ipfsUrl);
      } catch (error) {
        console.error("Error uploading file:", error);
      }
    }
  };

  const handleFileDescriptionChange = (index: number, value: string) => {
    const updatedFiles = [...uploadedFiles];
    updatedFiles[index].description = value;
    setUploadedFiles(updatedFiles);
  };

  const addNewFile = () => {
    setUploadedFiles([...uploadedFiles, { file: null, url: "", type: "", description: "" }]);
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
      name,
      age,
      country,
      thumbnailUrl,
      deliveryAddress,
      twitter,
      telegram,
      website,
      favoriteProjects: projects.map(project => ({
        ...project,
        url: formatURL(project.url)
      })),
    };

    // Create the metadata object
    const metadataObject = {
      name: "ioPlasmaVerse Unique Username Account",
      description: "ioPlasmaVerse is leveraging NFT technology to build an active community for open-source development, aiming to create a more connected world",
      image: "ipfs://QmRb86GTY6i2dVLkNrEKUzEte9GrQucDF2YLVioSTnoT7c/PlasmaWorld.png", // Use the uploaded image URL
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

  const handleWebsiteChange = (value: string) => {
    setWebsite(formatURL(value));
  };

  const handleProjectChange = (index: number, field: keyof Project, value: string) => {
    const updatedProjects = projects.map((project, i) => (
      i === index ? { ...project, [field]: value } : project
    ));
    setProjects(updatedProjects);
  };

  const addNewProject = () => {
    setProjects([...projects, { name: "", url: "" }]);
  };

  const formatURL = (url: string): string => {
    if (!url.startsWith("https://")) {
      if (url.startsWith("http://")) {
        return url.replace("http://", "https://");
      }
      return "https://" + url;
    }
    return url;
  };

  return (
    isVisible && (
      <div className={styles.socialPostCreator}>
        <button 
                        onClick={onClose} 
                        className={styles.buttonClose}
                    >
                        &times;
                    </button>
        {uploadedFiles.length > 0 && (
          <div>
            <p>Uploaded Files Preview:</p>
            {uploadedFiles.map((file, index) => (
              <div key={index}>
                {file.type.startsWith('image/') && <img src={file.url} alt={`Uploaded file ${index}`} className={styles.uploadedFilePreview} />}
                {file.type.startsWith('video/') && <video src={file.url} controls className={styles.uploadedFilePreview} />}
                <input
                  className={styles.inputField}
                  type="text"
                  value={file.description}
                  onChange={(e) => handleFileDescriptionChange(index, e.target.value)}
                  placeholder="Enter file description"
                />
              </div>
            ))}
          </div>
        )}
        <div className={styles.statusModalContainer}>
          <div className={styles.statusModal}>
          
            <div className={styles.statusModalHeader}>
              <h2>Create Your Chat Account on PlasmaVerse</h2>
              <p>
                To create an account, simply enter your username. The other inputs are optional and allow you to share additional social information if you wish. For your safety, never use your real address for deliveries; use a package store instead. Please bevore transfering the Nft or set this on the Market set the Metadata to null.
              </p>
            </div>
            <input
              className={styles.inputField}
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Enter your Username"
              required
            />
            <input
              className={styles.inputField}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter Title of your Profile"
            />
            <input
              className={styles.inputField}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your Name"
            />
            <input
              className={styles.inputField}
              type="text"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="Enter your Age"
            />
            <input
              className={styles.inputField}
              type="text"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="Which Country are you from?"
            />

          <h3>File input (add videos or images from you, your Projekts or anything you want to share with others )</h3>

            {uploadedFiles.map((file, index) => (
              <div key={index} className={styles.fileInputContainer}>
                <input
                  className={styles.inputField}
                  type="file"
                  onChange={(e) => handleFileChange(e, index)}
                  placeholder="Upload File"
                />
                <input
                  className={styles.inputField}
                  type="text"
                  value={file.description}
                  onChange={(e) => handleFileDescriptionChange(index, e.target.value)}
                  placeholder="Enter File Description"
                />
              </div>
            ))}
            <button onClick={addNewFile} className={styles.addButton}>Add More Files</button>
            <div className={styles.deliveryAddressContainer}>
              <h3>Delivery Address (Use a Package Store for Privacy)</h3>
              <input
                className={styles.inputField}
                type="text"
                value={deliveryAddress.street}
                onChange={(e) => handleDeliveryAddressChange("street", e.target.value)}
                placeholder="Street"
              />
              <input
                className={styles.inputField}
                type="text"
                value={deliveryAddress.houseNumber}
                onChange={(e) => handleDeliveryAddressChange("houseNumber", e.target.value)}
                placeholder="House Number"
              />
              <input
                className={styles.inputField}
                type="text"
                value={deliveryAddress.postcode}
                onChange={(e) => handleDeliveryAddressChange("postcode", e.target.value)}
                placeholder="Postcode"
              />
              <input
                className={styles.inputField}
                type="text"
                value={deliveryAddress.city}
                onChange={(e) => handleDeliveryAddressChange("city", e.target.value)}
                placeholder="City"
              />
              <input
                className={styles.inputField}
                type="text"
                value={deliveryAddress.country}
                onChange={(e) => handleDeliveryAddressChange("country", e.target.value)}
                placeholder="Country"
              />
            </div>
            <h3>Projects Input (enter the Projects you want to share with other People)</h3>
            {projects.map((project, index) => (
              <div key={index} className={styles.projectInputContainer}>
                <input
                  className={styles.inputField}
                  type="text"
                  value={project.name}
                  onChange={(e) => handleProjectChange(index, "name", e.target.value)}
                  placeholder="Enter Project Name"
                />
                <input
                  className={styles.inputField}
                  type="text"
                  value={project.url}
                  onChange={(e) => handleProjectChange(index, "url", e.target.value)}
                  placeholder="Enter Project URL"
                />
              </div>
            ))}
            <button onClick={addNewProject} className={styles.addButton}>Add More Projects</button>
            <div>
              <h3>Social Input (to easily interact with other users and trade with them, we recommend adding Telegram)</h3>
              <input
                className={styles.inputField}
                type="text"
                value={twitter}
                onChange={(e) => setTwitter(e.target.value)}
                placeholder="Enter Twitter Handle"
              />
              <input
                className={styles.inputField}
                type="text"
                value={telegram}
                onChange={(e) => setTelegram(e.target.value)}
                placeholder="Enter Telegram Handle"
              />
              <select
                className={styles.selectField}
                value={userType}
                onChange={(e) => setUserType(e.target.value as "male" | "female")}
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
            <div>
              <input
                className={styles.inputField}
                type="text"
                value={website}
                onChange={(e) => handleWebsiteChange(e.target.value)}
                placeholder="Enter Website URL"
              />
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
        </div>
      </div>
    )
  );
};

export default ModalCreateAccount;
