diff --git a/app.js b/app.js
index 0c13a1497723a987537ac1eb01459a51dc491207..db0c35b07effee4a35af2fcc7f35ef951403de4c 100644
--- a/app.js
+++ b/app.js
@@ -1,76 +1,104 @@
 const $ = (id) => document.getElementById(id);
 
 const SUBJECT_FILES = {
   compsci: "data/subjects_compsci.json",
   engineering: "data/subjects_engineering.json",
   business: "data/subjects_business.json",
 };
 
+const SUBJECT_LABELS = {
+  compsci: "Computer Science",
+  engineering: "Engineering",
+  business: "Business",
+};
+
 let universitiesById = new Map();
 let currentCourses = [];
+let activeSubject = "compsci";
 
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
-  $("count").textContent = `${results.length.toLocaleString()} result(s)`;
+  $("count").textContent = `Showing ${results.length.toLocaleString()} courses matching your search`;
 
   const frag = document.createDocumentFragment();
 
   for (const r of results) {
     const uni = universitiesById.get(String(r.institution_id));
     const card = document.createElement("div");
     card.className = "card";
 
     const h3 = document.createElement("h3");
     h3.textContent = r.title;
 
     const p = document.createElement("p");
     p.textContent = uni ? uni.name : `Institution ID: ${r.institution_id}`;
 
+    const meta = document.createElement("div");
+    meta.className = "card-meta";
+    const metaLabel = document.createElement("span");
+    metaLabel.textContent = "Subject group";
+    const metaValue = document.createElement("strong");
+    metaValue.textContent = SUBJECT_LABELS[activeSubject] || "General";
+    meta.appendChild(metaLabel);
+    meta.appendChild(metaValue);
+
     card.appendChild(h3);
     card.appendChild(p);
+    card.appendChild(meta);
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
+  activeSubject = subjectKey;
   currentCourses = await loadJSON(SUBJECT_FILES[subjectKey]);
   search();
 }
 
 async function init() {
   const universities = await loadJSON("data/universities.json");
   universitiesById = new Map(universities.map(u => [String(u.id), u]));
 
   $("btn").addEventListener("click", search);
   $("q").addEventListener("keydown", (e) => { if (e.key === "Enter") search(); });
   $("subject").addEventListener("change", (e) => setSubject(e.target.value));
 
+  document.querySelectorAll(".chip").forEach((chip) => {
+    chip.addEventListener("click", () => {
+      document.querySelectorAll(".chip").forEach(btn => btn.classList.remove("is-active"));
+      chip.classList.add("is-active");
+      const subject = chip.dataset.subject;
+      $("subject").value = subject;
+      setSubject(subject);
+    });
+  });
+
   await setSubject($("subject").value);
 }
 
 init().catch(err => {
   console.error(err);
   $("results").innerHTML = `<div class="card"><h3>Error</h3><p>${err.message}</p></div>`;
 });
