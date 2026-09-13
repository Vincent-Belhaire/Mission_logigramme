(function () {
  'use strict';
  const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const node = (id, type, x, y, text, w = 260, h = 64) => ({id,type,x,y,text,w,h});
  const port = (n,p) => p === 't' ? [n.x,n.y-n.h/2] : p === 'b' ? [n.x,n.y+n.h/2] : p === 'l' ? [n.x-n.w/2,n.y] : [n.x+n.w/2,n.y];
  function graph(id,title,nodes,edges,height,description) { return {id,title,nodes,edges,height,width:760,description}; }
  function edge(nodes,from,fp,to,tp,via=[],label='',labelAt=null,head=true) {
    return {from,to,points:[port(nodes.find(n=>n.id===from),fp),...via,port(nodes.find(n=>n.id===to),tp)],label,labelAt,head};
  }
  function sequence(id,labels,types) {
    const ns=labels.map((text,i)=>node('n'+i,types?.[i]||(i===0||i===labels.length-1?'terminal':'action'),380,50+i*115,text,260,64));
    return graph(id,'Une séquence ponctuelle',ns,ns.slice(1).map((n,i)=>edge(ns,'n'+i,'b',n.id,'t')),labels.length*115,labels.join(' → '));
  }
  function split(id,measure,condition,yes,no,opts={}) {
    const ns=[node('start','terminal',380,45,'DÉBUT',200,54),node('read','action',380,155,measure),node('test',opts.blank?'blank':'decision',380,320,condition,290,140),node('yes','action',575,485,yes,235,70),node('no','action',185,485,no,235,70)];
    const es=[edge(ns,'start','b','read','t'),edge(ns,'read','b','test','t'),edge(ns,'test','r','yes','t',[[575,320]],'VRAI',[610,305]),edge(ns,'test','l','no','t',[[185,320]],'FAUX',[125,305])];
    if(opts.end){ ns.push(node('end','terminal',380,620,'FIN',200,54)); es.push(edge(ns,'yes','b','end','t',[[575,565],[380,565]]),edge(ns,'no','b','end','t',[[185,565],[380,565]])); }
    else { es.push(edge(ns,'yes','b','read','r',[[575,570],[725,570],[725,155]],'Nouveau cycle',[645,601]),edge(ns,'no','b','read','l',[[185,570],[35,570],[35,155]])); }
    return graph(id,opts.title||'Surveiller, agir, recommencer',ns,es,opts.end?670:625,`DÉBUT → ${measure} → ${condition}. VRAI : ${yes}. FAUX : ${no}. ${opts.end?'Les deux chemins se terminent à FIN.':`Après chaque action : retour à « ${measure} ».`}`);
  }
  const diagrams={};
  diagrams.sequence=sequence('sequence',['DÉBUT','Attendre 3 secondes','Allumer la lampe','FIN']);
  diagrams.lamp=split('lamp','Mesurer la luminosité','Luminosité < 20 % ?','Allumer la lampe','Éteindre la lampe');
  diagrams.vent=split('vent','Mesurer la température','Température > 25 °C ?','Ventiler','Arrêter la ventilation',{blank:true,title:'Compléter la forme manquante'});
  diagrams.heater=split('heater','Mesurer la température','Température < 19 °C ?','Éteindre le chauffage','Allumer le chauffage',{title:'Chauffage : programme à examiner'});
  diagrams.alarm=split('alarm','Mesurer la température','Température < 30 °C ?','Activer l’alarme','Désactiver l’alarme',{title:'Alarme : programme à examiner'});
  diagrams.greenhouse=split('greenhouse','Mesurer l’humidité','Humidité < 40 % ?','Laisser la pompe arrêtée','Arroser 5 s puis arrêter',{end:true,title:'Serre : programme à examiner'});
  diagrams.greenhouseFixed=split('greenhouseFixed','Mesurer l’humidité','Humidité < 40 % ?','Arroser 5 s puis arrêter','Laisser la pompe arrêtée',{title:'Serre : programme corrigé'});
  diagrams.robot=split('robot','Lire la couleur du sol','CONDITION À TROUVER','ACTION À TROUVER','Avancer tout droit',{title:'Robot : suivre le bord d’une ligne'});
  diagrams.heatBlank=split('heatBlank','Mesurer la température','CONDITION À TROUVER','Allumer le chauffage','Éteindre le chauffage',{title:'Maintenir une pièce à 19 °C'});
  diagrams.transfer=split('transfer','Mesurer la luminosité','CONDITION À TROUVER','Allumer l’éclairage','Éteindre l’éclairage',{title:'Éclairage du couloir : à compléter'});
  {
    const ns=[node('start','terminal',380,45,'DÉBUT',200,54),node('wait','action',380,155,'Attendre 1 seconde'),node('test','decision',380,320,'Bouton appuyé ?',290,140),node('end','terminal',380,505,'FIN',200,54)];
    diagrams.wait=graph('wait','Attendre jusqu’à un appui',ns,[edge(ns,'start','b','wait','t'),edge(ns,'wait','b','test','t'),edge(ns,'test','b','end','t',[],'VRAI',[423,425]),edge(ns,'test','l','wait','l',[[70,320],[70,155]],'FAUX',[170,305])],565,'DÉBUT → Attendre 1 seconde → Bouton appuyé ? FAUX : revenir attendre 1 seconde. VRAI : FIN.');
  }
  {
    const ns=[node('start','terminal',380,40,'DÉBUT',200,54),node('badge','decision',380,200,'Badge autorisé détecté ?',300,140),node('open','action',380,360,'Ouvrir le portail'),node('passed','decision',380,540,'Élève entièrement passé ?',300,140),node('close','action',380,710,'Fermer le portail')];
    // Decisions leave through their bottom port on VRAI. The left exits form waiting loops.
    const es=[edge(ns,'start','b','badge','t'),edge(ns,'badge','b','open','t',[],'VRAI',[425,302]),edge(ns,'open','b','passed','t'),edge(ns,'passed','b','close','t',[],'VRAI',[425,647]),edge(ns,'badge','l','badge','t',[[60,200],[60,100],[380,100]],'FAUX',[170,185]),edge(ns,'passed','l','passed','t',[[115,540],[115,435],[380,435]],'FAUX',[170,525]),edge(ns,'close','b','badge','t',[[380,800],[705,800],[705,100],[380,100]],'Nouveau cycle',[570,830])];
    diagrams.portal=graph('portal','Le portail fonctionne en boucle',ns,es,855,'DÉBUT → Badge autorisé détecté ? FAUX : vérifier à nouveau le badge. VRAI : ouvrir le portail. Élève entièrement passé ? FAUX : vérifier à nouveau le passage. VRAI : fermer le portail puis revenir vérifier le badge.');
  }
  {
    const ns=[node('start','terminal',380,40,'DÉBUT',200,54),node('read','action',380,150,'Lire le capteur de présence'),node('test','decision',380,320,'CONDITION À TROUVER',300,140),node('give','action',380,495,'ACTION À TROUVER'),node('wait','action',380,625,'Attendre 2 secondes')];
    diagrams.soap=graph('soap','Le distributeur de savon',ns,[edge(ns,'start','b','read','t'),edge(ns,'read','b','test','t'),edge(ns,'test','b','give','t',[],'VRAI',[425,429]),edge(ns,'give','b','wait','t'),edge(ns,'test','l','read','l',[[65,320],[65,150]],'BRANCHE B',[145,305]),edge(ns,'wait','b','read','r',[[380,715],[705,715],[705,150]],'Nouveau cycle',[570,742])],765,'DÉBUT → Lire le capteur de présence → condition à trouver. VRAI : action à trouver → attendre 2 secondes → relire le capteur. Branche B : relire le capteur.');
  }
  {
    const ns=[node('start','terminal',380,40,'DÉBUT',200,54),node('test','decision',380,200,'Ticket valide ?',290,140),node('open','action',380,375,'Lever la barrière'),node('wait','action',380,505,'Attendre le passage complet'),node('close','action',380,635,'Abaisser la barrière')];
    diagrams.parking=graph('parking','Parking : programme à examiner',ns,[edge(ns,'start','b','test','t'),edge(ns,'test','b','open','t',[],'VRAI',[425,302]),edge(ns,'test','l','open','l',[[85,200],[85,375]],'FAUX',[167,185]),edge(ns,'open','b','wait','t'),edge(ns,'wait','b','close','t'),edge(ns,'close','b','test','t',[[380,725],[705,725],[705,100],[380,100]],'Nouveau cycle',[570,752])],780,'DÉBUT → Ticket valide ? VRAI et FAUX mènent tous les deux à Lever la barrière → Attendre le passage complet → Abaisser la barrière → Revenir au test du ticket.');
  }
  diagrams.wrongShape=sequence('wrongShape',['DÉBUT','Fait-il sombre ?','Allumer la lampe','FIN'],['terminal','action','action','terminal']);
  diagrams.wrongShape.title='Un programme à examiner';
  diagrams.wrongShape.description='DÉBUT → rectangle « Fait-il sombre ? » → Allumer la lampe → FIN. Une seule flèche sort du rectangle qui contient la question.';
  {
    const g=split('stale','Mesurer la distance','Distance < 20 cm ?','Arrêter le robot','Avancer tout droit',{title:'Robot : programme à examiner'});
    // Deliberate logical error: each loop reuses the condition without a fresh measurement.
    g.edges=g.edges.slice(0,4);
    g.edges.push(edge(g.nodes,'yes','b','test','t',[[575,570],[725,570],[725,220],[380,220]]),edge(g.nodes,'no','b','test','t',[[185,570],[35,570],[35,220],[380,220]]));
    g.description='DÉBUT → Mesurer la distance → Distance < 20 cm ? VRAI : arrêter. FAUX : avancer. Après chaque action, retour directement à la condition, sans nouvelle mesure.';
    diagrams.stale=g;
  }
  function wrap(text,max=25) { const lines=[]; let line=''; for(const word of text.split(' ')){if(line&&(`${line} ${word}`).length>max){lines.push(line);line=word;}else line+=(line?' ':'')+word;}if(line)lines.push(line);return lines; }
  function render(id, suffix='') {
    const g=diagrams[id]; if(!g)throw new Error('Schéma inconnu : '+id);
    const uid='arrow-'+id+'-'+suffix.replace(/[^a-zA-Z0-9-]/g,'');
    const nodes=g.nodes.map(n=>{
      const x=n.x-n.w/2,y=n.y-n.h/2;
      const shape=n.type==='decision'?`<polygon points="${n.x},${y} ${x+n.w},${n.y} ${n.x},${y+n.h} ${x},${n.y}" class="diagram-node decision"/>`:n.type==='blank'?'':`<rect x="${x}" y="${y}" width="${n.w}" height="${n.h}" rx="${n.type==='terminal'?n.h/2:5}" class="diagram-node"/>`;
      const lines=wrap(n.text,n.type==='decision'?21:Math.floor((n.w-30)/10));
      return `<g data-node="${n.id}">${shape}<text x="${n.x}" y="${n.y-(lines.length-1)*11+6}" text-anchor="middle">${lines.map((l,i)=>`<tspan x="${n.x}" dy="${i?22:0}">${esc(l)}</tspan>`).join('')}</text>${n.type==='blank'?`<text x="${n.x}" y="${n.y+57}" text-anchor="middle" class="branch-label">FORME À CHOISIR</text>`:''}</g>`;
    }).join('');
    const edges=g.edges.map(e=>`<polyline class="diagram-edge" points="${e.points.map(p=>p.join(',')).join(' ')}" marker-end="url(#${uid})"/>${e.label?`<text class="branch-label" x="${e.labelAt[0]}" y="${e.labelAt[1]}" text-anchor="middle">${esc(e.label)}</text>`:''}`).join('');
    return `<figure class="diagram"><div class="diagram-scroll" tabindex="0" aria-label="Schéma défilable : ${esc(g.title)}"><svg viewBox="0 0 ${g.width} ${g.height}" role="img" aria-labelledby="title-${uid} desc-${uid}"><title id="title-${uid}">${esc(g.title)}</title><desc id="desc-${uid}">${esc(g.description)}</desc><defs><marker id="${uid}" viewBox="0 0 12 12" markerWidth="12" markerHeight="12" refX="12" refY="6" orient="auto" markerUnits="userSpaceOnUse"><path d="M0 0L12 6L0 12Z" fill="#2c2a4a"/></marker></defs>${edges}${nodes}</svg></div><figcaption>${esc(g.title)}</figcaption><details class="diagram-text"><summary>Lire le schéma sous forme de texte</summary><p>${esc(g.description)}</p><button type="button" data-speak-text="${esc(g.description)}">Écouter le schéma</button></details></figure>`;
  }
  window.FlowDiagrams={diagrams,render,port};
}());
