// --- LISTE VEICOLI PER CLASSE DI PESO ---
const SMALL_VEHICLES = [
    'StandardKartS', 'StandardBikeS', 'BoosterSeat', 'BulletBike', 
    'MiniBeast', 'BitBike', 'CheepCharger', 'Quacker', 
    'TinyTitan', 'Magikruiser', 'BlueFalcon', 'JetBubble'
];

const MEDIUM_VEHICLES = [
    'StandardKartM', 'StandardBikeM', 'ClassicDragster', 'MachBike', 
    'WildWing', 'Sugarscoot', 'SuperBlooper', 'ZipZip', 
    'DayTripper', 'Sneakster', 'Sprinter', 'DolphinDasher'
];

const LARGE_VEHICLES = [
    'StandardKartL', 'StandardBikeL', 'Offroader', 'FlameRunner', 
    'FlameFlyer', 'WarioBike', 'PiranhaProwler', 'ShootingStar', 
    'Jetsetter', 'Spear', 'HoneyCoupe', 'Phantom'
];

export const Characters = [
    // === RIGA 1: PICCOLI (Baby) ===
    { 
        id: 'baby_mario',
        name: 'Baby Mario', 
        sprite: './sprites/BabyMario.png', 
        modelConfig: { file: '/riggedCharacters/BabyMario_Skeleton.glb', scale: 0.8, bodyNode: 'baby_mario_body' },
        veichles: SMALL_VEHICLES,
        stats: { speed: '0', acceleration: '1', weight: '0', handling: '1', traction: '1', drift: '0', offroad: '0' }
    },
    { 
        id: 'baby_luigi',
        name: 'Baby Luigi', 
        sprite: './sprites/BabyLuigi.png', 
        modelConfig: { file: '/riggedCharacters/BabyLuigi_Skeleton.glb', scale: 0.8, bodyNode: 'baby_luigi_body' },
        veichles: SMALL_VEHICLES,
        stats: { speed: '1', acceleration: '1', weight: '0', handling: '1', traction: '0', drift: '0', offroad: '0' }
    },
    { 
        id: 'baby_peach',
        name: 'Baby Peach', 
        sprite: './sprites/BabyPeach.png', 
        modelConfig: { file: '/riggedCharacters/BabyPeach_Skeleton.glb', scale: 0.8, bodyNode: 'baby_peach_body' },
        veichles: SMALL_VEHICLES,
        stats: { speed: '1', acceleration: '1', weight: '0', handling: '1', traction: '0', drift: '1', offroad: '0' }
    },
    { 
        id: 'baby_daisy',
        name: 'Baby Daisy', 
        sprite: './sprites/BabyDaisy.png', 
        modelConfig: { file: '/riggedCharacters/BabyDaisy_Skeleton.glb', scale: 0.8, bodyNode: 'baby_daisy_body' },
        veichles: SMALL_VEHICLES,
        stats: { speed: '2', acceleration: '1', weight: '0', handling: '1', traction: '0', drift: '0', offroad: '0' }
    },

    // === RIGA 2: PICCOLI (Toads & Koopas) ===
    { 
        id: 'toad',
        name: 'Toad', 
        sprite: './sprites/Toad.png', 
        modelConfig: { file: '/riggedCharacters/Toad_Skeleton.glb', scale: 0.8, bodyNode: 'toad_body' },
        veichles: SMALL_VEHICLES,
        stats: { speed: '0', acceleration: '2', weight: '0', handling: '1', traction: '1', drift: '1', offroad: '0' }
    },
    { 
        id: 'toadette',
        name: 'Toadette', 
        sprite: './sprites/Toadette.png', 
        modelConfig: { file: '/riggedCharacters/Toadette_Skeleton.glb', scale: 0.8, bodyNode: 'toadette_body' },
        veichles: SMALL_VEHICLES,
        stats: { speed: '1', acceleration: '1', weight: '0', handling: '1', traction: '0', drift: '0', offroad: '2' }
    },
    { 
        id: 'koopa',
        name: 'Koopa Troopa', 
        sprite: './sprites/KoopaTroopa.png', 
        modelConfig: { file: '/riggedCharacters/KoopaTroopa_Skeleton.glb', scale: 0.8, bodyNode: 'koopa_body' },
        veichles: SMALL_VEHICLES,
        stats: { speed: '0', acceleration: '1', weight: '0', handling: '1', traction: '2', drift: '0', offroad: '0' }
    },
    { 
        id: 'dry_bones',
        name: 'Dry Bones', 
        sprite: './sprites/DryBones.png', 
        modelConfig: { file: '/riggedCharacters/DryBones_Skeleton.glb', scale: 0.8, bodyNode: 'dry_bones_body' },
        veichles: SMALL_VEHICLES,
        stats: { speed: '0', acceleration: '1', weight: '0', handling: '1', traction: '0', drift: '1', offroad: '1' }
    },

    // === RIGA 3: MEDI (Classici) ===
    { 
        id: 'mario',
        name: 'Mario', 
        sprite: './sprites/Mario.png', 
        modelConfig: { file: '/riggedCharacters/Mario_Skeleton.glb', scale: 0.8, bodyNode: 'mario_body' },
        veichles: MEDIUM_VEHICLES,
        stats: { speed: '0', acceleration: '1', weight: '2', handling: '1', traction: '0', drift: '1', offroad: '0' }
    },
    { 
        id: 'luigi',
        name: 'Luigi', 
        sprite: './sprites/Luigi.png', 
        modelConfig: { file: '/riggedCharacters/Luigi_Skeleton.glb', scale: 0.8, bodyNode: 'luigi_body' },
        veichles: MEDIUM_VEHICLES,
        stats: { speed: '1', acceleration: '0', weight: '2', handling: '1', traction: '0', drift: '0', offroad: '0' }
    },
    { 
        id: 'peach',
        name: 'Peach', 
        sprite: './sprites/Peach.png', 
        modelConfig: { file: '/riggedCharacters/Peach_Skeleton.glb', scale: 0.8, bodyNode: 'peach_body' },
        veichles: MEDIUM_VEHICLES,
        stats: { speed: '1', acceleration: '2', weight: '1', handling: '0', traction: '0', drift: '2', offroad: '0' }
    },
    { 
        id: 'daisy',
        name: 'Daisy', 
        sprite: './sprites/Daisy.png', 
        modelConfig: { file: '/riggedCharacters/Daisy_Skeleton.glb', scale: 0.8, bodyNode: 'daisy_body' },
        veichles: MEDIUM_VEHICLES,
        stats: { speed: '2', acceleration: '0', weight: '1', handling: '1', traction: '0', drift: '1', offroad: '0' }
    },

    // === RIGA 4: MEDI (Non Umani) ===
    { 
        id: 'yoshi',
        name: 'Yoshi', 
        sprite: './sprites/Yoshi.png', 
        modelConfig: { file: '/riggedCharacters/Yoshi_Skeleton.glb', scale: 0.8, bodyNode: 'yoshi_body' },
        veichles: MEDIUM_VEHICLES,
        stats: { speed: '0', acceleration: '1', weight: '1', handling: '1', traction: '0', drift: '1', offroad: '1' }
    },
    { 
        id: 'birdo',
        name: 'Birdo', 
        sprite: './sprites/Birdo.png', 
        modelConfig: { file: '/riggedCharacters/Birdo_Skeleton.glb', scale: 0.8, bodyNode: 'birdo_body' },
        veichles: MEDIUM_VEHICLES,
        stats: { speed: '0', acceleration: '1', weight: '2', handling: '0', traction: '0', drift: '1', offroad: '2' }
    },
    { 
        id: 'diddy_kong',
        name: 'Diddy Kong', 
        sprite: './sprites/DiddyKong.png', 
        modelConfig: { file: '/riggedCharacters/DiddyKong_Skeleton.glb', scale: 0.8, bodyNode: 'diddy_kong_body' },
        veichles: MEDIUM_VEHICLES,
        stats: { speed: '0', acceleration: '2', weight: '1', handling: '1', traction: '1', drift: '2', offroad: '0' }
    },
    { 
        id: 'bowser_jr',
        name: 'Bowser Jr.', 
        sprite: './sprites/BowserJr.png', 
        modelConfig: { file: '/riggedCharacters/BowserJr_Skeleton.glb', scale: 0.8, bodyNode: 'bowser_jr_body' },
        veichles: MEDIUM_VEHICLES,
        stats: { speed: '0', acceleration: '1', weight: '1', handling: '0', traction: '0', drift: '0', offroad: '1' }
    },

    // === RIGA 5: GRANDI (Rivali) ===
    { 
        id: 'wario',
        name: 'Wario', 
        sprite: './sprites/Wario.png', 
        modelConfig: { file: '/riggedCharacters/Wario_Skeleton.glb', scale: 0.8, bodyNode: 'wario_body' },
        veichles: LARGE_VEHICLES,
        stats: { speed: '0', acceleration: '1', weight: '2', handling: '0', traction: '1', drift: '1', offroad: '1' }
    },
    { 
        id: 'waluigi',
        name: 'Waluigi', 
        sprite: './sprites/Waluigi.png', 
        modelConfig: { file: '/riggedCharacters/Waluigi_Skeleton.glb', scale: 0.8, bodyNode: 'waluigi_body' },
        veichles: LARGE_VEHICLES,
        stats: { speed: '1', acceleration: '2', weight: '2', handling: '0', traction: '0', drift: '2', offroad: '1' }
    },
    { 
        id: 'donkey_kong',
        name: 'Donkey Kong', 
        sprite: './sprites/DonkeyKong.png', 
        modelConfig: { file: '/riggedCharacters/DonkeyKong_Skeleton.glb', scale: 0.8, bodyNode: 'donkey_kong_body' },
        veichles: LARGE_VEHICLES,
        stats: { speed: '0', acceleration: '1', weight: '2', handling: '1', traction: '0', drift: '1', offroad: '1' }
    },
    { 
        id: 'bowser',
        name: 'Bowser', 
        sprite: './sprites/Bowser.png', 
        modelConfig: { file: '/riggedCharacters/Bowser_Skeleton.glb', scale: 0.8, bodyNode: 'bowser_body' },
        veichles: LARGE_VEHICLES,
        stats: { speed: '2', acceleration: '0', weight: '3', handling: '0', traction: '0', drift: '1', offroad: '0' }
    },

    // === RIGA 6: GRANDI (Speciali) ===
    { 
        id: 'king_boo',
        name: 'King Boo', 
        sprite: './sprites/KingBoo.png', 
        modelConfig: { file: '/riggedCharacters/KingBoo_Skeleton.glb', scale: 0.8, bodyNode: 'king_boo_body' },
        veichles: LARGE_VEHICLES,
        stats: { speed: '0', acceleration: '0', weight: '1', handling: '2', traction: '0', drift: '0', offroad: '1' }
    },
    { 
        id: 'rosalina',
        name: 'Rosalina', 
        sprite: './sprites/Rosalina.png', 
        modelConfig: { file: '/riggedCharacters/Rosalina_Skeleton.glb', scale: 0.8, bodyNode: 'rosalina_body' },
        veichles: LARGE_VEHICLES,
        stats: { speed: '1', acceleration: '0', weight: '1', handling: '1', traction: '0', drift: '1', offroad: '0' }
    },
    { 
        id: 'funky_kong',
        name: 'Funky Kong', 
        sprite: './sprites/FunkyKong.png', 
        modelConfig: { file: '/riggedCharacters/FunkyKong_Skeleton.glb', scale: 0.8, bodyNode: 'funky_body' },
        veichles: LARGE_VEHICLES,
        stats: { speed: '2', acceleration: '0', weight: '0', handling: '0', traction: '0', drift: '0', offroad: '1' }
    },
    { 
        id: 'dry_bowser',
        name: 'Dry Bowser', 
        sprite: './sprites/DryBowser.png', 
        modelConfig: { file: '/riggedCharacters/DryBowser_Skeleton.glb', scale: 0.8, bodyNode: 'dry_bowser_body' },
        veichles: LARGE_VEHICLES,
        stats: { speed: '0', acceleration: '0', weight: '2', handling: '0', traction: '0', drift: '0', offroad: '2' }
    }
];




export const VEHICLE_DATABASE = {
    // ==========================================
    // CLASSE PICCOLA (SMALL)
    // ==========================================
    'StandardKartS': { 
        name: 'Standard Kart S', isBike: false, driftType: 'outside',
        stats: { speed: 30, weight: 20, accel: 60, handling: 60, drift: 50, offroad: 50 }, 
        modelConfig: { file: '/Vehicles/StandardKartM.glb', scale: 0.006 },
        riderOffset: [-0.01, -0.02, 0.11],
		riderRotation: [0.00, 0.00, 0.00],
		handPos: [0.18, 0.46, 0.35],
		animationType: 'kart'
    },
    'StandardBikeS': { 
        name: 'Standard Bike S', isBike: true, driftType: 'outside',
        stats: { speed: 30, weight: 15, accel: 65, handling: 65, drift: 55, offroad: 50 }, 
        modelConfig: { file: '/Vehicles/StandardBikeM.glb', scale: 0.006 },
        riderOffset: [-0.04, 0.04, -0.17],
		riderRotation: [0.80, 0.00, 0.00],
		handPos: [0.22, 0.65, 0.40],
		animationType: 'bike'
    },
    'BoosterSeat': { 
        name: 'Booster Seat', isBike: false, driftType: 'outside',
        stats: { speed: 20, weight: 25, accel: 70, handling: 70, drift: 40, offroad: 60 }, 
        modelConfig: { file: '/Vehicles/BoosterSeat.glb', scale: 0.008 },
        riderOffset: [-0.02, 0.09, 0.01],
		riderRotation: [0.00, 0.00, 0.00],
		handPos: [0.18, 0.29, 0.30],
		animationType: 'kart'
    },
    'BulletBike': { 
        name: 'Bullet Bike', isBike: true, driftType: 'inside',
        stats: { speed: 35, weight: 10, accel: 85, handling: 80, drift: 80, offroad: 30 }, 
        modelConfig: { file: '/Vehicles/BulletBike.glb', scale: 0.008 },
        riderOffset: [-0.01, 0.00, -0.10],
		riderRotation: [0.80, 0.00, 0.00],
		handPos: [0.15, 0.50, 2.00],
		animationType: 'bike'
    },
    'MiniBeast': { 
        name: 'Mini Beast', isBike: false, driftType: 'outside',
        stats: { speed: 45, weight: 25, accel: 50, handling: 55, drift: 85, offroad: 20 }, 
        modelConfig: { file: '/Vehicles/MiniBeast.glb', scale: 0.008 },
        riderOffset: [-0.03, -0.10, 0.03],
		riderRotation: [0.00, 0.00, 0.00],
		handPos: [0.20, 0.25, -0.86],
		animationType: 'kart'
    },
    'BitBike': { 
        name: 'Bit Bike', isBike: true, driftType: 'outside',
        stats: { speed: 10, weight: 10, accel: 90, handling: 90, drift: 40, offroad: 50 }, 
        modelConfig: { file: '/Vehicles/BitBike.glb', scale: 0.008 },
        riderOffset: [-0.04, 0.11, -0.21],
		riderRotation: [0.90, 0.00, 0.00],
		handPos: [0.25, 0.66, 0.35],
		animationType: 'bike'
    },
    'CheepCharger': { 
        name: 'Cheep Charger', isBike: false, driftType: 'outside',
        stats: { speed: 30, weight: 20, accel: 60, handling: 60, drift: 50, offroad: 50 }, 
        modelConfig: { file: '/Vehicles/CheepCharger.glb', scale: 0.008 },
        riderOffset: [-0.03, -0.03, 0.13],
		riderRotation: [0.00, 0.00, 0.00],
		handPos: [0.20, 0.25, 0.30],
		animationType: 'kart'
    },
    'Quacker': { 
        name: 'Quacker', isBike: true, driftType: 'inside',
        stats: { speed: 25, weight: 15, accel: 95, handling: 85, drift: 70, offroad: 30 }, 
        modelConfig: { file: '/Vehicles/Quacker.glb', scale: 0.008 },
        riderOffset: [-0.03, 0.07, 0.00],
		riderRotation: [0.10, 0.00, 0.00],
		handPos: [0.20, 0.48, 2.00],
		animationType: 'bike'
    },
    'TinyTitan': { 
        name: 'Tiny Titan', isBike: false, driftType: 'outside',
        stats: { speed: 35, weight: 40, accel: 40, handling: 50, drift: 40, offroad: 90 }, 
        modelConfig: { file: '/Vehicles/TinyTitan.glb', scale: 0.008 },
        riderOffset: [0.00, 0.08, 0.05],
		riderRotation: [0.00, 0.00, 0.00],
		handPos: [0.22, 0.09, 1.96],
		animationType: 'kart'
    },
    'Magikruiser': { 
        name: 'Magikruiser', isBike: true, driftType: 'inside',
        stats: { speed: 45, weight: 20, accel: 60, handling: 70, drift: 50, offroad: 95 }, 
        modelConfig: { file: '/Vehicles/Magikruiser.glb', scale: 0.008 },
        riderOffset: [-0.03, 0.00, -0.24],
		riderRotation: [0.85, 0.00, 0.00],
		handPos: [0.25, 0.90, 0.40],
		animationType: 'bike'
    },
    'BlueFalcon': { 
        name: 'Blue Falcon', isBike: false, driftType: 'outside',
        stats: { speed: 65, weight: 25, accel: 40, handling: 40, drift: 50, offroad: 20 }, 
        modelConfig: { file: '/Vehicles/BlueFalcon.glb', scale: 0.008 },
        riderOffset: [-0.03, -0.15, 0.37],
		riderRotation: [-0.10, 0.00, 0.00],
		handPos: [0.15, 0.28, 0.40],
		animationType: 'kart'
    },
    'JetBubble': { 
        name: 'Jet Bubble', isBike: true, driftType: 'inside',
        stats: { speed: 55, weight: 25, accel: 50, handling: 60, drift: 60, offroad: 30 }, 
        modelConfig: { file: '/Vehicles/JetBubble.glb', scale: 0.008 },
        riderOffset: [-0.02, 0.03, -0.10],
		riderRotation: [0.75, 0.00, 0.00],
		handPos: [0.20, 0.69, 0.40],
		animationType: 'bike'
    },

    // ==========================================
    // CLASSE MEDIA (MEDIUM)
    // ==========================================
    'StandardKartM': { 
        name: 'Standard Kart M', isBike: false, driftType: 'outside',
        stats: { speed: 50, weight: 50, accel: 50, handling: 50, drift: 50, offroad: 50 }, 
        modelConfig: { file: '/Vehicles/StandardKartM.glb', scale: 0.008 },
        animationType: 'kart',
		riderOffset: [-0.06, -0.21, 0.12],
		riderRotation: [0.00, 0.00, 0.00],
		handPos: [0.00, 0.16, -0.50]
    },
    'StandardBikeM': { 
        name: 'Standard Bike M', isBike: true, driftType: 'outside',
        stats: { speed: 50, weight: 45, accel: 55, handling: 55, drift: 50, offroad: 50 }, 
        modelConfig: { file: '/Vehicles/StandardBikeM.glb', scale: 0.008 },
        riderOffset: [-0.06, -0.06, -0.41],
		riderRotation: [0.85, 0.05, 0.00],
		handPos: [0.20, 0.67, 1.00],
		animationType: 'bike'
    },
    'ClassicDragster': { 
        name: 'Classic Dragster', isBike: false, driftType: 'outside',
        stats: { speed: 70, weight: 50, accel: 70, handling: 30, drift: 55, offroad: 30 }, 
        modelConfig: { file: '/Vehicles/ClassicDragster.glb', scale: 0.008 },
        riderOffset: [-0.06, -0.40, -0.20],
		riderRotation: [0.00, 0.00, 0.00],
		handPos: [0.00, 0.22, -0.50],
		animationType: 'kart'
    },
    'MachBike': { 
        name: 'Mach Bike', isBike: true, driftType: 'inside',
        stats: { speed: 75, weight: 40, accel: 30, handling: 80, drift: 90, offroad: 20 }, 
        modelConfig: { file: '/Vehicles/MachBike.glb', scale: 0.008 },
        riderOffset: [-0.06, -0.22, -0.23],
		riderRotation: [0.75, 0.00, 0.00],
		handPos: [0.20, 0.28, 2.00],
		animationType: 'bike'
    },
    'WildWing': { 
        name: 'Wild Wing', isBike: false, driftType: 'outside',
        stats: { speed: 65, weight: 55, accel: 40, handling: 55, drift: 80, offroad: 30 }, 
        modelConfig: { file: '/Vehicles/WildWing.glb', scale: 0.008 },
        riderOffset: [-0.06, -0.20, -0.10],
		riderRotation: [0.00, 0.00, 0.00],
		handPos: [0.20, 0.39, 0.40],
		animationType: 'kart'
    },
    'Sugarscoot': { 
        name: 'Sugarscoot', isBike: true, driftType: 'outside',
        stats: { speed: 40, weight: 40, accel: 70, handling: 70, drift: 60, offroad: 60 }, 
        modelConfig: { file: '/Vehicles/Sugarscoot.glb', scale: 0.008 },
        riderOffset: [-0.06, -0.17, -0.08],
		riderRotation: [0.20, 0.00, 0.00],
		handPos: [0.25, 0.30, -1.71],
		animationType: 'bike'
    },
    'SuperBlooper': { 
        name: 'Super Blooper', isBike: false, driftType: 'outside',
        stats: { speed: 55, weight: 60, accel: 30, handling: 40, drift: 60, offroad: 70 }, 
        modelConfig: { file: '/Vehicles/SuperBlooper.glb', scale: 0.008 },
        riderOffset: [-0.06, -0.30, 0.00],
		riderRotation: [0.00, 0.00, 0.00],
		handPos: [0.22, 0.20, 0.40],
		animationType: 'kart'
    },
    'ZipZip': { 
        name: 'Zip Zip', isBike: true, driftType: 'inside',
        stats: { speed: 60, weight: 40, accel: 45, handling: 70, drift: 70, offroad: 40 }, 
        modelConfig: { file: '/Vehicles/ZipZip.glb', scale: 0.008 },
        riderOffset: [-0.03, -0.16, -0.31],
		riderRotation: [0.70, 0.00, 0.00],
		handPos: [0.22, 0.74, 0.40],
		animationType: 'bike'
    },
    'DayTripper': { 
        name: 'Day Tripper', isBike: false, driftType: 'outside',
        stats: { speed: 45, weight: 55, accel: 60, handling: 60, drift: 40, offroad: 60 }, 
        modelConfig: { file: '/Vehicles/DayTripper.glb', scale: 0.008 },
        riderOffset: [-0.05, -0.20, -0.20],
		riderRotation: [0.35, 0.00, 0.00],
		handPos: [0.20, 0.21, -2.00],
		animationType: 'kart'
    },
    'Sneakster': { 
        name: 'Sneakster', isBike: true, driftType: 'inside',
        stats: { speed: 80, weight: 45, accel: 20, handling: 40, drift: 80, offroad: 20 }, 
        modelConfig: { file: '/Vehicles/Sneakster.glb', scale: 0.008 },
        riderOffset: [-0.04, -0.06, -0.50],
		riderRotation: [1.20, 0.00, 0.00],
		handPos: [0.30, 0.70, 0.50],
		animationType: 'bike'
    },
    'Sprinter': { 
        name: 'Sprinter', isBike: false, driftType: 'outside',
        stats: { speed: 85, weight: 50, accel: 30, handling: 30, drift: 40, offroad: 20 }, 
        modelConfig: { file: '/Vehicles/Sprinter.glb', scale: 0.008 },
        riderOffset: [0.00, -0.25, -0.04],
		riderRotation: [0.30, 0.00, 0.00],
		handPos: [0.18, 0.19, 0.50],
		animationType: 'kart'
    },
    'DolphinDasher': { 
        name: 'Dolphin Dasher', isBike: true, driftType: 'inside',
        stats: { speed: 50, weight: 50, accel: 40, handling: 50, drift: 50, offroad: 85 }, 
        modelConfig: { file: '/Vehicles/DolphinDasher.glb', scale: 0.008 },
        riderOffset: [-0.04, -0.13, -0.36],
		riderRotation: [1.00, 0.00, 0.00],
		handPos: [0.25, 0.60, 0.40],
		animationType: 'bike'
    },

    // ==========================================
    // CLASSE GRANDE (LARGE)
    // ==========================================
    'StandardKartL': { 
        name: 'Standard Kart L', isBike: false, driftType: 'outside',
        stats: { speed: 60, weight: 70, accel: 40, handling: 40, drift: 50, offroad: 40 }, 
        modelConfig: { file: '/Vehicles/StandardKartM.glb', scale: 0.013 },
        riderOffset: [-0.06, -0.47, 0.20],
		riderRotation: [0.00, 0.00, 0.00],
		handPos: [0.25, 0.28, 0.45],
		animationType: 'kart'
    },
    'StandardBikeL': { 
        name: 'Standard Bike L', isBike: true, driftType: 'outside',
        stats: { speed: 60, weight: 65, accel: 45, handling: 45, drift: 50, offroad: 40 }, 
        modelConfig: { file: '/Vehicles/StandardBikeM.glb', scale: 0.013 },
        riderOffset: [-0.04, -0.10, -0.60],
		riderRotation: [0.80, 0.00, 0.00],
		handPos: [0.30, 0.60, 0.50],
		animationType: 'bike'
    },
    'Offroader': { 
        name: 'Offroader', isBike: false, driftType: 'outside',
        stats: { speed: 50, weight: 80, accel: 40, handling: 40, drift: 40, offroad: 80 }, 
        modelConfig: { file: '/Vehicles/Offroader.glb', scale: 0.008 },
        riderOffset: [-0.06, -0.50, 0.34],
		riderRotation: [0.00, 0.00, 0.00],
		handPos: [0.25, 0.19, -2.00],
		animationType: 'kart'
    },
    'FlameRunner': { 
        name: 'Flame Runner', isBike: true, driftType: 'inside',
        stats: { speed: 85, weight: 70, accel: 20, handling: 50, drift: 85, offroad: 20 }, 
        modelConfig: { file: '/Vehicles/FlameRunner.glb', scale: 0.008 },
        riderOffset: [-0.06, -0.27, -0.46],
		riderRotation: [0.60, 0.00, 0.00],
		handPos: [0.25, 0.36, 0.50],
		animationType: 'bike'
    },
    'FlameFlyer': { 
        name: 'Flame Flyer', isBike: false, driftType: 'outside',
        stats: { speed: 80, weight: 75, accel: 25, handling: 30, drift: 70, offroad: 20 }, 
        modelConfig: { file: '/Vehicles/FlameFlyer.glb', scale: 0.008 },
        riderOffset: [-0.07, -0.50, -0.39],
		riderRotation: [0.35, 0.00, 0.00],
		handPos: [0.22, 0.29, -2.00],
		animationType: 'kart'
    },
    'WarioBike': { 
        name: 'Wario Bike', isBike: true, driftType: 'outside',
        stats: { speed: 40, weight: 80, accel: 30, handling: 60, drift: 50, offroad: 70 }, 
        modelConfig: { file: '/Vehicles/WarioBike.glb', scale: 0.008 },
        riderOffset: [-0.09, -0.43, 0.34],
		riderRotation: [-0.20, 0.00, 0.00],
		handPos: [0.40, 0.43, 0.30],
		animationType: 'bike'
    },
    'PiranhaProwler': { 
        name: 'Piranha Prowler', isBike: false, driftType: 'outside',
        stats: { speed: 55, weight: 90, accel: 30, handling: 30, drift: 50, offroad: 50 }, 
        modelConfig: { file: '/Vehicles/PiranhaProwler.glb', scale: 0.008 },
        riderOffset: [-0.05, -0.50, -0.10],
		riderRotation: [0.00, 0.00, 0.00],
		handPos: [0.25, 0.19, 0.40],
		animationType: 'kart'
    },
    'ShootingStar': { 
        name: 'Shooting Star', isBike: true, driftType: 'inside',
        stats: { speed: 70, weight: 60, accel: 50, handling: 60, drift: 70, offroad: 30 }, 
        modelConfig: { file: '/Vehicles/ShootingStar.glb', scale: 0.008 },
        riderOffset: [-0.02, -0.50, -0.17],
		riderRotation: [0.30, 0.00, 0.00],
		handPos: [0.22, 0.58, 0.50],
		animationType: 'bike'
    },
    'Jetsetter': { 
        name: 'Jetsetter', isBike: false, driftType: 'outside',
        stats: { speed: 95, weight: 70, accel: 10, handling: 10, drift: 30, offroad: 10 }, 
        modelConfig: { file: '/Vehicles/Jetsetter.glb', scale: 0.008 },
        riderOffset: [-0.07, -0.50, -0.06],
		riderRotation: [0.20, 0.00, 0.00],
		handPos: [0.20, 0.21, 0.40],
		animationType: 'kart'
    },
    'Spear': { 
        name: 'Spear', isBike: true, driftType: 'inside',
        stats: { speed: 100, weight: 70, accel: 15, handling: 10, drift: 40, offroad: 10 }, 
        modelConfig: { file: '/Vehicles/Spear.glb', scale: 0.008 },
        riderOffset: [-0.07, -0.37, -0.74],
		riderRotation: [0.80, 0.00, 0.00],
		handPos: [0.20, 0.45, 0.60],
		animationType: 'bike'
    },
    'HoneyCoupe': { 
        name: 'Honey Coupe', isBike: false, driftType: 'outside',
        stats: { speed: 65, weight: 75, accel: 30, handling: 40, drift: 80, offroad: 30 }, 
        modelConfig: { file: '/Vehicles/HoneyCoupe.glb', scale: 0.008 },
		riderOffset: [-0.04, -0.50, -0.38],
		riderRotation: [0.40, 0.00, 0.00],
		handPos: [0.22, 0.22, 0.40],
		animationType: 'kart'
    },
    'Phantom': { 
        name: 'Phantom', isBike: true, driftType: 'outside',
        stats: { speed: 60, weight: 65, accel: 30, handling: 30, drift: 40, offroad: 85 }, 
        modelConfig: { file: '/Vehicles/Phantom.glb', scale: 0.008 },
        riderOffset: [0.00, -0.50, -0.07],
		riderRotation: [0.25, 0.00, 0.00],
		handPos: [0.35, 0.49, 0.30],
		animationType: 'bike' 
    },

    // ==========================================
    // FALLBACK
    // ==========================================
    'DEFAULT': { 
        name: 'Unknown', isBike: false, driftType: 'outside',
        stats: { speed: 0, weight: 0, accel: 0, handling: 0, drift: 0, offroad: 0 }, 
        modelConfig: { file: '/Vehicles/StandardKartM.glb', scale: 0.008 },
        riderOffset: [0, -0.15, 0],
        riderRotation: [0, 0, 0],
        animationType: 'kart',
        handPos: [0.2, 0.5, 0.3]
    }
};