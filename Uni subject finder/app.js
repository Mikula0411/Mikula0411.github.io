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
