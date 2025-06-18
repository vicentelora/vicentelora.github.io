import { Tapping } from './player/tapping.js';
import { Motion } from './player/motion.js';
import { Orientation2D } from './player/orientation-2D.js';
import { Orientation3D } from './player/orientation-3D.js';

// ---------------------- Connection ---------------------- //

const ws = new WebSocket("wss://gate-of-music.onrender.com");

ws.onopen = () => {
    console.log("WebSocket connection established");
};

// Global WebSocket
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
};

let pendingPlayerModeResolve = null;

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
        const wsProject = new WebSocket("wss://gate-of-music.onrender.com");
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

// ---------------------- Configuration ---------------------- //

let playerID = null;
let playerMode = null;

// Reset to initial menu on page load
window.addEventListener('load', () => {
    document.getElementById('tapping-screen').style.display = 'none';
    document.getElementById('motion-screen').style.display = 'none';
    document.getElementById('orientation-2D-screen').style.display = 'none';
    document.getElementById('orientation-3D-screen').style.display = 'none';
    document.getElementById('menu').style.display = 'flex';
    playerID = null;
    playerMode = null;
});

document.querySelectorAll('.menu button').forEach(button => {
    button.addEventListener('click', async () => {
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
            const tapping = new Tapping();
            tapping.getTaps(ws, playerID);

        } else if (playerMode === 'motion') {
            document.getElementById('motion-screen').style.display = 'flex';
            const motion = new Motion();
            motion.getMotion(ws, playerID);

        } else if (playerMode === 'orientation-2D') {
            document.getElementById('orientation-2D-screen').style.display = 'flex';
            const orientation2D = new Orientation2D();
            orientation2D.getOrientation2D(ws, playerID);

        } else if (playerMode === 'orientation-3D') {
            document.getElementById('orientation-3D-screen').style.display = 'flex';
            const orientation3D = new Orientation3D();
            orientation3D.getOrientation3D(ws, playerID);

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