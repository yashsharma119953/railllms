import { createContext, useContext, useState, ReactNode } from "react";

type Lang = "en" | "hi";

const translations = {
  // Common
  dashboard: { en: "Dashboard", hi: "डैशबोर्ड" },
  profile: { en: "Profile", hi: "प्रोफ़ाइल" },
  logout: { en: "Logout", hi: "लॉग आउट" },
  save: { en: "Save Changes", hi: "परिवर्तन सहेजें" },
  saving: { en: "Saving...", hi: "सहेज रहे हैं..." },
  loading: { en: "Loading...", hi: "लोड हो रहा है..." },
  search: { en: "Search", hi: "खोजें" },
  cancel: { en: "Cancel", hi: "रद्द करें" },
  submit: { en: "Submit", hi: "जमा करें" },
  create: { en: "Create", hi: "बनाएँ" },
  delete: { en: "Delete", hi: "हटाएँ" },
  active: { en: "Active", hi: "सक्रिय" },
  draft: { en: "Draft", hi: "ड्राफ्ट" },
  name: { en: "Name", hi: "नाम" },
  station: { en: "Station", hi: "स्टेशन" },
  location: { en: "Location", hi: "स्थान" },
  designation: { en: "Designation", hi: "पदनाम" },
  status: { en: "Status", hi: "स्थिति" },
  actions: { en: "Actions", hi: "कार्रवाई" },
  noData: { en: "No data available", hi: "कोई डेटा उपलब्ध नहीं" },
  password: { en: "Password", hi: "पासवर्ड" },
  email: { en: "Email", hi: "ईमेल" },
  switchRole: { en: "Switch Role (Demo)", hi: "भूमिका बदलें (डेमो)" },
  prayagrajDiv: { en: "Prayagraj Division", hi: "प्रयागराज मंडल" },
  railwayLms: { en: "Railway LMS", hi: "रेलवे LMS" },
  copyright: { en: "© 2026 Indian Railways • Prayagraj Division", hi: "© 2026 भारतीय रेलवे • प्रयागराज मंडल" },

  // Roles
  roleSrDOM: { en: "Sr. DOM", hi: "वरि. मंडल परिचालन प्रबंधक" },
  roleTI: { en: "TI", hi: "परिवहन निरीक्षक" },
  roleEmployee: { en: "Employee", hi: "कर्मचारी" },
  roleSuperAdmin: { en: "Super Admin (Sr. DOM)", hi: "सुपर एडमिन (वरि. मंडल प्रबंधक)" },
  roleAdmin: { en: "Admin (TI)", hi: "एडमिन (परिवहन निरीक्षक)" },

  // Sidebar Nav
  navDashboard: { en: "Dashboard", hi: "डैशबोर्ड" },
  navAdminMgmt: { en: "Admin Management", hi: "एडमिन प्रबंधन" },
  navContentUpload: { en: "Content Upload", hi: "सामग्री अपलोड" },
  navExamMgmt: { en: "Exam Management", hi: "परीक्षा प्रबंधन" },
  navScheduling: { en: "Scheduling", hi: "शेड्यूलिंग" },
  navReports: { en: "Reports & Analytics", hi: "रिपोर्ट एवं विश्लेषण" },
  navAllUsers: { en: "All Users", hi: "सभी उपयोगकर्ता" },
  navProfile: { en: "Profile", hi: "प्रोफ़ाइल" },
  navUserMgmt: { en: "User Management", hi: "उपयोगकर्ता प्रबंधन" },
  navAssignContent: { en: "Assign Content", hi: "सामग्री आवंटित करें" },
  navViewResults: { en: "View Results", hi: "परिणाम देखें" },
  navLearning: { en: "Learning", hi: "अध्ययन" },
  navExams: { en: "Exams", hi: "परीक्षाएँ" },

  // Login
  loginTitle: { en: "Railway LMS", hi: "रेलवे LMS" },
  loginSubtitle: { en: "Prayagraj Division • Learning Management System", hi: "प्रयागराज मंडल • शिक्षण प्रबंधन प्रणाली" },
  secureLogin: { en: "Secure Login Portal", hi: "सुरक्षित लॉगिन पोर्टल" },
  fullName: { en: "Full Name", hi: "पूरा नाम" },
  emailCug: { en: "Email / CUG Email", hi: "ईमेल / CUG ईमेल" },
  enterPassword: { en: "Enter your password", hi: "अपना पासवर्ड दर्ज करें" },
  signIn: { en: "Sign In", hi: "साइन इन करें" },
  signUp: { en: "Sign Up", hi: "साइन अप करें" },
  createAccount: { en: "Create Account", hi: "खाता बनाएँ" },
  pleaseWait: { en: "Please wait...", hi: "कृपया प्रतीक्षा करें..." },
  alreadyAccount: { en: "Already have an account? Sign In", hi: "पहले से खाता है? साइन इन करें" },
  noAccount: { en: "Don't have an account? Sign Up", hi: "खाता नहीं है? साइन अप करें" },

  // Super Admin Dashboard
  commandCenter: { en: "Command Center", hi: "कमांड सेंटर" },
  commandCenterDesc: { en: "Sr. DOM Prayagraj Division — Overview & Quick Actions", hi: "वरि. मंडल प्रबंधक प्रयागराज — अवलोकन एवं त्वरित कार्रवाई" },
  newExam: { en: "New Exam", hi: "नई परीक्षा" },
  uploadContent: { en: "Upload Content", hi: "सामग्री अपलोड करें" },
  fullReports: { en: "Full Reports", hi: "पूर्ण रिपोर्ट" },
  totalUsers: { en: "Total Users", hi: "कुल उपयोगकर्ता" },
  adminsTI: { en: "Admins (TI)", hi: "एडमिन (TI)" },
  learningMaterials: { en: "Learning Materials", hi: "अध्ययन सामग्री" },
  totalExams: { en: "Total Exams", hi: "कुल परीक्षाएँ" },
  published: { en: "Published", hi: "प्रकाशित" },
  submissions: { en: "submissions", hi: "प्रस्तुतियाँ" },
  passed: { en: "passed", hi: "उत्तीर्ण" },
  locations: { en: "locations", hi: "स्थान" },
  avgScore: { en: "Avg Score", hi: "औसत अंक" },
  usersAssessed: { en: "Users Assessed", hi: "मूल्यांकित उपयोगकर्ता" },
  lowPerformers: { en: "Low Performers", hi: "कम प्रदर्शनकर्ता" },
  notAttempted: { en: "Not Attempted", hi: "प्रयास नहीं किया" },
  tiWisePerformance: { en: "TI-wise Performance", hi: "TI-वार प्रदर्शन" },
  passFail: { en: "Pass / Fail", hi: "उत्तीर्ण / अनुत्तीर्ण" },
  topPerformers: { en: "Top Performers", hi: "शीर्ष प्रदर्शनकर्ता" },
  upcomingSchedules: { en: "Upcoming Schedules", hi: "आगामी शेड्यूल" },
  locationBreakdown: { en: "Location Breakdown", hi: "स्थान विश्लेषण" },
  recentExams: { en: "Recent Exams", hi: "हाल की परीक्षाएँ" },
  recentSubmissions: { en: "Recent Submissions", hi: "हाल की प्रस्तुतियाँ" },
  noExamsYet: { en: "No exams created yet", hi: "अभी तक कोई परीक्षा नहीं बनी" },
  noResultsYet: { en: "No results yet", hi: "अभी तक कोई परिणाम नहीं" },
  noUpcoming: { en: "No upcoming schedules", hi: "कोई आगामी शेड्यूल नहीं" },
  users: { en: "users", hi: "उपयोगकर्ता" },

  // Admin Dashboard
  adminDashboard: { en: "Admin Dashboard", hi: "एडमिन डैशबोर्ड" },
  adminDashboardDesc: { en: "Performance Analytics & User Management", hi: "प्रदर्शन विश्लेषण एवं उपयोगकर्ता प्रबंधन" },
  createUserId: { en: "Create User ID", hi: "उपयोगकर्ता ID बनाएँ" },
  createUserAccount: { en: "Create User Account", hi: "उपयोगकर्ता खाता बनाएँ" },
  employeeName: { en: "Employee name", hi: "कर्मचारी का नाम" },
  hrmsId: { en: "HRMS ID", hi: "HRMS आईडी" },
  autoGenPwd: { en: "A password will be auto-generated for learning material access.", hi: "अध्ययन सामग्री पहुँच के लिए पासवर्ड स्वतः बनाया जाएगा।" },
  createUser: { en: "Create User", hi: "उपयोगकर्ता बनाएँ" },
  examsConduc: { en: "Exams Conducted", hi: "परीक्षाएँ आयोजित" },
  needsAttention: { en: "Needs Attention", hi: "ध्यान आवश्यक" },
  good: { en: "Good", hi: "अच्छा" },
  createdUserCreds: { en: "Created User Credentials", hi: "बनाए गए उपयोगकर्ता क्रेडेंशियल्स" },
  perfTrend: { en: "Performance Trend (6 Months)", hi: "प्रदर्शन रुझान (6 महीने)" },
  passFailDist: { en: "Pass/Fail Distribution", hi: "उत्तीर्ण/अनुत्तीर्ण वितरण" },
  categoryProf: { en: "Category-wise Proficiency", hi: "श्रेणी-वार दक्षता" },
  monthlyExams: { en: "Monthly Exams Conducted", hi: "मासिक परीक्षाएँ आयोजित" },
  userPerfOverview: { en: "User Performance Overview", hi: "उपयोगकर्ता प्रदर्शन अवलोकन" },
  score: { en: "Score", hi: "अंक" },
  trend: { en: "Trend", hi: "रुझान" },

  // User Dashboard
  welcomeUser: { en: "Welcome", hi: "स्वागत है" },
  accessLearning: { en: "Access your learning materials and exams", hi: "अपनी अध्ययन सामग्री और परीक्षाएँ देखें" },
  learningMaterialsTitle: { en: "Learning Materials", hi: "अध्ययन सामग्री" },
  learningMaterialsDesc: { en: "Access uploaded courses, videos, PDFs & presentations", hi: "अपलोड किए गए पाठ्यक्रम, वीडियो, PDF और प्रस्तुतियाँ देखें" },
  examsTitle: { en: "Exams", hi: "परीक्षाएँ" },
  examsDesc: { en: "Attempt scheduled MCQ assessments", hi: "निर्धारित MCQ मूल्यांकन का प्रयास करें" },

  // Learning Page
  learningSection: { en: "Learning Section", hi: "अध्ययन अनुभाग" },
  accessCourses: { en: "Access your assigned courses and materials", hi: "अपने आवंटित पाठ्यक्रम और सामग्री देखें" },
  noCourses: { en: "No courses available yet. Check back later!", hi: "अभी कोई पाठ्यक्रम उपलब्ध नहीं है। बाद में देखें!" },
  watchVideo: { en: "Watch Video", hi: "वीडियो देखें" },
  openMaterial: { en: "Open Material", hi: "सामग्री खोलें" },

  // Exams Page
  examPageTitle: { en: "Exams", hi: "परीक्षाएँ" },
  examPageDesc: { en: "Fill your details and attempt scheduled MCQ assessments", hi: "अपने विवरण भरें और निर्धारित MCQ मूल्यांकन का प्रयास करें" },
  noExamsAvailable: { en: "No exams available right now.", hi: "अभी कोई परीक्षा उपलब्ध नहीं है।" },
  startExam: { en: "Start Exam", hi: "परीक्षा शुरू करें" },
  fillDetails: { en: "Fill Your Details to Start", hi: "शुरू करने के लिए अपने विवरण भरें" },
  yourFullName: { en: "Your full name", hi: "आपका पूरा नाम" },
  proceedExam: { en: "Proceed to Exam", hi: "परीक्षा के लिए आगे बढ़ें" },
  submitExam: { en: "Submit Exam", hi: "परीक्षा जमा करें" },
  answered: { en: "answered", hi: "उत्तर दिए" },
  passedResult: { en: "PASSED", hi: "उत्तीर्ण" },
  failedResult: { en: "FAILED", hi: "अनुत्तीर्ण" },
  candidate: { en: "Candidate", hi: "उम्मीदवार" },
  mark: { en: "mark", hi: "अंक" },
  marks: { en: "marks", hi: "अंक" },

  // Results Page
  myResults: { en: "My Results", hi: "मेरे परिणाम" },
  viewResults: { en: "View Results", hi: "परिणाम देखें" },
  yourPerfHistory: { en: "Your exam performance history", hi: "आपका परीक्षा प्रदर्शन इतिहास" },
  reviewResults: { en: "Review user exam results", hi: "उपयोगकर्ता परीक्षा परिणाम समीक्षा" },
  exam: { en: "Exam", hi: "परीक्षा" },
  percentage: { en: "Percentage", hi: "प्रतिशत" },
  date: { en: "Date", hi: "तिथि" },
  noResultsYetTable: { en: "No results yet.", hi: "अभी तक कोई परिणाम नहीं।" },

  // Reports Page
  reportsTitle: { en: "Reports & Analytics", hi: "रिपोर्ट एवं विश्लेषण" },
  reportsDesc: { en: "Division-wide performance insights — HRMS mapped", hi: "मंडल-स्तरीय प्रदर्शन अंतर्दृष्टि — HRMS मैप्ड" },
  exportCsv: { en: "Export CSV", hi: "CSV निर्यात करें" },
  searchByNameHrms: { en: "Search by Name or HRMS ID...", hi: "नाम या HRMS ID से खोजें..." },
  filterByTI: { en: "Filter by TI", hi: "TI द्वारा फ़िल्टर करें" },
  allTIs: { en: "All TIs", hi: "सभी TI" },
  performers: { en: "Performers", hi: "प्रदर्शनकर्ता" },
  tiWise: { en: "TI-wise", hi: "TI-वार" },
  charts: { en: "Charts", hi: "चार्ट" },
  bestPerformers: { en: "Best Performers", hi: "सर्वश्रेष्ठ प्रदर्शनकर्ता" },
  lowPerformersBelow60: { en: "Low Performers (Below 60%)", hi: "कम प्रदर्शनकर्ता (60% से नीचे)" },
  noLowPerformers: { en: "No low performers 🎉", hi: "कोई कम प्रदर्शनकर्ता नहीं 🎉" },
  allUserResults: { en: "All User Results (HRMS Mapped)", hi: "सभी उपयोगकर्ता परिणाम (HRMS मैप्ड)" },
  locationTI: { en: "Location (TI)", hi: "स्थान (TI)" },
  examsCount: { en: "Exams", hi: "परीक्षाएँ" },
  pass: { en: "Pass", hi: "उत्तीर्ण" },
  fail: { en: "Fail", hi: "अनुत्तीर्ण" },
  usersNotAttempted: { en: "Users Who Have Not Attempted Any Exam", hi: "जिन उपयोगकर्ताओं ने कोई परीक्षा नहीं दी" },
  allAttempted: { en: "All users have attempted at least one exam ✅", hi: "सभी उपयोगकर्ताओं ने कम से कम एक परीक्षा दी है ✅" },
  tiAvgScore: { en: "TI-wise Average Score", hi: "TI-वार औसत अंक" },
  tiPassVsFail: { en: "TI-wise Pass vs Fail", hi: "TI-वार उत्तीर्ण बनाम अनुत्तीर्ण" },
  usersAssessedCount: { en: "users assessed", hi: "उपयोगकर्ता मूल्यांकित" },
  passRate: { en: "Pass rate", hi: "उत्तीर्ण दर" },
  passFailNotAttempted: { en: "Pass / Fail / Not Attempted", hi: "उत्तीर्ण / अनुत्तीर्ण / प्रयास नहीं किया" },
  examWiseProf: { en: "Exam-wise Proficiency", hi: "परीक्षा-वार दक्षता" },
  loadingAnalytics: { en: "Loading analytics...", hi: "विश्लेषण लोड हो रहा है..." },

  // Profile Page
  myProfile: { en: "My Profile", hi: "मेरी प्रोफ़ाइल" },
  manageAccount: { en: "Manage your account and personal information", hi: "अपना खाता और व्यक्तिगत जानकारी प्रबंधित करें" },
  editInfo: { en: "Edit Information", hi: "जानकारी संपादित करें" },
  cugNumber: { en: "CUG Number", hi: "CUG नंबर" },
  security: { en: "Security", hi: "सुरक्षा" },
  changePassword: { en: "Change Password", hi: "पासवर्ड बदलें" },
  updatePassword: { en: "Update Password", hi: "पासवर्ड अपडेट करें" },
  currentPassword: { en: "Current Password", hi: "वर्तमान पासवर्ड" },
  newPassword: { en: "New Password", hi: "नया पासवर्ड" },
  confirmPassword: { en: "Confirm New Password", hi: "नया पासवर्ड पुष्टि करें" },
  updateAccountPwd: { en: "Update your account password", hi: "अपना खाता पासवर्ड अपडेट करें" },
  role: { en: "Role", hi: "भूमिका" },
  currentRole: { en: "Your current system role", hi: "आपकी वर्तमान सिस्टम भूमिका" },
  required: { en: "Required", hi: "आवश्यक" },
  changingPwd: { en: "Changing...", hi: "बदल रहे हैं..." },

  // Content Management
  contentMgmt: { en: "Content Upload", hi: "सामग्री अपलोड" },
  contentDesc: { en: "Upload and manage learning content", hi: "अध्ययन सामग्री अपलोड और प्रबंधित करें" },

  // User Management
  userMgmt: { en: "User Management", hi: "उपयोगकर्ता प्रबंधन" },

  // Scheduling
  schedulingTitle: { en: "Scheduling", hi: "शेड्यूलिंग" },
  createSchedule: { en: "Create Schedule", hi: "शेड्यूल बनाएँ" },

  // Exam Management
  examMgmt: { en: "Exam Management", hi: "परीक्षा प्रबंधन" },

  // Admin Management
  adminMgmt: { en: "Admin Management", hi: "एडमिन प्रबंधन" },
} as const;

type TranslationKey = keyof typeof translations;

interface LanguageContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(() => {
    const saved = localStorage.getItem("app-lang");
    return (saved === "hi" ? "hi" : "en") as Lang;
  });

  const changeLang = (newLang: Lang) => {
    setLang(newLang);
    localStorage.setItem("app-lang", newLang);
  };

  const t = (key: TranslationKey): string => {
    return translations[key]?.[lang] || translations[key]?.en || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang: changeLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within LanguageProvider");
  return context;
}
