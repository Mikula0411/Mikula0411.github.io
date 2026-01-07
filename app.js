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
  const el = $("results");
  el.innerHTML = "";
  $("count").textContent = `Showing ${results.length.toLocaleString()} courses matching your search`;

  const frag = document.createDocumentFragment();

  for (const r of results) {
    // FIX: Changed 'institution_id' to 'university_id' to match JSON data
    const uni = universitiesById.get(String(r.university_id)); 
    
    const card = document.createElement("div");
    card.className = "p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all";

    const h3 = document.createElement("h3");
    h3.className = "text-lg font-bold text-slate-900 dark:text-white mb-2";
    h3.textContent = r.title;

    const p = document.createElement("p");
    p.className = "text-slate-500 dark:text-slate-400 text-sm mb-4";
    p.textContent = uni ? uni.name : `University ID: ${r.university_id}`;

    const meta = document.createElement("div");
    meta.className = "px-3 py-1 inline-block rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold uppercase";
    meta.textContent = SUBJECT_LABELS[activeSubject] || "General";

    card.appendChild(h3);
    card.appendChild(p);
    card.appendChild(meta);
    frag.appendChild(card);
  }

  el.appendChild(frag);
}

function search() {
  const q = normalize($("q").value);
  const results = q
    ? currentCourses.filter(c => normalize(c.title).includes(q))
    : currentCourses.slice(0, 50);

  render(results);
}

async function setSubject(subjectKey) {
  activeSubject = subjectKey;
  currentCourses = await loadJSON(SUBJECT_FILES[subjectKey]);
  search();
}

// Added theme toggle function
window.toggleTheme = () => {
    document.documentElement.classList.toggle('dark');
};

async function init() {
  const universities = await loadJSON("data/universities.json");
  universitiesById = new Map(universities.map(u => [String(u.id), u]));

  $("btn").addEventListener("click", search);
  $("q").addEventListener("keydown", (e) => { if (e.key === "Enter") search(); });
  $("subject").addEventListener("change", (e) => setSubject(e.target.value));

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
  $("results").innerHTML = `<div class="p-6 bg-red-50 text-red-600 rounded-2xl"><h3>Error</h3><p>${err.message}</p></div>`;
});
