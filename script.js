const CHALLENGE = {
  title: "Factors & Sum",
  description: "Given a positive integer N, write a program to print all factors of N in ascending order and calculate their sum.",
  sampleInput: "12",
  sampleOutput: "1 2 3 4 6 12\\n28",
  timeLimit: 15 * 60,
  tests: [1, 2, 12, 17, 25, 36, 100, 999, 1000, 9973]
};

const JUDGE_URL = "https://ce.judge0.com/submissions?base64_encoded=false&wait=true";
let remaining = CHALLENGE.timeLimit;
let timerId = null;
let started = false;
let submitted = false;

const $ = id => document.getElementById(id);

function updateTimer() {
  const m = Math.floor(remaining / 60);
  const s = remaining % 60;
  $("timer").textContent = m + ":" + String(s).padStart(2, "0");
  $("timer").classList.toggle("urgent", remaining <= 60);
}

function startTimer() {
  if (started || submitted) return;
  started = true;
  $("statusNote").textContent = "Timer started. Trust your memory — the editor is supposed to stay blank.";
  timerId = setInterval(() => {
    remaining--;
    updateTimer();
    if (remaining <= 0) {
      clearInterval(timerId);
      submitChallenge(true);
    }
  }, 1000);
}

function normalizeOutput(value) {
  return String(value ?? "").replace(/\\r/g, "").trim().split(/\\s+/).join(" ");
}

function expectedOutput(n) {
  const factors = [];
  let sum = 0;
  for (let i = 1; i <= n; i++) {
    if (n % i === 0) { factors.push(i); sum += i; }
  }
  return factors.join(" ") + " " + sum;
}

async function execute(sourceCode, languageId, input) {
  try {
    const response = await fetch(JUDGE_URL, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({
        language_id: Number(languageId),
        source_code: sourceCode,
        stdin: String(input),
        cpu_time_limit: 2,
        wall_time_limit: 4,
        memory_limit: 128000
      })
    });
    if (!response.ok) throw new Error("Judge service returned HTTP " + response.status);
    return await response.json();
  } catch (error) {
    return {status: {id: -1, description: "Judge unavailable"}, stderr: error.message};
  }
}

function renderTest(index, passed, detail) {
  return '<div class="test ' + (passed ? "pass" : "fail") + '"><b>Test ' + (index + 1) + ': ' + (passed ? "✓ Passed" : "✕ Failed") + '</b><small>' + detail + '</small></div>';
}

async function runSample() {
  const code = $("editor").value;
  if (!code.trim()) {
    showResult("Nothing to run", "The blind editor is empty. Start typing your solution first.", "0 / 100", "");
    return;
  }
  startTimer();
  $("runSample").disabled = true;
  $("submit").disabled = true;
  showResult("Running sample…", "Checking your program with N = 12.", "—", "");
  const result = await execute(code, $("language").value, CHALLENGE.sampleInput);
  $("runSample").disabled = false;
  $("submit").disabled = false;
  if (result.status?.id === 3) {
    const actual = normalizeOutput(result.stdout);
    const expected = normalizeOutput(CHALLENGE.sampleOutput);
    showResult(actual === expected ? "Sample passed ✓" : "Sample output differs",
      "Expected: " + expected + "\\nGot: " + (actual || "(no output)"), "SAMPLE", "");
  } else {
    showResult("Sample failed", result.compile_output || result.stderr || result.status?.description || "Execution failed.", "SAMPLE", "");
  }
}

async function submitChallenge(timeExpired = false) {
  if (submitted) return;
  const code = $("editor").value;
  if (!code.trim() && !timeExpired) {
    showResult("Nothing to submit", "Type your solution before submitting.", "0 / 100", "");
    return;
  }

  submitted = true;
  clearInterval(timerId);
  $("submit").disabled = true;
  $("runSample").disabled = true;
  $("language").disabled = true;
  $("clearCode").disabled = true;
  showResult(timeExpired ? "Time's up" : "Judging…", "Running 10 hidden test cases. One passed case = 10 points.", "—", "");

  let passed = 0;
  let html = "";
  for (let i = 0; i < CHALLENGE.tests.length; i++) {
    const input = CHALLENGE.tests[i];
    const result = await execute(code, $("language").value, input);
    if (result.status?.id === 3) {
      const actual = normalizeOutput(result.stdout);
      const expected = normalizeOutput(expectedOutput(input));
      const ok = actual === expected;
      if (ok) passed++;
      html += renderTest(i, ok, ok ? "Hidden test passed" : "Output did not match");
    } else {
      const detail = result.compile_output || result.stderr || result.status?.description || "Execution failed";
      html += renderTest(i, false, String(detail).slice(0, 140));
    }
  }

  const score = passed * 10;
  $("result").classList.remove("hidden");
  $("resultTitle").textContent = score === 100 ? "Perfect score! 🎯" : "Challenge complete";
  $("resultText").textContent = passed + "/10 hidden tests passed. Score: " + score + "/100. " + (timeExpired ? "The time limit was reached." : "Time is only a tiebreaker.");
  $("score").textContent = score + " / 100";
  $("tests").innerHTML = html;
}

function showResult(title, text, score, tests) {
  $("result").classList.remove("hidden");
  $("resultTitle").textContent = title;
  $("resultText").textContent = text;
  $("score").textContent = score;
  $("tests").innerHTML = tests;
}

$("editor").addEventListener("focus", startTimer);
$("editor").addEventListener("input", () => $("blindOverlay").classList.add("typing"));
["paste", "cut", "copy", "drop"].forEach(eventName => $("editor").addEventListener(eventName, event => event.preventDefault()));
$("editor").addEventListener("contextmenu", event => event.preventDefault());
$("editor").addEventListener("keydown", event => {
  if ((event.ctrlKey || event.metaKey) && ["v", "c", "x"].includes(event.key.toLowerCase())) event.preventDefault();
});
$("runSample").addEventListener("click", runSample);
$("submit").addEventListener("click", () => submitChallenge(false));
$("clearCode").addEventListener("click", () => {
  if (!submitted) { $("editor").value = ""; $("editor").focus(); }
});
updateTimer();