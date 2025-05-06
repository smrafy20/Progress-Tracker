// PDF.js settings
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';

// Elements
const pdfViewer = document.getElementById('pdfViewer');
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');
const currentPageEl = document.getElementById('currentPage');
const totalPagesEl = document.getElementById('totalPages');
const prevButton = document.getElementById('prevPage');
const nextButton = document.getElementById('nextPage');
const resetButton = document.getElementById('resetProgress');
const jumpButton = document.getElementById('jumpToMax');
const fileInput = document.getElementById('pdfFile'); // Get the file input element

// PDF document
let pdfDoc = null;
let currentPage = 1;
let totalPages = 0;

// PDF file name - CHANGE THIS to match your PDF file name
let pdfName = 'bn.pdf'; // <- CHANGE THIS to your actual PDF file name

// Storage keys
let baseStorageKey = `pdfProgress_${pdfName}`;
let storageKeyPage = `${baseStorageKey}_page`;
let storageKeyMaxProgress = `${baseStorageKey}_maxProgress`;

// Load initial maxProgress from storage, default to 0
let maxProgress = parseFloat(localStorage.getItem(storageKeyMaxProgress)) || 0;

// --- Functions ---

// Load the PDF document
function loadPDF() {
    pdfViewer.innerHTML = `
        <div style="text-align:center; padding:40px 20px;">
            <h3>Select a PDF document to begin</h3>
            <p>Click the "Choose PDF File" button above to load a document</p>
        </div>
    `;
}

// Function to load a selected PDF file
async function loadSelectedPDF(url) {
    try {
        // Reset progress for new document
        currentPage = 1;
        maxProgress = 0;
        
        // Add a loading message
        pdfViewer.innerHTML = '<div style="text-align:center; padding:20px;">Loading PDF document...</div>';
        
        const loadingTask = pdfjsLib.getDocument(url);
        pdfDoc = await loadingTask.promise;
        
        totalPages = pdfDoc.numPages;
        totalPagesEl.textContent = totalPages;
        
        // Render the first page
        renderPage(currentPage);
        
        // Reset progress display
        progressBar.value = 0;
        progressText.textContent = '0.0';
    } catch (error) {
        console.error('Error loading selected PDF:', error);
        pdfViewer.innerHTML = `
            <div style="text-align:center; padding:20px; color:#f44336;">
                <h3>Error Loading PDF</h3>
                <p>There was a problem loading the selected file.</p>
                <p>Error details: ${error.message}</p>
            </div>
        `;
    }
}

// Render a specific page
async function renderPage(pageNumber) {
    try {
        const page = await pdfDoc.getPage(pageNumber);
        const viewport = page.getViewport({ scale: 1.5 });
        
        // Create canvas for the page
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        // Clear previous content
        pdfViewer.innerHTML = '';
        pdfViewer.appendChild(canvas);
        
        // Render PDF page
        const renderContext = {
            canvasContext: context,
            viewport: viewport
        };
        
        await page.render(renderContext).promise;
        
        // Update UI
        currentPageEl.textContent = pageNumber;
        updateProgress();
    } catch (error) {
        console.error('Error rendering page:', error);
    }
}

// Update the progress bar and text display
function updateProgress() {
    if (totalPages > 0) {
        // Calculate progress based on (currentPage - 1)
        // This means page 1 gives 0%, page 2 gives (1/totalPages)*100, etc.
        const progressBasedOnCompletedPages = ((currentPage - 1) / totalPages) * 100;
        
        // Update maxProgress only if current progress (based on completed pages) is greater
        if (progressBasedOnCompletedPages > maxProgress) {
            maxProgress = progressBasedOnCompletedPages;
            localStorage.setItem(storageKeyMaxProgress, maxProgress.toString());
        }
        
        // Update the progress bar and text based on persistent maxProgress
        // If maxProgress is 0 (e.g. on page 1 of a new PDF), it will show 0.0%
        progressBar.value = maxProgress;
        progressText.textContent = maxProgress.toFixed(1); // Show one decimal place
        
        // Change color based on progress
        updateProgressTextColor(maxProgress);
        
        // Save current page (still 1-indexed)
        localStorage.setItem(storageKeyPage, currentPage.toString());
    } else {
        // Ensure progress is 0 if there are no pages (e.g., PDF not loaded yet)
        progressBar.value = 0;
        progressText.textContent = '0.0';
        maxProgress = 0; // Reset maxProgress as well
        updateProgressTextColor(0); // Reset color
    }
}

// Update progress text color based on progress
function updateProgressTextColor(percentage) {
    if (percentage < 25) {
        progressText.style.color = '#f44336'; // Red for early progress
    } else if (percentage < 50) {
        progressText.style.color = '#ff9800'; // Orange for moderate progress
    } else if (percentage < 75) {
        progressText.style.color = '#2196f3'; // Blue for good progress
    } else {
        progressText.style.color = '#4caf50'; // Green for nearly complete
    }
}

// --- Event Listeners ---

// Navigate to previous page
prevButton.addEventListener('click', () => {
    if (currentPage > 1) {
        currentPage--;
        renderPage(currentPage);
    }
});

// Navigate to next page
nextButton.addEventListener('click', () => {
    if (currentPage < totalPages) {
        currentPage++;
        renderPage(currentPage);
    }
});

// Reset progress
resetButton.addEventListener('click', () => {
    if (confirm('Are you sure you want to reset your reading progress?')) {
        localStorage.removeItem(storageKeyPage);
        localStorage.removeItem(storageKeyMaxProgress);
        maxProgress = 0;
        currentPage = 1;
        renderPage(currentPage);
        updateProgress();
        alert('Progress has been reset!');
    }
});

// Jump to max progress
jumpButton.addEventListener('click', () => {
    if (!pdfDoc || totalPages === 0) {
        alert('Please load a PDF document first.');
        return;
    }

    // maxProgress is 0 for page 1, ((1/totalPages)*100) for page 2, etc.
    // It represents the percentage of pages *completed*.
    const completedPages = (maxProgress / 100) * totalPages;
    // The page to jump to is the one *after* the completed pages.
    let pageToJump = Math.floor(completedPages) + 1;

    // Ensure pageToJump is within valid bounds (1 to totalPages)
    pageToJump = Math.max(1, Math.min(pageToJump, totalPages));

    if (currentPage === pageToJump) {
        alert('You are already at your furthest read page.');
    } else {
        currentPage = pageToJump;
        renderPage(currentPage);
    }
});

// Listen for file selection
fileInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
        const fileURL = URL.createObjectURL(file);
        
        // Update the pdfName variable to use the filename for storage
        pdfName = file.name;
        
        // Update storage keys with new filename
        baseStorageKey = `pdfProgress_${pdfName}`;
        storageKeyPage = `${baseStorageKey}_page`;
        storageKeyMaxProgress = `${baseStorageKey}_maxProgress`;
        
        // Load the selected PDF
        loadSelectedPDF(fileURL);
    }
});

// Initialize PDF viewer
loadPDF();