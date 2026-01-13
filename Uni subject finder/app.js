// Make a shortcut to get html Element
const grab_id = (id) => document.getElementById(id);

// File paths for subject data
const SUBJECT_FILES = {
  compsci: "data/subjects_compsci.json",
  engineering: "data/subjects_engineering.json",
  business: "data/subjects_business.json",
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