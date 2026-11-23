/* Wizard Chess — living stone pieces: full-body SVG characters with faces,
   player-POV board, close-up smash duels, and typed commands.
   Expressions are driven by data-expr on each figure (see wizard.css). */
(function () {
  'use strict';
  var E = window.ChessEngine;
  var GLYPH = { K: '♚', Q: '♛', R: '♜', B: '♝', N: '♞', P: '♟' };
  var NAMES = { K: 'King', Q: 'Queen', R: 'Rook', B: 'Wizard', N: 'Knight', P: 'Pawn' };
  var VAL = { P: 1, N: 3, B: 3, R: 5, Q: 9, K: 0 };
  var START_COUNT = { P: 8, N: 2, B: 2, R: 2, Q: 1, K: 1 };
  var TILT = 'rotateX(-55deg)';

  /* Ivory (w) and Onyx (b) stone palettes */
  var PAL = {
    w: { main: '#c9bb9c', dark: '#857650', cloth: '#96604a', accent: '#eadfc6', skin: '#d9cbae', hair: '#7d6c4c', beard: '#ece3cd' },
    b: { main: '#5d6066', dark: '#2b2d31', cloth: '#74352e', accent: '#a8adb5', skin: '#7a7d84', hair: '#33363c', beard: '#9ba0a6' }
  };

  /* ---------- shared face (expression parts toggled in CSS) ---------- */
  function face(cx, cy, s) {
    return '<g class="face" transform="translate(' + cx + ',' + cy + ') scale(' + s + ')">' +
      '<path class="brow brow-l" d="M-15.5,-10.5 L-5.5,-10.5" stroke="#2e2718" stroke-width="2.6" stroke-linecap="round"/>' +
      '<path class="brow brow-r" d="M5.5,-10.5 L15.5,-10.5" stroke="#2e2718" stroke-width="2.6" stroke-linecap="round"/>' +
      '<ellipse class="eye" cx="-10.5" cy="0" rx="2.7" ry="3.5" fill="#241d10"/>' +
      '<ellipse class="eye" cx="10.5" cy="0" rx="2.7" ry="3.5" fill="#241d10"/>' +
      '<path class="eye-happy" d="M-14.5,1 Q-10.5,-5.5 -6.5,1" fill="none" stroke="#241d10" stroke-width="2.4" stroke-linecap="round"/>' +
      '<path class="eye-happy" d="M6.5,1 Q10.5,-5.5 14.5,1" fill="none" stroke="#241d10" stroke-width="2.4" stroke-linecap="round"/>' +
      '<g class="eye-x" stroke="#241d10" stroke-width="2.2" stroke-linecap="round">' +
        '<path d="M-13.5,-3 L-7.5,3 M-7.5,-3 L-13.5,3"/>' +
        '<path d="M7.5,-3 L13.5,3 M13.5,-3 L7.5,3"/></g>' +
      '<path class="mouth-calm" d="M-4.5,8 Q0,11.5 4.5,8" fill="none" stroke="#4a3a20" stroke-width="1.9" stroke-linecap="round"/>' +
      '<path class="mouth-flat" d="M-4,9.5 L4,9.5" stroke="#4a3a20" stroke-width="1.9" stroke-linecap="round"/>' +
      '<ellipse class="mouth-shout" cx="0" cy="10.5" rx="3.8" ry="4.8" fill="#3d2c14"/>' +
      '<circle class="mouth-o" cx="0" cy="10" r="2.9" fill="#3d2c14"/>' +
      '<path class="mouth-grin" d="M-6.5,7 Q0,15.5 6.5,7 Q0,10.5 -6.5,7 Z" fill="#3d2c14"/>' +
      '<path class="mouth-wavy" d="M-5.5,10.5 q2.7,-3.2 5.5,0 q2.7,3.2 5.5,0" fill="none" stroke="#4a3a20" stroke-width="1.9" stroke-linecap="round"/>' +
      '<path class="sweat" d="M19,-7 C22.5,-1 23.5,1.5 23.5,3.8 A4.3,4.3 0 1 1 14.5,3.8 C14.5,1.5 15.5,-1 19,-7 Z" fill="#b9cdd6" stroke="#5d707c" stroke-width="0.7"/>' +
      '</g>';
  }
  function legs(P, y) {
    return '<rect x="49" y="' + y + '" width="9.5" height="24" fill="' + P.dark + '"/>' +
      '<rect x="62" y="' + y + '" width="9.5" height="24" fill="' + P.dark + '"/>' +
      '<path d="M46 ' + (y + 23) + ' h14 l3 6 h-17 Z" fill="#33302a"/>' +
      '<path d="M60 ' + (y + 23) + ' h14 l3 6 h-17 Z" fill="#33302a"/>';
  }

  /* ---------- the stone court (viewBox 0 0 120 190) ---------- */
  var CHAR = {
    P: function (P) { return '<svg viewBox="0 0 120 190">' + // foot-soldier
      '<line x1="102" y1="34" x2="102" y2="180" stroke="#6d5b43" stroke-width="4"/>' +
      '<path d="M102 8 L109.5 33 L94.5 33 Z" fill="#b9bdc2" stroke="#7d838a" stroke-width="1.4"/>' +
      legs(P, 148) +
      '<path d="M43 94 Q60 85 77 94 L79 150 Q60 156 41 150 Z" fill="' + P.cloth + '"/>' +
      '<path d="M47 96 Q60 91 73 96 L74 124 Q60 129 46 124 Z" fill="' + P.main + '" stroke="' + P.dark + '" stroke-width="1.5"/>' +
      '<rect x="41" y="128" width="38" height="7" fill="' + P.dark + '"/>' +
      '<rect x="56" y="128.8" width="8" height="5.4" fill="' + P.accent + '"/>' +
      '<path d="M44 98 Q32 107 28 118" fill="none" stroke="' + P.cloth + '" stroke-width="8" stroke-linecap="round"/>' +
      '<path d="M76 98 Q93 104 100 116" fill="none" stroke="' + P.cloth + '" stroke-width="8" stroke-linecap="round"/>' +
      '<circle cx="100" cy="118" r="4.2" fill="' + P.skin + '"/>' +
      '<path d="M9 94 Q24 85 39 94 L39 128 Q24 143 9 128 Z" fill="' + P.main + '" stroke="' + P.dark + '" stroke-width="1.8"/>' +
      '<circle cx="24" cy="111" r="5.4" fill="' + P.accent + '"/>' +
      '<path d="M24 97 v28 M12.5 111 h23" stroke="' + P.dark + '" stroke-width="2" opacity="0.55"/>' +
      '<circle cx="60" cy="54" r="15.5" fill="' + P.skin + '"/>' +
      '<path d="M42.5 50 A17.5 17.5 0 0 1 77.5 50 L77.5 54 L42.5 54 Z" fill="' + P.main + '" stroke="' + P.dark + '" stroke-width="1.6"/>' +
      '<rect x="40" y="52" width="40" height="4.6" rx="2.3" fill="' + P.dark + '"/>' +
      '<path d="M56.5 31 Q60 24 63.5 31 L63.5 40 L56.5 40 Z" fill="' + P.cloth + '"/>' +
      face(60, 56, 0.9) + '</svg>'; },
    N: function (P) { return '<svg viewBox="0 0 120 190">' + // armoured knight
      '<line x1="105" y1="98" x2="105" y2="34" stroke="#c3c8cd" stroke-width="5" stroke-linecap="round"/>' +
      '<path d="M105 16 L110 34 L100 34 Z" fill="#c3c8cd"/>' +
      '<path d="M95 96 h20" stroke="' + P.dark + '" stroke-width="4.4" stroke-linecap="round"/>' +
      '<line x1="105" y1="98" x2="105" y2="110" stroke="#5d4a33" stroke-width="5" stroke-linecap="round"/>' +
      legs(P, 148) +
      '<path d="M41 90 Q60 81 79 90 L81 150 Q60 156 39 150 Z" fill="' + P.main + '" stroke="' + P.dark + '" stroke-width="1.7"/>' +
      '<path d="M57 92 h6 v36 h-6 Z" fill="' + P.accent + '" opacity="0.75"/>' +
      '<path d="M39 126 h42 M39 136 h42" stroke="' + P.dark + '" stroke-width="1.8" opacity="0.45"/>' +
      '<rect x="39" y="140" width="42" height="6" fill="' + P.dark + '"/>' +
      '<circle cx="39" cy="94" r="8.4" fill="' + P.main + '" stroke="' + P.dark + '" stroke-width="1.6"/>' +
      '<circle cx="81" cy="94" r="8.4" fill="' + P.main + '" stroke="' + P.dark + '" stroke-width="1.6"/>' +
      '<path d="M42 99 Q29 105 25 114" fill="none" stroke="' + P.main + '" stroke-width="8" stroke-linecap="round"/>' +
      '<path d="M78 99 Q95 101 103 103" fill="none" stroke="' + P.main + '" stroke-width="8" stroke-linecap="round"/>' +
      '<circle cx="104" cy="104" r="4.4" fill="' + P.main + '" stroke="' + P.dark + '" stroke-width="1.2"/>' +
      '<path d="M7 90 Q23 81 39 90 L39 124 Q23 139 7 124 Z" fill="' + P.cloth + '" stroke="' + P.dark + '" stroke-width="1.8"/>' +
      '<path d="M17 96 L25 90 L29 97 L27 108 L20 108 L18.5 101 Z" fill="' + P.accent + '"/>' +
      '<path d="M60 26 Q76 32 73 48 Q65 38 57 36 Z" fill="' + P.cloth + '"/>' +
      '<circle cx="60" cy="54" r="15.5" fill="' + P.skin + '"/>' +
      '<path d="M42.5 50 A17.5 17.5 0 0 1 77.5 50 L77.5 53.5 L42.5 53.5 Z" fill="' + P.main + '" stroke="' + P.dark + '" stroke-width="1.6"/>' +
      '<rect x="57.4" y="51" width="5.2" height="11" fill="' + P.main + '" stroke="' + P.dark + '" stroke-width="1.1"/>' +
      face(60, 57, 0.9) + '</svg>'; },
    B: function (P) { return '<svg viewBox="0 0 120 190">' + // wizard (bishop)
      '<line x1="17" y1="30" x2="17" y2="180" stroke="#6d5b43" stroke-width="4"/>' +
      '<circle cx="17" cy="20" r="8" fill="' + P.accent + '" stroke="' + P.dark + '" stroke-width="1.5"/>' +
      '<path d="M86 106 L107 98 L113 121 L92 129 Z" fill="' + P.accent + '" stroke="' + P.dark + '" stroke-width="1.6"/>' +
      '<path d="M89 108.5 L104 102.5" stroke="' + P.dark + '" stroke-width="1.6"/>' +
      '<path d="M60 84 L85 176 Q60 185 35 176 Z" fill="' + P.cloth + '"/>' +
      '<path d="M60 95 L72.5 177.5 L47.5 177.5 Z" fill="' + P.accent + '" opacity="0.28"/>' +
      '<path d="M44 99 Q31 107 25 119" fill="none" stroke="' + P.cloth + '" stroke-width="9" stroke-linecap="round"/>' +
      '<path d="M76 99 Q89 103 95 111" fill="none" stroke="' + P.cloth + '" stroke-width="9" stroke-linecap="round"/>' +
      '<circle cx="24" cy="121" r="4.2" fill="' + P.skin + '"/><circle cx="96" cy="113" r="4.2" fill="' + P.skin + '"/>' +
      '<circle cx="60" cy="66" r="15" fill="' + P.skin + '"/>' +
      '<path d="M45 72 Q47 102 60 107 Q73 102 75 72 Q68 79 60 79 Q52 79 45 72 Z" fill="' + P.beard + '"/>' +
      '<path d="M41 55 Q50 20 61 3 Q67 22 79 55 Q60 47 41 55 Z" fill="' + P.main + '" stroke="' + P.dark + '" stroke-width="1.7"/>' +
      '<ellipse cx="60" cy="56" rx="27" ry="6.4" fill="' + P.main + '" stroke="' + P.dark + '" stroke-width="1.7"/>' +
      '<path d="M52 30 l1.8 3.8 3.8 1.8 -3.8 1.8 -1.8 3.8 -1.8 -3.8 -3.8 -1.8 3.8 -1.8 Z" fill="' + P.accent + '"/>' +
      '<path d="M64 16 l1.3 2.7 2.7 1.3 -2.7 1.3 -1.3 2.7 -1.3 -2.7 -2.7 -1.3 2.7 -1.3 Z" fill="' + P.accent + '"/>' +
      face(60, 68, 0.86) + '</svg>'; },
    R: function (P) { return '<svg viewBox="0 0 120 190">' + // tower guardian (rook)
      '<line x1="103" y1="98" x2="103" y2="142" stroke="#5d4a33" stroke-width="4.6"/>' +
      '<rect x="94" y="78" width="18" height="19" rx="4" fill="#9aa0a6" stroke="#62676d" stroke-width="1.5"/>' +
      '<path d="M103 68 l3.4 10 h-6.8 Z M94 74 l8.5 5 -6 4.4 Z M112 74 l-8.5 5 6 4.4 Z" fill="#9aa0a6"/>' +
      legs(P, 150) +
      '<path d="M37 88 Q60 78 83 88 L86 152 Q60 159 34 152 Z" fill="' + P.main + '" stroke="' + P.dark + '" stroke-width="1.8"/>' +
      '<circle cx="48" cy="104" r="2" fill="' + P.dark + '"/><circle cx="72" cy="104" r="2" fill="' + P.dark + '"/>' +
      '<circle cx="48" cy="120" r="2" fill="' + P.dark + '"/><circle cx="72" cy="120" r="2" fill="' + P.dark + '"/>' +
      '<rect x="34" y="134" width="52" height="7" fill="' + P.dark + '"/>' +
      '<circle cx="36" cy="92" r="9.6" fill="' + P.main + '" stroke="' + P.dark + '" stroke-width="1.7"/>' +
      '<circle cx="84" cy="92" r="9.6" fill="' + P.main + '" stroke="' + P.dark + '" stroke-width="1.7"/>' +
      '<path d="M39 99 Q27 105 23 114" fill="none" stroke="' + P.main + '" stroke-width="8.6" stroke-linecap="round"/>' +
      '<path d="M81 99 Q95 101 102 105" fill="none" stroke="' + P.main + '" stroke-width="8.6" stroke-linecap="round"/>' +
      '<circle cx="103" cy="107" r="4.4" fill="' + P.skin + '"/>' +
      '<rect x="12" y="97" width="33" height="54" rx="5" fill="' + P.main + '" stroke="' + P.dark + '" stroke-width="1.8"/>' +
      '<rect x="12" y="88" width="8" height="10" fill="' + P.main + '" stroke="' + P.dark + '" stroke-width="1.5"/>' +
      '<rect x="24.5" y="88" width="8" height="10" fill="' + P.main + '" stroke="' + P.dark + '" stroke-width="1.5"/>' +
      '<rect x="37" y="88" width="8" height="10" fill="' + P.main + '" stroke="' + P.dark + '" stroke-width="1.5"/>' +
      '<path d="M12 115 h33 M12 133 h33 M28 97 v18 M20 115 v18 M36 115 v18" stroke="' + P.dark + '" stroke-width="1.6" opacity="0.45"/>' +
      '<circle cx="60" cy="52" r="15.5" fill="' + P.skin + '"/>' +
      '<rect x="42" y="29" width="36" height="17" fill="' + P.main + '" stroke="' + P.dark + '" stroke-width="1.7"/>' +
      '<rect x="42" y="20" width="8.4" height="10" fill="' + P.main + '" stroke="' + P.dark + '" stroke-width="1.5"/>' +
      '<rect x="55.8" y="20" width="8.4" height="10" fill="' + P.main + '" stroke="' + P.dark + '" stroke-width="1.5"/>' +
      '<rect x="69.6" y="20" width="8.4" height="10" fill="' + P.main + '" stroke="' + P.dark + '" stroke-width="1.5"/>' +
      '<rect x="41" y="45" width="38" height="4.4" fill="' + P.dark + '"/>' +
      face(60, 54, 0.9) + '</svg>'; },
    Q: function (P) { return '<svg viewBox="0 0 120 190">' + // queen
      '<line x1="103" y1="66" x2="103" y2="152" stroke="' + P.dark + '" stroke-width="3.6"/>' +
      '<path d="M103 44 l2.6 6.4 6.4 2.6 -6.4 2.6 -2.6 6.4 -2.6 -6.4 -6.4 -2.6 6.4 -2.6 Z" fill="' + P.accent + '" stroke="' + P.dark + '" stroke-width="1.2"/>' +
      '<path d="M60 84 L89 178 Q60 187 31 178 Z" fill="' + P.cloth + '"/>' +
      '<path d="M60 94 L75 179 L45 179 Z" fill="' + P.main + '" opacity="0.45"/>' +
      '<path d="M43 106 Q60 113 77 106" fill="none" stroke="' + P.accent + '" stroke-width="4"/>' +
      '<circle cx="43" cy="94" r="6.4" fill="' + P.cloth + '"/><circle cx="77" cy="94" r="6.4" fill="' + P.cloth + '"/>' +
      '<path d="M44 97 Q32 106 36.5 120" fill="none" stroke="' + P.skin + '" stroke-width="6.4" stroke-linecap="round"/>' +
      '<path d="M76 97 Q96 90 101 72" fill="none" stroke="' + P.skin + '" stroke-width="6.4" stroke-linecap="round"/>' +
      '<circle cx="60" cy="50" r="18" fill="' + P.hair + '"/>' +
      '<circle cx="60" cy="54" r="15" fill="' + P.skin + '"/>' +
      '<path d="M45.5 47 Q41 70 47 84 L53 80 Q49 62 50.5 47 Z" fill="' + P.hair + '"/>' +
      '<path d="M74.5 47 Q79 70 73 84 L67 80 Q71 62 69.5 47 Z" fill="' + P.hair + '"/>' +
      '<path d="M51.5 83.5 Q60 89.5 68.5 83.5" fill="none" stroke="' + P.accent + '" stroke-width="2.5"/>' +
      '<circle cx="60" cy="88.6" r="2.9" fill="' + P.accent + '"/>' +
      '<path d="M43 38 L47 20 L55.5 30.5 L60 15 L64.5 30.5 L73 20 L77 38 Z" fill="' + P.main + '" stroke="' + P.dark + '" stroke-width="1.6"/>' +
      '<circle cx="47" cy="32.5" r="2.3" fill="' + P.cloth + '"/><circle cx="60" cy="28.5" r="2.3" fill="' + P.cloth + '"/><circle cx="73" cy="32.5" r="2.3" fill="' + P.cloth + '"/>' +
      face(60, 56, 0.87) + '</svg>'; },
    K: function (P) { return '<svg viewBox="0 0 120 190">' + // king
      '<line x1="103" y1="60" x2="103" y2="140" stroke="#6d5b43" stroke-width="3.8"/>' +
      '<circle cx="103" cy="49" r="7.4" fill="' + P.main + '" stroke="' + P.dark + '" stroke-width="1.6"/>' +
      '<path d="M103 34.5 v8 M99 38.5 h8" stroke="' + P.dark + '" stroke-width="2.2" stroke-linecap="round"/>' +
      '<path d="M60 84 L87 178 Q60 187 33 178 Z" fill="' + P.cloth + '"/>' +
      '<path d="M57 96 h6 v82 h-6 Z" fill="' + P.accent + '" opacity="0.5"/>' +
      '<path d="M42 85 Q60 96.5 78 85 L78 94.5 Q60 105 42 94.5 Z" fill="#efe8d6"/>' +
      '<circle cx="50" cy="92" r="1.4" fill="' + P.dark + '"/><circle cx="60" cy="95" r="1.4" fill="' + P.dark + '"/><circle cx="70" cy="92" r="1.4" fill="' + P.dark + '"/>' +
      '<rect x="40" y="124" width="40" height="7" fill="' + P.dark + '"/>' +
      '<rect x="56" y="124.8" width="8" height="5.4" fill="' + P.accent + '"/>' +
      '<path d="M43 97 Q31 107 36 119" fill="none" stroke="' + P.cloth + '" stroke-width="7.6" stroke-linecap="round"/>' +
      '<path d="M77 97 Q95 99 101.5 106" fill="none" stroke="' + P.cloth + '" stroke-width="7.6" stroke-linecap="round"/>' +
      '<circle cx="102" cy="108" r="4.2" fill="' + P.skin + '"/>' +
      '<circle cx="60" cy="52" r="16" fill="' + P.skin + '"/>' +
      '<path d="M43.5 57 Q45.5 89 60 95 Q74.5 89 76.5 57 Q69 66.5 60 66.5 Q51 66.5 43.5 57 Z" fill="' + P.beard + '"/>' +
      '<path d="M41.5 36 L44.8 13 L54.5 25.5 L60 7 L65.5 25.5 L75.2 13 L78.5 36 Z" fill="' + P.main + '" stroke="' + P.dark + '" stroke-width="1.7"/>' +
      '<rect x="41.5" y="35.5" width="37" height="5.4" fill="' + P.accent + '"/>' +
      face(60, 54, 0.9) + '</svg>'; }
  };

  /* ---------------- DOM refs & state ---------------- */
  var boardEl = document.getElementById('board');
  var stageEl = document.getElementById('stage');
  var statusEl = document.getElementById('status');
  var movesEl = document.getElementById('moves');
  var trayTop = document.getElementById('tray-top');
  var trayBottom = document.getElementById('tray-bottom');
  var modeEl = document.getElementById('mode');
  var sideEl = document.getElementById('side');
  var diffEl = document.getElementById('difficulty');
  var speedEl = document.getElementById('speed');
  var soundEl = document.getElementById('sound');
  var duelEl = document.getElementById('duel');
  var duelAtk = document.getElementById('duel-atk');
  var duelVic = document.getElementById('duel-vic');
  var duelSlash = duelEl.querySelector('.duel-slash');
  var duelFlash = duelEl.querySelector('.duel-flash');
  var duelCracks = duelEl.querySelector('.duel-cracks');
  var cmdEl = document.getElementById('command');
  var cmdNote = document.getElementById('command-note');

  var game = new E.Game();
  var flipped = false;
  var selected = -1;
  var legalCache = [];
  var targets = [];
  var animating = false;
  var sanHistory = [];
  var gameOver = false;

  function sideName(c) { return c === 'w' ? 'Ivory' : 'Onyx'; }
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
  function noise(dur, freq, vol, delay) {
    if (!soundEl.checked) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      var t = actx.currentTime + (delay || 0), len = Math.floor(actx.sampleRate * dur);
      var buf = actx.createBuffer(1, len, actx.sampleRate);
      var d = buf.getChannelData(0);
      for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
      var src = actx.createBufferSource(); src.buffer = buf;
      var f = actx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = freq;
      var g = actx.createGain(); g.gain.value = vol;
      src.connect(f); f.connect(g); g.connect(actx.destination); src.start(t);
    } catch (e) { /* no audio */ }
  }
  var sfx = {
    step: function () { beep(150 + Math.random() * 40, 0.05, 'triangle', 0.022); },
    land: function () { beep(210, 0.07, 'triangle', 0.045); },
    select: function () { beep(520, 0.05, 'sine', 0.03); },
    strike: function () { noise(0.2, 380, 0.28, 0); beep(82, 0.2, 'sine', 0.13, 0); noise(0.3, 2600, 0.1, 0.05); },
    crumble: function () { noise(0.5, 900, 0.16, 0); noise(0.4, 500, 0.12, 0.12); },
    check: function () { beep(880, 0.12, 'sine', 0.055); beep(1174, 0.16, 'sine', 0.055, 0.1); },
    castle: function () { beep(392, 0.09, 'triangle', 0.05); beep(523, 0.11, 'triangle', 0.05, 0.08); },
    promote: function () { [523, 659, 784, 1046].forEach(function (fr, i) { beep(fr, 0.12, 'sine', 0.05, i * 0.07); }); },
    end: function () { [392, 523, 659].forEach(function (fr, i) { beep(fr, 0.22, 'sine', 0.055, i * 0.13); }); }
  };

  /* ---------------- geometry & rendering ---------------- */
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
      d.className = 'square ' + (((f + r) % 2 === 0) ? 'dark' : 'light');
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
      pieceEls[k].classList.remove('celebrate');
      setExpr(pieceEls[k], 'idle');
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
          html += '<span class="cap-' + (capturedColor === 'w' ? 'ivory' : 'onyx') + '">' + GLYPH[t] + '</span>';
          pts += VAL[t];
        }
      });
      return { html: html, pts: pts };
    }
    var ivoryCaps = trayFor('b'), onyxCaps = trayFor('w');
    var topTray = flipped ? ivoryCaps : onyxCaps;
    var botTray = flipped ? onyxCaps : ivoryCaps;
    trayTop.innerHTML = topTray.html + (topTray.pts > botTray.pts ? '<span class="diff">+' + (topTray.pts - botTray.pts) + '</span>' : '');
    trayBottom.innerHTML = botTray.html + (botTray.pts > topTray.pts ? '<span class="diff">+' + (botTray.pts - topTray.pts) + '</span>' : '');
  }

  function renderStatus() {
    var st = game.status();
    gameOver = st.over;
    if (st.over) {
      var txt = st.result === '1-0' ? 'Ivory wins' : st.result === '0-1' ? 'Onyx wins' : 'A draw';
      statusEl.textContent = txt + ' — ' + st.reason + '!';
      statusEl.classList.add('over');
    } else {
      statusEl.textContent = sideName(game.turn) + ' to move' + (st.check ? ' — check!' : '');
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

  function chipsAt(sq, host) {
    var ps = posStyle(sq);
    var colors = ['#c9bb9c', '#8f8672', '#5d6066', '#3a3a3a'];
    for (var i = 0; i < 9; i++) {
      var s = document.createElement('div');
      s.className = 'spark';
      s.style.background = colors[i % colors.length];
      s.style.left = ps.left; s.style.top = ps.top;
      s.style.marginLeft = '5.5%'; s.style.marginTop = '5.5%';
      s.style.zIndex = 60;
      var ang = (i / 9) * Math.PI * 2 + Math.random() * 0.5;
      var dist = 24 + Math.random() * 32;
      s.style.setProperty('--dx', Math.cos(ang) * dist + 'px');
      s.style.setProperty('--dy', Math.sin(ang) * dist + 'px');
      host.appendChild(s);
      (function (node) { setTimeout(function () { node.remove(); }, 550); })(s);
    }
  }

  function duelChips() {
    var rect = duelEl.getBoundingClientRect();
    for (var i = 0; i < 10; i++) {
      var c = document.createElement('div');
      c.className = 'chip';
      var size = 5 + Math.random() * 8;
      c.style.width = size + 'px'; c.style.height = size * 0.7 + 'px';
      c.style.background = ['#c9bb9c', '#8f8672', '#5d6066', '#2e2c28'][i % 4];
      c.style.left = '58%'; c.style.top = '46%';
      duelEl.appendChild(c);
      var ang = Math.random() * Math.PI * 2, dist = 40 + Math.random() * 90;
      c.animate([
        { transform: 'translate(0,0) rotate(0deg)', opacity: 1 },
        { transform: 'translate(' + Math.cos(ang) * dist + 'px,' + (Math.sin(ang) * dist + 60) + 'px) rotate(' + (Math.random() * 260 - 130) + 'deg)', opacity: 0 }
      ], { duration: 620 + Math.random() * 260, easing: 'cubic-bezier(.2,.7,.3,1)' });
      (function (node) { setTimeout(function () { node.remove(); }, 950); })(c);
    }
    void rect;
  }

  /* The close-up smash: attacker strikes, victim cracks and crumbles. */
  async function playDuel(atkPiece, vicPiece) {
    var u = stepMs();
    if (u === 0) return;
    duelAtk.querySelector('.holder').innerHTML = CHAR[atkPiece.toUpperCase()](PAL[E.colorOf(atkPiece)]);
    duelVic.querySelector('.holder').innerHTML = CHAR[vicPiece.toUpperCase()](PAL[E.colorOf(vicPiece)]);
    duelAtk.dataset.expr = 'angry';
    duelVic.dataset.expr = 'scared';
    duelCracks.style.opacity = 0;
    [duelAtk, duelVic].forEach(function (el) {
      el.getAnimations().forEach(function (a) { a.cancel(); });
      el.style.transform = ''; el.style.opacity = '';
    });
    duelEl.classList.remove('hidden');
    duelEl.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 160, fill: 'forwards' });
    await sleep(u * 0.7);
    // strike
    duelAtk.animate([
      { transform: 'translateX(0) rotate(0deg)' },
      { transform: 'translateX(17%) rotate(3.5deg)', offset: 0.42 },
      { transform: 'translateX(13%) rotate(1deg)', offset: 0.68 },
      { transform: 'translateX(0) rotate(0deg)' }
    ], { duration: u * 0.95, easing: 'ease-out' });
    duelSlash.animate([
      { opacity: 0, transform: 'scale(.7) rotate(-6deg)' },
      { opacity: 1, offset: 0.3 },
      { opacity: 0 }
    ], { duration: u * 0.5, delay: u * 0.3, easing: 'ease-out' });
    duelFlash.animate([
      { opacity: 0 }, { opacity: 0.5, offset: 0.15 }, { opacity: 0 }
    ], { duration: u * 0.45, delay: u * 0.3 });
    stageEl.animate([
      { transform: 'translateX(0)' }, { transform: 'translateX(-7px)', offset: 0.3 },
      { transform: 'translateX(6px)', offset: 0.55 }, { transform: 'translateX(-3px)', offset: 0.8 },
      { transform: 'translateX(0)' }
    ], { duration: 240, delay: u * 0.3 });
    setTimeout(function () { sfx.strike(); }, u * 0.3);
    await sleep(u * 0.82);
    // cracks, then crumble
    duelCracks.style.opacity = 1;
    duelChips();
    sfx.crumble();
    duelVic.dataset.expr = 'dizzy';
    duelVic.animate([
      { transform: 'rotate(0deg) scaleY(1)', opacity: 1 },
      { transform: 'rotate(-4deg) scaleY(0.9)', opacity: 0.85, offset: 0.4 },
      { transform: 'rotate(5deg) scaleY(0.66) translateY(10%)', opacity: 0.2 }
    ], { duration: u * 1.1, easing: 'ease-in', fill: 'forwards' });
    await sleep(u * 1.1);
    duelEl.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 190, fill: 'forwards' });
    await sleep(190);
    duelEl.classList.add('hidden');
  }

  async function animateMove(m, capturedSq, capturedPiece) {
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
      setExpr(victim, 'scared');
      setExpr(mover, 'angry');
      await playDuel(m.piece, capturedPiece || m.captured);
      // attacker steps onto the square; the victim crumbles where it stood
      var vps = posStyle(m.to);
      mover.style.transition = 'left 150ms ease-in, top 150ms ease-in';
      mover.style.left = vps.left; mover.style.top = vps.top;
      chipsAt(capturedSq, boardEl);
      victim._figure.animate([
        { transform: TILT + ' rotate(0deg) scaleY(1)', opacity: 1 },
        { transform: TILT + ' rotate(5deg) scaleY(0.62) translateY(12%)', opacity: 0.15 }
      ], { duration: 300, easing: 'ease-in', fill: 'forwards' });
      await sleep(290);
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
    if (selected >= 0 && pieceEls[selected]) setExpr(pieceEls[selected], 'idle');
    selected = -1; targets = [];
    var san = game.toSAN(m, legalCache.length ? legalCache : undefined);
    var capturedSq = m.ep ? (E.rankOf(m.from) * 8 + E.fileOf(m.to)) : (m.captured ? m.to : -1);
    var capturedPiece = capturedSq >= 0 ? game.board[capturedSq] : '';
    game.make(m);
    sanHistory.push(san);
    await animateMove(m, capturedSq, capturedPiece);
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
      b.setAttribute('aria-label', 'Promote to ' + NAMES[m.promotion.toUpperCase()]);
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

  /* ---------------- typed commands ("Knight to f3") ---------------- */
  var PIECE_WORDS = {
    pawn: 'P', soldier: 'P', knight: 'N', horse: 'N', bishop: 'B', wizard: 'B',
    rook: 'R', tower: 'R', queen: 'Q', king: 'K'
  };
  function commandNote(msg, isError) {
    cmdNote.textContent = msg;
    cmdNote.classList.toggle('error', !!isError);
  }
  function runCommand(raw) {
    if (animating || gameOver) return;
    if (!isHumanTurn()) { commandNote('Wait — it is not your move.', true); return; }
    var text = (raw || '').toLowerCase().replace(/[,!.]/g, ' ').replace(/\s+/g, ' ').trim();
    if (!text) return;
    legalCache = game.legalMoves(game.turn);
    var m = null, mm;
    // coordinate form: e2 to e4 / e2e4 / e2-e4
    mm = text.match(/^([a-h][1-8])\s*(?:to|-|x|takes?|captures?)?\s*([a-h][1-8])(?:\s*(?:=)?\s*(queen|rook|knight|bishop|wizard))?$/);
    if (mm) {
      var from = E.parseSq(mm[1]), to = E.parseSq(mm[2]);
      var cands = findLegal(from, to);
      if (!cands.length) { commandNote('That piece cannot move there.', true); return; }
      if (cands.length > 1 && cands[0].promotion) {
        var want = mm[3] ? PIECE_WORDS[mm[3]] : 'Q';
        m = cands.filter(function (c) { return c.promotion && c.promotion.toUpperCase() === want; })[0] || cands[0];
      } else m = cands[0];
    } else {
      // named form: knight to f3 / pawn takes e5
      mm = text.match(/^(pawn|soldier|knight|horse|bishop|wizard|rook|tower|queen|king)\s+(?:to|takes?|captures?|x)\s+([a-h][1-8])$/);
      if (!mm) { commandNote('I did not understand that order. Try “knight to f3” or “e2 to e4”.', true); return; }
      var want2 = PIECE_WORDS[mm[1]], toSq = E.parseSq(mm[2]);
      var named = legalCache.filter(function (c) { return c.piece.toUpperCase() === want2 && c.to === toSq; });
      if (!named.length) { commandNote('No ' + mm[1] + ' can move to ' + mm[2] + '.', true); return; }
      if (named.length > 1) {
        commandNote('Two ' + mm[1] + 's can reach ' + mm[2] + ' — name the starting square instead, e.g. “' +
          E.sqName(named[0].from) + ' to ' + mm[2] + '”.', true);
        return;
      }
      m = named[0];
      if (m.promotion) {
        var qs = named.filter(function (c) { return c.promotion && c.promotion.toUpperCase() === 'Q'; });
        if (qs.length) m = qs[0];
      }
    }
    cmdEl.value = '';
    commandNote(NAMES[m.piece.toUpperCase()] + ' to ' + E.sqName(m.to) + ' — as commanded.');
    doMove(m);
  }
  document.getElementById('command-go').addEventListener('click', function () { runCommand(cmdEl.value); });
  cmdEl.addEventListener('keydown', function (ev) { if (ev.key === 'Enter') runCommand(cmdEl.value); });

  /* ---------------- controls ---------------- */
  function newGame() {
    game = new E.Game();
    sanHistory = [];
    selected = -1; targets = []; animating = false; gameOver = false;
    flipped = modeEl.value === 'cpu' && sideEl.value === 'b';
    commandNote('');
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
