import React, { useEffect, useRef, useState } from 'react';
import { Characters } from '../components/Data.jsx';
import { socket } from '../multiplayer/socket.js';

const CANVAS_WIDTH = 310;
const CANVAS_HEIGHT = 310;
const TRACK_PADDING = 8;

const normalizeAngle = (angle) => {
    let a = angle;
    while (a > Math.PI) a -= Math.PI * 2;
    while (a < -Math.PI) a += Math.PI * 2;
    return a;
};

const lerpAngle = (from, to, t) => from + normalizeAngle(to - from) * t;

const getYawFromQuaternion = (q) => {
    if (!q) return 0;
    const w = q.w ?? 1;
    const x = q.x ?? 0;
    const y = q.y ?? 0;
    const z = q.z ?? 0;

    const sinyCosp = 2 * (w * y + x * z);
    const cosyCosp = 1 - 2 * (y * y + z * z);
    return Math.atan2(sinyCosp, cosyCosp);
};

export const Minimap = ({ trackPath, playerRef, playerCharacter, botRefs, remoteRefMap, opponents }) => {
    const canvasRef = useRef(null);
    const [bounds, setBounds] = useState({ minX: 0, maxX: 0, minZ: 0, maxZ: 0 });
    const [iconImages, setIconImages] = useState({});

    const lastHeadingRef = useRef(-Math.PI / 2);
    const lastPlayerCanvasPosRef = useRef(null);

    useEffect(() => {
        if (!Array.isArray(trackPath) || trackPath.length === 0) return;

        let minX = Infinity;
        let maxX = -Infinity;
        let minZ = Infinity;
        let maxZ = -Infinity;

        trackPath.forEach((point) => {
            if (point.x < minX) minX = point.x;
            if (point.x > maxX) maxX = point.x;
            if (point.z < minZ) minZ = point.z;
            if (point.z > maxZ) maxZ = point.z;
        });

        const paddingX = Math.max((maxX - minX) * 0.04, 1);
        const paddingZ = Math.max((maxZ - minZ) * 0.04, 1);

        setBounds({
            minX: minX - paddingX,
            maxX: maxX + paddingX,
            minZ: minZ - paddingZ,
            maxZ: maxZ + paddingZ,
        });
    }, [trackPath]);

    useEffect(() => {
        const srcById = {};

        const playerIconPath =
            opponents?.find((p) => p.id === socket.id)?.characterIcon || playerCharacter?.icon;
        if (playerIconPath) {
            srcById[socket.id] = playerIconPath.replace('./icons/', '/Icons/');
        }

        if (botRefs?.current) {
            Object.keys(botRefs.current).forEach((botId) => {
                const botCharacter = Characters.find((c) => c.id === botId);
                if (botCharacter?.icon) {
                    srcById[botId] = botCharacter.icon.replace('./icons/', '/Icons/');
                }
            });
        }

        if (Array.isArray(opponents)) {
            opponents.forEach((opp) => {
                if (opp?.characterIcon && opp?.id) {
                    srcById[opp.id] = opp.characterIcon.replace('./icons/', '/Icons/');
                }
            });
        }

        const entries = Object.entries(srcById);
        if (entries.length === 0) {
            setIconImages({});
            return;
        }

        let cancelled = false;
        let loaded = 0;
        const imgs = {};

        entries.forEach(([id, src]) => {
            const image = new Image();
            image.onload = () => {
                if (cancelled) return;
                imgs[id] = image;
                loaded += 1;
                if (loaded === entries.length) {
                    setIconImages({ ...imgs });
                }
            };
            image.onerror = () => {
                if (cancelled) return;
                loaded += 1;
                if (loaded === entries.length) {
                    setIconImages({ ...imgs });
                }
            };
            image.src = src;
        });

        return () => {
            cancelled = true;
        };
    }, [botRefs, opponents, playerCharacter]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !Array.isArray(trackPath) || trackPath.length < 2) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let rafId = 0;
        let isActive = true;

        const worldToCanvasFactory = () => {
            const centerX = (bounds.minX + bounds.maxX) * 0.5;
            const centerZ = (bounds.minZ + bounds.maxZ) * 0.5;
            const spanX = Math.max(bounds.maxX - bounds.minX, 1);
            const spanZ = Math.max(bounds.maxZ - bounds.minZ, 1);
            const scale = Math.min((CANVAS_WIDTH - TRACK_PADDING * 2) / spanX, (CANVAS_HEIGHT - TRACK_PADDING * 2) / spanZ);

            return {
                toCanvas: (x, z) => ({
                    x: CANVAS_WIDTH * 0.5 + (x - centerX) * scale,
                    y: CANVAS_HEIGHT * 0.5 - (z - centerZ) * scale,
                }),
                scale,
            };
        };

        const drawTrack = (toCanvas) => {
            ctx.beginPath();
            trackPath.forEach((point, index) => {
                const p = toCanvas(point.x, point.z);
                if (index === 0) ctx.moveTo(p.x, p.y);
                else ctx.lineTo(p.x, p.y);
            });
            const first = toCanvas(trackPath[0].x, trackPath[0].z);
            ctx.lineTo(first.x, first.y);

            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
            ctx.shadowBlur = 9;
            ctx.strokeStyle = 'rgba(126, 132, 141, 0.96)';
            ctx.lineWidth = 15;
            ctx.stroke();

            ctx.shadowBlur = 0;
            ctx.strokeStyle = 'rgba(248, 250, 252, 1)';
            ctx.lineWidth = 9;
            ctx.stroke();
        };

        const drawStartStrip = (toCanvas) => {
            const a = toCanvas(trackPath[0].x, trackPath[0].z);
            const b = toCanvas(trackPath[1].x, trackPath[1].z);
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const len = Math.max(Math.hypot(dx, dy), 0.0001);
            const nx = -dy / len;
            const ny = dx / len;

            const stripes = 6;
            const totalSpan = 26;
            const stripeSize = totalSpan / stripes;

            for (let i = 0; i < stripes; i++) {
                const offset = -totalSpan * 0.5 + i * stripeSize;
                const sx = a.x + nx * offset;
                const sy = a.y + ny * offset;
                const ex = sx + nx * stripeSize * 0.78;
                const ey = sy + ny * stripeSize * 0.78;

                ctx.strokeStyle = i % 2 === 0 ? 'rgba(255, 214, 60, 0.97)' : 'rgba(18, 19, 20, 0.96)';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(sx, sy);
                ctx.lineTo(ex, ey);
                ctx.stroke();
            }
        };

        const drawIconMarker = (p, id, fallbackColor = 'rgba(255, 255, 255, 0.95)', size = 18) => {
            const icon = iconImages[id];

            if (icon && icon.complete) {
                ctx.save();
                ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
                ctx.shadowBlur = 6;
                ctx.drawImage(icon, p.x - size * 0.5, p.y - size * 0.5, size, size);
                ctx.restore();
                return;
            }

            ctx.save();
            ctx.fillStyle = fallbackColor;
            ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
            ctx.shadowBlur = 4;
            ctx.fillRect(p.x - size * 0.34, p.y - size * 0.34, size * 0.68, size * 0.68);
            ctx.restore();
        };

        const drawPlayerDirectionCone = (p, heading, radius = 46, halfAngle = 0.42) => {
            const start = heading - halfAngle;
            const end = heading + halfAngle;

            ctx.save();
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.arc(p.x, p.y, radius, start, end);
            ctx.closePath();
            ctx.fillStyle = 'rgba(255, 224, 80, 0.5)';
            ctx.fill();
            ctx.restore();
        };

        const drawFrame = () => {
            if (!isActive) return;

            ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

            const { toCanvas } = worldToCanvasFactory();

            drawTrack(toCanvas);
            drawStartStrip(toCanvas);

            if (botRefs?.current) {
                Object.keys(botRefs.current).forEach((botId) => {
                    const bot = botRefs.current[botId];
                    if (!bot?.current?.translation) return;
                    try {
                        const pos = bot.current.translation();
                        drawIconMarker(toCanvas(pos.x, pos.z), botId, 'rgba(246, 80, 80, 0.98)', 18);
                    } catch (e) {
                        // stale ref frame
                    }
                });
            }

            if (remoteRefMap?.current && Array.isArray(opponents)) {
                opponents.forEach((opp) => {
                    const oppRef = remoteRefMap.current[opp.id];
                    if (!oppRef?.current?.translation) return;
                    try {
                        const pos = oppRef.current.translation();
                        drawIconMarker(toCanvas(pos.x, pos.z), opp.id, 'rgba(107, 193, 255, 0.98)', 18);
                    } catch (e) { }
                });
            }

            if (playerRef?.current?.translation) {
                try {
                    const pos = playerRef.current.translation();
                    const canvasPos = toCanvas(pos.x, pos.z);

                    // Manteniamo un heading stabile per future estensioni visive.
                    if (playerRef.current.rotation) {
                        const q = playerRef.current.rotation();
                        const targetHeading = normalizeAngle(getYawFromQuaternion(q) - Math.PI / 2);
                        lastHeadingRef.current = lerpAngle(lastHeadingRef.current, targetHeading, 0.25);
                    }
                    lastPlayerCanvasPosRef.current = canvasPos;

                    drawPlayerDirectionCone(canvasPos, normalizeAngle(lastHeadingRef.current + Math.PI), 46, 0.4);

                    drawIconMarker(canvasPos, socket.id, 'rgba(255, 185, 40, 0.98)', 24);
                } catch (e) {
                    // stale ref frame
                }
            }

            rafId = requestAnimationFrame(drawFrame);
        };

        rafId = requestAnimationFrame(drawFrame);

        return () => {
            isActive = false;
            cancelAnimationFrame(rafId);
        };
    }, [trackPath, bounds, playerRef, botRefs, remoteRefMap, opponents, iconImages]);

    if (!Array.isArray(trackPath) || trackPath.length === 0) return null;

    return (
        <div
            style={{
                position: 'absolute',
                right: '24px',
                bottom: 'clamp(170px, 22vh, 300px)',
                width: `${CANVAS_WIDTH}px`,
                height: `${CANVAS_HEIGHT}px`,
                pointerEvents: 'none',
                zIndex: 120,
            }}
        >
            <canvas
                ref={canvasRef}
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                style={{
                    width: '100%',
                    height: '100%',
                                        background: 'rgba(52, 56, 62, 0.58)',
                    borderRadius: '10px',
                    display: 'block',
                }}
            />
        </div>
    );
};
