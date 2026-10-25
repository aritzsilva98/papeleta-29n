// Cómo leer cada partido:
//   v     viabilidad por comunidad; '_' vale para el resto. Si la comunidad no está y no hay '_', no se presenta allí.
//   vp    viabilidad por provincia, cuando cambia dentro de la comunidad
//   x     comunidades donde no se presenta aunque haya '_'
//   only  provincias concretas en las que se presenta
//   al    nombre en la papeleta de cada comunidad; hd, cabeza de lista
//   base  partido del que hereda posiciones cuando no tiene una propia
export const PARTIES=[
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
