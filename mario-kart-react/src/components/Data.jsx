import DaisyCircuit from '../Bot/Waypoints/DaisyCircuit/DaisyCircuit';
import DaisyCircuit_left from '../Bot/Waypoints/DaisyCircuit/DaisyCircuit_left';
import DaisyCircuit_right from '../Bot/Waypoints/DaisyCircuit/DaisyCircuit_right';
import DelfinoSquare0 from '../Bot/Waypoints/DelfinoSquare/DelfinoSquare';
import DelfinoSquareL from '../Bot/Waypoints/DelfinoSquare/DelfinoSquareL';
import DelfinoSquareR from '../Bot/Waypoints/DelfinoSquare/DelfinoSquareR';
import YoshiFalls from '../Bot/Waypoints/YoshiFalls/YoshiFalls';
import YoshiFalls_L from '../Bot/Waypoints/YoshiFalls/YoshiFalls_L';
import YoshiFalls_R from '../Bot/Waypoints/YoshiFalls/YoshiFalls_R';
import SNESMario1 from '../Bot/Waypoints/SNESMarioCircuit/SNESMario1.json';
import SNESMarioR from '../Bot/Waypoints/SNESMarioCircuit/SNESMarioR.json';
import SNESMarioL from '../Bot/Waypoints/SNESMarioCircuit/SNESMarioL.json';
import PeachGardens from '../Bot/Waypoints/PeachGardens/PeachGardens.json';
import PeachGardens_L from '../Bot/Waypoints/PeachGardens/PeachGardens_L.json';
import PeachGardens_R from '../Bot/Waypoints/PeachGardens/PeachGardens_R.json';
import LuigiCircuit from '../Bot/Waypoints/LuigiCircuit/LuigiCircuit.json';
import LuigiCircuit_L from '../Bot/Waypoints/LuigiCircuit/LuigiCircuit_L.json';
import LuigiCircuit_R from '../Bot/Waypoints/LuigiCircuit/LuigiCircuit_R.json';
import DS_DesertHills from '../Bot/Waypoints/DSDesertHills/DS_DesertHills.json';
import DS_DesertHills_L from '../Bot/Waypoints/DSDesertHills/DS_DesertHills_L.json';
import DS_DesertHills_R from '../Bot/Waypoints/DSDesertHills/DS_DesertHills_R.json';
import DryDryRuins from '../Bot/Waypoints/DryDryRuins/DryDryRuins.json';
import DryDryRuins_L from '../Bot/Waypoints/DryDryRuins/DryDryRuins_L.json';
import DryDryRuins_R from '../Bot/Waypoints/DryDryRuins/DryDryRuins_R.json';
import MooMooMeadows from '../Bot/Waypoints/MooMooMeadows/MooMooMeadows.json';
import MooMooMeadows_L from '../Bot/Waypoints/MooMooMeadows/MooMooMeadows_L.json';
import MooMooMeadows_R from '../Bot/Waypoints/MooMooMeadows/MooMooMeadows_R.json';
import N64MarioRaceway_1 from '../Bot/Waypoints/N64MarioRaceway/N64MarioRaceway_1.json';
import N64MarioRaceway_2 from '../Bot/Waypoints/N64MarioRaceway/N64MarioRaceway_2.json';
import N64MarioRaceway_3 from '../Bot/Waypoints/N64MarioRaceway/N64MarioRaceway_3.json';
import GCNMarioCircuit_1 from '../Bot/Waypoints/GCNMarioCircuit/GCNMarioCircuit_1.json';
import GCNMarioCircuit_2 from '../Bot/Waypoints/GCNMarioCircuit/GCNMarioCircuit_2.json';
import GCNMarioCircuit_3 from '../Bot/Waypoints/GCNMarioCircuit/GCNMarioCircuit_3.json';
import MarioCircuit_1 from '../Bot/Waypoints/MarioCircuit/MarioCircuit_1.json';
import MarioCircuit_2 from '../Bot/Waypoints/MarioCircuit/MarioCircuit_2.json';
import MarioCircuit_3 from '../Bot/Waypoints/MarioCircuit/MarioCircuit_3.json';
import PeachBeach from '../Bot/Waypoints/PeachBeach/PeachBeach.json';
import PeachBeachL from '../Bot/Waypoints/PeachBeach/PeachBeachL.json';
import PeachBeachR from '../Bot/Waypoints/PeachBeach/PeachBeachR.json';
import BowserCastle from '../Bot/Waypoints/BowserCastle/BowserCastle.json';
import BowserCastleL from '../Bot/Waypoints/BowserCastle/BowserCastleL.json';
import BowserCastleR from '../Bot/Waypoints/BowserCastle/BowserCastleR.json';
import GhostValley from '../Bot/Waypoints/GhostValley/GhostValley.json';
import GhostValleyL from '../Bot/Waypoints/GhostValley/GhostValleyL.json';
import GhostValleyR from '../Bot/Waypoints/GhostValley/GhostValleyR.json';
import CoconutMall from '../Bot/Waypoints/CoconutMall/CoconutMall.json';
import CoconutMall_R from '../Bot/Waypoints/CoconutMall/CoconutMall_R.json';
import CoconutMall_L from '../Bot/Waypoints/CoconutMall/CoconutMall_L.json';


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

export const Tracks = {
	'Luigi Circuit': { 
		file: './Tracks/LuigiCircuit/LuigiCircuit.glb',
		preview: '/Previews/Luigi Circuit.png',
		startPos: [9, 12, 98],
		checkpoints: './Tracks/LuigiCircuit/LuigiCircuit_checkpoints.glb',
        road: './Tracks/LuigiCircuit/LuigiCircuit_road.glb',
        itemBoxes: './Tracks/LuigiCircuit/LuigiCircuit_itempos.glb',
		gridpos: './Tracks/LuigiCircuit/LuigiCircuit_startpos.glb',
		maxCheckpoints: 4,
        soundtrack: 'RACE_LUIGI_CIRCUIT',
		Waypoints: [ LuigiCircuit, LuigiCircuit_L, LuigiCircuit_R ]
	},
	'Daisy Circuit': { 
		file: './Tracks/DaisyCircuit/DaisyCircuit.glb',
		preview: '/Previews/Daisy Circuit.png',
		startPos: [100, 12, 98],
		checkpoints: './Tracks/DaisyCircuit/DaisyCircuit_checkpoints.glb',
		road: './Tracks/DaisyCircuit/DaisyCircuit_road.glb',
		itemBoxes: './Tracks/DaisyCircuit/DaisyCircuit_itemBox.glb',
		gridpos: './Tracks/DaisyCircuit/DaisyCircuit_startpos.glb',
		maxCheckpoints: 3,
        soundtrack: 'RACE_DAISY_CIRCUIT',
		Waypoints: [ DaisyCircuit, DaisyCircuit_left, DaisyCircuit_right ]
	},
	'Coconut Mall': {
		file: './Tracks/CoconutMall/CoconutMall.glb',
		preview: '/Previews/Coconut Mall.png',
		startPos: [0, 0, 100],
		checkpoints: './Tracks/CoconutMall/CoconutMall_checkpoints.glb',
		maxCheckpoints: 2,
		soundtrack: 'RACE_COCONUT_MALL',
		itemBoxes: './Tracks/CoconutMall/CoconutMall_itemboxes.glb',
		gridpos: './Tracks/CoconutMall/CoconutMall_startpos.glb',
		road: './Tracks/CoconutMall/CoconutMall_hitboxes.glb',
		Waypoints: [ CoconutMall, CoconutMall_L, CoconutMall_R ]
	},
	'Bowser Castle': {
		file: './Tracks/BowserCastle/BowserCastle.glb',
		preview: '/Previews/Bowser Castle.png',
		startPos: [0, 0, 100],
		checkpoints: './Tracks/BowserCastle/BowserCastle_checkpoints.glb',
		maxCheckpoints: 2,
		soundtrack: 'RACE_BOWSER_CASTLE',
		itemBoxes: './Tracks/BowserCastle/BowserCastle_itemboxes.glb',
		gridpos: './Tracks/BowserCastle/BowserCastle_startpos.glb',
		road: './Tracks/BowserCastle/BowserCastle_road.glb',
		Waypoints: [ BowserCastle, BowserCastleL, BowserCastleR ]
	},
	'Delfino Square': {
		file: './Tracks/DelfinoSquare/DelfinoSquare.glb',
		preview: '/Previews/DS Delfino Square.png',
		startPos: [0, 0, 50],
		checkpoints: './Tracks/DelfinoSquare/DelfinoSquare_checkpoints.glb',
		maxCheckpoints: 3,
		soundtrack: 'RACE_DELPHINO_SQUARE',
		itemBoxes: './Tracks/DelfinoSquare/DelfinoSquare_itemBox.glb',
		gridpos: './Tracks/DelfinoSquare/DelfinoSquare_startpos.glb',
		road: './Tracks/DelfinoSquare/DelfinoSquare_road.glb',
		Waypoints: [ DelfinoSquare0, DelfinoSquareL, DelfinoSquareR ]
	},
    'Yoshi Falls': {
        file: './Tracks/YoshiFalls/YoshiFalls.glb',
		preview: '/Previews/DS Yoshi Falls.png',
        startPos: [0, 0, 50],
        checkpoints: './Tracks/YoshiFalls/YoshiFalls_checkpos.glb',
        maxCheckpoints: 3,
        soundtrack: 'RACE_YOSHI_FALLS',
        itemBoxes: './Tracks/YoshiFalls/YoshiFalls_itembox.glb',
        gridpos: './Tracks/YoshiFalls/YoshiFalls_startpos.glb',
        road: './Tracks/YoshiFalls/YoshiFalls_road.glb',
		Waypoints: [ YoshiFalls, YoshiFalls_L, YoshiFalls_R ]
    },
    'Moo Moo Meadows': {
        file: './Tracks/MooMooMeadows/MooMooMeadows.glb',
		preview: '/Previews/Moo Moo Meadows.png',
        startPos: [0, 0, 50],
        checkpoints: './Tracks/MooMooMeadows/MooMooMeadows_checkpoints.glb',
        maxCheckpoints: 3,
        soundtrack: 'RACE_MOO_MOO_MEADOWS',
        itemBoxes: './Tracks/MooMooMeadows/MooMooMeadows_itembox.glb',
        gridpos: './Tracks/MooMooMeadows/MooMooMeadows_startpos.glb',
        road: './Tracks/MooMooMeadows/MooMooMeadows_road.glb',
		Waypoints: [ MooMooMeadows, MooMooMeadows_L, MooMooMeadows_R ]
    },
	
	'Peach Gardens': {
		file: './Tracks/PeachGardens/PeachGardens.glb',
		preview: '/Previews/DS Peach Gardens.png',
		startPos: [0, 0, 50],
		checkpoints: './Tracks/PeachGardens/PeachGardens_checkpos.glb',
        maxCheckpoints: 3,
        soundtrack: 'RACE_PEACH_GARDENS',
        itemBoxes: './Tracks/PeachGardens/PeachGardens_itembox.glb',
        gridpos: './Tracks/PeachGardens/PeachGardens_startpos.glb',
        road: './Tracks/PeachGardens/PeachGardens_road.glb',
		Waypoints: [ PeachGardens, PeachGardens_L, PeachGardens_R ]
    },

    'SNES Mario Circuit': {
        file: './Tracks/SNESMarioCircuit/SNESMarioCircuit.glb',
		preview: '/Previews/SNES Mario Circuit 3.png',
        startPos: [0, 0, 50],
        checkpoints: './Tracks/SNESMarioCircuit/SNESMarioCircuit_checkpoints.glb',
        maxCheckpoints: 3,
        soundtrack: 'RACE_SNES_MARIO_CIRCUIT',
        itemBoxes: './Tracks/SNESMarioCircuit/SNESMarioCircuit_itembox.glb',
        gridpos: './Tracks/SNESMarioCircuit/SNESMarioCircuit_startpos.glb',
        road: './Tracks/SNESMarioCircuit/SNESMarioCircuit_road.glb',
		Waypoints: [ SNESMario1, SNESMarioL, SNESMarioR ]
    },

	'N64 Mario Raceway': {
        file: './Tracks/N64MarioRaceway/N64_Mario_Raceway.glb',
		preview: '/Previews/N64 Mario Raceway.png',
        startPos: [0, 0, 50],
        checkpoints: './Tracks/N64MarioRaceway/N64_Mario_Raceway_checkpoints.glb',
        maxCheckpoints: 3,
        soundtrack: 'RACE_N64_MARIO_RACEWAY',
        itemBoxes: './Tracks/N64MarioRaceway/N64_Mario_Raceway_itembox.glb',
        gridpos: './Tracks/N64MarioRaceway/N64_Mario_Raceway_startpos.glb',
        road: './Tracks/N64MarioRaceway/N64_Mario_Raceway_road.glb',
		Waypoints: [ N64MarioRaceway_3, N64MarioRaceway_2, N64MarioRaceway_1 ]
    },

	'GCN Mario Circuit': {
        file: './Tracks/GCNMarioCircuit/GCN_Mario_Circuit.glb',
		preview: '/Previews/GCN Mario Circuit.png',
        startPos: [0, 0, 50],
        checkpoints: './Tracks/GCNMarioCircuit/GCN_Mario_Circuit_checkpoints.glb',
        maxCheckpoints: 3,
        soundtrack: 'RACE_GCN_MARIO_CIRCUIT',
		itemBoxes: './Tracks/GCNMarioCircuit/GCN_Mario_Circuit_itembox.glb',
        gridpos: './Tracks/GCNMarioCircuit/GCN_Mario_Circuit_startpos.glb',
        road: './Tracks/GCNMarioCircuit/GCN_Mario_Circuit_road.glb',
		Waypoints: [ GCNMarioCircuit_1, GCNMarioCircuit_2, GCNMarioCircuit_3 ]
    },

	'Mario Circuit': {
        file: './Tracks/MarioCircuit/Mario_Circuit.glb',
		preview: '/Previews/Mario Circuit.png',
        startPos: [0, 0, 50],
        checkpoints: './Tracks/MarioCircuit/Mario_Circuit_checkpoints.glb',
        maxCheckpoints: 3,
        soundtrack: 'RACE_GCN_MARIO_CIRCUIT',
		itemBoxes: './Tracks/MarioCircuit/Mario_Circuit_itembox.glb',
        gridpos: './Tracks/MarioCircuit/Mario_Circuit_startpos.glb',
        road: './Tracks/MarioCircuit/Mario_Circuit_road.glb',
		Waypoints: [ MarioCircuit_1, MarioCircuit_2, MarioCircuit_3 ]
    },

	'DS Desert Hills': {
        file: './Tracks/DSDesertHills/DSDesertHills.glb',
		preview: '/Previews/DS Desert Hills.png',
        startPos: [0, 0, 50],
        checkpoints: './Tracks/DSDesertHills/DSDesertHills_checkpos.glb',
        maxCheckpoints: 3,
        soundtrack: 'RACE_DS_DESERT_HILLS',
		itemBoxes: './Tracks/DSDesertHills/DSDesertHills_itembox.glb',
        gridpos: './Tracks/DSDesertHills/DSDesertHills_startpos.glb',
        road: './Tracks/DSDesertHills/DSDesertHills_road.glb',
		Waypoints: [ DS_DesertHills, DS_DesertHills_L, DS_DesertHills_R ]
    },

	'Dry Dry Ruins': {
        file: './Tracks/DryDryRuins/DryDryRuins.glb',
		preview: '/Previews/Dry Dry Ruins.png',
        startPos: [0, 0, 50],
        checkpoints: './Tracks/DryDryRuins/DryDryRuins_checkpos.glb',
        maxCheckpoints: 3,
        soundtrack: 'RACE_DRY_DRY_RUINS',
		itemBoxes: './Tracks/DryDryRuins/DryDryRuins_itembox.glb',
        gridpos: './Tracks/DryDryRuins/DryDryRuins_startpos.glb',
        road: './Tracks/DryDryRuins/DryDryRuins_road.glb',
		Waypoints: [ DryDryRuins, DryDryRuins_L, DryDryRuins_R ]
    },

	'GCN Peach Beach': {
		file: './Tracks/PeachBeach/peachBeach.glb',
		preview: '/Previews/GCN Peach Beach.png',
		startPos: [0, 0, 50],
		checkpoints: './Tracks/PeachBeach/peachBeach_checkpoints.glb',
		maxCheckpoints: 2,
		soundtrack: 'RACE_PEACH_BEACH',
		itemBoxes: './Tracks/PeachBeach/peachBeach_itembox.glb',
		gridpos: './Tracks/PeachBeach/peachBeach_startpos.glb',
		road: './Tracks/PeachBeach/peachBeach_hitbox.glb',
		Waypoints: [ PeachBeach, PeachBeachL, PeachBeachR ]
	},
	'SNES Ghost Valley 2': {
		file: './Tracks/GhostValley/SNESGhostValley.glb',
		preview: '/Previews/SNES Ghost Valley 2.png',
		startPos: [0, 0, 50],
		checkpoints: './Tracks/GhostValley/SNESGhostValley_checkpos.glb',
		maxCheckpoints: 2,
		soundtrack: 'RACE_GHOST_VALLEY',
		itemBoxes: './Tracks/GhostValley/SNESGhostValley_itembox.glb',
		gridpos: './Tracks/GhostValley/SNESGhostValley_startpos.glb',
		road: './Tracks/GhostValley/SNESGhostValley_road.glb',
		Waypoints: [ GhostValley, GhostValleyL, GhostValleyR  ]
	},
}

export const grandPrixList = [
		{
			id: 'mushroom',
			name: 'Mushroom Cup',
			trophy: '/Trophies/MushroomCup.glb', // Sostituibile con lo sprite del trofeo del Mushroom Cup
			icon: <img src="/itemSprites/Mushroom.png" alt="Mushroom Cup" className="w-15 h-15" />, // Sostituibile con <img src="/sprites/mushroom_cup.png" /> se hai lo sprite
			bgColor: 'from-[#ff4444] to-[#aa0000]',
			ringColor: 'ring-[#ff8888]',
			tracks: [
				"Luigi Circuit",
				"Moo Moo Meadows",
				"Delfino Square",
				"Daisy Circuit"
			]
		},
		{
			id: 'shell',
			name: 'Shell Cup',
			trophy: '/Trophies/ShellCup.glb', // Sostituibile con lo sprite del trofeo della Shell Cup
			icon: <img src="/itemSprites/GreenShell.png" alt="Shell Cup" className="w-15 h-15" />, // Sostituibile con lo sprite del guscio verde
			bgColor: 'from-[#44cc44] to-[#008800]',
			ringColor: 'ring-[#88ff88]',
			tracks: [
				"Peach Gardens",
				"SNES Mario Circuit",
				"Yoshi Falls",
				"GCN Mario Circuit"
			]
		},
		{
			id: 'banana',
			name: 'Banana Cup',
			trophy: '/Trophies/BananaCup.glb', // Sostituibile con lo sprite del trofeo del Banana Cup
			icon: <img src="/itemSprites/Banana.png" alt="Banana Cup" className="w-15 h-15" />, // Sostituibile con lo sprite della banana
			bgColor: 'from-[#ffcc00] to-[#ff9900]',
			ringColor: 'ring-[#ffff00]',
			tracks: [
				"DS Desert Hills",
				"N64 Mario Raceway",
				"Mario Circuit",
				"Dry Dry Ruins",
			]
		},

		{
			id: 'star',
			name: 'Star Cup',
			trophy: '/Trophies/StarCup.glb', // Sostituibile con lo sprite del trofeo del Star Cup
			icon: <img src="/itemSprites/Star.png" alt="Star Cup" className="w-15 h-15" />, // Sostituibile con lo sprite della stella
			bgColor: 'from-[#ffff00] to-[#ffcc00]',
			ringColor: 'ring-[#ffffff]',
			tracks: [
				"GCN Peach Beach",
				"SNES Ghost Valley 2",
				"Bowser Castle",
				"Coconut Mall",
			]
		},
];


export const Characters = [
	// === RIGA 1: PICCOLI (Baby) ===
	{ 
		id: 'baby_mario',
		name: 'Baby Mario', 
		sprite: './sprites/BabyMario.png', 
		icon: './icons/BabyMario_icon.png',
		modelConfig: { file: '/riggedCharacters/BabyMario_Skeleton.glb', scale: 0.8, bodyNode: 'baby_mario_body' },
		veichles: SMALL_VEHICLES,
		stats: { speed: '0', acceleration: '1', weight: '0', handling: '1', traction: '1', drift: '0', offroad: '0' },
		win_sfx: 'BABY_MARIO_WIN',
		lose_sfx: 'BABY_MARIO_LOSE',
		item_sfx: 'BABY_MARIO_ITEM',
		turbo_sfx: 'BABY_MARIO_TURBO',
		dmg_sfx: 'BABY_MARIO_DAMAGE',
		select_sfx: 'BABY_MARIO_SELECT'
	},
	{ 
		id: 'baby_luigi',
		name: 'Baby Luigi', 
		sprite: './sprites/BabyLuigi.png',
		icon: './icons/BabyLuigi_icon.png',
		modelConfig: { file: '/riggedCharacters/BabyLuigi_Skeleton.glb', scale: 0.8, bodyNode: 'baby_luigi_body' },
		veichles: SMALL_VEHICLES,
		stats: { speed: '1', acceleration: '1', weight: '0', handling: '1', traction: '0', drift: '0', offroad: '0' },
		win_sfx: 'BABY_LUIGI_WIN',
		lose_sfx: 'BABY_LUIGI_LOSE',
		item_sfx: 'BABY_LUIGI_ITEM',
		turbo_sfx: 'BABY_LUIGI_TURBO',
		dmg_sfx: 'BABY_LUIGI_DAMAGE',
		select_sfx: 'BABY_LUIGI_SELECT'
	},
	{ 
		id: 'baby_peach',
		name: 'Baby Peach', 
		sprite: './sprites/BabyPeach.png',
		icon: './icons/BabyPeach_icon.png',
		modelConfig: { file: '/riggedCharacters/BabyPeach_Skeleton.glb', scale: 0.8, bodyNode: 'baby_peach_body' },
		veichles: SMALL_VEHICLES,
		stats: { speed: '1', acceleration: '1', weight: '0', handling: '1', traction: '0', drift: '1', offroad: '0' },
		win_sfx: 'BABY_PEACH_WIN',
		lose_sfx: 'BABY_PEACH_LOSE',
		item_sfx: 'BABY_PEACH_ITEM',
		turbo_sfx: 'BABY_PEACH_TURBO',
		dmg_sfx: 'BABY_PEACH_DAMAGE',
		select_sfx: 'BABY_PEACH_SELECT'
	},
	{ 
		id: 'baby_daisy',
		name: 'Baby Daisy', 
		sprite: './sprites/BabyDaisy.png',
		icon: './icons/BabyDaisy_icon.png',
		modelConfig: { file: '/riggedCharacters/BabyDaisy_Skeleton.glb', scale: 0.8, bodyNode: 'baby_daisy_body' },
		veichles: SMALL_VEHICLES,
		stats: { speed: '2', acceleration: '1', weight: '0', handling: '1', traction: '0', drift: '0', offroad: '0' },
		win_sfx: 'BABY_DAISY_WIN',
		lose_sfx: 'BABY_DAISY_LOSE',
		item_sfx: 'BABY_DAISY_ITEM',
		turbo_sfx: 'BABY_DAISY_TURBO',
		dmg_sfx: 'BABY_DAISY_DAMAGE',
		select_sfx: 'BABY_DAISY_SELECT'
	},

	// === RIGA 2: PICCOLI (Toads & Koopas) ===
	{ 
		id: 'toad',
		name: 'Toad', 
		sprite: './sprites/Toad.png',
		icon: './icons/Toad_icon.png',
		modelConfig: { file: '/riggedCharacters/Toad_Skeleton.glb', scale: 0.8, bodyNode: 'toad_body' },
		veichles: SMALL_VEHICLES,
		stats: { speed: '0', acceleration: '2', weight: '0', handling: '1', traction: '1', drift: '1', offroad: '0' },
		win_sfx: 'TOAD_WIN',
		lose_sfx: 'TOAD_LOSE',
		item_sfx: 'TOAD_ITEM',
		turbo_sfx: 'TOAD_TURBO',
		dmg_sfx: 'TOAD_DAMAGE',
		select_sfx: 'TOAD_SELECT'
	},
	{ 
		id: 'toadette',
		name: 'Toadette', 
		sprite: './sprites/Toadette.png',
		icon: './icons/Toadette_icon.png',
		modelConfig: { file: '/riggedCharacters/Toadette_Skeleton.glb', scale: 0.8, bodyNode: 'toadette_body' },
		veichles: SMALL_VEHICLES,
		stats: { speed: '1', acceleration: '1', weight: '0', handling: '1', traction: '0', drift: '0', offroad: '2' },
		win_sfx: 'TOADETTE_WIN',
		lose_sfx: 'TOADETTE_LOSE',
		item_sfx: 'TOADETTE_ITEM',
		turbo_sfx: 'TOADETTE_TURBO',
		dmg_sfx: 'TOADETTE_DAMAGE',
		select_sfx: 'TOADETTE_SELECT'
	},
	{ 
		id: 'koopa',
		name: 'Koopa Troopa', 
		sprite: './sprites/KoopaTroopa.png',
		icon: './icons/KoopaTroopa_icon.png',
		modelConfig: { file: '/riggedCharacters/KoopaTroopa_Skeleton.glb', scale: 0.8, bodyNode: 'koopa_body' },
		veichles: SMALL_VEHICLES,
		stats: { speed: '0', acceleration: '1', weight: '0', handling: '1', traction: '2', drift: '0', offroad: '0' },
		win_sfx: 'KOOPA_WIN',
		lose_sfx: 'KOOPA_LOSE',
		item_sfx: 'KOOPA_ITEM',
		turbo_sfx: 'KOOPA_TURBO',
		dmg_sfx: 'KOOPA_DAMAGE',
		select_sfx: 'KOOPA_SELECT'
	},
	{ 
		id: 'dry_bones',
		name: 'Dry Bones', 
		sprite: './sprites/DryBones.png',
		icon: './icons/DryBones_icon.png',
		modelConfig: { file: '/riggedCharacters/DryBones_Skeleton.glb', scale: 0.8, bodyNode: 'dry_bones_body' },
		veichles: SMALL_VEHICLES,
		stats: { speed: '0', acceleration: '1', weight: '0', handling: '1', traction: '0', drift: '1', offroad: '1' },
		win_sfx: 'DRY_BONES_WIN',
		lose_sfx: 'DRY_BONES_LOSE',
		item_sfx: 'DRY_BONES_ITEM',
		turbo_sfx: 'DRY_BONES_TURBO',
		dmg_sfx: 'DRY_BONES_DAMAGE',
		select_sfx: 'DRY_BONES_SELECT'
	},

	// === RIGA 3: MEDI (Classici) ===
	{ 
		id: 'mario',
		name: 'Mario', 
		sprite: './sprites/Mario.png',
		icon: './icons/Mario_icon.png',
		modelConfig: { file: '/riggedCharacters/Mario_Skeleton.glb', scale: 0.8, bodyNode: 'mario_body' },
		veichles: MEDIUM_VEHICLES,
		stats: { speed: '0', acceleration: '1', weight: '2', handling: '1', traction: '0', drift: '1', offroad: '0' },
		win_sfx: 'MARIO_WIN',
		lose_sfx: 'MARIO_LOSE',
		item_sfx: 'MARIO_ITEM',
		turbo_sfx: 'MARIO_TURBO',
		dmg_sfx: 'MARIO_DAMAGE',
		select_sfx: 'MARIO_SELECT'
	},
	{ 
		id: 'luigi',
		name: 'Luigi', 
		sprite: './sprites/Luigi.png',
		icon: './icons/Luigi_icon.png',
		modelConfig: { file: '/riggedCharacters/Luigi_Skeleton.glb', scale: 0.8, bodyNode: 'luigi_body' },
		veichles: MEDIUM_VEHICLES,
		stats: { speed: '1', acceleration: '0', weight: '2', handling: '1', traction: '0', drift: '0', offroad: '0' },
		win_sfx: 'LUIGI_WIN',
		lose_sfx: 'LUIGI_LOSE',
		item_sfx: 'LUIGI_ITEM',
		turbo_sfx: 'LUIGI_TURBO',
		dmg_sfx: 'LUIGI_DAMAGE',
		select_sfx: 'LUIGI_SELECT'
	},
	{ 
		id: 'peach',
		name: 'Peach', 
		sprite: './sprites/Peach.png',
		icon: './icons/Peach_icon.png',
		modelConfig: { file: '/riggedCharacters/Peach_Skeleton.glb', scale: 0.8, bodyNode: 'peach_body' },
		veichles: MEDIUM_VEHICLES,
		stats: { speed: '1', acceleration: '2', weight: '1', handling: '0', traction: '0', drift: '2', offroad: '0' },
		win_sfx: 'PEACH_WIN',
		lose_sfx: 'PEACH_LOSE',
		item_sfx: 'PEACH_ITEM',
		turbo_sfx: 'PEACH_TURBO',
		dmg_sfx: 'PEACH_DAMAGE',
		select_sfx: 'PEACH_SELECT'
	},
	{ 
		id: 'daisy',
		name: 'Daisy', 
		sprite: './sprites/Daisy.png',
		icon: './icons/Daisy_icon.png',
		modelConfig: { file: '/riggedCharacters/Daisy_Skeleton.glb', scale: 0.8, bodyNode: 'daisy_body' },
		veichles: MEDIUM_VEHICLES,
		stats: { speed: '2', acceleration: '0', weight: '1', handling: '1', traction: '0', drift: '1', offroad: '0' },
		win_sfx: 'DAISY_WIN',
		lose_sfx: 'DAISY_LOSE',
		item_sfx: 'DAISY_ITEM',
		turbo_sfx: 'DAISY_TURBO',
		dmg_sfx: 'DAISY_DAMAGE',
		select_sfx: 'DAISY_SELECT'
	},

	// === RIGA 4: MEDI (Non Umani) ===
	{ 
		id: 'yoshi',
		name: 'Yoshi', 
		sprite: './sprites/Yoshi.png',
		icon: './icons/Yoshi_icon.png',
		modelConfig: { file: '/riggedCharacters/Yoshi_Skeleton.glb', scale: 0.8, bodyNode: 'yoshi_body' },
		veichles: MEDIUM_VEHICLES,
		stats: { speed: '0', acceleration: '1', weight: '1', handling: '1', traction: '0', drift: '1', offroad: '1' },
		win_sfx: 'YOSHI_WIN',
		lose_sfx: 'YOSHI_LOSE',
		item_sfx: 'YOSHI_ITEM',
		turbo_sfx: 'YOSHI_TURBO',
		dmg_sfx: 'YOSHI_DAMAGE',
		select_sfx: 'YOSHI_SELECT'
	},
	{ 
		id: 'birdo',
		name: 'Birdo', 
		sprite: './sprites/Birdo.png',
		icon: './icons/Birdo_icon.png',
		modelConfig: { file: '/riggedCharacters/Birdo_Skeleton.glb', scale: 0.8, bodyNode: 'birdo_body' },
		veichles: MEDIUM_VEHICLES,
		stats: { speed: '0', acceleration: '1', weight: '2', handling: '0', traction: '0', drift: '1', offroad: '2' },
		win_sfx: 'BIRDO_WIN',
		lose_sfx: 'BIRDO_LOSE',
		item_sfx: 'BIRDO_ITEM',
		turbo_sfx: 'BIRDO_TURBO',
		dmg_sfx: 'BIRDO_DAMAGE',
		select_sfx: 'BIRDO_SELECT'
	},
	{ 
		id: 'diddy_kong',
		name: 'Diddy Kong', 
		sprite: './sprites/DiddyKong.png',
		icon: './icons/DiddyKong_icon.png',
		modelConfig: { file: '/riggedCharacters/DiddyKong_Skeleton.glb', scale: 0.8, bodyNode: 'diddy_kong_body' },
		veichles: MEDIUM_VEHICLES,
		stats: { speed: '0', acceleration: '2', weight: '1', handling: '1', traction: '1', drift: '2', offroad: '0' },
		win_sfx: 'DIDDY_KONG_WIN',
		lose_sfx: 'DIDDY_KONG_LOSE',
		item_sfx: 'DIDDY_KONG_ITEM',
		turbo_sfx: 'DIDDY_KONG_TURBO',
		dmg_sfx: 'DIDDY_KONG_DAMAGE',
		select_sfx: 'DIDDY_KONG_SELECT'
	},
	{ 
		id: 'bowser_jr',
		name: 'Bowser Jr.', 
		sprite: './sprites/BowserJr.png',
		icon: './icons/BowserJr_icon.png',
		modelConfig: { file: '/riggedCharacters/BowserJr_Skeleton.glb', scale: 0.8, bodyNode: 'bowser_jr_body' },
		veichles: MEDIUM_VEHICLES,
		stats: { speed: '0', acceleration: '1', weight: '1', handling: '0', traction: '0', drift: '0', offroad: '1' },
		win_sfx: 'BOWSER_JR_WIN',
		lose_sfx: 'BOWSER_JR_LOSE',
		item_sfx: 'BOWSER_JR_ITEM',
		turbo_sfx: 'BOWSER_JR_TURBO',
		dmg_sfx: 'BOWSER_JR_DAMAGE',
		select_sfx: 'BOWSER_JR_SELECT'
	},

	// === RIGA 5: GRANDI (Rivali) ===
	{ 
		id: 'wario',
		name: 'Wario', 
		sprite: './sprites/Wario.png',
		icon: './icons/Wario_icon.png',
		modelConfig: { file: '/riggedCharacters/Wario_Skeleton.glb', scale: 0.7, bodyNode: 'wario_body' },
		veichles: LARGE_VEHICLES,
		stats: { speed: '0', acceleration: '1', weight: '2', handling: '0', traction: '1', drift: '1', offroad: '1' },
		win_sfx: 'WARIO_WIN',
		lose_sfx: 'WARIO_LOSE',
		item_sfx: 'WARIO_ITEM',
		turbo_sfx: 'WARIO_TURBO',
		dmg_sfx: 'WARIO_DAMAGE',
		select_sfx: 'WARIO_SELECT'
	},
	{ 
		id: 'waluigi',
		name: 'Waluigi', 
		sprite: './sprites/Waluigi.png',
		icon: './icons/Waluigi_icon.png',
		modelConfig: { file: '/riggedCharacters/Waluigi_Skeleton.glb', scale: 0.7, bodyNode: 'waluigi_body' },
		veichles: LARGE_VEHICLES,
		stats: { speed: '1', acceleration: '2', weight: '2', handling: '0', traction: '0', drift: '2', offroad: '1' },
		win_sfx: 'WALUIGI_WIN',
		lose_sfx: 'WALUIGI_LOSE',
		item_sfx: 'WALUIGI_ITEM',
		turbo_sfx: 'WALUIGI_TURBO',
		dmg_sfx: 'WALUIGI_DAMAGE',
		select_sfx: 'WALUIGI_SELECT'
	},
	{ 
		id: 'donkey_kong',
		name: 'Donkey Kong', 
		sprite: './sprites/DonkeyKong.png',
		icon: './icons/DonkeyKong_icon.png',
		modelConfig: { file: '/riggedCharacters/DonkeyKong_Skeleton.glb', scale: 0.7, bodyNode: 'donkey_kong_body' },
		veichles: LARGE_VEHICLES,
		stats: { speed: '0', acceleration: '1', weight: '2', handling: '1', traction: '0', drift: '1', offroad: '1' },
		win_sfx: 'DONKEY_KONG_WIN',
		lose_sfx: 'DONKEY_KONG_LOSE',
		item_sfx: 'DONKEY_KONG_ITEM',
		turbo_sfx: 'DONKEY_KONG_TURBO',
		dmg_sfx: 'DONKEY_KONG_DAMAGE',
		select_sfx: 'DONKEY_KONG_SELECT'
	},
	{ 
		id: 'bowser',
		name: 'Bowser', 
		sprite: './sprites/Bowser.png',
		icon: './icons/Bowser_icon.png',
		modelConfig: { file: '/riggedCharacters/Bowser_Skeleton.glb', scale: 0.7, bodyNode: 'bowser_body' },
		veichles: LARGE_VEHICLES,
		stats: { speed: '2', acceleration: '0', weight: '3', handling: '0', traction: '0', drift: '1', offroad: '0' },
		win_sfx: 'BOWSER_WIN',
		lose_sfx: 'BOWSER_LOSE',
		item_sfx: 'BOWSER_ITEM',
		turbo_sfx: 'BOWSER_TURBO',
		dmg_sfx: 'BOWSER_DAMAGE',
		select_sfx: 'BOWSER_SELECT'
	},

	// === RIGA 6: GRANDI (Speciali) ===
	{ 
		id: 'king_boo',
		name: 'King Boo', 
		sprite: './sprites/KingBoo.png',
		icon: './icons/KingBoo_icon.png',
		modelConfig: { file: '/riggedCharacters/KingBoo_Skeleton.glb', scale: 0.7, bodyNode: 'king_boo_body' },
		veichles: LARGE_VEHICLES,
		stats: { speed: '0', acceleration: '0', weight: '1', handling: '2', traction: '0', drift: '0', offroad: '1' },
		win_sfx: 'KING_BOO_WIN',
		lose_sfx: 'KING_BOO_LOSE',
		item_sfx: 'KING_BOO_ITEM',
		turbo_sfx: 'KING_BOO_TURBO',
		dmg_sfx: 'KING_BOO_DAMAGE',
		select_sfx: 'KING_BOO_SELECT'
	},
	{ 
		id: 'rosalina',
		name: 'Rosalina', 
		sprite: './sprites/Rosalina.png',
		icon: './icons/Rosalina_icon.png',
		modelConfig: { file: '/riggedCharacters/Rosalina_Skeleton.glb', scale: 0.7, bodyNode: 'rosalina_body' },
		veichles: LARGE_VEHICLES,
		stats: { speed: '1', acceleration: '0', weight: '1', handling: '1', traction: '0', drift: '1', offroad: '0' },
		win_sfx: 'ROSALINA_WIN',
		lose_sfx: 'ROSALINA_LOSE',
		item_sfx: 'ROSALINA_ITEM',
		turbo_sfx: 'ROSALINA_TURBO',
		dmg_sfx: 'ROSALINA_DAMAGE',
		select_sfx: 'ROSALINA_SELECT'
	},
	{ 
		id: 'funky_kong',
		name: 'Funky Kong', 
		sprite: './sprites/FunkyKong.png',
		icon: './icons/FunkyKong_icon.png',
		modelConfig: { file: '/riggedCharacters/FunkyKong_Skeleton.glb', scale: 0.7, bodyNode: 'funky_body' },
		veichles: LARGE_VEHICLES,
		stats: { speed: '2', acceleration: '0', weight: '0', handling: '0', traction: '0', drift: '0', offroad: '1' },
		win_sfx: 'FUNKY_KONG_WIN',
		lose_sfx: 'FUNKY_KONG_LOSE',
		item_sfx: 'FUNKY_KONG_ITEM',
		turbo_sfx: 'FUNKY_KONG_TURBO',
		dmg_sfx: 'FUNKY_KONG_DAMAGE',
		select_sfx: 'FUNKY_KONG_SELECT'
	},
	{ 
		id: 'dry_bowser',
		name: 'Dry Bowser', 
		sprite: './sprites/DryBowser.png',
		icon: './icons/DryBowser_icon.png',
		modelConfig: { file: '/riggedCharacters/DryBowser_Skeleton.glb', scale: 0.7, bodyNode: 'dry_bowser_body' },
		veichles: LARGE_VEHICLES,
		stats: { speed: '0', acceleration: '0', weight: '2', handling: '0', traction: '0', drift: '0', offroad: '2' },
		win_sfx: 'DRY_BOWSER_WIN',
		lose_sfx: 'DRY_BOWSER_LOSE',
		item_sfx: 'DRY_BOWSER_ITEM',
		turbo_sfx: 'DRY_BOWSER_TURBO',
		dmg_sfx: 'DRY_BOWSER_DAMAGE',
		select_sfx: 'DRY_BOWSER_SELECT'
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
		animationType: 'kart',
		vehicleOffset: [0, 0.1, 0]
    },
    'StandardBikeS': { 
        name: 'Standard Bike S', isBike: true, driftType: 'outside',
        stats: { speed: 30, weight: 15, accel: 65, handling: 65, drift: 55, offroad: 50 }, 
        modelConfig: { file: '/Vehicles/StandardBikeM.glb', scale: 0.008 },
        riderOffset: [-0.04, 0.04, -0.17],
		riderRotation: [0.80, 0.00, 0.00],
		handPos: [0.22, 0.65, 0.40],
		animationType: 'bike',
		vehicleOffset: [0, 0.3, 0]
    },
    'BoosterSeat': { 
        name: 'Booster Seat', isBike: false, driftType: 'outside',
        stats: { speed: 20, weight: 25, accel: 70, handling: 70, drift: 40, offroad: 60 }, 
        modelConfig: { file: '/Vehicles/BoosterSeat.glb', scale: 0.008 },
        riderOffset: [-0.02, 0.09, 0.01],
		riderRotation: [0.00, 0.00, 0.00],
		handPos: [0.18, 0.29, 0.30],
		animationType: 'kart',
		vehicleOffset: [0, 0.3, 0]
    },
    'BulletBike': { 
        name: 'Bullet Bike', isBike: true, driftType: 'inside',
        stats: { speed: 35, weight: 10, accel: 85, handling: 80, drift: 80, offroad: 30 }, 
        modelConfig: { file: '/Vehicles/BulletBike.glb', scale: 0.008 },
        riderOffset: [-0.01, 0.00, -0.10],
		riderRotation: [0.80, 0.00, 0.00],
		handPos: [0.15, 0.50, 2.00],
		animationType: 'bike',
		vehicleOffset: [0, 0.5, 0]
    },
    'MiniBeast': { 
        name: 'Mini Beast', isBike: false, driftType: 'outside',
        stats: { speed: 45, weight: 25, accel: 50, handling: 55, drift: 85, offroad: 20 }, 
        modelConfig: { file: '/Vehicles/MiniBeast.glb', scale: 0.008 },
        riderOffset: [-0.03, -0.10, 0.03],
		riderRotation: [0.00, 0.00, 0.00],
		handPos: [0.20, 0.25, -0.86],
		animationType: 'kart',
		vehicleOffset: [0, 0.6, 0]
    },
    'BitBike': { 
        name: 'Bit Bike', isBike: true, driftType: 'outside',
        stats: { speed: 10, weight: 10, accel: 90, handling: 90, drift: 40, offroad: 50 }, 
        modelConfig: { file: '/Vehicles/BitBike.glb', scale: 0.008 },
        riderOffset: [-0.04, 0.11, -0.21],
		riderRotation: [0.90, 0.00, 0.00],
		handPos: [0.25, 0.66, 0.35],
		animationType: 'bike',
		vehicleOffset: [0, 0.3, 0]
    },
    'CheepCharger': { 
        name: 'Cheep Charger', isBike: false, driftType: 'outside',
        stats: { speed: 30, weight: 20, accel: 60, handling: 60, drift: 50, offroad: 50 }, 
        modelConfig: { file: '/Vehicles/CheepCharger.glb', scale: 0.008 },
        riderOffset: [-0.03, 0, 0.13],
		riderRotation: [0.00, 0.00, 0.00],
		handPos: [0.20, 0.25, 0.30],
		animationType: 'kart',
		vehicleOffset: [0, 0.3, 0]
    },
    'Quacker': { 
        name: 'Quacker', isBike: true, driftType: 'inside',
        stats: { speed: 25, weight: 15, accel: 95, handling: 85, drift: 70, offroad: 30 }, 
        modelConfig: { file: '/Vehicles/Quacker.glb', scale: 0.008 },
        riderOffset: [-0.03, 0.07, 0.00],
		riderRotation: [0.10, 0.00, 0.00],
		handPos: [0.20, 0.48, 2.00],
		animationType: 'bike',
		vehicleOffset: [0, 0.4, 0]
    },
    'TinyTitan': { 
        name: 'Tiny Titan', isBike: false, driftType: 'outside',
        stats: { speed: 35, weight: 40, accel: 40, handling: 50, drift: 40, offroad: 90 }, 
        modelConfig: { file: '/Vehicles/TinyTitan.glb', scale: 0.008 },
        riderOffset: [0.00, 0.08, 0.05],
		riderRotation: [0.00, 0.00, 0.00],
		handPos: [0.22, 0.09, 1.96],
		animationType: 'kart',
		vehicleOffset: [0, 0.7, 0]
    },
    'Magikruiser': { 
        name: 'Magikruiser', isBike: true, driftType: 'inside',
        stats: { speed: 45, weight: 20, accel: 60, handling: 70, drift: 50, offroad: 95 }, 
        modelConfig: { file: '/Vehicles/Magikruiser.glb', scale: 0.008 },
        riderOffset: [-0.03, 0.00, -0.24],
		riderRotation: [0.85, 0.00, 0.00],
		handPos: [0.25, 0.90, 0.40],
		animationType: 'bike',
		vehicleOffset: [0, 0.5, 0]
    },
    'BlueFalcon': { 
        name: 'Blue Falcon', isBike: false, driftType: 'outside',
        stats: { speed: 65, weight: 25, accel: 40, handling: 40, drift: 50, offroad: 20 }, 
        modelConfig: { file: '/Vehicles/BlueFalcon.glb', scale: 0.008 },
        riderOffset: [-0.03, -0.15, 0.37],
		riderRotation: [-0.10, 0.00, 0.00],
		handPos: [0.15, 0.28, 0.40],
		animationType: 'kart',
		vehicleOffset: [0, 0.3, 0]
    },
    'JetBubble': { 
        name: 'Jet Bubble', isBike: true, driftType: 'inside',
        stats: { speed: 55, weight: 25, accel: 50, handling: 60, drift: 60, offroad: 30 }, 
        modelConfig: { file: '/Vehicles/JetBubble.glb', scale: 0.008 },
        riderOffset: [-0.02, 0.03, -0.10],
		riderRotation: [0.75, 0.00, 0.00],
		handPos: [0.20, 0.69, 0.40],
		animationType: 'bike',
		vehicleOffset: [0, 0.5, 0]
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
		handPos: [0.00, 0.16, -0.50],
		vehicleOffset: [0, 0.1, 0]
    },
    'StandardBikeM': { 
        name: 'Standard Bike M', isBike: true, driftType: 'outside',
        stats: { speed: 50, weight: 45, accel: 55, handling: 55, drift: 50, offroad: 50 }, 
        modelConfig: { file: '/Vehicles/StandardBikeM.glb', scale: 0.008 },
        riderOffset: [-0.06, -0.06, -0.41],
		riderRotation: [0.85, 0.05, 0.00],
		handPos: [0.20, 0.67, 1.00],
		animationType: 'bike',
		vehicleOffset: [0, 0.40, 0]
    },
    'ClassicDragster': { 
        name: 'Classic Dragster', isBike: false, driftType: 'outside',
        stats: { speed: 70, weight: 50, accel: 70, handling: 30, drift: 55, offroad: 30 }, 
        modelConfig: { file: '/Vehicles/ClassicDragster.glb', scale: 0.008 },
        riderOffset: [-0.06, -0.40, -0.20],
		riderRotation: [0.00, 0.00, 0.00],
		handPos: [0.00, 0.22, -0.50],
		animationType: 'kart',
		vehicleOffset: [0, 0.60, 0]
    },
    'MachBike': { 
        name: 'Mach Bike', isBike: true, driftType: 'inside',
        stats: { speed: 75, weight: 40, accel: 30, handling: 80, drift: 90, offroad: 20 }, 
        modelConfig: { file: '/Vehicles/MachBike.glb', scale: 0.008 },
        riderOffset: [-0.06, -0.22, -0.23],
		riderRotation: [0.75, 0.00, 0.00],
		handPos: [0.20, 0.28, 2.00],
		animationType: 'bike',
		vehicleOffset: [0, 0.45, 0]
    },
    'WildWing': { 
        name: 'Wild Wing', isBike: false, driftType: 'outside',
        stats: { speed: 65, weight: 55, accel: 40, handling: 55, drift: 80, offroad: 30 }, 
        modelConfig: { file: '/Vehicles/WildWing.glb', scale: 0.008 },
        riderOffset: [-0.06, -0.20, -0.10],
		riderRotation: [0.00, 0.00, 0.00],
		handPos: [0.20, 0.39, 0.40],
		animationType: 'kart',
		vehicleOffset: [0, 0.30, 0]
    },
    'Sugarscoot': { 
        name: 'Sugarscoot', isBike: true, driftType: 'outside',
        stats: { speed: 40, weight: 40, accel: 70, handling: 70, drift: 60, offroad: 60 }, 
        modelConfig: { file: '/Vehicles/Sugarscoot.glb', scale: 0.008 },
        riderOffset: [-0.06, -0.17, -0.08],
		riderRotation: [0.20, 0.00, 0.00],
		handPos: [0.25, 0.30, -1.71],
		animationType: 'bike',
		vehicleOffset: [0, 0.45, 0]
    },
    'SuperBlooper': { 
        name: 'Super Blooper', isBike: false, driftType: 'outside',
        stats: { speed: 55, weight: 60, accel: 30, handling: 40, drift: 60, offroad: 70 }, 
        modelConfig: { file: '/Vehicles/SuperBlooper.glb', scale: 0.008 },
        riderOffset: [-0.06, -0.30, 0.00],
		riderRotation: [0.00, 0.00, 0.00],
		handPos: [0.22, 0.20, 0.40],
		animationType: 'kart',
		vehicleOffset: [0, 0.30, 0]
    },
    'ZipZip': { 
        name: 'Zip Zip', isBike: true, driftType: 'inside',
        stats: { speed: 60, weight: 40, accel: 45, handling: 70, drift: 70, offroad: 40 }, 
        modelConfig: { file: '/Vehicles/ZipZip.glb', scale: 0.008 },
        riderOffset: [-0.03, -0.16, -0.31],
		riderRotation: [0.70, 0.00, 0.00],
		handPos: [0.22, 0.74, 0.40],
		animationType: 'bike',
		vehicleOffset: [0, 0.35, 0]
    },
    'DayTripper': { 
        name: 'Day Tripper', isBike: false, driftType: 'outside',
        stats: { speed: 45, weight: 55, accel: 60, handling: 60, drift: 40, offroad: 60 }, 
        modelConfig: { file: '/Vehicles/DayTripper.glb', scale: 0.008 },
        riderOffset: [-0.05, -0.20, -0.20],
		riderRotation: [0.35, 0.00, 0.00],
		handPos: [0.20, 0.21, -2.00],
		animationType: 'kart',
		vehicleOffset: [0, 0.45, 0]
    },
    'Sneakster': { 
        name: 'Sneakster', isBike: true, driftType: 'inside',
        stats: { speed: 80, weight: 45, accel: 20, handling: 40, drift: 80, offroad: 20 }, 
        modelConfig: { file: '/Vehicles/Sneakster.glb', scale: 0.008 },
        riderOffset: [-0.04, -0.06, -0.50],
		riderRotation: [1.20, 0.00, 0.00],
		handPos: [0.30, 0.70, 0.50],
		animationType: 'bike',
		vehicleOffset: [0, 0.35, 0]
    },
    'Sprinter': { 
        name: 'Sprinter', isBike: false, driftType: 'outside',
        stats: { speed: 85, weight: 50, accel: 30, handling: 30, drift: 40, offroad: 20 }, 
        modelConfig: { file: '/Vehicles/Sprinter.glb', scale: 0.008 },
        riderOffset: [0.00, -0.25, -0.04],
		riderRotation: [0.30, 0.00, 0.00],
		handPos: [0.18, 0.19, 0.50],
		animationType: 'kart',
		vehicleOffset: [0, 0.20, 0]
    },
    'DolphinDasher': { 
        name: 'Dolphin Dasher', isBike: true, driftType: 'inside',
        stats: { speed: 50, weight: 50, accel: 40, handling: 50, drift: 50, offroad: 85 }, 
        modelConfig: { file: '/Vehicles/DolphinDasher.glb', scale: 0.008 },
        riderOffset: [-0.04, -0.13, -0.36],
		riderRotation: [1.00, 0.00, 0.00],
		handPos: [0.25, 0.60, 0.40],
		animationType: 'bike',
		vehicleOffset: [0, 0.55, 0]
    },

    // ==========================================
    // CLASSE GRANDE (LARGE)
    // ==========================================
    'StandardKartL': { 
        name: 'Standard Kart L', isBike: false, driftType: 'outside',
        stats: { speed: 60, weight: 70, accel: 40, handling: 40, drift: 50, offroad: 40 }, 
        modelConfig: { file: '/Vehicles/StandardKartM.glb', scale: 0.008 },
        riderOffset: [-0.06, -0.47, 0.20],
		riderRotation: [0.00, 0.00, 0.00],
		handPos: [0.25, 0.28, 0.45],
		animationType: 'kart',
		vehicleOffset: [0, 0.20, 0]
    },
    'StandardBikeL': { 
        name: 'Standard Bike L', isBike: true, driftType: 'outside',
        stats: { speed: 60, weight: 65, accel: 45, handling: 45, drift: 50, offroad: 40 }, 
        modelConfig: { file: '/Vehicles/StandardBikeM.glb', scale: 0.008 },
        riderOffset: [-0.04, -0.10, -0.60],
		riderRotation: [0.80, 0.00, 0.00],
		handPos: [0.30, 0.60, 0.50],
		animationType: 'bike',
		vehicleOffset: [0, 0.55, 0]
    },
    'Offroader': { 
        name: 'Offroader', isBike: false, driftType: 'outside',
        stats: { speed: 50, weight: 80, accel: 40, handling: 40, drift: 40, offroad: 80 }, 
        modelConfig: { file: '/Vehicles/Offroader.glb', scale: 0.008 },
        riderOffset: [-0.06, -0.50, 0.34],
		riderRotation: [0.00, 0.00, 0.00],
		handPos: [0.25, 0.19, -2.00],
		animationType: 'kart',
		vehicleOffset: [0, 0.35, 0]
    },
    'FlameRunner': { 
        name: 'Flame Runner', isBike: true, driftType: 'inside',
        stats: { speed: 85, weight: 70, accel: 20, handling: 50, drift: 85, offroad: 20 }, 
        modelConfig: { file: '/Vehicles/FlameRunner.glb', scale: 0.008 },
        riderOffset: [-0.06, -0.27, -0.46],
		riderRotation: [0.60, 0.00, 0.00],
		handPos: [0.25, 0.36, 0.50],
		animationType: 'bike',
		vehicleOffset: [0, 0.55, 0]
    },
    'FlameFlyer': { 
        name: 'Flame Flyer', isBike: false, driftType: 'outside',
        stats: { speed: 80, weight: 75, accel: 25, handling: 30, drift: 70, offroad: 20 }, 
        modelConfig: { file: '/Vehicles/FlameFlyer.glb', scale: 0.008 },
        riderOffset: [-0.07, -0.50, -0.39],
		riderRotation: [0.35, 0.00, 0.00],
		handPos: [0.22, 0.29, -2.00],
		animationType: 'kart',
		vehicleOffset: [0, 0.55, 0]
    },
    'WarioBike': { 
        name: 'Wario Bike', isBike: true, driftType: 'outside',
        stats: { speed: 40, weight: 80, accel: 30, handling: 60, drift: 50, offroad: 70 }, 
        modelConfig: { file: '/Vehicles/WarioBike.glb', scale: 0.008 },
        riderOffset: [-0.09, -0.43, 0.34],
		riderRotation: [-0.20, 0.00, 0.00],
		handPos: [0.40, 0.43, 0.30],
		animationType: 'bike',
		vehicleOffset: [0, 0.45, 0]
    },
    'PiranhaProwler': { 
        name: 'Piranha Prowler', isBike: false, driftType: 'outside',
        stats: { speed: 55, weight: 90, accel: 30, handling: 30, drift: 50, offroad: 50 }, 
        modelConfig: { file: '/Vehicles/PiranhaProwler.glb', scale: 0.008 },
        riderOffset: [-0.05, -0.50, -0.10],
		riderRotation: [0.00, 0.00, 0.00],
		handPos: [0.25, 0.19, 0.40],
		animationType: 'kart',
		vehicleOffset: [0, 0.75, 0]
    },
    'ShootingStar': { 
        name: 'Shooting Star', isBike: true, driftType: 'inside',
        stats: { speed: 70, weight: 60, accel: 50, handling: 60, drift: 70, offroad: 30 }, 
        modelConfig: { file: '/Vehicles/ShootingStar.glb', scale: 0.008 },
        riderOffset: [-0.02, -0.50, -0.17],
		riderRotation: [0.30, 0.00, 0.00],
		handPos: [0.22, 0.58, 0.50],
		animationType: 'bike',
		vehicleOffset: [0, 0.55, 0]
    },
    'Jetsetter': { 
        name: 'Jetsetter', isBike: false, driftType: 'outside',
        stats: { speed: 95, weight: 70, accel: 10, handling: 10, drift: 30, offroad: 10 }, 
        modelConfig: { file: '/Vehicles/Jetsetter.glb', scale: 0.008 },
        riderOffset: [-0.07, -0.50, -0.06],
		riderRotation: [0.20, 0.00, 0.00],
		handPos: [0.20, 0.21, 0.40],
		animationType: 'kart',
		vehicleOffset: [0, 0.20, 0]
    },
    'Spear': { 
        name: 'Spear', isBike: true, driftType: 'inside',
        stats: { speed: 100, weight: 70, accel: 15, handling: 10, drift: 40, offroad: 10 }, 
        modelConfig: { file: '/Vehicles/Spear.glb', scale: 0.008 },
        riderOffset: [-0.07, -0.37, -0.74],
		riderRotation: [0.80, 0.00, 0.00],
		handPos: [0.20, 0.45, 0.60],
		animationType: 'bike',
		vehicleOffset: [0, 0.55, 0]
    },
    'HoneyCoupe': { 
        name: 'Honey Coupe', isBike: false, driftType: 'outside',
        stats: { speed: 65, weight: 75, accel: 30, handling: 40, drift: 80, offroad: 30 }, 
        modelConfig: { file: '/Vehicles/HoneyCoupe.glb', scale: 0.008 },
		riderOffset: [-0.04, -0.50, -0.38],
		riderRotation: [0.40, 0.00, 0.00],
		handPos: [0.22, 0.22, 0.40],
		animationType: 'kart',
		vehicleOffset: [0, 0.30, 0]
    },
    'Phantom': { 
        name: 'Phantom', isBike: true, driftType: 'outside',
        stats: { speed: 60, weight: 65, accel: 30, handling: 30, drift: 40, offroad: 85 }, 
        modelConfig: { file: '/Vehicles/Phantom.glb', scale: 0.008 },
        riderOffset: [0.00, -0.50, -0.07],
		riderRotation: [0.25, 0.00, 0.00],
		handPos: [0.35, 0.49, 0.30],
		animationType: 'bike' ,
		vehicleOffset: [0, 0.55, 0]
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
        handPos: [0.2, 0.5, 0.3],
		vehicleOffset: [0, 0, 0]
    }
};

// ============================================
// COSTANTI: Tracce audio disponibili
// ============================================
export const AUDIO_TRACKS = {
    MENU: '/soundTracks/TITLE_SCREEN.mp3', // title screen music
    CHARACTER_KART_SELECT: '/soundTracks/CHARACTER_KART_SELECT_SCREEN.mp3', // kart e character select music
    RACE_INTRO: '/soundTracks/RACE_INTRO.mp3',
    STARTING_GRID: '/soundTracks/STARTING_GRID.mp3',
    RACE_DAISY_CIRCUIT: '/soundTracks/DAISY_CIRCUIT_ST.mp3',
    RACE_LUIGI_CIRCUIT: '/soundTracks/LUIGI_CIRCUIT_ST.mp3',
    RACE_COCONUT_MALL: '/soundTracks/COCONUT_MALL_ST.mp3',
	RACE_SNES_MARIO_CIRCUIT: '/soundTracks/SNES_MARIO_CIRCUIT3_ST.mp3',
	RACE_N64_MARIO_RACEWAY: '/soundTracks/N64_MARIO_RACEWAY_ST.mp3',
	RACE_GCN_MARIO_CIRCUIT: '/soundTracks/GCN_MARIO_CIRCUIT_ST.mp3',
    RACE_DELPHINO_SQUARE: '/soundTracks/DELPHINO_SQUARE_ST.mp3',
    RACE_YOSHI_FALLS: '/soundTracks/YOSHI_FALLS_ST.mp3',
	RACE_DS_DESERT_HILLS: '/soundTracks/DS_DESERT_HILLS_ST.mp3',
    RACE_MOO_MOO_MEADOWS: '/soundTracks/MOO_MOO_MEADOWS_ST.mp3',
	RACE_BOWSER_CASTLE: '/soundTracks/BOWSER_CASTLE_ST.mp3',
	RACE_PEACH_GARDENS: '/soundTracks/PEACH_GARDENS_ST.mp3',
	RACE_DRY_DRY_RUINS: '/soundTracks/DRY_DRY_RUINS_ST.mp3',
	RACE_PEACH_BEACH: '/soundTracks/GCN_PEACH_BEACH_ST.mp3',
	RACE_GHOST_VALLEY: '/soundTracks/SNES_GHOST_VALLEY_2_ST.mp3',
	FINISH_FIRST: '/soundTracks/FINISH_1ST.mp3',
	FINISH_SECOND_FOURTH: '/soundTracks/FINISH_2ND-4TH.mp3',
	FINISH_FIFTH_TWELFTH: '/soundTracks/FINISH_5TH-12TH.mp3',
	GP_ENDED: '/soundTracks/GP_award_ceremony.mp3',
};

export const AUDIO_SFX = {
    KART_IDLE: '/SFX/kart/KART_IDLE.wav', // idle sound
    KART_GAS: '/SFX/kart/KART_GAS.wav', // gas sound
    KART_DOWNSHIFT: '/SFX/kart/KART_DOWN.wav', // downshift sound
    KART_LOOP: '/SFX/kart/KART_LOOP.wav', // loop sound
    KART_SPIN: '/SFX/kart/KART_SPIN.wav', // spin sound

    BIKE_IDLE: '/SFX/bike/BIKE_IDLE.wav',
    BIKE_GAS: '/SFX/bike/BIKE_GAS.wav',
    BIKE_DOWNSHIFT: '/SFX/bike/BIKE_DOWN.wav',
    BIKE_LOOP: '/SFX/bike/BIKE_LOOP.wav',

    BLUE_DRIFT: '/SFX/drift/SE_VCL_DRIFT_HIBANA_BLUE.wav',
    RED_DRIFT: '/SFX/drift/SE_VCL_DRIFT_HIBANA_RED.wav',
    TURBO_DRIFT: '/SFX/drift/SE_VCL_DASH.wav',
    NORMAL_DRIFT: '/SFX/drift/SE_VCL_SLIP_ASPHALT.wav',

    MOVE_IN_MENU: '/SFX/UI/SE_UI_BIN_IN.wav',
    SELECT_IN_MENU: '/SFX/UI/SE_UI_RADIO_IN.wav',
	BACK_IN_MENU: '/SFX/UI/SE_UI_PAGE_PREV.wav',
    START_RACE: '/SFX/UI/SE_UI_RACE_OK.wav',

    COUNTDOWN_RACE: '/SFX/race/321_RACE_COUNT.wav',
    FINISH_COUNTDOWN: '/SFX/race/SE_RC_GO.wav',

    FINAL_LAP: '/SFX/race/RACE_FINA_LAP.wav',
    SECOND_LAP: '/SFX/race/RACE_SECOND_LAP.wav',
    FINISH_RACE: '/SFX/race/RACE_GOAL.wav',
    
    BABY_MARIO_WIN: '/SFX/BabyMario/VO_BMR_GOL_GOD_END.rwav.wav',
    BABY_MARIO_LOSE: '/SFX/BabyMario/VO_BMR_GOL_BAD_END.rwav.wav',
    BABY_MARIO_ITEM: '/SFX/BabyMario/VO_BMR_ITM_PUT.rwav.wav',
    BABY_MARIO_TURBO: '/SFX/BabyMario/VO_BMR_DSH3.rwav.wav',
    BABY_MARIO_DAMAGE: '/SFX/BabyMario/VO_BMR_DMG_L2.rwav.wav',
    BABY_MARIO_SELECT: '/SFX/BabyMario/Baby_Mario_Select.wav',

    BABY_LUIGI_WIN: '/SFX/BabyLuigi/VO_BLG_GOL_GOD_END.rwav.wav',
    BABY_LUIGI_LOSE: '/SFX/BabyLuigi/VO_BLG_GOL_BAD_END.rwav.wav',
    BABY_LUIGI_ITEM: '/SFX/BabyLuigi/VO_BLG_ITM_PUT.rwav.wav',
    BABY_LUIGI_TURBO: '/SFX/BabyLuigi/VO_BLG_DSH3.rwav.wav',
    BABY_LUIGI_DAMAGE: '/SFX/BabyLuigi/VO_BLG_DMG_L2.rwav.wav',
    BABY_LUIGI_SELECT: '/SFX/BabyLuigi/Baby_Luigi_Select.wav',

    BABY_DAISY_WIN: '/SFX/BabyDaisy/VO_BDS_GOL_GOD_END.rwav.wav',
    BABY_DAISY_LOSE: '/SFX/BabyDaisy/VO_BDS_GOL_BAD_END.rwav.wav',
    BABY_DAISY_ITEM: '/SFX/BabyDaisy/VO_BDS_ITM_PUT.rwav.wav',
    BABY_DAISY_TURBO: '/SFX/BabyDaisy/VO_BDS_DSH3.rwav.wav',
    BABY_DAISY_DAMAGE: '/SFX/BabyDaisy/VO_BDS_DMG_L2.rwav.wav',
    BABY_DAISY_SELECT: '/SFX/BabyDaisy/Baby_Daisy_Select.wav',

    BABY_PEACH_WIN: '/SFX/BabyPeach/VO_BPC_GOL_GOD_END.rwav.wav',
    BABY_PEACH_LOSE: '/SFX/BabyPeach/VO_BPC_GOL_BAD_END.rwav.wav',
    BABY_PEACH_ITEM: '/SFX/BabyPeach/VO_BPC_ITM_PUT.rwav.wav',
    BABY_PEACH_TURBO: '/SFX/BabyPeach/VO_BPC_DSH3.rwav.wav',
    BABY_PEACH_DAMAGE: '/SFX/BabyPeach/VO_BPC_DMG_L2.rwav.wav',
    BABY_PEACH_SELECT: '/SFX/BabyPeach/Baby_Peach_Select.wav',

    BIRDO_WIN: '/SFX/Birdo/VO_CA_GOL_GOD_END.rwav.wav',
    BIRDO_LOSE: '/SFX/Birdo/VO_CA_GOL_BAD_END.rwav.wav',
    BIRDO_ITEM: '/SFX/Birdo/VO_CA_ITM_PUT.rwav.wav',
    BIRDO_TURBO: '/SFX/Birdo/VO_CA_DSH3.rwav.wav',
    BIRDO_DAMAGE: '/SFX/Birdo/VO_CA_DMG_L2.rwav.wav',
    BIRDO_SELECT: '/SFX/Birdo/Birdo_Select.wav',

    BOWSER_WIN: '/SFX/Bowser/VO_KP_GOL_GOD_END.rwav.wav',
    BOWSER_LOSE: '/SFX/Bowser/VO_KP_GOL_BAD_END.rwav.wav',
    BOWSER_ITEM: '/SFX/Bowser/VO_KP_ITM_PUT.rwav.wav',
    BOWSER_TURBO: '/SFX/Bowser/VO_KP_DSH3.rwav.wav',
    BOWSER_DAMAGE: '/SFX/Bowser/VO_KP_DMG_L2.rwav.wav',
    BOWSER_SELECT: '/SFX/Bowser/Bowser_Select.wav',

    BOWSER_JR_WIN: '/SFX/BowserJr/VO_JR_GOL_GOD_END.rwav.wav',
    BOWSER_JR_LOSE: '/SFX/BowserJr/VO_JR_GOL_BAD_END.rwav.wav',
    BOWSER_JR_ITEM: '/SFX/BowserJr/VO_JR_ITM_PUT.rwav.wav',
    BOWSER_JR_TURBO: '/SFX/BowserJr/VO_JR_DSH3.rwav.wav',
    BOWSER_JR_DAMAGE: '/SFX/BowserJr/VO_JR_DMG_L2.rwav.wav',
    BOWSER_JR_SELECT: '/SFX/BowserJr/Bowser_Jr_Select.wav',

    DAISY_WIN: '/SFX/Daisy/VO_DS_GOL_GOD_END.rwav.wav',
    DAISY_LOSE: '/SFX/Daisy/VO_DS_GOL_BAD_END.rwav.wav',
    DAISY_ITEM: '/SFX/Daisy/VO_DS_ITM_PUT.rwav.wav',
    DAISY_TURBO: '/SFX/Daisy/VO_DS_DSH3.rwav.wav',
    DAISY_DAMAGE: '/SFX/Daisy/VO_DS_DMG_L2.rwav.wav',
    DAISY_SELECT: '/SFX/Daisy/Daisy_Select.wav',

    DIDDY_KONG_WIN: '/SFX/DiddyKong/VO_DD_GOL_GOD_END.rwav.wav',
    DIDDY_KONG_LOSE: '/SFX/DiddyKong/VO_DD_GOL_BAD_END.rwav.wav',
    DIDDY_KONG_ITEM: '/SFX/DiddyKong/VO_DD_ITM_PUT.rwav.wav',
    DIDDY_KONG_TURBO: '/SFX/DiddyKong/VO_DD_DSH3.rwav.wav',
    DIDDY_KONG_DAMAGE: '/SFX/DiddyKong/VO_DD_DMG_L2.rwav.wav',
    DIDDY_KONG_SELECT: '/SFX/DiddyKong/Diddy_Kong_Select.wav',

    DONKEY_KONG_WIN: '/SFX/DonkeyKong/VO_DK_GOL_GOD_END.rwav.wav',
    DONKEY_KONG_LOSE: '/SFX/DonkeyKong/VO_DK_GOL_BAD_END.rwav.wav',
    DONKEY_KONG_ITEM: '/SFX/DonkeyKong/VO_DK_ITM_PUT.rwav.wav',
    DONKEY_KONG_TURBO: '/SFX/DonkeyKong/VO_DK_DSH3.rwav.wav',
    DONKEY_KONG_DAMAGE: '/SFX/DonkeyKong/VO_DK_DMG_L2.rwav.wav',
    DONKEY_KONG_SELECT: '/SFX/DonkeyKong/Donkey_Kong_Select.wav',

    DRY_BONES_WIN: '/SFX/DryBones/VO_DB_GOL_GOD_END.rwav.wav',
    DRY_BONES_LOSE: '/SFX/DryBones/VO_DB_GOL_BAD_END.rwav.wav',
    DRY_BONES_ITEM: '/SFX/DryBones/VO_DB_ITM_PUT.rwav.wav',
    DRY_BONES_TURBO: '/SFX/DryBones/VO_DB_DSH3.rwav.wav',
    DRY_BONES_DAMAGE: '/SFX/DryBones/VO_DB_DMG_L2.rwav.wav',
    DRY_BONES_SELECT: '/SFX/DryBones/Dry_Bones_Select.wav',

    DRY_BOWSER_WIN: '/SFX/DryBowser/VO_KDB_GOL_GOD_END.rwav.wav',
    DRY_BOWSER_LOSE: '/SFX/DryBowser/VO_KDB_GOL_BAD_END.rwav.wav',
    DRY_BOWSER_ITEM: '/SFX/DryBowser/VO_KDB_ITM_PUT.rwav.wav',
    DRY_BOWSER_TURBO: '/SFX/DryBowser/VO_KDB_DSH3.rwav.wav',
    DRY_BOWSER_DAMAGE: '/SFX/DryBowser/VO_KDB_DMG_L2.rwav.wav',
    DRY_BOWSER_SELECT: '/SFX/DryBowser/Dry_Bowser_Select.wav',

    FUNKY_KONG_WIN: '/SFX/FunkyKong/VO_FK_GOL_GOD_END.rwav.wav',
    FUNKY_KONG_LOSE: '/SFX/FunkyKong/VO_FK_GOL_BAD_END.rwav.wav',
    FUNKY_KONG_ITEM: '/SFX/FunkyKong/VO_FK_ITM_PUT.rwav.wav',
    FUNKY_KONG_TURBO: '/SFX/FunkyKong/VO_FK_DSH3.rwav.wav',
    FUNKY_KONG_DAMAGE: '/SFX/FunkyKong/VO_FK_DMG_L2.rwav.wav',
    FUNKY_KONG_SELECT: '/SFX/FunkyKong/Funky_Kong_Select.wav',

    KING_BOO_WIN: '/SFX/KingBoo/VO_KB_GOL_GOD_END.rwav.wav',
    KING_BOO_LOSE: '/SFX/KingBoo/VO_KB_GOL_BAD_END.rwav.wav',
    KING_BOO_ITEM: '/SFX/KingBoo/VO_KB_ITM_PUT.rwav.wav',
    KING_BOO_TURBO: '/SFX/KingBoo/VO_KB_DSH3.rwav.wav',
    KING_BOO_DAMAGE: '/SFX/KingBoo/VO_KB_DMG_L2.rwav.wav',
    KING_BOO_SELECT: '/SFX/KingBoo/King_Boo_Select.wav',

    KOOPA_WIN: '/SFX/KoopaTroopa/VO_KT_GOL_GOD_END.rwav.wav',
    KOOPA_LOSE: '/SFX/KoopaTroopa/VO_KT_GOL_BAD_END.rwav.wav',
    KOOPA_ITEM: '/SFX/KoopaTroopa/VO_KT_ITM_PUT.rwav.wav',
    KOOPA_TURBO: '/SFX/KoopaTroopa/VO_KT_DSH3.rwav.wav',
    KOOPA_DAMAGE: '/SFX/KoopaTroopa/VO_KT_DMG_L2.rwav.wav',
    KOOPA_SELECT: '/SFX/KoopaTroopa/Koopa_Troopa_Select.wav',

    LUIGI_WIN: '/SFX/Luigi/VO_LG_GOL_GOD_END.rwav.wav',
    LUIGI_LOSE: '/SFX/Luigi/VO_LG_GOL_BAD_END.rwav.wav',
    LUIGI_ITEM: '/SFX/Luigi/VO_LG_ITM_PUT.rwav.wav',
    LUIGI_TURBO: '/SFX/Luigi/VO_LG_DSH3.rwav.wav',
    LUIGI_DAMAGE: '/SFX/Luigi/VO_LG_DMG_L2.rwav.wav',
    LUIGI_SELECT: '/SFX/Luigi/Luigi_Select.wav',

    MARIO_WIN: '/SFX/Mario/VO_MR_GOL_GOD_END.rwav.wav',
    MARIO_LOSE: '/SFX/Mario/VO_MR_GOL_BAD_END.rwav.wav',
    MARIO_ITEM: '/SFX/Mario/VO_MR_ITM_PUT.rwav.wav',
    MARIO_TURBO: '/SFX/Mario/VO_MR_DSH3.rwav.wav',
    MARIO_DAMAGE: '/SFX/Mario/VO_MR_DMG_L2.rwav.wav',
    MARIO_SELECT: '/SFX/Mario/Mario_Select.wav',

    PEACH_WIN: '/SFX/Peach/VO_PC_GOL_GOD_END.rwav.wav',
    PEACH_LOSE: '/SFX/Peach/VO_PC_GOL_BAD_END.rwav.wav',
    PEACH_ITEM: '/SFX/Peach/VO_PC_ITM_PUT.rwav.wav',
    PEACH_TURBO: '/SFX/Peach/VO_PC_DSH3.rwav.wav',
    PEACH_DAMAGE: '/SFX/Peach/VO_PC_DMG_L2.rwav.wav',
    PEACH_SELECT: '/SFX/Peach/Peach_Select.wav',

    ROSALINA_WIN: '/SFX/Rosalina/VO_RS_GOL_GOD_END.rwav.wav',
    ROSALINA_LOSE: '/SFX/Rosalina/VO_RS_GOL_BAD_END.rwav.wav',
    ROSALINA_ITEM: '/SFX/Rosalina/VO_RS_ITM_PUT.rwav.wav',
    ROSALINA_TURBO: '/SFX/Rosalina/VO_RS_DSH3.rwav.wav',
    ROSALINA_DAMAGE: '/SFX/Rosalina/VO_RS_DMG_L2.rwav.wav',
    ROSALINA_SELECT: '/SFX/Rosalina/Rosalina_Select.wav',

    TOAD_WIN: '/SFX/Toad/VO_KO_GOL_GOD_END.rwav.wav',
    TOAD_LOSE: '/SFX/Toad/VO_KO_GOL_BAD_END.rwav.wav',
    TOAD_ITEM: '/SFX/Toad/VO_KO_ITM_PUT.rwav.wav',
    TOAD_TURBO: '/SFX/Toad/VO_KO_DSH3.rwav.wav',
    TOAD_DAMAGE: '/SFX/Toad/VO_KO_DMG_L2.rwav.wav',
    TOAD_SELECT: '/SFX/Toad/Toad_Select.wav',

    TOADETTE_WIN: '/SFX/Toadette/VO_KK_GOL_GOD_END.rwav.wav',
    TOADETTE_LOSE: '/SFX/Toadette/VO_KK_GOL_BAD_END.rwav.wav',
    TOADETTE_ITEM: '/SFX/Toadette/VO_KK_ITM_PUT.rwav.wav',
    TOADETTE_TURBO: '/SFX/Toadette/VO_KK_DSH3.rwav.wav',
    TOADETTE_DAMAGE: '/SFX/Toadette/VO_KK_DMG_L2.rwav.wav',
    TOADETTE_SELECT: '/SFX/Toadette/Toadette_Select.wav',

    WARIO_WIN: '/SFX/Wario/VO_WR_GOL_GOD_END.rwav.wav',
    WARIO_LOSE: '/SFX/Wario/VO_WR_GOL_BAD_END.rwav.wav',
    WARIO_ITEM: '/SFX/Wario/VO_WR_ITM_PUT.rwav.wav',
    WARIO_TURBO: '/SFX/Wario/VO_WR_DSH3.rwav.wav',
    WARIO_DAMAGE: '/SFX/Wario/VO_WR_DMG_L2.rwav.wav',
    WARIO_SELECT: '/SFX/Wario/Wario_Select.wav',

    WALUIGI_WIN: '/SFX/Waluigi/VO_WL_GOL_GOD_END.rwav.wav',
    WALUIGI_LOSE: '/SFX/Waluigi/VO_WL_GOL_BAD_END.rwav.wav',
    WALUIGI_ITEM: '/SFX/Waluigi/VO_WL_ITM_PUT.rwav.wav',
    WALUIGI_TURBO: '/SFX/Waluigi/VO_WL_DSH3.rwav.wav',
    WALUIGI_DAMAGE: '/SFX/Waluigi/VO_WL_DMG_L2.rwav.wav',
    WALUIGI_SELECT: '/SFX/Waluigi/Waluigi_Select.wav',

    YOSHI_WIN: '/SFX/Yoshi/VO_YS_GOL_GOD_END.rwav.wav',
    YOSHI_LOSE: '/SFX/Yoshi/VO_YS_GOL_BAD_END.rwav.wav',
    YOSHI_ITEM: '/SFX/Yoshi/VO_YS_ITM_PUT.rwav.wav',
    YOSHI_TURBO: '/SFX/Yoshi/VO_YS_DSH3.rwav.wav',
    YOSHI_DAMAGE: '/SFX/Yoshi/VO_YS_DMG_L2.rwav.wav',
    YOSHI_SELECT: '/SFX/Yoshi/Yoshi_Select.wav',

    THREE_SHELLS: '/SFX/red_greenShell/SE_ITM_KAME_EQUIP_3.wav', 
    TWO_SHELLS: '/SFX/red_greenShell/SE_ITM_KAME_EQUIP_2.wav',
    ONE_SHELL: '/SFX/red_greenShell/SE_ITM_KAME_EQUIP_1.wav',
    G_R_SHELL_HIT: '/SFX/red_greenShell/SE_ITM_KAME_HANSHA.wav',
    RED_SHELL_MOVE: '/SFX/red_greenShell/SE_ITM_KAME_R_MOVE.wav',
    GREEN_SHELL_MOVE: '/SFX/red_greenShell/SE_ITM_KAME_G_MOVE.wav',

    STAR_LOOP: '/SFX/star/SE_ITM_STAR_STATE.wav',

    THUNDER_USE: '/SFX/thunder/SE_ITM_THNDR_USE.wav',
    THUNDER_LOOP: '/SFX/thunder/SE_ITM_THNDR_STATE.wav',
    THUNDER_SMALL_STATE: '/SFX/thunder/SE_ITM_THNDR_SMALL.wav',
    THUNDER_BIG_STATE: '/SFX/thunder/SE_ITM_THNDR_BIG.wav',

    ITEM_BOX_BREAK: '/SFX/itemBox/SE_ITM_BOX_BRK.wav',
    ITEM_BOX_ROLL: '/SFX/itemBox/SE_RC_ITEM_DECIDE.wav',
    ITEM_BOX_DECIDE: '/SFX/itemBox/SE_RC_ITEM_ROULETTE.wav',

    BULLET_BILL_STATE: '/SFX/bulletBill/SE_ITM_KILLER_FLY.wav',
    BULLET_BILL_START: '/SFX/bulletBill/SE_ITM_KILLER_ON.wav',
    BULLET_BILL_OFF: '/SFX/bulletBill/SE_ITM_KILLER_OFF.wav',

    BOB_OMB_EXPLODE: '/SFX/bob-omb/SE_ITM_BOMB_EXPLODE.wav',

    BLUE_SHELL_LOOP: '/SFX/blueShell/SE_ITM_HANE_FLY.wav',
    BLUE_SHELL_EXPLODE: '/SFX/blueShell/SE_ITM_HANE_EXPLODE.wav',
    BLUE_SHELL_ABOVE: '/SFX/blueShell/SE_ITM_HANE_NEAR.wav',

    BIG_MUSHROOM_USE: '/SFX/bigMushroom/SE_ITM_BIG_KINOKO_USE.wav',
    BIG_MUSHROOM_STATE: '/SFX/bigMushroom/SE_ITM_BIG_KINOKO_STATE.wav',
    BIG_MUSHROOM_OFF: '/SFX/bigMushroom/SE_ITM_BIG_KINOKO_RET.wav',

    BANANA_THROW: '/SFX/banana/SE_ITM_BANANA_BOMB_FLY.wav',
    BANANA_GROUND: '/SFX/banana/SE_ITM_BANANA_GND.wav',
};