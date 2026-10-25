// Circunscripciones, candidaturas y reglas de dónde se presenta cada partido.
/* Circunscripciones del 29-N: [provincia, escaños]. Madrid +1 y Cádiz −1 respecto a 2023. */
const CCAA=[
 {id:'and',n:'Andalucía',p:[['Almería',6],['Cádiz',8],['Córdoba',6],['Granada',7],['Huelva',5],['Jaén',5],['Málaga',11],['Sevilla',12]]},
 {id:'ara',n:'Aragón',p:[['Huesca',3],['Teruel',3],['Zaragoza',7]]},
 {id:'ast',n:'Asturias',p:[['Asturias',7]]},
 {id:'bal',n:'Illes Balears',p:[['Illes Balears',8]]},
 {id:'can',n:'Canarias',p:[['Las Palmas',8],['Santa Cruz de Tenerife',7]]},
 {id:'cnt',n:'Cantabria',p:[['Cantabria',5]]},
 {id:'clm',n:'Castilla-La Mancha',p:[['Albacete',4],['Ciudad Real',5],['Cuenca',3],['Guadalajara',3],['Toledo',6]]},
 {id:'cyl',n:'Castilla y León',p:[['Ávila',3],['Burgos',4],['León',4],['Palencia',3],['Salamanca',4],['Segovia',3],['Soria',2],['Valladolid',5],['Zamora',3]]},
 {id:'cat',n:'Cataluña',p:[['Barcelona',32],['Girona',6],['Lleida',4],['Tarragona',6]]},
 {id:'val',n:'Comunitat Valenciana',p:[['Alicante',12],['Castellón',5],['Valencia',16]]},
 {id:'ext',n:'Extremadura',p:[['Badajoz',5],['Cáceres',4]]},
 {id:'gal',n:'Galicia',p:[['A Coruña',8],['Lugo',4],['Ourense',4],['Pontevedra',7]]},
 {id:'rio',n:'La Rioja',p:[['La Rioja',4]]},
 {id:'mad',n:'Comunidad de Madrid',p:[['Madrid',38]]},
 {id:'mur',n:'Región de Murcia',p:[['Murcia',10]]},
 {id:'nav',n:'Navarra',p:[['Navarra',5]]},
 {id:'pv',n:'País Vasco',p:[['Álava',4],['Bizkaia',8],['Gipuzkoa',6]]},
 {id:'ceu',n:'Ceuta',p:[['Ceuta',1]]},
 {id:'mel',n:'Melilla',p:[['Melilla',1]]}
];

/* v = viabilidad por comunidad (_ = resto); vp = por provincia; al = nombre en la papeleta; hd = cabeza de lista; only = provincias donde se presenta.
   Un partido sin la comunidad en v (y sin _) no se presenta allí. base = toma las posiciones de otro partido donde no tenga propias. */
const PARTIES=[
 {id:'pp',n:'PP',full:'Partido Popular',head:'Alberto Núñez Feijóo',v:{_:'seguro'},al:{nav:'UPN-PP'},hd:{cat:'Xavier García Albiol (Barcelona)',nav:'Lista de UPN con el PP; Sergio Sayas (PP) de número dos'},poll:'Media de 15 encuestas (24-oct): 31,4 % (1.º); proyección media: 137 escaños'},
 {id:'psoe',n:'PSOE',full:'Partido Socialista Obrero Español',head:'Pedro Sánchez',v:{_:'seguro',ceu:'incierto',mel:'improbable'},al:{cat:'PSC-PSOE'},hd:{cat:'Jordi Hereu (Barcelona)'},poll:'Media: 26,9 % (el CIS lo sitúa 1.º); proyección: 106 escaños'},
 {id:'vox',n:'Vox',full:'Vox',head:'Santiago Abascal',v:{_:'seguro',pv:'improbable',nav:'incierto',ceu:'incierto',mel:'incierto'},poll:'Media: 18,8 %; IMOP (16-oct): 20 %; proyección: 66 escaños'},
 {id:'fa',n:'Frente Amplio',full:'Frente Amplio: IU, Movimiento Sumar, Más Madrid, Comuns, CHA, Verdes Equo, Batzarre, Somos Asturies, Recortes Cero…',head:'Ada Colau',v:{_:'improbable',mad:'seguro',cat:'seguro',and:'probable',bal:'incierto',ara:'incierto',ast:'incierto',pv:'incierto',nav:'incierto'},
  x:['val','can'],al:{bal:'Ara Més-Front Ampli',ara:'Frente Amplio (con CHA)',and:'Frente Amplio por Andalucía',ast:'Frente Amplio (con Somos Asturies)',nav:'Frente Amplio (con Batzarre)'},hd:{mad:'Emilio Delgado (Más Madrid)',cat:'Ada Colau (Barcelona)',bal:'Carme Gomila'},poll:'Media: 6,3 %; IMOP: 8,9 %; proyección: 8 escaños'},
 {id:'pod',n:'Podemos',full:'Podemos',head:'Irene Montero',v:{_:'improbable',mad:'filo'},x:['cat','val','can'],poll:'Media: 3,1 %; proyección: 2 escaños (Madrid)'},
 {id:'salf',n:'SALF',full:'Se Acabó La Fiesta',head:'Luis «Alvise» Pérez',v:{_:'nc',mad:'filo'},vp:{'Córdoba':'improbable','Guadalajara':'improbable','Cuenca':'improbable','Ciudad Real':'improbable'},poll:'Media: 1,6 % (11 de 15 institutos). Recogía avales provincia a provincia a 18-oct'},
 {id:'erc',n:'ERC',full:'Esquerra Republicana de Catalunya (con independientes propuestos por Podemos)',head:'Gabriel Rufián',v:{cat:'seguro'},hd:{cat:'Gabriel Rufián (Barcelona)'},poll:'Media: 2,2 %; proyección: 8 escaños (7 en 2023)'},
 {id:'junts',n:'Junts',full:'Junts per Catalunya',head:'Míriam Nogueras',v:{cat:'seguro'},poll:'Media: 1,6 %; proyección: 6 escaños (7 en 2023)'},
 {id:'bildu',n:'EH Bildu',full:'Euskal Herria Bildu',head:'Oskar Matute',v:{pv:'seguro',nav:'probable'},poll:'Media: 1,4 %; proyección: 7 escaños (6 en 2023)'},
 {id:'pnv',n:'PNV',full:'Euzko Alderdi Jeltzalea-Partido Nacionalista Vasco',head:'Maribel Vaquero',v:{pv:'seguro'},hd:{pv:'Maribel Vaquero (Gipuzkoa), Idoia Sagastizabal (Bizkaia), Gorka Urtaran (Álava)'},poll:'Media: 0,9 %; proyección: 5 escaños'},
 {id:'bng',n:'BNG',full:'Bloque Nacionalista Galego',head:'Por confirmar (listas el 24-oct; Néstor Rego, diputado desde 2019)',v:{gal:'seguro'},poll:'Media: 0,9 %; proyección: 2 escaños (1 en 2023)'},
 {id:'cc',n:'CC',full:'Coalición Canaria + Municipalistas Primero Canarias',head:'Cristina Valido',v:{can:'probable'},hd:{can:'Cristina Valido (Tenerife), Teodoro Sosa (Las Palmas)'},poll:'Media: 0,4 %; proyección: 1 escaño'},
 {id:'upc',n:'UPC',full:'Unidad del Pueblo Canario: Nueva Canarias-Bloque Canarista, Podemos, IU y Movimiento Sumar',head:'Luis Campos',v:{can:'probable'},base:'fa',poll:'Coalición nueva; sin serie de encuestas propia'},
 {id:'comp',n:'Compromís-FV',full:'Compromís-Front Valencià: Compromís, Podemos, Esquerra Unida y ERPV',head:'Àgueda Micó',v:{val:'seguro'},vp:{'Castellón':'incierto'},hd:{val:'Àgueda Micó (Valencia); María Teresa Pérez, de Podemos (Alicante)'},base:'fa',poll:'Coalición nueva; las encuestas no la miden aparte'},
 {id:'adel',n:'Adelante Andalucía',full:'Adelante Andalucía',head:'Por confirmar',v:{and:'incierto'},poll:'Media: 0,8 % estatal (4 institutos); proyección: 1 escaño. Pasó de 2 a 8 diputados andaluces en mayo de 2026'},
 {id:'existe',n:'Existe',full:'Coalición Existe (Aragón Existe y Teruel Existe)',head:'Por confirmar (primarias en Teruel)',v:{ara:'improbable'},vp:{'Teruel':'incierto'},poll:'Teruel Existe tuvo 1 diputado de 2019 a 2023'},
 {id:'soria',n:'Soria ¡Ya!',full:'Soria ¡Ya!',head:'Por confirmar',v:{cyl:'incierto'},only:{cyl:['Soria']},poll:'Lista más votada en Soria en las autonómicas de 2022'},
 {id:'drago',n:'Drago Canarias',full:'Drago Canarias',head:'Alberto Rodríguez',v:{can:'improbable'},poll:'Sin escaño en 2023'},
 {id:'d21',n:'Democracia 21',full:'Democracia para el Siglo 21: Democracia 21, Ciudadanos y UCIN',head:'Miriam González Durántez',v:{mad:'incierto',cat:'improbable'},only:{cat:['Barcelona']},poll:'Partido nuevo; ninguna encuesta lo mide aún'},
 {id:'iue',n:'Iustitia Europa',full:'Iustitia Europa',head:'Luis María Pardo',v:{mad:'incierto'},poll:'Un sondeo (NC Report/DYM) le da hasta 4 escaños en Madrid; casi ninguna otra encuesta lo mide'},
 {id:'pacma',n:'PACMA',full:'Partido Animalista con el Medio Ambiente',head:'Asier Esparza (candidato a presidente)',v:{_:'improbable'},poll:'Unos 0,2 %; fue el extraparlamentario más votado en 2023 (0,69 %)'},
 {id:'fo',n:'Frente Obrero',full:'Frente Obrero',head:'Roberto Vaquero',v:{_:'improbable'},poll:'Sin escaño en 2023'},
 {id:'ie',n:'Izquierda Española',full:'Izquierda Española',head:'Sin confirmar',v:{_:'nc'},poll:'No consta candidatura para el 29-N'},
 {id:'fe',n:'Falange',full:'Falange Española de las JONS',head:'Norberto Pedro Pico Sanabria',v:{_:'improbable'},poll:'Sin escaño en 2023'},
 {id:'dn',n:'Democracia Nacional',full:'Democracia Nacional',head:'Pedro Chaparro',v:{mad:'nc'},poll:'Recogía avales en Madrid (5.537 necesarios)'}
];

/* Selección del votante: {ccaa, prov} (prov opcional). */
function ccaaOf(id){return CCAA.find(c=>c.id===id)}
function seatsOf(sel){const c=ccaaOf(sel.ccaa); if(!c) return 0; return sel.prov?(c.p.find(p=>p[0]===sel.prov)||[,0])[1]:c.p.reduce((s,p)=>s+p[1],0)}
function runs(p,sel){
  if(!sel||!sel.ccaa) return true;
  if((p.x||[]).includes(sel.ccaa)) return false;
  if(!(sel.ccaa in p.v)&&!('_' in p.v)) return false;
  const o=p.only&&p.only[sel.ccaa]; return !(o&&sel.prov&&!o.includes(sel.prov));
}
function partiesFor(sel){return PARTIES.filter(p=>runs(p,sel))}
// ponytail: en provincias de 1-3 escaños la barrera real es altísima; solo PP, PSOE y partidos provinciales conservan su etiqueta
function viab(p,sel){
  if(!sel||!sel.ccaa) return p.v._||Object.values(p.v)[0];
  let v=(sel.prov&&p.vp&&p.vp[sel.prov])||p.v[sel.ccaa]||p.v._;
  const s=seatsOf(sel);
  if(sel.prov&&s<=3&&!p.only&&!p.vp&&!['pp','psoe'].includes(p.id)&&v!=='nc') v=p.id==='vox'?'incierto':'improbable';
  return v;
}
function nameOf(p,sel){return (sel&&p.al&&p.al[sel.ccaa])||p.n}
function headOf(p,sel){return (sel&&p.hd&&p.hd[sel.ccaa])||p.head}
/* LOREG art. 69.7: prohibido publicar o difundir sondeos los cinco días anteriores a la votación (y el propio día).
   Las medias de encuestas y la viabilidad, que sale de ellas, se ocultan del 24 al 29 de noviembre (hora peninsular). */
const VEDA=['2026-11-24','2026-11-29'];
function pollsHidden(now=new Date()){
  const d=new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Madrid'}).format(now);
  return d>=VEDA[0]&&d<=VEDA[1];
}
export {pollsHidden,CCAA,PARTIES,ccaaOf,seatsOf,runs,partiesFor,viab,nameOf,headOf};
