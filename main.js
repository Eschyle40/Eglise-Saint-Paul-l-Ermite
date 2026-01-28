// =============================================
// INITIALISATION OPTIMISÉE (sans Draco)
// =============================================
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x333333);

// Camera optimisée
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 0, 5);

// Renderer configuré pour les textures
const renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: "high-performance",
    precision: "mediump"
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.getElementById('container').appendChild(renderer.domElement);

// =============================================
// LUMIÈRES OPTIMISÉES
// =============================================
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffdd, 0.8);
directionalLight.position.set(1, 1, 1);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 1024;
directionalLight.shadow.mapSize.height = 1024;
directionalLight.shadow.camera.near = 0.5;
directionalLight.shadow.camera.far = 50;
directionalLight.shadow.bias = -0.0001;
scene.add(directionalLight);

// Lumière environnementale
const hemiLight = new THREE.HemisphereLight(0xffffbb, 0x080820, 0.2);
scene.add(hemiLight);
 
// =============================================
// CONTRÔLES
// =============================================
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0, 0);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.screenSpacePanning = false;
controls.minDistance = 2;
controls.maxDistance = 10;

// =============================================
// CHARGEMENT DU MODÈLE (sans Draco)
// =============================================
const loader = new THREE.GLTFLoader();
const scale = 15;
let model;

loader.load(
    './models/gltf/Bas_relief_2_ultra_texture.glb',
    (gltf) => {
        model = gltf.scene;
        model.scale.set(scale, scale, scale);

        // Optimiser les matériaux sans les modifier
        model.traverse((child) => {
            if (child.isMesh) {
                // Conserver les matériaux originaux
                child.frustumCulled = true;
                child.castShadow = true;
                child.receiveShadow = true;

                // Optimiser les textures existantes
                if (child.material) {
                    const material = child.material;
                    if (Array.isArray(material)) {
                        material.forEach(mat => optimizeMaterial(mat));
                    } else {
                        optimizeMaterial(material);
                    }
                }
            }
        });

        scene.add(model);

        // Centrer la vue
        const box = new THREE.Box3().setFromObject(model);
        box.getCenter(controls.target);

        // Ajouter un sol
        //addGroundPlane(box.min.y - 0.1);
    },
    (xhr) => {
        const percentLoaded = (xhr.loaded / xhr.total * 100).toFixed(1);
        console.log(`Chargement: ${percentLoaded}%`);
    },
    (error) => {
        console.error('Erreur de chargement:', error);
        createFallbackGeometry();
    }
);

// Optimisation des matériaux existants
function optimizeMaterial(material) {
    if (!material) return;

    // Configurer l'encoding pour les textures
    if (material.map) {
        material.map.encoding = THREE.sRGBEncoding;
        material.map.anisotropy = renderer.capabilities.getMaxAnisotropy();
        material.map.generateMipmaps = true;
    }

    // Configurer les autres types de textures
    const textureTypes = [
        'map', 'normalMap', 'roughnessMap', 'metalnessMap',
        'aoMap', 'emissiveMap', 'displacementMap', 'bumpMap'
    ];

    textureTypes.forEach(type => {
        if (material[type]) {
            material[type].encoding = type === 'map' ? THREE.sRGBEncoding : THREE.LinearEncoding;
            material[type].anisotropy = renderer.capabilities.getMaxAnisotropy();
        }
    });

    material.needsUpdate = true;
}

// =============================================
// FONCTIONS AUXILIAIRES
// =============================================
function addGroundPlane(yPosition) {
    const groundGeometry = new THREE.PlaneGeometry(20, 20);
    const groundMaterial = new THREE.MeshStandardMaterial({
        color: 0x222222,
        roughness: 0.8,
        metalness: 0.2,
        side: THREE.DoubleSide
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = yPosition;
    ground.receiveShadow = true;
    scene.add(ground);
}

function createFallbackGeometry() {
    const geometry = new THREE.TorusKnotGeometry(0.5, 0.2, 100, 16);
    const material = new THREE.MeshStandardMaterial({
        color: 0x888888,
        roughness: 0.7,
        metalness: 0.1
    });
    const fallbackMesh = new THREE.Mesh(geometry, material);
    fallbackMesh.castShadow = true;
    scene.add(fallbackMesh);
    console.warn("Modèle de secours créé");
}

// =============================================
// GESTION DU REDIMENSIONNEMENT
// =============================================
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// =============================================
// BOUCLE D'ANIMATION OPTIMISÉE
// =============================================
let lastTime = 0;
const targetFPS = 60;
const frameTime = 1000 / targetFPS;

function animate(currentTime) {
    requestAnimationFrame(animate);

    // Limiter le FPS
    if (currentTime - lastTime < frameTime) return;
    lastTime = currentTime;

    controls.update();
    renderer.render(scene, camera);
}
animate();

// =============================================
// NETTOYAGE MÉMOIRE
// =============================================
window.addEventListener('beforeunload', () => {
    scene.traverse((obj) => {
        if (obj.isMesh) {
            if (obj.geometry) obj.geometry.dispose();

            if (obj.material) {
                const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
                materials.forEach(m => {
                    Object.values(m).forEach(prop => {
                        if (prop && typeof prop === 'object' && 'dispose' in prop) {
                            prop.dispose();
                        }
                    });
                    m.dispose();
                });
            }
        }
    });

    renderer.dispose();
    renderer.forceContextLoss();
});
