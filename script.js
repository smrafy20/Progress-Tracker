const video = document.getElementById('myVideo');
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');

// Use a video identifier for API calls
const videoId = 'TP.mp4'; // Extracted from your original baseStorageKey logic
const API_BASE_URL = 'http://localhost:5000/api/progress'; // Backend API URL

// Load initial maxProgress from backend, default to 0
let maxProgress = 0; // Will be updated by loadProgress

// --- Functions ---

// Update the progress bar and text display
function updateProgressDisplay() {
    if (video.duration) {
        const currentPercentage = (video.currentTime / video.duration) * 100;

        // Update maxProgress only if currentProgress is greater
        if (currentPercentage > maxProgress) {
            maxProgress = currentPercentage;
            // Note: maxProgress is saved to backend on 'pause' or 'beforeunload'
        }

        // Update the progress bar and text based on the persistent maxProgress
        progressBar.value = maxProgress;
        progressText.textContent = maxProgress.toFixed(1); // Show one decimal place
    } else {
        // Reset if duration isn't available (e.g., before video loads)
        progressBar.value = 0;
        progressText.textContent = '0.0';
    }
}

// Save the current time and maxProgress to the backend
async function saveProgressToBackend() {
    if (video.currentTime > 0 && video.duration) {
        if (video.currentTime < video.duration) { // Only save if not at the very end
            try {
                const response = await fetch(`${API_BASE_URL}?videoId=${videoId}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        currentTime: video.currentTime,
                        maxProgress: maxProgress,
                    }),
                });
                if (response.ok) {
                    // console.log(`Saved time: ${video.currentTime}, Saved maxProgress: ${maxProgress} to backend.`);
                } else {
                    console.error('Failed to save progress to backend:', response.statusText);
                }
            } catch (error) {
                console.error('Error saving progress to backend:', error);
            }
        }
    }
}

// Load progress from the backend and set video time
async function loadProgressFromBackend() {
    try {
        const response = await fetch(`${API_BASE_URL}?videoId=${videoId}`);
        if (response.ok) {
            const data = await response.json();
            const savedTime = data.currentTime;
            const savedMaxProgress = data.maxProgress;

            maxProgress = parseFloat(savedMaxProgress) || 0;

            if (savedTime) {
                const time = parseFloat(savedTime);
                if (video.readyState >= 1) { // HAVE_METADATA or higher
                    video.currentTime = time;
                    // console.log(`Loaded time: ${time}, Loaded maxProgress: ${maxProgress} from backend.`);
                    updateProgressDisplay();
                } else {
                    video.addEventListener('loadedmetadata', () => {
                        video.currentTime = time;
                        // console.log(`Loaded time (after metadata): ${time}, Loaded maxProgress: ${maxProgress} from backend.`);
                        updateProgressDisplay();
                    }, { once: true });
                }
            } else {
                // console.log('No saved progress time found from backend.');
                updateProgressDisplay(); // Update display based on potentially loaded maxProgress
            }
        } else {
            console.error('Failed to load progress from backend:', response.statusText);
            updateProgressDisplay(); // Still update display with default maxProgress
        }
    } catch (error) {
        console.error('Error loading progress from backend:', error);
        updateProgressDisplay(); // Still update display with default maxProgress
    }
}

// Clear progress from the backend
async function clearProgressOnBackend() {
    try {
        const response = await fetch(`${API_BASE_URL}?videoId=${videoId}`, {
            method: 'DELETE',
        });
        if (response.ok) {
            // console.log('Progress cleared on backend.');
        } else {
            console.error('Failed to clear progress on backend:', response.statusText);
        }
    } catch (error) {
        console.error('Error clearing progress on backend:', error);
    }
}

// --- Event Listeners ---

// 1. Load progress when the page is ready
loadProgressFromBackend();

// 2. Update display whenever the time updates
video.addEventListener('timeupdate', updateProgressDisplay);

// 3. Save progress when the user pauses the video
video.addEventListener('pause', saveProgressToBackend);

// 4. Save progress when the user leaves the page (important!)
window.addEventListener('beforeunload', saveProgressToBackend);

// 5. Clear progress if the video finishes playing
video.addEventListener('ended', async () => {
    await clearProgressOnBackend();
    console.log('Video ended, progress cleared.');
    maxProgress = 100; // Set internal maxProgress state
    progressBar.value = 100;
    progressText.textContent = '100.0';
    // Or reset to 0 if you want it to restart next time
    // maxProgress = 0;
    // progressBar.value = 0;
    // progressText.textContent = '0.0';
});

// 6. Handle potential video loading errors
video.addEventListener('error', (e) => {
    console.error("Video Error:", e);
    alert("There was an error loading the video.");
    // Optionally, you might want to clear backend progress on critical video errors
    // clearProgressOnBackend();
});

// --- Add new interactive features ---

const resetButton = document.getElementById('resetProgress');
const jumpButton = document.getElementById('jumpToMax');

// Reset progress button
resetButton.addEventListener('click', async () => {
    if (confirm('Are you sure you want to reset your watch progress?')) {
        await clearProgressOnBackend();
        maxProgress = 0;
        video.currentTime = 0;
        updateProgressDisplay();
        alert('Progress has been reset!');
    }
});

// Jump to max progress button
jumpButton.addEventListener('click', () => {
    if (maxProgress > 0 && video.duration) { // Ensure video duration is available
        if (maxProgress < 100) { // Don't jump if already considered "complete" by maxProgress
            const timeToJump = (maxProgress / 100) * video.duration;
            video.currentTime = timeToJump;
            video.play();
        } else if (maxProgress >= 100) {
             alert('You have already watched the majority of the video or completed it.');
        }
    } else {
        alert('No saved progress to continue from, or video not loaded.');
    }
});

// Add visual feedback - change progress text color based on progress
video.addEventListener('timeupdate', () => {
    const currentProgressText = document.getElementById('progressText'); // Renamed to avoid conflict
    if (!video.duration) return; // Avoid division by zero if duration is not yet known
    const percentage = (video.currentTime / video.duration) * 100;
    
    if (percentage < 25) {
        currentProgressText.style.color = '#f44336';
    } else if (percentage < 50) {
        currentProgressText.style.color = '#ff9800';
    } else if (percentage < 75) {
        currentProgressText.style.color = '#2196f3';
    } else {
        currentProgressText.style.color = '#4caf50';
    }
});
