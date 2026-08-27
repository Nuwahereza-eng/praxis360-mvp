import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function hp(pw: string) {
  return bcrypt.hash(pw, 10);
}

async function main() {
  console.log("Seeding Praxis360 demo data…");

  // Clear existing data (order matters due to FKs)
  await prisma.evaluationResponse.deleteMany();
  await prisma.evaluationQuestion.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.institutionalAction.deleteMany();
  await prisma.issueUpdate.deleteMany();
  await prisma.issue.deleteMany();
  await prisma.correctionAttempt.deleteMany();
  await prisma.correctionActivity.deleteMany();
  await prisma.learningGap.deleteMany();
  await prisma.criterionResult.deleteMany();
  await prisma.assessmentResult.deleteMany();
  await prisma.rubricCriterion.deleteMany();
  await prisma.learningOutcome.deleteMany();
  await prisma.assessment.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.course.deleteMany();
  await prisma.semester.deleteMany();
  await prisma.user.deleteMany();
  await prisma.department.deleteMany();
  await prisma.faculty.deleteMany();

  // Faculties
  const fce = await prisma.faculty.create({ data: { name: "Computing & Engineering", code: "FCE" } });
  const fbm = await prisma.faculty.create({ data: { name: "Business & Management", code: "FBM" } });

  // Academic Departments
  const dSE = await prisma.department.create({ data: { name: "Software Engineering", code: "SE", type: "ACADEMIC", facultyId: fce.id } });
  const dIS = await prisma.department.create({ data: { name: "Information Systems", code: "IS", type: "ACADEMIC", facultyId: fce.id } });
  const dBM = await prisma.department.create({ data: { name: "Business Management", code: "BM", type: "ACADEMIC", facultyId: fbm.id } });

  // Service Departments
  const dICT = await prisma.department.create({ data: { name: "ICT", code: "ICT", type: "SERVICE" } });
  const dLIB = await prisma.department.create({ data: { name: "Library", code: "LIB", type: "SERVICE" } });
  const dFIN = await prisma.department.create({ data: { name: "Finance", code: "FIN", type: "SERVICE" } });
  const dREG = await prisma.department.create({ data: { name: "Academic Registrar", code: "REG", type: "SERVICE" } });
  const dSTA = await prisma.department.create({ data: { name: "Student Affairs", code: "STA", type: "SERVICE" } });
  const dFAC = await prisma.department.create({ data: { name: "Facilities", code: "FAC", type: "SERVICE" } });
  const dSEC = await prisma.department.create({ data: { name: "Security", code: "SEC", type: "SERVICE" } });
  const dADM = await prisma.department.create({ data: { name: "Administration", code: "ADM", type: "SERVICE" } });
  const dQA  = await prisma.department.create({ data: { name: "Quality Assurance", code: "QA", type: "SERVICE" } });

  // Users
  const pass = await hp("password123");

  const admin = await prisma.user.create({
    data: { firstName: "Alex", lastName: "Admin", email: "admin@umi.ac.ug", passwordHash: pass, role: "ADMIN" },
  });
  const qa = await prisma.user.create({
    data: { firstName: "Quinn", lastName: "Adaku", email: "qa@umi.ac.ug", passwordHash: pass, role: "QA", departmentId: dQA.id },
  });

  // Lecturers
  const lect = await prisma.user.create({
    data: { firstName: "Dr. Grace", lastName: "Mugisha", email: "lecturer@umi.ac.ug", passwordHash: pass, role: "LECTURER", facultyId: fce.id, departmentId: dSE.id },
  });
  const lect2 = await prisma.user.create({
    data: { firstName: "Dr. Peter", lastName: "Okello", email: "lecturer2@umi.ac.ug", passwordHash: pass, role: "LECTURER", facultyId: fce.id, departmentId: dIS.id },
  });
  const lect3 = await prisma.user.create({
    data: { firstName: "Dr. Sarah", lastName: "Nabakka", email: "lecturer3@umi.ac.ug", passwordHash: pass, role: "LECTURER", facultyId: fbm.id, departmentId: dBM.id },
  });

  // Department officers
  const ictOfficer = await prisma.user.create({
    data: { firstName: "Ian", lastName: "Kato", email: "ict@umi.ac.ug", passwordHash: pass, role: "DEPARTMENT_OFFICER", departmentId: dICT.id },
  });
  await prisma.user.create({ data: { firstName: "Lena", lastName: "Auma", email: "library@umi.ac.ug", passwordHash: pass, role: "DEPARTMENT_OFFICER", departmentId: dLIB.id } });
  await prisma.user.create({ data: { firstName: "Fiona", lastName: "Ateng", email: "finance@umi.ac.ug", passwordHash: pass, role: "DEPARTMENT_OFFICER", departmentId: dFIN.id } });
  await prisma.user.create({ data: { firstName: "Ronald", lastName: "Sebina", email: "registrar@umi.ac.ug", passwordHash: pass, role: "DEPARTMENT_OFFICER", departmentId: dREG.id } });
  await prisma.user.create({ data: { firstName: "Stella", lastName: "Nansubuga", email: "welfare@umi.ac.ug", passwordHash: pass, role: "DEPARTMENT_OFFICER", departmentId: dSTA.id } });

  // Students (30). One is the primary demo student.
  const primaryStudent = await prisma.user.create({
    data: { firstName: "Ada", lastName: "Nakato", email: "student@umi.ac.ug", passwordHash: pass, role: "STUDENT", facultyId: fce.id, departmentId: dSE.id },
  });
  const students = [primaryStudent];
  const firstNames = ["John", "Mary", "Brian", "Sarah", "David", "Rebecca", "Samuel", "Grace", "Kevin", "Faith", "Joseph", "Ruth", "Timothy", "Esther", "Daniel", "Rachel", "Andrew", "Diana", "Michael", "Sharon", "James", "Rose", "Robert", "Patience", "Simon", "Joan", "Isaac", "Linda", "Paul"];
  for (let i = 0; i < 29; i++) {
    const s = await prisma.user.create({
      data: {
        firstName: firstNames[i],
        lastName: `Student${i + 1}`,
        email: `student${i + 1}@umi.ac.ug`,
        passwordHash: pass,
        role: "STUDENT",
        facultyId: i % 2 === 0 ? fce.id : fbm.id,
        departmentId: i % 3 === 0 ? dSE.id : i % 3 === 1 ? dIS.id : dBM.id,
      },
    });
    students.push(s);
  }

  // Semester (active + evaluation window open)
  const now = new Date();
  const semester = await prisma.semester.create({
    data: {
      name: "Semester I",
      academicYear: "2024/2025",
      startDate: new Date(now.getFullYear(), 0, 15),
      endDate: new Date(now.getFullYear(), 5, 15),
      evaluationStartDate: new Date(now.getTime() - 7 * 86400000),
      evaluationEndDate: new Date(now.getTime() + 21 * 86400000),
      status: "ACTIVE",
    },
  });

  // Courses
  const cSE = await prisma.course.create({ data: { code: "SE301", name: "Software Engineering", facultyId: fce.id, departmentId: dSE.id, semesterId: semester.id, lecturerId: lect.id } });
  const cDB = await prisma.course.create({ data: { code: "IS210", name: "Database Systems", facultyId: fce.id, departmentId: dIS.id, semesterId: semester.id, lecturerId: lect2.id } });
  const cRM = await prisma.course.create({ data: { code: "RM401", name: "Research Methods", facultyId: fbm.id, departmentId: dBM.id, semesterId: semester.id, lecturerId: lect3.id } });
  const cPM = await prisma.course.create({ data: { code: "PM320", name: "Project Management", facultyId: fbm.id, departmentId: dBM.id, semesterId: semester.id, lecturerId: lect3.id } });
  const cIS = await prisma.course.create({ data: { code: "IS110", name: "Information Systems", facultyId: fce.id, departmentId: dIS.id, semesterId: semester.id, lecturerId: lect2.id } });
  const courses = [cSE, cDB, cRM, cPM, cIS];

  // Enrollments: enroll primary student in all courses, others distributed
  for (const c of courses) {
    await prisma.enrollment.create({ data: { studentId: primaryStudent.id, courseId: c.id, semesterId: semester.id } });
  }
  for (let i = 1; i < students.length; i++) {
    // Enroll each student in 3 random courses
    const shuffled = [...courses].sort(() => Math.random() - 0.5).slice(0, 3);
    for (const c of shuffled) {
      await prisma.enrollment.create({ data: { studentId: students[i].id, courseId: c.id, semesterId: semester.id } });
    }
  }

  // Learning Outcomes for Software Engineering (main demo course)
  const loSE1 = await prisma.learningOutcome.create({ data: { courseId: cSE.id, title: "Requirements Analysis", description: "Elicit, analyze, and document software requirements." } });
  const loSE2 = await prisma.learningOutcome.create({ data: { courseId: cSE.id, title: "System Design", description: "Design modular software architectures." } });
  const loSE3 = await prisma.learningOutcome.create({ data: { courseId: cSE.id, title: "Testing & Quality", description: "Apply testing techniques and quality practices." } });
  // Basic LOs for other courses (for analytics variety)
  for (const c of [cDB, cRM, cPM, cIS]) {
    await prisma.learningOutcome.create({ data: { courseId: c.id, title: "Core Concepts", description: "Fundamental concepts." } });
    await prisma.learningOutcome.create({ data: { courseId: c.id, title: "Applied Practice", description: "Applying concepts to practice." } });
  }

  // Assessments (8 total)
  const aSE1 = await prisma.assessment.create({
    data: { courseId: cSE.id, title: "Coursework 1: Requirements Document", type: "COURSEWORK", description: "Prepare a requirements specification document.", totalMarks: 100, passMark: 50, dueDate: new Date(now.getTime() - 20 * 86400000), createdBy: lect.id },
  });
  const aSE2 = await prisma.assessment.create({
    data: { courseId: cSE.id, title: "Coursework 2: Design Document", type: "COURSEWORK", description: "Prepare an architectural design document.", totalMarks: 100, passMark: 50, dueDate: new Date(now.getTime() + 10 * 86400000), createdBy: lect.id },
  });
  const aDB1 = await prisma.assessment.create({ data: { courseId: cDB.id, title: "SQL Assignment", type: "ASSIGNMENT", description: "SQL exercises.", totalMarks: 50, passMark: 25, dueDate: new Date(now.getTime() - 5 * 86400000), createdBy: lect2.id } });
  const aRM1 = await prisma.assessment.create({ data: { courseId: cRM.id, title: "Research Proposal", type: "COURSEWORK", description: "Draft proposal.", totalMarks: 100, passMark: 50, dueDate: new Date(now.getTime() + 14 * 86400000), createdBy: lect3.id } });
  const aPM1 = await prisma.assessment.create({ data: { courseId: cPM.id, title: "Project Charter", type: "ASSIGNMENT", description: "Charter document.", totalMarks: 50, passMark: 25, dueDate: new Date(now.getTime() - 2 * 86400000), createdBy: lect3.id } });
  await prisma.assessment.create({ data: { courseId: cIS.id, title: "Case Study", type: "ASSIGNMENT", description: "IS case study.", totalMarks: 50, passMark: 25, dueDate: new Date(now.getTime() + 20 * 86400000), createdBy: lect2.id } });
  await prisma.assessment.create({ data: { courseId: cSE.id, title: "Test 1", type: "TEST", description: "Written test.", totalMarks: 40, passMark: 20, dueDate: new Date(now.getTime() - 30 * 86400000), createdBy: lect.id } });
  await prisma.assessment.create({ data: { courseId: cDB.id, title: "Database Project", type: "PROJECT", description: "Full DB project.", totalMarks: 100, passMark: 50, dueDate: new Date(now.getTime() + 30 * 86400000), createdBy: lect2.id } });

  // Rubric for aSE1 tied to Learning Outcomes
  const rSE1a = await prisma.rubricCriterion.create({ data: { assessmentId: aSE1.id, learningOutcomeId: loSE1.id, title: "Requirements Analysis", description: "Depth and clarity of requirements analysis.", maxMarks: 40 } });
  const rSE1b = await prisma.rubricCriterion.create({ data: { assessmentId: aSE1.id, learningOutcomeId: loSE2.id, title: "System Structure", description: "Modeling and structural quality.", maxMarks: 30 } });
  const rSE1c = await prisma.rubricCriterion.create({ data: { assessmentId: aSE1.id, learningOutcomeId: loSE3.id, title: "Quality & Documentation", description: "Clarity, formatting, references.", maxMarks: 30 } });

  // Primary demo result: 42% overall with a Requirements Analysis weakness
  const primaryResult = await prisma.assessmentResult.create({
    data: {
      assessmentId: aSE1.id,
      studentId: primaryStudent.id,
      score: 42,
      percentage: 42,
      lecturerFeedback: "Improve your analysis. The requirements are stated but lack depth and traceability to stakeholders.",
      feedbackReleasedAt: new Date(now.getTime() - 15 * 86400000),
      status: "RELEASED",
      criterionResults: {
        create: [
          { rubricCriterionId: rSE1a.id, score: 14, feedback: "Requirements are surface-level; missing stakeholder rationale." },
          { rubricCriterionId: rSE1b.id, score: 16, feedback: "Structure is adequate but diagrams need labels." },
          { rubricCriterionId: rSE1c.id, score: 12, feedback: "Formatting inconsistent; add references." },
        ],
      },
    },
  });

  // Learning gap on Requirements Analysis (red)
  const gap = await prisma.learningGap.create({
    data: {
      studentId: primaryStudent.id,
      courseId: cSE.id,
      learningOutcomeId: loSE1.id,
      sourceAssessmentId: aSE1.id,
      severity: "RED",
      status: "IDENTIFIED",
    },
  });
  await prisma.correctionActivity.create({
    data: {
      learningGapId: gap.id,
      title: "Requirements Deep-Dive Exercise",
      description: "Re-elicit and document requirements for a small case study using stakeholder-driven analysis.",
      instructions: "1) Identify 3 stakeholders. 2) List functional + non-functional requirements. 3) Map each requirement to a stakeholder need. 4) Submit a 2-page write-up.",
      maxScore: 100,
      createdBy: lect.id,
      dueDate: new Date(now.getTime() + 10 * 86400000),
    },
  });

  // Distribute results for other students on aSE1 for analytics
  for (let i = 1; i < 20; i++) {
    const s = students[i];
    const pctScore = Math.floor(45 + Math.random() * 45);
    await prisma.assessmentResult.create({
      data: {
        assessmentId: aSE1.id,
        studentId: s.id,
        score: pctScore,
        percentage: pctScore,
        lecturerFeedback: pctScore < 60 ? "Please strengthen your analysis with clearer rationale." : "Good effort — refine documentation quality.",
        feedbackReleasedAt: new Date(now.getTime() - 10 * 86400000),
        status: "RELEASED",
      },
    });
    if (pctScore < 50) {
      await prisma.learningGap.create({
        data: { studentId: s.id, courseId: cSE.id, learningOutcomeId: loSE1.id, sourceAssessmentId: aSE1.id, severity: "RED", status: "IDENTIFIED" },
      });
    }
  }

  // Evaluation questions
  const questions = [
    "The lecturer explained concepts clearly.",
    "The lecturer demonstrated good knowledge of the subject.",
    "The lecturer provided useful feedback.",
    "Assessments reflected what was taught.",
    "Course expectations were clear.",
    "The lecturer supported student learning.",
    "Learning resources were useful.",
    "Overall, this course supported my learning.",
  ];
  for (let i = 0; i < questions.length; i++) {
    await prisma.evaluationQuestion.create({ data: { text: questions[i], type: "RATING", orderIdx: i } });
  }
  await prisma.evaluationQuestion.create({ data: { text: "What worked particularly well?", type: "TEXT", orderIdx: 8 } });
  await prisma.evaluationQuestion.create({ data: { text: "What should be improved?", type: "TEXT", orderIdx: 9 } });

  const allQs = await prisma.evaluationQuestion.findMany();
  const ratingQs = allQs.filter((q) => q.type === "RATING");

  // Seed anonymous evaluations for SE course from ~20 students so response rate is visible
  const seEnrolled = await prisma.enrollment.findMany({ where: { courseId: cSE.id } });
  for (let i = 0; i < Math.min(seEnrolled.length - 2, 15); i++) {
    const e = seEnrolled[i];
    if (e.studentId === primaryStudent.id) continue;
    for (const q of ratingQs) {
      const rating = 3 + Math.floor(Math.random() * 3);
      await prisma.evaluationResponse.create({
        data: { studentId: e.studentId, courseId: cSE.id, questionId: q.id, rating },
      }).catch(() => {});
    }
  }

  // Issues (20) with distribution across categories
  const issueSeed: {title:string; desc:string; cat:string; itype:string; loc:string|null; pr:string; dept: any; status: string; officerId?: string}[] = [
    { title: "Library Wi-Fi unreliable", desc: "The Wi-Fi in the library hasn't worked properly for the last three days. It disconnects every few minutes.", cat: "ICT", itype: "Connectivity", loc: "Library", pr: "MEDIUM", dept: dICT, status: "SUBMITTED", officerId: undefined },
    { title: "Missing textbook", desc: "The recommended textbook for Database Systems is not available in the library catalogue.", cat: "Library", itype: "Access", loc: "Library", pr: "LOW", dept: dLIB, status: "ASSIGNED" },
    { title: "Fee balance not updating", desc: "I paid my tuition but the balance is still showing on the finance portal.", cat: "Finance", itype: "Payment", loc: null, pr: "HIGH", dept: dFIN, status: "IN_PROGRESS" },
    { title: "Course registration blocked", desc: "The registration portal blocks me from enrolling in Research Methods.", cat: "Registration", itype: "Registration", loc: null, pr: "HIGH", dept: dREG, status: "RESOLVED" },
    { title: "Broken lecture room projector", desc: "The projector in Room B12 has been broken for two weeks.", cat: "Facilities", itype: "Maintenance", loc: "Academic Block", pr: "MEDIUM", dept: dFAC, status: "IN_PROGRESS" },
    { title: "Hostel water shortage", desc: "There has been no running water in the hostels for two days.", cat: "Accommodation", itype: "Housing", loc: "Hostels", pr: "HIGH", dept: dSTA, status: "ASSIGNED" },
    { title: "Late feedback on coursework", desc: "Feedback for our first coursework in Project Management has been delayed by weeks.", cat: "Assessment", itype: "Assessment", loc: null, pr: "MEDIUM", dept: dSE, status: "RECEIVED" },
    { title: "Poor lighting in cafeteria at night", desc: "The cafeteria area is very dark after 7pm which feels unsafe.", cat: "Security", itype: "Safety", loc: "Cafeteria", pr: "HIGH", dept: dSEC, status: "IN_PROGRESS" },
    { title: "E-learning portal login errors", desc: "I keep getting login errors on the e-learning portal.", cat: "ICT", itype: "Connectivity", loc: null, pr: "MEDIUM", dept: dICT, status: "RESOLVED" },
    { title: "Confusing timetable release", desc: "The timetable was released twice with different times, causing confusion.", cat: "Administration", itype: "General", loc: null, pr: "LOW", dept: dADM, status: "VERIFIED" },
    { title: "Stress and mental health support", desc: "Requesting counselling support during exam period.", cat: "Student Welfare", itype: "Welfare", loc: null, pr: "MEDIUM", dept: dSTA, status: "IN_PROGRESS" },
    { title: "Printer out of service", desc: "The library printer has been out of service for a week.", cat: "Library", itype: "Access", loc: "Library", pr: "LOW", dept: dLIB, status: "RESOLVED" },
    { title: "Cafeteria hygiene concern", desc: "Cafeteria tables are frequently left dirty.", cat: "Facilities", itype: "Maintenance", loc: "Cafeteria", pr: "MEDIUM", dept: dFAC, status: "SUBMITTED" },
    { title: "Refund still pending", desc: "Refund for a dropped course is still pending after one month.", cat: "Finance", itype: "Payment", loc: null, pr: "HIGH", dept: dFIN, status: "ESCALATED" },
    { title: "Transcript request delay", desc: "My transcript request has taken three weeks with no update.", cat: "Registration", itype: "Registration", loc: null, pr: "MEDIUM", dept: dREG, status: "IN_PROGRESS" },
    { title: "Lab computers slow", desc: "Computers in Lab 3 are very slow and struggle to run required software.", cat: "ICT", itype: "Connectivity", loc: "Academic Block", pr: "MEDIUM", dept: dICT, status: "ASSIGNED" },
    { title: "Unclear grading criteria", desc: "Grading criteria for the last assignment were not communicated in advance.", cat: "Assessment", itype: "Assessment", loc: null, pr: "MEDIUM", dept: dSE, status: "RECEIVED" },
    { title: "Broken window in classroom", desc: "A window pane is cracked in Room A5.", cat: "Facilities", itype: "Maintenance", loc: "Academic Block", pr: "LOW", dept: dFAC, status: "RESOLVED" },
    { title: "Bookshop stock issue", desc: "Prescribed reader not available at the bookshop.", cat: "Administration", itype: "General", loc: null, pr: "LOW", dept: dADM, status: "SUBMITTED" },
    { title: "Suspicious loitering at gate", desc: "Suspicious individuals seen loitering near the main gate at night.", cat: "Security", itype: "Safety", loc: null, pr: "HIGH", dept: dSEC, status: "IN_PROGRESS" },
  ];

  for (let i = 0; i < issueSeed.length; i++) {
    const s = issueSeed[i];
    const submitter = i % 4 === 0 ? primaryStudent : students[(i * 3) % students.length];
    const created = new Date(now.getTime() - (i + 1) * 86400000);
    const issue = await prisma.issue.create({
      data: {
        studentId: i === 0 ? null : submitter.id, // first as anonymous to demo privacy
        title: s.title,
        description: s.desc,
        category: s.cat,
        issueType: s.itype,
        location: s.loc,
        priority: s.pr,
        privacyMode: i === 0 ? "ANONYMOUS" : i % 5 === 0 ? "CONFIDENTIAL" : "IDENTIFIED",
        departmentId: s.dept.id,
        assignedOfficerId: s.dept.id === dICT.id ? ictOfficer.id : undefined,
        status: s.status,
        aiConfidence: 0.87,
        createdAt: created,
        resolvedAt: ["RESOLVED", "VERIFIED"].includes(s.status) ? new Date(created.getTime() + 2 * 86400000) : null,
        updates: {
          create: [
            { message: "Issue submitted.", type: "STATUS_CHANGE", visibleToStudent: true, createdAt: created },
            ...(["RECEIVED","ASSIGNED","IN_PROGRESS","ESCALATED","RESOLVED","VERIFIED"].includes(s.status)
              ? [{ message: "Issue received by department.", type: "STATUS_CHANGE" as const, visibleToStudent: true, createdAt: new Date(created.getTime() + 3600000) }]
              : []),
            ...(["ASSIGNED","IN_PROGRESS","RESOLVED","VERIFIED"].includes(s.status)
              ? [{ message: "Assigned to a case officer.", type: "STATUS_CHANGE" as const, visibleToStudent: true, createdAt: new Date(created.getTime() + 7200000) }]
              : []),
            ...(["IN_PROGRESS","RESOLVED","VERIFIED"].includes(s.status)
              ? [{ message: "We are investigating this issue.", type: "STUDENT_UPDATE" as const, visibleToStudent: true, createdAt: new Date(created.getTime() + 3 * 86400000) }]
              : []),
            ...(["RESOLVED","VERIFIED"].includes(s.status)
              ? [{ message: "Resolved. Please confirm from your side.", type: "RESOLUTION" as const, visibleToStudent: true, createdAt: new Date(created.getTime() + 2 * 86400000) }]
              : []),
            ...(s.status === "VERIFIED"
              ? [{ message: "Student confirmed resolution.", type: "VERIFICATION" as const, visibleToStudent: true, createdAt: new Date(created.getTime() + 4 * 86400000) }]
              : []),
          ],
        },
      },
    });
    // Notify primary student for their own issues
    if (issue.studentId === primaryStudent.id) {
      await prisma.notification.create({
        data: { userId: primaryStudent.id, title: "Issue update", message: `Your issue "${issue.title}" is now ${issue.status}.`, type: "ISSUE", relatedEntityType: "ISSUE", relatedEntityId: issue.id },
      });
    }
  }

  // Institutional actions (You Said → We Did)
  await prisma.institutionalAction.create({
    data: {
      title: "Faculty introduces 7-day feedback target",
      issueSummary: "Coursework feedback was arriving too late.",
      evidence: "62% of student comments in the evaluation cycle mentioned delayed feedback.",
      actionTaken: "The Faculty introduced a 7-day feedback turnaround standard, monitored by QA.",
      responsibleDepartmentId: dQA.id,
      status: "IN_PROGRESS",
      outcome: "Average feedback turnaround has begun to decrease.",
      published: true,
    },
  });
  await prisma.institutionalAction.create({
    data: {
      title: "Library Wi-Fi access point replaced",
      issueSummary: "Library Wi-Fi was unreliable.",
      evidence: "Multiple student issues logged and confirmed by ICT diagnostics.",
      actionTaken: "ICT replaced the faulty network access point and installed additional coverage.",
      responsibleDepartmentId: dICT.id,
      status: "COMPLETED",
      outcome: "Connectivity in the library is stable and complaints have stopped.",
      published: true,
      completedAt: new Date(now.getTime() - 2 * 86400000),
    },
  });
  await prisma.institutionalAction.create({
    data: {
      title: "Fee balance portal fix",
      issueSummary: "Fee balances did not update after payment.",
      evidence: "Finance received several student issues within a two-week window.",
      actionTaken: "Finance and ICT synchronised the payment reconciliation system.",
      responsibleDepartmentId: dFIN.id,
      status: "IN_PROGRESS",
      published: false,
    },
  });

  // Notifications for primary student
  await prisma.notification.create({ data: { userId: primaryStudent.id, title: "Feedback available", message: "Your feedback for Coursework 1 has been released.", type: "FEEDBACK" } });
  await prisma.notification.create({ data: { userId: primaryStudent.id, title: "Learning gap identified", message: "Requirements Analysis marked as a learning gap. A correction activity is ready.", type: "LEARNING_GAP" } });
  await prisma.notification.create({ data: { userId: primaryStudent.id, title: "Teaching evaluations are open", message: "You have 5 evaluations remaining. Estimated 5 minutes.", type: "EVALUATION" } });
  await prisma.notification.create({ data: { userId: lect.id, title: "Marking pending", message: "Coursework 2 submissions are ready to mark.", type: "MARKING" } });
  await prisma.notification.create({ data: { userId: ictOfficer.id, title: "New issue assigned", message: "Library Wi-Fi unreliable — please review.", type: "ISSUE" } });
  await prisma.notification.create({ data: { userId: qa.id, title: "Feedback turnaround exceeded in 3 courses", message: "Review QA insights for details.", type: "QA_INSIGHT" } });

  console.log("✓ Seed complete");
  console.log("");
  console.log("Demo accounts (password: password123):");
  console.log("  student@umi.ac.ug");
  console.log("  lecturer@umi.ac.ug");
  console.log("  ict@umi.ac.ug");
  console.log("  qa@umi.ac.ug");
  console.log("  admin@umi.ac.ug");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
