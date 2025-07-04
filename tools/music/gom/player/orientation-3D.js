// ---------------------- Orientation 3D ---------------------- //

export class Orientation3D {
    constructor() {
        this.orientationHandler = null;
    }

    getOrientation3D(ws, playerID) {
        this.orientationHandler = (event) => {
            if (window.isMuted) return;
            
            const alpha = event.alpha;
            const beta = event.beta;
            const gamma = event.gamma;

            const box = document.getElementById('tilt-cube');
            if (box) {
                const betaClamped = Math.max(-90, Math.min(90, beta));
                const gammaClamped = Math.max(-90, Math.min(90, gamma));
                box.style.transform = `rotateX(${betaClamped}deg) rotateY(${gammaClamped}deg)`;
            }

            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ playerID, alpha, beta, gamma }));
                // console.log("Message sent:", { playerID, alpha, beta, gamma });
            }
        };

        window.addEventListener('deviceorientation', this.orientationHandler);
    }

    cleanup() {
        if (this.orientationHandler) {
            window.removeEventListener('deviceorientation', this.orientationHandler);
            this.orientationHandler = null;
        }
    }
}