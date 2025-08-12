// static/main.js

let meleeCooldown = 0;
const MELEE_COOLDOWN_TIME = 1.0;
const MELEE_RANGE = 2.5;
const MELEE_DAMAGE = 50;

let grenadeCount = 3;
const grenades = [];
const GRENADE_FUSE_TIME = 3.0;
const GRENADE_THROW_FORCE = 18.0;
const GRENADE_EXPLOSION_RADIUS = 6.0;
const GRENADE_EXPLOSION_DAMAGE = 120;

const pickups = [];
let damageMultiplier = 1;
let damageMultiplierTimer = 0;

const BOSS_AOE_RADIUS = 12.0;
const BOSS_AOE_DAMAGE = 35;
const BOSS_AOE_COOLDOWN = 8.0;
const BOSS_AOE_TELEGRAPH_TIME = 1500;
const HEADSHOT_MULTIPLIER = 2.5;

let baseWeaponDamageMultiplier = 1.0;
let damageUpgradeLevel = 0;
let hpUpgradeLevel = 0;
let hasScope = false;
let hasExtendedMag = false;
let hasGrip = false;
let hasFrostRounds = false;
let hasAPRounds = false;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 10, 60);
camera.lookAt(0, 0, 0);
const listener = new THREE.AudioListener();
camera.add(listener);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor(0x87ceeb, 1);
document.body.appendChild(renderer.domElement);
const labelRenderer = new THREE.CSS2DRenderer();
labelRenderer.setSize(window.innerWidth, window.innerHeight);
labelRenderer.domElement.style.position = 'absolute';
labelRenderer.domElement.style.top = '0px';
document.getElementById('label-container').appendChild(labelRenderer.domElement);

let score = 0;
let money = 0;
const scoreElement = document.getElementById('score');
const ammoElement = document.getElementById('ammo');
const statusElement = document.getElementById('status');
const healthElement = document.getElementById('health');
const damageOverlay = document.getElementById('damage-overlay');
const waveElement = document.getElementById('wave');
const killsElement = document.getElementById('kills');
const weaponElement = document.getElementById('weapon');
const highscoreElement = document.getElementById('highscore');
const pausedOverlay = document.getElementById('paused-overlay');
const centerMessage = document.getElementById('center-message');
const gameOverOverlay = document.getElementById('gameover-overlay');
const debugPos = document.getElementById('debug-pos');
const staminaBar = document.getElementById('stamina-bar');
const grenadeElement = document.getElementById('grenades');
const shopOverlay = document.getElementById('shop-overlay');
const shopWaveNumber = document.getElementById('shop-wave-number');
const shopMoneyAmount = document.getElementById('shop-money-amount');
const buyHealthBtn = document.getElementById('buy-health-btn');
const buyAmmoBtn = document.getElementById('buy-ammo-btn');
const buyGrenadeBtn = document.getElementById('buy-grenade-btn');
const upgradeDamageBtn = document.getElementById('upgrade-damage-btn');
const upgradeDamageCost = document.getElementById('upgrade-damage-cost');
const upgradeHpBtn = document.getElementById('upgrade-hp-btn');
const upgradeHpCost = document.getElementById('upgrade-hp-cost');
const startNextWaveBtn = document.getElementById('start-next-wave-btn');
const buyScopeBtn = document.getElementById('buy-scope-btn');
const buyExtMagBtn = document.getElementById('buy-extmag-btn');
const buyGripBtn = document.getElementById('buy-grip-btn');
const buyFrostBtn = document.getElementById('buy-frost-btn');
const buyApBtn = document.getElementById('buy-ap-btn');
const howToPlayOverlay = document.getElementById('how-to-play-overlay');
const continueToGameBtn = document.getElementById('continue-to-game-btn');

// --- CHANGE: Translate weapon names ---
const weapons = {
    pistol: { name: 'ปืนพก', maxMagazine: 12, magazine: 12, reserve: 120, damage: 25, fireRate: 5, reloadTime: 1.2, spread: 0.002, pellets: 1, sound: null, baseDamage: 25, baseSpread: 0.002, baseReloadTime: 1.2, baseMaxMagazine: 12, baseReserve: 120 },
    rifle: { name: 'ปืนไรเฟิล', maxMagazine: 30, magazine: 30, reserve: 180, damage: 18, fireRate: 10, reloadTime: 1.8, spread: 0.004, pellets: 1, sound: null, baseDamage: 18, baseSpread: 0.004, baseReloadTime: 1.8, baseMaxMagazine: 30, baseReserve: 180 },
    shotgun: { name: 'ลูกซอง', maxMagazine: 6, magazine: 6, reserve: 48, damage: 12, fireRate: 1.2, reloadTime: 2.2, spread: 0.02, pellets: 8, sound: null, baseDamage: 12, baseSpread: 0.02, baseReloadTime: 2.2, baseMaxMagazine: 6, baseReserve: 48 }
};
// --- END CHANGE ---

let currentWeaponKey = 'pistol';
let currentWeapon = weapons[currentWeaponKey];
let isReloading = false;
let lastShotAt = 0;
let isShooting = false;
let playerMaxHP = 100;
let playerHP = playerMaxHP;
let damageCooldown = 0;
let playerMaxStamina = 100;
let playerStamina = playerMaxStamina;
let staminaRegenCooldown = 0;
const STAMINA_DRAIN_RATE = 25;
const STAMINA_REGEN_RATE = 20;
const STAMINA_REGEN_DELAY = 1.0;
const PLAYER_EYE_HEIGHT = 1.6;

function updateAmmoHUD() { if (ammoElement) ammoElement.textContent = `กระสุน: ${currentWeapon.magazine}/${currentWeapon.reserve}`; if (weaponElement) weaponElement.textContent = `${currentWeapon.name}`; }

function updateHealthHUD() { if (healthElement) healthElement.textContent = `พลังชีวิต: ${Math.round(playerHP)} / ${playerMaxHP}`; }

function updateStaminaHUD() {
    if (staminaBar) {
        const percentage = (playerStamina / playerMaxStamina) * 100;
        staminaBar.style.width = percentage + '%';
    }
}

function updateGrenadeHUD() { if (grenadeElement) grenadeElement.textContent = `ระเบิด: ${grenadeCount}`; }
updateAmmoHUD();
updateHealthHUD();
updateStaminaHUD();
updateGrenadeHUD();

const floorGeometry = new THREE.PlaneGeometry(100, 100);
const floorMaterial = new THREE.MeshBasicMaterial({ color: 0x4CAF50, side: THREE.DoubleSide });
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = -Math.PI / 2;
scene.add(floor);
const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
scene.add(ambientLight);
const grid = new THREE.GridHelper(100, 20, 0xffffff, 0x444444);
grid.position.y = 0.01;
scene.add(grid);
const walls = [];
const wallMaterial = new THREE.MeshBasicMaterial({ color: 0x888888, side: THREE.DoubleSide });
const wallPositions = [{ x: 0, z: -25, w: 50, h: 6, d: 1 }, { x: 0, z: 25, w: 50, h: 6, d: 1 }, { x: -25, z: 0, w: 1, h: 6, d: 50 }, { x: 25, z: 0, w: 1, h: 6, d: 50 }, { x: 0, z: 0, w: 10, h: 6, d: 10 }, { x: -15, z: 10, w: 20, h: 6, d: 1 }, { x: 15, z: -10, w: 20, h: 6, d: 1 }, { x: -15, z: -15, w: 1, h: 6, d: 10 }, { x: 15, z: 15, w: 1, h: 6, d: 10 }, { x: 0, z: 18, w: 1, h: 6, d: 14 }, { x: 0, z: -18, w: 1, h: 6, d: 14 }, { x: 18, z: 0, w: 14, h: 6, d: 1 }, { x: -18, z: 0, w: 14, h: 6, d: 1 }, ];
wallPositions.forEach((pos, i) => {
    const wallGeometry = new THREE.BoxGeometry(pos.w, pos.h, pos.d);
    const wall = new THREE.Mesh(wallGeometry, wallMaterial);
    wall.position.set(pos.x, pos.h / 2, pos.z);
    wall.userData.bbox = new THREE.Box3().setFromObject(wall);
    wall.userData.isBoundary = i < 4;
    walls.push(wall);
    scene.add(wall);
});
const LEVEL_BOUNDS = { minX: -24, maxX: 24, minZ: -24, maxZ: 24 };

function randomInRange(min, max) { return Math.random() * (max - min) + min; }

function randomInt(min, maxInclusive) { return Math.floor(randomInRange(min, maxInclusive + 1)); }

const MONEY_DROP_RANGES = { minion: { min: 30, max: 60 }, melee: { min: 40, max: 80 }, ranged: { min: 50, max: 100 }, healer: { min: 60, max: 120 }, boss: { min: 250, max: 500 } };

function getMoneyDropForType(type) { const range = MONEY_DROP_RANGES[type] || { min: 5, max: 10 }; return randomInt(range.min, range.max); }

function isBoxIntersectingWalls(box, entity = null) { for (const wall of walls) { if (entity && entity.userData.type === 'healer' && !wall.userData.isBoundary) continue; if (box.intersectsBox(wall.userData.bbox)) return true; } return false; }

function setRandomPositionInside(object, sizeVec3) {
    for (let i = 0; i < 50; i++) { const x = randomInRange(LEVEL_BOUNDS.minX + sizeVec3.x * 0.6, LEVEL_BOUNDS.maxX - sizeVec3.x * 0.6); const z = randomInRange(LEVEL_BOUNDS.minZ + sizeVec3.z * 0.6, LEVEL_BOUNDS.maxZ - sizeVec3.z * 0.6); const candidatePos = new THREE.Vector3(x, object.position.y, z); const candidateBox = new THREE.Box3().setFromCenterAndSize(candidatePos, sizeVec3); if (!isBoxIntersectingWalls(candidateBox)) { object.position.set(x, object.position.y, z); return true; } }
    object.position.set(0, object.position.y, 0);
    return false;
}

function setNewDestinationInside(object, sizeVec3) { for (let i = 0; i < 50; i++) { const x = randomInRange(LEVEL_BOUNDS.minX + sizeVec3.x * 0.6, LEVEL_BOUNDS.maxX - sizeVec3.x * 0.6); const z = randomInRange(LEVEL_BOUNDS.minZ + sizeVec3.z * 0.6, LEVEL_BOUNDS.maxZ - sizeVec3.z * 0.6); const candidatePos = new THREE.Vector3(x, object.position.y, z); const candidateBox = new THREE.Box3().setFromCenterAndSize(candidatePos, sizeVec3); if (!isBoxIntersectingWalls(candidateBox)) { object.userData.destination = candidatePos.clone(); return true; } } return false; }
const boxes = [];

function clearEnemies() {
    boxes.forEach(b => {
        if (b.userData.healthBarLabel) b.remove(b.userData.healthBarLabel);
        scene.remove(b);
    });
    boxes.length = 0;
    if (window.projectiles) {
        window.projectiles.forEach(p => scene.remove(p));
        window.projectiles.length = 0;
    }
    grenades.forEach(g => scene.remove(g));
    grenades.length = 0;
    pickups.forEach(p => {
        if (p.userData.label) p.remove(p.userData.label);
        scene.remove(p);
    });
    pickups.length = 0;
}

// --- CHANGE: Translate pickup labels ---
function spawnPickup() {
    const pickupTypes = ['health', 'ammo', 'damage'];
    const type = pickupTypes[Math.floor(Math.random() * pickupTypes.length)];
    let geometry = new THREE.BoxGeometry(0.7, 0.7, 0.7);
    let material, light, labelText;
    switch (type) {
        case 'health':
            material = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0x660000 });
            light = new THREE.PointLight(0xff0000, 1, 3);
            labelText = 'กล่องพยาบาล';
            break;
        case 'ammo':
            material = new THREE.MeshStandardMaterial({ color: 0xa52a2a, emissive: 0x331111 });
            light = new THREE.PointLight(0xa52a2a, 1, 3);
            labelText = 'กระสุนเต็ม';
            break;
        case 'damage':
            material = new THREE.MeshStandardMaterial({ color: 0x9400d3, emissive: 0x440055 });
            light = new THREE.PointLight(0x9400d3, 1, 3);
            labelText = 'เพิ่มพลังโจมตี';
            break;
    }
    const pickup = new THREE.Mesh(geometry, material);
    pickup.position.y = 0.5;
    pickup.add(light);
    const labelDiv = document.createElement('div');
    labelDiv.className = 'item-label';
    labelDiv.textContent = labelText;
    const itemLabel = new THREE.CSS2DObject(labelDiv);
    itemLabel.position.set(0, 1.0, 0);
    pickup.add(itemLabel);
    pickup.userData = { type, label: itemLabel };
    setRandomPositionInside(pickup, new THREE.Vector3(0.7, 0.7, 0.7));
    pickups.push(pickup);
    scene.add(pickup);
}
// --- END CHANGE ---

function spawnWaveEnemies(wave, count) {
    const shouldSpawnBoss = wave % 5 === 0 && wave > 1;
    const playerPos = controls.getObject().position.clone();

    function safeSpawn(type, wave) {
        let enemy, tryCount = 0;
        do {
            enemy = createEnemy(type, wave);
            tryCount++;
        } while (enemy.position.distanceTo(playerPos) < 10 && tryCount < 30);
        return enemy;
    }
    let remainingCount = count;
    let spawnCounts = { melee: 0.4, minion: 0.2, ranged: 0.3, healer: 0.1 };
    if (shouldSpawnBoss) {
        boxes.push(safeSpawn('boss', wave));
        remainingCount -= 1;
        spawnCounts = { melee: 0.5, minion: 0.3, ranged: 0.2, healer: 0.0 };
    }
    for (const type in spawnCounts) { const numToSpawn = Math.floor(remainingCount * spawnCounts[type]); for (let i = 0; i < numToSpawn; i++) { boxes.push(safeSpawn(type, wave)); } }
    while (boxes.length < count) { boxes.push(safeSpawn('minion', wave)); }
    boxes.forEach(box => scene.add(box));
}

function updateEnemyMovement(box, delta, currentSpeed) {
    if (box.userData.destination) {
        const direction = new THREE.Vector3().subVectors(box.userData.destination, box.position).normalize();
        const moveStep = direction.clone().multiplyScalar(currentSpeed * delta);
        if (box.position.distanceTo(box.userData.destination) < moveStep.length()) {
            box.position.copy(box.userData.destination);
            box.userData.destination = null;
            return;
        }
        const nextPosition = box.position.clone().add(moveStep);
        const enemyBox = new THREE.Box3().setFromObject(box);
        enemyBox.translate(moveStep);
        if (!isBoxIntersectingWalls(enemyBox, box)) { box.position.copy(nextPosition); } else {
            let moved = false;
            const tryTranslate = (deltaVec) => {
                const testBox = new THREE.Box3().setFromObject(box);
                testBox.translate(deltaVec);
                return !isBoxIntersectingWalls(testBox, box);
            };
            const stepX = new THREE.Vector3(moveStep.x, 0, 0);
            if (Math.abs(stepX.x) > 0 && tryTranslate(stepX)) {
                box.position.add(stepX);
                moved = true;
            }
            const stepZ = new THREE.Vector3(0, 0, moveStep.z);
            if (Math.abs(stepZ.z) > 0 && tryTranslate(stepZ)) {
                box.position.add(stepZ);
                moved = true;
            }
            if (!moved) { const perpendicular = new THREE.Vector3(-direction.z, 0, direction.x).multiplyScalar(box.userData.speed * delta * 0.6); if (tryTranslate(perpendicular)) { box.position.add(perpendicular); } else if (tryTranslate(perpendicular.clone().multiplyScalar(-1))) { box.position.add(perpendicular.clone().multiplyScalar(-1)); } }
            if (!moved) {
                const size = new THREE.Vector3(box.geometry.parameters.width, box.geometry.parameters.height, box.geometry.parameters.depth);
                setNewDestinationInside(box, size);
            }
        }
    }
}

function createEnemy(type, wave) {
    let geometry, material, size, speed, hp, attackRange, attackDamage, attackCooldown, projectileSpeed = 15;
    const waveHpMultiplier = 1 + 0.1 * (wave - 1);
    const waveSpeedMultiplier = 1 + 0.05 * (wave - 1);
    const waveDamageMultiplier = 1 + 0.08 * (wave - 1);
    switch (type) {
        case 'minion':
            geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
            material = new THREE.MeshBasicMaterial({ color: 0xcc8400 });
            size = new THREE.Vector3(0.5, 0.5, 0.5);
            speed = (randomInRange(6, 9)) * waveSpeedMultiplier;
            hp = 20 * waveHpMultiplier;
            attackRange = 1.8;
            attackDamage = 3 * waveDamageMultiplier;
            attackCooldown = 0.8;
            break;
        case 'melee':
            geometry = new THREE.BoxGeometry(1, 1, 1);
            material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
            size = new THREE.Vector3(1, 1, 1);
            speed = (randomInRange(4, 6)) * waveSpeedMultiplier;
            hp = 40 * waveHpMultiplier;
            attackRange = 2.0;
            attackDamage = 10 * waveDamageMultiplier;
            attackCooldown = 1.0;
            break;
        case 'ranged':
            geometry = new THREE.BoxGeometry(0.8, 1.2, 0.8);
            material = new THREE.MeshBasicMaterial({ color: 0x0066ff });
            size = new THREE.Vector3(0.8, 1.2, 0.8);
            speed = (randomInRange(3, 5)) * waveSpeedMultiplier;
            hp = 30 * waveHpMultiplier;
            attackRange = 15.0;
            attackDamage = 12 * waveDamageMultiplier;
            attackCooldown = 2.0;
            break;
        case 'healer':
            geometry = new THREE.BoxGeometry(0.7, 1.0, 0.7);
            material = new THREE.MeshBasicMaterial({ color: 0x90ee90 });
            size = new THREE.Vector3(0.7, 1.0, 0.7);
            speed = (randomInRange(5, 7)) * waveSpeedMultiplier;
            hp = 50 * waveHpMultiplier;
            attackRange = 15.0;
            attackDamage = 50;
            attackCooldown = 0.5;
            break;
        case 'boss':
            geometry = new THREE.BoxGeometry(2.5, 2.5, 2.5);
            material = new THREE.MeshBasicMaterial({ color: 0x9900ff });
            size = new THREE.Vector3(2.5, 2.5, 2.5);
            speed = (randomInRange(2, 3)) * waveSpeedMultiplier;
            hp = 500 * waveHpMultiplier;
            attackRange = 18.0;
            attackDamage = 25 * waveDamageMultiplier;
            attackCooldown = 1.2;
            projectileSpeed = 60.0;
            break;
    }
    const box = new THREE.Mesh(geometry, material);
    box.position.y = size.y / 2;
    setRandomPositionInside(box, size);
    box.userData = { type, speed, maxHp: hp, hp, attackRange, attackDamage, lastAttackTime: 0, attackCooldown, projectileSpeed, destination: null, lastKnownPlayerPos: null, aiState: 'idle' };
    if (type === 'boss') {
        box.userData.lastAoeTime = 0;
        box.userData.aoeCooldown = BOSS_AOE_COOLDOWN;
    }
    if (type === 'healer') { box.userData.selfHealRate = 5 * waveHpMultiplier; }
    const healthBarDiv = document.createElement('div');
    healthBarDiv.className = 'health-bar-container';
    const healthBarFill = document.createElement('div');
    healthBarFill.className = 'health-bar-fill';
    healthBarDiv.appendChild(healthBarFill);
    const healthBarLabel = new THREE.CSS2DObject(healthBarDiv);
    healthBarLabel.position.set(0, size.y / 2 + 0.5, 0);
    box.add(healthBarLabel);
    box.userData.healthBar = healthBarFill;
    box.userData.healthBarLabel = healthBarLabel;
    return box;
}

function handleBossAoeAttack(boss) {
    const indicatorGeo = new THREE.CylinderGeometry(BOSS_AOE_RADIUS, BOSS_AOE_RADIUS, 0.1, 32);
    const indicatorMat = new THREE.MeshBasicMaterial({ color: 0x9900ff, transparent: true, opacity: 0.5 });
    const indicator = new THREE.Mesh(indicatorGeo, indicatorMat);
    indicator.position.copy(boss.position);
    indicator.position.y = 0.02;
    indicator.scale.set(0.01, 1, 0.01);
    scene.add(indicator);
    const startTime = performance.now();
    const animateIndicator = () => {
        const elapsedTime = performance.now() - startTime;
        const progress = Math.min(elapsedTime / BOSS_AOE_TELEGRAPH_TIME, 1.0);
        indicator.scale.set(progress, 1, progress);
        if (progress < 1.0) requestAnimationFrame(animateIndicator);
    };
    animateIndicator();
    setTimeout(() => {
        const playerPos = controls.getObject().position;
        if (boss.position.distanceTo(playerPos) < BOSS_AOE_RADIUS) damagePlayer(BOSS_AOE_DAMAGE);
        const fadeOut = setInterval(() => {
            indicator.material.opacity -= 0.1;
            if (indicator.material.opacity <= 0) {
                clearInterval(fadeOut);
                scene.remove(indicator);
                indicatorMat.dispose();
                indicatorGeo.dispose();
            }
        }, 50);
    }, BOSS_AOE_TELEGRAPH_TIME);
}

function createProjectile(fromEnemy, targetPosition) {
    const pGeom = new THREE.SphereGeometry(0.1, 8, 8);
    const pMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });
    const p = new THREE.Mesh(pGeom, pMat);
    p.position.copy(fromEnemy.position);
    p.position.y += 0.5;
    const dir = new THREE.Vector3().subVectors(targetPosition, p.position).normalize();
    p.userData = { velocity: dir.multiplyScalar(fromEnemy.userData.projectileSpeed || 15.0), lifeTime: 4.0, damage: fromEnemy.userData.attackDamage };
    scene.add(p);
    if (!window.projectiles) window.projectiles = [];
    window.projectiles.push(p);
}

function createHealBeam(fromHealer, toTarget) {
    const startPoint = fromHealer.position.clone();
    const endPoint = toTarget.position.clone();
    createTracer(startPoint, endPoint, 0x00ff00, 0.05, 300);
}
const controls = new THREE.PointerLockControls(camera, document.body);
scene.add(controls.getObject());
const PLAYER_BOX_SIZE = new THREE.Vector3(0.6, 1.8, 0.6);

function findSafePlayerSpawn() {
    for (let i = 0; i < 100; i++) {
        const x = randomInRange(-22, 22);
        const z = randomInRange(-22, 22);
        const candidatePos = new THREE.Vector3(x, PLAYER_EYE_HEIGHT, z);
        const boxCenter = candidatePos.clone();
        boxCenter.y = PLAYER_BOX_SIZE.y / 2;
        const playerBox = new THREE.Box3().setFromCenterAndSize(boxCenter, PLAYER_BOX_SIZE);
        if (!isBoxIntersectingWalls(playerBox)) return candidatePos;
    }
    return new THREE.Vector3(-15, PLAYER_EYE_HEIGHT, -15);
}
controls.getObject().position.copy(findSafePlayerSpawn());
document.body.addEventListener('click', () => { if (gameState === 'playing') controls.lock(); });
const keyboard = {};
document.addEventListener('keydown', (e) => { keyboard[e.code] = true; });
document.addEventListener('keyup', (e) => { keyboard[e.code] = false; });
const playerDirection = new THREE.Vector3();
let baseSpeed = 4.5,
    sprintMultiplier = 1.6,
    playerSpeed = baseSpeed,
    isSprinting = false;
const raycaster = new THREE.Raycaster();
const audioLoader = new THREE.AudioLoader();
const hitSound = new THREE.Audio(listener),
    reloadSound = new THREE.Audio(listener),
    meleeHitSound = new THREE.Audio(listener),
    grenadeThrowSound = new THREE.Audio(listener),
    grenadeExplosionSound = new THREE.Audio(listener),
    pickupSound = new THREE.Audio(listener),
    walkSprintSound = new THREE.Audio(listener), // เพิ่มบรรทัดนี้
    takeDamageSound = new THREE.Audio(listener); // เพิ่มบรรทัดนี้

function setupSound(audio, path, volume, loop = false) {
    audioLoader.load(path, (buffer) => {
        audio.setBuffer(buffer);
        audio.setLoop(loop);
        audio.setVolume(volume);
    });
    return audio;
}

// เปลี่ยนจาก static/sounds/ เป็น GitHub Pages URL
const baseURL = 'https://meone101201.github.io/Anime-Rangers-X-/assets/sound/';

weapons.pistol.sound = setupSound(new THREE.Audio(listener), baseURL + 'pistol.mp3', 0.5);
weapons.rifle.sound = setupSound(new THREE.Audio(listener), baseURL + 'rifle.mp3', 0.4);
weapons.shotgun.sound = setupSound(new THREE.Audio(listener), baseURL + 'shotgun.mp3', 0.6);
setupSound(hitSound, baseURL + 'hit.mp3', 0.8);
setupSound(reloadSound, baseURL + 'reload.mp3', 0.5);
setupSound(meleeHitSound, baseURL + 'melee_hit.mp3', 0.7);
setupSound(grenadeThrowSound, baseURL + 'grenade_throw.mp3', 0.8);
setupSound(grenadeExplosionSound, baseURL + 'grenade_explode.mp3', 1.0);
setupSound(pickupSound, baseURL + 'pickup.mp3', 1.5);
setupSound(walkSprintSound, baseURL + 'walkandsprint.mp3', 0.2, true); // ตั้งค่า loop เป็น true
setupSound(takeDamageSound, baseURL + 'takedamage.mp3', 0.6);

function createTracer(startPoint, endPoint, color = 0xffff00, size = 0.03, lifetime = 120) {
    const distance = startPoint.distanceTo(endPoint);
    const tracerMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.7 });
    const tracerGeom = new THREE.BoxGeometry(size, size, distance);
    const tracer = new THREE.Mesh(tracerGeom, tracerMat);
    tracer.position.copy(startPoint).lerp(endPoint, 0.5);
    tracer.lookAt(endPoint);
    scene.add(tracer);
    setTimeout(() => {
        scene.remove(tracer);
        tracerMat.dispose();
        tracerGeom.dispose();
    }, lifetime);
}

const hitMarkerElement = document.getElementById('hit-marker');
let hitMarkerTimeout;

function showHitMarker() {
    if (!hitMarkerElement) return;
    hitMarkerElement.style.opacity = 1;
    if (hitMarkerTimeout) clearTimeout(hitMarkerTimeout);
    hitMarkerTimeout = setTimeout(() => { hitMarkerElement.style.opacity = 0; }, 120);
}

const damageNumberContainer = document.getElementById('damage-number-container');

function projectWorldToScreen(worldVector, camera) { const vector = worldVector.clone().project(camera); const x = (vector.x * 0.5 + 0.5) * window.innerWidth; const y = (vector.y * -0.5 + 0.5) * window.innerHeight; return { x, y }; }

function showDamageNumber(hitPoint, damage, isHeadshot = false) {
    if (!damageNumberContainer) return;
    const screenPos = projectWorldToScreen(hitPoint, camera);
    const damageDiv = document.createElement('div');
    damageDiv.className = 'damage-number';
    if (isHeadshot) { damageDiv.classList.add('headshot'); }
    damageDiv.textContent = Math.round(damage);
    damageDiv.style.left = `${screenPos.x}px`;
    damageDiv.style.top = `${screenPos.y}px`;
    damageNumberContainer.appendChild(damageDiv);
    setTimeout(() => { if (damageNumberContainer.contains(damageDiv)) { damageNumberContainer.removeChild(damageDiv); } }, 1000);
}

function damageEnemy(obj, hitPoint, damageAmount, isHeadshot = false) {
    if (!obj.visible || obj.userData.hp <= 0) return;

    const finalDamage = damageAmount * baseWeaponDamageMultiplier * damageMultiplier;

    showHitMarker();
    showDamageNumber(hitPoint, finalDamage, isHeadshot);

    if (hasFrostRounds && !obj.userData.isSlowed) {
        if (Math.random() < 0.15) {
            obj.userData.isSlowed = true;
            obj.userData.slowTimer = 3.0;
            obj.material.color.set(0xADD8E6);
        }
    }

    obj.userData.hp -= finalDamage;
    const healthPercentage = Math.max(0, obj.userData.hp / obj.userData.maxHp) * 100;
    if (obj.userData.healthBar) { obj.userData.healthBar.style.width = `${healthPercentage}%`; }

    if (hitSound.buffer) {
        if (hitSound.isPlaying) hitSound.stop();
        hitSound.play();
    }

    if (obj.userData.hp <= 0) {
        obj.visible = false;
        if (obj.userData.healthBarLabel) obj.userData.healthBarLabel.visible = false;
        enemiesAlive = Math.max(0, enemiesAlive - 1);
        score += obj.userData.type === 'healer' ? 25 : (obj.userData.type === 'boss' ? 100 : 10);
        if (isHeadshot) score += 5;
        money += getMoneyDropForType(obj.userData.type);
        if (scoreElement) scoreElement.textContent = 'คะแนน: ' + score;
        kills += 1;
        updateWaveHUD();
        if (score > highScore) {
            highScore = score;
            localStorage.setItem('fps_highscore', String(highScore));
            if (highscoreElement) highscoreElement.textContent = `คะแนนสูงสุด: ${highScore}`;
        }
        if (enemiesAlive <= 0) enterShopPhase(wave + 1);
    }
}

function handleShooting() {
    if (isReloading) return;
    const now = performance.now() / 1000;
    if (now - lastShotAt < 1 / currentWeapon.fireRate) return;
    lastShotAt = now;
    if (currentWeapon.magazine <= 0) { tryReload(); return; }
    currentWeapon.magazine -= 1;
    updateAmmoHUD();
    if (currentWeapon.sound && currentWeapon.sound.buffer) {
        if (currentWeapon.sound.isPlaying) currentWeapon.sound.stop();
        currentWeapon.sound.play();
    }

    for (let i = 0; i < currentWeapon.pellets; i++) {
        const spreadX = (Math.random() - 0.5) * currentWeapon.spread;
        const spreadY = (Math.random() - 0.5) * currentWeapon.spread;
        raycaster.setFromCamera(new THREE.Vector2(spreadX, spreadY), camera);
        const startPoint = new THREE.Vector3();
        camera.getWorldPosition(startPoint);
        const randomOffset = new THREE.Vector3((Math.random() - 0.5) * 0.05, (Math.random() - 0.5) * 0.05, (Math.random() - 0.5) * 0.05).applyQuaternion(camera.quaternion);
        startPoint.add(randomOffset);
        
        let effectiveRange = 100;
        if (currentWeaponKey === 'shotgun') effectiveRange = 15;
        raycaster.far = effectiveRange;
        
        const allObjects = [...walls, ...boxes.filter(b => b.visible)];
        const intersects = raycaster.intersectObjects(allObjects, false);
        
        let hitSomething = false;
        let lastHitPoint = null;
        const hitEnemies = new Set();
        let currentPelletDamage = weapons[currentWeaponKey].baseDamage;
        let piercedWallCount = 0;

        for (const hit of intersects) {
            const hitObject = hit.object;
            lastHitPoint = hit.point;

            if (walls.includes(hitObject)) {
                hitSomething = true;
                let shouldPierce = false;
                if (currentWeaponKey === 'shotgun') {
                    shouldPierce = true; 
                } else if (Math.random() < 0.5 && piercedWallCount < 2) {
                    shouldPierce = true;
                }
                if (shouldPierce) {
                    piercedWallCount++;
                    continue;
                } else {
                    break;
                }
            }
            
            if (hitObject.userData.type && !hitEnemies.has(hitObject.uuid)) {
                hitSomething = true;
                hitEnemies.add(hitObject.uuid);
                let finalDamage = currentPelletDamage;
                let isHeadshot = false;
                const enemyHeight = hitObject.geometry.parameters.height;
                const hitPointY = hit.point.y;
                const enemyBaseY = hitObject.position.y - (enemyHeight / 2);
                const hitHeightOnObject = hitPointY - enemyBaseY;
                const headshotThreshold = enemyHeight * 0.75;
                if (hitHeightOnObject >= headshotThreshold) {
                    isHeadshot = true;
                    finalDamage *= HEADSHOT_MULTIPLIER;
                }
                if (piercedWallCount > 0 && currentWeaponKey !== 'shotgun') {
                    finalDamage *= 0.1;
                }
                damageEnemy(hitObject, hit.point, finalDamage, isHeadshot);
                if (currentWeaponKey === 'shotgun' || hasAPRounds) {
                    if (hasAPRounds && currentWeaponKey !== 'shotgun') {
                        currentPelletDamage *= 0.7;
                    }
                    continue;
                } else {
                    break;
                }
            }
        }
        if (hitSomething) { 
            createTracer(startPoint, lastHitPoint); 
        } else { 
            createTracer(startPoint, raycaster.ray.at(effectiveRange, new THREE.Vector3())); 
        }
    }
}

document.body.addEventListener('mousedown', (e) => {
    if (!controls.isLocked || e.button !== 0 || gameState !== 'playing') return;
    isShooting = true;
    handleShooting();
});
document.body.addEventListener('mouseup', (e) => { if (e.button === 0) isShooting = false; });
document.addEventListener('keydown', (e) => { if (gameState === 'playing' || gameState === 'shop') { if (e.code === 'KeyR' && gameState === 'playing') tryReload(); if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') isSprinting = true; if (e.code === 'Digit1') switchWeapon('pistol'); if (e.code === 'Digit2') switchWeapon('rifle'); if (e.code === 'Digit3') switchWeapon('shotgun'); if (e.code === 'KeyV') handleMeleeAttack(); if (e.code === 'KeyG') handleGrenadeThrow(); } });

function createMeleeEffect() {
    const swooshGeometry = new THREE.PlaneGeometry(1.5, 0.1);
    const swooshMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 });
    const swoosh = new THREE.Mesh(swooshGeometry, swooshMaterial);
    swoosh.position.set(0.3, -0.2, -1);
    swoosh.rotation.z = (Math.random() - 0.5) * 0.5;
    camera.add(swoosh);
    setTimeout(() => {
        camera.remove(swoosh);
        swooshGeometry.dispose();
        swooshMaterial.dispose();
    }, 150);
}

function handleMeleeAttack() {
    if (meleeCooldown > 0 || !controls.isLocked) return;
    meleeCooldown = MELEE_COOLDOWN_TIME;
    createMeleeEffect();
    if (meleeHitSound.buffer) {
        if (meleeHitSound.isPlaying) meleeHitSound.stop();
        meleeHitSound.play();
    }
    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
    const intersects = raycaster.intersectObjects(boxes.filter(b => b.visible));
    if (intersects.length > 0 && intersects[0].distance <= MELEE_RANGE) { damageEnemy(intersects[0].object, intersects[0].point, MELEE_DAMAGE); }
}

function handleGrenadeThrow() {
    if (grenadeCount <= 0 || !controls.isLocked) return;
    grenadeCount--;
    updateGrenadeHUD();
    if (grenadeThrowSound.buffer) { grenadeThrowSound.play(); }
    const grenadeGeo = new THREE.SphereGeometry(0.2, 16, 16);
    const grenadeMat = new THREE.MeshBasicMaterial({ color: 0x228B22 });
    const grenade = new THREE.Mesh(grenadeGeo, grenadeMat);
    const camDir = new THREE.Vector3();
    camera.getWorldDirection(camDir);
    const startPos = controls.getObject().position.clone().add(camDir.multiplyScalar(1));
    grenade.position.copy(startPos);
    camDir.y += 0.3;
    grenade.userData.velocity = camDir.normalize().multiplyScalar(GRENADE_THROW_FORCE);
    grenade.userData.lifeTime = GRENADE_FUSE_TIME;
    grenades.push(grenade);
    scene.add(grenade);
}

function handleGrenadeExplosion(position) {
    if (grenadeExplosionSound.buffer) {
        const sound = new THREE.PositionalAudio(listener);
        sound.setBuffer(grenadeExplosionSound.buffer);
        sound.setRefDistance(10);
        sound.setVolume(1.0);
        sound.play();
        const explosionVisual = new THREE.Mesh(new THREE.SphereGeometry(0.1, 1, 1), new THREE.MeshBasicMaterial());
        explosionVisual.position.copy(position);
        scene.add(explosionVisual);
        explosionVisual.add(sound);
        setTimeout(() => scene.remove(explosionVisual), 1000);
    }
    const explosionGeom = new THREE.SphereGeometry(GRENADE_EXPLOSION_RADIUS, 32, 16);
    const explosionMat = new THREE.MeshBasicMaterial({ color: 0xffa500, transparent: true, opacity: 0.7 });
    const explosion = new THREE.Mesh(explosionGeom, explosionMat);
    explosion.position.copy(position);
    scene.add(explosion);
    let scale = 0.1;
    const expandInterval = setInterval(() => {
        scale += 0.2;
        explosion.scale.set(scale, scale, scale);
        if (scale >= 1.0) {
            clearInterval(expandInterval);
            const fadeInterval = setInterval(() => {
                explosion.material.opacity -= 0.1;
                if (explosion.material.opacity <= 0) {
                    clearInterval(fadeInterval);
                    scene.remove(explosion);
                    explosionMat.dispose();
                    explosionGeom.dispose();
                }
            }, 20);
        }
    }, 10);
    boxes.forEach(box => {
        if (box.visible) {
            const distance = box.position.distanceTo(position);
            if (distance <= GRENADE_EXPLOSION_RADIUS) {
                const damageFalloff = 1 - (distance / GRENADE_EXPLOSION_RADIUS);
                const damage = Math.round(GRENADE_EXPLOSION_DAMAGE * damageFalloff);
                const hitPoint = box.position.clone().add(new THREE.Vector3(0, box.geometry.parameters.height / 2, 0));
                damageEnemy(box, hitPoint, damage);
                const playerPos = controls.getObject().position;
                box.userData.lastKnownPlayerPos = playerPos.clone();
                box.userData.aiState = 'chasing';
            }
        }
    });
    const playerPos = controls.getObject().position;
    const playerDistance = playerPos.distanceTo(position);
    if (playerDistance <= GRENADE_EXPLOSION_RADIUS) {
        const damageFalloff = 1 - (playerDistance / GRENADE_EXPLOSION_RADIUS);
        const damage = Math.round(GRENADE_EXPLOSION_DAMAGE * 0.5 * damageFalloff);
        damagePlayer(damage);
    }
}

// --- CHANGE: Translate reload message ---
function tryReload() {
    if (isReloading || currentWeapon.magazine >= currentWeapon.maxMagazine || currentWeapon.reserve <= 0) return;
    isShooting = false;
    isReloading = true;
    if (reloadSound && reloadSound.buffer) {
        if (reloadSound.isPlaying) reloadSound.stop();
        reloadSound.play();
    }
    if (damageMultiplierTimer <= 0) statusElement.innerHTML = 'กำลังรีโหลด...';
    setTimeout(() => {
        const needed = currentWeapon.maxMagazine - currentWeapon.magazine;
        const toLoad = Math.min(needed, currentWeapon.reserve);
        currentWeapon.magazine += toLoad;
        currentWeapon.reserve -= toLoad;
        isReloading = false;
        if (damageMultiplierTimer <= 0) statusElement.innerHTML = '';
        updateAmmoHUD();
    }, currentWeapon.reloadTime * 1000);
}
// --- END CHANGE ---

document.addEventListener('keyup', (e) => { if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') { isSprinting = false; } });

function switchWeapon(key) {
    if (!weapons[key] || isReloading) return;
    isShooting = false;
    currentWeaponKey = key;
    currentWeapon = weapons[key];
    updateAmmoHUD();
}

const clock = new THREE.Clock();
let wave = 1,
    kills = 0;
let highScore = Number(localStorage.getItem('fps_highscore') || 0);
if (highscoreElement) highscoreElement.textContent = `คะแนนสูงสุด: ${highScore}`;

function updateWaveHUD() {
    if (waveElement) waveElement.textContent = `เวฟ: ${wave}`;
    if (killsElement) killsElement.textContent = `สังหาร: ${kills}`;
    let m = 0, s = 0, r = 0, b = 0, h = 0;
    boxes.forEach(box => {
        if (box.visible) {
            if (box.userData.type === 'melee') m++;
            else if (box.userData.type === 'minion') s++;
            else if (box.userData.type === 'ranged') r++;
            else if (box.userData.type === 'boss') b++;
            else if (box.userData.type === 'healer') h++;
        }
    });
    const enemyCountEl = document.getElementById('enemy-count');
    if (enemyCountEl) enemyCountEl.textContent = `ศัตรู: ${m}M ${s}S ${r}R ${h}H ${b}B`;
}
updateWaveHUD();
let enemiesToSpawnThisWave = 0,
    enemiesAlive = 0;
let gameState = 'menu';
let countdownTimer = 0;
const startMenu = document.getElementById('start-menu');
const startBtn = document.getElementById('start-btn');
const menuHighscore = document.getElementById('menu-highscore');

function getUpgradeCost(baseCost, level) { return Math.round(baseCost * Math.pow(1.5, level)); }

// --- CHANGE: Translate shop UI text ---
function updateShopUI() {
    shopMoneyAmount.textContent = money;
    shopWaveNumber.textContent = wave;
    scoreElement.textContent = 'คะแนน: ' + score;
    buyHealthBtn.disabled = playerHP >= playerMaxHP || money < 250;
    buyAmmoBtn.disabled = money < 400;
    buyGrenadeBtn.disabled = money < 500;
    const currentDamageCost = getUpgradeCost(750, damageUpgradeLevel);
    upgradeDamageCost.textContent = `$${currentDamageCost} (เลเวล ${damageUpgradeLevel})`;
    upgradeDamageBtn.disabled = money < currentDamageCost;
    const currentHpCost = getUpgradeCost(600, hpUpgradeLevel);
    upgradeHpCost.textContent = `$${currentHpCost} (เลเวล ${hpUpgradeLevel})`;
    upgradeHpBtn.disabled = money < currentHpCost;
    buyScopeBtn.disabled = money < 1200 || hasScope;
    if (hasScope) buyScopeBtn.querySelector('.item-name').textContent = 'สโคป (มีแล้ว)';
    buyExtMagBtn.disabled = money < 1500 || hasExtendedMag;
    if (hasExtendedMag) buyExtMagBtn.querySelector('.item-name').textContent = 'แม็กกาซีนเสริม (มีแล้ว)';
    buyGripBtn.disabled = money < 1000 || hasGrip;
    if (hasGrip) buyGripBtn.querySelector('.item-name').textContent = 'ด้ามจับ (มีแล้ว)';
    buyFrostBtn.disabled = money < 2000 || hasFrostRounds;
    if (hasFrostRounds) buyFrostBtn.querySelector('.item-name').textContent = 'กระสุนน้ำแข็ง (มีแล้ว)';
    buyApBtn.disabled = money < 2500 || hasAPRounds;
    if (hasAPRounds) buyApBtn.querySelector('.item-name').textContent = 'กระสุนเจาะเกราะ (มีแล้ว)';
}
// --- END CHANGE ---

function showShop() {
    if (walkSprintSound && walkSprintSound.isPlaying) {
        walkSprintSound.stop();
    }
    gameState = 'shop';
    document.body.classList.add('shop-active');
    shopOverlay.style.display = 'flex';
    controls.unlock();
    updateShopUI();
}

function enterShopPhase(nextWave) {
    showShop();
    startNextWaveBtn.onclick = () => { startNextWaveCountdown(nextWave); };
}

function hideShop() {
    document.body.classList.remove('shop-active');
    shopOverlay.style.display = 'none';
}
buyHealthBtn.onclick = () => {
    const cost = 250;
    if (money >= cost && playerHP < playerMaxHP) {
        money -= cost;
        playerHP = Math.min(playerMaxHP, playerHP + (playerMaxHP / 2));
        updateHealthHUD();
        updateShopUI();
    }
};
buyAmmoBtn.onclick = () => {
    const cost = 400;
    if (money >= cost) {
        money -= cost;
        for (const key in weapons) {
            weapons[key].reserve = weapons[key].baseReserve;
        }
        updateAmmoHUD();
        updateShopUI();
    }
};
buyGrenadeBtn.onclick = () => {
    const cost = 500;
    if (money >= cost) {
        money -= cost;
        grenadeCount++;
        updateGrenadeHUD();
        updateShopUI();
    }
};
upgradeDamageBtn.onclick = () => {
    const cost = getUpgradeCost(750, damageUpgradeLevel);
    if (money >= cost) {
        money -= cost;
        damageUpgradeLevel++;
        baseWeaponDamageMultiplier += 0.1;
        updateShopUI();
    }
};
upgradeHpBtn.onclick = () => {
    const cost = getUpgradeCost(600, hpUpgradeLevel);
    if (money >= cost) {
        money -= cost;
        hpUpgradeLevel++;
        playerMaxHP += 20;
        playerHP += 20;
        updateHealthHUD();
        updateShopUI();
    }
};
buyScopeBtn.onclick = () => {
    const cost = 1200;
    if (money >= cost && !hasScope) {
        money -= cost;
        hasScope = true;
        for (const key in weapons) { weapons[key].spread = weapons[key].baseSpread * 0.7; }
        updateShopUI();
    }
};
buyExtMagBtn.onclick = () => {
    const cost = 1500;
    if (money >= cost && !hasExtendedMag) {
        money -= cost;
        hasExtendedMag = true;
        for (const key in weapons) {
            const weapon = weapons[key];
            const oldMax = weapon.maxMagazine;
            weapon.maxMagazine = Math.round(weapon.baseMaxMagazine * 1.25);
            const ammoGained = weapon.maxMagazine - oldMax;
            weapon.magazine += ammoGained;
        }
        updateAmmoHUD();
        updateShopUI();
    }
};
buyGripBtn.onclick = () => {
    const cost = 1000;
    if (money >= cost && !hasGrip) {
        money -= cost;
        hasGrip = true;
        for (const key in weapons) { weapons[key].reloadTime = weapons[key].baseReloadTime * 0.5; }
        updateShopUI();
    }
};
buyFrostBtn.onclick = () => {
    const cost = 2000;
    if (money >= cost && !hasFrostRounds) {
        money -= cost;
        hasFrostRounds = true;
        updateShopUI();
    }
};
buyApBtn.onclick = () => {
    const cost = 2500;
    if (money >= cost && !hasAPRounds) {
        money -= cost;
        hasAPRounds = true;
        updateShopUI();
    }
};

function showMenu() {
    gameState = 'menu';
    document.body.classList.add('menu-active');
    if (startMenu) startMenu.style.display = 'flex';
    if (renderer.domElement) renderer.domElement.classList.add('blurred');
    controls.unlock();
    clearEnemies();
}

function hideMenu() { document.body.classList.remove('menu-active'); if (startMenu) startMenu.style.display = 'none'; if (renderer.domElement) renderer.domElement.classList.remove('blurred'); }

// --- GAME START LOGIC (Corrected) ---
function startGame() {
    hideMenu();
    if(howToPlayOverlay) howToPlayOverlay.style.display = 'flex';
}

function countdownTick(onComplete) {
    if (gameState !== 'countdown' && gameState !== 'shop-countdown') return;
    countdownTimer--;
    if (centerMessage) {
        if (countdownTimer > 0) {
            centerMessage.innerHTML = 'เตรียมพร้อม!<br>' + countdownTimer;
            setTimeout(() => countdownTick(onComplete), 1000);
        } else {
            centerMessage.style.display = 'none';
            if (onComplete) onComplete();
        }
    }
}

if (startBtn) {
    startBtn.onclick = startGame;
}

if (continueToGameBtn) {
    continueToGameBtn.onclick = () => {
        if(howToPlayOverlay) howToPlayOverlay.style.display = 'none';
        resetGameStats();
        gameState = 'countdown';
        countdownTimer = 5;
        if (centerMessage) {
            centerMessage.innerHTML = 'เตรียมพร้อม!<br>' + countdownTimer;
            centerMessage.style.display = 'block';
        }
        const onComplete = () => {
            gameState = 'playing';
            startWave(1);
        };
        setTimeout(() => countdownTick(onComplete), 1000);
    };
}
// --- END GAME START LOGIC ---


function updateMenuHighscore() { if (menuHighscore) menuHighscore.textContent = 'คะแนนสูงสุด: ' + (localStorage.getItem('fps_highscore') || 0); }
updateMenuHighscore();
showMenu();

// --- CHANGE: Translate game over message ---
function gameOver() {
    if (walkSprintSound && walkSprintSound.isPlaying) {
        walkSprintSound.stop();
    }
    gameState = 'gameover';
    isShooting = false;
    if (gameOverOverlay) {
        gameOverOverlay.innerHTML = `เกมจบแล้ว<br/>คุณไปถึงเวฟที่: ${wave}<br/>กด F เพื่อกลับไปที่เมนู`;
        gameOverOverlay.style.display = 'block';
    }
    if (renderer.domElement) renderer.domElement.classList.add('blurred');
    controls.unlock();
    document.body.style.pointerEvents = 'none';
}
// --- END CHANGE ---


function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    renderer.render(scene, camera);
    labelRenderer.render(scene, camera);
    if (gameState !== 'playing') { return; }

    if (isShooting && (currentWeaponKey === 'rifle' || currentWeaponKey === 'pistol')) handleShooting();
    if (meleeCooldown > 0) meleeCooldown -= delta;
    
    // --- CHANGE: Translate status messages ---
    if (damageMultiplierTimer > 0) {
        damageMultiplierTimer -= delta;
        statusElement.innerHTML = `<span style="color: #d3a0ff;">ความเสียหาย 2 เท่า: ${damageMultiplierTimer.toFixed(1)}s</span>`;
        if (damageMultiplierTimer <= 0) { damageMultiplier = 1; if (!isReloading) statusElement.innerHTML = ''; }
    }
    // --- END CHANGE ---

    if (isSprinting) {
        if (playerStamina > 0) {
            playerStamina = Math.max(0, playerStamina - STAMINA_DRAIN_RATE * delta);
            staminaRegenCooldown = STAMINA_REGEN_DELAY;
        }
    } else { if (staminaRegenCooldown > 0) { staminaRegenCooldown -= delta; } else if (playerStamina < playerMaxStamina) { playerStamina = Math.min(playerMaxStamina, playerStamina + STAMINA_REGEN_RATE * delta); } }
    updateStaminaHUD();
    if (damageCooldown > 0) damageCooldown = Math.max(0, damageCooldown - delta);
    if (debugPos) {
        const p = controls.getObject().position;
        debugPos.textContent = `pos x:${p.x.toFixed(2)} y:${p.y.toFixed(2)} z:${p.z.toFixed(2)} | wave:${wave} alive:${enemiesAlive}`;
    }

    if (controls.isLocked) {
        const forward = (keyboard['KeyW'] ? 1 : 0) - (keyboard['KeyS'] ? 1 : 0);
        const strafe = (keyboard['KeyD'] ? 1 : 0) - (keyboard['KeyA'] ? 1 : 0);
        const isMoving = forward !== 0 || strafe !== 0; 

        playerDirection.set(strafe, 0, forward).normalize();
        const canSprint = isSprinting && playerStamina > 0 && isMoving;
        playerSpeed = canSprint ? baseSpeed * sprintMultiplier : baseSpeed;

        if (walkSprintSound.buffer) {
            if (isMoving && !walkSprintSound.isPlaying) {
                walkSprintSound.play();
            } else if (!isMoving && walkSprintSound.isPlaying) {
                walkSprintSound.stop();
            }

            if (walkSprintSound.isPlaying) {
                const targetPlaybackRate = canSprint ? 0.8 : 0.4;
                walkSprintSound.setPlaybackRate(walkSprintSound.getPlaybackRate() + (targetPlaybackRate - walkSprintSound.getPlaybackRate()) * 0.1);
            }
        }
        
        const targetFov = canSprint ? 85 : 75;
        camera.fov += (targetFov - camera.fov) * Math.min(1, delta * 10);
        camera.updateProjectionMatrix();
        const moveSpeed = playerSpeed * delta;
        const originalPosition = controls.getObject().position.clone();
        controls.moveForward(playerDirection.z * moveSpeed);
        controls.moveRight(playerDirection.x * moveSpeed);
        controls.getObject().position.y = PLAYER_EYE_HEIGHT;
        const boxCenter = controls.getObject().position.clone();
        boxCenter.y = PLAYER_BOX_SIZE.y / 2;
        const playerBox = new THREE.Box3().setFromCenterAndSize(boxCenter, PLAYER_BOX_SIZE);
        if (isBoxIntersectingWalls(playerBox)) { controls.getObject().position.copy(originalPosition); }
    }

    const playerPos = controls.getObject().position;
    boxes.forEach(box => {
        if (!box.visible) return;
        let currentSpeed = box.userData.speed;
        if (box.userData.isSlowed) {
            currentSpeed *= 0.4;
            box.userData.slowTimer -= delta;
            if (box.userData.slowTimer <= 0) {
                box.userData.isSlowed = false;
                const originalColor = { minion: 0xcc8400, melee: 0xff0000, ranged: 0x0066ff, healer: 0x90ee90, boss: 0x9900ff }[box.userData.type];
                if (originalColor) box.material.color.set(originalColor);
            }
        }
        const dirToPlayer = new THREE.Vector3().subVectors(playerPos, box.position).normalize();
        raycaster.set(box.position, dirToPlayer);
        const wallIntersects = raycaster.intersectObjects(walls);
        const distanceToPlayer = box.position.distanceTo(playerPos);
        let canSeePlayer = false;
        if (wallIntersects.length === 0 || wallIntersects[0].distance > distanceToPlayer) { canSeePlayer = true; }
        if (canSeePlayer) { box.userData.lastKnownPlayerPos = playerPos.clone(); if (box.userData.aiState !== 'chasing') { box.userData.aiState = 'chasing'; } } else { if (box.userData.aiState === 'chasing') { box.userData.aiState = 'investigating'; } }
        const currentTime = performance.now() / 1000;
        if (box.userData.type === 'boss' && box.userData.aiState === 'chasing') {
            if (currentTime - box.userData.lastAoeTime > box.userData.aoeCooldown) {
                box.userData.lastAoeTime = currentTime;
                handleBossAoeAttack(box);
            }
        }
        if (box.userData.type === 'healer') {
            if (currentTime - box.userData.lastAttackTime >= box.userData.attackCooldown) {
                const healableAllies = [];
                boxes.forEach(ally => { if (ally.visible && ally !== box && ally.userData.hp < ally.userData.maxHp) { const distanceToAlly = box.position.distanceTo(ally.position); if (distanceToAlly < box.userData.attackRange) { healableAllies.push(ally); } } });
                if (healableAllies.length > 0) {
                    healableAllies.sort((a, b) => (a.userData.hp / a.userData.maxHp) - (b.userData.hp / b.userData.maxHp));
                    const targetsToHeal = healableAllies.slice(0, 4);
                    box.userData.lastAttackTime = currentTime;
                    targetsToHeal.forEach(target => {
                        target.userData.hp = Math.min(target.userData.maxHp, target.userData.hp + box.userData.attackDamage);
                        const healthPercentage = Math.max(0, target.userData.hp / target.userData.maxHp) * 100;
                        if (target.userData.healthBar) { target.userData.healthBar.style.width = `${healthPercentage}%`; }
                        createHealBeam(box, target);
                    });
                }
            }
            if (!box.userData.destination || box.position.distanceTo(box.userData.destination) < 1.5) { setNewDestinationInside(box, new THREE.Vector3(0.7, 1.0, 0.7)); }
            if (box.userData.hp < box.userData.maxHp && box.userData.selfHealRate) { box.userData.hp = Math.min(box.userData.maxHp, box.userData.hp + box.userData.selfHealRate * delta); const healthPercentage = Math.max(0, box.userData.hp / box.userData.maxHp) * 100; if (box.userData.healthBar) { box.userData.healthBar.style.width = `${healthPercentage}%`; } }
        } else {
            if (box.userData.aiState === 'chasing') {
                if (distanceToPlayer <= box.userData.attackRange) {
                    box.userData.destination = null;
                    if (currentTime - box.userData.lastAttackTime >= box.userData.attackCooldown) {
                        box.userData.lastAttackTime = currentTime;
                        if (box.userData.type === 'ranged' || box.userData.type === 'boss') { createProjectile(box, playerPos); } else {
                            damagePlayer(box.userData.attackDamage);
                            if (box.userData.type !== 'boss') {
                                const pushbackDir = new THREE.Vector3().subVectors(box.position, playerPos).normalize();
                                box.position.add(pushbackDir.multiplyScalar(0.5));
                            }
                        }
                    }
                } else { box.userData.destination = playerPos.clone(); }
            } else if (box.userData.aiState === 'investigating') {
                if (box.userData.lastKnownPlayerPos) { box.userData.destination = box.userData.lastKnownPlayerPos.clone(); }
                if (box.userData.destination && box.position.distanceTo(box.userData.destination) < 1.0) {
                    box.userData.aiState = 'idle';
                    box.userData.destination = null;
                }
            }
        }
        if (box.userData.aiState === 'idle') {
            if (!box.userData.destination) {
                const size = new THREE.Vector3(box.geometry.parameters.width, box.geometry.parameters.height, box.geometry.parameters.depth);
                setNewDestinationInside(box, size);
            }
        }
        updateEnemyMovement(box, delta, currentSpeed);
    });
    if (window.projectiles) {
        for (let i = window.projectiles.length - 1; i >= 0; i--) {
            const p = window.projectiles[i];
            const oldPos = p.position.clone();
            p.position.add(p.userData.velocity.clone().multiplyScalar(delta));
            const moveDist = p.userData.velocity.length() * delta;
            raycaster.set(oldPos, p.userData.velocity.clone().normalize());
            const wallHits = raycaster.intersectObjects(walls);
            if (wallHits.length > 0 && wallHits[0].distance < moveDist) {
                scene.remove(p);
                window.projectiles.splice(i, 1);
                continue;
            }
            if (p.position.distanceTo(controls.getObject().position) < 0.8) {
                damagePlayer(p.userData.damage);
                scene.remove(p);
                window.projectiles.splice(i, 1);
                continue;
            }
            p.userData.lifeTime -= delta;
            if (p.userData.lifeTime <= 0) {
                scene.remove(p);
                window.projectiles.splice(i, 1);
            }
        }
    }
    for (let i = grenades.length - 1; i >= 0; i--) {
        const g = grenades[i];
        g.userData.velocity.y -= 9.8 * delta;
        g.position.add(g.userData.velocity.clone().multiplyScalar(delta));
        if (g.position.y < 0.2) {
            g.position.y = 0.2;
            g.userData.velocity.y *= -0.2;
            g.userData.velocity.x *= 0.7;
            g.userData.velocity.z *= 0.7;
        }
        g.userData.lifeTime -= delta;
        if (g.userData.lifeTime <= 0) {
            handleGrenadeExplosion(g.position.clone());
            scene.remove(g);
            grenades.splice(i, 1);
        }
    }
    
    // --- CHANGE: Translate pickup status messages ---
    pickups.forEach((p, i) => {
        p.rotation.y += delta * 0.8;
        if (p.position.distanceTo(playerPos) < 1.2) {
            if (pickupSound.buffer) {
                if (pickupSound.isPlaying) pickupSound.stop();
                pickupSound.play();
            }
            switch (p.userData.type) {
                case 'health':
                    playerHP = Math.min(playerMaxHP, playerHP + 50);
                    updateHealthHUD();
                    if (damageMultiplierTimer <= 0) statusElement.innerHTML = '<span style="color: #ff8a8a;">พลังชีวิต +50</span>';
                    break;
                case 'ammo':
                    for (const key in weapons) { 
                        weapons[key].reserve = weapons[key].baseReserve; 
                    }
                    updateAmmoHUD();
                    if (damageMultiplierTimer <= 0) statusElement.innerHTML = "กระสุนเต็ม";
                    break;
                case 'damage':
                    damageMultiplier = 2;
                    damageMultiplierTimer = 15.0;
                    break;
            }
            if (p.userData.type !== 'damage') { setTimeout(() => { if (damageMultiplierTimer <= 0 && !isReloading) { statusElement.innerHTML = ''; } }, 2000); }
            if (p.userData.label) p.remove(p.userData.label);
            scene.remove(p);
            pickups.splice(i, 1);
        }
    });
    // --- END CHANGE ---
}
animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    labelRenderer.setSize(window.innerWidth, window.innerHeight);
});

function damagePlayer(amount) {
    if (damageCooldown > 0) return;
    if (takeDamageSound.buffer) {
        if (takeDamageSound.isPlaying) takeDamageSound.stop();
        takeDamageSound.play();
    }

    playerHP = Math.max(0, playerHP - amount);
    playerHP = Math.round(playerHP * 10) / 10;
    updateHealthHUD();
    damageCooldown = 0.5;
    if (damageOverlay) {
        damageOverlay.style.background = 'rgba(255,0,0,0.35)';
        setTimeout(() => { damageOverlay.style.background = 'rgba(255,0,0,0.0)'; }, 120);
    }
    if (playerHP <= 0) {
        playerHP = 0;
        updateHealthHUD();
        gameOver();
    }
}

function resetGameStats() {
    if (walkSprintSound && walkSprintSound.isPlaying) {
        walkSprintSound.stop();
    }
    playerMaxHP = 100;
    playerHP = playerMaxHP;
    playerStamina = playerMaxStamina;
    grenadeCount = 3;
    score = 0;
    money = 0;
    kills = 0;
    wave = 1;
    isReloading = false;
    isShooting = false;
    if (statusElement) statusElement.innerHTML = '';
    damageMultiplier = 1;
    damageMultiplierTimer = 0;
    baseWeaponDamageMultiplier = 1.0;
    damageUpgradeLevel = 0;
    hpUpgradeLevel = 0;
    hasScope = false;
    hasExtendedMag = false;
    hasGrip = false;
    hasFrostRounds = false;
    hasAPRounds = false;
    currentWeaponKey = 'pistol';
    for (const key in weapons) {
        const weapon = weapons[key];
        weapon.maxMagazine = weapon.baseMaxMagazine;
        weapon.magazine = weapon.baseMaxMagazine;
        weapon.spread = weapon.baseSpread;
        weapon.reloadTime = weapon.baseReloadTime;
        weapon.damage = weapon.baseDamage;
        weapon.reserve = weapon.baseReserve; 
    }
    currentWeapon = weapons[currentWeaponKey];
    updateHealthHUD();
    updateAmmoHUD();
    updateWaveHUD();
    updateStaminaHUD();
    updateGrenadeHUD();
    if (scoreElement) scoreElement.textContent = 'คะแนน: ' + score;
    const respawnPosition = findSafePlayerSpawn();
    controls.getObject().position.copy(respawnPosition);
    camera.fov = 75;
    camera.updateProjectionMatrix();
    if (damageOverlay) damageOverlay.style.background = 'rgba(255,0,0,0.0)';
    if (gameOverOverlay) gameOverOverlay.style.display = 'none';
    if (renderer.domElement) renderer.domElement.classList.remove('blurred');
    document.body.style.pointerEvents = '';
}

document.addEventListener('keydown', (e) => {
    if (e.code === 'KeyF' && gameState === 'gameover') {
        if (gameOverOverlay) gameOverOverlay.style.display = 'none';
        clearEnemies();
        showMenu();
        updateMenuHighscore();
        document.body.style.pointerEvents = '';
    }
});

function startNextWaveCountdown(nextWaveNumber) {
    hideShop();
    gameState = 'shop-countdown';
    countdownTimer = 5;
    centerMessage.innerHTML = 'เตรียมพร้อม!<br>' + countdownTimer;
    centerMessage.style.display = 'block';

    function tick() {
        countdownTimer--;
        if (countdownTimer > 0) {
            centerMessage.innerHTML = 'เตรียมพร้อม!<br>' + countdownTimer;
            setTimeout(tick, 1000);
        } else {
            centerMessage.style.display = 'none';
            gameState = 'playing';
            startWave(nextWaveNumber);
        }
    }
    setTimeout(tick, 1000);
}

// --- CHANGE: Translate wave messages ---
function startWave(w) {
    gameState = 'playing';
    wave = w;
    enemiesToSpawnThisWave = 10 + (w - 1) * 3;
    clearEnemies();
    damageCooldown = 3.0;
    statusElement.innerHTML = '<span style="color: #ffff99;">อมตะ!</span>';
    setTimeout(() => { if (!isReloading && damageMultiplierTimer <= 0) statusElement.innerHTML = ''; }, 3000);
    enemiesAlive = enemiesToSpawnThisWave;
    updateWaveHUD();
    let message = `เวฟที่ ${w}`;
    if (w % 5 === 0 && w > 1) message = `บอสเวฟที่ ${w}!`;
    if (centerMessage) {
        centerMessage.innerHTML = message;
        centerMessage.style.display = 'block';
        setTimeout(() => { if (centerMessage) centerMessage.style.display = 'none'; }, 2000);
    }
    setTimeout(() => {
        if (gameState === 'playing') {
            spawnWaveEnemies(w, enemiesToSpawnThisWave);
            updateWaveHUD();
            const pickupCount = Math.random() > 0.4 ? 2 : 1;
            for (let i = 0; i < pickupCount; i++) { spawnPickup(); }
        }
    }, 100);
}
// --- END CHANGE ---
