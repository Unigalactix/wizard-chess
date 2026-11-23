/* Colour Chess — UI v2: action-figure pieces with faces, player-POV board.
   Pieces are original SVG characters. Expressions are driven by data-expr
   on each figure and styled in CSS: idle, determined, focused, angry,
   scared, worried, happy, dizzy. */
(function () {
  'use strict';
  var E = window.ChessEngine;
  var GLYPH = { K: '♚', Q: '♛', R: '♜', B: '♝', N: '♞', P: '♟' };
  var VAL = { P: 1, N: 3, B: 3, R: 5, Q: 9, K: 0 };
  var START_COUNT = { P: 8, N: 2, B: 2, R: 2, Q: 1, K: 1 };
  var TILT = 'rotateX(-55deg)';

  var PAL = {
    w: { main: '#f7b733', dark: '#b45309', cloth: '#e0342b', accent: '#ffe082', skin: '#ffcf9f', hair: '#8d3b12', beard: '#f7ead7' },
    b: { main: '#4fc3f7', dark: '#3730a3', cloth: '#7c4dff', accent: '#a5f3fc', skin: '#ffd9ae', hair: '#232055', beard: '#dbe7ff' }
  };

  /* ---------- shared face: parts shown/hidden by expression (see style.css) ---------- */
  function face(cx, cy, s) {
    return '<g class="face" transform="translate(' + cx + ',' + cy + ') scale(' + s + ')">' +
      '<path class="brow brow-l" d="M-15.5,-10.5 L-5.5,-10.5" stroke="#3a2c22" stroke-width="2.6" stroke-linecap="round"/>' +
      '<path class="brow brow-r" d="M5.5,-10.5 L15.5,-10.5" stroke="#3a2c22" stroke-width="2.6" stroke-linecap="round"/>' +
      '<ellipse class="eye" cx="-10.5" cy="0" rx="2.7" ry="3.5" fill="#26202e"/>' +
      '<ellipse class="eye" cx="10.5" cy="0" rx="2.7" ry="3.5" fill="#26202e"/>' +
      '<path class="eye-happy" d="M-14.5,1 Q-10.5,-5.5 -6.5,1" fill="none" stroke="#26202e" stroke-width="2.4" stroke-linecap="round"/>' +
      '<path class="eye-happy" d="M6.5,1 Q10.5,-5.5 14.5,1" fill="none" stroke="#26202e" stroke-width="2.4" stroke-linecap="round"/>' +
      '<g class="eye-x" stroke="#26202e" stroke-width="2.2" stroke-linecap="round">' +
        '<path d="M-13.5,-3 L-7.5,3 M-7.5,-3 L-13.5,3"/>' +
        '<path d="M7.5,-3 L13.5,3 M13.5,-3 L7.5,3"/></g>' +
      '<path class="mouth-calm" d="M-4.5,8 Q0,11.5 4.5,8" fill="none" stroke="#7c3f21" stroke-width="1.9" stroke-linecap="round"/>' +
      '<path class="mouth-flat" d="M-4,9.5 L4,9.5" stroke="#7c3f21" stroke-width="1.9" stroke-linecap="round"/>' +
      '<ellipse class="mouth-shout" cx="0" cy="10.5" rx="3.8" ry="4.8" fill="#7c2d12"/>' +
      '<circle class="mouth-o" cx="0" cy="10" r="2.9" fill="#7c2d12"/>' +
      '<path class="mouth-grin" d="M-6.5,7 Q0,15.5 6.5,7 Q0,10.5 -6.5,7 Z" fill="#7c2d12"/>' +
      '<path class="mouth-wavy" d="M-5.5,10.5 q2.7,-3.2 5.5,0 q2.7,3.2 5.5,0" fill="none" stroke="#7c3f21" stroke-width="1.9" stroke-linecap="round"/>' +
      '<path class="sweat" d="M19,-7 C22.5,-1 23.5,1.5 23.5,3.8 A4.3,4.3 0 1 1 14.5,3.8 C14.5,1.5 15.5,-1 19,-7 Z" fill="#7dd3fc" stroke="#0284c7" stroke-width="0.7"/>' +
      '</g>';
  }
  function boots(P, y) {
    return '<rect x="39" y="' + y + '" width="9" height="13" fill="' + P.dark + '"/><rect x="52" y="' + y + '" width="9" height="13" fill="' + P.dark + '"/>' +
      '<rect x="37" y="' + (y + 12) + '" width="12" height="5.5" rx="2" fill="#4e342e"/><rect x="51" y="' + (y + 12) + '" width="12" height="5.5" rx="2" fill="#4e342e"/>';
  }

  var CHAR = {
    P: function (P) { return '<svg viewBox="0 0 100 150">' +
      '<line x1="84" y1="36" x2="84" y2="140" stroke="#8d6e63" stroke-width="3.5"/>' +
      '<path d="M84 15 L90.5 35 L77.5 35 Z" fill="#cfd8dc" stroke="#90a4ae" stroke-width="1.4"/>' +
      boots(P, 126) +
      '<path d="M33 96 Q50 88 67 96 L69 128 Q50 134 31 128 Z" fill="' + P.cloth + '"/>' +
      '<rect x="31" y="111" width="38" height="6" fill="' + P.dark + '"/>' +
      '<path d="M33 99 Q23 111 27 123" fill="none" stroke="' + P.cloth + '" stroke-width="7" stroke-linecap="round"/>' +
      '<path d="M67 99 Q79 107 83 117" fill="none" stroke="' + P.cloth + '" stroke-width="7" stroke-linecap="round"/>' +
      '<circle cx="50" cy="72" r="16.5" fill="' + P.skin + '"/>' +
      '<path d="M30.5 68 A19.5 19.5 0 0 1 69.5 68 L69.5 71.5 L30.5 71.5 Z" fill="' + P.main + '" stroke="' + P.dark + '" stroke-width="1.6"/>' +
      '<rect x="27.5" y="69.5" width="45" height="4.6" rx="2.3" fill="' + P.dark + '"/>' +
      '<circle cx="50" cy="46.5" r="3.6" fill="' + P.accent + '"/>' +
      face(50, 74, 0.92) + '</svg>'; },
    N: function (P) { return '<svg viewBox="0 0 100 150">' +
      '<path d="M63 42 Q80 58 76 98 Q70 108 65 97 Q72 64 63 42 Z" fill="' + P.hair + '"/>' +
      '<line x1="76" y1="106" x2="90" y2="82" stroke="#cfd8dc" stroke-width="4.4" stroke-linecap="round"/>' +
      '<rect x="71" y="102" width="10" height="4.4" rx="2" transform="rotate(-52 76 104)" fill="' + P.dark + '"/>' +
      boots(P, 126) +
      '<path d="M33 92 Q50 85 67 92 L68 126 Q50 131 32 126 Z" fill="' + P.main + '" stroke="' + P.dark + '" stroke-width="1.6"/>' +
      '<circle cx="50" cy="106" r="6.4" fill="' + P.accent + '"/>' +
      '<rect x="32" y="118" width="36" height="5.4" fill="' + P.dark + '"/>' +
      '<path d="M13 90 Q25 85 31 90 L31 120 Q22 129 13 120 Z" fill="' + P.cloth + '" stroke="' + P.dark + '" stroke-width="1.6"/>' +
      '<path d="M22 94 v22 M15.5 105 h13" stroke="' + P.accent + '" stroke-width="2.6"/>' +
      '<circle cx="50" cy="68" r="16" fill="' + P.skin + '"/>' +
      '<path d="M38 51 L34.5 35 L46 44.5 Z" fill="' + P.main + '" stroke="' + P.dark + '" stroke-width="1.5"/>' +
      '<path d="M62 51 L65.5 35 L54 44.5 Z" fill="' + P.main + '" stroke="' + P.dark + '" stroke-width="1.5"/>' +
      '<path d="M31.5 64 A18.5 18.5 0 0 1 68.5 64 L68.5 67.5 L31.5 67.5 Z" fill="' + P.main + '" stroke="' + P.dark + '" stroke-width="1.6"/>' +
      '<rect x="46.8" y="33" width="6.4" height="17" fill="' + P.accent + '"/>' +
      face(50, 70, 0.92) + '</svg>'; },
    B: function (P) { return '<svg viewBox="0 0 100 150">' +
      '<line x1="86" y1="34" x2="86" y2="140" stroke="#8d6e63" stroke-width="3.5"/>' +
      '<path d="M86 34 A8.5 8.5 0 1 1 77.5 25.5" fill="none" stroke="' + P.accent + '" stroke-width="3.6" stroke-linecap="round"/>' +
      '<path d="M50 84 L73 138 Q50 146 27 138 Z" fill="' + P.cloth + '"/>' +
      '<path d="M50 93 L60.5 139.5 L39.5 139.5 Z" fill="' + P.accent + '" opacity="0.35"/>' +
      '<path d="M37 99 Q27 111 31 123" fill="none" stroke="' + P.cloth + '" stroke-width="8" stroke-linecap="round"/>' +
      '<path d="M63 99 Q76 107 81 116" fill="none" stroke="' + P.cloth + '" stroke-width="8" stroke-linecap="round"/>' +
      '<circle cx="50" cy="76" r="15.5" fill="' + P.skin + '"/>' +
      '<path d="M34 68 Q36.5 33 50 25 Q63.5 33 66 68 Q50 59.5 34 68 Z" fill="' + P.main + '" stroke="' + P.dark + '" stroke-width="1.6"/>' +
      '<rect x="34.8" y="59" width="30.4" height="6" fill="' + P.accent + '"/>' +
      '<path d="M50 35 v13 M43.5 41.5 h13" stroke="' + P.cloth + '" stroke-width="2.6" stroke-linecap="round"/>' +
      face(50, 78, 0.88) + '</svg>'; },
    R: function (P) { return '<svg viewBox="0 0 100 150">' +
      '<rect x="40" y="138" width="8" height="7" fill="' + P.dark + '"/><rect x="52" y="138" width="8" height="7" fill="' + P.dark + '"/>' +
      '<path d="M30 95 Q17 103 21 117" fill="none" stroke="' + P.main + '" stroke-width="7.5" stroke-linecap="round"/>' +
      '<path d="M70 95 Q83 103 79 117" fill="none" stroke="' + P.main + '" stroke-width="7.5" stroke-linecap="round"/>' +
      '<rect x="25" y="131" width="50" height="9" rx="2.5" fill="' + P.dark + '"/>' +
      '<rect x="30" y="57" width="40" height="76" rx="4" fill="' + P.main + '" stroke="' + P.dark + '" stroke-width="1.8"/>' +
      '<path d="M30 84 h40 M30 110 h40" stroke="' + P.dark + '" stroke-width="1.8" opacity="0.35"/>' +
      '<rect x="30" y="44" width="9.5" height="14" fill="' + P.main + '" stroke="' + P.dark + '" stroke-width="1.6"/>' +
      '<rect x="45.2" y="44" width="9.5" height="14" fill="' + P.main + '" stroke="' + P.dark + '" stroke-width="1.6"/>' +
      '<rect x="60.5" y="44" width="9.5" height="14" fill="' + P.main + '" stroke="' + P.dark + '" stroke-width="1.6"/>' +
      '<rect x="28" y="56" width="44" height="6" fill="' + P.dark + '"/>' +
      '<path d="M40 68 Q50 60.5 60 68 L60 76 L40 76 Z" fill="' + P.dark + '" opacity="0.28"/>' +
      face(50, 95, 1.06) + '</svg>'; },
    Q: function (P) { return '<svg viewBox="0 0 100 150">' +
      '<path d="M50 87 L77 139 Q50 147 23 139 Z" fill="' + P.cloth + '"/>' +
      '<path d="M50 95 L64.5 140.5 L35.5 140.5 Z" fill="' + P.main + '" opacity="0.5"/>' +
      '<path d="M35 107 Q50 113.5 65 107" fill="none" stroke="' + P.accent + '" stroke-width="4"/>' +
      '<circle cx="36.5" cy="96" r="6.4" fill="' + P.cloth + '"/><circle cx="63.5" cy="96" r="6.4" fill="' + P.cloth + '"/>' +
      '<path d="M37 99 Q26 108 30.5 120" fill="none" stroke="' + P.skin + '" stroke-width="6.4" stroke-linecap="round"/>' +
      '<path d="M63 99 Q74 108 69.5 120" fill="none" stroke="' + P.skin + '" stroke-width="6.4" stroke-linecap="round"/>' +
      '<circle cx="50" cy="65" r="17.6" fill="' + P.hair + '"/>' +
      '<circle cx="50" cy="68" r="15.5" fill="' + P.skin + '"/>' +
      '<path d="M35.5 60 Q31 82 37 95 L43.5 91 Q39 73 41 60 Z" fill="' + P.hair + '"/>' +
      '<path d="M64.5 60 Q69 82 63 95 L56.5 91 Q61 73 59 60 Z" fill="' + P.hair + '"/>' +
      '<path d="M41.5 87.5 Q50 94 58.5 87.5" fill="none" stroke="' + P.accent + '" stroke-width="2.5"/>' +
      '<circle cx="50" cy="93" r="2.9" fill="' + P.accent + '"/>' +
      '<path d="M33.5 52 L37.5 35 L45.5 45.5 L50 31 L54.5 45.5 L62.5 35 L66.5 52 Z" fill="' + P.main + '" stroke="' + P.dark + '" stroke-width="1.6"/>' +
      '<circle cx="37.5" cy="47" r="2.4" fill="' + P.cloth + '"/><circle cx="50" cy="43" r="2.4" fill="' + P.cloth + '"/><circle cx="62.5" cy="47" r="2.4" fill="' + P.cloth + '"/>' +
      face(50, 70, 0.88) + '</svg>'; },
    K: function (P) { return '<svg viewBox="0 0 100 150">' +
      '<line x1="84" y1="58" x2="84" y2="138" stroke="#8d6e63" stroke-width="3.5"/>' +
      '<circle cx="84" cy="48" r="7.2" fill="' + P.main + '" stroke="' + P.dark + '" stroke-width="1.6"/>' +
      '<path d="M84 34.5 v8 M80 38.5 h8" stroke="' + P.dark + '" stroke-width="2.2" stroke-linecap="round"/>' +
      '<path d="M50 85 L75 139 Q50 147 25 139 Z" fill="' + P.cloth + '"/>' +
      '<path d="M35.5 87 Q50 97.5 64.5 87 L64.5 95.5 Q50 105 35.5 95.5 Z" fill="#fff6e8"/>' +
      '<path d="M37 97 Q27 107 31 119" fill="none" stroke="' + P.cloth + '" stroke-width="7.5" stroke-linecap="round"/>' +
      '<path d="M63 97 Q76 99.5 82.5 107" fill="none" stroke="' + P.cloth + '" stroke-width="7.5" stroke-linecap="round"/>' +
      '<circle cx="50" cy="68" r="16" fill="' + P.skin + '"/>' +
      '<path d="M34.5 75 Q36.5 105 50 110.5 Q63.5 105 65.5 75 Q59 82.5 50 82.5 Q41 82.5 34.5 75 Z" fill="' + P.beard + '"/>' +
      '<path d="M32.5 50 L35.8 29 L45 41.5 L50 23 L55 41.5 L64.2 29 L67.5 50 Z" fill="' + P.main + '" stroke="' + P.dark + '" stroke-width="1.6"/>' +
      '<path d="M50 10.5 v10 M45.2 15.5 h9.6" stroke="' + P.dark + '" stroke-width="2.4" stroke-linecap="round"/>' +
      '<rect x="32.5" y="49.5" width="35" height="5.2" fill="' + P.accent + '"/>' +
      face(50, 69, 0.9) + '</svg>'; }
  };

  /* ---------------- DOM refs & state ---------------- */
  var boardEl = document.getElementById('board');
  var statusEl = document.getElementById('status');
  var movesEl = document.getElementById('moves');
  var trayTop = document.getElementById('tray-top');
  var trayBottom = document.getElementById('tray-bottom');
  var modeEl = document.getElementById('mode');
  var sideEl = document.getElementById('side');
  var diffEl = document.getElementById('difficulty');
  var speedEl = document.getElementById('speed');
  var soundEl = document.getElementById('sound');

  var game = new E.Game();
  var flipped = false;
  var selected = -1;
  var legalCache = [];
  var targets = [];
  var animating = false;
  var sanHistory = [];
  var gameOver = false;

  function humanColor() { return modeEl.value === 'cpu' ? sideEl.value : null; }
  function stepMs() { return parseInt(speedEl.value, 10); }
  function isHumanTurn() { return modeEl.value !== 'cpu' || game.turn === humanColor(); }

  /* ---------------- sounds ---------------- */
  var actx = null;
  function beep(freq, dur, type, vol, when) {
    if (!soundEl.checked) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      var t = actx.currentTime + (when || 0);
      var o = actx.createOscillator(), g = actx.createGain();
      o.type = type || 'sine'; o.frequency.value = freq;
      g.gain.setValueAtTime(vol || 0.06, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(actx.destination);
      o.start(t); o.stop(t + dur);
    } catch (e) { /* no audio */ }
  }
  function thud() {
    if (!soundEl.checked) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      var t = actx.currentTime, len = actx.sampleRate * 0.18;
      var buf = actx.createBuffer(1, len, actx.sampleRate);
      var d = buf.getChannelData(0);
      for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
      var src = actx.createBufferSource(); src.buffer = buf;
      var f = actx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 420;
      var g = actx.createGain(); g.gain.value = 0.25;
      src.connect(f); f.connect(g); g.connect(actx.destination); src.start(t);
      beep(90, 0.16, 'sine', 0.12);
    } catch (e) { /* no audio */ }
  }
  var sfx = {
    step: function () { beep(170 + Math.random() * 60, 0.05, 'triangle', 0.025); },
    land: function () { beep(240, 0.07, 'triangle', 0.05); },
    select: function () { beep(520, 0.05, 'sine', 0.03); },
    capture: function () { thud(); beep(140, 0.2, 'sawtooth', 0.05, 0.02); },
    check: function () { beep(880, 0.12, 'sine', 0.06); beep(1174, 0.16, 'sine', 0.06, 0.1); },
    castle: function () { beep(392, 0.09, 'triangle', 0.05); beep(523, 0.11, 'triangle', 0.05, 0.08); },
    promote: function () { [523, 659, 784, 1046].forEach(function (fr, i) { beep(fr, 0.12, 'sine', 0.05, i * 0.07); }); },
    end: function () { [392, 523, 659].forEach(function (fr, i) { beep(fr, 0.22, 'sine', 0.06, i * 0.13); }); }
  };

  /* ---------------- geometry ---------------- */
  function dispF(f) { return flipped ? 7 - f : f; }
  function dispR(r) { return flipped ? r : 7 - r; }
  function posStyle(sq) {
    return { left: (dispF(E.fileOf(sq)) * 12.5) + '%', top: (dispR(E.rankOf(sq)) * 12.5) + '%' };
  }

  var squareEls = [];
  function renderSquares() {
    boardEl.querySelectorAll('.square').forEach(function (n) { n.remove(); });
    squareEls = [];
    for (var sq = 0; sq < 64; sq++) {
      var f = E.fileOf(sq), r = E.rankOf(sq);
      var d = document.createElement('div');
      d.className = 'square ' + (((f + r) % 2 === 0) ? 'dark' + (r % 2 ? ' ocean' : '') : 'light');
      var ps = posStyle(sq);
      d.style.left = ps.left; d.style.top = ps.top;
      d.dataset.sq = sq;
      if (dispF(f) === 0) {
        var c1 = document.createElement('span'); c1.className = 'coord'; c1.style.left = '0'; c1.style.top = '0';
        c1.textContent = r + 1; d.appendChild(c1);
      }
      if (dispR(r) === 7) {
        var c2 = document.createElement('span'); c2.className = 'coord'; c2.style.right = '0'; c2.style.bottom = '0';
        c2.textContent = 'abcdefgh'[f]; d.appendChild(c2);
      }
      boardEl.appendChild(d);
      squareEls[sq] = d;
    }
  }

  var pieceEls = {};
  function makePieceEl(p, sq) {
    var el = document.createElement('div');
    el.className = 'piece idle';
    el.dataset.sq = sq;
    el.innerHTML = '<div class="shadow"></div><div class="figure" data-expr="idle">' + CHAR[p.toUpperCase()](PAL[E.colorOf(p)]) + '</div>';
    el._figure = el.querySelector('.figure');
    return el;
  }
  function setExpr(el, expr) { if (el && el._figure) el._figure.dataset.expr = expr; }
  function renderPieces() {
    Object.keys(pieceEls).forEach(function (k) { pieceEls[k].remove(); });
    pieceEls = {};
    for (var sq = 0; sq < 64; sq++) {
      var p = game.board[sq];
      if (!p) continue;
      var el = makePieceEl(p, sq);
      var ps = posStyle(sq);
      el.style.left = ps.left; el.style.top = ps.top;
      el.style.zIndex = 10 + dispR(E.rankOf(sq));
      boardEl.appendChild(el);
      pieceEls[sq] = el;
    }
    applyMood();
  }

  function applyMood() {
    var st = game.status();
    Object.keys(pieceEls).forEach(function (k) {
      var el = pieceEls[k];
      el.classList.remove('celebrate');
      setExpr(el, 'idle');
    });
    if (st.over) {
      var winner = st.result === '1-0' ? 'w' : st.result === '0-1' ? 'b' : null;
      Object.keys(pieceEls).forEach(function (k) {
        var el = pieceEls[k], c = E.colorOf(game.board[k]);
        if (winner && c === winner) { setExpr(el, 'happy'); el.classList.add('celebrate'); }
        else if (winner) setExpr(el, 'dizzy');
      });
    } else if (st.check) {
      var ksq = game.kingSq(game.turn);
      if (pieceEls[ksq]) setExpr(pieceEls[ksq], 'worried');
    }
  }

  function clearMarks() {
    squareEls.forEach(function (d) {
      d.classList.remove('selected', 'last', 'check');
      d.querySelectorAll('.dot,.ring').forEach(function (n) { n.remove(); });
    });
  }
  function markSquares() {
    clearMarks();
    var hist = game.history;
    if (hist.length) {
      var last = hist[hist.length - 1].move;
      squareEls[last.from].classList.add('last');
      squareEls[last.to].classList.add('last');
    }
    if (selected >= 0) {
      squareEls[selected].classList.add('selected');
      targets.forEach(function (m) {
        var marker = document.createElement('div');
        marker.className = m.captured ? 'ring' : 'dot';
        squareEls[m.to].appendChild(marker);
      });
    }
    var st = game.status();
    if (st.check || (st.over && st.reason === 'checkmate')) {
      var ksq = game.kingSq(game.turn);
      if (ksq >= 0) squareEls[ksq].classList.add('check');
    }
  }

  function renderTrays() {
    var counts = { w: { P: 0, N: 0, B: 0, R: 0, Q: 0 }, b: { P: 0, N: 0, B: 0, R: 0, Q: 0 } };
    game.board.forEach(function (p) {
      if (p && p.toUpperCase() !== 'K') counts[E.colorOf(p)][p.toUpperCase()]++;
    });
    function trayFor(capturedColor) {
      var html = '', pts = 0;
      ['Q', 'R', 'B', 'N', 'P'].forEach(function (t) {
        var missing = START_COUNT[t] - counts[capturedColor][t];
        for (var i = 0; i < missing; i++) {
          html += '<span class="cap-' + (capturedColor === 'w' ? 'sun' : 'moon') + '">' + GLYPH[t] + '</span>';
          pts += VAL[t];
        }
      });
      return { html: html, pts: pts };
    }
    var sunCaps = trayFor('b'), moonCaps = trayFor('w');
    var topTray = flipped ? sunCaps : moonCaps;
    var botTray = flipped ? moonCaps : sunCaps;
    trayTop.innerHTML = topTray.html + (topTray.pts > botTray.pts ? '<span class="diff">+' + (topTray.pts - botTray.pts) + '</span>' : '');
    trayBottom.innerHTML = botTray.html + (botTray.pts > topTray.pts ? '<span class="diff">+' + (botTray.pts - topTray.pts) + '</span>' : '');
  }

  function renderStatus() {
    var st = game.status();
    gameOver = st.over;
    if (st.over) {
      var txt = st.result === '1-0' ? 'Sun wins' : st.result === '0-1' ? 'Moon wins' : 'Draw';
      statusEl.textContent = txt + ' — ' + st.reason + '!';
      statusEl.classList.add('over');
    } else {
      statusEl.textContent = (game.turn === 'w' ? 'Sun' : 'Moon') + ' to move' + (st.check ? ' — check!' : '');
      statusEl.classList.remove('over');
    }
  }

  function renderMoves() {
    movesEl.innerHTML = '';
    for (var i = 0; i < sanHistory.length; i += 2) {
      var li = document.createElement('li');
      var s = '<span><b>' + sanHistory[i] + '</b></span>';
      if (sanHistory[i + 1]) s += '<span>' + sanHistory[i + 1] + '</span>';
      li.innerHTML = s;
      movesEl.appendChild(li);
    }
    movesEl.scrollTop = movesEl.scrollHeight;
  }

  function renderAll() { renderSquares(); renderPieces(); markSquares(); renderTrays(); renderStatus(); renderMoves(); }

  /* ---------------- animation ---------------- */
  function sleep(ms) { return new Promise(function (res) { setTimeout(res, ms); }); }

  function pathSquares(m) {
    var path = [];
    var f0 = E.fileOf(m.from), r0 = E.rankOf(m.from);
    var f1 = E.fileOf(m.to), r1 = E.rankOf(m.to);
    if (m.piece.toUpperCase() === 'N') return [m.to];
    var df = Math.sign(f1 - f0), dr = Math.sign(r1 - r0);
    var f = f0 + df, r = r0 + dr;
    while (f !== f1 || r !== r1) { path.push(r * 8 + f); f += df; r += dr; }
    path.push(m.to);
    return path;
  }

  function sparksAt(sq) {
    var ps = posStyle(sq);
    var colors = ['#fbbf24', '#f472b6', '#38bdf8', '#ffffff'];
    for (var i = 0; i < 10; i++) {
      var s = document.createElement('div');
      s.className = 'spark';
      s.style.background = colors[i % colors.length];
      s.style.left = ps.left; s.style.top = ps.top;
      s.style.marginLeft = '5.5%'; s.style.marginTop = '5.5%';
      s.style.zIndex = 60;
      var ang = (i / 10) * Math.PI * 2 + Math.random() * 0.5;
      var dist = 26 + Math.random() * 34;
      s.style.setProperty('--dx', Math.cos(ang) * dist + 'px');
      s.style.setProperty('--dy', Math.sin(ang) * dist + 'px');
      boardEl.appendChild(s);
      (function (node) { setTimeout(function () { node.remove(); }, 550); })(s);
    }
  }

  async function animateMove(m, capturedSq) {
    var ms = stepMs();
    var mover = pieceEls[m.from];
    if (!mover || ms === 0) return;
    var victim = capturedSq >= 0 ? pieceEls[capturedSq] : null;
    var isKnight = m.piece.toUpperCase() === 'N';
    var path = pathSquares(m);
    mover.classList.remove('idle');
    mover.classList.add('walking');
    mover.style.zIndex = 40;
    setExpr(mover, 'focused');
    mover.style.transition = 'left ' + ms + 'ms linear, top ' + ms + 'ms linear';
    for (var i = 0; i < path.length; i++) {
      var isLast = i === path.length - 1;
      if (isLast && victim) break;
      var ps = posStyle(path[i]);
      if (isKnight) {
        mover._figure.animate([
          { transform: TILT + ' translateY(0)' },
          { transform: TILT + ' translateY(-30%)', offset: 0.5 },
          { transform: TILT + ' translateY(0)' }
        ], { duration: ms + 140, easing: 'ease-in-out' });
      }
      mover.style.left = ps.left; mover.style.top = ps.top;
      sfx.step();
      await sleep(ms);
      if (victim && i === path.length - 2) setExpr(victim, 'scared');
    }
    if (victim) {
      if (path.length === 1) setExpr(victim, 'scared');
      setExpr(mover, 'angry');
      var vps = posStyle(m.to);
      mover.style.transition = 'left 140ms ease-in, top 140ms ease-in';
      mover.style.left = vps.left; mover.style.top = vps.top;
      mover._figure.animate([
        { transform: TILT + ' rotate(0deg)' },
        { transform: TILT + ' translateY(-7%) rotate(-7deg)', offset: 0.45 },
        { transform: TILT + ' rotate(4deg)', offset: 0.75 },
        { transform: TILT + ' rotate(0deg)' }
      ], { duration: 380, easing: 'ease-out' });
      victim._figure.animate([
        { transform: TILT + ' translateX(0)' },
        { transform: TILT + ' translateX(-7%)', offset: 0.25 },
        { transform: TILT + ' translateX(6%)', offset: 0.5 },
        { transform: TILT + ' translateX(-4%)', offset: 0.75 },
        { transform: TILT + ' translateX(0)' }
      ], { duration: 300, easing: 'linear' });
      sfx.capture();
      await sleep(310);
      sparksAt(capturedSq);
      victim._figure.animate([
        { transform: TILT + ' rotate(0deg)', opacity: 1 },
        { transform: TILT + ' rotate(84deg) translateY(16%)', opacity: 0.1 }
      ], { duration: 450, easing: 'ease-in', fill: 'forwards' });
      await sleep(440);
      victim.remove();
      delete pieceEls[capturedSq];
    } else {
      sfx.land();
    }
    mover.classList.remove('walking');
    mover.classList.add('idle');
    mover.style.transition = '';
    mover.style.zIndex = 10 + dispR(E.rankOf(m.to));
    setExpr(mover, 'idle');
  }

  async function animateCastleRook(m) {
    var ms = stepMs();
    if (ms === 0) return;
    var home = E.rankOf(m.from);
    var rf = m.castle === 'K' ? 7 : 0, rt = m.castle === 'K' ? 5 : 3;
    var rook = pieceEls[home * 8 + rf];
    if (!rook) return;
    rook.style.transition = 'left ' + ms + 'ms linear, top ' + ms + 'ms linear';
    rook._figure.animate([
      { transform: TILT + ' translateY(0)' },
      { transform: TILT + ' translateY(-26%)', offset: 0.5 },
      { transform: TILT + ' translateY(0)' }
    ], { duration: ms + 80, easing: 'ease-in-out' });
    var ps = posStyle(home * 8 + rt);
    rook.style.left = ps.left; rook.style.top = ps.top;
    await sleep(ms);
    rook.style.transition = '';
  }

  /* ---------------- move flow ---------------- */
  function findLegal(from, to) {
    return legalCache.filter(function (m) { return m.from === from && m.to === to; });
  }

  async function doMove(m) {
    animating = true;
    var prevSelected = pieceEls[m.from];
    if (selected >= 0 && prevSelected) setExpr(prevSelected, 'idle');
    selected = -1; targets = [];
    var san = game.toSAN(m, legalCache.length ? legalCache : undefined);
    var capturedSq = m.ep ? (E.rankOf(m.from) * 8 + E.fileOf(m.to)) : (m.captured ? m.to : -1);
    game.make(m);
    sanHistory.push(san);
    await animateMove(m, capturedSq);
    if (m.castle) { await animateCastleRook(m); sfx.castle(); }
    if (m.promotion) sfx.promote();
    renderPieces(); markSquares(); renderTrays(); renderStatus(); renderMoves();
    var st = game.status();
    if (st.check && !st.over) sfx.check();
    if (st.over) sfx.end();
    animating = false;
    maybeCpu();
  }

  function maybeCpu() {
    if (gameOver || animating) return;
    if (modeEl.value === 'cpu' && game.turn !== humanColor()) {
      animating = true;
      setTimeout(function () {
        var depth = parseInt(diffEl.value, 10);
        var jitter = depth === 1 ? 160 : depth === 2 ? 30 : 0;
        var m = game.bestMove(depth, jitter);
        animating = false;
        if (m) { legalCache = game.legalMoves(game.turn); doMove(m); }
      }, 380);
    }
  }

  function askPromotion(cands, cb) {
    var modal = document.getElementById('promo-modal');
    var box = document.getElementById('promo-choices');
    box.innerHTML = '';
    var color = game.turn;
    cands.forEach(function (m) {
      var b = document.createElement('button');
      b.innerHTML = CHAR[m.promotion.toUpperCase()](PAL[color]);
      b.setAttribute('aria-label', 'Promote to ' + m.promotion.toUpperCase());
      b.addEventListener('click', function () { modal.classList.add('hidden'); cb(m); });
      box.appendChild(b);
    });
    modal.classList.remove('hidden');
  }

  boardEl.addEventListener('click', function (ev) {
    if (animating || gameOver || !isHumanTurn()) return;
    var node = ev.target;
    while (node && node !== boardEl && !(node.dataset && node.dataset.sq !== undefined)) node = node.parentNode;
    if (!node || node === boardEl) return;
    var sq = parseInt(node.dataset.sq, 10);
    if (selected >= 0) {
      var cands = findLegal(selected, sq);
      if (cands.length) {
        if (cands.length > 1 && cands[0].promotion) { askPromotion(cands, doMove); return; }
        doMove(cands[0]);
        return;
      }
    }
    var p = game.board[sq];
    if (selected >= 0 && pieceEls[selected]) setExpr(pieceEls[selected], 'idle');
    if (p && E.colorOf(p) === game.turn) {
      selected = sq;
      legalCache = game.legalMoves(game.turn);
      targets = legalCache.filter(function (m) { return m.from === sq; });
      setExpr(pieceEls[sq], 'determined');
      sfx.select();
    } else {
      selected = -1; targets = [];
    }
    markSquares();
  });

  /* ---------------- controls ---------------- */
  function newGame() {
    game = new E.Game();
    sanHistory = [];
    selected = -1; targets = []; animating = false; gameOver = false;
    flipped = modeEl.value === 'cpu' && sideEl.value === 'b';
    renderAll();
    maybeCpu();
  }

  document.getElementById('new-game').addEventListener('click', newGame);
  document.getElementById('flip').addEventListener('click', function () {
    flipped = !flipped;
    renderSquares(); renderPieces(); markSquares(); renderTrays();
  });
  document.getElementById('undo').addEventListener('click', function () {
    if (animating) return;
    var n = modeEl.value === 'cpu' ? 2 : 1;
    for (var i = 0; i < n; i++) {
      if (game.unmake()) sanHistory.pop();
    }
    selected = -1; targets = [];
    renderPieces(); markSquares(); renderTrays(); renderStatus(); renderMoves();
  });
  [modeEl, sideEl].forEach(function (el) { el.addEventListener('change', newGame); });

  renderAll();
  maybeCpu();
})();
