// ---------------------- Connection ---------------------- //

const ws = new WebSocket("wss://gate-of-music.onrender.com");

ws.onopen = () => {
    console.log("WebSocket connection established");
};
ws.onmessage = (event) => {
    console.log("Message received from server:", event.data);
};

// ---------------------- Configuration ---------------------- //

let selectedNote = null;

// Reset to initial menu on page load
window.addEventListener('load', () => {
    document.getElementById('tap-screen').style.display = 'none';
    document.getElementById('acc-screen').style.display = 'none';
    document.getElementById('menu').style.display = 'flex';
    selectedNote = null;
});

// Handle note selection
document.querySelectorAll('.menu button').forEach(button => {
    button.addEventListener('click', () => {
        selectedNote = button.getAttribute('data-note');
        console.log("Selected:", selectedNote);

        // Hide the menu and show the tap screen
        document.getElementById('menu').style.display = 'none';
        if (selectedNote === 'acc') {
            document.getElementById('acc-screen').style.display = 'flex';
            getAccel();
        }
        else {
            document.getElementById('tap-screen').style.display = 'flex';
            getTaps();
        }
    });
});

// ---------------------- Handle Interactions ---------------------- //

function getAccel(){
    if (typeof DeviceMotionEvent.requestPermission === 'function') {
        console.log("DeviceMotionEvent is supported. Requesting permission...");
        DeviceMotionEvent.requestPermission().then(response => {
            if (response == 'granted') {
                window.addEventListener('devicemotion', (event) => {
                    const x = event.acceleration.x || 0;
                    const y = event.acceleration.y || 0;
                    const z = event.acceleration.z || 0;
                    const intensity = Math.min(Math.sqrt(x*x + y*y + z*z), 30); // Clamp at 30

                    // Map intensity to brightness between 0 (black) and 100% (white)

                    const brightness = Math.floor((intensity / 30) * 100);
                    document.getElementById('dynamic-style').textContent =
                        `body { background-color: hsl(0, 100%, ${brightness / 2}%); }`;

                    if (ws.readyState === WebSocket.OPEN) {
                        ws.send(JSON.stringify({ x, y, z }));
                        console.log("Message sent:", { x, y, z });
                    } else {
                        console.warn("WebSocket not connected.");
                    }
                });

                window.addEventListener('deviceorientation',(event) => {
                    const alpha = event.alpha;
                    const beta = event.beta;
                    const gamma = event.gamma;

                    const box = document.getElementById('tilt-box');
                    if (box) {
                        const betaClamped = Math.max(-90, Math.min(90, beta));
                        const gammaClamped = Math.max(-90, Math.min(90, gamma));
                        box.style.transform = `translate(-50%, -50%) rotateX(${betaClamped}deg) rotateY(${gammaClamped}deg)`;
                    }

                    console.log(`Orientation: alpha=${alpha}, beta=${beta}, gamma=${gamma}`);
                    if (ws.readyState === WebSocket.OPEN) {
                        ws.send(JSON.stringify({ alpha, beta, gamma }));
                        console.log("Message sent:", { alpha, beta, gamma });
                    } else {
                        console.warn("WebSocket not connected.");
                    }
                });
            }
        });
    } else {
        console.log("DeviceMotionEvent is not supported.");
        location.reload();
    }
}

// Send the selected note when the user clicks anywhere
function getTaps() {
    let firstClick = true;

    document.body.addEventListener('click', (event) => {
        if (selectedNote && ws.readyState === WebSocket.OPEN && !firstClick) {
            ws.send(selectedNote);
            console.log("Message sent:", selectedNote);
            clickAnimation(event);
        } else if (firstClick) {
            firstClick = false;
        } else if (!selectedNote) {
            console.warn("No note selected yet.");
        } else {
            console.warn("WebSocket not connected.");
        }
    });
}

// ---------------------- Animations ---------------------- //

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