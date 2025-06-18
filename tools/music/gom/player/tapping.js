// ---------------------- Tapping ---------------------- //

export class Tapping {
    constructor() {
        this.firstClick = true;
        this.holdInterval = null;
        this.holdIntervalMs = 50;
        this.handleDown = null;
        this.handleUp = null;
        this.currentBgColor = '#000000';
        this.touchActive = false; // Add this flag
    }

    getTaps(ws, playerID) {
        this.handleDown = (event) => {
            // Prevent double firing on touch devices
            if (event.type === 'mousedown' && this.touchActive) return;
            if (event.type === 'touchstart') this.touchActive = true;

            if (this.holdInterval) return; // Prevent multiple intervals
            if (playerID && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ playerID, type: 'A' }));
                this.clickAnimation(event);
            }
            this.currentBgColor = this.pickRandomSoftColor();
            document.body.style.backgroundColor = this.currentBgColor;

            this.holdInterval = setInterval(() => {
                if (playerID && ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({ playerID, type: 'H' }));
                }
            }, this.holdIntervalMs);
        };

        this.handleUp = (event) => {
            if (event.type === 'touchend') this.touchActive = false;

            if (this.holdInterval) {
                clearInterval(this.holdInterval);
                this.holdInterval = null;
            }
            if (playerID && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ playerID, type: 'L' }));
            }
            document.body.style.backgroundColor = '#000000';
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

    pickRandomSoftColor() {
        const colors = [
            '#8D7B68', // muted brown
            '#5D6D7E', // muted blue-gray
            '#4B4453', // dark purple-gray
            '#3E5C59', // dark teal
            '#5C5470', // muted violet
            '#3C3C3C', // dark gray
            '#2D3A3A', // deep green-gray
            '#4E4E50'  // dark slate
        ];
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