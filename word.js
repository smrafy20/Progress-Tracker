document.getElementById("upload").addEventListener("change", handleFileUpload);
const contentContainer = document.getElementById("content-container");
const progressBar = document.getElementById("progress-bar");
const progressPercentage = document.getElementById("progress-percentage");

let maxScrollTop = 0;

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
  const paragraphs = rawText.split("\n").filter(p => p.trim() !== "");
  contentContainer.innerHTML = "";
  paragraphs.forEach(paragraph => {
    const p = document.createElement("p");
    p.textContent = paragraph;
    contentContainer.appendChild(p);
  });
  maxScrollTop = 0; // Reset on new document
  updateProgress();
}

contentContainer.addEventListener("scroll", updateProgress);

function updateProgress() {
  const scrollTop = contentContainer.scrollTop;
  const scrollHeight = contentContainer.scrollHeight - contentContainer.clientHeight;
  // Track the furthest scroll position
  if (scrollTop > maxScrollTop) {
    maxScrollTop = scrollTop;
  }
  let percentage = 0;
  if (scrollHeight > 0) {
    percentage = Math.round((maxScrollTop / scrollHeight) * 100);
  }
  progressBar.value = percentage;
  progressPercentage.textContent = `${percentage}%`;
}

function handleError(err) {
  console.error("Error reading the file:", err);
  alert("An error occurred while processing the file.");
}

// Disable navigation buttons for continuous scroll mode
document.getElementById("prev-btn").style.display = "none";
document.getElementById("next-btn").style.display = "none";