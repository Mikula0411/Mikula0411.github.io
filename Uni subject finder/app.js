// Make a shortcut to get html Element
const grab_id = (id) => document.getElementById(id);

// Updated File paths for subject data inside the temp folder
const SUBJECT_FILES = {
  compsci: "data/temp/computing_courses.json",
  engineering: "data/temp/engineering_courses.json",
  business: "data/temp/business_courses.json",
  law: "data/temp/law_courses.json",
  other: "data/temp/other_courses.json",
};

// Updated Subject labels
const SUBJECT_LABELS = {
  compsci: "Computer Science",
  engineering: "Engineering",
  business: "Business",
  law: "Law",
  other: "Other Courses",
};

// Global variables
let universitiesById = new Map(); 
let currentCourses = [];          
let filteredCourses = [];         
let activeSubject = "compsci";    

// Pagination variables
let currentPage = 1;
const itemsPerPage = 12;

// Load the data from the JSON files
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
 * IMPROVED SEARCH LOGIC
 * Splits the query into words so "Bristol Cyber" matches 
 * a university in Bristol with a Cyber course.
 */
function search() {
  const input = grab_id("search-input");
  const query = input ? normalize(input.value) : "";
  
  // Split query into individual words (e.g., ["bristol", "cyber"])
  const terms = query.split(/\s+/).filter(t => t.length > 0);

  filteredCourses = currentCourses.filter(c => {
    const uniData = universitiesById.get(String(c.PUBUKPRN));
    const courseTitle = normalize(c.TITLE || "");
    const uniName = uniData ? normalize(uniData.LEGAL_NAME) : "";
    const uniAddress = uniData ? normalize(uniData.PROVADDRESS) : "";

    // Check if EVERY word in the search query matches SOMETHING in the course info
    return terms.every(term => 
      courseTitle.includes(term) || 
      uniName.includes(term) || 
      uniAddress.includes(term)
    );
  });

  currentPage = 1; // Reset to first page on new search
  updateDisplay();
}

function updateDisplay() {
  const totalPages = Math.ceil(filteredCourses.length / itemsPerPage);
  if (currentPage > totalPages && totalPages > 0) currentPage = totalPages;
  if (currentPage < 1) currentPage = 1;

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
    const uni = universitiesById.get(String(r.PUBUKPRN));
    const displayTitle = r.TITLE || "Unknown Subject"; 
    const displayUni = uni ? uni.LEGAL_NAME : 'University Code: ' + r.PUBUKPRN;

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
      const url = r.ASSURL;
      if (url && url !== "#") {
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

function renderPaginationControls(totalPages) {
  let container = grab_id("pagination-controls");
  if (!container) {
    container = document.createElement("div");
    container.id = "pagination-controls";
    const grid = grab_id("results-grid");
    if (grid) grid.after(container);
  }

  if (totalPages <= 1) {
    container.innerHTML = "";
    return;
  }

  container.className = "flex justify-center items-center gap-4 mt-12 mb-8";
  const baseChipClass = "whitespace-nowrap px-4 py-2 rounded-xl text-sm font-bold transition-all border-none outline-none";
  const inactiveClass = "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-indigo-600 hover:text-white";
  const disabledClass = "opacity-20 cursor-not-allowed";

  container.innerHTML = `
    <button onclick="changePage(-1)" ${currentPage === 1 ? 'disabled' : ''} 
      class="${baseChipClass} ${currentPage === 1 ? disabledClass : inactiveClass}">
      Previous
    </button>
    <span class="text-sm font-bold text-slate-500">Page ${currentPage} of ${totalPages}</span>
    <button onclick="changePage(1)" ${currentPage === totalPages ? 'disabled' : ''} 
      class="${baseChipClass} ${currentPage === totalPages ? disabledClass : inactiveClass}">
      Next
    </button>
  `;
}

window.changePage = (offset) => {
  currentPage += offset;
  updateDisplay();
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

async function setSubject(subjectKey) {
  activeSubject = subjectKey;
  try {
    currentCourses = await loadJSON(SUBJECT_FILES[subjectKey]);
    search(); 
  } catch (e) {
    console.error("Subject load error:", e);
  }
}

async function init() {
  try {
    // Load institution data from temp folder
    const uniResponse = await loadJSON("data/temp/institution.json");
    const uniList = uniResponse[2].data; // Access data from nested structure
    universitiesById = new Map(uniList.map(u => [String(u.PUBUKPRN), u]));

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