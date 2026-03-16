import React, { useEffect, useMemo, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { Canvas, useThree } from '@react-three/fiber';
import { Environment, OrbitControls, useGLTF } from '@react-three/drei';
import { Characters, Tracks } from '../components/Data.jsx';
import { RacerModel } from '../models/RacerModel.jsx';
import { SmartMap } from '../Tracks/SmartMap.jsx';
import { useAudio, AUDIO_SFX } from '../audio/AudioManager.jsx';
import { CustomWiiSky } from '../components/CustomeWiiSky.jsx';
import * as THREE from 'three';

// Componente per aggiornare la posizione iniziale della telecamera
function CameraSetup({ cameraPos, targetPos }) {
    const { camera } = useThree();
    useEffect(() => {
        camera.position.set(cameraPos.x, cameraPos.y, cameraPos.z);
        camera.lookAt(targetPos.x, targetPos.y, targetPos.z);
    }, [camera, cameraPos, targetPos]);
    return null;
}

// Componente per caricare il modello del Podio
function Podium() {
    const { scene } = useGLTF('/WinStand/WinStand.glb');
    return <primitive object={scene} scale={1.2} position={[0, 0, 0]} />;
}

export const WinScene = ({ selectedCup, raceResults, socket }) => {
    const navigate = useNavigate();
    const { playSfx, changeTrack, stopMusic } = useAudio();

    // Gestione reindirizzamento se mancano i dati
    useEffect(() => {
        if (!raceResults || raceResults.length === 0) {
            navigate('/menu');
        } else {
            // Suona la fanfara della vittoria
            stopMusic();
            changeTrack('FINISH_FIRST', 100, false);
        }
    }, [raceResults, navigate, changeTrack, stopMusic]);

    // Forza SEMPRE il caricamento di Mario Circuit come pista di sfondo
    const lastTrackConfig = useMemo(() => {
        return { name: 'Mario Circuit', ...Tracks['Mario Circuit'] };
    }, []);

    // Carica il file startpos per estrarre la linea del traguardo
    const gridGltf = useGLTF(lastTrackConfig.gridpos);

    // Calcola magicamente dove mettere Podio e Telecamera in base al file startpos!
    const { podiumPos, cameraPos, podiumRot, targetPos } = useMemo(() => {
        let pos = new THREE.Vector3(lastTrackConfig.startPos[0], lastTrackConfig.startPos[1], lastTrackConfig.startPos[2]);
        let rot = new THREE.Quaternion();
        let found = false;

        // Estrazione Pole Position dal file _startpos.glb (Linea di Partenza)
        if (lastTrackConfig.gridpos && gridGltf && gridGltf.scene) {
            gridGltf.scene.updateMatrixWorld(true);
            gridGltf.scene.traverse((obj) => {
                const nameLower = obj.name.toLowerCase();
                const match = nameLower.match(/(?:start|spawn|pos|grid).*?(\d+)/);
                if (!found && match && parseInt(match[1], 10) === 1) { // Prende la griglia n. 1 (Pole Position)
                    obj.getWorldPosition(pos);
                    obj.getWorldQuaternion(rot);
                    found = true;
                }
            });
        }

        // Calcoliamo la direzione in avanti della pista (Forward) e la destra (Right)
        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(rot).normalize();
        const right = new THREE.Vector3(1, 0, 0).applyQuaternion(rot).normalize();
        
        // MODIFICA: Spostiamo il podio fisicamente a sinistra di 1.5 unità lungo il vettore `right` (-1.5) per centrarlo fisicamente sulla strada.
        // POSIZIONE PODIO: Piazzato alla linea di partenza (via!), spostato leggermente in INDIETRO per avere il castello alle spalle, e A SINISTRA per centrarlo fisicamente sulla strada.
        const pPos = pos.clone().add(forward.clone().multiplyScalar(-2)).add(right.clone().multiplyScalar(-9.8));
        
        // POSIZIONE TELECAMERA: 16 unità INDIETRO rispetto alla partenza, che guarda in AVANTI (verso il castello)
        const cPos = pPos.clone().add(forward.clone().multiplyScalar(-16)).add(new THREE.Vector3(1.0, 1.0, 1.0)); // Alziamo leggermente la telecamera
        cPos.y += 2.5; // Alziamo leggermente l'inquadratura

        // ROTAZIONE PODIO: Invariata rispetto alla linea di partenza, così i personaggi guardano verso la telecamera
        const pEuler = new THREE.Euler().setFromQuaternion(rot);

        const tPos = new THREE.Vector3(pPos.x, pPos.y + 2.5, pPos.z);
        tPos.add(right.clone().multiplyScalar(3));

        return { podiumPos: pPos, cameraPos: cPos, podiumRot: pEuler, targetPos: tPos };
    }, [gridGltf, lastTrackConfig]);

    // Estrai i primi 3 classificati per il podio 3D
    const top3 = useMemo(() => {
        if (!raceResults) return [];
        return raceResults.slice(0, 3).map(racer => {
            const char = Characters.find(c => c.name === racer.name) || Characters[0];
            return { ...racer, char };
        });
    }, [raceResults]);

    const handleReturnToMenu = () => {
        playSfx(AUDIO_SFX.BACK_IN_MENU, 10);
        navigate('/menu');
    };

    if (!raceResults || raceResults.length === 0) return null;

    return (
        <div className="w-screen h-screen relative overflow-hidden font-sans select-none text-white bg-black">

            {/* SCENA 3D PRINCIPALE */}
            <div className="absolute inset-0 z-0">
                <Canvas camera={{ position: [cameraPos.x, cameraPos.y, cameraPos.z], fov: 45, far: 500000 }}>
                    <ambientLight intensity={1.2} />
                    <directionalLight position={[10, 20, 10]} intensity={1.5} castShadow />
                    <Environment preset="city" background={false} />
                    
                    {/* Setup automatico della Camera verso il bersaglio decentrato */}
                    <CameraSetup cameraPos={cameraPos} targetPos={targetPos} />
                    
                    {/* MODIFICA: Rimosso autoRotate={true} e autoRotateSpeed={0.5} per disabilitare la rotazione automatica. */}
                    {/* <OrbitControls 
                        enableZoom={false} 
                        enablePan={false}
                        minPolarAngle={Math.PI / 3} 
                        maxPolarAngle={Math.PI / 2.2}
                        target={[targetPos.x, targetPos.y, targetPos.z]}
                    /> */}
                    
                    <CustomWiiSky trackName={lastTrackConfig.name} />

                    <Suspense fallback={null}>
                        
                        {/* PISTA SULLO SFONDO (Tracciato mantenuto immobile in [0,0,0]) */}
                        <group position={[0, 0, 0]}>
                            <SmartMap modelPath={lastTrackConfig.file} scale={1} />
                        </group>

                        {/* GRUPPO PODIO (Sulla griglia di partenza!) */}
                        <group position={[podiumPos.x, podiumPos.y, podiumPos.z]} rotation={[0, podiumRot.y, 0]}>
                            <Podium />

                            {/* PRIMO CLASSIFICATO (Centro, Dritti) */}
                            {top3[0] && (
                                <group position={[0, 2.5, 0]}>
                                    <RacerModel characterConfig={top3[0].char.modelConfig} isInMenu={true} />
                                </group>
                            )}

                            {/* SECONDO CLASSIFICATO (Sinistra, Dritti) */}
                            {top3[1] && (
                                <group position={[-3, 1.6, 0]}>
                                    <RacerModel characterConfig={top3[1].char.modelConfig} isInMenu={true} />
                                </group>
                            )}

                            {/* TERZO CLASSIFICATO (Destra, Dritti) */}
                            {top3[2] && (
                                <group position={[3, 1.6, 0]}>
                                    <RacerModel characterConfig={top3[2].char.modelConfig} isInMenu={true} />
                                </group>
                            )}
                        </group>
                    </Suspense>
                </Canvas>
            </div>

            {/* INTERFACCIA UTENTE OVERLAY */}
            <div className="relative z-20 w-full h-full flex flex-col pointer-events-none">

                {/* Pannello Risultati (Destra) */}
                <div className="absolute right-12 top-[12vh] bottom-[15vh] w-full max-w-md flex flex-col justify-center pointer-events-auto animate-in slide-in-from-right duration-500">
                    <div className="bg-black/70 border-[4px] border-[#aa8800] rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.8)] backdrop-blur-md flex flex-col overflow-hidden h-full max-h-[75vh]">
                        
                        <div className="absolute inset-0 opacity-10 pointer-events-none" 
                             style={{backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,215,0,0.2) 2px, rgba(255,215,0,0.2) 4px)"}}>
                        </div>

                        <div className="bg-gradient-to-b from-[#aa8800] to-[#665500] py-3 text-center border-b-2 border-[#ffcc00] relative z-10 shadow-md">
                            <h2 className="text-2xl font-black text-white uppercase tracking-widest drop-shadow-[2px_2px_0_rgba(0,0,0,1)]">
                                Final Standings
                            </h2>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2 relative z-10">
                            {raceResults.map((racer, index) => {
                                const isTop3 = index < 3;
                                return (
                                    <div 
                                        key={racer.id}  
                                        className={`
                                            flex items-center justify-between px-4 py-2 rounded-lg border-2 shadow-sm
                                            ${index === 0 ? 'bg-gradient-to-r from-[#ffcc00]/80 to-[#aa8800]/80 border-[#ffffff] text-black shadow-[0_0_15px_#ffcc00]' : 
                                              index === 1 ? 'bg-gradient-to-r from-gray-300/80 to-gray-400/80 border-white text-black' : 
                                              index === 2 ? 'bg-gradient-to-r from-[#cd7f32]/80 to-[#8b5a2b]/80 border-white text-black' : 
                                              'bg-black/50 border-[#444] text-white hover:border-[#aa8800]'}
                                        `}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className={`font-mono text-xl font-bold w-6 text-right ${isTop3 ? 'text-black' : 'text-[#88aaff]'}`}>
                                                {index + 1}.
                                            </span>
                                            <span className="font-bold text-xl uppercase tracking-wide drop-shadow-sm">
                                                {socket && socket.id === racer.id ? 'You' : racer.name}
                                            </span>
                                        </div>
                                        <span className={`font-black text-2xl drop-shadow-sm ${isTop3 ? 'text-black' : 'text-[#ffcc00]'}`}>
                                            {racer.points} <span className="text-sm">pts</span>
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Footer con Tasto Menu */}
                <div className="h-[12vh] w-full flex items-center px-12 absolute bottom-0 left-0 pointer-events-auto shrink-0 z-30">
                    <div className="absolute bottom-2 left-0 w-full h-1 bg-gradient-to-r from-gray-400 via-gray-200 to-transparent pointer-events-none"></div>
                    <button 
                        onClick={handleReturnToMenu}
                        className="flex items-center gap-3 bg-white px-8 py-2 rounded-full border-[3px] border-[#cccccc] shadow-[0_4px_0_#999999] active:shadow-none active:translate-y-[4px] hover:bg-[#f0f0f0] transition-all cursor-pointer group"
                    >
                        <div className="w-8 h-8 rounded-full bg-[#ff4444] text-white flex items-center justify-center font-bold text-lg shadow-inner border border-white/50 group-active:scale-95">B</div>
                        <span className="text-gray-600 font-bold text-2xl tracking-wide uppercase">Main Menu</span>
                    </button>
                </div>
            </div>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.3); border-radius: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #aa8800; border-radius: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #ffcc00; }
            `}</style>
        </div>
    );
};