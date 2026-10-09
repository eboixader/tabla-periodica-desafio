// Desafío de la Tabla Periódica · lógica del juego
(function () {
  "use strict";

  var P = window.PT, Z = P.byZ;
  var KEY = "tpd:game:v1";
  var MODES = {
    donde: { name: "¿Dónde está?", ico: "📍", desc: "Te digo el nombre y pulsas su casilla. El juego de siempre: 5 minutos." },
    simbolo: { name: "Símbolos", ico: "🔤", desc: "Escribe el símbolo de un elemento o elige su nombre.", total: 10 },
    posicion: { name: "Grupo y periodo", ico: "🧭", desc: "Localiza elementos por su columna (grupo) y su fila (periodo).", total: 10 },
    familias: { name: "Familias", ico: "👪", desc: "Marca todos los elementos de una familia.", total: 5 },
    metales: { name: "¿Metal o no metal?", ico: "⚙️", desc: "Clasifica cada elemento: metal, no metal o semimetal.", total: 10 },
    misterio: { name: "Elemento misterioso", ico: "🕵️", desc: "Descúbrelo usando el menor número de pistas.", total: 5 }
  };
  var DONDE_TIME = 300;
  // Símbolos que no salen del nombre en castellano
  var LATIN = { 11: "natrium", 15: "phosphorus", 16: "sulphur", 19: "kalium", 26: "ferrum", 29: "cuprum", 47: "argentum", 50: "stannum", 51: "stibium", 53: "iodum", 79: "aurum", 80: "hydrargyrum", 82: "plumbum" };

  var S, R; // estado guardado y ronda actual (R === S.current)

  function $(s) { return document.querySelector(s); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function pl(n, one, many) { return n + " " + (n === 1 ? one : many); }
  function pct(a, b) { return b ? Math.round((100 * a) / b) : 0; }
  function art(e) { return "el " + e.name.toLowerCase(); }
  function lvl() { return P.levels[R ? R.level : S.level]; }

  // ───────── estado
  function fresh() {
    return {
      v: 1, level: "easy", points: 0, bestStreak: 0, mastery: {}, recent: [], modes: {}, famKo: {}, famOk: {},
      current: null, seenHelp: false,
      opts: { colors: true, sound: true, big: false, contrast: false, calm: false }
    };
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* sin almacenamiento */ } }
  function load() { try { var s = JSON.parse(localStorage.getItem(KEY)); return s && s.v === 1 ? s : null; } catch (e) { return null; } }
  function mstat(m) { return S.modes[m] || (S.modes[m] = { rounds: 0, ok: 0, ko: 0, best: {} }); }
  function mas(z) { return S.mastery[z] || (S.mastery[z] = { ok: 0, ko: 0, st: 0, m: false }); }
  function masteredCount() { return Object.keys(S.mastery).filter(function (z) { return S.mastery[z].m; }).length; }

  // ───────── sonido y efectos
  var snd = { ok: new Audio("sounds/correct.mp3"), ko: new Audio("sounds/wrong.mp3") };
  function play(k) { if (!S.opts.sound) return; try { snd[k].currentTime = 0; var p = snd[k].play(); if (p) p.catch(function () {}); } catch (e) { /* nada */ } }
  function toast(msg) {
    var t = $("#toast"); t.textContent = msg; t.classList.add("show");
    clearTimeout(toast.h); toast.h = setTimeout(function () { t.classList.remove("show"); }, 2400);
  }
  function confetti() {
    if (S.opts.calm || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    var cols = ["#3fd0ff", "#c86bff", "#ffd166", "#3ddc97", "#ff6b5b"];
    for (var i = 0; i < 60; i++) {
      var c = document.createElement("i"); c.className = "confetti";
      c.style.left = Math.random() * 100 + "vw"; c.style.background = cols[i % cols.length];
      c.style.animationDuration = 1.8 + Math.random() * 1.6 + "s"; c.style.animationDelay = Math.random() * 0.4 + "s";
      document.body.appendChild(c); setTimeout(c.remove.bind(c), 4200);
    }
  }
  function show(id) {
    ["screenHome", "screenGame", "screenEnd"].forEach(function (s) { $("#" + s).hidden = s !== id; });
    window.scrollTo({ top: 0 });
  }
  function renderTop() { $("#masteredVal").textContent = masteredCount(); $("#pointsVal").textContent = S.points; }

  // ───────── tabla periódica
  // opts: view "symbols" | "blank", colors, active(e) → bool, marks {z: clase}, mini
  function tableHTML(opts) {
    var html = "";
    P.layout.forEach(function (row) {
      row.forEach(function (z) {
        if (!z) { html += '<div class="gap"></div>'; return; }
        var e = Z[z], act = opts.active ? opts.active(e) : true;
        var m = S.mastery[z];
        var cls = "el f-" + e.fam + (act ? "" : " dim") + (opts.marks && opts.marks[z] ? " " + opts.marks[z] : "") +
          (m && m.m ? " mastered" : "") + (opts.mini && m && (m.ok || m.ko) ? " seen" : "");
        var label = opts.view === "blank" ? (e.group ? "Casilla del grupo " + e.group + ", periodo " + e.period : "Casilla del bloque f") : e.name + " (" + e.sym + "), número atómico " + z;
        html += '<button class="' + cls + '" data-z="' + z + '"' + (act && !opts.mini && !opts.locked ? "" : " disabled") + ' aria-label="' + esc(label) + '">' +
          (opts.view === "blank" ? "" : '<span class="z">' + z + '</span><span class="s">' + e.sym + "</span>") + "</button>";
      });
    });
    return html;
  }
  function legendHTML() {
    return Object.keys(P.families).map(function (k) { return '<span style="--fc:var(--f-' + k + ')">' + P.families[k].label + "</span>"; }).join("");
  }

  // ───────── elección de elementos (repaso inteligente)
  function pick(filter) {
    var ids = lvl().ids.filter(function (z) { return !filter || filter(Z[z]); });
    var pool = ids.filter(function (z) { return S.recent.indexOf(z) < 0; });
    if (pool.length < 3) pool = ids;
    var w = pool.map(function (z) {
      var m = S.mastery[z], x = 1;
      if (m) { x += 2 * Math.max(0, m.ko - m.ok / 2); if (m.m) x *= 0.5; }
      return Math.min(x, 8);
    });
    var sum = w.reduce(function (a, b) { return a + b; }, 0), r = Math.random() * sum, chosen = pool[pool.length - 1];
    for (var i = 0; i < pool.length; i++) { r -= w[i]; if (r <= 0) { chosen = pool[i]; break; } }
    S.recent.push(chosen); if (S.recent.length > 8) S.recent.shift();
    return Z[chosen];
  }

  // ───────── inicio
  function renderHome() {
    R = S.current = null;
    $("#levels").innerHTML = ["easy", "medium", "hard"].map(function (k) {
      var l = P.levels[k];
      return '<button class="level lv-' + k + '" role="radio" aria-checked="' + (S.level === k) + '" data-level="' + k + '"><b>' + l.name + "</b><span>" + l.desc + " (" + l.ids.length + " elementos)</span><small>Acierto: +" + l.correct + " · Error: −" + l.error + "</small></button>";
    }).join("");
    $("#modes").innerHTML = Object.keys(MODES).map(function (k) {
      var m = MODES[k], st = S.modes[k], best = "";
      if (st && st.best[S.level] != null) best = "🏆 " + st.best[S.level];
      return '<button class="mode' + (k === "donde" ? " classic" : "") + '" data-mode="' + k + '"><span class="best">' + best + '</span><span class="ico">' + m.ico + "</span><h3>" + m.name + "</h3><p>" + m.desc + "</p></button>";
    }).join("");
    var n = masteredCount(), easyN = P.levels.easy.ids.filter(function (z) { return S.mastery[z] && S.mastery[z].m; }).length;
    $("#masterySub").textContent = "⭐ " + n + " dominados · " + easyN + " de los " + P.levels.easy.ids.length + " del nivel fácil";
    $("#masteryTable").innerHTML = tableHTML({ view: "symbols", mini: true });
    renderTop();
    show("screenHome");
  }
  $("#levels").addEventListener("click", function (e) {
    var b = e.target.closest("[data-level]"); if (!b) return;
    S.level = b.dataset.level; save(); renderHome();
  });
  $("#modes").addEventListener("click", function (e) {
    var b = e.target.closest("[data-mode]"); if (!b) return;
    startRound(b.dataset.mode);
  });

  // ───────── rondas
  function startRound(mode) {
    R = S.current = { mode: mode, level: S.level, n: 0, total: MODES[mode].total || 0, score: 0, ok: 0, ko: 0, streak: 0, best: 0, time: mode === "donde" ? DONDE_TIME : 0, misses: [], q: null, lastFam: null, ficha: "" };
    newQ();
  }

  function newQ() {
    var q = { done: false, marks: {} }, mode = R.mode, t;
    if (mode === "donde") {
      t = pick(); q.kind = "click"; q.t = t.z;
    } else if (mode === "simbolo") {
      t = pick(); q.t = t.z;
      if (R.n % 2 === 0) q.kind = "type";
      else {
        q.kind = "choice";
        var others = shuffle(lvl().ids.filter(function (z) { return z !== t.z; }));
        var similar = others.filter(function (z) { return Z[z].sym[0] === t.sym[0] || Z[z].name[0] === t.name[0]; });
        var opts = similar.slice(0, 2); others.forEach(function (z) { if (opts.length < 3 && opts.indexOf(z) < 0) opts.push(z); });
        q.options = shuffle(opts.concat([t.z]));
      }
    } else if (mode === "posicion") {
      var cycle = R.level === "hard" ? ["click", "where", "valence"] : ["click", "where"];
      q.kind = cycle[R.n % cycle.length];
      t = pick(q.kind === "valence" ? function (e) { return e.valence; } : function (e) { return e.group; });
      q.t = t.z;
    } else if (mode === "familias") {
      q.kind = "family";
      var count = {};
      lvl().ids.forEach(function (z) { if (!Z[z].unknown) count[Z[z].fam] = (count[Z[z].fam] || 0) + 1; });
      var fams = Object.keys(count).filter(function (f) { return count[f] >= 2 && f !== R.lastFam; });
      q.fam = fams[Math.floor(Math.random() * fams.length)]; R.lastFam = q.fam;
      q.sel = [];
    } else if (mode === "metales") {
      t = pick(function (e) { return !e.ambiguous; }); q.kind = "type3"; q.t = t.z;
    } else if (mode === "misterio") {
      t = pick(function (e) { return e.group && !e.unknown; }); q.kind = "mystery"; q.t = t.z; q.shown = 1;
      var fam = P.families[t.fam];
      q.clues = [
        "Es un " + t.type + ".",
        "Está en el periodo " + t.period + ".",
        R.level === "hard" && t.valence ? "Tiene " + t.valence + " electrones de valencia." : "Pertenece a la familia de los " + fam.name + ".",
        "Está en el grupo " + t.group + "."
      ];
    }
    R.q = q; save();
    renderGame();
  }

  // ───────── pintar la pantalla de juego
  function renderGame() {
    var q = R.q, mode = R.mode, l = P.levels[R.level], t = q.t ? Z[q.t] : null;
    $("#gameMode").textContent = MODES[mode].ico + " " + MODES[mode].name;
    var lb = $("#gameLevel"); lb.textContent = l.name; lb.className = "badge lv-" + R.level; lb.style.color = "var(--lc)";
    $("#statClock").hidden = mode !== "donde";
    $("#statQ").hidden = mode === "donde";
    updateStats();

    // enunciado
    var p = "";
    if (q.kind === "click" && mode === "donde") p = 'Elemento<span class="big">' + esc(t.name) + "</span>";
    else if (q.kind === "type") p = 'Escribe el símbolo de<span class="big">' + esc(t.name) + "</span>";
    else if (q.kind === "choice") p = '¿Qué elemento tiene el símbolo<span class="big">' + esc(t.sym) + "</span>";
    else if (q.kind === "click") p = 'Pulsa la casilla del<span class="big">grupo ' + t.group + " · periodo " + t.period + "</span>";
    else if (q.kind === "where") p = '¿En qué grupo y periodo está…<span class="big">' + esc(t.name) + " (" + t.sym + ")</span>";
    else if (q.kind === "valence") p = '¿Cuántos electrones de valencia tiene…<span class="big">' + esc(t.name) + " (" + t.sym + ")</span>";
    else if (q.kind === "family") p = 'Marca en la tabla todos los<span class="big">' + esc(P.families[q.fam].name) + "</span>";
    else if (q.kind === "type3") p = '¿Metal, no metal o semimetal?<span class="big">' + esc(t.name) + " (" + t.sym + ")</span>";
    else if (q.kind === "mystery") p = "¿Qué elemento es? Púlsalo en la tabla." + '<ul class="clues">' + q.clues.slice(0, q.shown).map(function (c) { return "<li>" + esc(c) + "</li>"; }).join("") + "</ul>";
    $("#prompt").innerHTML = p;

    // zona de respuesta
    var a = "";
    if (!q.done) {
      if (q.kind === "type") a = '<form id="ansForm" class="answer-form"><label>Símbolo <input id="ansInput" maxlength="3" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Símbolo"></label> <button class="main-btn">Comprobar</button></form>';
      else if (q.kind === "choice") a = q.options.map(function (z) { return '<button class="opt-btn" data-opt="' + z + '">' + esc(Z[z].name) + "</button>"; }).join("");
      else if (q.kind === "where") a = '<label>Grupo <select id="selG"><option value="">—</option>' + range(1, 18) + '</select></label><label>Periodo <select id="selP"><option value="">—</option>' + range(1, 7) + '</select></label><button class="main-btn" id="whereBtn">Comprobar</button>';
      else if (q.kind === "valence") a = [1, 2, 3, 4, 5, 6, 7, 8].map(function (v) { return '<button class="opt-btn" style="min-width:56px;flex:0" data-val="' + v + '">' + v + "</button>"; }).join("");
      else if (q.kind === "type3") a = ["metal", "no metal", "semimetal"].map(function (v) { return '<button class="opt-btn" data-type="' + v + '">' + v[0].toUpperCase() + v.slice(1) + "</button>"; }).join("");
      else if (q.kind === "family") a = '<button class="main-btn" id="famBtn">Comprobar (' + q.sel.length + " marcados)</button>";
      else if (q.kind === "mystery") a = q.shown < q.clues.length ? '<button class="ghost-btn" id="clueBtn">🔎 Otra pista (vale menos puntos)</button>' : "";
    } else if (mode !== "donde") {
      a = '<button class="main-btn" id="nextBtn">' + (R.n >= R.total ? "Ver resultado →" : "Siguiente →") + "</button>";
    }
    if (q.done && q.answerHTML) a = q.answerHTML + a;
    $("#answer").innerHTML = a;

    // tabla
    var needTable = mode === "donde" || q.kind === "click" || q.kind === "family" || q.kind === "mystery";
    var showTable = needTable || (q.done && t);
    $("#tableCol").hidden = !showTable;
    $(".play-area").classList.toggle("no-table", !showTable);
    if (showTable) {
      var colors = (mode === "donde" && S.opts.colors) || (!needTable && S.opts.colors);
      var view = q.kind === "click" && mode === "posicion" && !q.done ? "blank" : "symbols";
      var active = mode === "donde" ? function (e) { return l.ids.indexOf(e.z) >= 0; }
        : q.kind === "click" ? function (e) { return !!e.group; }
          : q.kind === "family" || q.kind === "mystery" ? function (e) { return l.ids.indexOf(e.z) >= 0 && !e.unknown; }
            : function () { return true; };
      var marks = q.marks;
      if (q.kind === "family") { marks = Object.assign({}, q.marks); if (!q.done) q.sel.forEach(function (z) { marks[z] = "sel"; }); }
      var tb = $("#gameTable");
      tb.className = "ptable" + (colors ? "" : " nocolor");
      tb.innerHTML = tableHTML({ view: view, colors: colors, active: active, locked: q.done && mode !== "donde", marks: marks });
      $("#legend").innerHTML = colors ? legendHTML() : "";
    }
    $("#ficha").innerHTML = R.ficha || "";
    show("screenGame");
    var inp = $("#ansInput"); if (inp) inp.focus();
    var nx = $("#nextBtn"); if (nx) nx.focus();
  }
  function range(a, b) { var s = ""; for (var i = a; i <= b; i++) s += '<option value="' + i + '">' + i + "</option>"; return s; }
  function updateStats() {
    $("#scoreVal").textContent = R.score;
    $("#streakVal").textContent = R.streak ? "🔥 " + R.streak : "0";
    $(".stat:last-child").classList.toggle("fire", R.streak >= 3);
    var m = Math.floor(R.time / 60), s = R.time % 60;
    $("#clockVal").textContent = String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
    $("#statClock").classList.toggle("warn", R.mode === "donde" && R.time <= 60);
    $("#qVal").textContent = Math.min(R.n + (R.q && R.q.done ? 0 : 1), R.total) + "/" + R.total;
  }

  function fichaHTML(t, ok, msg) {
    var fam = P.families[t.fam];
    return '<div class="res ' + (ok ? "ok" : "ko") + '">' + (ok ? "✅ " : "❌ ") + msg + "</div>" +
      '<div class="tile f-' + t.fam + '"><span class="z">' + t.z + '</span><span class="s">' + t.sym + '</span><span class="n">' + esc(t.name) + "</span></div>" +
      '<ul class="facts"><li><span>Grupo</span><b>' + (t.group || "— (bloque f)") + "</b></li><li><span>Periodo</span><b>" + t.period + "</b></li>" +
      "<li><span>Familia</span><b>" + fam.label + "</b></li><li><span>Tipo</span><b>" + (t.unknown ? "por confirmar" : t.type) + "</b></li>" +
      (t.valence ? "<li><span>Electrones de valencia</span><b>" + t.valence + "</b></li>" : "") + "</ul>" +
      (LATIN[t.z] ? '<p class="fact">Su símbolo viene del latín <i>' + LATIN[t.z] + "</i>.</p>" : "") +
      (t.fact ? '<p class="fact">' + esc(t.fact) + "</p>" : "");
  }

  // ───────── corregir
  function finish(ok, t, msg, factor) {
    var l = P.levels[R.level], st = mstat(R.mode), q = R.q;
    q.done = true; R.n++;
    if (ok) {
      var pts = Math.max(1, Math.round(l.correct * (factor || 1)));
      R.ok++; st.ok++; R.streak++; R.best = Math.max(R.best, R.streak);
      S.bestStreak = Math.max(S.bestStreak, R.streak);
      if (R.streak % 5 === 0) { pts += l.correct; toast("🔥 ¡Racha de " + R.streak + "! +" + l.correct + " puntos extra"); }
      R.score += pts; S.points += pts;
      play("ok");
      $("#prompt").classList.remove("flash-ko"); void $("#prompt").offsetWidth; $("#prompt").classList.add("flash-ok");
    } else {
      R.ko++; st.ko++; R.streak = 0;
      R.score = Math.max(0, R.score - l.error); S.points = Math.max(0, S.points - l.error);
      play("ko");
      $("#prompt").classList.remove("flash-ok"); void $("#prompt").offsetWidth; $("#prompt").classList.add("flash-ko");
    }
    if (t) {
      if (!q.marks[t.z]) q.marks[t.z] = ok ? "ok" : "target";
      var m = mas(t.z);
      if (ok) { m.ok++; m.st++; if (m.st >= 3 && !m.m) { m.m = true; toast("⭐ ¡" + t.name + " dominado!"); } }
      else { m.ko++; m.st = 0; if (R.misses.indexOf(t.z) < 0) R.misses.push(t.z); S.famKo[t.fam] = (S.famKo[t.fam] || 0) + 1; }
      if (ok) S.famOk[t.fam] = (S.famOk[t.fam] || 0) + 1;
      R.ficha = fichaHTML(t, ok, msg);
    }
    renderTop(); save();
    if (R.mode === "donde") {
      renderGame();
      setTimeout(function () { if (R && R.mode === "donde" && R.time > 0) newQ(); }, 700);
    } else renderGame();
  }

  // clic en la tabla
  $("#gameTable").addEventListener("click", function (e) {
    var b = e.target.closest(".el"); if (!b || b.disabled || !R || R.q.done) return;
    var z = +b.dataset.z, q = R.q, t = Z[q.t], c = Z[z];
    if (q.kind === "click") {
      var ok = z === q.t;
      q.marks = {}; q.marks[q.t] = ok ? "ok" : "target"; if (!ok) q.marks[z] = "ko";
      var msg = ok ? "¡Correcto!" : R.mode === "donde"
        ? "Has pulsado " + art(c) + " (" + c.sym + "). El " + t.name.toLowerCase() + " es el que parpadea."
        : "Has pulsado la casilla del grupo " + c.group + ", periodo " + c.period + ". La correcta es la que parpadea.";
      finish(ok, t, msg);
    } else if (q.kind === "family") {
      var i = q.sel.indexOf(z); if (i >= 0) q.sel.splice(i, 1); else q.sel.push(z);
      b.classList.toggle("sel"); $("#famBtn").textContent = "Comprobar (" + q.sel.length + " marcados)";
      save();
    } else if (q.kind === "mystery") {
      if (z === q.t) {
        q.marks = {}; q.marks[z] = "ok";
        finish(true, t, "¡Lo has descubierto con " + q.shown + (q.shown === 1 ? " pista!" : " pistas!"), [1, 0.75, 0.5, 0.25][q.shown - 1]);
      } else if (q.shown < q.clues.length) {
        q.shown++; q.marks[z] = "ko"; save(); renderGame();
        toast("No es " + art(c) + ". Tienes una pista nueva.");
      } else {
        q.marks[z] = "ko"; q.marks[q.t] = "target";
        finish(false, t, "Era " + art(t) + ".");
      }
    }
  });

  $("#answer").addEventListener("click", function (e) {
    if (!R) return;
    var q = R.q, t = q.t ? Z[q.t] : null, b;
    if ((b = e.target.closest("#nextBtn"))) { if (R.n >= R.total) endRound(); else newQ(); return; }
    if (q.done) return;
    if ((b = e.target.closest("[data-opt]"))) {
      var z = +b.dataset.opt, ok = z === q.t;
      q.answerHTML = q.options.map(function (o) { return '<button class="opt-btn ' + (o === q.t ? "right" : o === z ? "wrong" : "") + '" disabled>' + esc(Z[o].name) + "</button>"; }).join("") + '<div style="flex-basis:100%"></div>';
      finish(ok, t, ok ? "¡Correcto! «" + t.sym + "» es " + art(t) + "." : "«" + t.sym + "» es " + art(t) + ", no " + art(Z[z]) + ".");
    } else if ((b = e.target.closest("#whereBtn"))) {
      var g = +$("#selG").value, p = +$("#selP").value;
      if (!g || !p) { toast("Elige el grupo y el periodo."); return; }
      var okG = g === t.group, okP = p === t.period;
      q.answerHTML = '<p style="flex-basis:100%;text-align:center;margin:0">Tu respuesta: grupo ' + g + ", periodo " + p + "</p>";
      finish(okG && okP, t, okG && okP ? "¡Correcto!" : (okP ? "El periodo es correcto, pero el grupo no. " : okG ? "El grupo es correcto, pero el periodo no. " : "") + "Está en el grupo " + t.group + " y el periodo " + t.period + ".");
    } else if ((b = e.target.closest("[data-val]"))) {
      var v = +b.dataset.val, okv = v === t.valence;
      q.answerHTML = '<p style="flex-basis:100%;text-align:center;margin:0">Tu respuesta: ' + v + "</p>";
      var why = t.group <= 2 ? "En los grupos 1 y 2 coincide con el número del grupo." : t.z === 2 ? "El helio solo tiene 2 electrones." : "En los grupos 13 a 18 es el número del grupo menos 10.";
      finish(okv, t, (okv ? "¡Correcto! " : "Tiene " + t.valence + " electrones de valencia. ") + why);
    } else if ((b = e.target.closest("[data-type]"))) {
      var ty = b.dataset.type, okt = ty === t.type;
      q.answerHTML = ["metal", "no metal", "semimetal"].map(function (v) { return '<button class="opt-btn ' + (v === t.type ? "right" : v === ty ? "wrong" : "") + '" disabled>' + v[0].toUpperCase() + v.slice(1) + "</button>"; }).join("") + '<div style="flex-basis:100%"></div>';
      var hint = t.type === "semimetal" ? "Los semimetales están en la «escalera» que separa metales y no metales." : t.type === "metal" ? "Los metales ocupan la parte izquierda y central de la tabla." : "Los no metales están a la derecha de la escalera (y el hidrógeno).";
      q.marks = {}; q.marks[t.z] = okt ? "ok" : "target";
      finish(okt, t, (okt ? "¡Correcto! " : (art(t).charAt(0).toUpperCase() + art(t).slice(1)) + " es un " + t.type + ". ") + hint);
    } else if ((b = e.target.closest("#famBtn"))) {
      checkFamily();
    } else if ((b = e.target.closest("#clueBtn"))) {
      q.shown++; save(); renderGame();
    }
  });
  $("#answer").addEventListener("submit", function (e) {
    e.preventDefault();
    var q = R.q, t = Z[q.t], v = $("#ansInput").value.trim();
    if (!v) return;
    var ok = v === t.sym, almost = !ok && v.toLowerCase() === t.sym.toLowerCase();
    q.answerHTML = '<p style="flex-basis:100%;text-align:center;margin:0">Has escrito: <b>' + esc(v) + "</b></p>";
    finish(ok, t, ok ? "¡Correcto! El símbolo es «" + t.sym + "»." : almost
      ? "Casi: se escribe «" + t.sym + "». La primera letra va en mayúscula y la segunda en minúscula."
      : "El símbolo del " + t.name.toLowerCase() + " es «" + t.sym + "».");
  });

  function checkFamily() {
    var q = R.q, l = P.levels[R.level], fam = q.fam;
    var correct = l.ids.filter(function (z) { return Z[z].fam === fam && !Z[z].unknown; });
    var good = q.sel.filter(function (z) { return correct.indexOf(z) >= 0; });
    var bad = q.sel.filter(function (z) { return correct.indexOf(z) < 0; });
    var missed = correct.filter(function (z) { return q.sel.indexOf(z) < 0; });
    q.marks = {};
    good.forEach(function (z) { q.marks[z] = "ok"; }); bad.forEach(function (z) { q.marks[z] = "ko"; }); missed.forEach(function (z) { q.marks[z] = "missed"; });
    var ok = !bad.length && !missed.length;
    if (ok) S.famOk[fam] = (S.famOk[fam] || 0) + 1; else S.famKo[fam] = (S.famKo[fam] || 0) + 1;
    var f = P.families[fam];
    R.ficha = '<div class="res ' + (ok ? "ok" : "ko") + '">' + (ok ? "✅ ¡Perfecto! Has marcado todos los " + f.name + "." : "❌ " + good.length + " de " + correct.length + " bien.") + "</div>" +
      '<ul class="facts"><li><span>Bien marcados</span><b>' + good.length + "</b></li><li><span>Sobran (rojo)</span><b>" + bad.length + "</b></li><li><span>Faltan (amarillo)</span><b>" + missed.length + "</b></li></ul>" +
      (missed.length ? '<p class="fact">Te faltaban: ' + missed.map(function (z) { return Z[z].sym; }).join(", ") + ".</p>" : "") +
      (bad.length ? '<p class="fact">No son ' + f.name + ": " + bad.map(function (z) { return Z[z].sym + " (" + P.families[Z[z].fam].label.toLowerCase() + ")"; }).join(", ") + ".</p>" : "");
    finish(ok, null, "");
  }

  function endRound() {
    var st = mstat(R.mode); st.rounds++;
    if (st.best[R.level] == null || R.score > st.best[R.level]) st.best[R.level] = R.score;
    var tot = R.ok + R.ko, acc = pct(R.ok, tot);
    if (acc >= 80 && tot >= 5) confetti();
    var html = '<div class="big">' + (acc >= 80 ? "🏆" : acc >= 50 ? "🧪" : "📚") + "</div>" +
      "<h2>" + (R.mode === "donde" ? "¡Tiempo agotado!" : "¡Ronda terminada!") + "</h2>" +
      "<p>" + MODES[R.mode].name + " · nivel " + P.levels[R.level].name.toLowerCase() + "</p>" +
      '<div class="end-grid"><div><b>' + R.score + "</b><span>puntos</span></div><div><b>" + R.ok + "</b><span>aciertos</span></div><div><b>" + R.ko + "</b><span>errores</span></div><div><b>" + acc + " %</b><span>acierto</span></div><div><b>" + R.best + "</b><span>mejor racha</span></div></div>" +
      (R.misses.length ? "<p>Elementos para repasar (volverán a salir más a menudo):</p><div class='review'>" + R.misses.slice(0, 10).map(function (z) { return "<span>" + Z[z].sym + " · " + esc(Z[z].name) + "</span>"; }).join("") + "</div>" : "") +
      "<p>Recuerda: cuando acabes, pulsa <b>📄 Informe</b> y entrégalo en Classroom.</p>" +
      '<div class="end-actions"><button class="main-btn" data-again="' + R.mode + '">Jugar otra vez</button><button class="ghost-btn" data-go="home">Cambiar de modo</button><button class="ghost-btn" data-ss-open>📄 Informe</button></div>';
    R = S.current = null; save();
    $("#endCard").innerHTML = html;
    renderTop();
    show("screenEnd");
  }

  // ───────── navegación, ayuda y opciones
  document.addEventListener("click", function (e) {
    var t = e.target.closest("[data-go],[data-again],[data-ss-open]"); if (!t) return;
    if (t.hasAttribute("data-go")) renderHome();
    else if (t.hasAttribute("data-again")) startRound(t.dataset.again);
    else StudentSession.openReport();
  });
  $("#homeBtn").addEventListener("click", function () { if (S) renderHome(); });
  function openHelp() { $("#helpModal").hidden = false; $("#helpModal [data-close]").focus(); }
  $("#helpBtn").addEventListener("click", openHelp);
  $("#helpModal").addEventListener("click", function (e) {
    if (e.target === this || e.target.closest("[data-close]")) { this.hidden = true; S.seenHelp = true; save(); }
  });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") { $("#helpModal").hidden = true; $("#a11yMenu").hidden = true; } });
  $("#a11yBtn").addEventListener("click", function (e) {
    e.stopPropagation(); var m = $("#a11yMenu"); m.hidden = !m.hidden; this.setAttribute("aria-expanded", String(!m.hidden));
  });
  document.addEventListener("click", function (e) { if (!e.target.closest("#a11yMenu,#a11yBtn")) $("#a11yMenu").hidden = true; });
  var OPTS = [["#optColors", "colors"], ["#optSound", "sound"], ["#optBig", "big"], ["#optContrast", "contrast"], ["#optMotion", "calm"]];
  function applyOpts() {
    document.body.classList.toggle("big", S.opts.big);
    document.body.classList.toggle("contrast", S.opts.contrast);
    document.body.classList.toggle("calm", S.opts.calm);
    OPTS.forEach(function (o) { $(o[0]).checked = !!S.opts[o[1]]; });
  }
  OPTS.forEach(function (o) {
    $(o[0]).addEventListener("change", function () {
      S.opts[o[1]] = this.checked; applyOpts(); save();
      if (o[1] === "colors" && R) renderGame();
    });
  });

  // ───────── reloj del modo ¿Dónde está? (solo cuenta el tiempo activo)
  setInterval(function () {
    if (!R || R.mode !== "donde" || $("#screenGame").hidden || !StudentSession.isActive()) return;
    R.time--; updateStats();
    if (R.time % 5 === 0) save();
    if (R.time <= 0) endRound();
  }, 1000);

  // ───────── informe
  function getReport() {
    var rows = [], n = masteredCount();
    var easyN = P.levels.easy.ids.filter(function (z) { return S.mastery[z] && S.mastery[z].m; }).length;
    rows.push(["Elementos dominados", n + " de 118 (" + easyN + " de los " + P.levels.easy.ids.length + " del nivel fácil)"]);
    rows.push(["Puntos totales", String(S.points)]);
    rows.push(["Mejor racha", S.bestStreak + " aciertos seguidos"]);
    var totOk = 0, totKo = 0, played = [];
    Object.keys(MODES).forEach(function (k) {
      var m = S.modes[k]; if (!m || !(m.ok + m.ko)) return;
      totOk += m.ok; totKo += m.ko; played.push(k);
      rows.push([MODES[k].name, pl(m.rounds, "ronda terminada", "rondas terminadas") + " · " + pl(m.ok, "acierto", "aciertos") + " · " + pl(m.ko, "error", "errores") + " · " + pct(m.ok, m.ok + m.ko) + " %"]);
    });
    var d = S.modes.donde;
    if (d && Object.keys(d.best).length) rows.push(["Récord en ¿Dónde está?", ["easy", "medium", "hard"].filter(function (k) { return d.best[k] != null; }).map(function (k) { return P.levels[k].name + ": " + d.best[k]; }).join(" · ")]);

    var failed = Object.keys(S.mastery).filter(function (z) { return S.mastery[z].ko > 0; })
      .sort(function (a, b) { return S.mastery[b].ko - S.mastery[a].ko; });
    var sections = [];
    if (failed.length) sections.push({ title: "Elementos que más ha fallado", lines: failed.slice(0, 8).map(function (z) { var m = S.mastery[z]; return Z[z].sym + " (" + Z[z].name + "): " + m.ko + (m.ko === 1 ? " error" : " errores") + ", " + m.ok + (m.ok === 1 ? " acierto" : " aciertos"); }) });
    var mast = Object.keys(S.mastery).filter(function (z) { return S.mastery[z].m; }).map(function (z) { return Z[z].sym; });
    if (mast.length) sections.push({ title: "Elementos dominados", lines: [mast.join(", ")] });

    var strengths = [], improve = [], next = [];
    played.forEach(function (k) {
      var m = S.modes[k], tot = m.ok + m.ko, p = pct(m.ok, tot);
      if (tot >= 8 && p >= 80) strengths.push("Dominas el modo «" + MODES[k].name + "» (" + p + " % de acierto).");
      else if (tot >= 5 && p < 60) improve.push("En «" + MODES[k].name + "» aciertas el " + p + " %: vuelve a practicarlo.");
    });
    if (n >= 10) strengths.push("Ya dominas " + n + " elementos.");
    Object.keys(S.famOk).forEach(function (f) { if (S.famOk[f] >= 4 && !(S.famKo[f] > 0)) strengths.push("No has fallado ninguna pregunta sobre los " + P.families[f].name + "."); });
    Object.keys(S.famKo).sort(function (a, b) { return S.famKo[b] - S.famKo[a]; }).slice(0, 2).forEach(function (f) {
      if (S.famKo[f] >= 2) improve.push("Repasa los " + P.families[f].name + ": " + S.famKo[f] + " errores.");
    });
    var rep = failed.filter(function (z) { return S.mastery[z].ko >= 2 && !S.mastery[z].m; }).slice(0, 5);
    if (rep.length) improve.push("Repasa estos elementos: " + rep.map(function (z) { return Z[z].sym + " (" + Z[z].name.toLowerCase() + ")"; }).join(", ") + ".");
    if (!totOk && !totKo) improve.push("Todavía no has respondido ninguna pregunta.");
    var notPlayed = Object.keys(MODES).filter(function (k) { return played.indexOf(k) < 0; });
    if (notPlayed.length) next.push("Prueba el modo «" + MODES[notPlayed[0]].name + "».");
    if (S.level === "easy" && easyN >= 40) next.push("Ya puedes subir al nivel Intermedio.");
    else if (S.level === "medium" && pct(totOk, totOk + totKo) >= 80) next.push("Atrévete con el nivel Difícil.");
    if (!next.length) next.push("Sigue jugando hasta que tu tabla quede iluminada en dorado.");
    return { rows: rows, sections: sections, feedback: { strengths: strengths, improve: improve, next: next } };
  }

  // ───────── arranque
  function start() {
    S = load() || fresh();
    applyOpts();
    renderTop();
    R = S.current;
    if (R && R.q) renderGame(); else renderHome();
    if (R && R.q && R.q.done && R.mode === "donde") newQ();
    if (!S.seenHelp) openHelp();
  }

  StudentSession.init({
    appId: "tabla-periodica-desafio",
    appTitle: "Desafío de la Tabla Periódica",
    subtitle: "Física y Química",
    lang: "es",
    getReport: getReport,
    onReady: start,
    onReset: function () { try { localStorage.removeItem(KEY); } catch (e) { /* nada */ } }
  });
})();
