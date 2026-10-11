
(function(){
"use strict";
// ---------- quantum core (verified: E = cos(a-b), CHSH = 2.828) ----------
var SQ=Math.SQRT1_2, D2R=Math.PI/180;
function ry(t){var c=Math.cos(t/2),s=Math.sin(t/2);return [[c,-s],[s,c]];}
// state: 4 real amplitudes (Phi+ with Ry stays real): |00>,|01>,|10>,|11>, Alice = left bit
function applyGate(st,U,q){
  var out=[0,0,0,0];
  for(var i=0;i<4;i++){
    var bit=q===0?(i>>1)&1:i&1;
    for(var b=0;b<2;b++){
      var j=q===0?((b<<1)|(i&1)):((i&2)|b);
      out[i]+=U[bit][b]*st[j];
    }
  }
  return out;
}
function measuredAmps(aDeg,bDeg){
  var st=[SQ,0,0,SQ];
  st=applyGate(st,ry(-aDeg*D2R),0);
  st=applyGate(st,ry(-bDeg*D2R),1);
  return st;
}
function quantumSample(a,b){
  var st=measuredAmps(a,b), p=st.map(function(x){return x*x;});
  var r=Math.random(),i=0;
  while(i<3&&r>p[i]){r-=p[i];i++;}
  return [((i>>1)&1)?-1:1,(i&1)?-1:1];
}
// best local-hidden-variable script: shared random direction lambda
function classicalSample(a,b){
  var lam=Math.random()*360;
  var sgn=function(x){return Math.cos(x*D2R)>=0?1:-1;};
  return [sgn(a-lam),sgn(b-lam)];
}

// ---------- state ----------
var source='quantum', mysteryActual=null, mysteryRevealed=false;
var NB=12, bins=[], shots=0, same=0;
var call=null, callsMade=0, callsRight=0;
function resetBins(){bins=[];for(var i=0;i<NB;i++)bins.push({sum:0,n:0});shots=0;same=0;}
resetBins();

function effSource(){return source==='mystery'?mysteryActual:source;}
function sample(a,b){return effSource()==='classical'?classicalSample(a,b):quantumSample(a,b);}

// ---------- dom ----------
function $(id){return document.getElementById(id);}
var angleA=$('angleA'),angleB=$('angleB');
function aVal(){return +angleA.value;} function bVal(){return +angleB.value;}

function fold(d){d=Math.abs(d)%360;if(d>180)d=360-d;return d;}

// ---------- dancers ----------
function setNeedles(){
  $('needleA').style.transform='rotate('+aVal()+'deg)';
  $('needleB').style.transform='rotate('+bVal()+'deg)';
  $('readA').textContent=aVal()+'°';
  $('readB').textContent=bVal()+'°';
}
function setArm(el,v){ // +1 up, -1 down, 0 neutral
  el.style.transform=v===0?'rotate(0deg)':'rotate('+(v>0?-55:55)+'deg)';
}

// ---------- recording ----------
function record(a,b,prod){
  var d=fold(a-b), idx=Math.min(NB-1,Math.floor(d/(180/NB)));
  bins[idx].sum+=prod;bins[idx].n++;
  shots++;if(prod>0)same++;
}
function updateTally(){
  $('tShots').textContent=shots;
  $('tSame').textContent=shots?Math.round(100*same/shots)+'%':'–';
}

// ---------- chart ----------
var CW=560,CH=300,ML=46,MR=16,MT=14,MB=40;
function xOf(d){return ML+(d/180)*(CW-ML-MR);}
function yOf(e){return MT+(1-(e+1)/2)*(CH-MT-MB);}
function curvePath(fn){
  var pts=[];
  for(var d=0;d<=180;d+=3)pts.push((d?'L':'M')+xOf(d).toFixed(1)+' '+yOf(fn(d)).toFixed(1));
  return pts.join(' ');
}
function drawChart(){
  var s='';
  // grid + axes
  [-1,-0.5,0,0.5,1].forEach(function(e){
    var y=yOf(e);
    s+='<line x1="'+ML+'" y1="'+y+'" x2="'+(CW-MR)+'" y2="'+y+'" stroke="var(--line)" stroke-width="'+(e===0?1.5:1)+'"/>';
    s+='<text x="'+(ML-8)+'" y="'+(y+4)+'" text-anchor="end" font-size="11" fill="var(--muted)" font-family="var(--body)">'+(e>0?'+':'')+e+'</text>';
  });
  [0,45,90,135,180].forEach(function(d){
    var x=xOf(d);
    s+='<line x1="'+x+'" y1="'+(CH-MB)+'" x2="'+x+'" y2="'+(CH-MB+5)+'" stroke="var(--muted)"/>';
    s+='<text x="'+x+'" y="'+(CH-MB+19)+'" text-anchor="middle" font-size="11" fill="var(--muted)" font-family="var(--body)">'+d+'°</text>';
  });
  s+='<text x="'+((ML+CW-MR)/2)+'" y="'+(CH-4)+'" text-anchor="middle" font-size="12" fill="var(--muted)" font-family="var(--body)">Δ — gap between the two dials</text>';
  s+='<text transform="translate(13 '+((MT+CH-MB)/2)+') rotate(-90)" text-anchor="middle" font-size="12" fill="var(--muted)" font-family="var(--body)">correlation E</text>';
  // reference curves
  s+='<path d="'+curvePath(function(d){return Math.cos(d*D2R);})+'" fill="none" stroke="var(--curve-q)" stroke-width="2"/>';
  s+='<path d="'+curvePath(function(d){return 1-2*d/180;})+'" fill="none" stroke="var(--curve-c)" stroke-width="2" stroke-dasharray="6 5"/>';
  s+='<text x="'+(xOf(52))+'" y="'+(yOf(Math.cos(52*D2R))-10)+'" font-size="12" font-weight="600" fill="var(--curve-q)" font-family="var(--body)">entangled: cos Δ</text>';
  s+='<text x="'+(xOf(96))+'" y="'+(yOf(1-2*96/180)+20)+'" font-size="12" font-weight="600" fill="var(--curve-c)" font-family="var(--body)">best possible script</text>';
  // data dots
  for(var i=0;i<NB;i++){
    if(!bins[i].n)continue;
    var d=(i+0.5)*(180/NB), e=bins[i].sum/bins[i].n;
    s+='<circle cx="'+xOf(d).toFixed(1)+'" cy="'+yOf(e).toFixed(1)+'" r="5.5" fill="var(--fg)" stroke="var(--surface)" stroke-width="2" data-bin="'+i+'" style="cursor:pointer"/>';
  }
  $('chart').innerHTML=s;
}
// tooltip
$('chart').addEventListener('mousemove',function(ev){
  var t=ev.target,tip=$('tip');
  if(t.tagName==='circle'&&t.hasAttribute('data-bin')){
    var i=+t.getAttribute('data-bin'),bw=180/NB;
    tip.textContent='Δ '+(i*bw)+'–'+((i+1)*bw)+'° · E = '+(bins[i].sum/bins[i].n).toFixed(2)+' · n = '+bins[i].n;
    var r=$('chart').getBoundingClientRect(),cr=t.getBoundingClientRect();
    tip.style.left=(cr.left+cr.width/2-r.left)+'px';
    tip.style.top=(cr.top-r.top+14)+'px';
    tip.hidden=false;
  } else tip.hidden=true;
});
$('chart').addEventListener('mouseleave',function(){$('tip').hidden=true;});

// ---------- amplitudes panel ----------
function drawAmps(){
  var svg=$('ampSvg'),note=$('hoodNote'),src=source;
  if(src==='mystery'&&!mysteryRevealed){
    svg.innerHTML='<text x="160" y="80" text-anchor="middle" font-size="13" fill="var(--muted)" font-family="var(--body)" font-style="italic">sealed until you reveal the mystery box</text>';
    note.textContent='No peeking. Decide from the evidence — the chart and the Bell score — then reveal.';
    return;
  }
  var eff=effSource();
  if(eff==='classical'){
    svg.innerHTML='<text x="160" y="72" text-anchor="middle" font-size="13" fill="var(--muted)" font-family="var(--body)">no amplitudes here —</text>'+
      '<text x="160" y="92" text-anchor="middle" font-size="13" fill="var(--muted)" font-family="var(--body)">just a hidden script: A = sign cos(a−λ)</text>';
    note.textContent='In script mode the dancers carry pre-agreed answers (a shared random direction λ). It imitates quantum correlation as well as anything classical can — which is exactly what the Bell test exposes.';
    return;
  }
  var amps=measuredAmps(aVal(),bVal());
  var labels=['|00⟩','|01⟩','|10⟩','|11⟩'];
  var zero=75,hmax=52,bw=34,gap=38,x0=48,s='';
  s+='<line x1="30" y1="'+zero+'" x2="310" y2="'+zero+'" stroke="var(--line)"/>';
  for(var i=0;i<4;i++){
    var x=x0+i*(bw+gap),h=amps[i]*hmax;
    var y=h>=0?zero-h:zero, hh=Math.abs(h);
    s+='<rect x="'+x+'" y="'+y.toFixed(1)+'" width="'+bw+'" height="'+Math.max(hh,0.5).toFixed(1)+'" rx="3" fill="var(--curve-q)"/>';
    s+='<text x="'+(x+bw/2)+'" y="140" text-anchor="middle" font-size="13" fill="var(--fg)" font-family="var(--body)">'+labels[i]+'</text>';
    s+='<text x="'+(x+bw/2)+'" y="'+(h>=0?(zero-h-6):(zero+hh+13)).toFixed(1)+'" text-anchor="middle" font-size="11" fill="var(--muted)" font-family="var(--body)">'+amps[i].toFixed(2)+'</text>';
  }
  svg.innerHTML=s;
  note.textContent='The Bell state |Φ⁺⟩, re-expressed in the bases your dials select. Amplitudes can go negative — probabilities (their squares) can\'t. Each pose samples one of these four outcomes with probability amplitude².';
}

// ---------- actions ----------
function clearCall(){call=null;$('callSame').setAttribute('aria-pressed','false');$('callDiff').setAttribute('aria-pressed','false');}
$('callSame').addEventListener('click',function(){call='same';this.setAttribute('aria-pressed','true');$('callDiff').setAttribute('aria-pressed','false');});
$('callDiff').addEventListener('click',function(){call='diff';this.setAttribute('aria-pressed','true');$('callSame').setAttribute('aria-pressed','false');});

function pose(){
  var a=aVal(),b=bVal(),r=sample(a,b);
  setArm($('armA'),r[0]);setArm($('armB'),r[1]);
  $('outA').textContent='arm '+(r[0]>0?'UP (+1)':'DOWN (−1)');
  $('outB').textContent='arm '+(r[1]>0?'UP (+1)':'DOWN (−1)');
  record(a,b,r[0]*r[1]);
  if(call){
    callsMade++;
    var matched=r[0]*r[1]>0, right=(call==='same')===matched;
    if(right)callsRight++;
    $('callStat').textContent=(right?'✓ called it':'✗ missed')+' · '+callsRight+'/'+callsMade+' right';
    clearCall();
  }
  updateTally();drawChart();
}
$('poseBtn').addEventListener('click',pose);
$('pose100Btn').addEventListener('click',function(){
  var a=aVal(),b=bVal(),last=[1,1];
  for(var k=0;k<100;k++){last=sample(a,b);record(a,b,last[0]*last[1]);}
  setArm($('armA'),last[0]);setArm($('armB'),last[1]);
  $('outA').textContent='last of 100: '+(last[0]>0?'UP':'DOWN');
  $('outB').textContent='last of 100: '+(last[1]>0?'UP':'DOWN');
  updateTally();drawChart();
});

$('bellBtn').addEventListener('click',function(){
  var settings=[[0,45,1],[90,45,1],[90,135,1],[0,135,-1]],S=0,N=300;
  settings.forEach(function(st){
    var sum=0;
    for(var k=0;k<N;k++){var r=sample(st[0],st[1]);sum+=r[0]*r[1];record(st[0],st[1],r[0]*r[1]);}
    S+=st[2]*(sum/N);
  });
  $('sVal').textContent=S.toFixed(2);
  $('sFill').style.width=Math.max(0,Math.min(100,(S/3)*100))+'%';
  var v=$('verdict');
  if(S>2.05){v.textContent='S = '+S.toFixed(2)+' — above the classical ceiling. No script, no pre-agreed answers, no local trick can score this. These two share one quantum state.';v.className='verdict beat';}
  else{v.textContent='S = '+S.toFixed(2)+' — within classical reach. A humble script could do this; nothing here requires entanglement.';v.className='verdict';}
  updateTally();drawChart();
});

$('resetBtn').addEventListener('click',function(){
  resetBins();updateTally();drawChart();
  $('sVal').textContent='–';$('sFill').style.width='0%';
  $('verdict').textContent='Any secret script — any list of pre-agreed answers, however clever — scores 2.00 at most. That\'s Bell\'s theorem (1964).';
  $('verdict').className='verdict';
  callsMade=0;callsRight=0;$('callStat').textContent='predict before you pose';clearCall();
  setArm($('armA'),0);setArm($('armB'),0);
  $('outA').textContent='no pose yet';$('outB').textContent='no pose yet';
});

// ---------- source switching ----------
var descs={
  quantum:'The dancers share the Bell state |Φ⁺⟩ — four live amplitudes, honestly sampled on every pose.',
  classical:'The dancers carry a secret script: pre-agreed answers from a shared random direction. The best fake that physics allows.',
  mystery:'One of the two, chosen at random and hidden. Gather evidence, then reveal.'
};
function setSource(s){
  source=s;
  $('src-q').setAttribute('aria-pressed',s==='quantum');
  $('src-c').setAttribute('aria-pressed',s==='classical');
  $('src-m').setAttribute('aria-pressed',s==='mystery');
  if(s==='mystery'){
    mysteryActual=Math.random()<0.5?'quantum':'classical';
    mysteryRevealed=false;
    $('srcDesc').innerHTML=descs.mystery+' <button class="call" id="revealBtn">reveal</button>';
    $('revealBtn').addEventListener('click',function(){
      mysteryRevealed=true;
      $('srcDesc').textContent='The box held: '+(mysteryActual==='quantum'?'an ENTANGLED PAIR.':'a SECRET SCRIPT.')+' Did the evidence tell you?';
      drawAmps();
    });
  } else {
    $('srcDesc').textContent=descs[s];
  }
  $('resetBtn').click();
  drawAmps();
}
$('src-q').addEventListener('click',function(){setSource('quantum');});
$('src-c').addEventListener('click',function(){setSource('classical');});
$('src-m').addEventListener('click',function(){setSource('mystery');});

// ---------- live updates ----------
function onDial(){setNeedles();drawAmps();}
angleA.addEventListener('input',onDial);
angleB.addEventListener('input',onDial);

// ---------- guided tour ----------
var TOUR=[
 {t:"The setup, in plain words: a machine makes two tiny quantum particles together and hands one to each dancer. Each particle is a qubit — a quantum bit. Unlike a normal bit, a qubit only becomes 0 or 1 when you ask it, and you can ask the question from different angles. The dial under each dancer IS that angle, and 'striking a pose' is asking. The answer is always just arm UP (+1) or arm DOWN (−1).",
  s:function(){}},
 {t:"Both dials are now set to 0° — the dancers are asking their qubits the exact same question. Click 'Strike a pose' five or six times and watch the arms. Each dancer's answer is random... but the two of them ALWAYS match. Hit Next once you've seen it happen.",
  s:function(){angleA.value=0;angleB.value=0;onDial();}},
 {t:"That always-matching is the whole mystery. The sensible explanation: the two particles secretly agreed on their answers before they were separated — a script. Einstein believed something like this. It sounds completely reasonable. Your job for the rest of the tour is to catch the script red-handed.",
  s:function(){}},
 {t:"Bob's dial just moved to 90° — he's now asking a DIFFERENT question than Alice. Strike a few poses: the arms only match about half the time now. So the gap between the two dials (called Δ, 'delta') controls how often they agree. That gap is the knob that will expose the truth.",
  s:function(){angleA.value=0;angleB.value=90;onDial();}},
 {t:"Time to collect evidence. Click 'Pose ×100', then move one dial to a new angle and click it again — try four or five different gaps. Each dot on the chart below shows how correlated the answers were at that gap. Your dots should hug the solid CURVE, the one labeled 'entangled'.",
  s:function(){}},
 {t:"Now meet the imposter. The dancers just switched to 'Secret script' mode — pre-agreed answers, the best fake that's physically possible — and your data was cleared. Do exactly what you did before: Pose ×100 at several different gaps. This time the dots follow the dashed STRAIGHT LINE. Same game, different fingerprint — and no script can ever bend into a curve.",
  s:function(){setSource('classical');}},
 {t:"Back to the real entangled pair (data cleared again). Click 'Run the Bell test' — it strikes 300 poses at each of four special dial settings and combines the results into one score. In 1964, John Bell proved that ANY script scores at most 2.00. Watch the meter break the red ceiling.",
  s:function(){setSource('quantum');}},
 {t:"And that's the whole story: a curve no straight line can imitate, and a score no script can reach. The two qubits never carried hidden answers — they share one quantum state, so the randomness itself is shared. Real versions of this experiment won the 2022 Nobel Prize in Physics. Try the Mystery box to test yourself, and read the field notes at the bottom. Tour complete!",
  s:function(){}}
];
var tourAt=-1;
function tourShow(){
  $('tourText').textContent=TOUR[tourAt].t;
  $('tourCount').textContent='step '+(tourAt+1)+' of '+TOUR.length;
  $('tourNext').textContent=tourAt===TOUR.length-1?'Finish':'Next';
  TOUR[tourAt].s();
}
$('tourNext').addEventListener('click',function(){
  tourAt++;
  if(tourAt>=TOUR.length){$('tourBox').hidden=true;return;}
  $('tourSkip').textContent='Skip the rest';
  tourShow();
});
$('tourSkip').addEventListener('click',function(){$('tourBox').hidden=true;});

// ---------- a real backend (the Qollab build attaches a host: Qiskit in the page + the Select QPU backend) ----------
var host=null, hostInfo=null, hostJobUsed=false;
function fmt(x){return (x>=0?'+':'−')+Math.abs(x).toFixed(3);}
function showBackendResult(r){
  // One standard error of S: each E from N poses has variance (1 − E²)/N.
  var err=Math.sqrt(r.correlations.reduce(function(t,e){return t+(1-e*e)/r.shots;},0)), beat=r.S-2*err>2;
  var rows=r.settings.map(function(st,k){
    return '<tr><td>Alice '+st[0]+'° · Bob '+st[1]+'°</td><td>'+fmt(r.correlations[k])+'</td><td>'+fmt(r.exact_correlations[k])+'</td></tr>';
  }).join('');
  $('hwResult').innerHTML='<p class="hw-s">S = '+r.S.toFixed(2)+' <small>± '+err.toFixed(2)+' · '+r.shots+' poses per setting · '+hostInfo.label+'</small></p>'+
    '<p class="verdict'+(beat?' beat':'')+'">'+(beat
      ?'Above 2, even allowing for chance. No script could do that. This came from qubits on '+hostInfo.label+(hostInfo.ionq?', noise and all.':'.')
      :'Not clearly above 2 this time'+(hostInfo.ionq?'. Noise can pull the score down; try more shots next Run.':'; try more shots.'))+'</p>'+
    '<table class="hw-table"><thead><tr><th>Dials</th><th>Measured E</th><th>Qiskit exact</th></tr></thead><tbody>'+rows+'</tbody></table>'+
    '<p class="hw-wait">Qiskit\'s exact answer is S = '+r.exact_S.toFixed(3)+' (the quantum maximum). Random sampling scatters around it by about ± '+err.toFixed(2)+'. All four settings ran as one '+(2*r.settings.length)+'-qubit job'+(r.seconds?' in '+r.seconds.toFixed(1)+' s':'')+'.</p>';
}
function runOnBackend(){
  var btn=$('hwBtn');
  if(hostInfo.ionq&&hostJobUsed){$('hwResult').innerHTML='<p class="hw-wait">Qollab gives you one IonQ job per Run. Press Stop, then Run again to send another.</p>';return;}
  if(hostInfo.paid&&btn.dataset.confirm!=='yes'){btn.dataset.confirm='yes';btn.textContent='Click again to spend Qollab credits';return;}
  btn.disabled=true;btn.textContent='Running…';
  $('hwResult').innerHTML='<p class="hw-wait">Sent to '+hostInfo.label+'. '+(hostInfo.ionq?'IonQ simulates every shot with real-device noise, so this can take a minute.':'')+'</p>';
  if(hostInfo.ionq)hostJobUsed=true;
  host.run(+$('hwShots').value).then(function(r){
    showBackendResult(r);
  },function(err){
    $('hwResult').innerHTML='<p class="hw-wait">That didn\'t work: '+String(err&&err.message||err).slice(0,200)+'</p>';
  }).then(function(){
    btn.disabled=hostInfo.ionq&&hostJobUsed;btn.dataset.confirm='';
    btn.textContent=btn.disabled?'One IonQ job per Run':'Run it again';
  });
}
window.entangledBodies={
  attachHost:function(h){
    host=h;
    return host.describe().then(function(info){
      hostInfo=info;
      $('hwTitle').textContent='Now on '+info.label;
      $('hwNote').textContent='The same four dial settings, run with Qiskit '+info.qiskit+' on the backend you picked in Select QPU. '+
        (info.ionq?'IonQ takes one job per Run, so all four settings go out together as one 8-qubit circuit.':'Pick an IonQ simulator there to see real-device noise.');
      $('hwBtn').textContent='Run it on '+info.short;
      $('hwBox').hidden=false;
      return info;
    });
  }
};
$('hwBtn').addEventListener('click',runOnBackend);

// ---------- boot ----------
function start(){
  setNeedles();drawChart();drawAmps();updateTally();
  $('tourText').textContent='New here? This two-minute tour walks you through what the game is showing, one click at a time. No physics background needed.';
  $('tourCount').textContent='';
}
if(window.claude&&window.claude.hot&&window.claude.hot.ready){window.claude.hot.ready(start);}else{start();}
})();
