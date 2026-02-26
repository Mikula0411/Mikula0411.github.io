const grab_id = (id) => document.getElementById(id);

const SUBJECT_FILES = {
  compsci: "data/temp/computing_courses.json",
  engineering: "data/temp/engineering_courses.json",
  business: "data/temp/business_courses.json",
  law: "data/temp/law_courses.json",
  other: "data/temp/other_courses.json",
};

const SUBJECT_LABELS = {
  compsci: "Computing",
  engineering: "Engineering",
  business: "Business",
  law: "Law",
  other: "Other Courses",
};

let universitiesById = new Map(); 
let currentCourses = [];          
let filteredCourses = [];         
let activeSubject = "compsci";    
let currentPage = 1;
const itemsPerPage = 12;

async function loadJSON(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
  return res.json();
}

function normalize(s) {
  return (s || "").toLowerCase().trim();
}

function search() {
  const input = grab_id("search-input");
  const query = input ? normalize(input.value) : "";
  const terms = query.split(/\s+/).filter(t => t.length > 0);
  
  filteredCourses = currentCourses.filter(c => {
    const uniData = universitiesById.get(String(c.PUBUKPRN));
    const courseTitle = normalize(c.TITLE || "");
    const uniName = uniData ? normalize(uniData.LEGAL_NAME) : "";
    const uniAddress = uniData ? normalize(uniData.PROVADDRESS) : "";

    return terms.every(term => 
      courseTitle.includes(term) || 
      uniName.includes(term) || 
      uniAddress.includes(term)
    );
  });

  currentPage = 1;
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
            <span class="text-xs font-bold text-slate-400 italic">
                View Details
            </span>
        </div>
    `;

    card.onclick = () => openModal(r, uni);
    frag.appendChild(card);
  }
  el.appendChild(frag); 
}

function openModal(course, uni) {
    const modal = grab_id("course-modal");
    const content = grab_id("modal-content");
    const displayUni = uni ? uni.LEGAL_NAME : 'University Code: ' + course.PUBUKPRN;
    
    // Foundation Logic: 1/2 show "Yes", 0 show "No"
    const foundationText = (course.FOUNDATION === "1" || course.FOUNDATION === "2") ? "Yes" : "No";

    // KISMODE Logic
    let studyMode = "Unknown";
    if (course.KISMODE === "1") studyMode = "Full-time";
    else if (course.KISMODE === "2") studyMode = "Part-time";
    else if (course.KISMODE === "3") studyMode = "Both";

    // 1. Logic to Find Similar Courses (Different Uni, same Course Title)
    const similar = currentCourses
        .filter(c => c.TITLE === course.TITLE && c.PUBUKPRN !== course.PUBUKPRN)
        .slice(0, 3); // Get top 3

    let similarHtml = "";
    if (similar.length > 0) {
        similarHtml = `
            <div class="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
                <h4 class="text-sm font-bold text-slate-900 dark:text-white mb-4 italic">Available at other universities:</h4>
                <div class="space-y-3">
                    ${similar.map((s, index) => {
                        // Look up the legal name for the alternative university
                        const otherUni = universitiesById.get(String(s.PUBUKPRN));
                        const otherUniName = otherUni ? otherUni.LEGAL_NAME : "Other University";
                        
                        return `
                        <div onclick="event.stopPropagation(); closeModal(); setTimeout(() => openModal(${JSON.stringify(s).replace(/"/g, '&quot;')}, universitiesById.get('${s.PUBUKPRN}')), 100)" 
                             class="flex items-center gap-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 cursor-pointer transition-all border border-transparent hover:border-indigo-200 group">
                            <span class="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                                ${index + 1}
                            </span>
                            <div class="flex-1">
                                <p class="text-sm font-bold text-slate-700 dark:text-slate-200 group-hover:text-indigo-600 transition-colors">
                                    ${otherUniName}
                                </p>
                            </div>
                            <i data-lucide="chevron-right" class="w-4 h-4 text-slate-300 group-hover:text-indigo-500"></i>
                        </div>`;
                    }).join('')}
                </div>
            </div>
        `;
    }

    content.innerHTML = `
        <div class="space-y-6">
            <div>
                <span class="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
                    ${SUBJECT_LABELS[activeSubject]}
                </span>
                <h2 id="modal-title" class="text-3xl font-extrabold text-slate-900 dark:text-white mt-2 leading-tight">
                    ${course.TITLE}
                </h2>
                <p class="text-lg text-slate-500 dark:text-slate-400 mt-2">${displayUni}</p>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div class="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 text-center">
                    <p class="text-xs text-slate-400 font-bold uppercase mb-1">Foundation Year</p>
                    <p class="text-slate-900 dark:text-white font-medium">${foundationText}</p>
                </div>
                <div class="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 text-center">
                    <p class="text-xs text-slate-400 font-bold uppercase mb-1">Study Mode</p>
                    <p class="text-slate-900 dark:text-white font-medium">${studyMode}</p>
                </div>
                <div class="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 text-center">
                    <p class="text-xs text-slate-400 font-bold uppercase mb-1">Course ID</p>
                    <p class="text-slate-900 dark:text-white font-medium">${course.KISCOURSEID || "N/A"}</p>
                </div>
                 <div class="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 text-center">
                    <p class="text-xs text-slate-400 font-bold uppercase mb-1">Provider Code (UKPRN)</p>
                    <p class="text-slate-900 dark:text-white font-medium">${course.PUBUKPRN}</p>
                </div>
            </div>

            <div class="pt-4 flex flex-col sm:flex-row gap-3">
                <button onclick="window.open('${course.ASSURL !== "#" ? course.ASSURL : `https://www.google.com/search?q=${encodeURIComponent(course.TITLE + ' at ' + displayUni)}`}', '_blank')" 
                    class="flex-1 px-6 py-4 rounded-2xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20">
                    Visit Official Course Website
                    <i data-lucide="external-link" class="w-4 h-4"></i>
                </button>
            </div>

            ${similarHtml}
        </div>
    `;

    modal.classList.remove("hidden");
    document.body.style.overflow = 'hidden';
    if (window.lucide) window.lucide.createIcons();
}

function closeModal() {
    grab_id("course-modal").classList.add("hidden");
    document.body.style.overflow = 'auto';
}

window.onkeydown = (e) => { if (e.key === "Escape") closeModal(); };

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
    const uniResponse = await loadJSON("data/temp/institution.json");
    const uniList = uniResponse[2].data;
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