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
        modelConfig: { file: '/riggedCharacters/BabyMario_Skeleton.glb', scale: 1, bodyNode: 'baby_mario_body' },
        veichles: SMALL_VEHICLES,
        stats: { speed: '0', acceleration: '1', weight: '0', handling: '1', traction: '1', drift: '0', offroad: '0' }
    },
    { 
        id: 'baby_luigi',
        name: 'Baby Luigi', 
        sprite: './sprites/BabyLuigi.png', 
        modelConfig: { file: '/riggedCharacters/BabyLuigi_Skeleton.glb', scale: 1, bodyNode: 'baby_luigi_body' },
        veichles: SMALL_VEHICLES,
        stats: { speed: '1', acceleration: '1', weight: '0', handling: '1', traction: '0', drift: '0', offroad: '0' }
    },
    { 
        id: 'baby_peach',
        name: 'Baby Peach', 
        sprite: './sprites/BabyPeach.png', 
        modelConfig: { file: '/riggedCharacters/BabyPeach_Skeleton.glb', scale: 1, bodyNode: 'baby_peach_body' },
        veichles: SMALL_VEHICLES,
        stats: { speed: '1', acceleration: '1', weight: '0', handling: '1', traction: '0', drift: '1', offroad: '0' }
    },
    { 
        id: 'baby_daisy',
        name: 'Baby Daisy', 
        sprite: './sprites/BabyDaisy.png', 
        modelConfig: { file: '/riggedCharacters/BabyDaisy_Skeleton.glb', scale: 1, bodyNode: 'baby_daisy_body' },
        veichles: SMALL_VEHICLES,
        stats: { speed: '2', acceleration: '1', weight: '0', handling: '1', traction: '0', drift: '0', offroad: '0' }
    },

    // === RIGA 2: PICCOLI (Toads & Koopas) ===
    { 
        id: 'toad',
        name: 'Toad', 
        sprite: './sprites/Toad.png', 
        modelConfig: { file: '/riggedCharacters/Toad_Skeleton.glb', scale: 1, bodyNode: 'toad_body' },
        veichles: SMALL_VEHICLES,
        stats: { speed: '0', acceleration: '2', weight: '0', handling: '1', traction: '1', drift: '1', offroad: '0' }
    },
    { 
        id: 'toadette',
        name: 'Toadette', 
        sprite: './sprites/Toadette.png', 
        modelConfig: { file: '/riggedCharacters/Toadette_Skeleton.glb', scale: 1, bodyNode: 'toadette_body' },
        veichles: SMALL_VEHICLES,
        stats: { speed: '1', acceleration: '1', weight: '0', handling: '1', traction: '0', drift: '0', offroad: '2' }
    },
    { 
        id: 'koopa',
        name: 'Koopa Troopa', 
        sprite: './sprites/KoopaTroopa.png', 
        modelConfig: { file: '/riggedCharacters/KoopaTroopa_Skeleton.glb', scale: 1, bodyNode: 'koopa_body' },
        veichles: SMALL_VEHICLES,
        stats: { speed: '0', acceleration: '1', weight: '0', handling: '1', traction: '2', drift: '0', offroad: '0' }
    },
    { 
        id: 'dry_bones',
        name: 'Dry Bones', 
        sprite: './sprites/DryBones.png', 
        modelConfig: { file: '/riggedCharacters/DryBones_Skeleton.glb', scale: 1, bodyNode: 'dry_bones_body' },
        veichles: SMALL_VEHICLES,
        stats: { speed: '0', acceleration: '1', weight: '0', handling: '1', traction: '0', drift: '1', offroad: '1' }
    },

    // === RIGA 3: MEDI (Classici) ===
    { 
        id: 'mario',
        name: 'Mario', 
        sprite: './sprites/Mario.png', 
        modelConfig: { file: '/riggedCharacters/Mario_Skeleton.glb', scale: 1, bodyNode: 'mario_body' },
        veichles: MEDIUM_VEHICLES,
        stats: { speed: '0', acceleration: '1', weight: '2', handling: '1', traction: '0', drift: '1', offroad: '0' }
    },
    { 
        id: 'luigi',
        name: 'Luigi', 
        sprite: './sprites/Luigi.png', 
        modelConfig: { file: '/riggedCharacters/Luigi_Skeleton.glb', scale: 1, bodyNode: 'luigi_body' },
        veichles: MEDIUM_VEHICLES,
        stats: { speed: '1', acceleration: '0', weight: '2', handling: '1', traction: '0', drift: '0', offroad: '0' }
    },
    { 
        id: 'peach',
        name: 'Peach', 
        sprite: './sprites/Peach.png', 
        modelConfig: { file: '/riggedCharacters/Peach_Skeleton.glb', scale: 1, bodyNode: 'peach_body' },
        veichles: MEDIUM_VEHICLES,
        stats: { speed: '1', acceleration: '2', weight: '1', handling: '0', traction: '0', drift: '2', offroad: '0' }
    },
    { 
        id: 'daisy',
        name: 'Daisy', 
        sprite: './sprites/Daisy.png', 
        modelConfig: { file: '/riggedCharacters/Daisy_Skeleton.glb', scale: 1, bodyNode: 'daisy_body' },
        veichles: MEDIUM_VEHICLES,
        stats: { speed: '2', acceleration: '0', weight: '1', handling: '1', traction: '0', drift: '1', offroad: '0' }
    },

    // === RIGA 4: MEDI (Non Umani) ===
    { 
        id: 'yoshi',
        name: 'Yoshi', 
        sprite: './sprites/Yoshi.png', 
        modelConfig: { file: '/riggedCharacters/Yoshi_Skeleton.glb', scale: 1, bodyNode: 'yoshi_body' },
        veichles: MEDIUM_VEHICLES,
        stats: { speed: '0', acceleration: '1', weight: '1', handling: '1', traction: '0', drift: '1', offroad: '1' }
    },
    { 
        id: 'birdo',
        name: 'Birdo', 
        sprite: './sprites/Birdo.png', 
        modelConfig: { file: '/riggedCharacters/Birdo_Skeleton.glb', scale: 1, bodyNode: 'birdo_body' },
        veichles: MEDIUM_VEHICLES,
        stats: { speed: '0', acceleration: '1', weight: '2', handling: '0', traction: '0', drift: '1', offroad: '2' }
    },
    { 
        id: 'diddy_kong',
        name: 'Diddy Kong', 
        sprite: './sprites/DiddyKong.png', 
        modelConfig: { file: '/riggedCharacters/DiddyKong_Skeleton.glb', scale: 1, bodyNode: 'diddy_kong_body' },
        veichles: MEDIUM_VEHICLES,
        stats: { speed: '0', acceleration: '2', weight: '1', handling: '1', traction: '1', drift: '2', offroad: '0' }
    },
    { 
        id: 'bowser_jr',
        name: 'Bowser Jr.', 
        sprite: './sprites/BowserJr.png', 
        modelConfig: { file: '/riggedCharacters/BowserJr_Skeleton.glb', scale: 1, bodyNode: 'bowser_jr_body' },
        veichles: MEDIUM_VEHICLES,
        stats: { speed: '0', acceleration: '1', weight: '1', handling: '0', traction: '0', drift: '0', offroad: '1' }
    },

    // === RIGA 5: GRANDI (Rivali) ===
    { 
        id: 'wario',
        name: 'Wario', 
        sprite: './sprites/Wario.png', 
        modelConfig: { file: '/riggedCharacters/Wario_Skeleton.glb', scale: 1, bodyNode: 'wario_body' },
        veichles: LARGE_VEHICLES,
        stats: { speed: '0', acceleration: '1', weight: '2', handling: '0', traction: '1', drift: '1', offroad: '1' }
    },
    { 
        id: 'waluigi',
        name: 'Waluigi', 
        sprite: './sprites/Waluigi.png', 
        modelConfig: { file: '/riggedCharacters/Waluigi_Skeleton.glb', scale: 1, bodyNode: 'waluigi_body' },
        veichles: LARGE_VEHICLES,
        stats: { speed: '1', acceleration: '2', weight: '2', handling: '0', traction: '0', drift: '2', offroad: '1' }
    },
    { 
        id: 'donkey_kong',
        name: 'Donkey Kong', 
        sprite: './sprites/DonkeyKong.png', 
        modelConfig: { file: '/riggedCharacters/DonkeyKong_Skeleton.glb', scale: 1, bodyNode: 'donkey_kong_body' },
        veichles: LARGE_VEHICLES,
        stats: { speed: '0', acceleration: '1', weight: '2', handling: '1', traction: '0', drift: '1', offroad: '1' }
    },
    { 
        id: 'bowser',
        name: 'Bowser', 
        sprite: './sprites/Bowser.png', 
        modelConfig: { file: '/riggedCharacters/Bowser_Skeleton.glb', scale: 1, bodyNode: 'bowser_body' },
        veichles: LARGE_VEHICLES,
        stats: { speed: '2', acceleration: '0', weight: '3', handling: '0', traction: '0', drift: '1', offroad: '0' }
    },

    // === RIGA 6: GRANDI (Speciali) ===
    { 
        id: 'king_boo',
        name: 'King Boo', 
        sprite: './sprites/KingBoo.png', 
        modelConfig: { file: '/riggedCharacters/KingBoo_Skeleton.glb', scale: 1, bodyNode: 'king_boo_body' },
        veichles: LARGE_VEHICLES,
        stats: { speed: '0', acceleration: '0', weight: '1', handling: '2', traction: '0', drift: '0', offroad: '1' }
    },
    { 
        id: 'rosalina',
        name: 'Rosalina', 
        sprite: './sprites/Rosalina.png', 
        modelConfig: { file: '/riggedCharacters/Rosalina_Skeleton.glb', scale: 1, bodyNode: 'rosalina_body' },
        veichles: LARGE_VEHICLES,
        stats: { speed: '1', acceleration: '0', weight: '1', handling: '1', traction: '0', drift: '1', offroad: '0' }
    },
    { 
        id: 'funky_kong',
        name: 'Funky Kong', 
        sprite: './sprites/FunkyKong.png', 
        modelConfig: { file: '/riggedCharacters/FunkyKong_Skeleton.glb', scale: 1, bodyNode: 'funky_body' },
        veichles: LARGE_VEHICLES,
        stats: { speed: '2', acceleration: '0', weight: '0', handling: '0', traction: '0', drift: '0', offroad: '1' }
    },
    { 
        id: 'dry_bowser',
        name: 'Dry Bowser', 
        sprite: './sprites/DryBowser.png', 
        modelConfig: { file: '/riggedCharacters/DryBowser_Skeleton.glb', scale: 1, bodyNode: 'dry_bowser_body' },
        veichles: LARGE_VEHICLES,
        stats: { speed: '0', acceleration: '0', weight: '2', handling: '0', traction: '0', drift: '0', offroad: '2' }
    }
];

export const VEHICLE_DATABASE = {
    // ==========================================
    // CLASSE PICCOLA (SMALL)
    // ==========================================
    'StandardKartS': { 
        name: 'Standard Kart S', type: 'outsideKart', isBike: false, 
        stats: { speed: 30, weight: 20, accel: 60, handling: 60, drift: 50, offroad: 50 }, 
        modelConfig: { file: '/Vehicles/StandardKartM.glb', scale: 0.008 },
        riderOffset: [0, -0.15, 0] 
    },
    'StandardBikeS': { 
        name: 'Standard Bike S', type: 'outsideBike', isBike: true, 
        stats: { speed: 30, weight: 15, accel: 65, handling: 65, drift: 55, offroad: 50 }, 
        modelConfig: { file: '/Vehicles/StandardBikeM.glb', scale: 0.008 },
        riderOffset: [0, 0.05, -0.1] 
    },
    'BoosterSeat': { 
        name: 'Booster Seat', type: 'outsideKart', isBike: false, 
        stats: { speed: 20, weight: 25, accel: 70, handling: 70, drift: 40, offroad: 60 }, 
        modelConfig: { file: '/Vehicles/BoosterSeat.glb', scale: 0.008 },
        riderOffset: [0, -0.05, 0.1] 
    },
    'BulletBike': { 
        name: 'Bullet Bike', type: 'insideBike', isBike: true, 
        stats: { speed: 35, weight: 10, accel: 85, handling: 80, drift: 80, offroad: 30 }, 
        modelConfig: { file: '/Vehicles/BulletBike.glb', scale: 0.008 },
        riderOffset: [0, 0.0, -0.1] 
    },
    'MiniBeast': { 
        name: 'Mini Beast', type: 'outsideKart', isBike: false, 
        stats: { speed: 45, weight: 25, accel: 50, handling: 55, drift: 85, offroad: 20 }, 
        modelConfig: { file: '/Vehicles/MiniBeast.glb', scale: 0.008 },
        riderOffset: [0, -0.2, -0.1] 
    },
    'BitBike': { 
        name: 'Bit Bike', type: 'outsideBike', isBike: true, 
        stats: { speed: 10, weight: 10, accel: 90, handling: 90, drift: 40, offroad: 50 }, 
        modelConfig: { file: '/Vehicles/BitBike.glb', scale: 0.008 },
        riderOffset: [0, -0.05, 0] 
    },
    'CheepCharger': { 
        name: 'Cheep Charger', type: 'outsideKart', isBike: false, 
        stats: { speed: 30, weight: 20, accel: 60, handling: 60, drift: 50, offroad: 50 }, 
        modelConfig: { file: '/Vehicles/CheepCharger.glb', scale: 0.008 },
        riderOffset: [0, -0.15, 0] 
    },
    'Quacker': { 
        name: 'Quacker', type: 'insideBike', isBike: true, 
        stats: { speed: 25, weight: 15, accel: 95, handling: 85, drift: 70, offroad: 30 }, 
        modelConfig: { file: '/Vehicles/Quacker.glb', scale: 0.008 },
        riderOffset: [0, 0.05, 0] 
    },
    'TinyTitan': { 
        name: 'Tiny Titan', type: 'outsideKart', isBike: false, 
        stats: { speed: 35, weight: 40, accel: 40, handling: 50, drift: 40, offroad: 90 }, 
        modelConfig: { file: '/Vehicles/TinyTitan.glb', scale: 0.008 },
        riderOffset: [0, 0.0, -0.1] 
    },
    'Magikruiser': { 
        name: 'Magikruiser', type: 'insideBike', isBike: true, 
        stats: { speed: 45, weight: 20, accel: 60, handling: 70, drift: 50, offroad: 95 }, 
        modelConfig: { file: '/Vehicles/Magikruiser.glb', scale: 0.008 },
        riderOffset: [0, 0.0, -0.1] 
    },
    'BlueFalcon': { 
        name: 'Blue Falcon', type: 'outsideKart', isBike: false, 
        stats: { speed: 65, weight: 25, accel: 40, handling: 40, drift: 50, offroad: 20 }, 
        modelConfig: { file: '/Vehicles/BlueFalcon.glb', scale: 0.008 },
        riderOffset: [0, -0.25, -0.1] 
    },
    'JetBubble': { 
        name: 'Jet Bubble', type: 'insideBike', isBike: true, 
        stats: { speed: 55, weight: 25, accel: 50, handling: 60, drift: 60, offroad: 30 }, 
        modelConfig: { file: '/Vehicles/JetBubble.glb', scale: 0.008 },
        riderOffset: [0, -0.05, -0.1] 
    },

    // ==========================================
    // CLASSE MEDIA (MEDIUM)
    // ==========================================
    'StandardKartM': { 
        name: 'Standard Kart M', type: 'outsideKart', isBike: false, 
        stats: { speed: 50, weight: 50, accel: 50, handling: 50, drift: 50, offroad: 50 }, 
        modelConfig: { file: '/Vehicles/StandardKartM.glb', scale: 0.008 },
        riderOffset: [0, -0.15, 0] 
    },
    'StandardBikeM': { 
        name: 'Standard Bike M', type: 'outsideBike', isBike: true, 
        stats: { speed: 50, weight: 45, accel: 55, handling: 55, drift: 50, offroad: 50 }, 
        modelConfig: { file: '/Vehicles/StandardBikeM.glb', scale: 0.008 },
        riderOffset: [0, 0.1, -0.1] 
    },
    'ClassicDragster': { 
        name: 'Classic Dragster', type: 'outsideKart', isBike: false, 
        stats: { speed: 70, weight: 50, accel: 70, handling: 30, drift: 55, offroad: 30 }, 
        modelConfig: { file: '/Vehicles/ClassicDragster.glb', scale: 0.008 },
        riderOffset: [0, -0.2, -0.2] 
    },
    'MachBike': { 
        name: 'Mach Bike', type: 'insideBike', isBike: true, 
        stats: { speed: 75, weight: 40, accel: 30, handling: 80, drift: 90, offroad: 20 }, 
        modelConfig: { file: '/Vehicles/MachBike.glb', scale: 0.008 },
        riderOffset: [0, 0.15, -0.15] 
    },
    'WildWing': { 
        name: 'Wild Wing', type: 'outsideKart', isBike: false, 
        stats: { speed: 65, weight: 55, accel: 40, handling: 55, drift: 80, offroad: 30 }, 
        modelConfig: { file: '/Vehicles/WildWing.glb', scale: 0.008 },
        riderOffset: [0, -0.15, 0] 
    },
    'Sugarscoot': { 
        name: 'Sugarscoot', type: 'outsideBike', isBike: true, 
        stats: { speed: 40, weight: 40, accel: 70, handling: 70, drift: 60, offroad: 60 }, 
        modelConfig: { file: '/Vehicles/Sugarscoot.glb', scale: 0.008 },
        riderOffset: [0, 0.05, 0] 
    },
    'SuperBlooper': { 
        name: 'Super Blooper', type: 'outsideKart', isBike: false, 
        stats: { speed: 55, weight: 60, accel: 30, handling: 40, drift: 60, offroad: 70 }, 
        modelConfig: { file: '/Vehicles/SuperBlooper.glb', scale: 0.008 },
        riderOffset: [0, -0.05, -0.1] 
    },
    'ZipZip': { 
        name: 'Zip Zip', type: 'insideBike', isBike: true, 
        stats: { speed: 60, weight: 40, accel: 45, handling: 70, drift: 70, offroad: 40 }, 
        modelConfig: { file: '/Vehicles/ZipZip.glb', scale: 0.008 },
        riderOffset: [0, 0.05, -0.1] 
    },
    'DayTripper': { 
        name: 'Day Tripper', type: 'outsideKart', isBike: false, 
        stats: { speed: 45, weight: 55, accel: 60, handling: 60, drift: 40, offroad: 60 }, 
        modelConfig: { file: '/Vehicles/DayTripper.glb', scale: 0.008 },
        riderOffset: [0, -0.15, 0] 
    },
    'Sneakster': { 
        name: 'Sneakster', type: 'insideBike', isBike: true, 
        stats: { speed: 80, weight: 45, accel: 20, handling: 40, drift: 80, offroad: 20 }, 
        modelConfig: { file: '/Vehicles/Sneakster.glb', scale: 0.008 },
        riderOffset: [0, 0.15, -0.1] 
    },
    'Sprinter': { 
        name: 'Sprinter', type: 'outsideKart', isBike: false, 
        stats: { speed: 85, weight: 50, accel: 30, handling: 30, drift: 40, offroad: 20 }, 
        modelConfig: { file: '/Vehicles/Sprinter.glb', scale: 0.008 },
        riderOffset: [0, -0.2, 0] 
    },
    'DolphinDasher': { 
        name: 'Dolphin Dasher', type: 'insideBike', isBike: true, 
        stats: { speed: 50, weight: 50, accel: 40, handling: 50, drift: 50, offroad: 85 }, 
        modelConfig: { file: '/Vehicles/DolphinDasher.glb', scale: 0.008 },
        riderOffset: [0, 0.1, -0.1] 
    },

    // ==========================================
    // CLASSE GRANDE (LARGE)
    // ==========================================
    'StandardKartL': { 
        name: 'Standard Kart L', type: 'outsideKart', isBike: false, 
        stats: { speed: 60, weight: 70, accel: 40, handling: 40, drift: 50, offroad: 40 }, 
        modelConfig: { file: '/Vehicles/StandardKartM.glb', scale: 0.008 },
        riderOffset: [0, -0.1, 0] 
    },
    'StandardBikeL': { 
        name: 'Standard Bike L', type: 'outsideBike', isBike: true, 
        stats: { speed: 60, weight: 65, accel: 45, handling: 45, drift: 50, offroad: 40 }, 
        modelConfig: { file: '/Vehicles/StandardBikeM.glb', scale: 0.008 },
        riderOffset: [0, 0.15, -0.1] 
    },
    'Offroader': { 
        name: 'Offroader', type: 'outsideKart', isBike: false, 
        stats: { speed: 50, weight: 80, accel: 40, handling: 40, drift: 40, offroad: 80 }, 
        modelConfig: { file: '/Vehicles/Offroader.glb', scale: 0.008 },
        riderOffset: [0, 0.05, -0.1] 
    },
    'FlameRunner': { 
        name: 'Flame Runner', type: 'insideBike', isBike: true, 
        stats: { speed: 85, weight: 70, accel: 20, handling: 50, drift: 85, offroad: 20 }, 
        modelConfig: { file: '/Vehicles/FlameRunner.glb', scale: 0.008 },
        riderOffset: [0, 0.2, -0.2] 
    },
    'FlameFlyer': { 
        name: 'Flame Flyer', type: 'outsideKart', isBike: false, 
        stats: { speed: 80, weight: 75, accel: 25, handling: 30, drift: 70, offroad: 20 }, 
        modelConfig: { file: '/Vehicles/FlameFlyer.glb', scale: 0.008 },
        riderOffset: [0, -0.1, -0.1] 
    },
    'WarioBike': { 
        name: 'Wario Bike', type: 'outsideBike', isBike: true, 
        stats: { speed: 40, weight: 80, accel: 30, handling: 60, drift: 50, offroad: 70 }, 
        modelConfig: { file: '/Vehicles/WarioBike.glb', scale: 0.008 },
        riderOffset: [0, -0.1, -0.3] 
    },
    'PiranhaProwler': { 
        name: 'Piranha Prowler', type: 'outsideKart', isBike: false, 
        stats: { speed: 55, weight: 90, accel: 30, handling: 30, drift: 50, offroad: 50 }, 
        modelConfig: { file: '/Vehicles/PiranhaProwler.glb', scale: 0.008 },
        riderOffset: [0, 0.0, -0.1] 
    },
    'ShootingStar': { 
        name: 'Shooting Star', type: 'insideBike', isBike: true, 
        stats: { speed: 70, weight: 60, accel: 50, handling: 60, drift: 70, offroad: 30 }, 
        modelConfig: { file: '/Vehicles/ShootingStar.glb', scale: 0.008 },
        riderOffset: [0, 0.15, -0.1] 
    },
    'Jetsetter': { 
        name: 'Jetsetter', type: 'outsideKart', isBike: false, 
        stats: { speed: 95, weight: 70, accel: 10, handling: 10, drift: 30, offroad: 10 }, 
        modelConfig: { file: '/Vehicles/Jetsetter.glb', scale: 0.008 },
        riderOffset: [0, -0.15, 0] 
    },
    'Spear': { 
        name: 'Spear', type: 'insideBike', isBike: true, 
        stats: { speed: 100, weight: 70, accel: 15, handling: 10, drift: 40, offroad: 10 }, 
        modelConfig: { file: '/Vehicles/Spear.glb', scale: 0.008 },
        riderOffset: [0, 0.15, -0.1] 
    },
    'HoneyCoupe': { 
        name: 'Honey Coupe', type: 'outsideKart', isBike: false, 
        stats: { speed: 65, weight: 75, accel: 30, handling: 40, drift: 80, offroad: 30 }, 
        modelConfig: { file: '/Vehicles/HoneyCoupe.glb', scale: 0.008 },
        riderOffset: [0, -0.1, -0.1] 
    },
    'Phantom': { 
        name: 'Phantom', type: 'outsideBike', isBike: true, 
        stats: { speed: 60, weight: 65, accel: 30, handling: 30, drift: 40, offroad: 85 }, 
        modelConfig: { file: '/Vehicles/Phantom.glb', scale: 0.008 },
        riderOffset: [0, -0.05, -0.3] 
    },

    // ==========================================
    // FALLBACK
    // ==========================================
    'DEFAULT': { 
        name: 'Unknown', type: 'outsideKart', isBike: false, 
        stats: { speed: 0, weight: 0, accel: 0, handling: 0, drift: 0, offroad: 0 }, 
        modelConfig: { file: '/Vehicles/StandardKartM.glb', scale: 0.008 },
        riderOffset: [0, -0.3, 0] 
    }
};