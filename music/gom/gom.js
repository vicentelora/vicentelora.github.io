// Connection

const ws = new WebSocket("wss://gate-of-music.onrender.com");

ws.onopen = () => {
    console.log("WebSocket connection established");
};
ws.onmessage = (event) => {
    console.log("Message received from server:", event.data);
};

// Configuration

let selectedNote = null;

// Reset to initial menu on page load
window.addEventListener('load', () => {
    document.getElementById('menu').style.display = 'flex';
    document.getElementById('tap-screen').style.display = 'none';
    selectedNote = null;
});

// Handle note selection
document.querySelectorAll('.menu button').forEach(button => {
    button.addEventListener('click', () => {
        selectedNote = button.getAttribute('data-note');
        console.log("Selected note:", selectedNote);

        // Hide the menu and show the tap screen
        document.getElementById('menu').style.display = 'none';
        document.getElementById('tap-screen').style.display = 'flex';
    });
});

// Handle Interactions

function getAccel(){
    DeviceMotionEvent.requestPermission().then(response => {
        if (response == 'granted') {
            window.addEventListener('devicemotion', (event) => {
                const x = event.acceleration.x;
                const y = event.acceleration.y;
                const z = event.acceleration.z;
                console.log(`Acceleration: x=${x}, y=${y}, z=${z}`);
                if (ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({ x, y, z }));
                    console.log("Message sent:", { x, y, z });
                } else {
                    console.warn("WebSocket not connected.");
                }
            });
        }
    });
}

// Send the selected note when the user clicks anywhere
document.body.addEventListener('click', (event) => {
    if (selectedNote && ws.readyState === WebSocket.OPEN) {
        ws.send(selectedNote);
        console.log("Message sent:", selectedNote);
        clickAnimation(event);
    } else if (!selectedNote) {
        console.warn("No note selected yet.");
    } else {
        console.warn("WebSocket not connected.");
    }
});

// Animations

function pickRandomColor() {
    const colors = ['#FF5733', '#33FF57', '#3357FF', '#F1C40F', '#8E44AD'];
    return colors[Math.floor(Math.random() * colors.length)];
}

function clickAnimation(e) {
    const ripple = document.createElement('div');
    ripple.className = 'ripple';
    ripple.style.left = `${e.pageX}px`;
    ripple.style.top = `${e.pageY}px`;

    ripple.style.backgroundColor = pickRandomColor();

    ripple.style.animationName = 'ripple-animation';

    document.body.appendChild(ripple);
    setTimeout(() => {
        ripple.remove();
    }, 1000);
}