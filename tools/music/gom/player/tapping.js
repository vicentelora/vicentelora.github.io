// ---------------------- Tapping ---------------------- //

export class Tapping {
    constructor() {
        this.firstClick = true;
        this.holdInterval = null;
        this.holdIntervalMs = 50;
        this.handleDown = null;
        this.handleUp = null;
    }

    getTaps(ws, playerID) {
        // Debounced handlers
        this.handleDown = (event) => {
            if (this.holdInterval) return; // Prevent multiple intervals
            // Send "A" (action on)
            if (playerID && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ playerID, type: 'A' }));
                this.clickAnimation(event);
            }
            // Start sending "H" (hold) repeatedly
            this.holdInterval = setInterval(() => {
                if (playerID && ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({ playerID, type: 'H' }));
                }
            }, this.holdIntervalMs);
        };

        this.handleUp = (event) => {
            if (this.holdInterval) {
                clearInterval(this.holdInterval);
                this.holdInterval = null;
            }
            // Send "L" (let go)
            if (playerID && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ playerID, type: 'L' }));
            }
        };

        document.body.addEventListener('mousedown', this.handleDown);
        document.body.addEventListener('mouseup', this.handleUp);
        document.body.addEventListener('touchstart', this.handleDown);
        document.body.addEventListener('touchend', this.handleUp);
    }

    // Call this to remove listeners and clear intervals
    cleanup() {
        document.body.removeEventListener('mousedown', this.handleDown);
        document.body.removeEventListener('mouseup', this.handleUp);
        document.body.removeEventListener('touchstart', this.handleDown);
        document.body.removeEventListener('touchend', this.handleUp);
        if (this.holdInterval) {
            clearInterval(this.holdInterval);
            this.holdInterval = null;
        }
    }

    pickRandomColor() {
        const colors = ['#FF5733', '#33FF57', '#3357FF', '#F1C40F', '#8E44AD'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    clickAnimation(e) {
        const ripple = document.createElement('div');
        ripple.className = 'ripple';
        ripple.style.left = `${e.pageX}px`;
        ripple.style.top = `${e.pageY}px`;
        ripple.style.backgroundColor = this.pickRandomColor();
        ripple.style.animationName = 'ripple-animation';
        document.body.appendChild(ripple);
        setTimeout(() => {
            ripple.remove();
        }, 1000);
    }
}