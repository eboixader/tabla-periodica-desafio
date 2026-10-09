// Desafío de la Tabla Periódica · datos
// [Z, símbolo, nombre, familia]
(function () {
  var raw = [
    [1, "H", "Hidrógeno", "nonmetal"], [2, "He", "Helio", "noble"], [3, "Li", "Litio", "alkali"], [4, "Be", "Berilio", "alkaline"],
    [5, "B", "Boro", "metalloid"], [6, "C", "Carbono", "nonmetal"], [7, "N", "Nitrógeno", "nonmetal"], [8, "O", "Oxígeno", "nonmetal"],
    [9, "F", "Flúor", "halogen"], [10, "Ne", "Neón", "noble"], [11, "Na", "Sodio", "alkali"], [12, "Mg", "Magnesio", "alkaline"],
    [13, "Al", "Aluminio", "post"], [14, "Si", "Silicio", "metalloid"], [15, "P", "Fósforo", "nonmetal"], [16, "S", "Azufre", "nonmetal"],
    [17, "Cl", "Cloro", "halogen"], [18, "Ar", "Argón", "noble"], [19, "K", "Potasio", "alkali"], [20, "Ca", "Calcio", "alkaline"],
    [21, "Sc", "Escandio", "transition"], [22, "Ti", "Titanio", "transition"], [23, "V", "Vanadio", "transition"], [24, "Cr", "Cromo", "transition"],
    [25, "Mn", "Manganeso", "transition"], [26, "Fe", "Hierro", "transition"], [27, "Co", "Cobalto", "transition"], [28, "Ni", "Níquel", "transition"],
    [29, "Cu", "Cobre", "transition"], [30, "Zn", "Zinc", "transition"], [31, "Ga", "Galio", "post"], [32, "Ge", "Germanio", "metalloid"],
    [33, "As", "Arsénico", "metalloid"], [34, "Se", "Selenio", "nonmetal"], [35, "Br", "Bromo", "halogen"], [36, "Kr", "Kriptón", "noble"],
    [37, "Rb", "Rubidio", "alkali"], [38, "Sr", "Estroncio", "alkaline"], [39, "Y", "Itrio", "transition"], [40, "Zr", "Zirconio", "transition"],
    [41, "Nb", "Niobio", "transition"], [42, "Mo", "Molibdeno", "transition"], [43, "Tc", "Tecnecio", "transition"], [44, "Ru", "Rutenio", "transition"],
    [45, "Rh", "Rodio", "transition"], [46, "Pd", "Paladio", "transition"], [47, "Ag", "Plata", "transition"], [48, "Cd", "Cadmio", "transition"],
    [49, "In", "Indio", "post"], [50, "Sn", "Estaño", "post"], [51, "Sb", "Antimonio", "metalloid"], [52, "Te", "Telurio", "metalloid"],
    [53, "I", "Yodo", "halogen"], [54, "Xe", "Xenón", "noble"], [55, "Cs", "Cesio", "alkali"], [56, "Ba", "Bario", "alkaline"],
    [57, "La", "Lantano", "lanthanide"], [58, "Ce", "Cerio", "lanthanide"], [59, "Pr", "Praseodimio", "lanthanide"], [60, "Nd", "Neodimio", "lanthanide"],
    [61, "Pm", "Prometio", "lanthanide"], [62, "Sm", "Samario", "lanthanide"], [63, "Eu", "Europio", "lanthanide"], [64, "Gd", "Gadolinio", "lanthanide"],
    [65, "Tb", "Terbio", "lanthanide"], [66, "Dy", "Disprosio", "lanthanide"], [67, "Ho", "Holmio", "lanthanide"], [68, "Er", "Erbio", "lanthanide"],
    [69, "Tm", "Tulio", "lanthanide"], [70, "Yb", "Iterbio", "lanthanide"], [71, "Lu", "Lutecio", "lanthanide"], [72, "Hf", "Hafnio", "transition"],
    [73, "Ta", "Tantalio", "transition"], [74, "W", "Wolframio", "transition"], [75, "Re", "Renio", "transition"], [76, "Os", "Osmio", "transition"],
    [77, "Ir", "Iridio", "transition"], [78, "Pt", "Platino", "transition"], [79, "Au", "Oro", "transition"], [80, "Hg", "Mercurio", "transition"],
    [81, "Tl", "Talio", "post"], [82, "Pb", "Plomo", "post"], [83, "Bi", "Bismuto", "post"], [84, "Po", "Polonio", "metalloid"],
    [85, "At", "Astato", "halogen"], [86, "Rn", "Radón", "noble"], [87, "Fr", "Francio", "alkali"], [88, "Ra", "Radio", "alkaline"],
    [89, "Ac", "Actinio", "actinide"], [90, "Th", "Torio", "actinide"], [91, "Pa", "Protactinio", "actinide"], [92, "U", "Uranio", "actinide"],
    [93, "Np", "Neptunio", "actinide"], [94, "Pu", "Plutonio", "actinide"], [95, "Am", "Americio", "actinide"], [96, "Cm", "Curio", "actinide"],
    [97, "Bk", "Berkelio", "actinide"], [98, "Cf", "Californio", "actinide"], [99, "Es", "Einstenio", "actinide"], [100, "Fm", "Fermio", "actinide"],
    [101, "Md", "Mendelevio", "actinide"], [102, "No", "Nobelio", "actinide"], [103, "Lr", "Lawrencio", "actinide"], [104, "Rf", "Rutherfordio", "transition"],
    [105, "Db", "Dubnio", "transition"], [106, "Sg", "Seaborgio", "transition"], [107, "Bh", "Bohrio", "transition"], [108, "Hs", "Hassio", "transition"],
    [109, "Mt", "Meitnerio", "transition"], [110, "Ds", "Darmstadtio", "transition"], [111, "Rg", "Roentgenio", "transition"], [112, "Cn", "Copernicio", "transition"],
    [113, "Nh", "Nihonio", "post"], [114, "Fl", "Flerovio", "post"], [115, "Mc", "Moscovio", "post"], [116, "Lv", "Livermorio", "post"],
    [117, "Ts", "Teneso", "halogen"], [118, "Og", "Oganesón", "noble"]
  ];

  // Disposición de la tabla (0 = hueco). Filas 8 y 9: lantánidos y actínidos.
  var layout = [
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
    [3, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 6, 7, 8, 9, 10],
    [11, 12, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 13, 14, 15, 16, 17, 18],
    [19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36],
    [37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54],
    [55, 56, 57, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86],
    [87, 88, 89, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 0, 0],
    [0, 0, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 0, 0]
  ];

  var families = {
    alkali: { name: "metales alcalinos", label: "Metales alcalinos", type: "metal" },
    alkaline: { name: "metales alcalinotérreos", label: "Alcalinotérreos", type: "metal" },
    transition: { name: "metales de transición", label: "Metales de transición", type: "metal" },
    post: { name: "otros metales (bloque p)", label: "Otros metales", type: "metal" },
    lanthanide: { name: "lantánidos", label: "Lantánidos", type: "metal" },
    actinide: { name: "actínidos", label: "Actínidos", type: "metal" },
    metalloid: { name: "semimetales", label: "Semimetales", type: "semimetal" },
    nonmetal: { name: "no metales", label: "No metales", type: "no metal" },
    halogen: { name: "halógenos", label: "Halógenos", type: "no metal" },
    noble: { name: "gases nobles", label: "Gases nobles", type: "no metal" }
  };

  // Usos y curiosidades (se muestran en la ficha del elemento)
  var facts = {
    1: "Es el elemento más abundante del universo: las estrellas lo usan como combustible.",
    2: "Es más ligero que el aire: con él se inflan los globos que flotan.",
    3: "Está en las baterías de los móviles y de los coches eléctricos.",
    4: "Es ligero y rígido: los espejos del telescopio espacial James Webb son de berilio.",
    5: "Se añade al vidrio para que resista cambios bruscos de temperatura (vidrio de borosilicato).",
    6: "Es la base de la vida. El diamante y el grafito de tu lápiz son carbono puro.",
    7: "Forma el 78 % del aire que respiras.",
    8: "Lo necesitas para respirar: es el 21 % del aire.",
    9: "Sus compuestos, los fluoruros, están en la pasta de dientes.",
    10: "Da el color rojo anaranjado a los letreros luminosos de neón.",
    11: "Con el cloro forma la sal de mesa (cloruro de sodio).",
    12: "Arde con una luz blanca muy intensa: se usa en bengalas y fuegos artificiales.",
    13: "Latas de refresco, papel de aluminio y fuselajes de aviones.",
    14: "Con él se fabrican los chips de los ordenadores y las placas solares.",
    15: "Está en la cabeza de las cerillas y en tus huesos (fosfato de calcio).",
    16: "Se usa para fabricar ácido sulfúrico y para endurecer el caucho de los neumáticos.",
    17: "Se usa para desinfectar el agua de las piscinas y del grifo.",
    18: "Rellena muchas bombillas para que el filamento no se queme.",
    19: "Abunda en los plátanos y es esencial para tus nervios y músculos.",
    20: "Forma parte de tus huesos y dientes.",
    21: "Aleado con aluminio, se usa en cuadros de bicicletas de competición.",
    22: "Ligero y resistente: prótesis de cadera, implantes dentales y aviones.",
    23: "Se añade al acero para fabricar herramientas más resistentes.",
    24: "Da el brillo a los grifos cromados y forma parte del acero inoxidable.",
    25: "Es imprescindible para fabricar acero y está en las pilas alcalinas.",
    26: "Es el metal más usado (acero de edificios y coches) y está en tu sangre (hemoglobina).",
    27: "Da el color azul cobalto a vidrios y cerámicas y está en muchas baterías.",
    28: "Está en las monedas de euro y en el acero inoxidable.",
    29: "Conduce muy bien la electricidad: los cables eléctricos son de cobre.",
    30: "Recubre el hierro para que no se oxide (hierro galvanizado).",
    31: "Se funde en la mano (a 29,8 °C) y se usa para fabricar luces LED.",
    32: "Semiconductor que se usa en fibra óptica y en los primeros transistores.",
    33: "Es muy tóxico: durante siglos se usó como veneno.",
    34: "Tu cuerpo lo necesita en cantidades muy pequeñas; se usa en células fotoeléctricas.",
    35: "Es uno de los dos únicos elementos líquidos a temperatura ambiente (el otro es el mercurio).",
    36: "Se usa en algunos flashes de fotografía y lámparas especiales.",
    37: "Se usa en relojes atómicos muy precisos.",
    38: "Da el color rojo a los fuegos artificiales.",
    43: "Fue el primer elemento obtenido artificialmente; se usa en medicina nuclear.",
    46: "Está en los catalizadores de los coches, que reducen los gases contaminantes.",
    47: "Es el mejor conductor eléctrico; se usa en joyería y en espejos.",
    48: "Se usaba en pilas recargables (níquel-cadmio). Es muy tóxico.",
    49: "Un compuesto de indio y estaño hace funcionar las pantallas táctiles.",
    50: "Con el cobre forma el bronce; también se usa para soldar componentes electrónicos.",
    51: "Se añade a plásticos y tejidos para que no ardan con facilidad.",
    52: "Se usa en algunas placas solares de lámina delgada.",
    53: "La tintura de yodo desinfecta heridas y la sal yodada previene problemas de tiroides.",
    54: "Se usa en los faros de algunos coches y en los motores iónicos de naves espaciales.",
    55: "Los relojes atómicos de cesio definen la duración exacta del segundo.",
    56: "Algunas radiografías del aparato digestivo se hacen tras beber sulfato de bario.",
    74: "Es el metal con el punto de fusión más alto: filamentos de las bombillas antiguas.",
    78: "Se usa en joyería y en los catalizadores de los coches.",
    79: "No se oxida: joyería y contactos de los circuitos electrónicos.",
    80: "Es el único metal líquido a temperatura ambiente; antes se usaba en los termómetros.",
    81: "Es muy tóxico; se usa en algunos detectores de radiación infrarroja.",
    82: "Protege de los rayos X en las consultas de radiología y está en las baterías de los coches.",
    83: "Está en algunos medicamentos para el estómago.",
    86: "Es un gas radiactivo que puede acumularse en sótanos mal ventilados.",
    87: "Es tan inestable que nunca se ha podido ver una muestra a simple vista.",
    88: "Lo descubrió Marie Curie; antes se usaba en pinturas luminosas de relojes.",
    92: "Es el combustible de las centrales nucleares."
  };

  // Niveles: los mismos del juego original
  var common = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
    21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38,
    46, 47, 48, 49, 50, 51, 52, 53, 54, 79, 80, 81, 82, 83, 86, 55, 56, 87, 88];

  var byZ = {};
  raw.forEach(function (r) {
    byZ[r[0]] = { z: r[0], sym: r[1], name: r[2], fam: r[3], group: null, period: null, valence: null, fact: facts[r[0]] || "" };
  });
  layout.forEach(function (row, ri) {
    row.forEach(function (z, ci) {
      if (!z) return;
      var e = byZ[z];
      if (ri < 7) { e.period = ri + 1; e.group = ci + 1; }
      else { e.period = ri === 8 ? 6 : 7; } // lantánidos y actínidos: sin grupo
    });
  });
  Object.keys(byZ).forEach(function (k) {
    var e = byZ[k];
    if (e.group === 1 || e.group === 2) e.valence = e.group;
    else if (e.group >= 13) e.valence = e.z === 2 ? 2 : e.group - 10;
    e.type = families[e.fam].type;
    e.unknown = e.z >= 113; // propiedades por confirmar
    e.ambiguous = e.z === 84 || e.z === 85 || e.unknown; // clasificación discutida
  });

  var all = raw.map(function (r) { return r[0]; });
  window.PT = {
    byZ: byZ,
    layout: layout,
    families: families,
    levels: {
      easy: { key: "easy", name: "Fácil", desc: "Elementos comunes", correct: 5, error: 2, ids: common },
      medium: { key: "medium", name: "Intermedio", desc: "Sin tierras raras", correct: 12, error: 4, ids: all.filter(function (z) { var f = byZ[z].fam; return f !== "lanthanide" && f !== "actinide"; }) },
      hard: { key: "hard", name: "Difícil", desc: "Tabla completa", correct: 25, error: 6, ids: all }
    }
  };
})();
