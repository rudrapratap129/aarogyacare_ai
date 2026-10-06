const express = require("express");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

const DATA_DIR = path.join(__dirname, "data");
const REPORT_FILE = path.join(DATA_DIR, "reports.json");

fs.mkdirSync(DATA_DIR, { recursive: true });

if (!fs.existsSync(REPORT_FILE)) {
  fs.writeFileSync(REPORT_FILE, "[]");
}

app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));


/* =========================================================
   SYMPTOM CATEGORIES
   ========================================================= */

const symptomCategories = {
  respiratory: [
    "cough", "cold", "sore throat", "throat", "runny nose",
    "blocked nose", "congestion", "breathing", "breath",
    "phlegm", "mucus", "wheezing"
  ],

  fever: [
    "fever", "temperature", "chills", "shivering", "hot"
  ],

  headache: [
    "headache", "head pain", "migraine", "dizzy",
    "dizziness", "lightheaded"
  ],

  digestive: [
    "stomach", "abdominal", "belly", "nausea", "vomit",
    "vomiting", "diarrhea", "loose motion", "constipation",
    "indigestion", "acidity", "heartburn"
  ],

  pain: [
    "pain", "ache", "aching", "sore", "hurt"
  ],

  skin: [
    "rash", "itching", "itch", "skin", "swelling",
    "redness", "hives"
  ],

  injury: [
    "injury", "injured", "fell", "fall", "sprain",
    "bruise", "cut", "wound", "accident"
  ],

  urinary: [
    "urine", "urination", "pee", "bladder",
    "burning while urinating"
  ]
};


/* =========================================================
   CATEGORY-SPECIFIC QUESTIONS
   ========================================================= */

const questionSets = {

  respiratory: [
    {
      id: "duration",
      label: "How long have you had these symptoms?",
      type: "text",
      placeholder: "e.g. 2 days"
    },
    {
      id: "breathing",
      label: "Are you having difficulty breathing?",
      type: "select",
      options: ["No", "A little", "Yes"]
    },
    {
      id: "fever",
      label: "Do you also have a fever?",
      type: "select",
      options: ["No", "Not sure", "Yes"]
    },
    {
      id: "severity",
      label: "How severe are the symptoms? (0–10)",
      type: "number",
      placeholder: "0–10",
      min: 0,
      max: 10
    }
  ],

  fever: [
    {
      id: "duration",
      label: "How long have you had the fever or raised temperature?",
      type: "text",
      placeholder: "e.g. Since yesterday"
    },
    {
      id: "temperature",
      label: "Do you know your temperature?",
      type: "text",
      placeholder: "e.g. 38°C"
    },
    {
      id: "chills",
      label: "Are you experiencing chills or shivering?",
      type: "select",
      options: ["No", "Sometimes", "Yes"]
    },
    {
      id: "severity",
      label: "How unwell do you feel? (0–10)",
      type: "number",
      placeholder: "0–10",
      min: 0,
      max: 10
    }
  ],

  headache: [
    {
      id: "duration",
      label: "When did the headache begin?",
      type: "text",
      placeholder: "e.g. This morning"
    },
    {
      id: "onset",
      label: "Did the headache start suddenly or gradually?",
      type: "select",
      options: ["Gradually", "Suddenly", "Not sure"]
    },
    {
      id: "vision",
      label: "Are you experiencing unusual vision changes?",
      type: "select",
      options: ["No", "Not sure", "Yes"]
    },
    {
      id: "severity",
      label: "How severe is the headache? (0–10)",
      type: "number",
      placeholder: "0–10",
      min: 0,
      max: 10
    }
  ],

  digestive: [
    {
      id: "duration",
      label: "How long have you had the digestive symptoms?",
      type: "text",
      placeholder: "e.g. Since last night"
    },
    {
      id: "vomiting",
      label: "Are you vomiting?",
      type: "select",
      options: ["No", "Sometimes", "Frequently"]
    },
    {
      id: "hydration",
      label: "Are you able to keep fluids down?",
      type: "select",
      options: ["Yes", "With difficulty", "No"]
    },
    {
      id: "severity",
      label: "How severe is the discomfort? (0–10)",
      type: "number",
      placeholder: "0–10",
      min: 0,
      max: 10
    }
  ],

  injury: [
    {
      id: "duration",
      label: "When did the injury happen?",
      type: "text",
      placeholder: "e.g. 3 hours ago"
    },
    {
      id: "location",
      label: "Where is the injury?",
      type: "text",
      placeholder: "e.g. Left ankle"
    },
    {
      id: "swelling",
      label: "Is there noticeable swelling?",
      type: "select",
      options: ["No", "A little", "Yes"]
    },
    {
      id: "severity",
      label: "How severe is the pain? (0–10)",
      type: "number",
      placeholder: "0–10",
      min: 0,
      max: 10
    }
  ],

  skin: [
    {
      id: "duration",
      label: "When did the skin symptoms begin?",
      type: "text",
      placeholder: "e.g. Yesterday"
    },
    {
      id: "spread",
      label: "Is the affected area changing or spreading?",
      type: "select",
      options: ["No", "Not sure", "Yes"]
    },
    {
      id: "swelling",
      label: "Is there significant swelling?",
      type: "select",
      options: ["No", "A little", "Yes"]
    },
    {
      id: "severity",
      label: "How uncomfortable is it? (0–10)",
      type: "number",
      placeholder: "0–10",
      min: 0,
      max: 10
    }
  ],

  urinary: [
    {
      id: "duration",
      label: "When did the urinary symptoms begin?",
      type: "text",
      placeholder: "e.g. 2 days ago"
    },
    {
      id: "pain",
      label: "Do you have pain or burning while urinating?",
      type: "select",
      options: ["No", "A little", "Yes"]
    },
    {
      id: "frequency",
      label: "Are you urinating more frequently than usual?",
      type: "select",
      options: ["No", "Not sure", "Yes"]
    },
    {
      id: "severity",
      label: "How uncomfortable are the symptoms? (0–10)",
      type: "number",
      placeholder: "0–10",
      min: 0,
      max: 10
    }
  ],

  general: [
    {
      id: "duration",
      label: "When did the symptoms begin?",
      type: "text",
      placeholder: "e.g. Today / 2 days ago"
    },
    {
      id: "severity",
      label: "How severe are the symptoms? (0–10)",
      type: "number",
      placeholder: "0–10",
      min: 0,
      max: 10
    },
    {
      id: "trend",
      label: "Are the symptoms changing?",
      type: "select",
      options: [
        "Getting better",
        "Staying the same",
        "Getting worse"
      ]
    }
  ]
};


/* =========================================================
   DETECT SYMPTOM CATEGORY
   ========================================================= */

function detectCategories(symptoms = "") {
  const text = symptoms.toLowerCase();

  const matches = [];

  for (const [category, keywords] of Object.entries(symptomCategories)) {
    const found = keywords.some(keyword => text.includes(keyword));

    if (found) {
      matches.push(category);
    }
  }

  return matches.length ? matches : ["general"];
}


/* =========================================================
   GET QUESTIONS
   ========================================================= */

function getQuestions(symptoms = "") {
  const categories = detectCategories(symptoms);

  // Use the first important category for the prototype.
  const category = categories[0];

  return {
    category,
    categories,
    questions: questionSets[category] || questionSets.general
  };
}


/* =========================================================
   LOCAL DEMO ASSESSMENT
   ========================================================= */

function demoAssessment(symptoms = "", answers = {}) {
  const text = `${symptoms} ${Object.values(answers).join(" ")}`.toLowerCase();

  const categories = detectCategories(symptoms);
  const primaryCategory = categories[0] || "general";

  const emergencyTerms = [
    "chest pain",
    "severe chest pain",
    "difficulty breathing",
    "can't breathe",
    "cannot breathe",
    "fainting",
    "unconscious",
    "seizure",
    "stroke",
    "heavy bleeding",
    "severe bleeding"
  ];

  const urgentTerms = [
    "very high fever",
    "persistent vomiting",
    "severe pain",
    "confusion",
    "dehydration",
    "blood in stool",
    "blood in vomit"
  ];

  let urgency = "Routine";
  let tone = "success";

  // Direct warning signs
  const emergencyDetected = emergencyTerms.some(term => text.includes(term));

  // Interview answers
  const severeSymptoms =
    Number(answers.severity) >= 8;

  const gettingWorse =
    answers.trend === "Getting worse";

  const breathingProblem =
    answers.breathing === "Yes";

  const poorHydration =
    answers.hydration === "No";

  const frequentVomiting =
    answers.vomiting === "Frequently";

  const spreading =
    answers.spread === "Yes";

  if (
    emergencyDetected ||
    breathingProblem ||
    (severeSymptoms && gettingWorse)
  ) {
    urgency = "Emergency";
    tone = "danger";
  } else if (
    urgentTerms.some(term => text.includes(term)) ||
    severeSymptoms ||
    gettingWorse ||
    frequentVomiting ||
    poorHydration ||
    spreading
  ) {
    urgency = "Urgent";
    tone = "warning";
  }

  const categoryGuidance = {
    respiratory: [
      "Monitor your breathing.",
      "Rest and avoid heavy activity.",
      "Get medical advice if it gets worse."
    ],

    fever: [
      "Rest and drink enough fluids.",
      "Track your temperature.",
      "Get medical advice if fever continues."
    ],

    headache: [
      "Rest in a quiet place.",
      "Drink enough fluids.",
      "Get medical advice if the pain gets worse."
    ],

    digestive: [
      "Rest and drink enough fluids.",
      "Track changes in your symptoms.",
      "Get medical advice if symptoms continue."
    ],

    pain: [
      "Rest the affected area.",
      "Watch for changes in pain.",
      "Get medical advice if pain gets worse."
    ],

    skin: [
      "Keep the affected area clean.",
      "Watch for changes in the skin.",
      "Get medical advice if it spreads or worsens."
    ],

    injury: [
      "Rest the affected area.",
      "Watch for increasing pain or swelling.",
      "Get medical advice if it gets worse."
    ],

    urinary: [
      "Drink enough fluids.",
      "Track changes in your symptoms.",
      "Get medical advice if symptoms continue."
    ],

    general: [
      "Monitor your symptoms.",
      "Rest and stay hydrated.",
      "Get medical advice if symptoms continue."
    ]
  };

  let summary;

  if (urgency === "Emergency") {
    summary = "Some warning signs need urgent medical attention.";
  } else if (urgency === "Urgent") {
    summary = "Your answers suggest that medical advice may be needed soon.";
  } else if (primaryCategory === "digestive") {
    summary = "Your symptoms mainly relate to your digestive system.";
  } else if (primaryCategory === "respiratory") {
    summary = "Your symptoms mainly relate to your breathing.";
  } else if (primaryCategory === "headache") {
    summary = "Your symptoms mainly involve headache or head discomfort.";
  } else if (primaryCategory === "fever") {
    summary = "Your symptoms include signs commonly linked with fever.";
  } else {
    summary = "Your symptoms were reviewed using the information you provided.";
  }

  let guidance;

  if (urgency === "Emergency") {
    guidance = [
      "Seek urgent medical care now.",
      "Contact your local emergency service if needed.",
      "Do not rely on this app for diagnosis."
    ];
  } else if (urgency === "Urgent") {
    guidance = [
      "Consider getting medical advice soon.",
      "Monitor your symptoms closely.",
      "Get urgent help if symptoms become severe."
    ];
  } else {
    guidance = categoryGuidance[primaryCategory] || categoryGuidance.general;
  }

  return {
    urgency,
    tone,
    summary,
    guidance,
    followUps: questionSets[primaryCategory] || questionSets.general || [],
    disclaimer:
      "Prototype only. Not a diagnosis or treatment plan."
  };
}


/* =========================================================
   AI ASSESSMENT
   ========================================================= */

async function aiAssessment(symptoms, answers) {

  // No API key = use our local intelligent prototype.
  if (!process.env.OPENAI_API_KEY) {
    return demoAssessment(symptoms, answers);
  }

  try {

    const OpenAI = require("openai");

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    const prompt = `
You are the safety-focused reasoning layer of a student prototype called AarogyaCare AI.

Goal:
Provide educational health guidance and urgency support, NOT a diagnosis.

Return strict JSON:

{
  "urgency": "Routine|Urgent|Emergency",
  "summary": "string",
  "guidance": ["string", "string", "string"],
  "followUps": ["string", "string", "string"],
  "disclaimer": "string"
}

Rules:
- Do not diagnose diseases.
- Do not prescribe medication.
- Do not invent medical test results.
- If a potentially life-threatening warning sign is present, use Emergency.
- Keep language clear and concise.
- Ask relevant follow-up questions based on the user's symptoms.
- Clearly encourage professional care when appropriate.

Symptoms:
${symptoms}

Follow-up answers:
${JSON.stringify(answers)}
`;

    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-6-luna",
      input: prompt
    });

    const raw = (response.output_text || "").trim();

    const clean = raw
      .replace(/^```json\s*/i, "")
      .replace(/```$/i, "")
      .trim();

    const parsed = JSON.parse(clean);

    return {
      ...parsed,

      tone:
        parsed.urgency === "Emergency"
          ? "danger"
          : parsed.urgency === "Urgent"
            ? "warning"
            : "success",

      disclaimer:
        parsed.disclaimer ||
        "Prototype only. Not a diagnosis, prescription, or substitute for professional medical care."
    };

  } catch (err) {

    console.error("AI fallback:", err.message);

    return demoAssessment(symptoms, answers);
  }
}


/* =========================================================
   QUESTIONS API
   ========================================================= */

app.post("/api/questions", (req, res) => {

  const { symptoms = "" } = req.body || {};

  if (!symptoms.trim()) {
    return res.status(400).json({
      error: "Please enter your symptoms."
    });
  }

  res.json(getQuestions(symptoms));
});


/* =========================================================
   ASSESSMENT API
   ========================================================= */

app.post("/api/assess", async (req, res) => {

  const {
    symptoms = "",
    answers = {}
  } = req.body || {};

  if (!symptoms.trim()) {
    return res.status(400).json({
      error: "Please enter your symptoms."
    });
  }

  const result = await aiAssessment(symptoms, answers);

  res.json({
    ...result,
    createdAt: new Date().toISOString()
  });
});


/* =========================================================
   REPORTS
   ========================================================= */

app.get("/api/reports", (req, res) => {

  try {

    const data =
      JSON.parse(
        fs.readFileSync(REPORT_FILE, "utf8")
      );

    res.json(data);

  } catch {

    res.json([]);

  }
});


app.post("/api/reports", (req, res) => {

  try {

    const report = {
      id: `R-${Date.now()}`,
      createdAt: new Date().toISOString(),
      ...req.body
    };

    const data =
      JSON.parse(
        fs.readFileSync(REPORT_FILE, "utf8")
      );

    data.unshift(report);

    fs.writeFileSync(
      REPORT_FILE,
      JSON.stringify(data.slice(0, 100), null, 2)
    );

    res.json(report);

  } catch {

    res.status(500).json({
      error: "Could not save report."
    });

  }
});


/* =========================================================
   FRONTEND
   ========================================================= */

app.use((req, res) => {

  res.sendFile(
    path.join(__dirname, "public", "index.html")
  );

});


/* =========================================================
   START SERVER
   ========================================================= */

app.listen(PORT, () => {

  console.log(
    `AarogyaCare AI running at http://localhost:${PORT}`
  );

});