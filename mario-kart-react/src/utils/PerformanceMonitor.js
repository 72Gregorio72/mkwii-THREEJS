/**
 * Performance Monitor - Monitora FPS e degrada automaticamente la qualità se necessario
 */
export class PerformanceMonitor {
    constructor() {
        this.fps = 60;
        this.fpsHistory = [];
        this.maxHistoryLength = 120; // 2 secondi a 60fps
        this.lastTime = performance.now();
        this.frameCount = 0;
        this.lowFpsThreshold = 30;
        this.criticalFpsThreshold = 20;
        this.performanceLevel = 'high'; // 'high', 'medium', 'low'
        this.callbacks = [];
    }

    update() {
        const currentTime = performance.now();
        const delta = currentTime - this.lastTime;
        
        if (delta >= 1000) {
            this.fps = Math.round((this.frameCount * 1000) / delta);
            this.fpsHistory.push(this.fps);
            
            if (this.fpsHistory.length > this.maxHistoryLength) {
                this.fpsHistory.shift();
            }
            
            this.frameCount = 0;
            this.lastTime = currentTime;
            
            // Calcola FPS medio
            const avgFps = this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length;
            
            // Auto-degrada performance se necessario
            this.adjustPerformance(avgFps);
        }
        
        this.frameCount++;
    }

    adjustPerformance(avgFps) {
        let newLevel = this.performanceLevel;

        if (avgFps < this.criticalFpsThreshold && this.performanceLevel !== 'low') {
            newLevel = 'low';
            console.warn('[Performance] Switching to LOW quality mode');
        } else if (avgFps < this.lowFpsThreshold && this.performanceLevel === 'high') {
            newLevel = 'medium';
            console.warn('[Performance] Switching to MEDIUM quality mode');
        } else if (avgFps > 55 && this.performanceLevel !== 'high') {
            newLevel = 'high';
            console.log('[Performance] Switching to HIGH quality mode');
        }

        if (newLevel !== this.performanceLevel) {
            this.performanceLevel = newLevel;
            this.notifyCallbacks(newLevel);
        }
    }

    onPerformanceChange(callback) {
        this.callbacks.push(callback);
        return () => {
            this.callbacks = this.callbacks.filter(cb => cb !== callback);
        };
    }

    notifyCallbacks(level) {
        this.callbacks.forEach(cb => cb(level));
    }

    getFPS() {
        return this.fps;
    }

    getPerformanceLevel() {
        return this.performanceLevel;
    }

    getRecommendedSettings() {
        switch (this.performanceLevel) {
            case 'low':
                return {
                    shadows: false,
                    antialias: false,
                    dpr: 1,
                    physicsSteps: 30,
                    renderDistance: 200
                };
            case 'medium':
                return {
                    shadows: true,
                    antialias: false,
                    dpr: 1,
                    physicsSteps: 60,
                    renderDistance: 400
                };
            case 'high':
            default:
                return {
                    shadows: true,
                    antialias: true,
                    dpr: 2,
                    physicsSteps: 60,
                    renderDistance: 600
                };
        }
    }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();
