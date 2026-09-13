(function () {
  'use strict';
  const choice=(id,skill,prompt,options,answer,hint,explain)=>({id,skill,type:'choice',prompt,options,answer,hint,explain});
  const order=(id,skill,prompt,options,answer,hint,explain)=>({id,skill,type:'order',prompt,options,answer,hint,explain});
  const table=(id,skill,prompt,rows,hint,explain)=>({id,skill,type:'table',prompt,rows,hint,explain});
  const note=(id,skill,prompt,hint,criteria)=>({id,skill,type:'note',prompt,hint,criteria});
  const row=(label,options,answer)=>({label,options,answer});
  const C='COMPLETER',R='CORRIGER',S='SUIVRE',L='LIRE';
  const modules=[
    {id:1,title:'Lire et suivre',subtitle:'Apprends à prévoir ce que fait un système.',duration:25,introMinutes:2,summaryMinutes:3,skills:[L,S],intro:'Observe une case, choisis une sortie, puis suis la flèche jusqu’au bout. Une boucle permet de recommencer avec une information nouvelle.',steps:[
      {title:'Reconnaître les symboles',minutes:4,lesson:'Un ovale indique DÉBUT ou FIN. Un rectangle contient une action. Un losange pose une question avec deux sorties : VRAI et FAUX. Les flèches donnent le sens du parcours.',symbols:true,questions:[
        table('m1-symboles',L,'Associe chaque élément à son rôle.',[
          row('« Mesurer la température »',['Ovale','Rectangle','Losange'],1),row('« Température > 25 °C ? »',['Ovale','Rectangle','Losange'],2),row('« DÉBUT »',['Ovale','Rectangle','Losange'],0),row('« Arrêter le moteur »',['Ovale','Rectangle','Losange'],1)
        ],'Une action peut aussi consister à mesurer ou à arrêter quelque chose. Cherche les phrases qui posent une question.','Mesurer et arrêter sont des actions. Une condition se reconnaît à la question posée.'),
        choice('m1-sorties',L,'Combien de sorties utilise ici un losange qui pose une question VRAI / FAUX ?',['Une','Deux','Trois','Aucune'],1,'Imagine les deux réponses possibles à « bouton appuyé ? ».','Une flèche correspond à VRAI, l’autre à FAUX.'),
        choice('m1-sens',L,'Deux cases sont proches, mais aucune flèche ne les relie. Peut-on passer directement de l’une à l’autre ?',['Oui, si elles ont la même couleur','Oui, de gauche à droite','Non, il faut suivre une liaison'],2,'La position sur la feuille ne suffit pas à indiquer l’ordre.','Seules les flèches autorisent le passage d’une case à la suivante.')
      ]},
      {title:'Suivre une séquence',minutes:4,diagram:'sequence',lesson:'Cette tâche est ponctuelle : elle attend, allume une lampe, puis le programme se termine. FIN arrête l’exécution des instructions ; ce mot n’éteint pas automatiquement la lampe.',questions:[
        order('m1-ordre',L,'Reconstruis les quatre étapes dans l’ordre des flèches.',['Allumer la lampe','FIN','DÉBUT','Attendre 3 secondes'],[2,3,0,1],'Pars de DÉBUT et suis une seule flèche à la fois.','Le programme attend trois secondes avant d’allumer la lampe, puis atteint FIN.'),
        table('m1-temps',S,'Au démarrage, la lampe est éteinte. Complète les observations.',[
          row('Après 1 seconde',['Éteinte','Allumée'],0),row('Juste après les 3 secondes d’attente',['Éteinte','Allumée'],1),row('Une fois FIN atteint',['Éteinte','Allumée'],1)
        ],'Cherche une instruction qui éteint la lampe. Est-elle présente ?','La lampe s’allume après l’attente. Aucune instruction ne commande ensuite son extinction.'),
        note('m1-fin',L,'Explique pourquoi « FIN » et « Éteindre la lampe » ne veulent pas dire la même chose.','Commence par « FIN arrête… » puis « Éteindre agit sur… ».','Distinguer l’arrêt du programme de la commande d’un actionneur.')
      ]},
      {title:'Tester VRAI et FAUX',minutes:4,diagram:'lamp',lesson:'La lampe surveille la luminosité en continu. À chaque tour, le capteur fournit une nouvelle mesure. Le signe < signifie « strictement inférieur à ».',questions:[
        table('m1-lumiere',S,'Pour chaque mesure, choisis la branche et l’action de ce cycle.',[
          row('12 %',['VRAI → allumer','FAUX → éteindre'],0),row('20 %',['VRAI → allumer','FAUX → éteindre'],1),row('65 %',['VRAI → allumer','FAUX → éteindre'],1),row('5 %',['VRAI → allumer','FAUX → éteindre'],0)
        ],'Pour 20 %, demande-toi si 20 est plus petit que 20. L’égalité ne suffit pas.','12 et 5 sont inférieurs à 20 ; 20 et 65 ne le sont pas.'),
        order('m1-cycle',S,'Après « Allumer la lampe », quel est l’ordre du cycle suivant ?',['Tester la condition','Lire la nouvelle luminosité','Choisir VRAI ou FAUX'],[1,0,2],'Le programme doit connaître la situation actuelle avant de choisir.','La boucle relit le capteur avant de tester la condition.'),
        choice('m1-changement',S,'La luminosité passe de 12 % à 65 %. Que commande le cycle suivant ?',['Allumer encore','Éteindre','Terminer définitivement'],1,'Utilise la nouvelle mesure, pas la précédente.','65 < 20 est faux : la nouvelle mesure conduit à éteindre.')
      ]},
      {title:'Comprendre l’attente',minutes:4,diagram:'wait',lesson:'Une boucle peut se répéter pendant une attente, puis se terminer. Le bouton est testé après chaque seconde. Dans les situations ci-dessous, il reste appuyé dès que l’élève appuie.',questions:[
        table('m1-bouton',S,'Compte le nombre d’exécutions de « Attendre 1 seconde ».',[
          row('Bouton appuyé dès le départ',['0','1','3','Sans fin'],1),row('Bouton appuyé à 2,5 secondes',['1','2','3','Sans fin'],2),row('Bouton jamais appuyé',['0','1','3','Sans fin'],3)
        ],'Le premier test a lieu à 1 seconde, puis à 2 secondes, puis à 3 secondes.','Même si le bouton est déjà appuyé, le programme attend d’abord. Un appui à 2,5 s est détecté au test de 3 s.'),
        choice('m1-boucle-fin',S,'Quelle réponse permet de sortir de la boucle ?',['FAUX','VRAI','Les deux'],1,'Cherche la flèche qui mène à FIN.','La branche VRAI termine cette tâche d’attente.'),
        note('m1-attente',S,'Pourquoi faut-il retester le bouton après chaque seconde ?','Que pourrait faire l’élève pendant que le programme attend ?','Expliquer que l’état du bouton peut changer pendant l’attente.')
      ]},
      {title:'Suivre un portail',minutes:4,diagram:'portal',lesson:'Au départ, le portail est fermé. Le système vérifie les badges. Il reste ouvert pendant le passage, se ferme une fois l’élève entièrement passé, puis attend le badge suivant. Le losange lit l’information actuelle du capteur à chaque test.',questions:[
        table('m1-portail',S,'Observe trois situations indépendantes.',[
          row('Badge non autorisé ; portail fermé',['Ouvrir','Rester fermé et retester le badge','Fermer pendant le passage'],1),row('Portail ouvert ; élève encore dessous',['Garder ouvert et retester le passage','Fermer tout de suite','Revenir au badge sans fermer'],0),row('Élève entièrement passé',['Garder ouvert pour toujours','Fermer, puis vérifier le badge suivant','Terminer le programme'],1)
        ],'Chaque condition lit un capteur différent : le badge, puis le passage.','Un badge invalide n’ouvre pas. Le passage incomplet maintient l’ouverture. Le passage terminé déclenche la fermeture et un nouveau cycle.'),
        order('m1-portail-cycle',S,'Classe les étapes d’un passage autorisé, jusqu’au cycle suivant.',['Fermer le portail','Badge autorisé : VRAI','Revenir vérifier le badge','Ouvrir le portail','Élève entièrement passé : VRAI'],[1,3,4,0,2],'Ne retourne pas vers le badge avant la fin du passage.','Badge valide → ouverture → passage terminé → fermeture → nouveau badge.'),
        note('m1-portail-raison',S,'À quoi servent la boucle d’attente du passage et le retour après la fermeture ?','Complète « Pendant le passage… Après la fermeture… ».','Distinguer l’attente du passage complet et le retour à la surveillance du badge.')
      ]}
    ]},
    {id:2,title:'Compléter',subtitle:'Reconstruis des programmes qui surveillent en continu.',duration:25,introMinutes:2,summaryMinutes:3,skills:[C],intro:'Lis le besoin du système, complète les cases, puis vérifie les deux branches. Après la dernière action, cherche où doit revenir la boucle.',steps:[
      {title:'Choisir une forme',minutes:4,diagram:'vent',lesson:'Le ventilateur fonctionne au-dessus de 25 °C. À 25 °C ou moins, il doit être arrêté. La forme entourant la condition a été retirée.',questions:[
        choice('m2-forme',C,'Quelle forme faut-il ajouter autour de « Température > 25 °C ? » ?',['Rectangle','Losange','Ovale'],1,'Cette case doit permettre de choisir entre deux réponses.','Une condition avec deux issues se place dans un losange.'),
        table('m2-vent-table',C,'Complète les deux sorties et leur action.',[row('Température = 28 °C',['VRAI → ventiler','FAUX → arrêter'],0),row('Température = 25 °C',['VRAI → ventiler','FAUX → arrêter'],1),row('Température = 18 °C',['VRAI → ventiler','FAUX → arrêter'],1)],'« Au-dessus de 25 » exclut la valeur 25.','Le seuil est strict : la ventilation se déclenche seulement au-dessus de 25 °C.'),
        choice('m2-vent-retour',C,'Après « Arrêter la ventilation », où la boucle doit-elle revenir ?',['À FIN','À « Ventiler »','À « Mesurer la température »'],2,'Le ventilateur est arrêté, mais la pièce peut encore se réchauffer.','Arrêter un actionneur n’arrête pas la surveillance.')
      ]},
      {title:'Compléter un distributeur',minutes:4,diagram:'soap',lesson:'Une main détectée déclenche une dose de savon. Le distributeur attend deux secondes avant de relire le capteur. Ce modèle simplifié peut distribuer une nouvelle dose si la main reste présente.',questions:[
        choice('m2-savon-condition',C,'Quel texte complète la condition ?',['Distribuer une dose','Main détectée ?','Attendre 2 secondes'],1,'La condition doit être une question portant sur l’information du capteur.','« Main détectée ? » permet de décider s’il faut distribuer.'),
        choice('m2-savon-action',C,'Quel texte complète le rectangle ?',['Main détectée ?','FIN','Distribuer une dose de savon'],2,'Le rectangle commande ce que le système fait.','Une dose est distribuée quand la main est détectée.'),
        choice('m2-savon-branche',C,'Quel mot remplace « BRANCHE B » ?',['FAUX','VRAI','DÉBUT'],0,'Sans main, la distribution ne doit pas avoir lieu.','FAUX ramène directement à la lecture du capteur.'),
        note('m2-savon-main',C,'Propose une attente supplémentaire pour éviter de redonner du savon tant que la même main reste présente.','Après la dose, quelle information du capteur faut-il attendre avant d’autoriser la dose suivante ?','Proposer d’attendre que la main soit retirée avant un nouveau déclenchement.')
      ]},
      {title:'Assembler un éclairage',minutes:4,lesson:'Un détecteur allume une lampe dès qu’il voit une présence. La lampe reste allumée 10 secondes, s’éteint, puis le programme vérifie à nouveau la présence. Sans présence, il continue à surveiller.',questions:[
        order('m2-presence-chemin',C,'Construis le chemin à partir d’une présence détectée.',['Éteindre la lampe','Revenir lire le capteur','Présence détectée : VRAI','Attendre 10 secondes','Allumer la lampe'],[2,4,3,0,1],'Commence par la condition vraie, puis l’action, l’attente, l’action inverse et la reprise.','La boucle se referme seulement après l’extinction.'),
        choice('m2-presence-faux',C,'Que doit faire la branche FAUX ?',['Allumer la lampe','Relire le capteur','Attendre que le professeur relance'],1,'Un système automatique doit pouvoir détecter la personne suivante.','La branche FAUX continue la surveillance.'),
        table('m2-presence-tests',C,'Teste ton assemblage.',[row('Une personne arrive',['La lampe s’allume','Le programme finit'],0),row('Les 10 secondes sont écoulées',['La lampe reste allumée sans fin','La lampe s’éteint puis le capteur est relu'],1),row('Personne devant le capteur',['La lampe s’allume','Le capteur est relu'],1)],'Décris l’effet des instructions dans leur ordre réel.','Les deux chemins reviennent au capteur : le programme reste disponible.')
      ]},
      {title:'Trouver une condition',minutes:4,diagram:'heatBlank',lesson:'Le chauffage doit s’allumer si la température est strictement inférieure à 19 °C. Dans tous les autres cas, il s’éteint. Les flèches et les actions sont déjà placées.',questions:[
        choice('m2-chauff-condition',C,'Quelle condition complète le losange ?',['Température > 19 °C ?','Température < 19 °C ?','Température = 19 °C ?'],1,'Regarde l’action située sur VRAI, puis relis le besoin.','VRAI doit correspondre au cas où il fait trop froid.'),
        table('m2-chauff-tests',C,'Vérifie la valeur limite et les valeurs voisines.',[row('18 °C',['Allumer','Éteindre'],0),row('19 °C',['Allumer','Éteindre'],1),row('20 °C',['Allumer','Éteindre'],1)],'18 est inférieur à 19 ; 19 est égal à 19.','La valeur du seuil appartient ici à la branche FAUX.'),
        note('m2-chauff-egal',C,'Si l’on voulait aussi chauffer à exactement 19 °C, quel signe faudrait-il employer ? Explique.','Le signe recherché inclut les valeurs plus petites et l’égalité.','Proposer ≤ et expliquer qu’il inclut la valeur 19.')
      ]},
      {title:'Compléter un robot',minutes:4,diagram:'robot',lesson:'Ce robot suit le bord d’une ligne. Dans ce modèle, lorsqu’il détecte le noir, il tourne légèrement à gauche ; sinon, il avance tout droit. Après l’action, il lit à nouveau la couleur du sol.',questions:[
        choice('m2-robot-condition',C,'Quel texte complète la condition ?',['Tourner à gauche','Couleur noire détectée ?','Avancer'],1,'La condition utilise une information, elle ne commande pas un mouvement.','La question porte sur la couleur lue par le capteur.'),
        choice('m2-robot-action',C,'Quelle action complète la branche VRAI ?',['Tourner légèrement à droite','Arrêter pour toujours','Tourner légèrement à gauche'],2,'Utilise la règle du modèle donnée au-dessus du schéma.','Le cahier des charges prévoit un petit virage à gauche sur le noir.'),
        order('m2-robot-cycle',C,'Classe les étapes du cycle quand le capteur voit du noir.',['Tourner légèrement à gauche','Lire la couleur','Revenir lire la couleur','Couleur noire : VRAI'],[1,3,0,2],'La nouvelle lecture est indispensable après le mouvement.','Lecture → test → action → nouvelle lecture.'),
        note('m2-robot-raison',C,'Pourquoi faut-il relire la couleur après avoir tourné ?','Le capteur observe-t-il forcément le même endroit après le mouvement ?','Relier le déplacement du robot au changement possible de la couleur détectée.')
      ]}
    ]},
    {id:3,title:'Corriger',subtitle:'Mène l’enquête et prouve que ta correction fonctionne.',duration:55,introMinutes:4,summaryMinutes:3,skills:[R],intro:'Avant chaque réparation : lis le besoin, suis les flèches avec une valeur précise, décris l’erreur, puis vérifie la correction sur VRAI et FAUX. Les schémas de ce module comportent des erreurs volontaires, sans surlignage.',steps:[
      {title:'Repérer et expliquer',minutes:8,diagram:'wrongShape',lesson:'On souhaite une tâche ponctuelle qui allume la lampe seulement s’il fait sombre, puis se termine. Examine le programme proposé : respecte-t-il ce besoin lorsqu’il fait sombre ? Et lorsqu’il fait clair ?',questions:[
        choice('m3-forme',R,'Quelle forme devrait contenir « Fait-il sombre ? » ?',['Ovale','Losange','Rectangle'],1,'Compare une commande et une question.','La condition doit se trouver dans un losange.'),
        choice('m3-sortie',R,'Quelle réparation manque encore si l’on change seulement la forme ?',['Changer la couleur du texte','Supprimer DÉBUT','Ajouter les branches VRAI et FAUX'],2,'Une forme correcte ne suffit pas à créer deux chemins.','Il faut VRAI vers Allumer et FAUX vers FIN.'),
        table('m3-forme-tests',R,'Après réparation, complète le comportement attendu.',[row('Il fait sombre',['Allumer, puis FIN','Passer directement à FIN'],0),row('Il fait clair',['Allumer, puis FIN','Passer directement à FIN'],1)],'Le besoin dit « seulement s’il fait sombre ».','La branche FAUX doit éviter la commande d’allumage.'),
        note('m3-forme-preuve',R,'Décris les deux modifications nécessaires pour que le schéma respecte le besoin.','Nomme la forme, puis la destination de chaque branche.','Losange ; VRAI vers allumer ; FAUX vers FIN. On attend deux modifications distinctes.')
      ]},
      {title:'Réparer une barrière',minutes:8,diagram:'parking',lesson:'Un ticket valide doit ouvrir la barrière. Un ticket invalide doit la laisser fermée et conduire à vérifier un nouveau ticket. Après un passage autorisé, la barrière se referme et le système recommence.',questions:[
        table('m3-parking-actuel',R,'Suis le programme actuel, avant correction.',[row('Ticket valide',['La barrière se lève','La barrière reste fermée'],0),row('Ticket invalide',['La barrière se lève','La barrière reste fermée'],0)],'Pars du losange et suis chaque branche jusqu’au premier rectangle.','Les deux branches mènent actuellement à Lever la barrière.'),
        choice('m3-parking-fix',R,'Où faut-il raccorder la branche FAUX ?',['À « Ticket valide ? »','À « Attendre le passage complet »','À FIN'],0,'Le système doit pouvoir examiner le prochain ticket.','FAUX doit revenir vérifier le ticket, sans lever la barrière.'),
        order('m3-parking-valide',R,'Reconstruis le chemin correct d’un ticket valide.',['Abaisser la barrière','Attendre le passage complet','Ticket valide : VRAI','Vérifier le ticket suivant','Lever la barrière'],[2,4,1,0,3],'Sépare l’ouverture, le passage, la fermeture et le nouveau cycle.','Le retour au test se fait après la fermeture.'),
        note('m3-parking-preuve',R,'Explique le problème d’accès produit par l’erreur et donne le test qui prouve ta correction.','Teste un ticket invalide avant et après la réparation.','Dire qu’un ticket invalide ouvre à tort ; après correction, la barrière reste fermée.')
      ]},
      {title:'Enquêter sur le chauffage',minutes:8,diagram:'heater',lesson:'Besoin : chauffer en dessous de 19 °C, éteindre à 19 °C et au-dessus. Examine les deux branches du programme proposé.',questions:[
        table('m3-chauff-actuel',R,'Que fait le programme actuel ?',[
          row('Température = 16 °C',['Allumer','Éteindre'],1),row('Température = 22 °C',['Allumer','Éteindre'],0),row('Température = 19 °C',['Allumer','Éteindre'],0)
        ],'Réponds selon les flèches dessinées, même si le résultat semble absurde.','Les actions sont inversées : il éteint quand il fait froid et allume sinon.'),
        choice('m3-chauff-fix',R,'Quelle correction respecte le besoin, y compris à 19 °C ?',['Remplacer < par > uniquement','Inverser les deux actions','Supprimer la mesure'],1,'Teste aussi l’égalité : elle évite une correction qui fonctionne seulement pour 16 et 22.','Inverser les actions conserve le bon seuil strict et donne Éteindre à 19 °C.'),
        table('m3-chauff-corrige',R,'Vérifie les actions après correction.',[row('18 °C',['Allumer','Éteindre'],0),row('19 °C',['Allumer','Éteindre'],1),row('20 °C',['Allumer','Éteindre'],1)],'Vérifie une valeur de chaque côté et la valeur du seuil.','Les trois tests couvrent les cas essentiels autour du seuil.'),
        note('m3-chauff-preuve',R,'Pourquoi tester seulement 16 °C et 22 °C ne suffit-il pas pour vérifier le signe de comparaison ?','Compare ce qui se passe à exactement 19 °C avec <, ≤ ou >.','Expliquer que des signes différents peuvent réagir de la même façon loin du seuil, mais différemment à l’égalité.')
      ]},
      {title:'Tester une alarme',minutes:8,diagram:'alarm',lesson:'L’alarme doit être active uniquement au-dessus de 30 °C. À 30 °C ou moins, elle doit être désactivée. Le programme proposé surveille en boucle.',questions:[
        table('m3-alarme-actuel',R,'Relève l’état commandé par le programme actuel.',[row('20 °C',['Activer','Désactiver'],0),row('30 °C',['Activer','Désactiver'],1),row('35 °C',['Activer','Désactiver'],1)],'Le schéma utilise actuellement le signe <.','Le programme déclenche l’alarme quand il fait moins de 30 °C : le test est inversé.'),
        choice('m3-alarme-fix',R,'Quelle condition respecte exactement « au-dessus de 30 °C » ?',['Température ≥ 30 °C ?','Température = 30 °C ?','Température > 30 °C ?'],2,'« Au-dessus » n’inclut pas 30 °C.','Le signe > déclenche seulement pour une valeur strictement supérieure à 30.'),
        table('m3-alarme-cycle',R,'Teste trois cycles successifs après correction.',[row('Cycle 1 : 35 °C',['Activer','Désactiver'],0),row('Cycle 2 : 30 °C',['Activer','Désactiver'],1),row('Cycle 3 : 31 °C',['Activer','Désactiver'],0)],'La nouvelle mesure peut demander l’action inverse du cycle précédent.','L’alarme est activée, désactivée, puis réactivée : le système relit bien la température.'),
        note('m3-alarme-preuve',R,'Pourquoi écrire « Désactiver l’alarme » sur FAUX plutôt que « Ne rien faire » ?','Imagine que l’alarme était active au cycle précédent.','Expliquer qu’une alarme déjà active doit recevoir une commande d’arrêt quand la température redescend.')
      ]},
      {title:'Réparer un retour de boucle',minutes:8,diagram:'stale',lesson:'Le robot avance tant que la distance est de 20 cm ou plus. Il doit s’arrêter dès qu’un obstacle est détecté à moins de 20 cm. La case « Mesurer » enregistre une valeur ; le losange ne refait pas lui-même cette mesure.',questions:[
        choice('m3-capteur-probleme',R,'Quelle partie manque dans les cycles suivants ?',['L’action Avancer','Une nouvelle mesure de distance','La case DÉBUT'],1,'Suis la boucle : traverse-t-elle à nouveau le rectangle de mesure ?','La boucle reprend le test sans relire le capteur : elle utilise une ancienne valeur.'),
        choice('m3-capteur-fix',R,'Où faut-il ramener les deux boucles ?',['À « Mesurer la distance »','À « Avancer tout droit »','À FIN'],0,'La condition doit travailler sur une donnée actualisée.','Les deux retours passent par la mesure avant de tester à nouveau.'),
        table('m3-capteur-test',R,'La première mesure était 50 cm. L’obstacle se trouve maintenant à 10 cm.',[row('Programme actuel : ancienne mesure = 50',['Avancer','Arrêter'],0),row('Après correction : nouvelle mesure = 10',['Avancer','Arrêter'],1),row('Après correction : nouvelle mesure = 20',['Avancer','Arrêter'],0)],'Distingue la distance réelle de la valeur enregistrée par le programme.','Sans nouvelle mesure, 50 reste utilisé ; avec la correction, 10 provoque l’arrêt. À 20 cm, le besoin autorise encore l’avance.'),
        note('m3-capteur-preuve',R,'Explique pourquoi revenir au bon endroit est aussi important que dessiner une boucle.','Utilise les mots « capteur », « nouvelle valeur » et « condition ».','La boucle doit réactualiser l’information nécessaire à la décision.')
      ]},
      {title:'Expertise et transfert',minutes:8,diagram:'greenhouse',lesson:'Besoin : si l’humidité est inférieure à 40 %, arroser 5 secondes puis arrêter la pompe. Sinon, garder la pompe arrêtée. Recommencer la mesure. Le schéma comporte deux erreurs à réparer.',questions:[
        choice('m3-serre-actions',R,'Quelle erreur concerne les actions ?',['Elles sont inversées','Elles sont correctes','La pompe n’a pas de rectangle'],0,'Avec 25 %, suis VRAI et compare au besoin.','Une faible humidité doit déclencher l’arrosage.'),
        choice('m3-serre-boucle',R,'Quelle seconde réparation est nécessaire ?',['Ajouter une autre FIN','Retourner toujours vers la pompe','Remplacer FIN par un retour à la mesure'],2,'La serre doit continuer à surveiller après cette première décision.','Les deux branches doivent revenir mesurer l’humidité.'),
        table('m3-serre-tests',R,'Teste ton programme réparé.',[row('Humidité = 25 %',['Arroser 5 s puis arrêter','Laisser arrêtée'],0),row('Humidité = 40 %',['Arroser 5 s puis arrêter','Laisser arrêtée'],1),row('Humidité = 60 %',['Arroser 5 s puis arrêter','Laisser arrêtée'],1)],'N’oublie ni la valeur du seuil ni l’arrêt après les 5 secondes.','À 25 %, la pompe fonctionne 5 s. À 40 et 60 %, elle reste arrêtée ; la mesure reprend dans tous les cas.'),
        order('m3-transfert',R,'Transfert : dans un couloir, allumer si la luminosité est inférieure à 15 %, sinon éteindre. Construis le chemin pour 10 %.',['Allumer l’éclairage','Lire la luminosité','Revenir lire la luminosité','Luminosité < 15 % : VRAI'],[1,3,0,2],'Applique la même structure : mesurer, tester, agir, recommencer.','Le nouvel objet utilise la même logique de surveillance en boucle.'),
        note('m3-transfert-preuve',R,'Pour le couloir, décris le chemin quand la luminosité vaut exactement 15 %, jusqu’au nouveau cycle.','Le signe est strict. N’oublie pas la dernière flèche.','À 15 %, test FAUX, éteindre, puis relire la luminosité.')
      ]}
    ]}
  ];
  // Le tracé personnel et les tests sur papier font partie de la séance, sans minuteur bloquant.
  const workshops=[
    'Après les défis, redessine le programme corrigé sur ton brouillon, avec toutes les formes et toutes les flèches. Trace deux chemins de couleurs différentes : il fait sombre ; il fait clair.',
    'Après les défis, redessine la partie à réparer et raccorde-la au reste du programme. Trace le parcours d’un ticket invalide, puis celui d’un ticket valide jusqu’au retour au test.',
    'Après les défis, redessine les deux branches corrigées et leur retour à la mesure. Sous le dessin, indique les actions obtenues à 18 °C, 19 °C et 20 °C.',
    'Après les défis, redessine le programme corrigé. Suis trois cycles successifs : 35 °C, 30 °C, puis 31 °C. Note à chaque tour la branche suivie et l’état de l’alarme.',
    'Après les défis, redessine le programme corrigé et ses deux retours. Fais un tableau avec la distance réelle, la valeur utilisée et l’action pour 50 cm, puis 10 cm. Compare avant et après réparation.',
    'Après les défis, dessine le programme complet de l’éclairage du couloir, sans recopier un schéma fourni. Place DÉBUT, la lecture, la condition, les deux actions et les retours. Teste 10 %, 15 % et 60 %.'
  ];
  modules[2].steps.forEach((step,i)=>step.workshop=workshops[i]);
  let index=0;
  for(const m of modules)for(let si=0;si<m.steps.length;si++)for(const q of m.steps[si].questions){q.index=index++;q.module=m.id;q.step=si;}
  window.LogigrammesCourse={version:3,modules,questions:modules.flatMap(m=>m.steps.flatMap(s=>s.questions)),competencies:[L,S,C,R],label:code=>code===C?'COMPLÉTER':code};
}());
