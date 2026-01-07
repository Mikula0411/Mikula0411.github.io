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
let filteredCourses = [];
let activeSubject = "compsci";
let currentPage = 1;
const resultsPerPage = 50; // Every page will have 50 results

async function loadJSON(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
  return res.json();
}

function normalize(s) {
  return (s || "").toLowerCase().trim();
}

function render() {
  const el = $("results-grid"); // Matches index.html ID
  if (!el) return;
  el.innerHTML = "";
  
  // Pagination logic
  const start = (currentPage - 1) * resultsPerPage;
  const end = start + resultsPerPage;
  const paginatedItems = filteredCourses.slice(start, end);

  const countEl = $("results-count"); // Matches index.html ID
  if (countEl) {
    countEl.textContent = `Showing ${start + 1}-${Math.min(end, filteredCourses.length)} of ${filteredCourses.length.toLocaleString()} courses`;
  }

  const frag = document.createDocumentFragment();

  for (const r of paginatedItems) {
    const uni = universitiesById.get(String(r.university_id)); // Changed to university_id to match JSON
    const card = document.createElement("div");
    card.className = "p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all";

    card.innerHTML = `
        <h3 class="text-lg font-bold text-slate-900 dark:text-white mb-2">${r.title}</h3>
        <p class="text-slate-500 dark:text-slate-400 text-sm mb-4">${uni ? uni.name : 'University ID: ' + r.university_id}</p>
        <div class="flex items-center gap-2">
            <span class="px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold uppercase">
                ${SUBJECT_LABELS[activeSubject]}
            </span>
        </div>
    `;
    frag.appendChild(card);
  }

  el.appendChild(frag);
  renderPaginationControls(filteredCourses.length);
}

function renderPaginationControls(totalResults) {
    const totalPages = Math.ceil(totalResults / resultsPerPage);
    let nav = $("pagination-nav");
    
    if (!nav) {
        nav = document.createElement("div");
        nav.id = "pagination-nav";
        nav.className = "col-span-full flex justify-center items-center gap-4 mt-8 pb-10";
        $("results-grid").after(nav);
    }

    nav.innerHTML = `
        <button onclick="changePage(-1)" ${currentPage === 1 ? 'disabled' : ''} class="px-6 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold disabled:opacity-30">Previous</button>
        <span class="text-sm font-bold">Page ${currentPage} of ${totalPages}</span>
        <button onclick="changePage(1)" ${currentPage === totalPages ? 'disabled' : ''} class="px-6 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold disabled:opacity-30">Next</button>
    `;
}

window.changePage = (dir) => {
    currentPage += dir;
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

function search() {
  const q = normalize($("search-input").value); // Matches index.html ID
  filteredCourses = q
    ? currentCourses.filter(c => normalize(c.title).includes(q))
    : currentCourses;
  
  currentPage = 1; // Reset to first page on search
  render();
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
  const universities = await loadJSON("data/universities.json");
  universitiesById = new Map(universities.map(u => [String(u.id), u]));
  
  // Fill stat counter in footer
  if($("stat-institutions")) $("stat-institutions").textContent = `${universities.length} Institutions`;

  $("search-input").addEventListener("input", search);

  // Dynamically inject chips into the filter bar
  const filters = $("category-filters");
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

  await setSubject("compsci");
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

init().catch(err => {
  console.error(err);
  const grid = $("results-grid");
  if (grid) grid.innerHTML = `<p class="text-red-500">Error: ${err.message}</p>`;
});
