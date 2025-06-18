const MODES = ['tapping', 'motion', 'orientation-2D', 'orientation-3D'];
const ID_OPTIONS = ['A','B','C','D','E','F','G','H'];

let players = [];

function renderPlayers() {
    const container = document.getElementById('players');
    container.innerHTML = '';
    players.forEach((player, idx) => {
        // IDs already used by other players (except this one)
        const usedIds = players.filter((p, i) => i !== idx).map(p => p.id);

        const idSelect = `
            <select data-idx="${idx}" data-field="id">
                ${ID_OPTIONS.map(id =>
                    `<option value="${id}"${player.id === id ? ' selected' : ''}${usedIds.includes(id) ? ' disabled' : ''}>${id}</option>`
                ).join('')}
            </select>
        `;

        const div = document.createElement('div');
        div.style.margin = '1em 0';
        div.innerHTML = `
            <label>ID: ${idSelect}</label>
            <label>Name: <input value="${player.name}" data-idx="${idx}" data-field="name" /></label>
            <label>Instrument: <input value="${player.instrument}" data-idx="${idx}" data-field="instrument" /></label>
            <label>Mode: 
                <select data-idx="${idx}" data-field="mode">
                    ${MODES.map(m => `<option value="${m}"${player.mode === m ? ' selected' : ''}>${m}</option>`).join('')}
                </select>
            </label>
            <button data-idx="${idx}" class="remove-player">Remove</button>
        `;
        container.appendChild(div);
    });

    // Add listeners for input/select changes
    container.querySelectorAll('input,select').forEach(el => {
        el.oninput = (e) => {
            const idx = +el.dataset.idx;
            const field = el.dataset.field;
            players[idx][field] = el.value;
            if (field === 'id') {
                renderPlayers(); // Only re-render if ID changes (to update disabled options)
            } else {
                showProjectJson(); // For text fields, just update JSON
            }
        };
    });

    // Remove player
    container.querySelectorAll('.remove-player').forEach(btn => {
        btn.onclick = () => {
            players.splice(+btn.dataset.idx, 1);
            renderPlayers();
            showProjectJson();
        };
    });

    showProjectJson();
}

function showProjectJson() {
    document.getElementById('project-json').textContent = JSON.stringify({
        players: Object.fromEntries(players.map(p => [p.id, p]))
    }, null, 2);
}

// Load project from server on page load
function loadProjectFromServer() {
    const ws = new WebSocket("wss://gate-of-music.onrender.com");
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
            // Convert players object to array for editing
            players = Object.values(data.project.players);
            renderPlayers();
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
    players.push({ id: nextId, name: '', instrument: '', mode: MODES[0] });
    renderPlayers();
};

// Send to server
document.getElementById('send-project').onclick = () => {
    const feedback = document.getElementById('send-feedback');
    feedback.style.color = "#FFF";
    feedback.textContent = "Sending...";
    const ws = new WebSocket("wss://gate-of-music.onrender.com");
    ws.onopen = () => {
        ws.send(JSON.stringify({
            action: "updateProject",
            project: {
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
    const json = JSON.stringify({
        players: Object.fromEntries(players.map(p => [p.id, p]))
    }, null, 2);
    const blob = new Blob([json], {type: "application/json"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = "gom-project.json";
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
                players = Object.values(data.players);
                renderPlayers();
                document.getElementById('send-feedback').textContent = "Project loaded from file!";
                document.getElementById('send-feedback').style.color = "#29cc47";
            } else {
                document.getElementById('send-feedback').textContent = "Invalid JSON: missing players.";
                document.getElementById('send-feedback').style.color = "#b94429";
            }
        } catch (err) {
            document.getElementById('send-feedback').textContent = "Invalid JSON file.";
            document.getElementById('send-feedback').style.color = "#b94429";
        }
    };
    reader.readAsText(file);
};