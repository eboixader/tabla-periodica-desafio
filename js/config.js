// Desafío de la Tabla Periódica · configuración electrónica
// Calcula configuraciones (orden de llenado, diagrama de Moeller) con las excepciones reales,
// explica cómo se deduce la posición en la tabla y corrige configuraciones escritas.
(function () {
  "use strict";

  var ORDER = ["1s", "2s", "2p", "3s", "3p", "4s", "3d", "4p", "5s", "4d", "5p", "6s", "4f", "5d", "6p", "7s", "5f", "6d", "7p"];
  var CAP = { s: 2, p: 6, d: 10, f: 14 };
  var CORES = [[118, "Og"], [86, "Rn"], [54, "Xe"], [36, "Kr"], [18, "Ar"], [10, "Ne"], [2, "He"]];
  // Excepciones al orden de llenado (estado fundamental real)
  var EXC = {
    24: { "4s": 1, "3d": 5 }, 29: { "4s": 1, "3d": 10 },
    41: { "5s": 1, "4d": 4 }, 42: { "5s": 1, "4d": 5 }, 44: { "5s": 1, "4d": 7 }, 45: { "5s": 1, "4d": 8 },
    46: { "5s": 0, "4d": 10 }, 47: { "5s": 1, "4d": 10 },
    57: { "4f": 0, "5d": 1 }, 58: { "4f": 1, "5d": 1 }, 64: { "4f": 7, "5d": 1 },
    78: { "6s": 1, "5d": 9 }, 79: { "6s": 1, "5d": 10 },
    89: { "5f": 0, "6d": 1 }, 90: { "5f": 0, "6d": 2 }, 91: { "5f": 2, "6d": 1 }, 92: { "5f": 3, "6d": 1 },
    93: { "5f": 4, "6d": 1 }, 96: { "5f": 7, "6d": 1 }, 103: { "6d": 0, "7p": 1 }
  };
  var SUP = { 0: "⁰", 1: "¹", 2: "²", 3: "³", 4: "⁴", 5: "⁵", 6: "⁶", 7: "⁷", 8: "⁸", 9: "⁹" };
  function sup(n) { return String(n).split("").map(function (c) { return SUP[c]; }).join(""); }

  function madelung(z) {
    var occ = {}, left = z;
    for (var i = 0; i < ORDER.length && left > 0; i++) {
      var n = Math.min(CAP[ORDER[i][1]], left); occ[ORDER[i]] = n; left -= n;
    }
    return occ;
  }
  function real(z) {
    var occ = madelung(z), ex = EXC[z];
    if (ex) Object.keys(ex).forEach(function (k) { occ[k] = ex[k]; });
    return occ;
  }
  function toText(occ, from) {
    var parts = [];
    ORDER.forEach(function (o) { if (occ[o] && (!from || !from[o])) parts.push(o + sup(occ[o])); });
    return parts.join(" ");
  }
  // full = configuración completa; si no, abreviada con el gas noble anterior
  function str(z, full) {
    var occ = real(z);
    if (full) return toText(occ);
    for (var i = 0; i < CORES.length; i++) {
      if (CORES[i][0] < z) return "[" + CORES[i][1] + "] " + toText(occ, real(CORES[i][0]));
    }
    return toText(occ);
  }
  // Fácil: completa hasta el kriptón; después, abreviada (sería demasiado larga)
  function forLevel(z, level) { return str(z, level === "easy" && z <= 36); }

  function lastFilled(occ) {
    var last = null;
    ORDER.forEach(function (o) { if (occ[o]) last = o; });
    return last;
  }
  function maxN(occ) {
    var n = 0;
    Object.keys(occ).forEach(function (o) { if (occ[o]) n = Math.max(n, +o[0]); });
    return n;
  }

  // Explicación de cómo se deduce la posición
  function explain(e) {
    var z = e.z, occ = real(z), exp = madelung(z), last = lastFilled(exp), blk = last[1], n = maxN(occ);
    var t = [];
    if (z === 46) t.push("El paladio es un caso especial: no tiene electrones en 5s, pero está en el periodo 5.");
    else t.push("Nivel más alto ocupado: n = " + n + " → periodo " + e.period + ".");
    if (z === 2) {
      t.push("Tiene la capa 1s completa (1s²): es un gas noble y va en el grupo 18.");
    } else if (!e.group) {
      t.push("Es de la serie de los " + (e.period === 6 ? "lantánidos" : "actínidos") + " (bloque f): va en la fila de abajo, separada de la tabla.");
    } else if (z === 57 || z === 89) {
      t.push("Termina en " + (z === 57 ? "5d¹" : "6d¹") + ": en esta tabla va en el grupo 3, al comienzo de la serie de los " + (z === 57 ? "lantánidos." : "actínidos."));
    } else if (blk === "s") {
      t.push("Termina en " + last + sup(occ[last]) + " → bloque s, grupo " + e.group + ".");
    } else if (blk === "p") {
      var ns = n + "s", np = n + "p";
      t.push("Termina en " + np + sup(occ[np]) + " → bloque p. Grupo = 10 + " + occ[ns] + " (" + ns + ") + " + occ[np] + " (" + np + ") = " + e.group + ".");
    } else if (blk === "d") {
      var dk = (n - 1) + "d", sk = n + "s", nd = occ[dk] || 0, nsx = occ[sk] || 0;
      if (z === 46) { dk = "4d"; nd = 10; nsx = 0; sk = "5s"; }
      t.push("Se está llenando el subnivel " + dk + " → bloque d (metal de transición). Grupo = " + nsx + " (" + sk + ") + " + nd + " (" + dk + ") = " + e.group + ".");
    } else if (blk === "f") {
      t.push("Se está llenando el subnivel " + last + " → bloque f: va en la fila de los " + (e.period === 6 ? "lantánidos" : "actínidos") + ", debajo de la tabla.");
    }
    if (EXC[z] && z !== 57 && z !== 89) t.push("⚠️ Es una excepción: según el orden de llenado sería " + toText(exp, real(coreZ(z))) + ", pero en realidad es " + toText(occ, real(coreZ(z))) + ".");
    if (z >= 104) t.push("(Configuración predicha: estos elementos solo se han obtenido unos pocos átomos.)");
    return t.join(" ");
  }
  function coreZ(z) { for (var i = 0; i < CORES.length; i++) if (CORES[i][0] < z) return CORES[i][0]; return 0; }

  // Corrección de una configuración escrita por el alumno
  var NORM_SUP = { "⁰": "0", "¹": "1", "²": "2", "³": "3", "⁴": "4", "⁵": "5", "⁶": "6", "⁷": "7", "⁸": "8", "⁹": "9" };
  function parse(txt) {
    var s = String(txt).replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]/g, function (c) { return NORM_SUP[c]; }).replace(/\^/g, "");
    var occ = {}, ok = true, rest = s;
    var core = s.match(/\[\s*([A-Za-z]{1,2})\s*\]/);
    if (core) {
      var sym = core[1].charAt(0).toUpperCase() + core[1].slice(1).toLowerCase(), found = null;
      CORES.forEach(function (c) { if (c[1] === sym) found = c[0]; });
      if (!found) return { error: "«[" + core[1] + "]» no es un gas noble." };
      occ = real(found); rest = s.replace(core[0], " ");
    }
    var re = /([1-7])\s*([spdfSPDF])\s*([0-9]{1,2})/g, m, used = 0;
    while ((m = re.exec(rest))) {
      var k = m[1] + m[2].toLowerCase(), n = +m[3];
      if (ORDER.indexOf(k) < 0) return { error: "El subnivel «" + k + "» no existe." };
      if (n > CAP[k[1]]) return { error: "En un subnivel " + k[1] + " caben como máximo " + CAP[k[1]] + " electrones (has puesto " + k + n + ")." };
      occ[k] = (occ[k] || 0) + n; used++;
    }
    var leftover = rest.replace(re, "").replace(/[\s,.;·]+/g, "");
    if (!used && !core) ok = false;
    if (leftover) return { error: "No entiendo «" + leftover + "». Escribe, por ejemplo: 1s2 2s2 2p6 3s1" };
    return ok ? { occ: occ } : { error: "Escribe la configuración, por ejemplo: 1s2 2s2 2p6 3s1" };
  }
  function same(a, b) {
    var keys = {};
    Object.keys(a).concat(Object.keys(b)).forEach(function (k) { keys[k] = 1; });
    return Object.keys(keys).every(function (k) { return (a[k] || 0) === (b[k] || 0); });
  }
  function check(z, txt) {
    var p = parse(txt);
    if (p.error) return { ok: false, valid: false, msg: p.error };
    var total = 0; Object.keys(p.occ).forEach(function (k) { total += p.occ[k]; });
    if (same(p.occ, real(z))) return { ok: true, msg: "¡Correcto!" };
    if (EXC[z] && same(p.occ, madelung(z))) return { ok: false, almost: true, msg: "Casi: así sería siguiendo el orden de llenado, pero es una excepción." };
    if (total !== z) return { ok: false, msg: "Has escrito " + total + " electrones y este elemento tiene " + z + "." };
    return { ok: false, msg: "El número de electrones es correcto, pero no están bien repartidos: sigue el orden de llenado (diagrama de Moeller)." };
  }

  window.CFG = { str: str, forLevel: forLevel, explain: explain, check: check, real: real, isException: function (z) { return !!EXC[z]; } };
})();

// Textos y preguntas de atención de la app «configelectronica» (Ernest Boixader)
window.CFG_TEXTS = {"1":{"s":"El Hidrógeno es el elemento más ligero y abundante del universo. Se usa como combustible para cohetes y en el futuro podría ser una fuente de energía limpia para coches.","q":"¿Qué elemento, el más ligero y abundante, se usa como combustible para cohetes?"},
"2":{"s":"El Helio es un gas muy ligero que no reacciona con nada. Se usa para inflar globos y dirigibles porque es más seguro que el hidrógeno, ya que no se quema.","q":"¿Qué gas noble muy ligero se usa para inflar globos y dirigibles porque no se quema?"},
"3":{"s":"El Litio es el metal más ligero. Es muy importante para fabricar las baterías de los móviles, portátiles y coches eléctricos.","q":"¿Qué metal, el más ligero de todos, es fundamental para fabricar las baterías de los móviles y coches eléctricos?"},
"4":{"s":"El Berilio es un metal ligero pero muy resistente. Se usa en aleaciones con otros metales para fabricar piezas de aviones y naves espaciales.","q":"¿Qué metal ligero y resistente se usa en aleaciones para fabricar piezas de naves espaciales?"},
"5":{"s":"El Boro no es un metal. Uno de sus compuestos, el bórax, se usa como detergente. También se utiliza en la fabricación de vidrios resistentes al calor, como los de los laboratorios.","q":"¿Qué elemento se usa en detergentes (bórax) y en la fabricación de vidrios resistentes al calor?"},
"6":{"s":"El Carbono es la base de la vida. Forma parte de todos los seres vivos. En forma de diamante es la sustancia más dura, y en forma de grafito se usa en las minas de los lápices.","q":"¿Qué elemento es la base de la vida y se encuentra en los lápices (grafito) y en la joya más dura (diamante)?"},
"7":{"s":"El Nitrógeno es el gas más abundante en el aire que respiramos. Es esencial para las plantas, por eso se usa para fabricar fertilizantes que ayudan a que crezcan.","q":"¿Qué gas, el más abundante del aire, es esencial para fabricar los fertilizantes que usan las plantas?"},
"8":{"s":"El Oxígeno es fundamental para la vida, ya que lo necesitamos para respirar. También es necesario para que las cosas ardan, es decir, para la combustión.","q":"¿Qué elemento es fundamental para la respiración y necesario para que las cosas ardan?"},
"9":{"s":"El Flúor es el elemento más reactivo. Se añade a la pasta de dientes y al agua potable en pequeñas cantidades para prevenir las caries dentales.","q":"¿Qué elemento, el más reactivo de todos, se añade a la pasta de dientes para prevenir las caries?"},
"10":{"s":"El Neón es un gas noble que brilla con una luz roja-anaranjada muy intensa cuando pasa la electricidad a través de él. Se usa en los famosos carteles luminosos.","q":"¿Qué gas noble se usa en carteles luminosos por su característico brillo rojo-anaranjado?"},
"11":{"s":"El Sodio es un metal blando y reactivo. Lo conocemos porque forma parte de la sal común (cloruro de sodio). Las farolas de luz anaranjada de algunas calles funcionan con vapor de sodio.","q":"¿Qué elemento forma parte de la sal común y desprende una luz anaranjada en algunas farolas?"},
"12":{"s":"El Magnesio es un metal ligero y resistente. Se usa en aleaciones para fabricar piezas de coches y aviones. Al quemarse, produce una luz blanca muy brillante, usada en los flashes antiguos.","q":"¿Qué metal produce una luz blanca muy brillante al quemarse y se usa en aleaciones para piezas de coches?"},
"13":{"s":"El Aluminio es un metal ligero, resistente a la corrosión y buen conductor. Lo usamos todos los días en el papel de aluminio, latas de refrescos y en los marcos de las ventanas.","q":"¿Qué metal ligero, que no se oxida fácilmente, se usa para fabricar latas de refrescos y papel de cocina?"},
"14":{"s":"El Silicio es un semimetal fundamental para la electrónica. Es el material principal con el que se fabrican los chips de los ordenadores, móviles y todos los aparatos electrónicos.","q":"¿Qué semimetal es la base para fabricar los chips de todos los aparatos electrónicos modernos?"},
"15":{"s":"El Fósforo es esencial para la vida, forma parte del ADN. El fósforo rojo se usa en la superficie de las cajas de cerillas para que estas se enciendan al rascar.","q":"¿Qué elemento, esencial para el ADN, se usa en la superficie de las cajas de cerillas?"},
"16":{"s":"El Azufre es un no metal de color amarillo conocido desde la antiguedad. Se usa para fabricar pólvora, medicamentos y para vulcanizar el caucho de los neumáticos.","q":"¿Qué no metal de color amarillo se usa para fabricar pólvora y para endurecer el caucho de los neumáticos?"},
"17":{"s":"El Cloro es un gas de color amarillo-verdoso. Es un potente desinfectante, por eso se utiliza para potabilizar el agua y mantener limpias las piscinas.","q":"¿Qué gas desinfectante de color amarillo-verdoso se usa para mantener limpias las piscinas?"},
"18":{"s":"El Argón es un gas noble que no reacciona. Se utiliza para rellenar el interior de las bombillas incandescentes para que el filamento no se queme y dure más tiempo.","q":"¿Qué gas noble se usa en el interior de las bombillas para que el filamento dure más?"},
"19":{"s":"El Potasio es un metal muy reactivo, vital para el funcionamiento de nuestras células nerviosas y musculares. Los plátanos son una fuente conocida de potasio.","q":"¿Qué metal, vital para los nervios y músculos, es famoso por encontrarse en los plátanos?"},
"20":{"s":"El Calcio es un metal esencial para nuestros huesos y dientes. También forma la tiza (carbonato de calcio) y el yeso que se usa en la construcción.","q":"¿Qué elemento es esencial para tener huesos y dientes fuertes y que también forma la tiza?"},
"21":{"s":"El Escandio es un metal ligero que se añade al aluminio para hacerlo más resistente. Se usa en algunos componentes aeroespaciales y en bates de béisbol de alta gama.","q":"¿Qué metal de transición se añade al aluminio para hacerlo más resistente para bates de béisbol?"},
"26":{"s":"El Hierro es el metal más usado en el mundo, principalmente para fabricar acero. Es esencial en la sangre (hemoglobina) para transportar oxígeno.","q":"¿Qué metal es el principal componente del acero y es vital para transportar oxígeno en la sangre?"},
"30":{"s":"El Zinc se usa para recubrir otros metales (galvanizado) y protegerlos de la corrosión. También es un nutriente esencial y se encuentra en cremas solares.","q":"¿Qué metal se usa para galvanizar y proteger otros metales del óxido?"},
"57":{"s":"El Lantano da nombre a la serie de los lantánidos. Se usa en lentes de cámaras y telescopios de alta calidad.","q":"¿Qué elemento da nombre a una de las series de tierras raras y se usa en lentes de cámaras?"},
"92":{"s":"El Uranio es el combustible más común para los reactores nucleares que producen electricidad. Es famoso por su radiactividad.","q":"¿Qué elemento radiactivo es el principal combustible de las centrales nucleares?"}};
