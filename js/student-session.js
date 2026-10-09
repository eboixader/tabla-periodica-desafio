/*
 * StudentSession · módulo común para las apps del alumnado
 * ---------------------------------------------------------
 * - Pide nombre (sin apellidos) o código + grupo antes de empezar.
 * - Cuenta solo el tiempo de trabajo activo (pestaña visible y sin inactividad).
 * - Guarda el progreso SOLO en el navegador del alumno (localStorage).
 * - Genera un informe PDF con autoevaluación y código de verificación.
 *   Los datos del informe van incrustados en el PDF para que el verificador
 *   del profesor compruebe que no se han modificado.
 *
 * Uso:
 *   StudentSession.init({
 *     appId: "spaceunits", appTitle: "Space Units", subtitle: "Física y Química · 3.º ESO",
 *     lang: "es" | "va",
 *     getReport: () => ({ rows: [[etiqueta, valor]], sections: [{ title, lines: [] }],
 *                         feedback: { strengths: [], improve: [], next: [] } }),
 *     onReady: (student) => {}, onReset: () => {}
 *   });
 * En el HTML: [data-ss="student"], [data-ss="time"], [data-ss="report"] (botón).
 * Requiere jsPDF (window.jspdf) para descargar el PDF.
 */
(function () {
  "use strict";

  // Clave compartida con verificador-informes.html. Si la cambias, cámbiala en los dos.
  var SECRET = "FLORS·SU·k7Q2m9X4vT1pR8zL";
  var IDLE_LIMIT = 120; // segundos sin tocar nada → el tiempo deja de contar

  var I18N = {
    es: {
      loginTitle: "Antes de empezar",
      loginText: "Escribe tu nombre (sin apellidos) o tu código, y tu grupo.",
      name: "Nombre o código",
      namePh: "p. ej. Lucía o A07",
      group: "Grupo",
      groupPh: "p. ej. 3.º B",
      start: "Empezar",
      privacy: "Tu progreso solo se guarda en este navegador. No se envía a ningún sitio.",
      errName: "Escribe tu nombre o código (sin apellidos).",
      errGroup: "Escribe tu grupo.",
      paused: "en pausa",
      reportTitle: "Informe de trabajo",
      reportIntro: "Rellena la autoevaluación y descarga el PDF. Después, adjúntalo en la tarea de Classroom.",
      student: "Alumno/a",
      groupL: "Grupo",
      activeTime: "Tiempo de trabajo activo",
      date: "Fecha",
      summary: "Resumen de la actividad",
      selfEval: "Autoevaluación",
      q1: "¿Qué has aprendido?",
      q2: "¿Qué te ha costado más y por qué?",
      q3: "¿Qué harías diferente la próxima vez o qué dudas te quedan?",
      q4: "¿Cómo valoras tu trabajo?",
      stars: ["Muy poco", "Poco", "Normal", "Bien", "Muy bien"],
      minChars: "Escribe al menos {n} caracteres en las preguntas 1 y 2.",
      needStars: "Elige una valoración de 1 a 5.",
      download: "Descargar informe (PDF)",
      downloaded: "Informe descargado. Adjúntalo en la tarea de Classroom.",
      restart: "Empezar de nuevo",
      restartConfirm: "Se borrará todo tu progreso de este ordenador. ¿Seguro? (Hazlo solo si ya has descargado el informe.)",
      close: "Cerrar",
      feedback: "Valoración automática de lo que has hecho",
      strengths: "Lo que haces bien",
      improve: "Lo que conviene repasar",
      next: "Próximo paso",
      code: "Código de verificación",
      codeNote: "Este código permite al profesor comprobar que el informe no se ha modificado.",
      generated: "Generado el",
      started: "Empezó el",
      noPdf: "No se ha podido cargar el generador de PDF. Comprueba la conexión a internet y recarga la página.",
      page: "Página",
      fileWord: "Informe"
    },
    va: {
      loginTitle: "Abans de començar",
      loginText: "Escriu el teu nom (sense cognoms) o el teu codi, i el teu grup.",
      name: "Nom o codi",
      namePh: "p. ex. Llúcia o A07",
      group: "Grup",
      groupPh: "p. ex. 3r B",
      start: "Començar",
      privacy: "El teu progrés només es guarda en aquest navegador. No s'envia enlloc.",
      errName: "Escriu el teu nom o codi (sense cognoms).",
      errGroup: "Escriu el teu grup.",
      paused: "en pausa",
      reportTitle: "Informe de treball",
      reportIntro: "Emplena l'autoavaluació i descarrega el PDF. Després, adjunta'l a la tasca de Classroom.",
      student: "Alumne/a",
      groupL: "Grup",
      activeTime: "Temps de treball actiu",
      date: "Data",
      summary: "Resum de l'activitat",
      selfEval: "Autoavaluació",
      q1: "Què has aprés?",
      q2: "Què t'ha costat més i per què?",
      q3: "Què faries diferent la pròxima vegada o quins dubtes et queden?",
      q4: "Com valores el teu treball?",
      stars: ["Molt poc", "Poc", "Normal", "Bé", "Molt bé"],
      minChars: "Escriu almenys {n} caràcters en les preguntes 1 i 2.",
      needStars: "Tria una valoració de l'1 al 5.",
      download: "Descarregar informe (PDF)",
      downloaded: "Informe descarregat. Adjunta'l a la tasca de Classroom.",
      restart: "Començar de nou",
      restartConfirm: "S'esborrarà tot el teu progrés d'aquest ordinador. Segur? (Fes-ho només si ja has descarregat l'informe.)",
      close: "Tancar",
      feedback: "Valoració automàtica del que has fet",
      strengths: "El que fas bé",
      improve: "El que convé repassar",
      next: "Pròxim pas",
      code: "Codi de verificació",
      codeNote: "Aquest codi permet al professorat comprovar que l'informe no s'ha modificat.",
      generated: "Generat el",
      started: "Va començar el",
      noPdf: "No s'ha pogut carregar el generador de PDF. Comprova la connexió a internet i recarrega la pàgina.",
      page: "Pàgina",
      fileWord: "Informe"
    }
  };

  var cfg, T, store, key, lastInteraction = Date.now(), tickHandle;

  // ───────────── utilidades
  function el(tag, attrs, html) {
    var e = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) { e.setAttribute(k, attrs[k]); });
    if (html != null) e.innerHTML = html;
    return e;
  }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function save() { try { localStorage.setItem(key, JSON.stringify(store)); } catch (e) { /* sin almacenamiento */ } }
  function load() { try { return JSON.parse(localStorage.getItem(key)); } catch (e) { return null; } }
  function pad(n) { return String(n).padStart(2, "0"); }
  function fmtTime(sec) {
    var h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
    return (h ? h + " h " : "") + m + " min " + pad(s) + " s";
  }
  function fmtClock(sec) {
    var h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
    return (h ? h + ":" + pad(m) : pad(m)) + ":" + pad(s);
  }
  function fmtDate(ts) {
    var d = new Date(ts);
    return pad(d.getDate()) + "/" + pad(d.getMonth() + 1) + "/" + d.getFullYear() + " " + pad(d.getHours()) + ":" + pad(d.getMinutes());
  }

  // SHA-256 (puro JS, funciona también abriendo el archivo sin servidor)
  function sha256(str) {
    var K = [0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070, 0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2];
    var bytes = new TextEncoder().encode(str), l = bytes.length;
    var n = ((l + 9 + 63) >> 6) * 64, m = new Uint8Array(n);
    m.set(bytes); m[l] = 0x80;
    var dv = new DataView(m.buffer);
    dv.setUint32(n - 4, (l * 8) >>> 0); dv.setUint32(n - 8, Math.floor(l / 0x20000000));
    var H = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
    var W = new Uint32Array(64);
    function r(x, k) { return (x >>> k) | (x << (32 - k)); }
    for (var off = 0; off < n; off += 64) {
      for (var t = 0; t < 16; t++) W[t] = dv.getUint32(off + t * 4);
      for (t = 16; t < 64; t++) {
        var s0 = r(W[t - 15], 7) ^ r(W[t - 15], 18) ^ (W[t - 15] >>> 3);
        var s1 = r(W[t - 2], 17) ^ r(W[t - 2], 19) ^ (W[t - 2] >>> 10);
        W[t] = (W[t - 16] + s0 + W[t - 7] + s1) >>> 0;
      }
      var a = H[0], b = H[1], c = H[2], d = H[3], e = H[4], f = H[5], g = H[6], h = H[7];
      for (t = 0; t < 64; t++) {
        var t1 = (h + (r(e, 6) ^ r(e, 11) ^ r(e, 25)) + ((e & f) ^ (~e & g)) + K[t] + W[t]) >>> 0;
        var t2 = ((r(a, 2) ^ r(a, 13) ^ r(a, 22)) + ((a & b) ^ (a & c) ^ (b & c))) >>> 0;
        h = g; g = f; f = e; e = (d + t1) >>> 0; d = c; c = b; b = a; a = (t1 + t2) >>> 0;
      }
      H = [H[0] + a, H[1] + b, H[2] + c, H[3] + d, H[4] + e, H[5] + f, H[6] + g, H[7] + h].map(function (x) { return x >>> 0; });
    }
    return H.map(function (x) { return x.toString(16).padStart(8, "0"); }).join("");
  }
  function makeCode(dataStr) {
    var hex = sha256(SECRET + "|" + dataStr).slice(0, 13);
    var A = "0123456789ABCDEFGHJKMNPQRSTVWXYZ", v = BigInt("0x" + hex) >> 2n, out = "";
    for (var i = 0; i < 10; i++) { out = A[Number(v & 31n)] + out; v >>= 5n; }
    return out.slice(0, 5) + "-" + out.slice(5);
  }
  function b64(str) {
    var bytes = new TextEncoder().encode(str), bin = "";
    for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin);
  }
  // Las fuentes estándar del PDF no tienen todos los superíndices ni emojis.
  function pdfText(s) {
    var sup = { "⁰": "0", "¹": "1", "²": "2", "³": "3", "⁴": "4", "⁵": "5", "⁶": "6", "⁷": "7", "⁸": "8", "⁹": "9", "⁻": "-" };
    return String(s)
      .replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻]+/g, function (run) {
        if (/^[²³]$/.test(run)) return run; // m², m³ sí existen
        return "^" + run.split("").map(function (c) { return sup[c]; }).join("");
      })
      .replace(/−/g, "-").replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/μ/g, "µ")
      .replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{FE0F}]/gu, "")
      .replace(/→/g, "->").replace(/≈/g, "~").replace(/≤/g, "<=").replace(/≥/g, ">=")
      // cualquier otro carácter fuera de WinAnsi haría que jsPDF estropee la línea entera
      .replace(/[^\u0000-ÿ–—‘’“”•…€‰™]/g, "?")
      .replace(/[   ]/g, " ");
  }

  // ───────────── tiempo activo
  function isActive() {
    return !!store && !!store.student && document.visibilityState === "visible" &&
      (Date.now() - lastInteraction) / 1000 < IDLE_LIMIT;
  }
  function tick() {
    if (!store || !store.student) return;
    var active = isActive();
    if (active) { store.activeSec++; if (store.activeSec % 5 === 0) save(); }
    document.querySelectorAll('[data-ss="time"]').forEach(function (n) {
      n.textContent = fmtClock(store.activeSec) + (active ? "" : " · " + T.paused);
      n.classList.toggle("ss-paused", !active);
    });
  }
  function touch() { lastInteraction = Date.now(); }

  // ───────────── pantalla de entrada
  function showLogin() {
    var ov = el("div", { class: "ss-overlay", role: "dialog", "aria-modal": "true", "aria-labelledby": "ss-login-title" });
    ov.innerHTML =
      '<form class="ss-card ss-login" novalidate>' +
      '<div class="ss-app">' + esc(cfg.appTitle) + (cfg.subtitle ? '<small>' + esc(cfg.subtitle) + '</small>' : '') + '</div>' +
      '<h2 id="ss-login-title">' + T.loginTitle + '</h2><p>' + T.loginText + '</p>' +
      '<label>' + T.name + '<input name="name" maxlength="30" autocomplete="off" placeholder="' + esc(T.namePh) + '"></label>' +
      '<label>' + T.group + '<input name="group" maxlength="15" autocomplete="off" placeholder="' + esc(T.groupPh) + '"' + (cfg.groups ? ' list="ss-groups"' : '') + '></label>' +
      (cfg.groups ? '<datalist id="ss-groups">' + cfg.groups.map(function (g) { return '<option value="' + esc(g) + '">'; }).join("") + '</datalist>' : '') +
      '<p class="ss-error" aria-live="polite"></p>' +
      '<button type="submit" class="ss-btn ss-primary">' + T.start + '</button>' +
      '<p class="ss-privacy">🔒 ' + T.privacy + '</p></form>';
    document.body.appendChild(ov);
    var f = ov.querySelector("form");
    f.name.focus();
    f.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var name = f.name.value.trim().replace(/\s+/g, " "), group = f.group.value.trim();
      var err = f.querySelector(".ss-error");
      if (name.length < 2) { err.textContent = T.errName; f.name.focus(); return; }
      if (!group) { err.textContent = T.errGroup; f.group.focus(); return; }
      store = { student: { name: name, group: group }, startedAt: Date.now(), activeSec: 0, loads: 1, selfEval: { q1: "", q2: "", q3: "", stars: 0 } };
      save();
      ov.remove();
      ready();
    });
  }

  function ready() {
    document.querySelectorAll('[data-ss="student"]').forEach(function (n) {
      n.textContent = store.student.name + " · " + store.student.group;
    });
    document.querySelectorAll('[data-ss="report"]').forEach(function (b) {
      b.addEventListener("click", openReport);
    });
    tick();
    if (cfg.onReady) cfg.onReady(store.student);
  }

  // ───────────── informe
  function openReport() {
    if (!store) return;
    var rep = cfg.getReport();
    var se = store.selfEval;
    var ov = el("div", { class: "ss-overlay", role: "dialog", "aria-modal": "true", "aria-labelledby": "ss-rep-title" });
    var rows = [[T.student, store.student.name], [T.groupL, store.student.group], [T.activeTime, fmtTime(store.activeSec)]].concat(rep.rows);
    var fb = rep.feedback || {};
    function list(title, arr, cls) {
      return arr && arr.length ? '<h4 class="' + cls + '">' + title + '</h4><ul>' + arr.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul>" : "";
    }
    ov.innerHTML =
      '<div class="ss-card ss-report">' +
      '<button class="ss-x" aria-label="' + T.close + '">✕</button>' +
      '<h2 id="ss-rep-title">📄 ' + T.reportTitle + '</h2><p class="ss-muted">' + T.reportIntro + '</p>' +
      '<h3>' + T.summary + '</h3><table class="ss-table">' + rows.map(function (r) { return "<tr><th>" + esc(r[0]) + "</th><td>" + esc(r[1]) + "</td></tr>"; }).join("") + '</table>' +
      '<div class="ss-feedback"><h3>' + T.feedback + '</h3>' + list("✅ " + T.strengths, fb.strengths, "ok") + list("🔧 " + T.improve, fb.improve, "ko") + list("🎯 " + T.next, fb.next, "nx") + '</div>' +
      '<h3>' + T.selfEval + '</h3>' +
      '<label>1. ' + T.q1 + '<textarea name="q1" rows="3" maxlength="600">' + esc(se.q1) + '</textarea></label>' +
      '<label>2. ' + T.q2 + '<textarea name="q2" rows="3" maxlength="600">' + esc(se.q2) + '</textarea></label>' +
      '<label>3. ' + T.q3 + '<textarea name="q3" rows="2" maxlength="600">' + esc(se.q3) + '</textarea></label>' +
      '<fieldset class="ss-stars"><legend>4. ' + T.q4 + '</legend>' + T.stars.map(function (lab, i) {
        return '<label><input type="radio" name="stars" value="' + (i + 1) + '"' + (se.stars === i + 1 ? " checked" : "") + '><span>' + "★".repeat(i + 1) + '</span><small>' + lab + '</small></label>';
      }).join("") + '</fieldset>' +
      '<p class="ss-error" aria-live="polite"></p>' +
      '<div class="ss-actions"><button class="ss-btn ss-primary ss-dl">⬇ ' + T.download + '</button></div>' +
      '<div class="ss-after" hidden><p class="ss-okmsg">✅ ' + T.downloaded + '</p>' +
      '<button class="ss-btn ss-danger ss-restart">↺ ' + T.restart + '</button></div>' +
      '</div>';
    document.body.appendChild(ov);
    var card = ov.querySelector(".ss-card");
    function close() { ov.remove(); }
    ov.querySelector(".ss-x").onclick = close;
    ov.addEventListener("click", function (e) { if (e.target === ov) close(); });
    document.addEventListener("keydown", function k(e) { if (e.key === "Escape") { close(); document.removeEventListener("keydown", k); } });
    card.querySelectorAll("textarea, input[type=radio]").forEach(function (inp) {
      inp.addEventListener("input", function () {
        se.q1 = card.querySelector("[name=q1]").value; se.q2 = card.querySelector("[name=q2]").value; se.q3 = card.querySelector("[name=q3]").value;
        var st = card.querySelector("[name=stars]:checked"); se.stars = st ? +st.value : 0;
        save();
      });
    });
    card.querySelector(".ss-dl").onclick = function () {
      var err = card.querySelector(".ss-error"), MIN = 15;
      if (se.q1.trim().length < MIN || se.q2.trim().length < MIN) { err.textContent = T.minChars.replace("{n}", MIN); return; }
      if (!se.stars) { err.textContent = T.needStars; return; }
      err.textContent = "";
      if (!window.jspdf) { err.textContent = T.noPdf; return; }
      buildPdf(cfg.getReport());
      card.querySelector(".ss-after").hidden = false;
    };
    card.querySelector(".ss-restart").onclick = function () {
      if (!confirm(T.restartConfirm)) return;
      reset();
    };
    card.querySelector("textarea").focus();
  }

  function buildPdf(rep) {
    var now = Date.now(), se = store.selfEval, fb = rep.feedback || {};
    // Datos que se firman (y se incrustan en el PDF para el verificador)
    var data = {
      v: 1, app: cfg.appId, title: cfg.appTitle,
      name: store.student.name, group: store.student.group,
      started: store.startedAt, generated: now, activeSec: store.activeSec, loads: store.loads,
      rows: rep.rows,
      self: { q1: se.q1.trim(), q2: se.q2.trim(), q3: se.q3.trim(), stars: se.stars }
    };
    var dataStr = JSON.stringify(data), code = makeCode(dataStr);

    var doc = new window.jspdf.jsPDF({ unit: "mm", format: "a4" });
    var W = 210, M = 16, y = 0, CW = W - 2 * M;
    doc.setProperties({ title: T.reportTitle + " · " + cfg.appTitle, subject: cfg.appId, author: store.student.name + " (" + store.student.group + ")", keywords: "SSRPT:" + b64(JSON.stringify({ d: dataStr, c: code })), creator: "StudentSession" });

    function newPageIfNeeded(h) { if (y + h > 280) { doc.addPage(); y = 18; } }
    function heading(txt) {
      newPageIfNeeded(14); y += 4;
      doc.setFont("helvetica", "bold"); doc.setFontSize(12.5); doc.setTextColor(20, 40, 90);
      doc.text(pdfText(txt), M, y); y += 2;
      doc.setDrawColor(90, 120, 220); doc.setLineWidth(0.4); doc.line(M, y, W - M, y); y += 5;
    }
    function para(txt, opts) {
      opts = opts || {};
      doc.setFont("helvetica", opts.bold ? "bold" : (opts.italic ? "italic" : "normal")); doc.setFontSize(opts.size || 10.5);
      doc.setTextColor.apply(doc, opts.color || [30, 30, 40]);
      var lines = doc.splitTextToSize(pdfText(txt), CW - (opts.indent || 0));
      lines.forEach(function (ln) { newPageIfNeeded(5.2); doc.text(ln, M + (opts.indent || 0), y); y += 5.2; });
    }
    function bullets(arr, color) {
      (arr || []).forEach(function (t) {
        doc.setFont("helvetica", "normal"); doc.setFontSize(10.5);
        var lines = doc.splitTextToSize(pdfText(t), CW - 6);
        lines.forEach(function (ln, i) {
          newPageIfNeeded(5.2);
          if (i === 0) { doc.setFillColor.apply(doc, color); doc.circle(M + 1.6, y - 1.3, 0.9, "F"); }
          doc.setTextColor(30, 30, 40); doc.text(ln, M + 5, y); y += 5.2;
        });
      });
    }

    // Cabecera
    doc.setFillColor(14, 22, 58); doc.rect(0, 0, W, 34, "F");
    doc.setFillColor(76, 201, 240); doc.rect(0, 34, W, 1.2, "F");
    doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.setFontSize(19);
    doc.text(pdfText(T.reportTitle), M, 15);
    doc.setFont("helvetica", "normal"); doc.setFontSize(11);
    doc.text(pdfText(cfg.appTitle + (cfg.subtitle ? " · " + cfg.subtitle : "")), M, 23);
    doc.setFontSize(9); doc.setTextColor(180, 200, 255);
    doc.text(pdfText(T.generated + " " + fmtDate(now)), M, 29.5);
    doc.setFont("courier", "bold"); doc.setFontSize(12); doc.setTextColor(255, 209, 102);
    doc.text(code, W - M, 15, { align: "right" });
    doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(180, 200, 255);
    doc.text(pdfText(T.code), W - M, 20, { align: "right" });
    y = 44;

    // Datos del alumno
    var box = [[T.student, store.student.name], [T.groupL, store.student.group], [T.activeTime, fmtTime(store.activeSec)], [T.started, fmtDate(store.startedAt)]];
    doc.setFillColor(238, 243, 255); doc.roundedRect(M, y - 5, CW, 24, 2, 2, "F");
    box.forEach(function (b, i) {
      var x = M + 4 + (i % 2) * (CW / 2), yy = y + Math.floor(i / 2) * 10;
      doc.setFont("helvetica", "normal"); doc.setFontSize(8.5); doc.setTextColor(90, 100, 130); doc.text(pdfText(b[0]), x, yy);
      doc.setFont("helvetica", "bold"); doc.setFontSize(11.5); doc.setTextColor(20, 30, 60); doc.text(pdfText(b[1]), x, yy + 5);
    });
    y += 25;

    heading(T.summary);
    rep.rows.forEach(function (r) {
      doc.setFont("helvetica", "normal"); doc.setFontSize(10.5); doc.setTextColor(80, 90, 110);
      var valLines = doc.splitTextToSize(pdfText(r[1]), CW - 72);
      newPageIfNeeded(5.5 * valLines.length);
      doc.text(pdfText(r[0]), M, y);
      doc.setFont("helvetica", "bold"); doc.setTextColor(20, 30, 60);
      valLines.forEach(function (ln, i) { doc.text(ln, M + 72, y + i * 5.2); });
      y += 5.6 * valLines.length;
    });
    (rep.sections || []).forEach(function (s) {
      heading(s.title);
      s.lines.forEach(function (l) { para(l); });
    });

    heading(T.feedback);
    if (fb.strengths && fb.strengths.length) { newPageIfNeeded(11); para(T.strengths, { bold: true, color: [20, 120, 80] }); bullets(fb.strengths, [40, 170, 110]); y += 1.5; }
    if (fb.improve && fb.improve.length) { newPageIfNeeded(11); para(T.improve, { bold: true, color: [190, 70, 40] }); bullets(fb.improve, [220, 100, 60]); y += 1.5; }
    if (fb.next && fb.next.length) { newPageIfNeeded(11); para(T.next, { bold: true, color: [40, 70, 170] }); bullets(fb.next, [70, 100, 220]); }

    heading(T.selfEval);
    [[T.q1, se.q1], [T.q2, se.q2], [T.q3, se.q3]].forEach(function (q, i) {
      newPageIfNeeded(11); para((i + 1) + ". " + q[0], { bold: true, color: [40, 50, 90] });
      para(q[1].trim() || "—", { indent: 4 }); y += 1.5;
    });
    para("4. " + T.q4 + "  " + se.stars + "/5 (" + T.stars[se.stars - 1] + ")", { bold: true, color: [40, 50, 90] });

    // Pie con código en todas las páginas
    var pages = doc.getNumberOfPages();
    for (var p = 1; p <= pages; p++) {
      doc.setPage(p);
      doc.setDrawColor(200, 205, 220); doc.setLineWidth(0.2); doc.line(M, 286, W - M, 286);
      doc.setFont("helvetica", "normal"); doc.setFontSize(7.5); doc.setTextColor(120, 125, 140);
      doc.text(pdfText(T.code + ": " + code + " · " + T.codeNote), M, 290);
      doc.text(T.page + " " + p + "/" + pages, W - M, 290, { align: "right" });
    }

    var safe = function (s) { return s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^A-Za-z0-9]+/g, "_").replace(/^_|_$/g, ""); };
    var d = new Date(now);
    doc.save(T.fileWord + "_" + safe(cfg.appTitle) + "_" + safe(store.student.name) + "_" + safe(store.student.group) + "_" + d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + ".pdf");
  }

  function reset() {
    try { localStorage.removeItem(key); } catch (e) { /* nada */ }
    if (cfg.onReset) cfg.onReset();
    location.reload();
  }

  // ───────────── API
  window.StudentSession = {
    init: function (c) {
      cfg = c; T = I18N[c.lang] || I18N.es; key = "ss:" + c.appId;
      ["pointerdown", "keydown", "wheel", "touchstart"].forEach(function (ev) { window.addEventListener(ev, touch, { passive: true }); });
      window.addEventListener("pointermove", function () { if (Date.now() - lastInteraction > 1000) touch(); }, { passive: true });
      document.addEventListener("visibilitychange", function () { if (document.visibilityState === "visible") touch(); save(); });
      window.addEventListener("beforeunload", save);
      store = load();
      if (store && store.student) { store.loads = (store.loads || 1) + 1; save(); ready(); }
      else showLogin();
      tickHandle = setInterval(tick, 1000);
    },
    isActive: isActive,
    // Para actividad que la página no puede ver (p. ej. leer dentro de un iframe)
    touch: touch,
    getStudent: function () { return store && store.student; },
    activeSeconds: function () { return store ? store.activeSec : 0; },
    openReport: openReport,
    reset: reset,
    formatTime: fmtTime
  };
})();
