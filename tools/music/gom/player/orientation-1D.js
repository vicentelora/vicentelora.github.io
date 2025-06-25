export class Orientation1D {
    constructor() {
        this.orientationHandler = null;
        this.axis = "alpha"; // default, can be set externally
    }

    setAxis(axis) {
        this.axis = axis;
    }

    getOrientation1D(ws, playerID) {
        this.orientationHandler = (event) => {
            if (window.isMuted) return;
            
            const alpha = event.alpha;
            const beta = event.beta;
            const gamma = event.gamma;

            // Normalize the selected axis to [-90, 90] for beta/gamma, [0, 360] for alpha
            let value = 0;
            if (this.axis === "alpha") {
                value = ((alpha % 360) + 360) % 360; // [0,360)
                // Map [0,360] to [-180,180] for rotation
                value = value > 180 ? value - 360 : value;
            } else if (this.axis === "beta") {
                value = Math.max(-90, Math.min(90, beta));
            } else if (this.axis === "gamma") {
                value = Math.max(-90, Math.min(90, gamma));
            }

            // Map value to [-90, 90] for rotation
            let rotation = value;
            if (this.axis === "alpha") {
                // For alpha, limit rotation to [-90, 90] for visual clarity
                rotation = Math.max(-90, Math.min(90, value));
            }

            const arrow = document.getElementById('orientation-arrow');
            if (arrow) {
                arrow.style.transform = `rotate(${rotation}deg)`;
            }

            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ playerID, alpha, beta, gamma }));
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