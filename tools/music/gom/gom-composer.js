const MODES = ['tapping', 'looping', 'motion', 'orientation-1D', 'orientation-2D', 'orientation-3D'];
const ID_OPTIONS = ['A','B','C','D','E','F','G','H'];
const PLAYER_BASES = {
    A: 10,
    B: 20,
    C: 30,
    D: 40,
    E: 50,
    F: 60,
    G: 70,
    H: 80
};

const server = "wss://gate-of-music-eu.onrender.com";

function clampMidi(val) {
    val = Number(val);
    return isNaN(val) ? 0 : Math.max(0, Math.min(127, val));
}

let players = [];
let currentMode = 'setup'; // 'setup' or 'control'

const modeToggle = document.getElementById('mode-toggle');
modeToggle.onclick = () => {
    currentMode = currentMode === 'setup' ? 'control' : 'setup';
    modeToggle.classList.toggle('control', currentMode === 'control');
    renderPlayers();
};

function renderPlayers() {
    const container = document.getElementById('players');
    container.innerHTML = '';

    // Show/hide setup-only controls
    document.getElementById('setup-controls').style.display = 
        currentMode === 'setup' ? 'block' : 'none';

    // Disable Add Player button if 8 players
    const addBtn = document.getElementById('add-player');
    addBtn.disabled = players.length >= 8;

    if (currentMode === 'setup') {
        players.forEach((player, idx) => {
            const div = document.createElement('div');
            const usedIds = players.filter((p, i) => i !== idx).map(p => p.id);

            const showMidi = ['tapping', 'looping'].includes(player.mode);
            const showCC = ['motion', 'orientation-2D', 'orientation-3D'].includes(player.mode);
            const showOrientation1D = player.mode === 'orientation-1D';

            const idSelect = `
                <select data-idx="${idx}" data-field="id">
                    ${ID_OPTIONS.map(id =>
                        `<option value="${id}"${player.id === id ? ' selected' : ''}${usedIds.includes(id) ? ' disabled' : ''}>${id}</option>`
                    ).join('')}
                </select>
            `;

            const base = PLAYER_BASES[player.id] || 11;

            div.innerHTML = `
                <label>ID: ${idSelect}</label>
                <label>Name: <input value="${player.name}" data-idx="${idx}" data-field="name" /></label>
                <label>Instrument: <input value="${player.instrument}" data-idx="${idx}" data-field="instrument" /></label>
                <label>Mode: 
                    <select data-idx="${idx}" data-field="mode">
                        ${MODES.map(m => `<option value="${m}"${player.mode === m ? ' selected' : ''}>${m}</option>`).join('')}
                    </select>
                </label>
                ${
                player.mode === 'looping'
                    ? `
                    <label>Start MIDI: <input type="number" min="0" max="127" value="${player.loopStartNote ?? base}" data-idx="${idx}" data-field="loopStartNote" /></label>
                    <label>Stop MIDI: <input type="number" min="0" max="127" value="${player.loopStopNote ?? (base + 1)}" data-idx="${idx}" data-field="loopStopNote" /></label>
                    `
                    : ['tapping'].includes(player.mode)
                    ? `<label>MIDI Value: <input type="number" min="0" max="127" value="${player.tappingNote ?? base}" data-idx="${idx}" data-field="tappingNote" /></label>`
                    : ''
                }
                ${
                player.mode === 'motion'
                    ? `<label>CC Value: <input type="number" min="0" max="127" value="${player.motionCC ?? base}" data-idx="${idx}" data-field="motionCC" /></label>`
                    : ''
                }
                ${
                player.mode === 'orientation-1D'
                    ? `
                    <label>Axis:
                        <select data-idx="${idx}" data-field="orientationAxis">
                        <option value="alpha"${player.orientationAxis === "alpha" ? " selected" : ""}>alpha</option>
                        <option value="beta"${player.orientationAxis === "beta" ? " selected" : ""}>beta</option>
                        <option value="gamma"${player.orientationAxis === "gamma" ? " selected" : ""}>gamma</option>
                        </select>
                    </label>
                    <label>CC Value: <input type="number" min="0" max="127" value="${player.orientationCC1 ?? base}" data-idx="${idx}" data-field="orientationCC1" /></label>
                    `
                    : ''
                }
                ${
                player.mode === 'orientation-2D'
                    ? `
                    <label>Axes:
                        <select data-idx="${idx}" data-field="orientationAxes2D">
                        <option value="alpha-beta"${player.orientationAxes2D === "alpha-beta" ? " selected" : ""}>alpha-beta</option>
                        <option value="alpha-gamma"${player.orientationAxes2D === "alpha-gamma" ? " selected" : ""}>alpha-gamma</option>
                        <option value="beta-gamma"${player.orientationAxes2D === "beta-gamma" ? " selected" : ""}>beta-gamma</option>
                        </select>
                    </label>
                    <label>CC1: <input type="number" min="0" max="127" value="${player.orientationCC1 ?? base}" data-idx="${idx}" data-field="orientationCC1" /></label>
                    <label>CC2: <input type="number" min="0" max="127" value="${player.orientationCC2 ?? (base + 1)}" data-idx="${idx}" data-field="orientationCC2" /></label>
                    `
                    : ''
                }
                ${
                player.mode === 'orientation-3D'
                    ? `
                    <label>CC1: <input type="number" min="0" max="127" value="${player.orientationCC1 ?? base}" data-idx="${idx}" data-field="orientationCC1" /></label>
                    <label>CC2: <input type="number" min="0" max="127" value="${player.orientationCC2 ?? (base + 1)}" data-idx="${idx}" data-field="orientationCC2" /></label>
                    <label>CC3: <input type="number" min="0" max="127" value="${player.orientationCC3 ?? (base + 2)}" data-idx="${idx}" data-field="orientationCC3" /></label>
                    `
                    : ''
                }
                <button data-idx="${idx}" class="remove-player">Remove</button>
            `;
            container.appendChild(div);
        });

        container.querySelectorAll('input,select').forEach(el => {
            el.oninput = (e) => {
                const idx = +el.dataset.idx;
                const field = el.dataset.field;
                let value = el.type === 'number' ? +el.value : el.value;
                // Clamp MIDI/CC values to 0-127
                if (
                    ['tappingNote', 'loopStartNote', 'loopStopNote', 'motionCC', 'orientationCC1', 'orientationCC2', 'orientationCC3'].includes(field)
                ) {
                    value = Math.max(0, Math.min(127, value));
                    el.value = value; // update UI if out of range
                }
                players[idx][field] = value;

                if (field === 'mode' || field === 'id') {
                    renderPlayers(); // Update UI if mode changes (for conditional fields)
                } else {
                    showProjectJson();
                }
            };
        });

        container.querySelectorAll('.remove-player').forEach(btn => {
            btn.onclick = () => {
                players.splice(+btn.dataset.idx, 1);
                renderPlayers();
                showProjectJson();
            };
        });

    } else if (currentMode === 'control') {
        // --- General Controls ---
        const generalControls = document.createElement('div');
        // Determine if all are muted for toggle
        const allMuted = players.length > 0 && players.every(p => p.muted);
        generalControls.innerHTML = `
            <button id="mute-toggle-all-btn" class="mute-all-btn">${allMuted ? "🔈 Unmute All" : "🔇 Mute All"}</button>
            <button id="unsolo-all-btn" class="unsolo-all-btn">🎵 Unsolo All</button>
            <button id="stop-all-btn" class="stop-all-btn">⏹️ Stop</button>
        `;
        container.appendChild(generalControls);

        // --- Player Controls ---
        players.forEach((player, idx) => {
            const div = document.createElement('div');
            let soloParamUI = "";
            if (player.mode === "orientation-2D") {
                soloParamUI = `
                    <label>Solo param:
                        <select data-idx="${idx}" data-field="orientationSolo" class="param-solo-select">
                            <option value="">None</option>
                            <option value="cc1"${player.orientationSolo === "cc1" ? " selected" : ""}>CC1 (${player.orientationCC1})</option>
                            <option value="cc2"${player.orientationSolo === "cc2" ? " selected" : ""}>CC2 (${player.orientationCC2})</option>
                        </select>
                    </label>
                `;
            } else if (player.mode === "orientation-3D") {
                soloParamUI = `
                    <label>Solo param:
                        <select data-idx="${idx}" data-field="orientationSolo" class="param-solo-select">
                            <option value="">None</option>
                            <option value="cc1"${player.orientationSolo === "cc1" ? " selected" : ""}>CC1 (${player.orientationCC1})</option>
                            <option value="cc2"${player.orientationSolo === "cc2" ? " selected" : ""}>CC2 (${player.orientationCC2})</option>
                            <option value="cc3"${player.orientationSolo === "cc3" ? " selected" : ""}>CC3 (${player.orientationCC3})</option>
                        </select>
                    </label>
                `;
            }
            div.innerHTML = `
                <strong>${player.name || player.id}</strong> (${player.instrument}) 
                <button class="mute-btn" data-player="${player.id}">
                    ${player.muted ? "🔈 Unmute" : "🔇 Mute"}
                </button>
                <button class="solo-btn" data-player="${player.id}">
                    ${player.solo ? "🎵 Unsolo" : "🎵 Solo"}
                </button>
                ${soloParamUI}
            `;
            container.appendChild(div);
        });

        // --- General Controls Logic ---
        document.getElementById('mute-toggle-all-btn').onclick = () => {
            const muteAll = !players.every(p => p.muted);
            players.forEach(p => p.muted = muteAll);
            // Notify server for each player
            players.forEach(p => {
                const ws = new WebSocket(server);
                ws.onopen = () => {
                    ws.send(JSON.stringify({ action: muteAll ? "mute" : "unmute", playerID: p.id }));
                    ws.close();
                };
            });
            renderPlayers();
        };
        document.getElementById('unsolo-all-btn').onclick = () => {
            players.forEach(p => p.solo = false);
            // Notify server for each player
            
            players.forEach(p => {
                const ws = new WebSocket(server);
                ws.onopen = () => {
                    ws.send(JSON.stringify({ action: "unsolo", playerID: p.id }));
                    ws.close();
                };
            });
            renderPlayers();
        };
        document.getElementById('stop-all-btn').onclick = () => {
            // Send a stop message to the server
            const ws = new WebSocket(server);
            ws.onopen = () => {
                ws.send(JSON.stringify({ action: "stop" }));
                ws.close();
            };
        };

        // --- Per-player Mute/Unmute ---
        container.querySelectorAll('.mute-btn').forEach(btn => {
            btn.onclick = () => {
                const playerID = btn.dataset.player;
                const player = players.find(p => p.id === playerID);
                player.muted = !player.muted;
                const ws = new WebSocket(server);
                ws.onopen = () => {
                    ws.send(JSON.stringify({ action: player.muted ? "mute" : "unmute", playerID }));
                    ws.close();
                };
                renderPlayers();
            };
        });

        // --- Per-player Solo/Unsolo ---
        container.querySelectorAll('.solo-btn').forEach(btn => {
            btn.onclick = () => {
                const playerID = btn.dataset.player;
                const player = players.find(p => p.id === playerID);
                player.solo = !player.solo;
                const ws = new WebSocket(server);
                ws.onopen = () => {
                    ws.send(JSON.stringify({ action: player.solo ? "solo" : "unsolo", playerID }));
                    ws.close();
                };
                renderPlayers();
            };
        });

        // --- Param Solo Logic ---
        container.querySelectorAll('.param-solo-select').forEach(sel => {
            sel.onchange = (e) => {
                const idx = +sel.dataset.idx;
                players[idx].orientationSolo = sel.value;
                // Send to server
                const ws = new WebSocket(server);
                ws.onopen = () => {
                    ws.send(JSON.stringify({
                        action: "paramSolo",
                        playerID: players[idx].id,
                        param: sel.value
                    }));
                    ws.close();
                };
                renderPlayers();
                showProjectJson();
            };
        });
    }

    showProjectJson();
}

function showProjectJson() {
    document.getElementById('project-json').textContent = JSON.stringify({
        projectName: document.getElementById('project-name-input')?.value || 'Untitled Project',
        bpm: 120,
        players: Object.fromEntries(players.map(p => [p.id, p]))
    }, null, 2);
}

document.getElementById('project-name-input').oninput = showProjectJson;

// Load project from server on page load
function loadProjectFromServer() {
    const ws = new WebSocket(server);
    ws.onopen = () => {
        ws.send(JSON.stringify({ action: "getProject" }));
    };
    ws.onmessage = (event) => {
        let dataStr = event.data;
        if (event.data instanceof Blob) {
            event.data.text().then(text => handleProjectResponse(text));
        } else {
            handleProjectResponse(dataStr);
        }
        ws.close();
    };
    ws.onerror = () => {
        document.getElementById('send-feedback').textContent = "Failed to load project from server.";
    };
}

function handleProjectResponse(dataStr) {
    try {
        const data = JSON.parse(dataStr);
        if (data.action === "projectInfo" && data.project && data.project.players) {
            players = Object.values(data.project.players).map(p => ({
                ...p,
                tappingNote: clampMidi(p.tappingNote),
                loopStartNote: clampMidi(p.loopStartNote),
                loopStopNote: clampMidi(p.loopStopNote),
                motionCC: clampMidi(p.motionCC),
                orientationCC1: clampMidi(p.orientationCC1),
                orientationCC2: clampMidi(p.orientationCC2),
                orientationCC3: clampMidi(p.orientationCC3)
            }));
            // Update project name input
            document.getElementById('project-name-input').value = data.project.projectName || 'Untitled Project';
            renderPlayers();
            showProjectJson();
        }
    } catch (e) {
        document.getElementById('send-feedback').textContent = "Error parsing project data.";
    }
}

// Add player
document.getElementById('add-player').onclick = () => {
    // Find first unused ID
    const usedIds = players.map(p => p.id);
    const nextId = ID_OPTIONS.find(id => !usedIds.includes(id)) || '';
    const base = PLAYER_BASES[nextId] || 10;

    players.push({
        id: nextId,
        name: '',
        instrument: '',
        mode: MODES[0],
        tappingNote: base,
        loopStartNote: base + 1,
        loopStopNote: base + 2,
        motionCC: base,
        orientationAxis: "alpha",
        orientationAxes2D: "alpha-beta",
        orientationCC1: base + 1,
        orientationCC2: base + 2,
        orientationCC3: base + 3,
        muted: false,
        solo: false,
        orientationSolo: "",
    });
    renderPlayers();
};

// Send to server
document.getElementById('send-project').onclick = () => {
    const feedback = document.getElementById('send-feedback');
    feedback.style.color = "#FFF";
    feedback.textContent = "Sending...";
    const ws = new WebSocket(server);
    ws.onopen = () => {
        ws.send(JSON.stringify({
            action: "updateProject",
            project: {
                projectName: document.getElementById('project-name-input').value,
                players: Object.fromEntries(players.map(p => [p.id, p])),
                bpm: 120
            }
        }));
        ws.close();
        feedback.textContent = "Project sent to server!";
        feedback.style.color = "#29cc47";
    };
    ws.onerror = () => {
        feedback.textContent = "Failed to send project.";
        feedback.style.color = "#b94429";
    };
};

// Initial load
loadProjectFromServer();

// Download JSON
document.getElementById('download-project').onclick = () => {
    const projectName = document.getElementById('project-name-input')?.value || 'project';
    const safeName = projectName.replace(/[^a-z0-9_\-]/gi, '_').toLowerCase();
    const json = JSON.stringify({
        projectName,
        players: Object.fromEntries(players.map(p => [p.id, p]))
    }, null, 2);
    const blob = new Blob([json], {type: "application/json"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gom-${safeName}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

// Upload JSON
document.getElementById('upload-project').onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
        try {
            const data = JSON.parse(evt.target.result);
            if (data.players) {
                players = Object.values(data.players).map(p => ({
                    ...p,
                    tappingNote: clampMidi(p.tappingNote),
                    loopStartNote: clampMidi(p.loopStartNote),
                    loopStopNote: clampMidi(p.loopStopNote),
                    motionCC: clampMidi(p.motionCC),
                    orientationCC1: clampMidi(p.orientationCC1),
                    orientationCC2: clampMidi(p.orientationCC2),
                    orientationCC3: clampMidi(p.orientationCC3)
                }));
                // Update project name input
                document.getElementById('project-name-input').value = data.projectName || 'Untitled Project';
                renderPlayers();
                document.getElementById('send-feedback').textContent = "Project loaded from file!";
                document.getElementById('send-feedback').style.color = "#29cc47";
                showProjectJson();
            } else {
                document.getElementById('send-feedback').textContent = "Invalid JSON: missing players.";
                document.getElementById('send-feedback').style.color = "#b94429";
            }
        } catch (err) {
            document.getElementById('send-feedback').textContent = "Invalid JSON file.";
            document.getElementById('send-feedback').style.color = "#b94429";
        }
        // Reset the input so the same file can be uploaded again
        e.target.value = "";
    };
    reader.readAsText(file);
};