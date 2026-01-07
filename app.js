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
  const el = $("results-grid"); // Matches index.html
  el.innerHTML = "";
  $("results-count").textContent = `Showing ${results.length.toLocaleString()} courses matching your search`;

  const frag = document.createDocumentFragment();

  for (const r of results) {
    const uni = universitiesById.get(String(r.university_id)); // Matches JSON field 'university_id'
    const card = document.createElement("div");
    card.className = "p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all";

    const h3 = document.createElement("h3");
    h3.className = "text-lg font-bold text-slate-900 dark:text-white mb-2";
    h3.textContent = r.title;

    const p = document.createElement("p");
    p.className = "text-slate-500 dark:text-slate-400 text-sm mb-4";
    p.textContent = uni ? uni.name : `University ID: ${r.university_id}`;

    const meta = document.createElement("div");
    meta.className = "flex items-center gap-2";
    const metaValue = document.createElement("span");
    metaValue.className = "px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold uppercase";
    metaValue.textContent = SUBJECT_LABELS[activeSubject] || "General";
    meta.appendChild(metaValue);

    card.appendChild(h3);
    card.appendChild(p);
    card.appendChild(meta);
    frag.appendChild(card);
  }

  el.appendChild(frag);
}

function search() {
  const q = normalize($("search-input").value); // Matches index.html
  const results = q
    ? currentCourses.filter(c => normalize(c.title).includes(q))
    : currentCourses.slice(0, 50); // Default limit

  render(results);
}

async function setSubject(subjectKey) {
  activeSubject = subjectKey;
  currentCourses = await loadJSON(SUBJECT_FILES[subjectKey]);
  search();
}

async function init() {
  // Load universities first to map names to IDs
  const universities = await loadJSON("data/universities.json");
  universitiesById = new Map(universities.map(u => [String(u.id), u]));

  // Listeners
  $("search-input").addEventListener("input", search); // Real-time search
  
  // Setup category filters manually if they aren't in HTML
  const filters = $("category-filters");
  Object.keys(SUBJECT_LABELS).forEach(key => {
    const btn = document.createElement("button");
    btn.className = "chip whitespace-nowrap px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-sm font-bold transition-all hover:bg-indigo-600 hover:text-white";
    btn.textContent = SUBJECT_LABELS[key];
    btn.onclick = () => {
        document.querySelectorAll('.chip').forEach(c => c.classList.remove('bg-indigo-600', 'text-white'));
        btn.classList.add('bg-indigo-600', 'text-white');
        setSubject(key);
    };
    filters.appendChild(btn);
  });

  await setSubject("compsci");
}

init().catch(err => {
  console.error(err);
  $("results-grid").innerHTML = `<p class="text-red-500 text-center col-span-full">${err.message}</p>`;
});
