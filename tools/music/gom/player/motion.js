// ---------------------- Motion ---------------------- //

export class Motion {
    constructor() {
        this.motionHandler = null;
        this.motionThreshold = 10; // Set your threshold here
        this.aboveThreshold = false;
        this.currentBgColor = '#000000';
    }

    getMotion(ws, playerID) {
        this.motionHandler = (event) => {
            const x = event.acceleration.x || 0;
            const y = event.acceleration.y || 0;
            const z = event.acceleration.z || 0;
            const intensity = Math.min(Math.sqrt(x*x + y*y + z*z), 30);
            const brightness = Math.floor((intensity / 30) * 100);

            // Check threshold crossing
            if (intensity > this.motionThreshold && !this.aboveThreshold) {
                this.currentBgColor = this.pickRandomColor();
                this.aboveThreshold = true;
            } else if (intensity <= this.motionThreshold && this.aboveThreshold) {
                this.currentBgColor = '#000000'; // Reset to black or any default
                this.aboveThreshold = false;
            }

            document.getElementById('dynamic-style').textContent =
                `body { background-color: ${this.currentBgColor}; }`;

            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ playerID, x, y, z }));
            }
        };

        // iOS requires permission, Android does not
        if (typeof DeviceMotionEvent !== "undefined" && typeof DeviceMotionEvent.requestPermission === "function") {
            DeviceMotionEvent.requestPermission().then(response => {
                if (response === 'granted') {
                    window.addEventListener('devicemotion', this.motionHandler);
                } else {
                    console.warn("DeviceMotion permission denied.");
                }
            }).catch(console.error);
        } else if (typeof DeviceMotionEvent !== "undefined") {
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

    pickRandomColor() {
        const colors = [
            '#8D7B68', '#5D6D7E', '#4B4453', '#3E5C59',
            '#5C5470', '#3C3C3C', '#2D3A3A', '#4E4E50'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }
}
