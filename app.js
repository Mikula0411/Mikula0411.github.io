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
  // Matches index.html ID
  const el = $("results-grid"); 
  if (!el) return;
  el.innerHTML = "";
  
  // Matches index.html ID
  const countEl = $("results-count");
  if (countEl) {
    countEl.textContent = `Showing ${results.length.toLocaleString()} courses matching your search`;
  }

  const frag = document.createDocumentFragment();

  for (const r of results) {
    // FIX: Use 'university_id' (from JSON) instead of 'institution_id'
    const uni = universitiesById.get(String(r.university_id)); 
    
    const card = document.createElement("div");
    card.className = "p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all cursor-pointer group";

    // Correctly accessing the university name or showing ID if not found
    card.innerHTML = `
        <h3 class="text-lg font-bold text-slate-900 dark:text-white mb-2 group-hover:text-indigo-600 transition-colors">${r.title}</h3>
        <p class="text-slate-500 dark:text-slate-400 text-sm mb-4">${uni ? uni.name : 'University ID: ' + r.university_id}</p>
        <div class="flex items-center justify-between">
            <span class="px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold uppercase">
                ${SUBJECT_LABELS[activeSubject]}
            </span>
            <span class="hidden group-hover:block text-xs font-bold text-indigo-600 underline italic">View Subject Link →</span>
        </div>
    `;

    // Click feature
    card.onclick = () => {
      const query = encodeURIComponent(`${r.title} ${uni ? uni.name : ''} UK course 2026`);
      window.open(`https://www.google.com/search?q=${query}`, '_blank');
    };

    frag.appendChild(card);
  }
  el.appendChild(frag);
}

function search() {
  const input = $("search-input");
  const q = input ? normalize(input.value) : "";
  
  const results = q
    ? currentCourses.filter(c => normalize(c.title).includes(q))
    : currentCourses.slice(0, 500);

  render(results);
}

async function setSubject(subjectKey) {
  activeSubject = subjectKey;
  currentCourses = await loadJSON(SUBJECT_FILES[subjectKey]);
  search();
}

// Fixed theme toggle
window.toggleTheme = () => {
    document.documentElement.classList.toggle('dark');
};

async function init() {
  // 1. Load universities database first
  const universities = await loadJSON("data/universities.json");
  universitiesById = new Map(universities.map(u => [String(u.id), u]));
  
  if($("stat-institutions")) $("stat-institutions").textContent = `${universities.length} Institutions`;

  // 2. Setup search listener
  $("search-input").addEventListener("input", search);

  // 3. Inject category buttons
  const filters = $("category-filters");
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

  // 4. Initial load
  await setSubject("compsci");
}

init().catch(err => {
  console.error(err);
  const grid = $("results-grid");
  if (grid) grid.innerHTML = `<p class="p-6 text-red-500">Error: ${err.message}</p>`;
});
