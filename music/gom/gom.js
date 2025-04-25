const ws = new WebSocket("wss://gate-of-music.onrender.com");
ws.onopen = () => {
    console.log("WebSocket connection established");
};
ws.onmessage = (event) => {
    console.log("Message received from server:", event.data);
};
document.body.addEventListener('click', () => {
    console.log("Body clicked");
    clickAnimation(event);
    if (ws.readyState === WebSocket.OPEN) {
    ws.send("hi");
    console.log("Message sent: hi");
    } else {
    console.warn("WebSocket not connected");
    }
});

function clickAnimation(e) {
    const ripple = document.createElement('div');
    ripple.className = 'ripple';
    ripple.style.left = `${e.clientX}px`;
    ripple.style.top = `${e.clientY}px`;

    ripple.style.animationName = 'ripple-animation';

    document.body.appendChild(ripple);
    setTimeout(() => {
        ripple.remove();
    }, 1000);
}