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

function render(results) {
  const el = $("results-grid"); // Matches index.html ID
  if (!el) return;
  el.innerHTML = "";
  
  const countEl = $("results-count"); // Matches index.html ID
  if (countEl) {
    countEl.textContent = `Showing ${results.length.toLocaleString()} courses matching your search`;
  }

  const frag = document.createDocumentFragment();

  for (const r of results) {
    // Matches 'university_id' in your JSON files
    const uni = universitiesById.get(String(r.university_id)); 
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
}

function search() {
  const input = $("search-input"); // Matches index.html ID
  const q = normalize(input ? input.value : "");
  const results = q
    ? currentCourses.filter(c => normalize(c.title).includes(q))
    : currentCourses.slice(0, 500); // Default limit

  render(results);
}

async function setSubject(subjectKey) {
  activeSubject = subjectKey;
  currentCourses = await loadJSON(SUBJECT_FILES[subjectKey]);
  search();
}

// Simple Theme Toggle for index.html
window.toggleTheme = () => {
    document.documentElement.classList.toggle('dark');
};

async function init() {
  // Load universities first
  const universities = await loadJSON("data/universities.json");
  universitiesById = new Map(universities.map(u => [String(u.id), u]));
  
  // Update footer stats
  if($("stat-institutions")) $("stat-institutions").textContent = `${universities.length} Institutions`;

  // Search input listener
  const searchInput = $("search-input");
  if (searchInput) {
    searchInput.addEventListener("input", search);
  }

  // Inject category chips into the container
  const filters = $("category-filters");
  if (filters) {
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
}

init().catch(err => {
  console.error(err);
  const grid = $("results-grid");
  if (grid) grid.innerHTML = `<p class="text-red-500">Error: ${err.message}</p>`;
});
