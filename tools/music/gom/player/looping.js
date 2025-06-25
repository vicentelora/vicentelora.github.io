// ---------------------- Looping ---------------------- //

export class Looping {
    constructor() {
        this.handleClick = null;
        this.currentBgColor = '#000000';
        this.touchActive = false;
        this.topElement = document.getElementById('loop-top');
        this.bottomElement = document.getElementById('loop-bottom');
    }

    getTaps(ws, playerID) {
        this.handleClick = (event) => {
            if (window.isMuted) return;
            
            if (event.type === 'mousedown' && this.touchActive) return;
            if (event.type === 'touchstart') {
                this.touchActive = true;
                event.preventDefault();
            }
            if (event.type === 'touchend') {
                this.touchActive = false;
                return;
            }

            const y = event.clientY || (event.touches && event.touches[0].clientY);
            const screenHeight = window.innerHeight;

            if (y < screenHeight * 0.75) {
                this.playLoop(ws, playerID);
                this.flash(this.topElement);
            } else {
                this.stopLoop(ws, playerID);
                this.flash(this.bottomElement);
            }
        };

        document.body.addEventListener('mousedown', this.handleClick);
        document.body.addEventListener('touchstart', this.handleClick, { passive: false });
        document.body.addEventListener('touchend', this.handleClick);
    }

    playLoop(ws, playerID) {
        if (playerID && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ playerID, type: 'P' }));

            const newColor = this.pickRandomSoftColor();
            this.currentBgColor = newColor;
            this.topElement.classList.add('active');
            this.topElement.style.setProperty('--active-color', newColor);
        }
    }

    stopLoop(ws, playerID) {
        if (playerID && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ playerID, type: 'S' }));

            this.topElement.classList.remove('active');
            this.topElement.style.removeProperty('--active-color');
        }
    }

    flash(element) {
        element.classList.remove('tap-flash');
        // Force reflow to restart animation
        void element.offsetWidth;
        element.classList.add('tap-flash');
    }

    cleanup() {
        document.body.removeEventListener('mousedown', this.handleClick);
        document.body.removeEventListener('touchstart', this.handleClick);
        document.body.removeEventListener('touchend', this.handleClick);
    }

    pickRandomSoftColor() {
        const colors = [
            '#8D7B68', '#5D6D7E', '#4B4453', '#3E5C59',
            '#5C5470', '#3C3C3C', '#2D3A3A', '#4E4E50'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }
}
