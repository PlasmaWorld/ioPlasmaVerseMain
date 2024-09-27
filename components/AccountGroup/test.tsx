import React, { useEffect, useRef, useState } from 'react';
import { Canvas, useThree, extend, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { applyTextureToVRM } from './create-texture-atlas';
import styles from '@/components/MintApp/Mint2.module.css';

extend({ OrbitControls });

const CameraControls = () => {
  const { camera, gl: { domElement } } = useThree();
  const controlsRef = useRef();

  useFrame(() => controlsRef.current.update());

  return <orbitControls ref={controlsRef} args={[camera, domElement]} />;
};

const VrmViewer = () => {
  const cameraRef = useRef(new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000));
  const sceneRef = useRef(new THREE.Scene());
  const avatarRef = useRef(new THREE.Group());
  const [accessories, setAccessories] = useState(null);
  const [body, setBody] = useState('/character-assets/neurohacker/body/neurohacker.vrm');
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
  const basePath = "/character-assets/neurohacker/";

  const [selectedCategory, setSelectedCategory] = useState('accessories');
  const [activeTab, setActiveTab] = useState('vrm');

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

    const texturePath = textureCollection.collection[textureIndex]?.directory;

    if (!texturePath) {
        console.error(`No texture path found for override thumbnail: ${overrideThumbnail} in collection: ${textureCollection.trait}`);
        return;
    }

    // Add the debugging logs here
    console.log('Selected Item:', selectedItem);
    console.log('Texture Collection:', textureCollection);
    console.log('Texture Path:', texturePath);

    // Correcting the base path and ensuring the full path is valid
    const fullTexturePath = `${basePath}${texturePath}`.replace(/\/+/g, '/');  // Ensuring no double slashes
    console.log('Full Texture Path:', fullTexturePath);

    console.log(`Loading texture from: ${fullTexturePath}`);

    const textureLoader = new THREE.TextureLoader();

    textureLoader.load(fullTexturePath, async (texture) => {
        const vrm = getVrmByCategory(category);

        if (vrm) {
            await applyTextureToVRM({
              vrm: vrm,  // The VRM model
              texturePath: fullTexturePath  // Path to the new texture
            })
            console.log(`Texture applied to VRM for category: ${category}`);
            sceneRef.current.needsUpdate = true;
        } else {
            console.error(`VRM not found for category: ${category}`);
        }
    }, undefined, (error) => {
        console.error(`Error loading texture: ${fullTexturePath}`, error);
    });
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
    </div>
  );
};

export default VrmViewer;


import * as THREE from 'three';

// Function to load an external texture
function loadTexture(texturePath) {
  return new Promise((resolve, reject) => {
    const loader = new THREE.TextureLoader();
    loader.load(
      texturePath,
      (texture) => {
        resolve(texture);
      },
      undefined,
      (error) => {
        reject(error);
      }
    );
  });
}

// Apply Texture to VRM
export const applyTextureToVRM = async ({ vrm, texturePath = null }) => {
  console.log('Applying texture to VRM.');

  try {
    // Load the new texture if a path is provided
    const newTexture = texturePath ? await loadTexture(texturePath) : null;

    // Traverse the VRM model to apply the texture
    vrm.scene.traverse((child) => {
      if (child.isMesh) {
        console.log(`Found mesh: ${child.name}`);
        const material = Array.isArray(child.material) ? child.material[0] : child.material;

        if (material && material.map) {
          console.log(`Original material name: ${material.name || '[Unnamed Material]'}`);
          console.log('Original material texture:', material.map);

          // Read the existing texture and its properties
          const existingTexture = material.map;
          const uvSettings = {
            repeat: existingTexture.repeat.clone(),
            offset: existingTexture.offset.clone(),
            wrapS: existingTexture.wrapS,
            wrapT: existingTexture.wrapT,
            rotation: existingTexture.rotation,
            center: existingTexture.center.clone()
          };

          console.log('UV settings copied from existing texture:', uvSettings);

          // Apply the new texture or reapply the existing one
          const textureToApply = newTexture || existingTexture;

          // Copy properties from the existing texture to the new texture
          textureToApply.repeat.copy(uvSettings.repeat);
          textureToApply.offset.copy(uvSettings.offset);
          textureToApply.wrapS = uvSettings.wrapS;
          textureToApply.wrapT = uvSettings.wrapT;
          textureToApply.rotation = uvSettings.rotation;
          textureToApply.center.copy(uvSettings.center);

          // Match additional properties
          textureToApply.magFilter = existingTexture.magFilter;
          textureToApply.minFilter = existingTexture.minFilter;
          textureToApply.anisotropy = existingTexture.anisotropy;
          textureToApply.flipY = existingTexture.flipY;
          textureToApply.encoding = existingTexture.encoding;
          textureToApply.format = existingTexture.format;
          textureToApply.premultiplyAlpha = existingTexture.premultiplyAlpha;
          textureToApply.generateMipmaps = existingTexture.generateMipmaps;

          // Set the texture on the material
          material.map = textureToApply;
          material.needsUpdate = true;

          console.log(`Applied texture to material: ${material.name || '[Unnamed Material]'}`);
        } else if (material) {
          console.warn(`No existing texture found on material: ${material.name || '[Unnamed Material]'}, applying new texture if provided.`);
          if (newTexture) {
            material.map = newTexture;
            material.needsUpdate = true;
            console.log(`Applied new texture to material: ${material.name || '[Unnamed Material]'}`);
          }
        } else {
          console.warn(`Material is undefined for mesh: ${child.name}`);
        }
      }
    });

    console.log('Finished applying texture to VRM.');
  } catch (error) {
    console.error(`Error applying texture:`, error);
  }
};
