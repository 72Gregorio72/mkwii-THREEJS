import React, { useEffect, useRef, useState } from 'react';
import { Characters } from '../components/Data.jsx';

export const Minimap = ({ trackPath, playerRef, playerCharacter, botRefs, remoteRefMap, opponents, playerRank }) => {
    const canvasRef = useRef(null);
    const [bounds, setBounds] = useState({ minX: 0, maxX: 0, minZ: 0, maxZ: 0 });
    const [iconImages, setIconImages] = useState({});

    // Calcola i bounds del tracciato una volta sola
    useEffect(() => {
        if (!trackPath || trackPath.length === 0) return;

        let minX = Infinity, maxX = -Infinity;
        let minZ = Infinity, maxZ = -Infinity;

        trackPath.forEach(point => {
            if (point.x < minX) minX = point.x;
            if (point.x > maxX) maxX = point.x;
            if (point.z < minZ) minZ = point.z;
            if (point.z > maxZ) maxZ = point.z;
        });

        // Aggiungi un po' di padding
        const paddingX = (maxX - minX) * 0.1;
        const paddingZ = (maxZ - minZ) * 0.1;

        setBounds({
            minX: minX - paddingX,
            maxX: maxX + paddingX,
            minZ: minZ - paddingZ,
            maxZ: maxZ + paddingZ
        });
    }, [trackPath]);

    // Precarica tutte le icone dei personaggi
    useEffect(() => {
        const loadedImages = {};
        const imagesToLoad = [];

        // Icona player
        if (playerCharacter?.icon) {
            const iconPath = playerCharacter.icon.replace('./icons/', '/Icons/');
            //console.log('[Minimap] Player icon path:', iconPath);
            imagesToLoad.push({ key: 'player', src: iconPath });
        }

        // Icone bot
        if (botRefs && botRefs.current) {
            const botIds = Object.keys(botRefs.current);
            //console.log('[Minimap] Bot IDs from refs:', botIds);
            
            botIds.forEach(botId => {
                // Cerca il character corrispondente in Characters usando l'ID del bot
                const botCharacter = Characters.find(c => c.id === botId);
                if (botCharacter?.icon) {
                    const iconPath = botCharacter.icon.replace('./icons/', '/Icons/');
                    console.log(`[Minimap] Bot ${botId} icon path:`, iconPath);
                    imagesToLoad.push({ key: botId, src: iconPath });
                }
            });
        }

        // Icone opponents
        if (opponents) {
            //console.log('[Minimap] Opponents count:', opponents.length);
            opponents.forEach(opp => {
                if (opp.characterIcon) {
                    const iconPath = opp.characterIcon.replace('./icons/', '/Icons/');
                    console.log(`[Minimap] Opponent ${opp.id} icon path:`, iconPath);
                    imagesToLoad.push({ key: opp.id, src: iconPath });
                }
            });
        }

        //console.log('[Minimap] Total images to load:', imagesToLoad.length);

        if (imagesToLoad.length === 0) {
            setIconImages({});
            return;
        }

        // Carica tutte le immagini
        let loadedCount = 0;
        imagesToLoad.forEach(({ key, src }) => {
            const img = new Image();
            img.onload = () => {
                console.log(`[Minimap] ✓ Loaded icon for ${key}:`, src);
                loadedImages[key] = img;
                loadedCount++;
                if (loadedCount === imagesToLoad.length) {
                    //console.log('[Minimap] All icons loaded:', Object.keys(loadedImages));
                    setIconImages({ ...loadedImages });
                }
            };
            img.onerror = (e) => {
                console.error(`[Minimap] ✗ Failed to load icon for ${key}:`, src, e);
                loadedCount++;
                if (loadedCount === imagesToLoad.length) {
                    //console.log('[Minimap] Finished loading (with errors):', Object.keys(loadedImages));
                    setIconImages({ ...loadedImages });
                }
            };
            img.src = src;
        });
    }, [playerCharacter, botRefs, opponents]);

    // Rendering continuo della mappa
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !trackPath || trackPath.length === 0) return;

        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        let frameCount = 0;
        const animate = () => {
            frameCount++;
            // Log ogni 60 frame (circa 1 secondo)
            if (frameCount % 60 === 0) {
                //console.log('[Minimap] Frame render. IconImages available:', Object.keys(iconImages).length, iconImages);
            }

            // Pulisci canvas
            ctx.clearRect(0, 0, width, height);

            // Sfondo semi-trasparente
            ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            ctx.fillRect(0, 0, width, height);

            // Funzione per convertire coordinate mondo -> canvas
            const worldToCanvas = (x, z) => {
                const normalizedX = (x - bounds.minX) / (bounds.maxX - bounds.minX);
                const normalizedZ = (z - bounds.minZ) / (bounds.maxZ - bounds.minZ);
                return {
                    x: normalizedX * width,
                    y: height - (normalizedZ * height) // Inverti Y per visualizzazione corretta
                };
            };

            // Disegna il tracciato
            ctx.strokeStyle = 'rgba(150, 150, 150, 0.8)';
            ctx.lineWidth = 3;
            ctx.beginPath();

            trackPath.forEach((point, index) => {
                const canvasPos = worldToCanvas(point.x, point.z);
                if (index === 0) {
                    ctx.moveTo(canvasPos.x, canvasPos.y);
                } else {
                    ctx.lineTo(canvasPos.x, canvasPos.y);
                }
            });

            // Chiudi il circuito
            const firstPoint = worldToCanvas(trackPath[0].x, trackPath[0].z);
            ctx.lineTo(firstPoint.x, firstPoint.y);
            ctx.stroke();

            // Disegna linea di partenza/arrivo (primo waypoint)
            const startPos = worldToCanvas(trackPath[0].x, trackPath[0].z);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.arc(startPos.x, startPos.y, 4, 0, Math.PI * 2);
            ctx.stroke();

            // Funzione helper per disegnare un'icona
            const drawIcon = (canvasPos, iconKey, size = 12) => {
                const icon = iconImages[iconKey];
                if (icon && icon.complete) {
                    ctx.drawImage(
                        icon, 
                        canvasPos.x - size / 2, 
                        canvasPos.y - size / 2, 
                        size, 
                        size
                    );
                } else {
                    ctx.fillStyle = 'rgba(255, 100, 100, 0.9)';
                    ctx.beginPath();
                    ctx.arc(canvasPos.x, canvasPos.y, size / 3, 0, Math.PI * 2);
                    ctx.fill();
                }
            };

            // Disegna bot
            if (botRefs.current) {
                Object.keys(botRefs.current).forEach(botId => {
                    const botRef = botRefs.current[botId];
                    if (botRef?.current?.translation) {
                        try {
                            const pos = botRef.current.translation();
                            const canvasPos = worldToCanvas(pos.x, pos.z);
                            drawIcon(canvasPos, botId, 20);
                        } catch (e) {
                            // Ignora errori di traduzione
                        }
                    }
                });
            }

            // Disegna opponents online
            if (remoteRefMap && remoteRefMap.current && opponents) {
                opponents.forEach(opp => {
                    const oppRef = remoteRefMap.current[opp.id];
                    if (oppRef?.current?.translation) {
                        try {
                            const pos = oppRef.current.translation();
                            const canvasPos = worldToCanvas(pos.x, pos.z);
                            drawIcon(canvasPos, opp.id, 20);
                        } catch (e) {
                            // Ignora errori
                        }
                    }
                });
            }

            // Disegna player (ultimo, per essere sopra)
            if (playerRef?.current?.translation) {
                try {
                    const pos = playerRef.current.translation();
                    const canvasPos = worldToCanvas(pos.x, pos.z);

                    // Icona più grande per il player
                    drawIcon(canvasPos, 'player', 26);

                    // Bordo bianco attorno al player
                    ctx.strokeStyle = 'white';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.arc(canvasPos.x, canvasPos.y, 16, 0, Math.PI * 2);
                    ctx.stroke();

                    // Freccia direzione (opzionale)
                    try {
                        const rot = playerRef.current.rotation();
                        const angle = Math.atan2(rot.z, rot.x);
                        const arrowLength = 10;

                        ctx.strokeStyle = 'white';
                        ctx.lineWidth = 2;
                        ctx.beginPath();
                        ctx.moveTo(canvasPos.x, canvasPos.y);
                        ctx.lineTo(
                            canvasPos.x + Math.cos(angle) * arrowLength,
                            canvasPos.y - Math.sin(angle) * arrowLength
                        );
                        ctx.stroke();
                    } catch (e) {
                        // Ignora errori rotazione
                    }
                } catch (e) {
                    // Ignora errori
                }
            }

            requestAnimationFrame(animate);
        };

        const animationId = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationId);
    }, [trackPath, bounds, playerRef, botRefs, remoteRefMap, opponents, iconImages]);

    if (!trackPath || trackPath.length === 0) return null;

    return (
        <div style={{
            position: 'absolute',
            bottom: '20px',
            right: '20px',
            width: '300px',
            height: '300px',
            borderRadius: '10px',
            overflow: 'hidden',
            border: '3px solid rgba(255, 255, 255, 0.5)',
            boxShadow: '0 0 20px rgba(0, 0, 0, 0.8)',
            zIndex: 100,
        }}>
            <canvas 
                ref={canvasRef}
                width={300}
                height={300}
                style={{ width: '100%', height: '100%' }}
            />
        </div>
    );
};
