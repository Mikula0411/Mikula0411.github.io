// Make a shortcut to get html Element
const grab_id = (id) => document.getElementById(id);

// File paths for subject data
const SUBJECT_FILES = {
  compsci: "data/subjects_compsci.json",
  engineering: "data/subjects_engineering.json",
  business: "data/subjects_business.json",
};

//Subject tag
const SUBJECT_LABELS = {
  compsci: "Computer Science",
  engineering: "Engineering",
  business: "Business",
};

// Global variables
let universitiesById = new Map(); 
let currentCourses = [];          // Full data for the active subject
let filteredCourses = [];         // Courses matching the search query
let activeSubject = "compsci";    // default subject 

// Pagination variables
let currentPage = 1;
const itemsPerPage = 12;

// load the data from the JSON files
async function loadJSON(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
  return res.json();
}

// Make the string lowercase and trim the spaces
function normalize(s) {
  return (s || "").toLowerCase().trim();
}

/**
 * PAGINATION LOGIC
 * Slices the filtered results and renders the controls
 */
function updateDisplay() {
  const totalPages = Math.ceil(filteredCourses.length / itemsPerPage);
  
  // Ensure current page is within bounds
  if (currentPage > totalPages && totalPages > 0) currentPage = totalPages;
  if (currentPage < 1) currentPage = 1;

  // Calculate the slice of data to show
  const start = (currentPage - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  const pageItems = filteredCourses.slice(start, end);

  render(pageItems);
  renderPaginationControls(totalPages);
}

function render(results) {
  const el = grab_id("results-grid"); 
  if (!el) return;
  el.innerHTML = ""; 
  
  const countEl = grab_id("results-count");
  if (countEl) {
    countEl.textContent = `Showing ${filteredCourses.length.toLocaleString()} courses matching your search`;
  }

  const frag = document.createDocumentFragment();

  for (const r of results) {
    const uni = universitiesById.get(String(r.university_id));
    const displayTitle = r.name || r.title || "Unknown Subject"; 
    const displayUni = uni ? uni.name : (r.university_name || 'University ID: ' + r.university_id);

    const card = document.createElement("div");
    card.className = "card p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all cursor-pointer group";

    card.innerHTML = `
        <h3 class="text-lg font-bold text-slate-900 dark:text-white mb-2 group-hover:text-indigo-600 transition-colors">
            ${displayTitle} 
        </h3>
        <p class="text-slate-500 dark:text-slate-400 text-sm mb-4">
            ${displayUni}
        </p>
        <div class="flex items-center justify-between">
            <span class="px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold uppercase">
                ${SUBJECT_LABELS[activeSubject] || "General"}
            </span>
            <span class="hidden group-hover:block text-xs font-bold text-indigo-600 underline italic">
                Visit Link →
            </span>
        </div>
    `;

    card.onclick = () => {
      const url = r.course_website || r.university_website;
      if (url) {
        window.open(url, '_blank');
      } else {
        const query = encodeURIComponent(`${displayTitle} at ${displayUni} UK`);
        window.open(`https://www.google.com/search?q=${query}`, '_blank');
      }
    };

    frag.appendChild(card);
  }
  el.appendChild(frag); 
}

/**
 * Creates the Next/Prev buttons at the bottom of the grid
 */
function renderPaginationControls(totalPages) {
  let container = grab_id("pagination-controls");
  
  if (!container) {
    container = document.createElement("div");
    container.id = "pagination-controls";
    grab_id("results-grid").after(container);
  }

  if (totalPages <= 1) {
    container.innerHTML = "";
    return;
  }

  container.className = "flex justify-center items-center gap-4 mt-12 mb-8";
  
  // Highlighting the fix: added hover:bg-indigo-50 and dark:hover:bg-indigo-900/20
  const btnClass = "px-6 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-sm font-bold transition-all duration-200 outline-none focus:border-indigo-500/75 active:border-indigo-500/75 disabled:opacity-20 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:border-indigo-200 dark:hover:border-indigo-800 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400";

  container.innerHTML = `
    <button onclick="changePage(-1)" ${currentPage === 1 ? 'disabled' : ''} 
      class="${btnClass}">
      Previous
    </button>
    <span class="text-sm font-bold text-slate-500">
      Page ${currentPage} of ${totalPages}
    </span>
    <button onclick="changePage(1)" ${currentPage === totalPages ? 'disabled' : ''} 
      class="${btnClass}">
      Next
    </button>
  `;
}

window.changePage = (offset) => {
  currentPage += offset;
  updateDisplay();
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

// Search function
function search() {
  const input = grab_id("search-input");
  const q = input ? normalize(input.value) : "";
  
  filteredCourses = q
    ? currentCourses.filter(c => {
        const courseName = normalize(c.name || c.title || "");
        const uniData = universitiesById.get(String(c.university_id));
        const uniName = uniData ? normalize(uniData.name) : "";
        return courseName.includes(q) || uniName.includes(q);
      })
    : currentCourses;

  currentPage = 1; // Reset to first page on new search
  updateDisplay();
}

// Change Subject Tag function
async function setSubject(subjectKey) {
  activeSubject = subjectKey;
  try {
    currentCourses = await loadJSON(SUBJECT_FILES[subjectKey]);
    search(); 
  } catch (e) {
    console.error("Subject load error:", e);
  }
}

// Theme toggle function
window.toggleTheme = () => {
    document.documentElement.classList.toggle('dark');
};

async function init() {
  try {
    const universities = await loadJSON("data/universities.json");
    universitiesById = new Map(universities.map(u => [String(u.id), u]));

    grab_id("search-input").addEventListener("input", search);

    const filters = grab_id("category-filters");
    if (filters) {
      filters.innerHTML = "";
      Object.keys(SUBJECT_LABELS).forEach(key => {
          const btn = document.createElement("button");
          btn.className = `chip whitespace-nowrap px-4 py-2 rounded-xl text-sm font-bold transition-all ${key === activeSubject ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`;
          btn.textContent = SUBJECT_LABELS[key];
          btn.onclick = () => {
              document.querySelectorAll('.chip').forEach(c => {
                  c.classList.remove('bg-indigo-600', 'text-white');
                  c.classList.add('bg-slate-100', 'dark:bg-slate-800', 'text-slate-600', 'dark:text-slate-400');
              });
              btn.classList.add('bg-indigo-600', 'text-white');
              btn.classList.remove('bg-slate-100', 'dark:bg-slate-800', 'text-slate-600', 'dark:text-slate-400');
              setSubject(key);
          };
          filters.appendChild(btn);
      });
    }

    await setSubject("compsci");
    if (window.lucide) window.lucide.createIcons();
    
  } catch (err) {
    console.error("Critical Init Error:", err);
  }
}

init();