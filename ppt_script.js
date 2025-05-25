// PPT Viewer Script with Reveal.js Integration
// Elements
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');
const currentSlideEl = document.getElementById('currentSlide');
const totalSlidesEl = document.getElementById('totalSlides');
const prevButton = document.getElementById('prevSlide');
const nextButton = document.getElementById('nextSlide');
const resetButton = document.getElementById('resetProgress');
const jumpButton = document.getElementById('jumpToMax');
const zoomInButton = document.getElementById('zoomIn');
const zoomOutButton = document.getElementById('zoomOut');
const resetZoomButton = document.getElementById('resetZoom');

// PPT document and state variables
let pptFilename = ''; // Will be set from URL query param
let studentName = null; // Will be fetched from session
let currentSlide = 1;
let totalSlides = 0;
let maxProgressPercent = 0; // Max percentage viewed
let currentZoomLevel = 1.0; // Default zoom level
let slideImages = []; // Array to store slide image URLs
let slidesContent = []; // Array to store actual slide content
let revealInstance = null; // Reveal.js instance

// --- Helper Functions ---
function getQueryParam(name) {
    const url = new URL(window.location.href);
    return url.searchParams.get(name);
}

async function getStudentName() {
    if (studentName) return studentName;
    try {
        const res = await fetch('/api/get_session_info', { credentials: 'include' });
        if (res.ok) {
            const data = await res.json();
            if (data.success && data.name) {
                studentName = data.name;
                return studentName;
            }
        }
    } catch (error) {
        console.error("Error fetching session info:", error);
    }
    // Fallback if session fetch fails or no name
    studentName = prompt('Enter your name to track progress:');
    if (!studentName) {
        alert("Student name is required to view and track PPT progress.");
        throw new Error("Student name not provided.");
    }
    return studentName;
}

// --- Functions ---

function showInitialPptMessage(message = 'Loading presentation...') {
    const slidesContainer = document.getElementById('pptSlides');
    slidesContainer.innerHTML = `
        <section>
            <div style="text-align:center; padding:40px 20px;">
                <h3>${message}</h3>
            </div>
        </section>
    `;
    totalSlidesEl.textContent = '0';
    currentSlideEl.textContent = '0';
    progressBar.value = 0;
    progressText.textContent = '0.0';
    updateProgressTextColor(0);
}

async function loadPptAndProgress() {
    pptFilename = getQueryParam('ppt');
    if (!pptFilename) {
        showInitialPptMessage('No presentation specified in URL.');
        return;
    }

    try {
        await getStudentName(); // Ensures studentName is available
    } catch (e) {
        return; // Stop if student name couldn't be obtained
    }

    showInitialPptMessage(`Loading ${pptFilename}...`);

    try {
        // Fetch initial progress from backend
        const progressRes = await fetch(`/api/progress_ppt/${studentName}/${encodeURIComponent(pptFilename)}`, { credentials: 'include' });
        if (progressRes.ok) {
            const progressData = await progressRes.json();
            currentSlide = progressData.currentSlide || 1;
            maxProgressPercent = progressData.maxProgressPercent || 0;
        } else {
            console.warn("Could not load initial progress, starting from slide 1.");
            currentSlide = 1;
            maxProgressPercent = 0;
        }

        // Load PPT slides and initialize Reveal.js
        await loadPptSlides();
        await initializeRevealJS();

        if (currentSlide < 1 || currentSlide > totalSlides) {
            currentSlide = 1; // Reset to 1 if stored slide is invalid
        }

        // Navigate to the stored slide
        if (revealInstance) {
            revealInstance.slide(currentSlide - 1); // Reveal.js is 0-indexed
        }

        updateProgressAndSave(currentSlide);

    } catch (error) {
        console.error('Error loading PPT or its progress:', error);
        showInitialPptMessage(`Error loading ${pptFilename}. Please check console.`);
    }
}

async function loadPptSlides() {
    try {
        const response = await fetch(`/api/ppt_info/${encodeURIComponent(pptFilename)}`, { credentials: 'include' });
        
        if (response.ok) {
            const pptInfo = await response.json();
            
            if (pptInfo.success && pptInfo.slidesContent) {
                // Use actual PPT content
                totalSlides = pptInfo.totalSlides;
                slidesContent = pptInfo.slidesContent;
                
                console.log('Loaded real PPT content:', slidesContent);
                
                // Generate slides with actual content
                await generateSlidesHTML();
            } else {
                console.warn('PPT content extraction failed, using fallback');
                await generateFallbackSlides();
            }
        } else {
            console.warn('Failed to fetch PPT info, using fallback');
            await generateFallbackSlides();
        }
        
        totalSlidesEl.textContent = totalSlides;
        
    } catch (error) {
        console.error('Error loading PPT slide information:', error);
        await generateFallbackSlides();
    }
}

async function generateFallbackSlides() {
    // Fallback: assume 5 slides for demo
    totalSlides = 5;
    slidesContent = getSampleContent();
    totalSlidesEl.textContent = totalSlides;
    await generateSlidesHTML();
}

async function generateSlidesHTML() {
    const slidesContainer = document.getElementById('pptSlides');
    
    // Clear existing slides
    slidesContainer.innerHTML = '';
    
    // Generate slides from actual or fallback content
    for (let i = 0; i < totalSlides; i++) {
        const slide = slidesContent[i] || {
            title: `Slide ${i + 1}`,
            content: [`Content for slide ${i + 1}`],
            notes: ''
        };
        
        const slideElement = document.createElement('section');
        slideElement.setAttribute('data-slide-number', i + 1);
        
        let slideHTML = `
            <div class="slide-content">
                <h1 class="slide-title">${slide.title || `Slide ${i + 1}`}</h1>
        `;
        
        // Add slide content
        if (slide.content && slide.content.length > 0) {
            slideHTML += '<div class="slide-body">';
            
            // If content is an array, display as bullet points
            if (Array.isArray(slide.content)) {
                if (slide.content.length > 1) {
                    slideHTML += '<ul class="slide-list">';
                    slide.content.forEach(point => {
                        slideHTML += `<li class="slide-point">${point}</li>`;
                    });
                    slideHTML += '</ul>';
                } else {
                    // Single item, display as paragraph
                    slideHTML += `<p class="slide-text">${slide.content[0]}</p>`;
                }
            } else {
                // String content
                slideHTML += `<p class="slide-text">${slide.content}</p>`;
            }
            
            slideHTML += '</div>';
        }
        
        // Add notes if available (for instructor view)
        if (slide.notes && slide.notes.trim()) {
            slideHTML += `<div class="slide-notes" style="display: none;">
                <h4>Notes:</h4>
                <p>${slide.notes}</p>
            </div>`;
        }
        
        slideHTML += '</div>';
        slideElement.innerHTML = slideHTML;
        
        slidesContainer.appendChild(slideElement);
    }
    
    // Initialize or re-initialize Reveal.js
    if (typeof Reveal !== 'undefined') {
        Reveal.initialize({
            hash: true,
            controls: false, // We use custom controls
            progress: true,
            center: true,
            transition: 'slide',
            keyboard: true,
            embedded: true
        });
        
        // Add event listeners for slide changes
        Reveal.addEventListener('slidechanged', function(event) {
            updateSlideCounter(event.indexh + 1);
            updateProgress();
        });
        
        // Set initial slide if resuming
        if (currentSlide > 1) {
            Reveal.slide(currentSlide - 1, 0);
        }
    }
}

function getSampleContent() {
    return [
        {
            title: "Welcome to Training PRO",
            content: ["Your comprehensive learning management system"],
            notes: "Demo slide - replace with actual PPT content"
        },
        {
            title: "Features Overview", 
            content: ["Video lessons with progress tracking", "PDF document viewer", "DOCX document support", "PowerPoint presentations"],
            notes: "Demo slide - replace with actual PPT content"
        },
        {
            title: "Progress Tracking",
            content: ["Slide-by-slide progress", "Completion percentages", "Resume where you left off", "Performance analytics"],
            notes: "Demo slide - replace with actual PPT content"
        },
        {
            title: "Getting Started",
            content: ["Upload your content", "Organize by categories", "Set learning goals", "Start tracking progress"],
            notes: "Demo slide - replace with actual PPT content"
        },
        {
            title: "Support & Resources",
            content: ["24/7 support available", "Comprehensive documentation", "Video tutorials", "Community forums"],
            notes: "Demo slide - replace with actual PPT content"
        }
    ];}

async function initializeRevealJS() {
    try {
        // Initialize Reveal.js
        revealInstance = new Reveal({
            hash: false,
            controls: false, // We'll use our custom controls
            progress: false, // We'll use our custom progress bar
            center: true,
            transition: 'slide',
            transitionSpeed: 'default',
            backgroundTransition: 'fade',
            width: "100%",
            height: "100%",
            margin: 0.04,
            minScale: 0.2,
            maxScale: 2.0
        });

        await revealInstance.initialize();

        // Add event listeners for Reveal.js events
        revealInstance.on('slidechanged', event => {
            const slideNumber = event.indexh + 1; // Convert from 0-indexed to 1-indexed
            currentSlide = slideNumber;
            updateSlideInfo();
            updateProgressAndSave(slideNumber);
        });

        console.log('Reveal.js initialized successfully');
        
    } catch (error) {
        console.error('Error initializing Reveal.js:', error);
        throw error;
    }
}

function updateSlideInfo() {
    currentSlideEl.textContent = currentSlide;
    
    // Update button states
    prevButton.disabled = (currentSlide <= 1);
    nextButton.disabled = (currentSlide >= totalSlides);
    
    // Update zoom level display
    document.getElementById('zoomLevel').textContent = Math.round(currentZoomLevel * 100) + '%';
}

function updateProgressTextColor(percent) {
    progressText.classList.remove('progress-text-low', 'progress-text-medium', 'progress-text-high');
    if (percent < 33) {
        progressText.classList.add('progress-text-low');
    } else if (percent < 66) {
        progressText.classList.add('progress-text-medium');
    } else {
        progressText.classList.add('progress-text-high');
    }
}

async function updateProgressAndSave(slideNumber) {
    if (!studentName || !pptFilename || totalSlides === 0) return;
    
    const currentProgressPercent = (slideNumber / totalSlides) * 100;
    const newMaxProgress = Math.max(maxProgressPercent, currentProgressPercent);
    
    // Update display
    progressBar.value = newMaxProgress;
    progressText.textContent = newMaxProgress.toFixed(1);
    updateProgressTextColor(newMaxProgress);
    
    // Save to backend if this is new progress
    if (newMaxProgress > maxProgressPercent) {
        maxProgressPercent = newMaxProgress;
        try {
            const response = await fetch(`/api/progress_ppt/${studentName}/${encodeURIComponent(pptFilename)}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    currentSlide: slideNumber,
                    maxProgressPercent: maxProgressPercent
                })
            });
            
            if (!response.ok) {
                console.warn('Failed to save PPT progress to backend');
            }
        } catch (error) {
            console.error('Error saving PPT progress:', error);
        }
    }
}

// --- Event Listeners ---

prevButton.addEventListener('click', () => {
    if (revealInstance && currentSlide > 1) {
        revealInstance.prev();
    }
});

nextButton.addEventListener('click', () => {
    if (revealInstance && currentSlide < totalSlides) {
        revealInstance.next();
    }
});

resetButton.addEventListener('click', async () => {
    if (!confirm('Are you sure you want to reset your progress? This will take you back to slide 1.')) {
        return;
    }
    
    maxProgressPercent = 0;
    currentSlide = 1;
    
    try {
        const response = await fetch(`/api/progress_ppt/${studentName}/${encodeURIComponent(pptFilename)}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
                currentSlide: 1,
                maxProgressPercent: 0
            })
        });
        
        if (response.ok) {
            alert('Progress reset successfully!');
            if (revealInstance) {
                revealInstance.slide(0); // Go to first slide (0-indexed)
            }
        } else {
            alert('Failed to reset progress. Please try again.');
        }
    } catch (error) {
        console.error('Error resetting progress:', error);
        alert('Error resetting progress. Please try again.');
    }
});

jumpButton.addEventListener('click', () => {
    if (maxProgressPercent > 0 && revealInstance) {
        const maxSlide = Math.ceil((maxProgressPercent / 100) * totalSlides);
        revealInstance.slide(maxSlide - 1); // Convert to 0-indexed
    } else if (revealInstance) {
        revealInstance.slide(0); // Go to first slide
    }
});

// Zoom controls
zoomInButton.addEventListener('click', () => {
    if (revealInstance) {
        currentZoomLevel = Math.min(currentZoomLevel * 1.2, 3.0);
        revealInstance.configure({ 
            width: `${100 * currentZoomLevel}%`,
            height: `${100 * currentZoomLevel}%`
        });
        updateSlideInfo();
    }
});

zoomOutButton.addEventListener('click', () => {
    if (revealInstance) {
        currentZoomLevel = Math.max(currentZoomLevel / 1.2, 0.5);
        revealInstance.configure({ 
            width: `${100 * currentZoomLevel}%`,
            height: `${100 * currentZoomLevel}%`
        });
        updateSlideInfo();
    }
});

resetZoomButton.addEventListener('click', () => {
    if (revealInstance) {
        currentZoomLevel = 1.0;
        revealInstance.configure({ 
            width: "100%",
            height: "100%"
        });
        updateSlideInfo();
    }
});

// Keyboard navigation (Reveal.js handles this automatically, but we'll track it)
document.addEventListener('keydown', (e) => {
    if (!revealInstance) return;
    
    // Reveal.js will handle the navigation, we just need to track the current slide
    // The slidechanged event will be triggered automatically
});

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    loadPptAndProgress();
});

// Handle window resize
window.addEventListener('resize', () => {
    if (revealInstance) {
        revealInstance.sync();
    }
});
