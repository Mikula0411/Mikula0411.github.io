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
let currentCourses = [];          
let activeSubject = "compsci"; // default subject 
let currentPage = 1;
const itemsPerPage = 21;

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

function render(results) {
  // Clear previous results
  const el = grab_id("results-grid"); 
  if (!el) return;
  el.innerHTML = ""; 
  
  //Count the number of subjects found
  const countEl = grab_id("results-count");
  if (countEl) {
    countEl.textContent = `Showing ${results.length.toLocaleString()} courses matching your search`;
  }

  const frag = document.createDocumentFragment();

  // Create a card for each subject
  for (const r of results) {
    const uni = universitiesById.get(String(r.university_id));  // Get university details
    const displayTitle = r.name || r.title || "Unknown Subject"; 
    const displayUni = uni ? uni.name : (r.university_name || 'University ID: ' + r.university_id);

    const card = document.createElement("div");
    card.className = "card p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all cursor-pointer group";

    // Set how the card looks
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

    // Add click event to open course website
    card.onclick = () => {
      const url = r.course_website || r.university_website;
      if (url) {
        window.open(url, '_blank'); // Open the course or university website
      } else {
        const query = encodeURIComponent(`${displayTitle} at ${displayUni} UK`);
        window.open(`https://www.google.com/search?q=${query}`, '_blank'); // Search the course if there is no course link inside the dataset
      }
    };

    frag.appendChild(card);
  }
  el.appendChild(frag); 
}

// Search function
function search() {
  const input = grab_id("search-input");
  const q = input ? normalize(input.value) : "";
  
  const filtered = q
    ? currentCourses.filter(c => {
        const courseName = normalize(c.name || c.title || "");
        const uniData = universitiesById.get(String(c.university_id));
        const uniName = uniData ? normalize(uniData.name) : "";
        return courseName.includes(q) || uniName.includes(q);
      })
    : currentCourses;

  currentPage = 1; // Reset to page 1 on new search
  paginateAndRender(filtered); 
}

// Chnage Subject Tag function
async function setSubject(subjectKey) {
  activeSubject = subjectKey;
  try {
    currentCourses = await loadJSON(SUBJECT_FILES[subjectKey]); // Load the subject data
    search(); // Refresh the search results
  } catch (e) {
    console.error("Subject load error:", e);
  }
}

function paginateAndRender(data) {
  const totalPages = Math.ceil(data.length / itemsPerPage);
  const start = (currentPage - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  const paginatedItems = data.slice(start, end);

  render(paginatedItems); // Show only the slice
  renderPaginationControls(data.length, totalPages);
}

function renderPaginationControls(totalItems, totalPages) {
  let container = grab_id("pagination-controls");
  
  // Create container if it doesn't exist
  if (!container) {
    container = document.createElement("div");
    container.id = "pagination-controls";
    container.className = "flex justify-center items-center gap-4 mt-8";
    grab_id("results-grid").after(container);
  }

  container.innerHTML = `
    <button onclick="changePage(-1)" ${currentPage === 1 ? 'disabled' : ''} 
      class="px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border disabled:opacity-30">Previous</button>
    <span class="font-bold text-sm">Page ${currentPage} of ${totalPages || 1}</span>
    <button onclick="changePage(1)" ${currentPage === totalPages || totalPages === 0 ? 'disabled' : ''} 
      class="px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border disabled:opacity-30">Next</button>
  `;
}

window.changePage = (step) => {
    currentPage += step;
    // We need to run search again but without resetting currentPage to 1
    // So let's slightly adjust the search logic to allow this
    const input = grab_id("search-input");
    const q = input ? normalize(input.value) : "";
    const filtered = currentCourses.filter(c => {
        const courseName = normalize(c.name || c.title || "");
        const uniData = universitiesById.get(String(c.university_id));
        const uniName = uniData ? normalize(uniData.name) : "";
        return courseName.includes(q) || uniName.includes(q);
    });
    
    paginateAndRender(filtered);
    window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll back up to see new results
};

// Theme toggle function
window.toggleTheme = () => {
    document.documentElement.classList.toggle('dark');
};

async function init() {
  try {
    const universities = await loadJSON("data/universities.json");
    universitiesById = new Map(universities.map(u => [String(u.id), u]));

    // Update the result when user typing in the search box
    grab_id("search-input").addEventListener("input", search);

    // build subject filter buttons
    const filters = grab_id("category-filters");
    if (filters) {
      filters.innerHTML = "";
      Object.keys(SUBJECT_LABELS).forEach(key => {
          const btn = document.createElement("button");
          // Make the active subject button styled differently
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

    await setSubject("compsci"); // default subject tag
    if (window.lucide) window.lucide.createIcons(); // to render icons if lucide is loaded
    
  } catch (err) {
    console.error("Critical Init Error:", err);
  }
}

init();