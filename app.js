/* Sudoku Forge - dependency-free prototype */
const LEVELS={Easy:{clues:44},Medium:{clues:38},Hard:{clues:32},Extreme:{clues:27},Expert:{clues:23}};
const $=id=>document.getElementById(id);
let state={level:'Easy',solution:[],puzzle:[],board:[],notes:Array(81).fill(0),selected:0,errors:0,attempts:0,seconds:0,running:true,paused:false,challenge:null,started:Date.now()};
let player=localStorage.getItem('sf_player')||'Player';
let history=JSON.parse(localStorage.getItem('sf_history')||'[]');

function rng(seed){let x=seed>>>0;return()=>((x=(Math.imul(1664525,x)+1013904223)>>>0)/4294967296)}
function shuffle(a,r){for(let i=a.length-1;i;i--){let j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function baseSolution(r){let b=Array(81).fill(0);const pattern=(r,c)=>(r*3+Math.floor(r/3)+c)%9;let nums=shuffle([1,2,3,4,5,6,7,8,9],r);for(let r0=0;r0<9;r0++)for(let c=0;c<9;c++)b[r0*9+c]=nums[pattern(r0,c)];return b}
function makePuzzle(solution,clues,r){let p=[...solution],idx=shuffle([...Array(81).keys()],r);let remove=81-clues;for(let k=0;k<remove;k++)p[idx[k]]=0;return p}
function seedFor(s){let h=2166136261;for(let i=0;i<s.length;i++)h=Math.imul(h^s.charCodeAt(i),16777619);return h>>>0}
function today(kind){let d=new Date(),z=n=>String(n).padStart(2,'0');if(kind==='daily')return `${d.getFullYear()}-${z(d.getMonth()+1)}-${z(d.getDate())}`;if(kind==='monthly')return `${d.getFullYear()}-${z(d.getMonth()+1)}`;let x=new Date(d);x.setDate(d.getDate()-d.getDay());return x.toISOString().slice(0,10)}
function newGame(level=state.level,challenge=null){
 state={...state,level,challenge,puzzle:[],board:[],notes:Array(81).fill(0),selected:0,errors:0,attempts:0,seconds:0,running:true,paused:false,started:Date.now()};
 let key=challenge?`${challenge.kind}:${challenge.id}`:`free:${Date.now()}:${Math.random()}`;
 let r=rng(seedFor(key+level)), sol=baseSolution(r), clues=LEVELS[level].clues;
 state.solution=sol;state.puzzle=makePuzzle(sol,clues,r);state.board=[...state.puzzle];
 $('challengeLabel').textContent=challenge?`${challenge.kind.toUpperCase()} • ${challenge.id}`:`${level} • Free Play`;
 notice('Select a cell and tap a digit.','');render()
}
function row(i){return Math.floor(i/9)}function col(i){return i%9}
function peers(i,j){return row(i)===row(j)||col(i)===col(j)||Math.floor(row(i)/3)===Math.floor(row(j)/3)&&Math.floor(col(i)/3)===Math.floor(col(j)/3)}
function candidates(i){if(state.board[i])return[];let used=new Set();for(let j=0;j<81;j++)if(peers(i,j)&&state.board[j])used.add(state.board[j]);return [1,2,3,4,5,6,7,8,9].filter(n=>!used.has(n))}
function place(n){
 if(state.paused||state.puzzle[state.selected])return;
 state.attempts++;
 if(n!==state.solution[state.selected]){state.errors++;state.board[state.selected]=n;notice(`Wrong move: ${n} cannot go in ${label(state.selected)}.`,'bad');render();setTimeout(()=>{if(state.board[state.selected]===n)state.board[state.selected]=0;render()},500);return}
 state.board[state.selected]=n;state.notes[state.selected]=0;notice(`Correct — ${label(state.selected)} = ${n}.`,'good');render();checkWin()
}
function erase(){if(!state.puzzle[state.selected]){state.board[state.selected]=0;render()}}
function autoComplete(){if(state.paused)return;let count=0;for(let i=0;i<81;i++)if(!state.board[i]){state.board[i]=state.solution[i];count++}state.attempts+=count;notice(`Auto-complete filled ${count} remaining cells. This ends the scoring run.`,'good');state.running=false;render()}
function checkWin(){if(state.board.every((v,i)=>v===state.solution[i])){state.running=false;let acc=Math.round(100*(81-state.errors)/Math.max(81,state.attempts));let base={Easy:1000,Medium:1500,Hard:2200,Extreme:3200,Expert:4500}[state.level];let score=Math.max(0,Math.round(base*(1+Math.max(0,1200-state.seconds)/1200)*acc/100-state.errors*35));let rec={player,level:state.level,score,time:state.seconds,errors:state.errors,date:new Date().toISOString()};history.push(rec);history.sort((a,b)=>b.score-a.score);history=history.slice(0,20);localStorage.setItem('sf_history',JSON.stringify(history));notice(`🎉 Puzzle complete! ${state.seconds}s • ${state.errors} errors • ${acc}% accuracy • ${score} points.`,'good');render();renderLeaderboard()}}
function label(i){return `R${row(i)+1}C${col(i)+1}`}
function render(){let b=$('board');b.innerHTML='';for(let i=0;i<81;i++){let d=document.createElement('div');d.className='cell';if(state.puzzle[i])d.classList.add('given');if(i===state.selected)d.classList.add('selected');else if(peers(i,state.selected))d.classList.add('peer');if(state.board[i]&&state.board[i]===state.board[state.selected])d.classList.add('same');if(state.board[i]&&state.board[i]!==state.solution[i]&&!state.puzzle[i])d.classList.add('error');if(i===state.selected&&state.hint)d.classList.add('hint');d.textContent=state.board[i]||'';d.onclick=()=>{state.selected=i;state.hint=false;render()};b.appendChild(d)}
$('errors').textContent=state.errors;$('accuracy').textContent=Math.round(100*(81-state.errors)/Math.max(81,state.attempts))+'%';$('score').textContent=state.running?'—':(history[0]?.score||0);$('timer').textContent=fmt(state.seconds);$('analysis').textContent=analysis();$('statsBox').innerHTML=`Games won: <b>${history.filter(x=>x.player===player).length}</b><br>Best score: <b>${Math.max(0,...history.filter(x=>x.player===player).map(x=>x.score))}</b><br>Fastest: <b>${fmt(Math.min(...history.filter(x=>x.player===player).map(x=>x.time),0))}</b>`}
function analysis(){let games=history.filter(x=>x.player===player);if(!games.length)return 'No completed games yet. Your analysis will appear here as you play.';let avgErr=(games.reduce((a,x)=>a+x.errors,0)/games.length).toFixed(1);let best=games.slice().sort((a,b)=>a.time-b.time)[0];return `You have completed ${games.length} scored game(s). Average errors: ${avgErr}. Best speed: ${fmt(best.time)} on ${best.level}. ${avgErr<2?'Excellent accuracy.':'Focus on candidate checking before committing a digit.'}`}
function fmt(s){s=Math.max(0,Math.floor(s));return `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`}
function notice(t,c){$('notice').textContent=t;$('notice').className='notice '+c}
function renderLeaderboard(){$('leaderBody').innerHTML=history.map((x,i)=>`<tr><td>${i+1}</td><td>${esc(x.player)}</td><td>${x.level}</td><td>${x.score}</td><td>${fmt(x.time)}</td></tr>`).join('')||'<tr><td colspan=5>No scores yet.</td></tr>'}
function esc(s){return String(s).replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]))}
function startChallenge(kind){let id=today(kind);state.level=kind==='daily'?'Hard':kind==='weekly'?'Extreme':'Expert';newGame(state.level,{kind,id});$('challengeInfo').textContent=`${kind} challenge: ${id}. This challenge can be replayed offline from the same challenge ID.`}
$('levels').innerHTML=Object.keys(LEVELS).map(x=>`<button data-level="${x}">${x}</button>`).join('');
$('levels').onclick=e=>{if(e.target.dataset.level)newGame(e.target.dataset.level)}
$('numpad').innerHTML=[1,2,3,4,5,6,7,8,9].map(n=>`<button data-num="${n}">${n}</button>`).join('');
$('numpad').onclick=e=>{if(e.target.dataset.num)place(+e.target.dataset.num)}
$('eraseBtn').onclick=erase;$('autoBtn').onclick=autoComplete;$('newBtn').onclick=()=>newGame();$('pauseBtn').onclick=()=>{state.paused=!state.paused;$('pauseBtn').textContent=state.paused?'Resume':'Pause';notice(state.paused?'Game paused.':'Game resumed.','')};
$('hintBtn').onclick=()=>{let i=state.selected;if(state.puzzle[i])return notice('That cell is a given. Select an empty cell.','');let c=candidates(i);state.hint=true;notice(`Hint: ${label(i)} candidates are {${c.join(', ')}}.`,`good`);render()};
$('noteBtn').onclick=()=>{let i=state.selected;if(state.puzzle[i])return;let c=candidates(i);notice(`Candidate scan for ${label(i)}: {${c.join(', ')}}. Use the board logic to choose.`,'')}
$('profileBtn').onclick=()=>{$('nameInput').value=player;$('modal').classList.add('show')};$('closeModal').onclick=()=>$('modal').classList.remove('show');$('saveName').onclick=()=>{player=$('nameInput').value.trim()||'Player';localStorage.setItem('sf_player',player);$('profileBtn').textContent=player;$('modal').classList.remove('show');render()}
document.querySelectorAll('.tab').forEach(x=>x.onclick=()=>{document.querySelectorAll('.tabcontent').forEach(c=>c.style.display='none');$(x.dataset.tab).style.display='block';if(x.dataset.tab==='leaderboard')renderLeaderboard()})
document.addEventListener('keydown',e=>{if(e.key>='1'&&e.key<='9')place(+e.key);if(e.key==='Backspace'||e.key==='Delete')erase();if(e.key==='ArrowRight')state.selected=Math.min(80,state.selected+1);if(e.key==='ArrowLeft')state.selected=Math.max(0,state.selected-1);if(e.key==='ArrowDown')state.selected=Math.min(80,state.selected+9);if(e.key==='ArrowUp')state.selected=Math.max(0,state.selected-9);render()})
setInterval(()=>{if(state.running&&!state.paused){state.seconds=Math.floor((Date.now()-state.started)/1000);render()}},1000)
$('profileBtn').textContent=player;renderLeaderboard();newGame('Easy')
