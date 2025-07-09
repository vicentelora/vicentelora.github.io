import { Tapping } from './player/tapping.js';
import { Motion } from './player/motion.js';
import { Orientation1D } from './player/orientation-1D.js';
import { Orientation2D } from './player/orientation-2D.js';
import { Orientation3D } from './player/orientation-3D.js';
import { Looping } from './player/looping.js';

const server = "wss://gate-of-music-eu.onrender.com";
let isMuted = false;
let ws = null;
let wsHeartbeatInterval = null;
let reconnectTimeout = null;
let reconnectAttempts = 0;

let playerID = null;
let playerMode = null;
let currentModeInstance = null;

let pendingPlayerModeResolve = null;

function createWebSocket() {
    ws = new WebSocket(server);

    ws.onopen = () => {
        console.log("WebSocket connection established");
        reconnectAttempts = 0;
        // If playerID is set, re-join and restore state
        if (playerID) {
            ws.send(JSON.stringify({ playerID: playerID, action: 'join' }));
            restorePlayerMode();
        }
        // Start heartbeat
        wsHeartbeatInterval = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ playerID, action: "ping" }));
            }
        }, 25000);
    };

    ws.onclose = () => {
        clearInterval(wsHeartbeatInterval);
        console.log("WebSocket connection closed");
        attemptReconnect();
    };

    ws.onmessage = async (event) => {
        let dataStr;
        if (event.data instanceof Blob) {
            dataStr = await event.data.text();
        } else {
            dataStr = event.data;
        }
        console.log("Message received from server:", dataStr);
        const data = JSON.parse(dataStr);
        if (pendingPlayerModeResolve) {
            pendingPlayerModeResolve(data);
        }
        // Show/hide mute overlay if this player is muted/unmuted
        if ((data.action === "mute" || data.action === "unmute") && data.playerID === playerID) {
            setMutedOverlay(data.action === "mute");
        }
    };
}

function attemptReconnect() {
    if (reconnectTimeout) return;
    reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 10000); // Exponential backoff, max 10s
    console.log(`Attempting to reconnect in ${delay / 1000}s...`);
    reconnectTimeout = setTimeout(() => {
        reconnectTimeout = null;
        createWebSocket();
    }, delay);
}

function getPlayerMode(ws, playerID) {
    return new Promise((resolve) => {
        pendingPlayerModeResolve = (data) => {
            if (data.playerID === playerID && data.mode) {
                resolve(data.mode);
                pendingPlayerModeResolve = null;
            }
        };
    });
}

function getProjectInfo() {
    return new Promise((resolve, reject) => {
        const wsProject = new WebSocket(server);
        wsProject.onopen = () => {
            wsProject.send(JSON.stringify({ action: "getProject" }));
        };
        wsProject.onmessage = async (event) => {
            let dataStr;
            if (event.data instanceof Blob) {
                dataStr = await event.data.text();
            } else {
                dataStr = event.data;
            }
            try {
                const data = JSON.parse(dataStr);
                if (data.action === "projectInfo" && data.project && data.project.players) {
                    resolve(data.project.players);
                } else {
                    reject("Invalid project data");
                }
            } catch (e) {
                reject(e);
            }
            wsProject.close();
        };
        wsProject.onerror = reject;
    });
}

window.isMuted = isMuted;
function setMutedOverlay(visible) {
    const overlay = document.getElementById('mute-overlay');
    if (overlay) overlay.style.display = visible ? 'flex' : 'none';
    isMuted = visible;
    window.isMuted = isMuted;
}

// Reset to initial menu on page load
window.addEventListener('load', () => {
    document.getElementById('tapping-screen').style.display = 'none';
    document.getElementById('motion-screen').style.display = 'none';
    document.getElementById('orientation-1D-screen').style.display = 'none';
    document.getElementById('orientation-2D-screen').style.display = 'none';
    document.getElementById('orientation-3D-screen').style.display = 'none';
    document.getElementById('loop-screen').style.display = 'none';
    document.getElementById('menu').style.display = 'flex';
    playerID = null;
    playerMode = null;
    createWebSocket();
});

function clearModeInstances() {
    document.getElementById('tapping-screen').style.display = 'none';
    document.getElementById('motion-screen').style.display = 'none';
    document.getElementById('orientation-1D-screen').style.display = 'none';
    document.getElementById('orientation-2D-screen').style.display = 'none';
    document.getElementById('orientation-3D-screen').style.display = 'none';
    document.getElementById('loop-screen').style.display = 'none';
    document.getElementById('menu').style.display = 'none';
}

function restorePlayerMode() {
    if (!playerID) return;
    getPlayerMode(ws, playerID).then(mode => {
        playerMode = mode;
        clearModeInstances();
        
        if (playerMode === 'tapping') {
            document.getElementById('tapping-screen').style.display = 'flex';
            currentModeInstance = new Tapping();
            currentModeInstance.getTaps(ws, playerID);
        } else if (playerMode === 'looping') {
            document.getElementById('loop-screen').style.display = 'flex';
            currentModeInstance = new Looping();
            currentModeInstance.getTaps(ws, playerID);
        } else if (playerMode === 'motion') {
            document.getElementById('motion-screen').style.display = 'flex';
            currentModeInstance = new Motion();
            currentModeInstance.getMotion(ws, playerID);
        } else if (playerMode === 'orientation-1D') {
            document.getElementById('orientation-1D-screen').style.display = 'flex';
            currentModeInstance = new Orientation1D();
            currentModeInstance.getOrientation1D(ws, playerID);
        } else if (playerMode === 'orientation-2D') {
            document.getElementById('orientation-2D-screen').style.display = 'flex';
            currentModeInstance = new Orientation2D();
            currentModeInstance.getOrientation2D(ws, playerID);
        } else if (playerMode === 'orientation-3D') {
            document.getElementById('orientation-3D-screen').style.display = 'flex';
            currentModeInstance = new Orientation3D();
            currentModeInstance.getOrientation3D(ws, playerID);
        } else {
            document.getElementById('menu').style.display = 'flex';
            playerID = null;
            playerMode = null;
        }
        // Fetch and update player info in the header
        getProjectInfo().then(playersObj => {
            const playerInfo = playersObj[playerID];
            if (playerInfo) {
                document.querySelectorAll('.player-name').forEach(el => el.textContent = playerInfo.name || '');
                document.querySelectorAll('.instrument').forEach(el => el.textContent = playerInfo.instrument || '');
            } else {
                document.querySelectorAll('.player-name').forEach(el => el.textContent = '');
                document.querySelectorAll('.instrument').forEach(el => el.textContent = '');
            }
        }).catch(() => {
            document.querySelectorAll('.player-name').forEach(el => el.textContent = '');
            document.querySelectorAll('.instrument').forEach(el => el.textContent = '');
        });
    });
}

document.querySelectorAll('.menu button').forEach(button => {
    button.addEventListener('click', async () => {

        if (typeof DeviceOrientationEvent !== "undefined" && typeof DeviceOrientationEvent.requestPermission === "function") {
            try {
                const response = await DeviceOrientationEvent.requestPermission();
                if (response !== 'granted') {
                    alert("Permission for device orientation denied.");
                    return;
                }
            } catch (e) {
                alert("Device orientation permission error.");
                return;
            }
        }
        
        playerID = button.getAttribute('data-playerID');
        console.log("Player ID:", playerID);

        // Send player ID to the server
        ws.send(JSON.stringify({ playerID: playerID , action: 'join' }));
        console.log("Message sent to server:", { playerID: playerID });

        // Get the player mode based on player ID
        playerMode = await getPlayerMode(ws, playerID);

        // Hide the menu and show the tap screen immediately
        document.getElementById('menu').style.display = 'none';

        if (playerMode === 'tapping') {
            document.getElementById('tapping-screen').style.display = 'flex';
            currentModeInstance = new Tapping();
            currentModeInstance.getTaps(ws, playerID);

        } else if (playerMode === 'looping') {
            document.getElementById('loop-screen').style.display = 'flex';
            currentModeInstance = new Looping();
            currentModeInstance.getTaps(ws, playerID);

        } else if (playerMode === 'motion') {
            document.getElementById('motion-screen').style.display = 'flex';
            currentModeInstance = new Motion();
            currentModeInstance.getMotion(ws, playerID);
        
        } else if (playerMode === 'orientation-1D') {
            document.getElementById('orientation-1D-screen').style.display = 'flex';
            currentModeInstance = new Orientation1D();
            currentModeInstance.getOrientation1D(ws, playerID);

        } else if (playerMode === 'orientation-2D') {
            document.getElementById('orientation-2D-screen').style.display = 'flex';
            currentModeInstance = new Orientation2D();
            currentModeInstance.getOrientation2D(ws, playerID);

        } else if (playerMode === 'orientation-3D') {
            document.getElementById('orientation-3D-screen').style.display = 'flex';
            currentModeInstance = new Orientation3D();
            currentModeInstance.getOrientation3D(ws, playerID);

        } else {
            console.warn("Unknown player mode:", playerMode);
        }

        // Fetch and update player info in the header (async, after UI transition)
        getProjectInfo().then(playersObj => {
            const playerInfo = playersObj[playerID];
            if (playerInfo) {
                document.querySelectorAll('.player-name').forEach(el => el.textContent = playerInfo.name || '');
                document.querySelectorAll('.instrument').forEach(el => el.textContent = playerInfo.instrument || '');
            } else {
                document.querySelectorAll('.player-name').forEach(el => el.textContent = '');
                document.querySelectorAll('.instrument').forEach(el => el.textContent = '');
            }
        }).catch(() => {
            document.querySelectorAll('.player-name').forEach(el => el.textContent = '');
            document.querySelectorAll('.instrument').forEach(el => el.textContent = '');
        });
    });
});