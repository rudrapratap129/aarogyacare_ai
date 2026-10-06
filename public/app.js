const state = {
  symptoms: "",
  answers: {},
  result: null,
  reports: [],
  timeline: JSON.parse(localStorage.getItem("aarogyaTimeline") || "[]")
};

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];

function showPage(name) {
  $$(".page").forEach(p => p.classList.remove("active"));
  const target = $(`#page-${name}`);
  if (target) target.classList.add("active");
  $$(".main-nav button").forEach(b => b.classList.toggle("active", b.dataset.page === name));
  window.scrollTo({ top: 0, behavior: "smooth" });
  refreshDashboard();
}

$$("[data-page]").forEach(el => {
  el.addEventListener("click", (e) => {
    const page = e.currentTarget.dataset.page;
    if (page) showPage(page);
  });
});

$$(".quick-chips button").forEach(btn => {
  btn.addEventListener("click", () => {
    $("#symptoms").value = btn.dataset.symptom;
  });
});

async function getQuestions(symptoms) {
  const response = await fetch("/api/questions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ symptoms })
  });

  if (!response.ok) {
    throw new Error("Could not load questions");
  }

  return await response.json();
}

$("#startInterview").addEventListener("click", async () => {
  const value = $("#symptoms").value.trim();

  if (!value) {
    alert("Please enter your symptoms first.");
    return;
  }

  state.symptoms = value;

  const btn = $("#startInterview");
  btn.disabled = true;
  btn.textContent = "Preparing questions…";

  try {
    const data = await getQuestions(value);

    $("#questionList").innerHTML = data.questions.map(q => {
      if (q.type === "select") {
        return `
          <div class="question">
            <label>${escapeHtml(q.label)}</label>
            <select data-q="${escapeHtml(q.id)}">
              ${q.options.map(o =>
                `<option>${escapeHtml(o)}</option>`
              ).join("")}
            </select>
          </div>
        `;
      }

      return `
        <div class="question">
          <label>${escapeHtml(q.label)}</label>
          <input
            data-q="${escapeHtml(q.id)}"
            type="${escapeHtml(q.type)}"
            placeholder="${escapeHtml(q.placeholder || "")}"
            ${q.min !== undefined ? `min="${q.min}" max="${q.max}"` : ""}
          >
        </div>
      `;
    }).join("");

    showPage("interview");

  } catch (error) {
    console.error(error);
    alert("Could not prepare the interview. Please try again.");
  } finally {
    btn.disabled = false;
    btn.textContent = "Continue to AI interview →";
  }
});

async function assessSymptoms() {
  state.answers = {};
  $$("#questionList [data-q]").forEach(el => state.answers[el.dataset.q] = el.value);

  const btn = $("#runAssessment");
  btn.disabled = true; btn.textContent = "Analyzing…";

  try {
    const resp = await fetch("/api/assess", {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ symptoms: state.symptoms, answers: state.answers })
    });
    if (!resp.ok) throw new Error("Assessment failed");
    state.result = await resp.json();
  } catch {
    state.result = localDemo(state.symptoms, state.answers);
  } finally {
    btn.disabled = false; btn.textContent = "Generate health guidance →";
  }

  renderResult();
  addTimelineEvent("AI health assessment", state.result.urgency, state.symptoms);
  showPage("result");
}

$("#runAssessment").addEventListener("click", assessSymptoms);

function localDemo(symptoms, answers) {
  const t = (symptoms + " " + Object.values(answers).join(" ")).toLowerCase();
  const emergency = ["chest pain","difficulty breathing","can't breathe","cannot breathe","fainting","unconscious","seizure","heavy bleeding","severe bleeding"].some(k => t.includes(k));
  const urgent = ["very high fever","persistent vomiting","severe pain","confusion","dehydration","blood in stool","blood in vomit"].some(k => t.includes(k));
  const urgency = emergency ? "Emergency" : urgent ? "Urgent" : "Routine";
  return {
    urgency,
    tone: emergency ? "danger" : urgent ? "warning" : "success",
    summary: `AarogyaCare AI demo assessment for: ${symptoms}`,
    guidance: emergency ? [
      "A potentially serious warning sign was detected by the prototype.",
      "Seek urgent professional/emergency care now.",
      "Do not use the app as a diagnosis or treatment plan."
    ] : urgent ? [
      "The information entered may deserve prompt medical review.",
      "Arrange medical advice soon, especially if symptoms are worsening.",
      "Use the generated summary to explain your symptoms clearly."
    ] : [
      "Monitor symptoms and note how they change.",
      "Rest and maintain ordinary hydration as appropriate.",
      "Seek professional advice if symptoms persist, worsen, or concern you."
    ],
    disclaimer: "Prototype only. Not a diagnosis, prescription, or substitute for professional medical care.",
    createdAt: new Date().toISOString()
  };
}

function renderResult() {
  const r = state.result;
  $("#urgencyBadge").textContent = r.urgency;
  $("#urgencyBadge").className = `urgency-badge ${r.tone || "success"}`;
  $("#resultSummary").textContent = r.summary;
  $("#guidanceList").innerHTML = (r.guidance || []).map(x => `<div class="guidance-item"><span>✓</span><div>${escapeHtml(x)}</div></div>`).join("");
  $("#resultDisclaimer").textContent = r.disclaimer || "";
  if (r.urgency === "Emergency") {
    document.title = "⚠ AarogyaCare AI — Urgent";
  } else document.title = "AarogyaCare AI";
}

$("#saveReport").addEventListener("click", () => saveReport("User report"));
$("#doctorReport").addEventListener("click", () => saveReport("Doctor summary"));

async function saveReport(type) {
  if (!state.result) return;
  const report = {
    type,
    symptoms: state.symptoms,
    urgency: state.result.urgency,
    summary: state.result.summary,
    guidance: state.result.guidance,
    createdAt: state.result.createdAt || new Date().toISOString()
  };
  try {
    const resp = await fetch("/api/reports", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(report) });
    const saved = await resp.json();
    state.reports.unshift(saved);
  } catch {
    report.id = `LOCAL-${Date.now()}`;
    state.reports.unshift(report);
    localStorage.setItem("aarogyaReports", JSON.stringify(state.reports));
  }
  renderReports();
  refreshDashboard();
  alert(`${type} saved.`);
  showPage("reports");
}

async function loadReports() {
  try {
    const resp = await fetch("/api/reports");
    state.reports = await resp.json();
  } catch {
    state.reports = JSON.parse(localStorage.getItem("aarogyaReports") || "[]");
  }
  renderReports();
  refreshDashboard();
}

function renderReports(activeTab = "user") {
  const list = $("#reportsList");
  const filtered = state.reports.filter(r => activeTab === "user" ? r.type === "User report" : r.type === "Doctor summary");
  if (!filtered.length) {
    list.innerHTML = `<div class="empty">No ${activeTab === "user" ? "user reports" : "doctor summaries"} yet. Start a symptom check to create one.</div>`;
    return;
  }
  list.innerHTML = filtered.map(r => `
    <article class="report-card">
      <div>
        <h3>${escapeHtml(r.type)} · ${escapeHtml(r.urgency)}</h3>
        <p>${escapeHtml(r.summary || r.symptoms || "")}</p>
      </div>
      <div class="report-meta">${formatDate(r.createdAt)}</div>
    </article>`).join("");
}

$$(".tab").forEach(tab => tab.addEventListener("click", () => {
  $$(".tab").forEach(t => t.classList.remove("active"));
  tab.classList.add("active");
  renderReports(tab.dataset.tab);
}));

function addTimelineEvent(title, urgency, detail) {
  const item = { title, urgency, detail, date: new Date().toISOString() };
  state.timeline.unshift(item);
  state.timeline = state.timeline.slice(0, 50);
  localStorage.setItem("aarogyaTimeline", JSON.stringify(state.timeline));
  renderTimeline();
}

function renderTimeline() {
  const list = $("#timelineList");
  if (!state.timeline.length) {
    list.innerHTML = `<div class="empty">Your health timeline is empty. Start a symptom check to begin tracking.</div>`;
    return;
  }
  list.innerHTML = state.timeline.map(x => `
    <div class="timeline-item">
      <div class="timeline-dot"></div>
      <div class="timeline-card">
        <strong>${escapeHtml(x.title)} · ${escapeHtml(x.urgency)}</strong>
        <small>${formatDate(x.date)}</small>
        <p>${escapeHtml(x.detail || "")}</p>
      </div>
    </div>`).join("");
}

function refreshDashboard() {
  const totalReports = state.reports.length;
  const totalChecks = state.timeline.length;

  const urgentCount = state.timeline.filter(
    x => x.urgency === "Urgent" || x.urgency === "Emergency"
  ).length;

  const lastCheck = state.timeline[0];

  $("#reportCount").textContent = totalReports;
  $("#checkCount").textContent = totalChecks;

  $("#themeLabel").textContent =
    document.documentElement.dataset.theme === "dark"
      ? "Dark"
      : "Light";

  const lang =
    $("#languageSelect").value === "hi"
      ? "हिन्दी"
      : "English";

  $("#languageLabel").textContent = lang;

  // Recent activity
  const recent = state.timeline.slice(0, 4);

  $("#recentActivity").innerHTML = recent.length
    ? recent.map(x => `
        <div class="activity-item">
          <span class="activity-dot"></span>
          <div>
            <strong>${escapeHtml(x.title)}</strong>
            <small>${formatDate(x.date)}</small>
          </div>
        </div>
      `).join("")
    : `<div class="empty">No recent activity.</div>`;

  // Wellness summary
  const wellnessScore = $("#wellnessScore");
const wellnessText = $("#wellnessText");

if (wellnessScore && wellnessText) {
  const urgentCount = state.timeline.filter(
    x => x.urgency === "Urgent" || x.urgency === "Emergency"
  ).length;

  let score = 72;

  if (state.timeline.length > 0) {
    score = Math.max(40, 90 - urgentCount * 15);
  }

  wellnessScore.textContent = score;

  if (urgentCount > 0) {
    wellnessText.innerHTML = `
      <p>You have ${urgentCount} check${urgentCount === 1 ? "" : "s"} that need attention.</p>
      <p>Keep monitoring your symptoms.</p>
    `;
  } else if (state.timeline.length > 0) {
    wellnessText.innerHTML = `
      <p>No urgent checks in your recent history.</p>
      <p>Keep tracking how you feel.</p>
    `;
  } else {
    wellnessText.innerHTML = `
      <p>No health checks yet.</p>
      <p>Start your first symptom check.</p>
    `;
  }
}
}

$("#themeBtn").addEventListener("click", () => {
  const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = next === "dark" ? "dark" : "";
  localStorage.setItem("aarogyaTheme", next);
  refreshDashboard();
});

$("#languageSelect").addEventListener("change", () => {
  refreshDashboard();
});

function formatDate(value) {
  try { return new Intl.DateTimeFormat("en-IN", { dateStyle:"medium", timeStyle:"short" }).format(new Date(value)); }
  catch { return value || ""; }
}
function escapeHtml(s = "") {
  return String(s).replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;" }[c]));
}

const savedTheme = localStorage.getItem("aarogyaTheme");
if (savedTheme === "dark") document.documentElement.dataset.theme = "dark";

loadReports();
renderTimeline();
refreshDashboard();
showPage("home");
