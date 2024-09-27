import React, { useEffect, useRef, useState } from 'react';
import { Canvas, useThree, extend, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { MediaRenderer, TransactionButton, useActiveAccount, useSendTransaction } from 'thirdweb/react';
import { Chain, defineChain, getContract, prepareContractCall, resolveMethod, ThirdwebContract } from 'thirdweb';
import client from '@/lib/client';
import { upload } from 'thirdweb/storage';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { applyTextureToVRM } from '@/components/AccountGroup/create-texture-atlas';
import styles from '@/components/MintApp/Mint2.module.css';
import { combine } from '@/library/merge-geometry';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import VRMExporter from '@/library/VRMExporter';
import { getAtlasSize } from "@/library/utils"


extend({ OrbitControls });

const CameraControls = () => {
  const { camera, gl: { domElement } } = useThree();
  const controlsRef = useRef();

  useFrame(() => controlsRef.current.update());

  return <orbitControls ref={controlsRef} args={[camera, domElement]} />;
};

const AvatarMintDrophunter = () => {
  const cameraRef = useRef(new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000));
  const sceneRef = useRef(new THREE.Scene());
  const avatarRef = useRef(new THREE.Group());
  const [accessories, setAccessories] = useState(null);
  const [body, setBody] = useState('/character-assets/drophunter/body/drophunter.vrm');
  const [chest, setChest] = useState(null);
  const [eyes, setEyes] = useState(null);
  const [feet, setFeet] = useState(null);
  const [head, setHead] = useState(null);
  const [legs, setLegs] = useState(null);
  const [outer, setOuter] = useState(null);
  const [vrmLoaded, setVrmLoaded] = useState(false);
  const [manifest, setManifest] = useState(null);
  const [imageMap, setImageMap] = useState({});
  const [overrideMap, setOverrideMap] = useState([]);
  const basePath = "/character-assets/drophunter/";
  const account = useActiveAccount();
  const [name, setName] = useState("");
  const [vrm_url, setVrmUrl] = useState("");
  const [attributes, setAttributes] = useState([{ trait_type: '', value: '' }]);
  const [vrmHumanoid, setVrmHumanoid] = useState(null);
  const [vrmExpressions, setVrmExpressions] = useState(null);
    const [lookAt, setVrmLookAt] = useState(0);
  const [mediaPreview, setMediaPreview] = useState({ url: "", type: "" });
  const [mediaPreviewVideo, setMediaPreviewVideo] = useState({ url: "", type: "" });
  const [nftDescription, setNftDescription] = useState("");
  const [nftName, setNftName] = useState("");

  const [selectedCategory, setSelectedCategory] = useState('accessories');
  const [activeTab, setActiveTab] = useState('vrm');

  const NETWORK = defineChain(4689);
  
  const contract = getContract({
    address: "0x1b7AAb1973F352886117A5C3fCD51866d1beA0DD",
    client,
    chain: NETWORK,
  });


  

  const loadManifest = async () => {
    try {
      const response = await fetch(`${basePath}manifest.json`);
      if (!response.ok) {
        throw new Error(`Failed to fetch manifest. Status: ${response.status}`);
      }
      const data = await response.json();
  
      const mappedImages = data.traits.reduce((acc, trait) => {
        acc[trait.trait] = trait.collection.map((item, index) => {
          const thumbnailPath = `${basePath}${item.directory.replace('.vrm', '')}.png`.replace(/^\.\//, '/');
          const directoryPath = `${basePath}${item.directory}`.replace(/^\.\//, '/');
          
          return {
            key: `${trait.trait}-${index}`,
            name: item.name,
            thumbnail: thumbnailPath,
            directory: directoryPath,
            overrides: item.thumbnailOverrides || [],
            textureCollection: item.textureCollection || null, // Include the texture collection reference
          };
        });
        return acc;
      }, {});
  
      // Store both traits and textureCollections in the manifest state
      setManifest({
        traits: data.traits,
        textureCollections: data.textureCollections || [] // Include textureCollections from the manifest
      });
  
      setImageMap(mappedImages);
      console.log('Manifest loaded:', data);
      console.log('Image map constructed from manifest:', mappedImages);
  
    } catch (error) {
      console.error('Error loading manifest:', error);
    }
  };

  const applyTextureOverride = async (category, overrideThumbnail) => {
    console.log(`Applying texture override for category: ${category}, overrideThumbnail: ${overrideThumbnail}`);

    const trait = manifest.traits.find(t => t.trait === category);
    if (!trait) {
        console.error(`Trait not found for category: ${category}`);
        return;
    }

    const selectedItem = trait.collection.find(item => 
        item.thumbnailOverrides.includes(overrideThumbnail)
    );
    if (!selectedItem) {
        console.error(`Selected item not found for override thumbnail: ${overrideThumbnail}`);
        return;
    }

    const textureCollection = manifest.textureCollections.find(t => t.trait === selectedItem.textureCollection);
    if (!textureCollection) {
        console.error(`Texture collection not found for: ${selectedItem.textureCollection}`);
        return;
    }

    const textureIndex = selectedItem.thumbnailOverrides.indexOf(overrideThumbnail);
    if (textureIndex === -1) {
        console.error(`No matching thumbnail override found for ${overrideThumbnail}`);
        return;
    }

    const texturePaths = Array.isArray(textureCollection.collection[textureIndex].directory)
        ? textureCollection.collection[textureIndex].directory
        : [textureCollection.collection[textureIndex].directory];

    console.log('Selected Item:', selectedItem);
    console.log('Texture Collection:', textureCollection);
    console.log('Texture Paths:', texturePaths);

    const vrm = getVrmByCategory(category);

    if (vrm) {
        const textureLoader = new THREE.TextureLoader();

        vrm.scene.traverse((child) => {
            if (child.isMesh) {
                let texturePath = null;

                // Special handling for body with 2 textures
                if (category === 'body' && texturePaths.length === 2) {
                    if (child.name === 'body_geo') {
                        texturePath = texturePaths[0];
                    } else if (child.name === 'head_geobaked(copy)') {
                        texturePath = texturePaths[1];
                    }
                } else if (texturePaths.length === 1) {
                    // Single texture case
                    texturePath = texturePaths[0];
                }

                if (texturePath) {
                    const fullTexturePath = `${basePath}${texturePath}`.replace(/\/+/g, '/');
                    console.log(`Loading texture from: ${fullTexturePath}`);

                    textureLoader.load(fullTexturePath, async (texture) => {
                        await applyTextureToVRM({
                            vrm: vrm,
                            texturePath: fullTexturePath,
                            meshName: child.name
                        });
                        console.log(`Texture applied to mesh: ${child.name}`);
                        sceneRef.current.needsUpdate = true;
                    }, undefined, (error) => {
                        console.error(`Error loading texture: ${fullTexturePath}`, error);
                    });
                }
            }
        });
    } else {
        console.error(`VRM not found for category: ${category}`);
    }
};




// Helper function to get the VRM by category
const getVrmByCategory = (category) => {
    switch (category) {
        case 'accessories': return accessories;
        case 'body': return body;
        case 'chest': return chest;
        case 'eyes': return eyes;
        case 'feet': return feet;
        case 'head': return head;
        case 'legs': return legs;
        case 'outer': return outer;
        default: return null;
    }
};


  const getVrmForImage = async (imageUrl, category) => {
    console.log(`Searching for VRM for image: ${imageUrl}, category: ${category}`);

    if (!manifest) {
        console.error('Manifest is not loaded yet');
        return null;
    }

    const trait = manifest.traits.find(t => t.trait === category);
    if (!trait) {
        console.error(`Category ${category} not found in the manifest`);
        return null;
    }

    const imageFileName = imageUrl.split('/').pop();
    console.log(`Looking for image file name: ${imageFileName}`);
    const selectedItem = trait.collection.find(item => item.thumbnail.endsWith(imageFileName));
    
    if (!selectedItem) {
        console.error(`Image ${imageFileName} not found in category ${category}`);
        return null;
    }

    const vrmPath = `${basePath}${selectedItem.directory}`.replace(/\/+/g, '/');
    console.log(`Fetching VRM from ${vrmPath}`);

    try {
        const response = await fetch(vrmPath);
        if (!response.ok) {
            console.error(`Failed to fetch VRM from ${vrmPath}. Status: ${response.status}`);
            return null;
        }
        const blob = await response.blob();
        return new File([blob], `${category}.vrm`, { type: blob.type });
    } catch (error) {
        console.error('Error fetching VRM:', error);
        return null;
    }
};

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    setOverrideMap([]);
  };

  const handlePrevCategory = () => {
    const categories = Object.keys(imageMap);
    const currentIndex = categories.indexOf(selectedCategory);
    const prevIndex = (currentIndex - 1 + categories.length) % categories.length;
    setSelectedCategory(categories[prevIndex]);
    setOverrideMap([]);
  };

  const handleNextCategory = () => {
    const categories = Object.keys(imageMap);
    const currentIndex = categories.indexOf(selectedCategory);
    const nextIndex = (currentIndex + 1) % categories.length;
    setSelectedCategory(categories[nextIndex]);
    setOverrideMap([]);
  };

  const handleImageSelect = async (category, imageUrl) => {
    try {
        console.log(`Image selected: ${imageUrl} for category: ${category}`);
        const vrmFile = await getVrmForImage(imageUrl, category);

        if (vrmFile) {
            const loader = new GLTFLoader();
            loader.register(parser => new VRMLoaderPlugin(parser));

            loader.load(
                URL.createObjectURL(vrmFile),
                (gltf) => {
                    const vrm = gltf.userData.vrm;
                    VRMUtils.rotateVRM0(vrm);

                    // Handle the specific category
                    switch (category) {
                        case 'accessories':
                            if (accessories) {
                                disposeVrm(accessories);
                                avatarRef.current.remove(accessories.scene);
                            }
                            setAccessories(vrm);
                            break;
                        case 'body':
                            if (body) {
                                disposeVrm(body);
                                avatarRef.current.remove(body.scene);
                            }
                            setBody(vrm);
                            break;
                        case 'chest':
                            if (chest) {
                                disposeVrm(chest);
                                avatarRef.current.remove(chest.scene);
                            }
                            setChest(vrm);
                            break;
                        case 'eyes':
                            if (eyes) {
                                disposeVrm(eyes);
                                avatarRef.current.remove(eyes.scene);
                            }
                            setEyes(vrm);
                            break;
                        case 'feet':
                            if (feet) {
                                disposeVrm(feet);
                                avatarRef.current.remove(feet.scene);
                            }
                            setFeet(vrm);
                            break;
                        case 'head':
                            if (head) {
                                disposeVrm(head);
                                avatarRef.current.remove(head.scene);
                            }
                            setHead(vrm);
                            break;
                        case 'legs':
                            if (legs) {
                                disposeVrm(legs);
                                avatarRef.current.remove(legs.scene);
                            }
                            setLegs(vrm);
                            break;
                        case 'outer':
                            if (outer) {
                                disposeVrm(outer);
                                avatarRef.current.remove(outer.scene);
                            }
                            setOuter(vrm);
                            break;
                        default:
                            console.warn(`Unhandled category: ${category}`);
                            break;
                    }

                    // Add the new VRM scene to the avatar and scene
                    avatarRef.current.add(vrm.scene);
                    sceneRef.current.add(avatarRef.current);
                    console.log(`Added VRM to scene for category: ${category}`);

                    // Optionally apply overrides if applicable
                    const selectedItem = imageMap[category].find(item => item.thumbnail === imageUrl);
                    if (selectedItem && selectedItem.overrides.length > 0) {
                        setOverrideMap(selectedItem.overrides);
                        // Initially apply the first override or leave it for user selection
                    }
                },
                undefined,
                (error) => {
                    console.error(`Error loading VRM file for category: ${category}`, error);
                }
            );
        }
    } catch (error) {
        console.error('Error in handleImageSelect:', error);
    }
};

// Helper function to dispose of VRM resources
const disposeVrm = (vrm) => {
    if (vrm && vrm.scene) {
        vrm.scene.traverse((child) => {
            if (child.isMesh) {
                child.geometry.dispose();
                if (Array.isArray(child.material)) {
                    child.material.forEach((material) => {
                        if (material.map) material.map.dispose();
                        material.dispose();
                    });
                } else {
                    if (child.material.map) child.material.map.dispose();
                    child.material.dispose();
                }
            }
        });
    }
};

  useEffect(() => {
    loadManifest();

    if (cameraRef.current) {
      cameraRef.current.position.set(0, 1.4, 5);
    }

    sceneRef.current.add(avatarRef.current);

    const loader = new GLTFLoader();
    loader.register((parser) => new VRMLoaderPlugin(parser));

    loader.load(
      body,
      (gltf) => {
        const vrm = gltf.userData.vrm;
        VRMUtils.rotateVRM0(vrm);
        avatarRef.current.add(vrm.scene);
        setVrmLoaded(true);
      },
      undefined,
      (error) => console.error('Error loading base VRM file:', error)
    );
  }, []);

  const handleFileChange = async (event) => {
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

const handleChange = async (event) => {
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

const handleMediaChangeVideo = async (event) => {
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

// Helper function to generate the GLB and VRM files
const getModelFromScene = async (avatarScene, format = 'glb', options = {}) => {
  const {
    skinColor = new THREE.Color(1, 1, 1), // Default to white color if not provided
    scale = 1,
  } = options;

  if (!avatarScene) {
    console.error('Avatar scene is not defined');
    return null;
  }

  if (format === 'glb') {
    const exporter = new GLTFExporter();
    const exportOptions = {
      trs: false,
      onlyVisible: true,
      truncateDrawRange: true,
      binary: true,
      forcePowerOfTwoTextures: false,
      maxTextureSize: 1024 || Infinity,
    };

    try {
      const avatar = await combine({
        avatar: avatarScene,
        scale: scale,
        transparentColor: skinColor, // Pass skinColor as part of combine options
      });

      const glb = await new Promise((resolve, reject) =>
        exporter.parse(
          avatar,
          (result) => resolve(result),
          (error) => {
            console.error('Error getting model', error);
            reject(error);
          },
          exportOptions
        )
      );
      return new Blob([glb], { type: 'model/gltf-binary' });
    } catch (error) {
      console.error('Error in combine function:', error);
      return null;
    }
  } else if (format === 'vrm') {
    const exporter = new VRMExporter();
    try {
      const vrm = await new Promise((resolve, reject) =>
        exporter.parse(
          avatarScene,
          (result) => resolve(result),
          (error) => {
            console.error('Error exporting VRM', error);
            reject(error);
          }
        )
      );
      return new Blob([vrm], { type: 'model/gltf-binary' });
    } catch (error) {
      console.error('Error exporting VRM:', error);
      return null;
    }
  } else {
    console.error('Invalid format');
    return null;
  }
};

const prepareTransaction = async () => {
  try {
    console.log("Preparing transaction...");

    // Step 1: Collect all VRMs (ensure they are loaded and defined)
    console.log("Step 1: Collecting VRMs...");
    const vrmComponents = { body, chest, eyes, feet, head, legs, outer, accessories };
    const vrms = Object.entries(vrmComponents).filter(([key, vrm]) => vrm && vrm.scene);

    if (vrms.length === 0) {
      throw new Error("No VRM components selected. Aborting transaction preparation.");
    }

    console.log(`Collected ${vrms.length} valid VRM components: ${vrms.map(([key]) => key).join(', ')}`);

    // Step 2: Initialize and Merge VRMs
    console.log("Step 2: Merging VRMs...");
    const avatarGroup = new THREE.Group();

    vrms.forEach(([key, vrm]) => {
      const clonedScene = vrm.scene.clone();
      initializeMaterials(clonedScene, vrm);  // Ensure all materials are properly initialized
      avatarGroup.add(clonedScene);
    });

    // Step 3: Define combineOptions
    const materialsCount = vrms.reduce((count, [, vrm]) => count + (vrm.materials ? vrm.materials.length : 0), 0);
    const twoSidedMaterial = vrms.some(([, vrm]) => vrm.materials.some(material => material.side === THREE.DoubleSide));
    const isVrm0 = vrms.some(([key, vrm]) => key === 'body' && vrm.meta?.version === '0');

    // Calculate atlas sizes based on materials count (assuming more materials may require larger atlases)
    const atlasStd = Math.max(6, Math.ceil(materialsCount / 10));
    const atlasStdTransp = atlasStd;
    const atlasMtoon = Math.max(6, Math.ceil(materialsCount / 10));
    const atlasMtoonTransp = atlasMtoon;

    // Determine export options based on what makes sense for the VRMs
    const exportMtoonAtlas = true;
    const exportStdAtlas = true;

    const combineOptions = {
      scale: 1,
      transparentColor: new THREE.Color(1, 1, 1),
      mToonAtlasSize: getAtlasSize(atlasMtoon),
      mToonAtlasSizeTransp: getAtlasSize(atlasMtoonTransp),
      stdAtlasSize: getAtlasSize(atlasStd),
      stdAtlasSizeTransp: getAtlasSize(atlasStdTransp),
      exportMtoonAtlas,
      exportStdAtlas,
      twoSidedMaterial,
      isVrm0,
    };

    // Using the combine function
    const mergedAvatar = await combine(avatarGroup, combineOptions);
    console.log("VRMs successfully merged.");

    // Manually transfer VRM data from one of the source VRMs (e.g., `body`)
    if (body && mergedAvatar) {
      mergedAvatar.vrm = {
        humanoid: body.humanoid,
        expressionManager: body.expressionManager,
        meta: body.meta,
        lookAt: body.lookAt,
        materials: body.materials,
      };
    }

    console.log("Merged Avatar VRM:", mergedAvatar.vrm);
    console.log("Expression Manager in Merged Avatar:", mergedAvatar.vrm?.expressionManager);
    console.log("Expression Map in Merged Avatar:", mergedAvatar.vrm?.expressionManager?._expressionMap);

    // Step 4: Ensure all materials in the merged avatar have defined normalMap
    mergedAvatar.traverse((child) => {
      if (child.isMesh && child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach((material) => {
            material.normalMap = material.normalMap || null;
          });
        } else {
          child.material.normalMap = child.material.normalMap || null;
        }
      }
    });
    console.log("Material normalMap initialization complete.");

    // Step 5: Exporting merged avatar to GLTF with VRM Data
    console.log("Step 5: Exporting merged avatar to GLTF with VRM Data...");
    const gltfBlob = await new Promise((resolve, reject) => {
      const exporter = new GLTFExporter();
      exporter.parse(
        mergedAvatar,
        (gltf) => resolve(new Blob([gltf], { type: 'model/gltf-binary' })),
        (error) => reject(error)
      );
    });

    const Gltffile = new File([gltfBlob], `${nftName || 'avatar'}.glb`, { type: 'model/gltf-binary' });

    // Step 6: Upload the GLTF file to IPFS
    console.log("Step 6: Uploading merged GLTF file to IPFS...");
    const mergedUriGlbt = await upload({ client, files: [Gltffile] });
    if (!mergedUriGlbt || mergedUriGlbt.length === 0) {
      throw new Error("Failed to upload merged GLTF to IPFS");
    }
    const gltfIpfsUrl = `${mergedUriGlbt}`;

    // Step 7: Export the merged avatar to a VRM file
    console.log("Step 7: Exporting merged avatar to VRM...");
    const vrmBlob = await exportToVRM(mergedAvatar, body);
    const file = new File([vrmBlob], `${nftName || 'avatar'}.vrm`, { type: 'application/octet-stream' });
    console.log("Exporting merged avatar to VRM..., ", file);

    // Step 8: Upload the merged VRM file to IPFS
    console.log("Step 8: Uploading merged VRM file to IPFS...");
    const mergedUri = await upload({ client, files: [file] });
    if (!mergedUri || mergedUri.length === 0) {
      throw new Error("Failed to upload merged VRM to IPFS");
    }
    const vrmIpfsUrl = `${mergedUri}`;
    setVrmUrl(vrmIpfsUrl);
    console.log(`Merged VRM successfully uploaded to IPFS: ${vrmIpfsUrl}`);

    // Step 9: Prepare the metadata for the NFT
    console.log("Step 9: Preparing NFT metadata...");
    const metadataObject = {
      name: nftName,
      description: nftDescription,
      image: mediaPreview.url,
      animation_url: mediaPreviewVideo.url,
      vrm_url: vrmIpfsUrl,
      gltf_url: gltfIpfsUrl,
      attributes: attributes,
    };
    const metadataString = JSON.stringify(metadataObject, null, 2);
    const metadataBlob = new Blob([metadataString], { type: 'application/json' });
    const metadataFile = new File([metadataBlob], 'metadata.json');

    // Step 10: Upload the metadata to IPFS
    console.log("Step 10: Uploading metadata to IPFS...");
    const metadataUri = await upload({ client, files: [metadataFile] });
    if (!metadataUri || metadataUri.length === 0) {
      throw new Error("Failed to upload metadata to IPFS");
    }
    const ipfsUrl = `${metadataUri}`;
    console.log(`Metadata successfully uploaded to IPFS: ${ipfsUrl}`);

    // Step 11: Prepare the contract call for minting
    console.log("Step 11: Preparing contract call for minting...");
    const resolvedMethod = await resolveMethod("mintTo");
    if (!resolvedMethod) {
      throw new Error("Failed to resolve method");
    }

    console.log("Transaction prepared successfully. Ready to mint NFT.");
    return prepareContractCall({
      contract: contract,
      method: resolvedMethod,
      params: [account?.address, ipfsUrl,""],
    });

  } catch (error) {
    console.error("Error in prepareTransaction:", error);
    throw error;
  }
};

// Ensure VRM data export
const exportToVRM = async (scene, vrm) => {
  return new Promise((resolve, reject) => {
    try {
      const exporter = new VRMExporter();

      if (!scene || !vrm) {
        throw new Error("Invalid scene or VRM data. Ensure both are correctly provided.");
      }

      const expressionManager = body.expressionManager;
      if (!expressionManager || !expressionManager._expressionMap) {
        throw new Error("Expression Manager or Expression Map is missing.");
      }

      const vrmData = {
        humanoid: body.humanoid,
        expressions: expressionManager,
        meta: body.meta,
        lookAt: body.lookAt,
        materials: body.materials,
      };

      exporter.parse(
        vrmData,
        scene,
        null,
        (vrmBlob) => {
          if (vrmBlob) {
            resolve(vrmBlob);
          } else {
            reject(new Error("VRM export failed: Blob creation returned null."));
          }
        },
        (error) => {
          reject(new Error(`VRM export failed: ${error.message}`));
        }
      );
    } catch (error) {
      reject(new Error(`Error during VRM export: ${error.message}`));
    }
  });
};

// Helper functions for initializing materials
function initializeMaterials(object, vrm) {
  object.traverse((child) => {
    if (child.isMesh && child.material) {
      if (Array.isArray(child.material)) {
        child.material.forEach((material) => initializeMaterialTextures(material, vrm));
      } else {
        initializeMaterialTextures(child.material, vrm);
      }
    }
  });
}

function initializeMaterialTextures(material, vrm) {
  material.map = material.map || null;
  material.normalMap = material.normalMap || null;
  // Initialize other material properties as needed...
}

function initializeHumanoidData(humanoid) {
  humanoid.humanBones = humanoid.humanBones || {};
}

function initializeExpressions(expressionManager) {
  expressionManager.presetMap = expressionManager.presetMap || {};
  expressionManager.customMap = expressionManager.customMap || {};
}

function initializeMeta(meta) {
  meta.name = meta.name || '';
}

function initializeLookAt(lookAt) {
  lookAt.offsetFromHeadBone = lookAt.offsetFromHeadBone || { x: 0, y: 0, z: 0 };
}

function initializeVrmMaterials(materials) {
  materials.forEach((material) => {
    material.extensions = material.extensions || {};
  });
}






const formatMetadata = (metadata) => {
    if (!metadata) return "No metadata available";
    return JSON.stringify(metadata, null, 2); // Pretty print JSON
};

const handleTransactionSent = () => {
    console.log("Transaction sent");
};

const handleTransactionConfirmed = () => {
    console.log("Transaction confirmed");
};

const handleTransactionError = (error) => {
    console.error("Transaction error:", error);
    setTransactionError(error.message);
};

const addAttribute = () => {
    setAttributes([...attributes, { trait_type: '', value: '' }]);
};

const handleAttributeChange = (index, key, value) => {
    const newAttributes = [...attributes];
    newAttributes[index][key] = value;
    setAttributes(newAttributes);
};


  return (
    <div>
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
                {Object.keys(imageMap).map(category => (
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
                  {imageMap[selectedCategory]?.map(image => (
                    <div key={image.key} className={styles.imageItem}>
                      <img src={image.thumbnail} alt={selectedCategory} />
                      <button onClick={() => handleImageSelect(selectedCategory, image.thumbnail)}>Select</button>
                    </div>
                  ))}
                </div>
                <button onClick={handleNextCategory} className={styles.navButton}>›</button>
              </div>
            </div>
          </>
        )}
        {overrideMap.length > 0 && (
          <div className={styles.overrideContainer}>
            <h2>Select Overrides</h2>
            <div className={styles.imageList}>
              {overrideMap.map((override, index) => (
                <div key={`override-${index}`} className={styles.imageItem}>
                  <img src={`${basePath}${override}`} alt="Override" />
                  <button onClick={() => applyTextureOverride(selectedCategory, override)}>Select</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div style={{ width: '100%', height: '80vh', overflow: 'hidden' }}>
        <Canvas camera={cameraRef.current}>
          <spotLight position={[0, 5, 10]} intensity={0.9} />
          <ambientLight intensity={0.5} />
          <primitive object={sceneRef.current} />
          <CameraControls />
        </Canvas>
      </div>
      <div>
          
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
          transaction={prepareTransaction}
          onTransactionSent={handleTransactionSent}
          onTransactionConfirmed={handleTransactionConfirmed}
          onError={handleTransactionError}
        >
          Execute Transaction
        </TransactionButton>
      
    </div>
  );
};

export default AvatarMintDrophunter;
