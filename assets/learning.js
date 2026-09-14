(function () {
  'use strict';
  const course=window.LogigrammesCourse,lms=window.LearningLMS,app=document.getElementById('app');
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const key='mission-logigrammes-v3',maxNote=180;
  const connected=lms.init();
  let state={m:0,step:-1,zoom:100,t:[0,0,0],q:[]},view='home',reportModule=0,storageOK=true,saveError='',restored=false;
  let lastTick=Date.now(),lastAction=Date.now(),sessionSeconds=0,draftTimer,initializing=true,readingFailed=false;
  const drafts=new Map(),openedHints=new Set(),startedQuestions=new Map();
  function record(q){return state.q[q.index]||(state.q[q.index]={a:0,c:false,f:false,aid:false,h:0,l:'',i:'',d:'',text:'',n:0,s:false});}
  function enc(values){return values.map(x=>Number(x).toString(36)).join('');}
  function dec(value){return Array.from(value||'').map(c=>parseInt(c,36));}
  function pack(){
    return JSON.stringify([3,state.m,state.step,state.zoom,state.t.map(Math.round),course.questions.map(q=>{
      const r=state.q[q.index];if(!r)return '';
      if(q.type==='note')return r.text||r.n||r.h?[r.text,r.n,r.s?1:0,r.h]:'';
      if(!r.a&&!r.h&&!r.d)return '';
      return [r.a.toString(36),(Number(r.c)+2*Number(r.f)+4*Number(!!r.aid)).toString(36),r.h.toString(36),r.l,r.i,r.d===r.l?'':r.d||'~'].join('.').replace(/\.+$/,'');
    })]);
  }
  function unpack(text){
    const a=JSON.parse(text);if(!Array.isArray(a)||a[0]!==3||!Array.isArray(a[5])||a[5].length!==course.questions.length)throw new Error('Format incompatible');
    state={m:Math.min(3,Math.max(0,Number(a[1])||0)),step:Number(a[2])||0,zoom:Math.min(150,Math.max(90,Number(a[3])||100)),t:[0,1,2].map(i=>Math.max(0,Number(a[4]?.[i])||0)),q:[]};
    course.questions.forEach(q=>{const x=a[5][q.index];if(!x)return;const r=record(q);if(q.type==='note'){if(!Array.isArray(x))return;r.text=String(x[0]||'').slice(0,maxNote);r.n=Number(x[1])||0;r.s=!!x[2];r.h=Number(x[3])||0;}else{const f=String(x).split('.');r.a=parseInt(f[0],36)||0;const flags=parseInt(f[1],36)||0;r.c=!!(flags&1);r.f=!!(flags&2);r.aid=!!(flags&4);r.h=parseInt(f[2],36)||0;r.l=f[3]||'';r.i=f[4]||'';r.d=f[5]===undefined?r.l:f[5]==='~'?'':f[5];}});
  }
  try {
    const saved=connected?lms.get('cmi.suspend_data'):!lms.detected?localStorage.getItem(key):'';
    if(lms.fault&&connected)readingFailed=true;
    if(saved){unpack(saved);restored=true;}
  } catch(_){if(connected){readingFailed=true;saveError='La progression enregistrée n’a pas pu être relue. Ferme puis relance cette activité ; elle n’a pas été remplacée.';}else storageOK=false;}
  function selectedQuestions(module=0){return course.questions.filter(q=>!module||q.module===module);}
  function stats(module=0){
    const qs=selectedQuestions(module),byCompetence={};
    const total={total:0,responded:0,automatic:0,correct:0,first:0,attempts:0,errors:0,hints:0,aided:0,notes:0,submitted:0,score:0,byCompetence};
    for(const q of qs){const r=record(q),d=byCompetence[q.skill]||(byCompetence[q.skill]={total:0,responded:0,automatic:0,correct:0,first:0,attempts:0,errors:0,hints:0,aided:0,notes:0,submitted:0,score:0});
      for(const target of [total,d]){target.total++;if(q.type==='note'){target.notes++;if(r.s){target.responded++;target.submitted++;}}else{target.automatic++;if(r.a)target.responded++;if(r.c)target.correct++;if(r.f)target.first++;target.attempts+=r.a;target.errors+=Math.max(0,r.a-(r.c?1:0));target.hints+=r.h;if(r.h)target.aided++;}}
    }
    for(const d of [total,...Object.values(byCompetence)])d.score=d.automatic?Math.round(100*d.first/d.automatic):0;
    return total;
  }
  function tick(){const now=Date.now(),elapsed=Math.min(20,(now-lastTick)/1000);lastTick=now;if(!document.hidden&&now-lastAction<120000&&view==='module'&&state.m){state.t[state.m-1]+=elapsed;sessionSeconds+=elapsed;}}
  function save(){
    if(initializing||readingFailed)return;
    tick();saveError='';
    if(connected){if(!lms.report(stats(),pack(),`${state.m}:${state.step}`,sessionSeconds))saveError=lms.fault||'Sauvegarde non confirmée.';}
    else if(!lms.detected){try{localStorage.setItem(key,pack());storageOK=true;}catch(_){storageOK=false;}}
    updateChrome();
  }
  function requestSave(){clearTimeout(draftTimer);draftTimer=setTimeout(save,500);}
  function updateChrome(){
    const s=stats(),progress=Math.round(100*s.responded/s.total),bar=document.getElementById('save-bar');
    document.getElementById('progress').value=progress;document.getElementById('progress-label').textContent=`Parcours : ${s.responded} / ${s.total} réponses déposées`;
    const problem=saveError||lms.fault;
    document.getElementById('save-label').textContent=problem||(connected?'Progression enregistrée dans Éléa':lms.detected?'Connexion Éléa indisponible':storageOK?'Progression enregistrée sur cet appareil':'Sauvegarde locale indisponible : garde la page ouverte et imprime ton bilan');
    bar.classList.toggle('save-error',!!problem||(!connected&&lms.detected));
    document.getElementById('zoom-label').textContent=`${state.zoom} %`;
    document.documentElement.style.setProperty('--scale',state.zoom/100);
    const m=course.modules.find(m=>m.id===state.m);
    document.getElementById('brand-title').textContent=view==='module'&&m?`Module ${m.id} — ${m.title}`:'Mission Logigrammes';
    document.body.dataset.module=view==='module'?state.m:0;
    document.title=view==='module'&&m?`Mission Logigrammes — ${m.title}`:'Mission Logigrammes — Technologie 4e';
  }
  function duration(seconds){const minutes=Math.floor(seconds/60);return `${minutes} min ${Math.floor(seconds%60)} s`;}
  function route(hash){try{history.replaceState(null,'','#'+hash);}catch(_){}}
  function renderHome(){
    route('accueil');
    view='home';const s=stats();
    app.innerHTML=`<section class="hero"><div><p class="kicker">DOSSIER 04 · SYSTÈMES AUTOMATISÉS</p><h1>Qui percera les secrets des <span>logigrammes ?</span></h1><p>Observe, teste et répare les programmes de la mission. Chaque flèche compte.</p><p><span class="badge">4e</span> <span class="badge">2 séances de 55 min</span> <span class="badge">Aides à la demande</span></p></div><aside class="dossier"><span class="stamp">MESSAGE DE PIXEL</span><h2>Agent, à toi de raisonner.</h2><p>Un mauvais essai est une information utile. Tu peux demander un coup de pouce et corriger ta réponse.</p><p>${s.responded?`${s.responded} réponses déjà déposées. Reprends là où tu en étais.`:'Garde un brouillon pour dessiner les chemins et vérifier tes idées.'}</p><button data-resume class="primary">${s.responded||restored?'Reprendre ma mission':'Commencer la première mission'} →</button></aside></section>
    <section class="session-plan" aria-label="Organisation des deux séances"><div><h3>Séance 1 · 55 minutes</h3><p>5 min de lancement avec le professeur<br>25 min · Lire et suivre<br>25 min · Compléter</p></div><div><h3>Séance 2 · 55 minutes</h3><p>4 min de réactivation<br>6 enquêtes de 8 min · Corriger et transférer<br>3 min · Lire et imprimer le bilan</p></div></section>
    <h2>Ton plan de mission</h2><div class="module-grid">${course.modules.map(m=>{const d=stats(m.id);return `<article class="mission-card"><span class="num">0${m.id}</span><h2>${esc(m.title)}</h2><p>${esc(m.subtitle)}</p><div class="facts"><span class="badge">${m.duration} min</span>${m.skills.map(s=>`<span class="badge">${course.label(s)}</span>`).join('')}</div><p class="muted">${d.responded} / ${d.total} réponses déposées</p><a href="${moduleFile(m.id)}" data-module-link="${m.id}" class="launch">Ouvrir la mission ${m.id} →</a></article>`;}).join('')}</div>
    <div class="button-row"><button data-report="0">Voir le bilan complet</button></div><p class="step-note">Les durées sont des repères de travail : observe le schéma, justifie tes choix et vérifie tes réponses. Les activités « Pour aller plus loin » sont proposées si tu termines en avance.</p>`;
    updateChrome();
  }
  function moduleFile(id){return ['','module-1-lire-suivre.html','module-2-completer.html','module-3-corriger.html'][id];}
  function path(m){return `<nav aria-label="Parcours du module"><ol class="path"><li><button data-step="-1" ${state.step<0?'aria-current="step"':''}>Départ<small>${m.introMinutes} min</small></button></li>${m.steps.map((s,i)=>`<li><button data-step="${i}" ${state.step===i?'aria-current="step"':''}>${i+1}. ${esc(s.title)}<small>${s.minutes} min · ${s.questions.filter(q=>q.type==='note'?record(q).s:record(q).a).length}/${s.questions.length}</small></button></li>`).join('')}<li><button data-report="${m.id}">Mon bilan<small>${m.summaryMinutes} min</small></button></li></ol></nav>`;}
  function symbols(){return `<div class="symbols"><div class="symbol"><svg viewBox="0 0 150 80" aria-hidden="true"><rect x="8" y="15" width="134" height="50" rx="25" fill="#fff1d0" stroke="#2c2a4a" stroke-width="3"/></svg><strong>Ovale</strong><span>DÉBUT / FIN</span></div><div class="symbol"><svg viewBox="0 0 150 80" aria-hidden="true"><rect x="8" y="15" width="134" height="50" rx="3" fill="#dcf7f1" stroke="#2c2a4a" stroke-width="3"/></svg><strong>Rectangle</strong><span>Action</span></div><div class="symbol"><svg viewBox="0 0 150 80" aria-hidden="true"><polygon points="75,4 146,40 75,76 4,40" fill="#eceaff" stroke="#2c2a4a" stroke-width="3"/></svg><strong>Losange</strong><span>Condition</span></div></div>`;}
  function renderModule(module,step=-1,focus=true){
    tick();state.m=module;const m=course.modules.find(m=>m.id===module);state.step=Math.max(-1,Math.min(m.steps.length-1,step));view='module';route(`module-${module}-etape-${state.step+1}`);
    let content;
    if(state.step<0)content=`<section class="card"><p class="kicker">Mission 0${m.id} · ${m.duration} min</p><h1>${esc(m.title)} un logigramme</h1><p>${esc(m.intro)}</p><p>Prépare ton brouillon. Les tableaux se remplissent ligne par ligne. Pour ordonner un chemin, sélectionne les étapes puis utilise « Vérifier ».</p><p>Les réponses écrites sont de courtes justifications (${maxNote} caractères maximum). Elles seront relues par ton professeur. Tu peux aussi préparer ta phrase oralement avant de l’écrire.</p><div class="button-row"><button data-step="0" class="primary">Entrer dans la mission →</button><button data-speak-text="${esc(m.intro)}">Écouter le départ</button></div></section>`;
    else {
      const s=m.steps[state.step];
      content=`<section class="card"><p class="kicker">Mission ${m.id} · Étape ${state.step+1} · Repère : ${s.minutes} min</p><h1>${esc(s.title)}</h1><p>${esc(s.lesson)}</p><button class="small" data-speak-text="${esc(s.lesson)}">Écouter la situation</button></section>
      ${s.symbols?`<section class="card">${symbols()}</section>`:''}<div class="${s.diagram?'work-grid':''}">${s.diagram?`<aside class="card diagram-card">${window.FlowDiagrams.render(s.diagram,`m${m.id}s${state.step}`)}</aside>`:''}<section aria-label="Défis de l’étape">${s.questions.map((q,i)=>questionHTML(q,i)).join('')}</section></div>
      ${s.workshop?`<section class="card atelier"><p class="kicker">Carnet d’enquête · Travail demandé sur le brouillon</p><h2>Dessine et prouve ta correction</h2><p>${esc(s.workshop)}</p><p class="step-note">Repère pour cette enquête de 8 min : 1 min d’observation, 3 min de défis et de justification, 3 min de dessin et de tests, 1 min de vérification. Garde ce tracé pour le professeur.</p><button class="small" data-speak-text="${esc(s.workshop)}">Écouter le travail sur brouillon</button></section>`:''}
      <div class="next-bar"><button data-step="${state.step-1}">← Étape précédente</button><span class="step-note">${s.questions.filter(q=>q.type==='note'?!record(q).s:!record(q).a).length} réponse(s) encore à déposer dans cette étape</span>${state.step===m.steps.length-1?`<button class="primary" data-report="${m.id}">Lire mon bilan →</button>`:`<button class="primary" data-step="${state.step+1}">Étape suivante →</button>`}</div>
      <details class="extension"><summary>Pour aller plus loin · Sur ton brouillon</summary>${extension(s)}</details>`;
    }
    app.innerHTML=path(m)+content;updateChrome();save();if(focus)focusHeading();
  }
  function extension(step){const x=step.extension;return `<p class="step-note">Facultatif · Si tu as terminé l’étape. Garde ton travail sur papier pour le montrer au professeur.</p><h3>${esc(x.title)}</h3><p>${esc(x.task)}</p><p><strong>Pour vérifier ton raisonnement :</strong> ${esc(x.check)}</p><button class="small" data-speak-text="${esc([x.title,x.task,x.check].join('. '))}">Écouter le prolongement</button><details class="extension-hint"><summary>Coup de pouce pour ce prolongement</summary><p>${esc(x.hint)}</p><button class="small" data-speak-text="${esc(x.hint)}">Écouter cette aide</button></details>`;}
  function questionHTML(q,i){
    const r=record(q),disabled=r.c?'disabled':'',title=`title-${q.id}`,hint=`hint-${q.id}`,values=dec(r.d);
    startedQuestions.set(q.id,Date.now());
    let controls='';
    if(q.type==='choice')controls=`<fieldset><legend class="sr-only">${esc(q.prompt)}</legend><div class="options">${q.options.map((o,j)=>`<label class="option"><input type="radio" name="${q.id}" value="${j}" ${r.d===enc([j])?'checked':''} ${disabled}><span>${esc(o)}</span></label>`).join('')}</div></fieldset>`;
    if(q.type==='table')controls=`<table class="trace-table"><thead class="sr-only"><tr><th>Situation</th><th>Réponse</th></tr></thead><tbody>${q.rows.map((row,j)=>`<tr><th scope="row"><label for="${q.id}-${j}">${esc(row.label)}</label></th><td><select id="${q.id}-${j}" data-row="${j}" ${disabled}><option value="">Choisir…</option>${row.options.map((o,k)=>`<option value="${k}" ${values[j]===k?'selected':''}>${esc(o)}</option>`).join('')}</select></td></tr>`).join('')}</tbody></table>`;
    if(q.type==='order')controls=`<p class="step-note">Sélectionne toutes les étapes dans l’ordre. Tu peux retirer la dernière ou recommencer avant de vérifier.</p><div class="order-bank">${q.options.map((o,j)=>`<button type="button" data-piece="${j}" ${r.c||values.includes(j)?'disabled':''}>${esc(o)}</button>`).join('')}</div><ol class="built-order" aria-live="polite">${values.map(x=>`<li>${esc(q.options[x])}</li>`).join('')}</ol><div class="button-row"><button class="small" data-undo ${disabled}>Retirer la dernière</button><button class="small" data-clear ${disabled}>Recommencer l’ordre</button></div>`;
    if(q.type==='note')controls=`<label for="note-${q.id}" class="sr-only">${esc(q.prompt)}</label><textarea id="note-${q.id}" data-note maxlength="${maxNote}" placeholder="Écris une ou deux phrases courtes…">${esc(r.text)}</textarea><div class="counter"><span data-counter>${r.text.length}</span> / ${maxNote}</div><p class="step-note">Réponse à relire par le professeur. Elle n’est pas notée automatiquement.</p>`;
    const speech=[q.prompt,q.type==='table'?q.rows.map(r=>r.label+'. Choix : '+r.options.join(' ; ')).join('. '):(q.options||[]).join(' ; ')].filter(Boolean).join('. ');
    return `<article class="question ${r.c?'done':''}" data-question="${q.id}" aria-labelledby="${title}"><span class="question-number">${q.type==='note'?'Justification':'Défi'} ${i+1} · ${course.label(q.skill)}</span><h3 id="${title}">${esc(q.prompt)}</h3><div class="question-tools"><button type="button" data-speak-text="${esc(speech)}">Écouter</button><button type="button" class="hint-button" data-hint aria-controls="${hint}" aria-expanded="${openedHints.has(q.id)}">Coup de pouce</button></div><div class="hint" id="${hint}" ${openedHints.has(q.id)?'':'hidden'}><p>${esc(q.hint)}</p><button class="small" data-speak-text="${esc(q.hint)}">Écouter le coup de pouce</button></div>${controls}<button type="button" class="primary" data-check ${q.type!=='note'&&r.c?'disabled':''}>${q.type==='note'?'Déposer ma justification':r.c?'Réponse correcte':'Vérifier'}</button><div class="feedback ${q.type==='note'&&r.s?'neutral':r.c?'good':r.a?'retry':''}" role="status">${q.type==='note'?(r.s?'Justification déposée ; elle reste à relire par le professeur.':r.text?'Brouillon enregistré. Pense à déposer ta justification.':''):r.c?esc(q.explain):r.a?'Cette réponse n’est pas encore correcte. Tu peux demander un coup de pouce et réessayer.':''}</div></article>`;
  }
  function expected(q){return q.type==='choice'?enc([q.answer]):q.type==='order'?enc(q.answer):q.type==='table'?enc(q.rows.map(r=>r.answer)):'';}
  function answerText(q,code){const values=dec(code);if(q.type==='choice')return q.options[values[0]]||'—';if(q.type==='order')return values.map(v=>q.options[v]||'?').join(' → ');if(q.type==='table')return q.rows.map((row,i)=>`${row.label} : ${row.options[values[i]]??'—'}`).join(' ; ');return record(q).text;}
  function saveDraft(q,box){const r=record(q);if(q.type==='choice'){const selected=box.querySelector('input:checked');r.d=selected?enc([Number(selected.value)]):'';}if(q.type==='table')r.d=Array.from(box.querySelectorAll('select')).map(s=>s.value===''?'_':Number(s.value).toString(36)).join('');requestSave();}
  function validate(q,box){
    const r=record(q),feedback=box.querySelector('.feedback');
    if(q.type==='note'){
      if(!r.text.trim()){feedback.textContent='Écris ta justification avant de la déposer.';return;}
      r.s=true;r.n++;lms.interaction(q,r.text,null,'',r.n,(Date.now()-startedQuestions.get(q.id))/1000);
      feedback.className='feedback neutral';feedback.textContent='Justification déposée. Le professeur pourra la relire dans ton bilan.';save();return;
    }
    if(r.c)return;
    saveDraft(q,box);
    const count=q.type==='choice'?1:q.type==='table'?q.rows.length:q.options.length;
    if(r.d.length!==count||r.d.includes('_')){feedback.className='feedback neutral';feedback.textContent='Complète toute la réponse avant de vérifier. Aucun essai n’a été compté.';return;}
    const good=r.d===expected(q);r.a++;if(r.a===1){r.i=r.d;r.f=good;r.aid=r.h>0;}r.l=r.d;r.c=good;
    lms.interaction(q,answerText(q,r.d),good,answerText(q,expected(q)),r.a,(Date.now()-startedQuestions.get(q.id))/1000);startedQuestions.set(q.id,Date.now());
    feedback.className=`feedback ${good?'good':'retry'}`;
    if(good){feedback.textContent=q.explain;box.classList.add('done');box.querySelectorAll('input,select,[data-piece],[data-undo],[data-clear],[data-check]').forEach(el=>el.disabled=true);box.querySelector('[data-check]').textContent='Réponse correcte';}
    else {const matched=q.type==='table'?q.rows.filter((row,i)=>dec(r.d)[i]===row.answer).length:null;feedback.textContent=(matched!==null?`${matched} ligne(s) correcte(s) sur ${q.rows.length}. `:'')+'Cette proposition n’est pas encore correcte. Relis le besoin et suis les flèches. Le coup de pouce reste disponible sur demande.';}
    save();
  }
  function renderSummary(module=0){
    tick();view='report';reportModule=module;route('bilan-'+module);const s=stats(module),qs=selectedQuestions(module),times=module?state.t[module-1]:state.t.reduce((a,b)=>a+b,0);
    app.innerHTML=`<section class="report"><div class="card"><p class="kicker">Rapport de mission · ${module?'Module '+module:'Parcours complet'}</p><h1>Mon bilan détaillé</h1><p class="print-only">Nom : _____________________ Classe : __________ Date : __________</p><p>${s.responded} / ${s.total} réponses déposées · Temps d’activité estimé : ${duration(times)}</p><div class="summary-metrics"><div class="metric"><strong>${s.first} / ${s.automatic}</strong><span>Réussites au 1er essai</span></div><div class="metric"><strong>${s.correct} / ${s.automatic}</strong><span>Réussites après correction</span></div><div class="metric"><strong>${s.errors}</strong><span>Vérifications incorrectes</span></div><div class="metric"><strong>${s.submitted} / ${s.notes}</strong><span>Justifications déposées</span></div></div><p>Score automatique : ${s.score} %. Il correspond aux réussites au premier essai sur l’ensemble des défis automatiques. Une aide ne retire aucun point ; son utilisation est indiquée séparément. Les réponses écrites demandent une relecture du professeur. Présente aussi les six dessins du carnet d’enquête : ils sont à vérifier sur papier.</p><p class="page-note">${s.responded===s.total?'Toutes les réponses sont déposées. Relis tes erreurs et tes justifications avec le professeur.':`Le parcours est encore en cours : ${s.total-s.responded} réponse(s) à déposer.`}</p><div class="table-scroll"><table class="report-table"><thead><tr><th>Compétence</th><th>1er essai</th><th>Après correction</th><th>Erreurs</th><th>Défis avec aide</th><th>Écrits déposés</th></tr></thead><tbody>${Object.entries(s.byCompetence).map(([code,d])=>`<tr><th scope="row">${course.label(code)}</th><td>${d.first}/${d.automatic} (${d.score} %)</td><td>${d.correct}/${d.automatic}</td><td>${d.errors}</td><td>${d.aided}/${d.automatic}</td><td>${d.submitted}/${d.notes}</td></tr>`).join('')}</tbody></table></div>
      <div class="button-row no-print"><button class="primary" data-print>Imprimer ce bilan</button><button data-export>Exporter le bilan détaillé</button><button data-home>Accueil</button>${module?`<button data-report="0">Bilan des trois modules</button>`:''}</div><div class="button-row no-print">${Object.keys(s.byCompetence).map(code=>`<button data-review="${code}">Revoir ${course.label(code)}</button>`).join('')}</div></div>
      <div class="card"><h2>Ce que je dois reprendre</h2><ul class="summary-notes">${advice(qs)}</ul></div>
      <div class="card"><h2>Mes réponses, défi par défi</h2><div class="table-scroll"><table class="report-table"><thead><tr><th style="width:30%">Défi / compétence</th><th style="width:40%">Réponses</th><th style="width:30%">Suivi</th></tr></thead><tbody>${qs.map(q=>{const r=record(q);return `<tr><td><strong>${esc(q.prompt)}</strong><p class="tiny">M${q.module} · ${course.label(q.skill)} · ${q.id}</p></td><td>${q.type==='note'?`<div class="response-note">${esc(r.text||'Pas de texte saisi.')}</div>`:`<p><strong>1er essai :</strong> ${esc(r.a?answerText(q,r.i):'Non répondu')}</p><p><strong>Dernier essai :</strong> ${esc(r.a?answerText(q,r.l):'—')}</p>`}</td><td>${q.type==='note'?`${r.s?'Déposée · à relire par le professeur':'Brouillon / non déposée'}<p>${r.h} ouverture(s) d’aide</p>`:`${r.c?'Correct après '+r.a+' essai(s)':r.a?'À corriger':'À faire'}<p>${Math.max(0,r.a-(r.c?1:0))} erreur(s) · ${r.h} ouverture(s) d’aide</p>${r.aid?'<p>Aide consultée avant le 1er essai.</p>':''}`}<button class="small no-print" data-open-question="${q.id}">Revoir</button></td></tr>`;}).join('')}</tbody></table></div></div><p class="muted">Le temps est une estimation du temps passé dans les modules au premier plan ; une longue inactivité est exclue. Les temps et les scores ne constituent pas à eux seuls une évaluation de la compétence.</p></section>`;
    updateChrome();save();focusHeading();
  }
  function advice(qs){const needs=qs.filter(q=>q.type!=='note'&&!record(q).c);const notes=qs.filter(q=>q.type==='note'&&!record(q).s);let items=needs.slice(0,6).map(q=>`<li>${esc(q.prompt)} <button class="small no-print" data-open-question="${q.id}">Reprendre</button></li>`);if(notes.length)items.push(`<li>Déposer ${notes.length} justification(s) écrite(s) encore en brouillon.</li>`);if(!needs.length&&!notes.length)items.push('<li>Tous les défis automatiques sont corrigés. Explique au professeur comment tu as corrigé tes premières erreurs.</li>');return items.join('');}
  function focusHeading(){const heading=app.querySelector('h1');if(heading){heading.tabIndex=-1;heading.focus({preventScroll:true});}window.scrollTo(0,0);}
  function qBy(id){return course.questions.find(q=>q.id===id);}
  function renderOrder(q,box){const r=record(q),values=dec(r.d);box.querySelector('.built-order').innerHTML=values.map(v=>`<li>${esc(q.options[v])}</li>`).join('');box.querySelectorAll('[data-piece]').forEach(b=>b.disabled=values.includes(Number(b.dataset.piece)));requestSave();}
  function speak(text){
    if(!('speechSynthesis'in window)){document.getElementById('audio-status').textContent='La lecture vocale n’est pas disponible dans ce navigateur.';return;}
    window.speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang='fr-FR';u.rate=.9;u.onerror=()=>{document.getElementById('audio-status').textContent='Lecture vocale indisponible. Le texte reste affiché.';};window.speechSynthesis.speak(u);
  }
  function downloadReport(){const s=stats(reportModule),title='Bilan Logigrammes';const html=`<!doctype html><html lang="fr"><meta charset="utf-8"><title>${title}</title><style>body{font:16px/1.45 Arial;margin:30px;color:#2c2a4a}table{border-collapse:collapse;width:100%;table-layout:fixed;overflow-wrap:anywhere}td,th{border:1px solid #aaa;padding:8px;text-align:left;vertical-align:top}th{background:#f1edf8}.no-print,button{display:none}h1,h2{color:#2c2a4a}.summary-metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}.metric{border:1px solid #aaa;padding:12px;border-radius:10px}.metric strong{display:block;font-size:24px}.metric span,.tiny{font-size:13px}.response-note{white-space:pre-wrap}thead{display:table-header-group}tr,.metric{break-inside:avoid}h2{break-after:avoid}@page{size:A4;margin:12mm}@media print{body{font-size:10pt;margin:0}.report-table{font-size:9pt}.report-table p{margin:4px 0}.summary-metrics{gap:8px}.metric{padding:6px}.metric strong{font-size:16pt}}</style><body>${app.querySelector('.report').innerHTML}</body></html>`;const blob=new Blob([html],{type:'text/html;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`bilan-logigrammes-${reportModule?'module-'+reportModule:'complet'}.html`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  document.addEventListener('click',e=>{
    const b=e.target.closest('button,a[data-home],a[data-module-link]');if(!b)return;
    if(b.hasAttribute('data-home')){e.preventDefault();tick();renderHome();save();focusHeading();return;}
    if(b.hasAttribute('data-module-link')){e.preventDefault();renderModule(Number(b.dataset.moduleLink),-1);return;}
    if(b.hasAttribute('data-resume')){renderModule(state.m||1,state.m?state.step:-1);return;}
    if(b.hasAttribute('data-step')){renderModule(state.m,Number(b.dataset.step));return;}
    if(b.hasAttribute('data-report')){renderSummary(Number(b.dataset.report));return;}
    if(b.hasAttribute('data-review')){const qs=course.questions.filter(q=>q.skill===b.dataset.review),q=qs.find(q=>q.type==='note'?!record(q).s:!record(q).c)||qs[0];renderModule(q.module,q.step);return;}
    if(b.hasAttribute('data-open-question')){const q=qBy(b.dataset.openQuestion);renderModule(q.module,q.step);document.querySelector(`[data-question="${q.id}"]`).scrollIntoView({block:'start'});return;}
    if(b.hasAttribute('data-zoom')){state.zoom=Math.min(150,Math.max(90,state.zoom+Number(b.dataset.zoom)));save();return;}
    if(b.hasAttribute('data-speak-text')){speak(b.dataset.speakText);return;}
    if(b.hasAttribute('data-stop-audio')){if(window.speechSynthesis)window.speechSynthesis.cancel();return;}
    if(b.hasAttribute('data-print')){window.print();return;}
    if(b.hasAttribute('data-export')){downloadReport();return;}
    if(b.hasAttribute('data-save')){save();return;}
    const box=b.closest('[data-question]');if(!box)return;const q=qBy(box.dataset.question),r=record(q);
    if(b.hasAttribute('data-hint')){const on=!openedHints.has(q.id);if(on){openedHints.add(q.id);r.h++;}else openedHints.delete(q.id);box.querySelector('.hint').hidden=!on;b.setAttribute('aria-expanded',on);b.textContent=on?'Masquer le coup de pouce':'Coup de pouce';save();return;}
    if(b.hasAttribute('data-piece')&&!r.c){r.d+=enc([Number(b.dataset.piece)]);renderOrder(q,box);return;}
    if(b.hasAttribute('data-undo')&&!r.c){r.d=r.d.slice(0,-1);renderOrder(q,box);return;}
    if(b.hasAttribute('data-clear')&&!r.c){r.d='';renderOrder(q,box);return;}
    if(b.hasAttribute('data-check'))validate(q,box);
  });
  document.addEventListener('change',e=>{const box=e.target.closest('[data-question]');if(box)saveDraft(qBy(box.dataset.question),box);});
  document.addEventListener('input',e=>{if(!e.target.hasAttribute('data-note'))return;const box=e.target.closest('[data-question]'),q=qBy(box.dataset.question),r=record(q);r.text=e.target.value.slice(0,maxNote);r.s=false;let limited=false;while(pack().length>4000&&r.text.length){r.text=r.text.slice(0,-1);limited=true;}if(limited)e.target.value=r.text;box.querySelector('[data-counter]').textContent=r.text.length;box.querySelector('.feedback').textContent=limited?'Capacité maximale du carnet atteinte. Raccourcis cette justification avant de la déposer.':'Brouillon conservé. Pense à déposer ta justification.';requestSave();});
  ['pointerdown','keydown','scroll'].forEach(event=>document.addEventListener(event,()=>{lastAction=Date.now();},{passive:true}));
  document.addEventListener('visibilitychange',()=>{tick();save();lastTick=Date.now();});
  window.addEventListener('pagehide',e=>{save();if(!e.persisted)lms.finish();});
  window.addEventListener('beforeunload',()=>{save();lms.finish();});
  let beforePrint=null;
  window.addEventListener('beforeprint',()=>{if(view!=='report'){beforePrint={view,m:state.m,step:state.step};renderSummary(0);}});
  window.addEventListener('afterprint',()=>{if(beforePrint){const v=beforePrint;beforePrint=null;if(v.view==='module')renderModule(v.m,v.step,false);else renderHome();}});
  window.addEventListener('popstate',()=>{renderHome();});
  initializing=false;
  const direct=Number(document.body.dataset.initialModule)||0,hash=location.hash.match(/^#module-([1-3])-etape-(\d+)$/),reportHash=location.hash.match(/^#bilan-([0-3])$/);
  if(connected&&restored&&state.m)renderModule(state.m,state.step,false);else if(hash)renderModule(Number(hash[1]),Number(hash[2])-1,false);else if(reportHash)renderSummary(Number(reportHash[1]));else if(direct&&location.hash!=='#accueil')renderModule(direct,restored&&state.m===direct?state.step:-1,false);else renderHome();
  save();setInterval(save,15000);
  // Structured, read-only inspection for local quality assurance and compatible browsers.
  window.LogigrammesApp={stats,pack,get state(){return state;}};
  const context=document.modelContext;
  if(context?.registerTool){try{Promise.resolve(context.registerTool({name:'get_learning_progress',description:'Lire le bilan du parcours, sans identité.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true},execute:()=>stats()})).catch(()=>{});}catch(_){}}
}());
