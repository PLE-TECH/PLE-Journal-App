const journalEntries = [
  {
    title: "My First Entry",
    date: "2025-07-28",
    content: "Today I started building a personal journal app using JavaScript!"
  },
  {
    title: "Learning DOM Manipulation",
    date: "2025-07-29",
    content: "DOM manipulation is powerful! I learned how to create elements dynamically."
  },
  {
    title: "Reflections",
    date: "2025-07-30",
    content: "This project is helping me understand HTML, CSS, and JS better."
  }
];

// Render entries into the DOM [OPTIONAL]
const entriesContainer = document.getElementById("entriesContainer");

journalEntries.forEach(entry => {
  const entryDiv = document.createElement("div");
  entryDiv.classList.add("entry");

  entryDiv.innerHTML = `
    <h3>${entry.title}</h3>
    <small>${entry.date}</small>
    <p class="entry-content">${entry.content}</p>
    <button class="toggle-btn">Toggle Details</button>
  `;

  entriesContainer.appendChild(entryDiv);
});

// Add Toggle Details functionality [OPTIONAL]
document.addEventListener("click", function (e) {
  if (e.target.classList.contains("toggle-btn")) {
    const content = e.target.previousElementSibling;
    content.style.display = content.style.display === "none" ? "block" : "none";
  }
});