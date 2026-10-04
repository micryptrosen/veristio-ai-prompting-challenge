const checklistItems = [
  {
    key: "goal",
    label: "Goal / task clarity",
    terms: ["write", "draft", "create", "summarize", "compare", "explain", "plan", "help", "analyze", "make"]
  },
  {
    key: "context",
    label: "Context",
    terms: ["context", "background", "because", "situation", "for a", "about", "scenario", "details"]
  },
  {
    key: "constraints",
    label: "Constraints",
    terms: ["must", "avoid", "under", "limit", "only", "include", "exclude", "constraint", "no more than"]
  },
  {
    key: "audience",
    label: "Audience",
    terms: ["audience", "client", "customer", "student", "team", "manager", "reader", "beginner", "executive"]
  },
  {
    key: "format",
    label: "Output format",
    terms: ["format", "bullets", "table", "email", "checklist", "outline", "json", "steps", "markdown"]
  },
  {
    key: "examples",
    label: "Examples / source notes",
    terms: ["example", "source", "notes", "use this", "based on", "reference", "sample", "facts"]
  },
  {
    key: "review",
    label: "Review criteria",
    terms: ["check", "review", "criteria", "verify", "revise", "ensure", "before final", "quality"]
  }
];

const samples = {
  beginner: {
    weak: "Help me write better.",
    gaps: ["context", "constraints", "audience", "format", "review"],
    stronger: "Draft a polite email to my teacher asking for clarification about one homework question.\n\nContext: I understand questions one and two, but question three is unclear to me.\nAudience: My teacher.\nConstraints: Keep it under 120 words, be respectful, and ask one specific question.\nOutput format: Email draft with subject line.\nReview criteria: Before finalizing, check that the email is polite, specific, and easy to answer."
  },
  practical: {
    weak: "Make a social post for my business.",
    gaps: ["goal", "context", "constraints", "audience", "format", "review"],
    stronger: "Create a LinkedIn post for a local bookkeeping service.\n\nGoal: Announce a free consultation week and encourage small business owners to book a call.\nContext: The audience may feel behind on receipts and tax prep.\nAudience: Small business owners.\nTone: Calm, practical, and trustworthy.\nConstraints: Under 150 words, no scare tactics, include one clear call to action.\nOutput format: Post copy plus three hashtag ideas.\nReview criteria: Check that the post is clear, non-pushy, and easy to act on."
  },
  advanced: {
    weak: "Analyze this project plan.",
    gaps: ["context", "constraints", "audience", "format", "examples", "review"],
    stronger: "Analyze a software project plan for launch risk.\n\nContext: The team has two weeks left before launch, three unresolved accessibility issues, and no final QA owner.\nAudience: Product lead and engineering manager.\nConstraints: Do not invent missing data. Separate facts from assumptions. Prioritize risks by launch impact.\nSource notes: Use only the facts provided above.\nOutput format: Table with columns for risk, evidence, severity, mitigation, and owner question.\nReview criteria: Before finalizing, check that each risk is tied to evidence, uncertainty is explicit, and each mitigation has a clear next action."
  }
};

const modeSelect = document.querySelector("#mode-select");
const scenarioSelect = document.querySelector("#scenario-select");
const scenarioNames = {
  beginner: ["Teacher email", "Explain a topic"],
  practical: ["Business social post", "Meeting agenda"],
  advanced: ["Project risk", "Evidence comparison"]
};
const extraScenarios = {
  beginner: {
    weak: "Explain it to me.",
    gaps: ["goal", "context", "audience", "format", "review"],
    stronger: "Explain how a household budget works. Context: I am planning my first monthly budget. Audience: A beginner. Constraints: Use plain language and avoid financial advice. Output format: Five steps and an example using fictional amounts. Review criteria: Check that income, expenses and savings are distinguished."
  },
  practical: {
    weak: "Plan a meeting.",
    gaps: ["context", "constraints", "audience", "format", "review"],
    stronger: "Create a 30-minute team meeting agenda. Context: We need to choose the next task for a small website project. Audience: The project team. Constraints: Include time limits and one decision point. Source notes: No new budget is available. Output format: Table of topics, minutes and owner. Review criteria: Check that topics fit 30 minutes and end with next steps."
  },
  advanced: {
    weak: "Which option is best?",
    gaps: ["goal", "context", "constraints", "examples", "review"],
    stronger: "Compare two software options using supplied source notes. Context: A small team needs an accessible task tracker. Audience: The team manager. Constraints: Do not invent pricing or capabilities; separate evidence from assumptions. Source notes: Paste the option facts here before using this prompt. Output format: Comparison table with evidence gaps and owner questions. Review criteria: Check that every recommendation is tied to supplied facts."
  }
};

function selectedScenario() {
  return scenarioSelect.value === "1" ? extraScenarios[modeSelect.value] : samples[modeSelect.value];
}

function refreshScenarioChoices() {
  scenarioSelect.innerHTML = "";
  scenarioNames[modeSelect.value].forEach((name, index) => {
    const option = document.createElement("option");
    option.value = String(index);
    option.textContent = name;
    scenarioSelect.appendChild(option);
  });
  scenarioSelect.value = "0";
}
const weakPrompt = document.querySelector("#weak-prompt");
const improvedPrompt = document.querySelector("#improved-prompt");
const missingElements = document.querySelector("#missing-elements");
const checklistOutput = document.querySelector("#checklist-output");
const feedbackOutput = document.querySelector("#feedback-output");
const strongerOutput = document.querySelector("#stronger-output");
const scoreOutput = document.querySelector("#score-output");
const scoreLabel = document.querySelector("#score-label");
const analysisSource = document.querySelector("#analysis-source");
const statusOutput = document.querySelector("#challenge-status");
const loadSampleButton = document.querySelector("#load-sample");
const analyzeButton = document.querySelector("#analyze-prompt");
const strongerButton = document.querySelector("#show-stronger");
const copyButton = document.querySelector("#copy-prompt");
const resetButton = document.querySelector("#reset-challenge");
let analysisSnapshot = null;
let copyOperation = 0;

function inputSnapshot() {
  return JSON.stringify([weakPrompt.value, improvedPrompt.value, modeSelect.value, scenarioSelect.value, getCheckedGaps()]);
}

function invalidateCopyAnalysis() {
  analysisSnapshot = null;
  copyOperation += 1;
}

function analysisIsCurrent() {
  return analysisSnapshot && analysisSnapshot.inputs === inputSnapshot();
}

function normalize(text) {
  return text.trim().toLowerCase();
}

function detectSignals(promptText) {
  const text = normalize(promptText);
  const found = {};

  checklistItems.forEach((item) => {
    found[item.key] = item.terms.some((term) => text.includes(term));
  });

  return found;
}

function getCheckedGaps() {
  return Array.from(missingElements.querySelectorAll("input:checked")).map((input) => input.value);
}

function renderChecklist(signals, promptText) {
  checklistOutput.innerHTML = "";

  checklistItems.forEach((item) => {
    const li = document.createElement("li");
    li.className = signals[item.key] ? "met" : "missing";
    const term = item.terms.find((term) => normalize(promptText).includes(term));
    li.textContent = signals[item.key]
      ? `Wording signal found: ${item.label} (matched text: "${term}")`
      : `Wording signal not found: ${item.label}`;
    checklistOutput.appendChild(li);
  });
}

function buildFeedback(signals) {
  const missing = checklistItems.filter((item) => !signals[item.key]);
  const checkedGaps = getCheckedGaps();
  const score = checklistItems.length - missing.length;

  if (!normalize(improvedPrompt.value) && normalize(weakPrompt.value)) {
    return "Now write an improved prompt. Try adding the gaps you checked before analyzing again.";
  }

  if (!normalize(improvedPrompt.value) && !normalize(weakPrompt.value)) {
    return "Start by loading a sample or entering a weak prompt, then write a stronger version.";
  }

  if (score === checklistItems.length) {
    return "Wording signals found in all seven categories. Keywords alone do not establish clarity, completeness, or usefulness. Review whether each instruction actually fits your task.";
  }

  const missingLabels = missing.map((item) => item.label.toLowerCase()).join(", ");
  const hintSelection = checkedGaps.length
    ? ` ${checkedGaps.length} gap hint${checkedGaps.length === 1 ? " is" : "s are"} currently selected; these may include sample-provided hints. Selections do not establish discovery or understanding.`
    : " No gap hints are currently selected. Hint selections are separate from revision wording analysis.";

  return `No listed wording signal found for: ${missingLabels}. The idea may still be expressed in other words; review the meaning yourself.${hintSelection}`;
}

function analyzePrompt() {
  invalidateCopyAnalysis();
  const revision = improvedPrompt.value.trim();
  const baseline = weakPrompt.value.trim();
  const hasRevision = Boolean(revision) && normalize(revision) !== normalize(baseline);
  const text = hasRevision ? revision : baseline;
  const signals = detectSignals(text);
  const score = Object.values(signals).filter(Boolean).length;

  renderChecklist(signals, text);
  scoreOutput.textContent = text ? `${score} / ${checklistItems.length}` : "Not analyzed";
  scoreLabel.textContent = hasRevision ? "Revision checklist signals" : "Baseline checklist signals";
  analysisSource.textContent = hasRevision
    ? "Analyzing revision input. Counts reflect literal substring matches, including negated words and words inside other words; not semantic quality or proof of improvement."
    : baseline ? "Analyzing weak baseline only; awaiting a changed revision. Counts are literal wording matches, not semantic quality."
      : "No prompt analyzed; awaiting a baseline or revision.";
  feedbackOutput.textContent = hasRevision ? buildFeedback(signals)
    : baseline ? "Baseline only. Write a changed revision before evaluating revision checklist signals."
      : "Start by loading a sample or entering a weak prompt, then write a stronger version.";
  statusOutput.textContent = hasRevision ? "Revision wording analyzed" : "Awaiting revision";
  if (hasRevision) analysisSnapshot = { inputs: inputSnapshot() };
}

function loadSample() {
  const sample = selectedScenario();
  weakPrompt.value = sample.weak;
  improvedPrompt.value = "";
  strongerOutput.textContent = "Choose Show stronger version to compare against a structured sample.";

  missingElements.querySelectorAll("input").forEach((input) => {
    input.checked = sample.gaps.includes(input.value);
  });

  analyzePrompt();
  const name = scenarioNames[modeSelect.value][scenarioSelect.value === "1" ? 1 : 0];
  statusOutput.textContent = `${name} baseline loaded; awaiting revision`;
}

function showStrongerVersion() {
  copyOperation += 1;
  const sample = selectedScenario();
  const name = scenarioNames[modeSelect.value][scenarioSelect.value === "1" ? 1 : 0];
  strongerOutput.textContent = `Example scenario: ${name}\n\n${sample.stronger}`;
  statusOutput.textContent = "Example revealed (not your revision)";
}

function selectImprovedPrompt() {
  improvedPrompt.focus();
  improvedPrompt.select();
}

async function copyImprovedPrompt() {
  const operation = ++copyOperation;
  const text = improvedPrompt.value.trim();

  if (!text) {
    statusOutput.textContent = "Nothing to copy";
    return;
  }

  if (!analysisIsCurrent()) {
    statusOutput.textContent = "Analyze the current revision before copying";
    return;
  }

  const snapshot = analysisSnapshot;
  const canComplete = () => operation === copyOperation && snapshot === analysisSnapshot && analysisIsCurrent();

  if (!navigator.clipboard) {
    statusOutput.textContent = "Select text to copy";
    selectImprovedPrompt();
    return;
  }

  try {
    await navigator.clipboard.writeText(text);
    if (!canComplete()) return;
    statusOutput.textContent = "Copied";
  } catch {
    if (!canComplete()) return;
    statusOutput.textContent = "Copy blocked; text selected";
    selectImprovedPrompt();
  }
}

function resetChallenge() {
  invalidateCopyAnalysis();
  refreshScenarioChoices();
  weakPrompt.value = "";
  improvedPrompt.value = "";
  missingElements.querySelectorAll("input").forEach((input) => {
    input.checked = false;
  });
  checklistOutput.innerHTML = "<li>Load or enter a prompt, then analyze your improved version.</li>";
  feedbackOutput.textContent = "A stronger prompt usually names the task, gives context, sets boundaries, and explains how the answer should be judged.";
  strongerOutput.textContent = "Choose Show stronger version to compare against a structured sample.";
  scoreOutput.textContent = "Not analyzed";
  scoreLabel.textContent = "Checklist signals";
  analysisSource.textContent = "No prompt analyzed; awaiting a baseline or revision.";
  statusOutput.textContent = "Local challenge";
}

loadSampleButton.addEventListener("click", loadSample);
analyzeButton.addEventListener("click", analyzePrompt);
strongerButton.addEventListener("click", showStrongerVersion);
copyButton.addEventListener("click", copyImprovedPrompt);
resetButton.addEventListener("click", resetChallenge);
modeSelect.addEventListener("change", () => {
  invalidateCopyAnalysis();
  refreshScenarioChoices();
  strongerOutput.textContent = "Choose Show stronger version to compare against a structured sample.";
  statusOutput.textContent = `${modeSelect.options[modeSelect.selectedIndex].text} mode`;
});
scenarioSelect.addEventListener("change", () => {
  invalidateCopyAnalysis();
  strongerOutput.textContent = "Choose Show stronger version to compare against a structured sample.";
  statusOutput.textContent = "Scenario selected; baseline and revision unchanged";
});

[weakPrompt, improvedPrompt].forEach((field) => field.addEventListener("input", () => {
  invalidateCopyAnalysis();
  scoreOutput.textContent = "Not analyzed";
  scoreLabel.textContent = "Checklist signals";
  const hasRevision = normalize(improvedPrompt.value) && normalize(improvedPrompt.value) !== normalize(weakPrompt.value);
  analysisSource.textContent = hasRevision ? "Revision input changed; not yet analyzed."
    : "Baseline only or empty; awaiting a changed revision.";
  checklistOutput.innerHTML = "";
  feedbackOutput.textContent = "Current input has not been analyzed.";
  statusOutput.textContent = hasRevision ? "Revision entered; not analyzed" : "Awaiting revision";
}));
missingElements.addEventListener("change", () => {
  invalidateCopyAnalysis();
  statusOutput.textContent = "Hint selections changed; analyze before copying";
});
