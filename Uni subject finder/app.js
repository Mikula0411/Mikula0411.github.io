// Make a shortcut to get html Element
const grab_id = (id) => document.getElementById(id);

// File paths for subject data
const SUBJECT_FILES = {
  compsci: "Uni subject finder/data/subjects_compsci.json",
  engineering: "Uni subject finder/data/subjects_engineering.json",
  business: "Uni subject finder/data/subjects_business.json",
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
  const input = grab_id("search-input"); // Get the search input element
  const q = input ? normalize(input.value) : ""; // Make the user input into lowercase and trim spaces
  
  // Filter the courses based on the search query
  const results = q
    ? currentCourses.filter(c => {
        const courseName = normalize(c.name || c.title || "");
        const uniData = universitiesById.get(String(c.university_id));
        const uniName = uniData ? normalize(uniData.name) : "";
        return courseName.includes(q) || uniName.includes(q);
      })
    : currentCourses.slice(0, 500); 

  render(results); // Pass it to render function to show the results
}