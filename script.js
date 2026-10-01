const challenges=[
 {title:"Reverse a String",difficulty:"Easy",time:10,fn:"reverseString",description:"Write a function that returns the given string in reverse order.",input:'"hello"',output:'"olleh"',tests:[["hello","olleh"],["CodeCheck","kcehCedoC"],["12345","54321"]],starter:`function reverseString(str) {
  // return the reversed string
}`},
 {title:"Sum of an Array",difficulty:"Easy",time:8,fn:"sumArray",description:"Write a function that returns the sum of all numbers in an array.",input:"[2, 4, 6, 8]",output:"20",tests:[[[2,4,6,8],20],[[10,-2,5],13],[[0,0,7],7]],starter:`function sumArray(arr) {
  // return the sum
}`},
 {title:"Count Vowels",difficulty:"Easy",time:8,fn:"countVowels",description:"Write a function that returns how many vowels (a, e, i, o, u) appear in a string.",input:'"programming"',output:"3",tests:[["programming",3],["HELLO",2],["sky",0]],starter:`function countVowels(str) {
  // return the number of vowels
}`}
];

let index=0,remaining=600,timerId=null,started=false;
const $=id=>document.getElementById(id);
function loadChallenge(i=0){
  index=i%challenges.length; const c=challenges[index];
  $("challengeNo").textContent=index+1;$("title").textContent=c.title;$("description").textContent=c.description;
  $("difficulty").textContent=c.difficulty;$("exampleInput").textContent=c.input;$("exampleOutput").textContent=c.output;
  $("editor").value=c.starter;$("result").classList.add("hidden");$("tests").innerHTML="";$("score").textContent="0 pts";
  remaining=c.time*60;started=false;clearInterval(timerId);updateTimer();
}
function updateTimer(){const m=Math.floor(remaining/60),s=remaining%60;$("timer").textContent=m+":"+String(s).padStart(2,"0")}
function startTimer(){if(started)return;started=true;timerId=setInterval(()=>{remaining--;updateTimer();if(remaining<=0){clearInterval(timerId);submit(true)}},1000)}
function execute(code,fn,input){
  try{const runner=new Function(code+"\nreturn "+fn+";");
    const f=runner(); if(typeof f!=="function") throw new Error("Function not found: "+fn);
    return {ok:true,value:f(input)};
  }catch(e){return {ok:false,error:e.message}}
}
function runTests(showSample=false){
  startTimer();const c=challenges[index],code=$("editor").value;
  if(showSample){
    const t=execute(code,c.fn,JSON.parse(c.input));
    $("result").classList.remove("hidden");$("resultTitle").textContent=t.ok?"Sample passed":"Sample error";
    $("resultText").textContent=t.ok?"Output: "+JSON.stringify(t.value):t.error;
    $("tests").innerHTML="";return;
  }
  let passed=0,html="";
  c.tests.forEach((t,n)=>{const r=execute(code,c.fn,t[0]);const ok=r.ok&&JSON.stringify(r.value)===JSON.stringify(t[1]);if(ok)passed++;
    html+=`<div class="test ${ok?"pass":"fail"}"><b>Test ${n+1}: ${ok?"✓ Passed":"✕ Failed"}</b><small>${ok?"Hidden test passed":(r.error||"Output did not match")}</small></div>`;});
  clearInterval(timerId);const score=Math.round((passed/c.tests.length)*100+(remaining/(c.time*60))*20);
  $("result").classList.remove("hidden");$("resultTitle").textContent=passed===c.tests.length?"Challenge complete!":"Keep practicing";
  $("resultText").textContent=`${passed}/${c.tests.length} hidden tests passed.`;
  $("score").textContent=Math.max(0,score)+" pts";$("tests").innerHTML=html;
}
$("editor").addEventListener("focus",startTimer);
$("runSample").addEventListener("click",()=>runTests(true));
$("submit").addEventListener("click",()=>runTests(false));
$("resetCode").addEventListener("click",()=>{$("editor").value=challenges[index].starter});
$("newChallenge").addEventListener("click",()=>loadChallenge(index+1));
loadChallenge();
