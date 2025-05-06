# PDF Progress Tracker

A simple web-based PDF viewer that tracks your reading progress for individual PDF files.

## Features

*   **PDF Viewing**: Renders PDF documents in the browser.
*   **Progress Tracking**: Saves and displays your reading progress (percentage completed) for each PDF.
*   **Page Navigation**: Easily navigate between pages.
*   **Continue Reading**: Jump to the furthest page you've read in a document.
*   **Reset Progress**: Option to reset your reading progress for a document.
*   **Dynamic File Loading**: Choose PDF files from your local system.
*   **Progress Persistence**: Reading progress is stored in the browser's Local Storage, so it persists across sessions.
*   **Visual Progress Bar**: A visual indicator of your reading progress.
*   **Dynamic Progress Text Color**: The color of the progress percentage text changes based on how much you've read.

## How to Use

1.  **Open the HTML File**: Open the `pdf_tracker.html` file in your web browser.
2.  **Choose a PDF**: Click the "Choose PDF File" button to select a PDF document from your computer.
3.  **Read**: The PDF will be displayed. Use the "Previous" and "Next" buttons to navigate.
4.  **Track Progress**: Your progress is automatically saved as you navigate.
    *   The progress bar and percentage text will update to show how much of the document you've completed.
    *   "Completed" means you have navigated past that page. For example, being on page 1 means 0% completed. Reaching page 2 means the first page is completed.
5.  **Continue Reading**: If you revisit a PDF, click the "Continue Reading" button to jump to the furthest page you previously reached.
6.  **Reset Progress**: Click the "Reset Progress" button if you want to clear your saved progress for the current document.

## Dependencies

This project uses **PDF.js** by Mozilla to render PDF documents.

*   **PDF.js**: The library is included via a CDN link in the `pdf_tracker.html` file:
    *   `pdf.min.js`: `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js`
    *   `pdf.worker.min.js`: `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js`

No local installation of dependencies is required if you have an internet connection, as the library is fetched from a CDN.

## Files

*   `pdf_tracker.html`: The main HTML structure of the application.
*   `pdf_style.css`: Contains the CSS styles for the application.
*   `pdf_script.js`: Contains the JavaScript logic for PDF rendering, progress tracking, and user interactions.

## Setup

1.  Clone or download the project files (`pdf_tracker.html`, `pdf_style.css`, `pdf_script.js`) into a single folder on your computer.
2.  Open `pdf_tracker.html` in a modern web browser (e.g., Chrome, Firefox, Edge, Safari).

No build steps or local server are strictly necessary for basic functionality, as it's a client-side application. However, some browsers might have security restrictions when loading PDF worker scripts from local `file:///` URLs. If you encounter issues, serving the files through a simple local web server (e.g., using Python's `http.server` or a VS Code Live Server extension) is recommended.