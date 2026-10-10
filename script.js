const LANGUAGE_NAMES = {"50":"C","54":"C++","71":"Python","62":"Java"};
const CHALLENGES = {
  1: {
    title:"Sum of Two Numbers",
    description:"This program should print the sum of a and b. Find and fix the bug.",
    expected:"30", timeLimit:5*60, marks:10,
    code:{
      "50":'#include <stdio.h>\nint main(void) {\n    int a = 10, b = 20;\n    int sum = a - b;\n    printf("%d\\n", sum);\n    return 0;\n}',
      "54":'#include <iostream>\nusing namespace std;\nint main() {\n    int a = 10, b = 20;\n    int sum = a - b;\n    cout << sum << endl;\n    return 0;\n}',
      "71":'a = 10\nb = 20\nsum = a - b\nprint(sum)',
      "62":'public class Main {\n    public static void main(String[] args) {\n        int a = 10, b = 20;\n        int sum = a - b;\n        System.out.println(sum);\n    }\n}'
    }
  },
  2: {
    title:"Sum from 1 to 5",
    description:"This program should calculate and print the sum of every integer from 1 through 5. Find and fix the bug.",
    expected:"15", timeLimit:10*60, marks:20,
    code:{
      "50":'#include <stdio.h>\nint main(void) {\n    int total = 0;\n    for (int i = 1; i < 5; i++) {\n        total += i;\n    }\n    printf("%d\\n", total);\n    return 0;\n}',
      "54":'#include <iostream>\nusing namespace std;\nint main() {\n    int total = 0;\n    for (int i = 1; i < 5; i++) {\n        total += i;\n    }\n    cout << total << endl;\n    return 0;\n}',
      "71":'total = 0\nfor i in range(1, 5):\n    total += i\nprint(total)',
      "62":'public class Main {\n    public static void main(String[] args) {\n        int total = 0;\n        for (int i = 1; i < 5; i++) {\n            total += i;\n        }\n        System.out.println(total);\n    }\n}'
    }
  }
};
const JUDGE_URL = "https://ce.judge0.com/submissions?base64_encoded=false&wait=true";
const $ = id => document.getElementById(id);
let currentRound = 1, remaining = CHALLENGES[1].timeLimit, timerId = null, timerStarted = false;
let roundSubmitted = {1:false,2:false}, roundScores = {1:0,2:0};
let roundCode = {1:null,2:null};
const STORAGE_KEY = "bug404_submissions_v1";

function updateTimer(){const m=Math.floor(remaining/60),s=remaining%60;$("timer").textContent=m+":"+String(s).padStart(2,"0");$("timer").classList.toggle("urgent",remaining<=60);}
function stopTimer(){if(timerId){clearInterval(timerId);timerId=null;}}
function startTimer(){if(timerStarted||roundSubmitted[currentRound])return;timerStarted=true;timerId=setInterval(()=>{remaining--;updateTimer();if(remaining<=0){stopTimer();$("runStatus").textContent="Time expired";$("consoleOutput").textContent="Time is up. Submit your current code now."; $("submitRound").disabled=false;}},1000);}
function getChallenge(){return CHALLENGES[currentRound];}
function saveEditor(){if(!roundSubmitted[currentRound])roundCode[currentRound]=$("editor").value;}
function loadRound(round){
  saveEditor();stopTimer();currentRound=round;const c=getChallenge();remaining=c.timeLimit;timerStarted=false;updateTimer();
  $("round1Tab").classList.toggle("active",round===1);$("round2Tab").classList.toggle("active",round===2);
  $("round1Tab").setAttribute("aria-selected",String(round===1));$("round2Tab").setAttribute("aria-selected",String(round===2));
  $("roundLabel").textContent=round===1?"ROUND 1 / EASY":"ROUND 2 / HARD";
  $("challengeTitle").textContent=c.title;$("challengeDescription").textContent=c.description;$("expectedOutput").textContent=c.expected;
  $("editor").value=roundSubmitted[round]?(roundCode[round]||c.code[$("language").value]):(roundCode[round]||c.code[$("language").value]);
  $("editor").disabled=roundSubmitted[round];$("runCode").disabled=roundSubmitted[round];$("submitRound").disabled=roundSubmitted[round];
  $("resetCode").disabled=roundSubmitted[round];$("runStatus").textContent=roundSubmitted[round]?"Submitted":"Ready";
  $("consoleOutput").textContent=roundSubmitted[round]?"This round has already been submitted.":"Edit the code, then click Run Code.";
}
function updateProgress(){
  $("round1Score").textContent=roundSubmitted[1]?roundScores[1]+" / 10":"Not submitted";
  $("round2Score").textContent=roundSubmitted[2]?roundScores[2]+" / 20":"Not submitted";
  $("scoreTotal").textContent=(roundScores[1]+roundScores[2])+" / 30";
  const records=readRecords();$("recordCount").textContent=records.length+" stored submissions on this device.";
}
function normalize(s){return String(s??"").replace(/\r/g,"").trim().split(/\s+/).join(" ");}
async function execute(code,languageId){
  try{
    const response=await fetch(JUDGE_URL,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({language_id:Number(languageId),source_code:code,stdin:"",cpu_time_limit:2,wall_time_limit:4,memory_limit:128000})});
    if(!response.ok)throw new Error("Code runner returned HTTP "+response.status);
    return await response.json();
  }catch(e){return {status:{id:-1,description:"Execution service unavailable"},stderr:e.message};}
}
function outputText(result){
  if(result.status?.id===3)return result.stdout||"(No output)";
  return result.compile_output||result.stderr||result.message||result.status?.description||"Execution failed.";
}
async function runCode(){
  const code=$("editor").value;if(!code.trim()){ $("consoleOutput").textContent="Please enter your corrected code first.";return;}
  startTimer();$("runCode").disabled=true;$("submitRound").disabled=true;$("runStatus").textContent="Running…";$("consoleOutput").textContent="Compiling and executing…";
  const result=await execute(code,$("language").value);
  $("consoleOutput").textContent=outputText(result);
  $("runStatus").textContent=result.status?.id===3?(normalize(result.stdout)===getChallenge().expected?"Output correct":"Program executed"):"Error";
  $("runCode").disabled=false;$("submitRound").disabled=false;
}
function readRecords(){try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||"[]");}catch{return [];}}
function saveRecord(record){const all=readRecords();all.push(record);localStorage.setItem(STORAGE_KEY,JSON.stringify(all));updateProgress();}
async function submitRound(){
  const name=$("participantName").value.trim(),reg=$("participantReg").value.trim();
  if(!name||!reg){alert("Please enter participant name and registration number first.");return;}
  const code=$("editor").value;if(!code.trim()){alert("Please enter your corrected code before submitting.");return;}
  $("submitRound").disabled=true;$("runCode").disabled=true;$("runStatus").textContent="Judging…";$("consoleOutput").textContent="Checking your final code…";
  const result=await execute(code,$("language").value);
  const actual=normalize(result.stdout),expected=normalize(getChallenge().expected);
  const passed=result.status?.id===3&&actual===expected;
  const score=passed?getChallenge().marks:0;
  roundSubmitted[currentRound]=true;roundScores[currentRound]=score;roundCode[currentRound]=code;stopTimer();
  saveRecord({name,registration:reg,language:LANGUAGE_NAMES[$("language").value],round:currentRound,roundName:currentRound===1?"Easy":"Hard",code,expectedOutput:expected,actualOutput:actual,executionStatus:result.status?.description||"Unknown",passed,marks:score,maxMarks:getChallenge().marks,submittedAt:new Date().toISOString()});
  $("editor").disabled=true;$("resetCode").disabled=true;$("runStatus").textContent=passed?"Accepted":"Submitted";
  $("consoleOutput").textContent=passed?"Correct output! You earned "+score+" marks.":"Submitted for review. Output/error:\n"+outputText(result)+"\nThe organizer can review your code for partial credit.";
  $("submitRound").textContent="Round submitted";updateProgress();
}
function exportCsv(){
  const rows=readRecords();if(!rows.length){alert("No submissions saved on this device yet.");return;}
  const cols=["name","registration","language","round","roundName","marks","maxMarks","passed","expectedOutput","actualOutput","executionStatus","submittedAt","code"];
  const quote=v=>'"'+String(v??"").replace(/"/g,'""')+'"';
  const csv=[cols.join(","),...rows.map(r=>cols.map(k=>quote(r[k])).join(","))].join("\r\n");
  const url=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8;"}));const a=document.createElement("a");a.href=url;a.download="bug-404-submissions.csv";a.click();URL.revokeObjectURL(url);
}
function clearRecords(){if(!confirm("Delete all submission records saved in this browser? This cannot be undone."))return;localStorage.removeItem(STORAGE_KEY);updateProgress();}
$("round1Tab").addEventListener("click",()=>loadRound(1));$("round2Tab").addEventListener("click",()=>loadRound(2));
$("language").addEventListener("change",()=>{if(roundSubmitted[1]||roundSubmitted[2]){alert("Language cannot be changed after a round has been submitted.");return;}roundCode={1:null,2:null};$("languageChip").textContent=LANGUAGE_NAMES[$("language").value];loadRound(currentRound);});
$("editor").addEventListener("input",saveEditor);$("editor").addEventListener("focus",startTimer);
$("runCode").addEventListener("click",runCode);$("submitRound").addEventListener("click",submitRound);
$("resetCode").addEventListener("click",()=>{if(roundSubmitted[currentRound])return;if(confirm("Reset this round to the original buggy code?")){$("editor").value=getChallenge().code[$("language").value];roundCode[currentRound]=$("editor").value;}});
$("exportCsv").addEventListener("click",exportCsv);$("clearRecords").addEventListener("click",clearRecords);
$("languageChip").textContent=LANGUAGE_NAMES[$("language").value];loadRound(1);updateProgress();