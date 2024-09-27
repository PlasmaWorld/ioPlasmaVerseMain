import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { CharacterManager } from "./characterManager";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

export function sceneInitializer(canvas) {
    const scene = new THREE.Scene();

    // Add ambient light to the scene
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    // Add directional light to the scene
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(0, 1, 1);
    scene.add(directionalLight);

    // Create a container for scene elements
    const sceneElements = new THREE.Object3D();
    scene.add(sceneElements);

    // Set up the camera with a perspective projection
    const camera = new THREE.PerspectiveCamera(
        30,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    camera.position.set(0, 1.3, 2);

    // Initialize the CharacterManager with the scene and camera
    const characterManager = new CharacterManager({
        parentModel: scene,
        createAnimationManager: true,
        renderCamera: camera,
    });

    // Add mouse look-at functionality for the character
    characterManager.addLookAtMouse(80, canvas, camera, true);

    // Ensure the canvas element is passed correctly
    if (!canvas) {
        throw new Error(`Canvas element not provided`);
    }

    // Create the WebGL renderer and associate it with the canvas element
    const renderer = new THREE.WebGLRenderer({
        canvas: canvas, // Use the actual canvas element
        antialias: true,
        alpha: true,
        preserveDrawingBuffer: true,
    });

    // Set up orbit controls for the camera
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.minDistance = 1;
    controls.maxDistance = 4;
    controls.maxPolarAngle = Math.PI / 2;
    controls.enablePan = true;
    controls.target = new THREE.Vector3(0, 1, 0);
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;

    // Define pan limits for the camera controls
    const minPan = new THREE.Vector3(-0.5, 0, -0.5);
    const maxPan = new THREE.Vector3(0.5, 1.5, 0.5);

    // Handle window resize events
    const handleResize = () => {
        renderer.setSize(window.innerWidth, window.innerHeight);
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
    };

    window.addEventListener("resize", handleResize);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.outputEncoding = THREE.sRGBEncoding;

    // Animation loop
    const animate = () => {
        requestAnimationFrame(animate);
        controls.target.clamp(minPan, maxPan);
        controls?.update();
        characterManager.update();
        renderer.render(scene, camera);
    };

    animate();

    // Handle mouse clicks on the canvas
    const handleMouseClick = (event) => {
        const isCtrlPressed = event.ctrlKey;
        const rect = canvas.getBoundingClientRect();
        const mousex = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        const mousey = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        characterManager.cameraRaycastCulling(mousex, mousey, isCtrlPressed);
    };

    // Load additional scene elements if necessary
    const fetchScene = async () => {
        try {
            const modelPath = "./3d/Platform.glb";
            const loader = new GLTFLoader();
            const gltf = await loader.loadAsync(modelPath);
            sceneElements.add(gltf.scene);
        } catch (error) {
            console.error("Error loading model:", error);
        }
    };

    fetchScene();
    canvas.addEventListener("click", handleMouseClick);

    // Return the initialized scene, camera, controls, and other components
    return {
        scene,
        camera,
        controls,
        characterManager,
        sceneElements,
    };
}
