const gameBoard = document.getElementById("game-board");

const API_Url = "http://localhost:3000/api/v1/game-state";

let userSequence = [];
let currentSequence = [];

const getGameState = async () => {
    try {
        const response = await axios.get(API_Url);
        const gameState = response.data;
        document.getElementById('level-indicator').innerText = gameState.level;
        document.getElementById('high-score').innerText = gameState.highScore;
    } catch (error) {
        console.error("Error connecting to backend:", error);
    }
};

const disablePads = () => {
    document.querySelectorAll('.pad').forEach(pad => {
        pad.disabled = true;
    });
};

const enablePads = () => {
    document.querySelectorAll('.pad').forEach(pad => {
        pad.disabled = false;
    });
};

const displaySequence = async () => {
    try {
        const startButton = document.getElementById('start-btn');
        startButton.disabled = true;
        startButton.classList.add('hidden');
        disablePads();

        const response = await axios.get(API_Url);
        const sequence = response.data.sequence;
        currentSequence = sequence;
        userSequence = [];

        const waveform = getSelectedWaveform();

        sequence.forEach((color, i) => {
            const pad = document.getElementById(`pad-${color}`);
            if (pad) {
                setTimeout(() => {
                    pad.classList.add('active');
                    let note;
                    switch (color) {
                        case 'red':
                            note = 'C4';
                            break;
                        case 'yellow':
                            note = 'D4';
                            break;
                        case 'green':
                            note = 'E4';
                            break;
                        case 'blue':
                            note = 'F4';
                            break;
                    }
                    playTune(waveform, note);
                    setTimeout(() => pad.classList.remove('active'), 500);
                }, i * 1500);
            } else {
                console.error(`Pad with ID pad-${color} not found`);
            }
        });

        setTimeout(() => {
            enablePads();
        }, sequence.length * 1500);
    } catch (error) {
        console.error("Error displaying sequence:", error);
        document.getElementById('start-btn').disabled = false;
        document.getElementById('start-btn').classList.remove('hidden');
    }
};

const resetGameState = async () => {
    try {
        const response = await axios.put(API_Url, { level: 1, highScore: 0 });
        const gameState = response.data.gameState;
        document.getElementById('level-indicator').innerText = gameState.level;
        document.getElementById('high-score').innerText = gameState.highScore;
        const startButton = document.getElementById('start-btn');
        startButton.disabled = false;
        startButton.classList.remove('hidden');
        document.getElementById('failure-modal').style.display = 'none';
        disablePads();
    } catch (error) {
        console.error('Error resetting game state:', error);
    }
};

const startGame = async () => {
    await getGameState();
    await displaySequence();
    document.getElementById('replay-btn').disabled = false;
};

const userInput = async (color) => {
    const pad = document.getElementById(`pad-${color}`);
    if (pad.disabled) return;

    userSequence.push(color);
    pad.classList.add('active');
    setTimeout(() => pad.classList.remove('active'), 500);

    const waveform = getSelectedWaveform();
    let note;
    switch (color) {
        case 'red':
            note = 'C4';
            break;
        case 'yellow':
            note = 'D4';
            break;
        case 'green':
            note = 'E4';
            break;
        case 'blue':
            note = 'F4';
            break;
    }
    playTune(waveform, note);

    if (userSequence.length === currentSequence.length) {
        if (JSON.stringify(userSequence) === JSON.stringify(currentSequence)) {
            await axios.post(API_Url + '/sequence', { sequence: userSequence });
            setTimeout(async () => {
                await startGame();
            }, 1000);
        } else {
            document.getElementById('failure-modal').style.display = 'flex';
            document.getElementById('replay-btn').disabled = true;
        }
    }
};

const playTune = (waveform, note) => {
    const now = Tone.now();
    const gain = new Tone.Gain(0.1).toDestination(); // Adjust the gain value to control the volume
    const synth = new Tone.Synth({ oscillator: { type: waveform } }).connect(gain);
    synth.triggerAttackRelease(note, "8n", now);
}

const getSelectedWaveform = () => {
    const soundSelect = document.getElementById('sound-select');
    return soundSelect.value;
};

document.getElementById('start-btn').addEventListener('click', startGame);
document.getElementById('reset-btn').addEventListener('click', resetGameState);
document.getElementById('replay-btn').addEventListener('click', displaySequence);

document.getElementById('pad-red').addEventListener('click', () => userInput('red'));
document.getElementById('pad-yellow').addEventListener('click', () => userInput('yellow'));
document.getElementById('pad-green').addEventListener('click', () => userInput('green'));
document.getElementById('pad-blue').addEventListener('click', () => userInput('blue'));

document.addEventListener('keydown', (event) => {
    let color;
    switch (event.key.toUpperCase()) {
        case 'Q':
            color = 'red';
            break;
        case 'W':
            color = 'yellow';
            break;
        case 'A':
            color = 'green';
            break;
        case 'S':
            color = 'blue';
            break;
        default:
            return;
    }

    const pad = document.getElementById(`pad-${color}`);
    if (pad.disabled) return;

    userInput(color);
});

window.addEventListener('load', resetGameState);
