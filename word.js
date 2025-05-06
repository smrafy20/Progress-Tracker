document.getElementById("upload").addEventListener("change", handleFileUpload);
const contentContainer = document.getElementById("content-container");
const progressBar = document.getElementById("progress-bar");
const progressPercentage = document.getElementById("progress-percentage");

let pages = [];
let currentPage = 0;
let maxPageVisited = 0; // Track the furthest page visited

function handleFileUpload(event) {
  const file = event.target.files[0];
  if (file && file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    const reader = new FileReader();
    reader.onload = function (e) {
      const arrayBuffer = e.target.result;
      mammoth.extractRawText({ arrayBuffer: arrayBuffer })
        .then(displayContent)
        .catch(handleError);
    };
    reader.readAsArrayBuffer(file);
  } else {
    alert("Please upload a valid .docx file!");
  }
}

function displayContent(result) {
  const rawText = result.value;
  // Ask user for number of pages
  let userPages = prompt("How many pages does your document have?", "1");
  const totalPages = parseInt(userPages, 10);
  if (isNaN(totalPages) || totalPages < 1) {
    alert("Invalid number of pages.");
    return;
  }
  // Split text into totalPages chunks
  pages = splitTextIntoPages(rawText, totalPages);
  currentPage = 0;
  maxPageVisited = 0; // Reset on new upload
  showPage(currentPage);
  updateProgress();
  document.getElementById("prev-btn").disabled = true;
  document.getElementById("next-btn").disabled = pages.length <= 1;
}

function splitTextIntoPages(text, numPages) {
  const paragraphs = text.split("\n").filter((p) => p.trim() !== "");
  const perPage = Math.ceil(paragraphs.length / numPages);
  let result = [];
  for (let i = 0; i < paragraphs.length; i += perPage) {
    result.push(paragraphs.slice(i, i + perPage));
  }
  // If we have fewer chunks than numPages, pad with empty pages
  while (result.length < numPages) {
    result.push([]);
  }
  return result;
}

function showPage(pageIndex) {
  contentContainer.innerHTML = "";
  if (pages[pageIndex]) {
    pages[pageIndex].forEach((paragraph) => {
      const pElement = document.createElement("p");
      pElement.textContent = paragraph;
      contentContainer.appendChild(pElement);
    });
    // Update maxPageVisited if this page is further
    if (pageIndex > maxPageVisited) {
      maxPageVisited = pageIndex;
    }
    updateProgress();
  }
  document.getElementById("prev-btn").disabled = pageIndex === 0;
  document.getElementById("next-btn").disabled = pageIndex === pages.length - 1;
}

document.getElementById("prev-btn").addEventListener("click", () => {
  if (currentPage > 0) {
    currentPage--;
    showPage(currentPage);
  }
});

document.getElementById("next-btn").addEventListener("click", () => {
  if (currentPage < pages.length - 1) {
    currentPage++;
    showPage(currentPage);
  }
});

function updateProgress() {
  const total = pages.length;
  // Progress is based on maxPageVisited (0% at first page, 100% at last)
  let percentage = 0;
  if (total > 1) {
    percentage = Math.round((maxPageVisited / (total - 1)) * 100);
  }
  progressBar.value = percentage;
  progressPercentage.textContent = `${percentage}%`;
}

function handleError(err) {
  console.error("Error reading the file:", err);
  alert("An error occurred while processing the file.");
}