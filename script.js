const video = document.getElementById('myVideo');
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');

// Use unique keys for this specific video in Local Storage
const baseStorageKey = 'videoProgress_TP.mp4'; // Use a base name for the video
const storageKeyTime = `${baseStorageKey}_time`;
const storageKeyMaxProgress = `${baseStorageKey}_maxProgress`;

// Load initial maxProgress from storage, default to 0
let maxProgress = parseFloat(localStorage.getItem(storageKeyMaxProgress)) || 0;

// --- Functions ---

// Update the progress bar and text display
function updateProgressDisplay() {
    if (video.duration) {
        const currentPercentage = (video.currentTime / video.duration) * 100;

        // Update maxProgress only if currentProgress is greater
        if (currentPercentage > maxProgress) {
            maxProgress = currentPercentage;
            // Save the new maxProgress immediately when it increases
            localStorage.setItem(storageKeyMaxProgress, maxProgress);
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

// Save the current time to Local Storage
function saveProgress() {
    if (video.currentTime > 0 && video.duration) {
        // Only save if playback has started and is not at the very beginning/end
        if (video.currentTime < video.duration) {
             localStorage.setItem(storageKeyTime, video.currentTime);
             // Also save the latest maxProgress when pausing or leaving
             localStorage.setItem(storageKeyMaxProgress, maxProgress);
             // console.log(`Saved time: ${video.currentTime}, Saved maxProgress: ${maxProgress}`);
        } else {
             // If video ended, remove the saved progress (handled by 'ended' event)
             // localStorage.removeItem(storageKeyTime);
             // localStorage.removeItem(storageKeyMaxProgress);
             // console.log('Video finished, progress should be cleared by ended event.');
        }
    }
}

// Load progress from Local Storage and set video time
function loadProgress() {
    const savedTime = localStorage.getItem(storageKeyTime);
    const savedMaxProgress = localStorage.getItem(storageKeyMaxProgress); // Load saved max progress

    // Initialize maxProgress from storage if available
    if (savedMaxProgress) {
        maxProgress = parseFloat(savedMaxProgress);
    } else {
        maxProgress = 0; // Default if nothing is saved
    }

    if (savedTime) {
        const time = parseFloat(savedTime);
        // Check if video metadata is loaded. If not, wait for it.
        if (video.readyState >= 1) { // HAVE_METADATA or higher
            video.currentTime = time;
            console.log(`Loaded time: ${time}, Loaded maxProgress: ${maxProgress}`);
            updateProgressDisplay(); // Update display immediately using loaded maxProgress
        } else {
            // Wait for metadata to load before setting time
            video.addEventListener('loadedmetadata', () => {
                video.currentTime = time;
                console.log(`Loaded time (after metadata): ${time}, Loaded maxProgress: ${maxProgress}`);
                updateProgressDisplay(); // Update display immediately using loaded maxProgress
            }, { once: true }); // Run this listener only once
        }
    } else {
        console.log('No saved progress time found.');
        // Even if no time is saved, update display based on potentially loaded maxProgress
        updateProgressDisplay();
    }
}

// --- Event Listeners ---

// 1. Load progress when the page is ready
loadProgress(); // This now also loads and sets maxProgress

// 2. Update display whenever the time updates
video.addEventListener('timeupdate', updateProgressDisplay); // This updates maxProgress if needed

// 3. Save progress when the user pauses the video
video.addEventListener('pause', saveProgress);

// 4. Save progress when the user leaves the page (important!)
window.addEventListener('beforeunload', saveProgress);

// 5. Clear progress if the video finishes playing
video.addEventListener('ended', () => {
    localStorage.removeItem(storageKeyTime);
    localStorage.removeItem(storageKeyMaxProgress); // Clear max progress too
    console.log('Video ended, progress cleared.');
    maxProgress = 100; // Set internal maxProgress state
    // Update display to 100%
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
    // Potentially clear stored progress on error?
    // localStorage.removeItem(storageKeyTime);
    // localStorage.removeItem(storageKeyMaxProgress);
    alert("There was an error loading the video.");
});

// --- Add new interactive features ---

// Get the new buttons
const resetButton = document.getElementById('resetProgress');
const jumpButton = document.getElementById('jumpToMax');

// Reset progress button
resetButton.addEventListener('click', () => {
    if (confirm('Are you sure you want to reset your watch progress?')) {
        localStorage.removeItem(storageKeyTime);
        localStorage.removeItem(storageKeyMaxProgress);
        maxProgress = 0;
        video.currentTime = 0;
        updateProgressDisplay();
        alert('Progress has been reset!');
    }
});

// Jump to max progress button
jumpButton.addEventListener('click', () => {
    if (maxProgress > 0 && maxProgress < 100) {
        // Calculate time based on percentage
        const timeToJump = (maxProgress / 100) * video.duration;
        video.currentTime = timeToJump;
        video.play();
    } else {
        alert('No saved progress to continue from.');
    }
});

// Add visual feedback - change progress text color based on progress
video.addEventListener('timeupdate', () => {
    const progressText = document.getElementById('progressText');
    const percentage = (video.currentTime / video.duration) * 100;
    
    // Change color based on progress
    if (percentage < 25) {
        progressText.style.color = '#f44336'; // Red for early progress
    } else if (percentage < 50) {
        progressText.style.color = '#ff9800'; // Orange for moderate progress
    } else if (percentage < 75) {
        progressText.style.color = '#2196f3'; // Blue for good progress
    } else {
        progressText.style.color = '#4caf50'; // Green for nearly complete
    }
});
