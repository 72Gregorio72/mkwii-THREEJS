import React, { useEffect, useRef, useMemo } from 'react'
import { useGLTF, useAnimations } from '@react-three/drei'
import { SkeletonUtils } from 'three-stdlib'
import { DoubleSide, LoopRepeat } from 'three'
import { useFrame } from '@react-three/fiber'
// import { useControls, folder } from 'leva'  // <--- COMMENTATO

// --- MAPPA DI RETARGETING ---
const BONE_MAP = {
    'Hips': 'skl_root',
    'Spine': 'spin', 'Spine1': 'spin', 'Spine2': 'spin',
    'LeftArm': 'arm_l1', 'LeftForeArm': 'arm_l2', 'LeftHand': 'wrist_l1',
    'RightArm': 'arm_r1', 'RightForeArm': 'arm_r2', 'RightHand': 'wrist_r1',
    'LeftUpLeg': 'leg_l1', 'LeftLeg': 'leg_l2', 'LeftFoot': 'ankle_l1',
    'RightUpLeg': 'leg_r1', 'RightLeg': 'leg_r2', 'RightFoot': 'ankle_r1',
    'Neck': 'neck_1', 'Head': 'face_1'
};

function retargetClip(originalClip) {
    const clip = originalClip.clone();
    const tracksToRemove = [];
    clip.tracks.forEach((track) => {
        let boneName = track.name.split('.')[0]; 
        const property = track.name.split('.')[1]; 
        if (boneName.includes(':')) boneName = boneName.split(':')[1];
        if (BONE_MAP[boneName]) track.name = `${BONE_MAP[boneName]}.${property}`;
        if (property === 'position' && boneName !== 'Hips' && BONE_MAP[boneName] !== 'skl_root') tracksToRemove.push(track);
    });
    clip.tracks = clip.tracks.filter(t => !tracksToRemove.includes(t));
    return clip;
}

export function RacerModel({ characterConfig, vehicleConfig, steer, drift, isKart = true, ...props }) {
  const group = useRef()
  
  // Refs Ossa
  const spineRef = useRef(null)
  const leftArmRef = useRef(null); const leftForeArmRef = useRef(null);
  const rightArmRef = useRef(null); const rightForeArmRef = useRef(null);

  const headRef = useRef(null)

  // 1. SETUP DEBUG (LEVA) - DEFAULT CONFIG
  if (!vehicleConfig) {
    vehicleConfig = {
      name: 'Default',
      riderOffset: [0, 0, 0],
      riderRotation: [0, 0, 0],
      handPos: [0.2, 0.5, 0.3]
    };
  }

  // --- INIZIO COMMENTO LEVA ---
  /*
  const values = useControls({
      [`Posizione Pilota (${vehicleConfig.name})`]: folder({
          offX: { value: vehicleConfig?.riderOffset?.[0] ?? 0, min: -0.5, max: 0.5, step: 0.01, label: 'Offset X' },
          offY: { value: vehicleConfig?.riderOffset?.[1] ?? 0, min: -0.5, max: 0.5, step: 0.01, label: 'Offset Y' },
          offZ: { value: vehicleConfig?.riderOffset?.[2] ?? 0, min: -1, max: 0.5, step: 0.01, label: 'Offset Z' },
          
          rotX: { value: vehicleConfig?.riderRotation?.[0] ?? 0, min: -1.5, max: 1.5, step: 0.05, label: 'Ruota X' },
          rotY: { value: vehicleConfig?.riderRotation?.[1] ?? 0, min: -1.5, max: 1.5, step: 0.05, label: 'Ruota Y' },
          rotZ: { value: vehicleConfig?.riderRotation?.[2] ?? 0, min: -1.5, max: 1.5, step: 0.05, label: 'Ruota Z' },
      }),
      [`Mani (${vehicleConfig.name})`]: folder({
          hx: { value: vehicleConfig?.handPos?.[0] ?? 0.2, min: 0, max: 10, step: 0.01, label: 'Larghezza' },
          hy: { value: vehicleConfig?.handPos?.[1] ?? 0.5, min: 0, max: 1.5, step: 0.01, label: 'Altezza' },
          hz: { value: vehicleConfig?.handPos?.[2] ?? 0.3, min: -2, max: 2, step: 0.01, label: 'Profondità' }
      })
  }, [vehicleConfig]);
  */
  // --- FINE COMMENTO LEVA ---

  // Sostituzione statica per mantenere il funzionamento del codice
  const values = {
      offX: vehicleConfig?.riderOffset?.[0] ?? 0,
      offY: vehicleConfig?.riderOffset?.[1] ?? 0,
      offZ: vehicleConfig?.riderOffset?.[2] ?? 0,
      rotX: vehicleConfig?.riderRotation?.[0] ?? 0,
      rotY: vehicleConfig?.riderRotation?.[1] ?? 0,
      rotZ: vehicleConfig?.riderRotation?.[2] ?? 0,
      hx: vehicleConfig?.handPos?.[0] ?? 0.2,
      hy: vehicleConfig?.handPos?.[1] ?? 0.5,
      hz: vehicleConfig?.handPos?.[2] ?? 0.3
  };

  // Caricamento Assets
  const { scene: charScene } = useGLTF(characterConfig.file)
  const clone = useMemo(() => SkeletonUtils.clone(charScene), [charScene])
  const { animations: kartAnims } = useGLTF('/Animations/driving_kart.glb')
  const { animations: bikeAnims } = useGLTF('/Animations/driving_kart.glb') 
  const { animations: idleAnims } = useGLTF('/Animations/break_dance.glb') 

  const anims = useMemo(() => {
      const clips = [];
      if (kartAnims?.[0]) { const c = retargetClip(kartAnims[0]); c.name = 'kart'; clips.push(c); }
      if (bikeAnims?.[0]) { const c = retargetClip(bikeAnims[0]); c.name = 'bike'; clips.push(c); }
      if (idleAnims?.[0]) { const c = retargetClip(idleAnims[0]); c.name = 'idle'; clips.push(c); }
      return clips;
  }, [kartAnims, bikeAnims, idleAnims]);

  const { actions, names } = useAnimations(anims, group)

  // Gestione Animazioni
  useEffect(() => {
      let targetAnim = 'idle';
      if (isKart && vehicleConfig) targetAnim = vehicleConfig.animationType || 'kart';

      names.forEach(name => {
          const action = actions[name];
          if (!action) return;
          if (name === targetAnim) action.reset().fadeIn(0.2).play().setLoop(LoopRepeat);
          else action.fadeOut(0.2);
      });
  }, [vehicleConfig, isKart, actions, names]);

  useEffect(() => {
      clone.traverse(o => { 
        if (o.isBone) {
            if (o.name === 'spin') spineRef.current = o;
            if (o.name === 'arm_l1') leftArmRef.current = o;
            if (o.name === 'arm_l2') leftForeArmRef.current = o;
            if (o.name === 'arm_r1') rightArmRef.current = o;
            if (o.name === 'arm_r2') rightForeArmRef.current = o;
			if (o.name === 'face_1') headRef.current = o;
        }
      });
  }, [clone]);

  // =====================================================================
  // LOGICA PROCEDURALE
  // =====================================================================
  useFrame((state, delta) => {
      if (!isKart || !group.current) return;

      const isBike = vehicleConfig?.isBike;
      
      // LEAN DINAMICO (Sterzo)
      if (spineRef.current) {
          spineRef.current.rotation.z += -steer * 0.3; 
          group.current.rotation.y = steer * 0.1;
      }

      // CALCOLO POSA BRACCIA
      const { hx, hy, hz } = values;
      const baseShoulderLift = 0.2; 
      const liftFactor = (hy - 0.5) * 2.0; 
      const poseZ = baseShoulderLift + liftFactor; 
      const poseY = 0.3; 
      const armStraighten = (hy > 0.6 || hz > 0.5) ? -0.4 : 0;
      const steerInfluence = isBike ? steer * 0.3 : 0;

      if (leftArmRef.current && leftForeArmRef.current) {
          leftArmRef.current.rotation.z += poseZ; 
          leftArmRef.current.rotation.y -= (poseY + steerInfluence); 
          leftForeArmRef.current.rotation.x += armStraighten;
      }

      if (rightArmRef.current && rightForeArmRef.current) {
          rightArmRef.current.rotation.z += poseZ; 
          rightArmRef.current.rotation.y += (poseY - steerInfluence); 
          rightForeArmRef.current.rotation.x -= armStraighten;
      }
	  
	  if (headRef.current) {
		  headRef.current.rotation.z += values.rotX; 
	  }

  })

  useEffect(() => {
    clone.traverse((object) => {
      if (object.isMesh && object.material) {
          object.castShadow = true; object.receiveShadow = true;
          object.material.transparent = false;
          object.material.depthWrite = true;
          object.material.side = DoubleSide;
          object.material.color.setHex(0xffffff);
          object.material.needsUpdate = true;
      }
    })
  }, [clone]);

  return (
    <group ref={group} {...props} dispose={null}>
      <primitive 
        object={clone} 
        scale={characterConfig.scale || 1} 
        position={[values.offX, values.offY, values.offZ]} 
        rotation={[values.rotX, values.rotY, values.rotZ]} 
      />
    </group>
  )
}