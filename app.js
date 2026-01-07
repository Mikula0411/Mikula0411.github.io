const $ = (id) => document.getElementById(id);

const SUBJECT_FILES = {
  compsci: "data/subjects_compsci.json",
  engineering: "data/subjects_engineering.json",
  business: "data/subjects_business.json",
};

let universitiesById = new Map();
let currentCourses = [];

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
  $("count").textContent = `${results.length.toLocaleString()} result(s)`;

  const frag = document.createDocumentFragment();

  for (const r of results) {
    const uni = universitiesById.get(String(r.institution_id));
    const card = document.createElement("div");
    card.className = "card";

    const h3 = document.createElement("h3");
    h3.textContent = r.title;

    const p = document.createElement("p");
    p.textContent = uni ? uni.name : `Institution ID: ${r.institution_id}`;

    card.appendChild(h3);
    card.appendChild(p);
    frag.appendChild(card);
  }

  el.appendChild(frag);
}

function search() {
  const q = normalize($("q").value);
  const results = q
    ? currentCourses.filter(c => normalize(c.title).includes(q))
    : currentCourses.slice(0, 200); // default: show first 200

  render(results);
}

async function setSubject(subjectKey) {
  currentCourses = await loadJSON(SUBJECT_FILES[subjectKey]);
  search();
}

async function init() {
  const universities = await loadJSON("data/universities.json");
  universitiesById = new Map(universities.map(u => [String(u.id), u]));

  $("btn").addEventListener("click", search);
  $("q").addEventListener("keydown", (e) => { if (e.key === "Enter") search(); });
  $("subject").addEventListener("change", (e) => setSubject(e.target.value));

  await setSubject($("subject").value);
}

init().catch(err => {
  console.error(err);
  $("results").innerHTML = `<div class="card"><h3>Error</h3><p>${err.message}</p></div>`;
});
