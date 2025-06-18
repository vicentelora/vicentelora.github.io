// ---------------------- Orientation 3D ---------------------- //

export class Orientation3D {
    constructor() {
        this.orientationHandler = null;
    }

    getOrientation3D(ws, playerID) {
        this.orientationHandler = (event) => {
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

        if (typeof DeviceOrientationEvent !== "undefined" && typeof DeviceOrientationEvent.requestPermission === "function") {
            // iOS 13+ requires permission for device orientation
            DeviceOrientationEvent.requestPermission().then(response => {
                if (response === 'granted') {
                    window.addEventListener('deviceorientation', this.orientationHandler);
                } else {
                    console.warn("DeviceOrientation permission denied.");
                }
            }).catch(console.error);
        } else if (typeof DeviceOrientationEvent !== "undefined") {
            // Android and others
            window.addEventListener('deviceorientation', this.orientationHandler);
        } else {
            console.log("DeviceOrientationEvent is not supported.");
            location.reload();
        }
    }

    cleanup() {
        if (this.orientationHandler) {
            window.removeEventListener('deviceorientation', this.orientationHandler);
            this.orientationHandler = null;
        }
    }
}