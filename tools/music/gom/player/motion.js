// ---------------------- Motion ---------------------- //

export class Motion {
    constructor() {
        this.motionHandler = null;
    }

    getMotion(ws, playerID) {
        this.motionHandler = (event) => {
            const x = event.acceleration.x || 0;
            const y = event.acceleration.y || 0;
            const z = event.acceleration.z || 0;
            const intensity = Math.min(Math.sqrt(x*x + y*y + z*z), 30);
            const brightness = Math.floor((intensity / 30) * 100);
            document.getElementById('dynamic-style').textContent =
                `body { background-color: hsl(0, 100%, ${brightness / 2}%); }`;

            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ playerID, x, y, z }));
                // console.log("Message sent:", { playerID, x, y, z });
            }
        };

        // iOS requires permission, Android does not
        if (typeof DeviceMotionEvent !== "undefined" && typeof DeviceMotionEvent.requestPermission === "function") {
            // iOS
            DeviceMotionEvent.requestPermission().then(response => {
                if (response === 'granted') {
                    window.addEventListener('devicemotion', this.motionHandler);
                } else {
                    console.warn("DeviceMotion permission denied.");
                }
            }).catch(console.error);
        } else if (typeof DeviceMotionEvent !== "undefined") {
            // Android and others
            window.addEventListener('devicemotion', this.motionHandler);
        } else {
            console.log("DeviceMotionEvent is not supported.");
            location.reload();
        }
    }

    cleanup() {
        if (this.motionHandler) {
            window.removeEventListener('devicemotion', this.motionHandler);
            this.motionHandler = null;
        }
    }
}