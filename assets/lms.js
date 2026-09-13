(function () {
  'use strict';
  let api=null,initialized=false,closed=false,fault='',interactionCount=0;
  const objectiveIndices=new Map(),pending=[];
  function find(start,seen=new Set()) {
    let w=start;
    for(let i=0;i<16&&w&&!seen.has(w);i++){
      seen.add(w);
      try {if(w.API&&typeof w.API.LMSInitialize==='function')return w.API;if(w.parent===w)break;w=w.parent;}catch(_){break;}
    }
    try {if(start.opener)return find(start.opener,seen);}catch(_){}
    return null;
  }
  function call(method,...args){try{return api[method](...args);}catch(_){fault='La communication avec Éléa a été interrompue.';return 'false';}}
  function error(){try{return String(api.LMSGetLastError());}catch(_){return '101';}}
  function get(key){if(!initialized)return '';const value=call('LMSGetValue',key);if(error()!=='0'){fault='Impossible de relire la progression dans Éléa.';return '';}return String(value??'');}
  function set(key,value){if(!initialized||closed)return false;const ok=String(call('LMSSetValue',key,String(value)))==='true';if(!ok)fault='Éléa n’a pas confirmé l’enregistrement. Garde la page ouverte et réessaie.';return ok;}
  function commit(){if(!initialized||closed)return false;const ok=String(call('LMSCommit',''))==='true';if(!ok)fault='Éléa n’a pas confirmé la sauvegarde. Garde la page ouverte et réessaie.';return ok;}
  function init(){
    api=find(window);if(!api)return false;
    initialized=String(call('LMSInitialize',''))==='true';
    if(!initialized){fault='La connexion à Éléa n’a pas pu démarrer. Relance l’activité depuis ton cours.';return false;}
    interactionCount=parseInt(get('cmi.interactions._count'),10)||0;
    const count=parseInt(get('cmi.objectives._count'),10)||0;
    for(let i=0;i<count;i++){const id=get(`cmi.objectives.${i}.id`);if(id)objectiveIndices.set(id,i);}
    return true;
  }
  function time(seconds){seconds=Math.max(0,Math.round(seconds));const h=Math.floor(seconds/3600),m=Math.floor(seconds/60)%60,s=seconds%60;return `${String(Math.min(h,9999)).padStart(4,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}.00`;}
  function ensureObjective(code){const id='LOGIGRAMMES_'+code;if(!objectiveIndices.has(id)){const index=objectiveIndices.size;if(set(`cmi.objectives.${index}.id`,id))objectiveIndices.set(id,index);else return null;}return objectiveIndices.get(id);}
  function report(stats,packed,location,sessionSeconds){
    if(!initialized)return false;fault='';flushInteractions();
    if(packed.length>4096){fault='La progression dépasse la capacité de sauvegarde de ce paquet.';return false;}
    for(const code of ['LIRE','SUIVRE','COMPLETER','CORRIGER']){
      const d=stats.byCompetence[code];if(!d)continue;const i=ensureObjective(code);if(i===null)continue;
      set(`cmi.objectives.${i}.score.min`,0);set(`cmi.objectives.${i}.score.max`,100);set(`cmi.objectives.${i}.score.raw`,d.score);
      set(`cmi.objectives.${i}.status`,d.responded===d.total?'completed':'incomplete');
    }
    set('cmi.core.score.min',0);set('cmi.core.score.max',100);set('cmi.core.score.raw',stats.score);
    set('cmi.core.lesson_status',stats.responded===stats.total?'completed':'incomplete');
    set('cmi.core.lesson_location',location);set('cmi.suspend_data',packed);
    set('cmi.core.session_time',time(sessionSeconds));set('cmi.core.exit','suspend');
    const ok=commit();return ok&&!fault;
  }
  function interaction(q,response,correct,expected,attempt,seconds){
    if(!initialized)return false;
    const now=new Date();pending.push({q,response,correct,expected,attempt,seconds,index:null,clock:`${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`});
    flushInteractions();return pending.length===0;
  }
  function flushInteractions(){
    while(pending.length){
      const item=pending[0],{q,response,correct,expected,attempt,seconds,clock}=item;
      const i=item.index===null?interactionCount:item.index,k=`cmi.interactions.${i}`;
      // A failed write is retried at the same index. It never silently disappears from the report.
      if(!set(k+'.id',`${q.id}_essai_${attempt}`))return;
      if(item.index===null){item.index=i;interactionCount++;}
      ensureObjective(q.skill);
      const fields={'objectives.0.id':'LOGIGRAMMES_'+q.skill,type:'fill-in',time:clock,student_response:String(response).slice(0,255),result:correct===null?'neutral':correct?'correct':'wrong',weighting:q.type==='note'?0:1,latency:time(seconds)};
      if(expected)fields['correct_responses.0.pattern']=String(expected).slice(0,255);
      let ok=true;for(const [name,value] of Object.entries(fields))if(!set(k+'.'+name,value))ok=false;
      if(!ok)return;pending.shift();
    }
  }
  function finish(){if(!initialized||closed)return;commit();call('LMSFinish','');closed=true;initialized=false;}
  window.LearningLMS={init,get,set,commit,report,interaction,finish,time,get connected(){return initialized;},get detected(){return !!api;},get fault(){return fault;}};
}());
