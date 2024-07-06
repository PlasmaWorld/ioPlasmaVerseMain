import * as THREE from "three"
import { Buffer } from "buffer";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass'
import { RenderPixelatedPass } from "./shaders/RenderPixelatedPass";
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass'
import { PixelatePass } from "./shaders/PixelatePass"

const screenshotSize = 4096;

const localVector = new THREE.Vector3();

class PixelRenderer{
  constructor(scene,camera, pixelSize ){
    const pixelRenderer = new THREE.WebGLRenderer({
      preserveDrawingBuffer: true,
      antialias: false,
      alpha: true,
    })
    
    this.pixelSize = pixelSize;
    this.domElement = pixelRenderer.domElement;

    const screenshotResolution = new THREE.Vector2(screenshotSize,screenshotSize);
    pixelRenderer.setClearColor( 0x000000, 0);
    pixelRenderer.outputEncoding = THREE.LinearEncoding;
    pixelRenderer.setSize(screenshotResolution.x, screenshotResolution.y);
    pixelRenderer.setPixelRatio(window.devicePixelRatio);
    //pixelRenderer.shadowMap.enabled = true
    

    let renderResolution = screenshotResolution.clone().divideScalar( pixelSize )
    renderResolution.x |= 0
    renderResolution.y |= 0

    const composer = new EffectComposer( pixelRenderer )
    composer.addPass( new RenderPass( scene, camera ) )

    this._renderPixelPass = new RenderPixelatedPass( renderResolution, scene, camera )
    this._pixelPass = new PixelatePass( renderResolution )

    
    composer.addPass( this._renderPixelPass )
    // let bloomPass = new UnrealBloomPass( screenResolution, .4, .1, .9 )
    // composer.addPass( bloomPass )
    composer.addPass( this._pixelPass )
    
    this.renderer = pixelRenderer;
    this.composer = composer;
  }
  setSize(width, height){
    const screenshotResolution = new THREE.Vector2(width,height);
    let renderResolution = screenshotResolution.clone().divideScalar( this.pixelSize )
    renderResolution.x |= 0
    renderResolution.y |= 0

    this.renderer.setSize(width, height);
    this._renderPixelPass.setResolution(renderResolution);
    this._pixelPass.setResolution(renderResolution);
  }
  setPixelSize(pixelSize){
    this.pixelSize = pixelSize;
  }
  render(){
    this.composer.render();
  }
}

export class ScreenshotManager {
  constructor(characterManager, scene) {
    this.renderer = new THREE.WebGLRenderer({
      preserveDrawingBuffer: true,
      antialias: true,
      alpha:true
    });
    this.renderer.setClearAlpha(0);
    this.renderer.premultipliedAlpha = false;
    this.scene = scene;
    this.characterManager = characterManager;
    this.renderer.outputEncoding = THREE.sRGBEncoding;

    this.renderer.setSize(screenshotSize, screenshotSize);

    this.camera = new THREE.PerspectiveCamera( 30, 1, 0.1, 1000 );
    this.textureLoader = new THREE.TextureLoader();
    this.sceneBackground = new THREE.Color(0.1,0.1,0.1);
    this.sceneBackgroundAlpha = 1;
    this.frameOffset = {
      min:0.2,
      max:0.2,
    }
    this.usesBackgroundImage = false;

    this.backgroundMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 });
    const geometry = new THREE.PlaneGeometry(1000, 1000); // Adjust size as needed
    const plane = new THREE.Mesh(geometry, this.backgroundMaterial);
    plane.renderOrder = -1
    this.backgroundPlane = plane;

    this.pixelRenderer = new PixelRenderer(scene, this.camera, 20);


    this.boneOffsets = {
      head:null,
      neck:null,
      chest:null,
      hips:null,
      spine:null,
      leftUpperLeg:null,
      leftLowerLeg:null,
      leftFoot:null,
      rightUpperLeg:null,
      rightLowerLeg:null,
      rightFoot:null,
    }
  }
  setScene(scene){
    this.scene = scene;
  }

  setupCamera(cameraPosition, lookAtPosition, fieldOfView = 30){
    this.camera.position.copy(cameraPosition);
    this.camera.lookAt(lookAtPosition)
    this.camera.fov = fieldOfView;
  }

  _getCharacterMinMax(){
    let minY = Number.POSITIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;

    this.characterManager.characterModel.traverse((o) => {
      if (o.geometry) {
        o.geometry.computeBoundingBox();
        
        // If boundingBox is available
        if (o.geometry.boundingBox) {
            o.geometry.boundingBox.applyMatrix4(o.matrixWorld);

            if (o.geometry.boundingBox.min.y < minY)
              minY = o.geometry.boundingBox.min.y

            if (o.geometry.boundingBox.max.y > maxY)
              maxY = o.geometry.boundingBox.max.y
        }
      }
    });
    return {minY, maxY}
  }

  frameCloseupShot(){
    this.frameShot("head", "head")
  }
  frameMediumShot(){
    this.frameShot("chest", "head")
  }
  frameCowboyShot(){
    this.frameShot("hips", "head")
  }
  frameFullShot(){
    this.frameShot("leftFoot", "head")
  }


  frameShot(minBoneName, maxBoneName, cameraPosition = null, minGetsMaxVertex = false, maxGetsMaxVertex = true){
    const min = this._getBoneWorldPositionWithOffset(minBoneName, minGetsMaxVertex);
    const max = this._getBoneWorldPositionWithOffset(maxBoneName, maxGetsMaxVertex);
    min.y -= this.frameOffset.max;
    max.y += this.frameOffset.min;

    cameraPosition = cameraPosition || new THREE.Vector3(0,0,0)
    
    this.positionCameraBetweenPoints(min,max,cameraPosition)
  }

  setBottomFrameOffset(min){
    this.frameOffset.min = min;
  }
  setTopFrameOffset(max){
    this.frameOffset.max = max;
  }


  async calculateBoneOffsets(minWeight) {
    for (const boneName in this.boneOffsets) {
        // Use await to wait for the promise to resolve
        const result = await this._getMinMaxOffsetByBone(this.characterManager.characterModel, boneName, minWeight);

        // Store the result in the boneOffsets property
        this.boneOffsets[boneName] = result;
    }
}

  _getBoneWorldPositionWithOffset(boneName, getMax) {
    const bone = this._getFirstBoneWithName(boneName);
    if (!bone || !this.boneOffsets[boneName]) {
        return new THREE.Vector3();
    }
    const boneWorldPosition = new THREE.Vector3();
    bone.getWorldPosition(boneWorldPosition);
    
    const offset = getMax ? this.boneOffsets[boneName].max : this.boneOffsets[boneName].min;
    boneWorldPosition.y += offset.y;

    return boneWorldPosition;
  }

  _getBoneWorldPosition(boneName){
    const bone = this._getFirstBoneWithName(boneName);
    if (bone != null){
      return new THREE.Vector3().setFromMatrixPosition(bone.matrixWorld);
    }
    else{
      console.warn(`Bone with name '${boneName}' not found in one of the skinned meshes.`);
      return new THREE.Vector3(0,0,0);
    }
  }

  _getFirstBoneWithName(boneName) {
    let resultBone = null;

    this.characterManager.characterModel.traverse(child => {
        if (child instanceof THREE.SkinnedMesh) {
            if (!child.geometry) {
                console.error("Invalid skinned mesh found in children.");
                return;
            }

            const boneIndex = child.skeleton.bones.findIndex(bone => bone.name === boneName);

            if (boneIndex !== -1) {
                resultBone = child.skeleton.bones[boneIndex];
                // Break out of the loop since we found the bone
                return;
            }
        }
    });
    return resultBone;
  }

  setCameraFrameWithName(shotName, vectorCameraPosition){
    const shotNameLower = shotName.toLowerCase();
    switch (shotNameLower){
        case "fullshot":
            this.frameShot("leftFoot", "head",vectorCameraPosition)
            break;
        case "cowboyshot":
            this.frameShot("hips", "head",vectorCameraPosition)
            break;
        case "mediumshot":
            this.frameShot("chest", "head",vectorCameraPosition)
            break;
        case "mediumcloseup":
        case "mediumcloseupshot":
            this.frameShot("chest", "head",vectorCameraPosition,true)
            break;
        case "closeup":
        case "closeupshot":
            this.frameShot("head", "head",vectorCameraPosition)
            break;
        default:
            console.warn("unkown cameraFrame: " + shotName + ". Please use fullShot, cowboyShot, mediumShot, mediumCloseup or closeup")
            this.frameShot("leftFoot", "head",vectorCameraPosition)
            break;
    }
}

async _getMinMaxOffsetByBone(parent, boneName, minWeight) {
  return new Promise(async(resolve, reject) => {
      // Ensure parent is valid
      if (!parent || !parent.traverse) {
          console.error("Invalid parent object provided.");
          reject(null);
      }

      // Initialize min and max offset vectors
      const minOffset = new THREE.Vector3(Infinity, Infinity, Infinity);
      const maxOffset = new THREE.Vector3(-Infinity, -Infinity, -Infinity);

      const prevPos = []
      parent.traverse(async (child) => {
        if (child instanceof THREE.SkinnedMesh) {
          prevPos.push(this._saveBonesPos(child.skeleton));
          child.skeleton.pose();
        }
      });
      let prevPosCount = 0;

      const delay = ms => new Promise(res => setTimeout(res, ms));
      await delay(10);
      // Traverse all children of the parent
      parent.traverse((child) => {
          if (child instanceof THREE.SkinnedMesh) {
              
              // Ensure each skinnedMesh has geometry
              if (!child.geometry) {
                  console.error("Invalid skinned mesh found in children.");
                  return;
              }

              // Find the index of the bone by name
              const boneIndex = child.skeleton.bones.findIndex(bone => bone.name === boneName);

              // Check if the bone with the given name exists
              if (boneIndex === -1) {
                  console.error(`Bone with name '${boneName}' not found in one of the skinned meshes.`);
                  return;
              }

              const positionAttribute = child.geometry.getAttribute("position");
              const skinWeightAttribute = child.geometry.getAttribute("skinWeight");
              const skinIndexAttribute = child.geometry.getAttribute("skinIndex");

              // Iterate through each vertex
              for (let i = 0; i < positionAttribute.count; i++) {
                  const worldVertex = new THREE.Vector3().fromBufferAttribute(positionAttribute, i).applyMatrix4(child.matrixWorld);

                  // Check the influence of the bone on the vertex
                  const skinIndex = skinIndexAttribute.getX(i);

                  if (skinIndex === boneIndex) {
                      // Get the weight of the bone influence
                      const influence = skinWeightAttribute.getX(i);

                      // If the influence is above the minimum weight
                      if (influence >= minWeight) {
                          // Calculate offset from the bone's position difference
                          const bone = child.skeleton.bones[boneIndex];
                          const bonePosition = new THREE.Vector3().setFromMatrixPosition(bone.matrixWorld);
                          const offset = worldVertex.clone().sub(bonePosition);

                          // Update min and max offset vectors
                          minOffset.min(offset);
                          maxOffset.max(offset);
                      }
                  }
              }
              this._restoreSavedPose(prevPos[prevPosCount], child.skeleton);
              prevPosCount++;
          }
      });

      // Resolve with min and max offset vectors
      resolve({ min: minOffset, max: maxOffset });
  });
}

  _saveBonesPos(skeleton){
      let savedPose = [];
      skeleton.bones.forEach(bone => {
          savedPose.push({
              position: bone.position.clone(),
              rotation: bone.rotation.clone(),
              scale: bone.scale.clone()
          });
      });
      return savedPose;
  }

  _restoreSavedPose(savedPose, skeleton) {
    if (savedPose) {
        skeleton.bones.forEach((bone, index) => {
            bone.position.copy(savedPose[index].position);
            bone.rotation.copy(savedPose[index].rotation);
            bone.scale.copy(savedPose[index].scale);
        });
    }
  }

  positionCameraBetweenPoints(vector1, vector2,cameraPosition, fieldOfView = 30) {
    const boundingBox = new THREE.Box3();
    boundingBox.expandByPoint(vector1);
    boundingBox.expandByPoint(vector2);

    this.camera.fov = fieldOfView;

    const verticalFOV = this.camera.fov * (Math.PI / 180); 

    const diagonalDistance = boundingBox.getSize(new THREE.Vector3()).length();

    const distance = diagonalDistance / (2 * Math.tan(verticalFOV / 2));

    boundingBox.getCenter(localVector)
    // Set the camera's position and lookAt
    this.camera.position.copy(localVector);

    cameraPosition.y *= 0.5; 

    this.camera.lookAt(localVector.clone().sub(cameraPosition)); // adjust lookAt position if needed

    // Adjust the camera position based on the calculated distance
    const direction = new THREE.Vector3();
    this.camera.getWorldDirection(direction);
    this.camera.position.addScaledVector(direction, -distance);

    // Update the camera's projection matrix to ensure proper rendering
    this.camera.updateProjectionMatrix();
  }

  setCamera(headPosition, playerCameraDistance,fieldOfView = 30) {
    this.camera.position.copy(headPosition);
    this.camera.fov = fieldOfView;
    localVector.set(0, 0, -1);
    this.cameraDir = localVector.applyQuaternion(this.camera.quaternion);
    this.cameraDir.normalize();
    this.camera.position.x -= this.cameraDir.x * playerCameraDistance;
    this.camera.position.z -= this.cameraDir.z * playerCameraDistance;
  }

  /**
   * Sets the background using either color or image.
   * 
   * @param {Array|string} background - If an array, assumed to be RGB values [r, g, b].
   *                                    If a string, assumed to be a URL for the background image.
   */
  setBackground(background){
    if (Array.isArray(background)){
      const alpha = background[3] == null ? 1 : background[3];

      this.setBackgroundColor(background[0],background[1],background[2],alpha)
    }
    else{
      this.setBackgroundImage(background);
    }
  }

  setBackgroundColor(r,g,b,a){
    const color = new THREE.Color(r,g,b,a);
    this.sceneBackground = color
    if (a == null) a = 1;
    if (a > 1) a = 1;
    if (a < 0) a = 0;
    this.sceneBackgroundAlpha = a;
    this.backgroundMaterial.color = color;
    this.usesBackgroundImage = false;
  }

  setBackgroundImage(url){
    return new Promise(async (resolve, reject) => {
      try{
        const backgroundTexture = await this.texureLoader.load(url);
        if (backgroundTexture){
          backgroundTexture.wrapS = backgroundTexture.wrapT = THREE.RepeatWrapping;
          this.sceneBackground = backgroundTexture;
          this.usesBackgroundImage = true;
          this.sceneBackgroundAlpha = 1;
          resolve();
        }
      }
      catch(error){
        console.error("Error loading background image: ", error)
        reject(error)
      }
    });
  }

  _setBackground() {
    if (this.usesBackgroundImage == false && this.sceneBackgroundAlpha != 1){
      if (this.sceneBackgroundAlpha == 0){
        this.scene.background = null;
      }
      else{
        this.scene.background = null;
        this.scene.add(this.backgroundPlane);
        this.backgroundPlane.position.copy(this.camera.position);
        var direction = new THREE.Vector3(0, 0, -1);  // Adjust the direction if needed
        direction.applyQuaternion(this.camera.quaternion);
        var distance = 100;  // Adjust the distance as needed
        this.backgroundPlane.position.addScaledVector(direction, distance);
        this.backgroundPlane.lookAt(this.camera.position);
      }
    }
    else{
      this.scene.background = this.sceneBackground;
    }
  }
  _restoreBackground(){
    this.scene.background = null;
    if (this.usesBackgroundImage == false && this.sceneBackgroundAlpha != 1){
      this.scene.remove(this.backgroundPlane);
    }
  }
  getImageData(width, height, pixelSize = null){
    return this._createImage(width, height, pixelSize).split("base64,")[1];
  }

  _createImage(width, height, pixelSize = null){
    const aspectRatio = width / height;

    if (typeof pixelSize === 'number'){
      this.pixelRenderer.setPixelSize(pixelSize);
    }
    this.renderer.setSize(width, height);
    this.pixelRenderer.setSize(width,height);
    const strMime = "image/png";

    this.camera.aspect = aspectRatio;
    this.camera.updateProjectionMatrix();
    const renderer = typeof pixelSize === 'number' ? this.pixelRenderer : this.renderer;
    try {
      
      this._setBackground();
      renderer.render(this.scene, this.camera);
      let imgData = renderer.domElement.toDataURL(strMime);
      this._restoreBackground();
      return  imgData
    } catch (e) {
      console.error(e);
      return null;
    }
  }
  savePixelScreenshot(imageName,width, height, pixelSize){
    this.pixelRenderer.setPixelSize(pixelSize);
    this.pixelRenderer.setSize(width,height);
    const imgData =  this._createImage(width, height, true)
    const strDownloadMime = "image/octet-stream";
    const strMime = "image/png";
    this.saveFile(imgData.replace(strMime, strDownloadMime), imageName + ".png");
  }
  saveScreenshot(imageName,width, height){
    const imgData =  this._createImage(width, height)
    const strDownloadMime = "image/octet-stream";
    const strMime = "image/png";
    this.saveFile(imgData.replace(strMime, strDownloadMime), imageName + ".png");
  }

  getScreenshotImage(width, height){
    const imgData = this._createImage(width, height);
    const img = new Image();
    img.src = imgData;
    return img;
  }
  getScreenshotTexture(width, height){
    const img = this.getScreenshotImage(width,height)
    const texture = new THREE.Texture(img);
    texture.needsUpdate = true;
    return texture;
  }
  getScreenshotBlob(width, height){
    const imgData = this._createImage(width, height)
    const base64Data = Buffer.from(
      imgData.replace(/^data:image\/\w+;base64,/, ""),
      "base64"
    );
    const blob = new Blob([base64Data], { type: "image/jpeg" }); 
    return blob; 
  }
  saveFile (strData, filename) {
    const link = document.createElement('a');
    if (typeof link.download === 'string') {
      document.body.appendChild(link); //Firefox requires the link to be in the body
      link.download = filename;
      link.href = strData;
      link.click();
      document.body.removeChild(link); //remove the link when done
    } else {
      const win = window.open(strData, "_blank");
      win.document.write("<title>" + filename + "</title><img src='" + strData + "'/>");
    }
  }

}
