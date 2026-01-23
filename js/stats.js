            import Stats from 'three/addons/libs/stats.module.js';

            
class GameStats {
    constructor() {
        // Créer le conteneur principal
        this.container = document.createElement('div');
        this.container.id = 'stats-container';

        // Éléments pour FPS et mémoire
        this.fpsElement = document.createElement('div');
        this.fpsElement.id = 'fps-display';
        this.fpsElement.textContent = 'FPS: 0';

        this.memElement = document.createElement('div');
        this.memElement.id = 'mem-display';
        this.memElement.textContent = 'MEM: --/-- MB';

        this.container.appendChild(this.fpsElement);
        this.container.appendChild(this.memElement);

        // Stats.js pour mesurer les FPS (masqué)
        this.stats = new Stats();
        this.stats.domElement.style.display = 'none';

        // Variables pour le tracking
        this.lastFpsUpdate = 0;
        this.lastMemoryUpdate = 0;
        this.frameCount = 0;
        this.lastFpsTime = performance.now();
        this.currentFps = 0;
    }

    init(parentContainer) {
        parentContainer.appendChild(this.container);
        parentContainer.appendChild(this.stats.domElement);
    }

    update() {
        // Mise à jour des FPS
        this.stats.update();
        this.frameCount++;

        const now = performance.now();
        if (now - this.lastFpsTime >= 1000) {
            this.currentFps = Math.round((this.frameCount * 1000) / (now - this.lastFpsTime));
            this.fpsElement.textContent = `FPS: ${this.currentFps}`;
            this.frameCount = 0;
            this.lastFpsTime = now;
        }

        // Mise à jour de la mémoire (toutes les 1s)
        if (now - this.lastMemoryUpdate > 1000) {
            this.updateMemory();
            this.lastMemoryUpdate = now;
        }
    }

    updateMemory() {
        if (performance.memory) {
            const usedMB = (performance.memory.usedJSHeapSize / (1024 * 1024)).toFixed(2);
            const totalMB = (performance.memory.jsHeapSizeLimit / (1024 * 1024)).toFixed(2);
            this.memElement.textContent = `MEM: ${usedMB}/${totalMB} MB`;
        } else {
            // Estimation alternative si performance.memory n'est pas disponible
            const memoryEstimate = (window.performance && window.performance.memory) ?
                'N/A' : (window.external && window.external.getMemoryUsage ?
                    (window.external.getMemoryUsage() / (1024 * 1024)).toFixed(2) + '/-- MB' :
                    'N/A (Chrome: --enable-precise-memory-info)');
            this.memElement.textContent = `MEM: ${memoryEstimate}`;
        }
    }
}

export { GameStats };