const $ = (id) => document.getElementById(id);

const SUBJECT_FILES = {
  compsci: "data/subjects_compsci.json",
  engineering: "data/subjects_engineering.json",
  business: "data/subjects_business.json",
};

const SUBJECT_LABELS = {
  compsci: "Computer Science",
  engineering: "Engineering",
  business: "Business",
};

let universitiesById = new Map();
let currentCourses = [];
let activeSubject = "compsci";

async function loadJSON(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
  return res.json();
}

function normalize(s) {
  return (s || "").toLowerCase().trim();
}

let currentPage = 1;
const resultsPerPage = 50;
let filteredResults = []; // Store current search results globally

function render(results) {
  const el = $("results");
  el.innerHTML = "";
  
  // Calculate slice for current page
  const start = (currentPage - 1) * resultsPerPage;
  const end = start + resultsPerPage;
  const paginatedItems = results.slice(start, end);

  $("count").textContent = `Showing ${start + 1}-${Math.min(end, results.length)} of ${results.length.toLocaleString()} courses`;

  const frag = document.createDocumentFragment();
  for (const r of paginatedItems) {
    const uni = universitiesById.get(String(r.university_id)); 
    const card = document.createElement("div");
    card.className = "card"; // Matches your style.css

    card.innerHTML = `
      <h3>${r.title}</h3>
      <p>${uni ? uni.name : 'University ID: ' + r.university_id}</p>
      <div class="card-meta">${SUBJECT_LABELS[activeSubject] || "General"}</div>
    `;
    frag.appendChild(card);
  }
  el.appendChild(frag);
  renderPaginationControls(results.length);
}

function renderPaginationControls(totalResults) {
  const totalPages = Math.ceil(totalResults / resultsPerPage);
  let nav = $("pagination-nav");
  
  if (!nav) {
    nav = document.createElement("div");
    nav.id = "pagination-nav";
    nav.className = "flex justify-center gap-4 mt-8";
    $("results").after(nav);
  }

  nav.innerHTML = `
    <button onclick="changePage(-1)" ${currentPage === 1 ? 'disabled' : ''} class="chip">Previous</button>
    <span class="flex items-center font-bold">Page ${currentPage} of ${totalPages}</span>
    <button onclick="changePage(1)" ${currentPage === totalPages ? 'disabled' : ''} class="chip">Next</button>
  `;
}

window.changePage = (direction) => {
  currentPage += direction;
  render(filteredResults);
  window.scrollTo(0, 0); // Scroll to top when page changes
};

function search() {
  const q = normalize($("q").value);
  currentPage = 1; // Reset to page 1 on new search
  filteredResults = q
    ? currentCourses.filter(c => normalize(c.title).includes(q))
    : currentCourses;

  render(filteredResults);
}

async function setSubject(subjectKey) {
  activeSubject = subjectKey;
  currentCourses = await loadJSON(SUBJECT_FILES[subjectKey]);
  search();
}

window.toggleTheme = () => {
    document.documentElement.classList.toggle('dark');
};

async function init() {
  // Load university names
  const universities = await loadJSON("data/universities.json");
  universitiesById = new Map(universities.map(u => [String(u.id), u]));

  $("btn").addEventListener("click", search);
  $("q").addEventListener("input", search); // Real-time search

  // Link the buttons you added in HTML
  document.querySelectorAll(".chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      document.querySelectorAll(".chip").forEach(btn => btn.classList.remove("is-active"));
      chip.classList.add("is-active");
      const subject = chip.dataset.subject;
      $("subject").value = subject;
      setSubject(subject);
    });
  });

  await setSubject($("subject").value);
}

init().catch(err => {
  console.error(err);
  $("results").innerHTML = `<p class="text-red-500">Error: ${err.message}</p>`;
});
