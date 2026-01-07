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
    // Corrected to 'university_id' to match your JSON data
    const uni = universitiesById.get(String(r.university_id)); 
    
    const card = document.createElement("div");
    card.className = "p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm";

    const h3 = document.createElement("h3");
    h3.className = "text-lg font-bold mb-2";
    h3.textContent = r.title;

    const p = document.createElement("p");
    p.className = "text-slate-500 text-sm mb-4";
    p.textContent = uni ? uni.name : `University ID: ${r.university_id}`;

    const meta = document.createElement("div");
    meta.className = "text-xs font-bold uppercase text-indigo-600";
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
