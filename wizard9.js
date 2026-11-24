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

  /* ---------- view state: tilt (player/top), azimuth (orbit), fit scale ----------
     The board plane is `rotateX(--tilt) rotateZ(--azim) scale(--vscale)`;
     figures counter with the inverse so they always stand upright.
     --vscale shrinks the plane just enough that a spun board (whose in-plane
     bounding box grows by cos+sin of the spin angle) always fits its frame. */
  var viewTilt = 55, viewAzimBase = 0, viewAzimDrag = 0;
  var rotateMode = false, topView = false;
  function currentAzim() { return viewAzimBase + viewAzimDrag; }
  function figT() { return 'rotateZ(' + (-currentAzim()) + 'deg) rotateX(' + (-viewTilt) + 'deg)'; }
  function applyView() {
    var az = currentAzim();
    var phi = Math.abs(az) % 180; if (phi > 90) phi = 180 - phi;
    var rad = phi * Math.PI / 180;
    var fit = 1 / Math.max(1, Math.cos(rad) + Math.sin(rad));
    var root = document.documentElement.style;
    root.setProperty('--tilt', viewTilt + 'deg');
    root.setProperty('--azim', az + 'deg');
    root.setProperty('--vscale', fit.toFixed(4));
  }

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
      '<rect x="53" y="74" width="14" height="24" rx="4" fill="' + P.skin + '"/>' +
      '<path d="M43 94 Q60 85 77 94 L79 150 Q60 156 41 150 Z" fill="' + P.cloth + '"/>' +
      '<rect x="50" y="87.5" width="20" height="5.4" rx="2.7" fill="' + P.dark + '"/>' +
      '<path d="M47 96 Q60 91 73 96 L74 124 Q60 129 46 124 Z" fill="' + P.main + '" stroke="' + P.dark + '" stroke-width="1.5"/>' +
      '<rect x="41" y="128" width="38" height="7" fill="' + P.dark + '"/>' +
      '<rect x="56" y="128.8" width="8" height="5.4" fill="' + P.accent + '"/>' +
      '<path d="M44 98 Q32 107 28 118" fill="none" stroke="' + P.cloth + '" stroke-width="8" stroke-linecap="round"/>' +
      '<path d="M76 98 Q93 104 100 116" fill="none" stroke="' + P.cloth + '" stroke-width="8" stroke-linecap="round"/>' +
      '<circle cx="100" cy="118" r="4.2" fill="' + P.skin + '"/>' +
      '<path d="M9 94 Q24 85 39 94 L39 128 Q24 143 9 128 Z" fill="' + P.main + '" stroke="' + P.dark + '" stroke-width="1.8"/>' +
      '<circle cx="24" cy="111" r="5.4" fill="' + P.accent + '"/>' +
      '<circle cx="24" cy="111" r="8.8" fill="none" stroke="' + P.dark + '" stroke-width="1.6" opacity="0.6"/>' +
      '<path d="M24 97 v28 M12.5 111 h23" stroke="' + P.dark + '" stroke-width="2" opacity="0.55"/>' +
      '<circle cx="60" cy="73" r="15.5" fill="' + P.skin + '"/>' +
      '<path d="M42.5 69 A17.5 17.5 0 0 1 77.5 69 L77.5 73 L42.5 73 Z" fill="' + P.main + '" stroke="' + P.dark + '" stroke-width="1.6"/>' +
      '<rect x="40" y="71" width="40" height="4.6" rx="2.3" fill="' + P.dark + '"/>' +
      '<path d="M56.5 50 Q60 43 63.5 50 L63.5 59 L56.5 59 Z" fill="' + P.cloth + '"/>' +
      face(60, 75, 0.9) + '</svg>'; },
    N: function (P) { return '<svg viewBox="0 0 120 190">' + // knight on horseback — unmistakable
      // tail + horse body
      '<path d="M93 76 Q108 90 101 118 Q94 105 89 95 Z" fill="' + P.hair + '"/>' +
      '<path d="M28 84 Q29 67 52 65 L84 65 Q99 67 98 84 Q97 101 84 104 L35 104 Q27 99 28 84 Z" fill="' + P.main + '" stroke="' + P.dark + '" stroke-width="1.8"/>' +
      // legs + hooves
      '<rect x="35" y="100" width="7.6" height="51" fill="' + P.main + '" stroke="' + P.dark + '" stroke-width="1.3"/>' +
      '<rect x="48" y="100" width="7.6" height="51" fill="' + P.main + '" stroke="' + P.dark + '" stroke-width="1.3"/>' +
      '<rect x="74" y="100" width="7.6" height="51" fill="' + P.main + '" stroke="' + P.dark + '" stroke-width="1.3"/>' +
      '<rect x="86" y="100" width="7.6" height="51" fill="' + P.main + '" stroke="' + P.dark + '" stroke-width="1.3"/>' +
      '<path d="M33 149.5 h11.5 v6.5 h-11.5 Z M46 149.5 h11.5 v6.5 h-11.5 Z M72 149.5 h11.5 v6.5 h-11.5 Z M84 149.5 h11.5 v6.5 h-11.5 Z" fill="#33302a"/>' +
      // neck, head, ears, mane
      '<path d="M36 72 Q23 60 20 41 L35 34 Q46 45 47 63 Z" fill="' + P.main + '" stroke="' + P.dark + '" stroke-width="1.7"/>' +
      '<path d="M41 31 Q49 48 47 66 L38 60 Q43 45 36 35 Z" fill="' + P.hair + '"/>' +
      '<path d="M21 41 L15.5 25 Q14 18 20.5 16.5 L36 19.5 Q42.5 21.5 41.5 29.5 L38.5 42.5 Z" fill="' + P.main + '" stroke="' + P.dark + '" stroke-width="1.7"/>' +
      '<path d="M24.5 17.5 L22.5 5 L31 12.5 Z" fill="' + P.main + '" stroke="' + P.dark + '" stroke-width="1.4"/>' +
      '<path d="M33.5 18.5 L34.5 7 L40 15.5 Z" fill="' + P.main + '" stroke="' + P.dark + '" stroke-width="1.4"/>' +
      '<circle cx="27.5" cy="27.5" r="2.3" fill="#241d10"/>' +
      '<circle cx="19.5" cy="35.5" r="1.5" fill="' + P.dark + '"/>' +
      '<path d="M14 30 Q24 35 38 31" fill="none" stroke="' + P.cloth + '" stroke-width="3"/>' +
      '<path d="M22 38 Q42 55 57 63" fill="none" stroke="' + P.dark + '" stroke-width="2.2"/>' +
      // saddle + blanket
      '<path d="M55 64 L79 64 L75 79 L59 79 Z" fill="' + P.dark + '"/>' +
      '<rect x="56" y="77" width="21" height="15" fill="' + P.cloth + '" stroke="' + P.dark + '" stroke-width="1.3"/>' +
      '<rect x="56" y="88" width="21" height="3.4" fill="' + P.accent + '"/>' +
      // rider: leg, torso, arm + raised sword
      '<path d="M63 76 L59 100 L67 100 L69.5 80 Z" fill="' + P.dark + '"/>' +
      '<line x1="86" y1="64" x2="86" y2="28" stroke="#c3c8cd" stroke-width="4.6" stroke-linecap="round"/>' +
      '<path d="M86 12 L90.5 28 L81.5 28 Z" fill="#c3c8cd"/>' +
      '<path d="M77.5 62 h17" stroke="' + P.dark + '" stroke-width="4" stroke-linecap="round"/>' +
      '<path d="M55 45 Q66 38.5 75 45 L77 68 Q66 72.5 53 68 Z" fill="' + P.cloth + '" stroke="' + P.dark + '" stroke-width="1.6"/>' +
      '<path d="M74 50 Q85 50 86.5 58" fill="none" stroke="' + P.cloth + '" stroke-width="7" stroke-linecap="round"/>' +
      '<path d="M56 50 Q46 54 44 60" fill="none" stroke="' + P.cloth + '" stroke-width="7" stroke-linecap="round"/>' +
      // rider's shield with horse emblem
      '<path d="M33 47 Q41.5 42.5 50 47 L50 62 Q41.5 69.5 33 62 Z" fill="' + P.main + '" stroke="' + P.dark + '" stroke-width="1.6"/>' +
      '<path d="M38.5 51 L44 47.5 L47 51.5 L45.5 58 L40 58 L39 53.5 Z" fill="' + P.accent + '"/>' +
      // rider head + helmet + plume
      '<path d="M65.5 13 Q77 17 75 27 Q69 20 63.5 19 Z" fill="' + P.cloth + '"/>' +
      '<circle cx="65" cy="33" r="10.5" fill="' + P.skin + '"/>' +
      '<path d="M53.5 30.5 A11.5 11.5 0 0 1 76.5 30.5 L76.5 33 L53.5 33 Z" fill="' + P.main + '" stroke="' + P.dark + '" stroke-width="1.4"/>' +
      face(65, 34.5, 0.6) + '</svg>'; },
    B: function (P) { return '<svg viewBox="0 0 120 190">' + // wizard (bishop)
      '<line x1="17" y1="30" x2="17" y2="180" stroke="#6d5b43" stroke-width="4"/>' +
      '<circle cx="17" cy="20" r="8" fill="' + P.accent + '" stroke="' + P.dark + '" stroke-width="1.5"/>' +
      '<path d="M86 106 L107 98 L113 121 L92 129 Z" fill="' + P.accent + '" stroke="' + P.dark + '" stroke-width="1.6"/>' +
      '<path d="M89 108.5 L104 102.5" stroke="' + P.dark + '" stroke-width="1.6"/>' +
      '<path d="M60 84 L85 176 Q60 185 35 176 Z" fill="' + P.cloth + '"/>' +
      '<path d="M60 95 L72.5 177.5 L47.5 177.5 Z" fill="' + P.accent + '" opacity="0.28"/>' +
      '<rect x="46" y="126" width="28" height="5.6" fill="' + P.dark + '"/>' +
      '<path transform="translate(53,142) scale(0.8)" d="M8 0 l1.9 4.2 4.2 1.9 -4.2 1.9 -1.9 4.2 -1.9 -4.2 -4.2 -1.9 4.2 -1.9 Z" fill="' + P.accent + '" opacity="0.85"/>' +
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
      '<rect x="53" y="70" width="14" height="22" rx="4" fill="' + P.skin + '"/>' +
      '<path d="M37 88 Q60 78 83 88 L86 152 Q60 159 34 152 Z" fill="' + P.main + '" stroke="' + P.dark + '" stroke-width="1.8"/>' +
      '<circle cx="48" cy="104" r="2" fill="' + P.dark + '"/><circle cx="72" cy="104" r="2" fill="' + P.dark + '"/>' +
      '<circle cx="48" cy="120" r="2" fill="' + P.dark + '"/><circle cx="72" cy="120" r="2" fill="' + P.dark + '"/>' +
      '<rect x="34" y="134" width="52" height="7" fill="' + P.dark + '"/>' +
      '<path d="M51 134 L51 112 Q60 103 69 112 L69 134 Z" fill="' + P.dark + '" opacity="0.5"/>' +
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
      '<circle cx="60" cy="65" r="15.5" fill="' + P.skin + '"/>' +
      '<rect x="42" y="42" width="36" height="17" fill="' + P.main + '" stroke="' + P.dark + '" stroke-width="1.7"/>' +
      '<rect x="42" y="33" width="8.4" height="10" fill="' + P.main + '" stroke="' + P.dark + '" stroke-width="1.5"/>' +
      '<rect x="55.8" y="33" width="8.4" height="10" fill="' + P.main + '" stroke="' + P.dark + '" stroke-width="1.5"/>' +
      '<rect x="69.6" y="33" width="8.4" height="10" fill="' + P.main + '" stroke="' + P.dark + '" stroke-width="1.5"/>' +
      '<rect x="41" y="58" width="38" height="4.4" fill="' + P.dark + '"/>' +
      face(60, 67, 0.9) + '</svg>'; },
    Q: function (P) { return '<svg viewBox="0 0 120 190">' + // queen
      '<line x1="103" y1="66" x2="103" y2="152" stroke="' + P.dark + '" stroke-width="3.6"/>' +
      '<path d="M103 44 l2.6 6.4 6.4 2.6 -6.4 2.6 -2.6 6.4 -2.6 -6.4 -6.4 -2.6 6.4 -2.6 Z" fill="' + P.accent + '" stroke="' + P.dark + '" stroke-width="1.2"/>' +
      '<path d="M60 84 L89 178 Q60 187 31 178 Z" fill="' + P.cloth + '"/>' +
      '<path d="M60 94 L75 179 L45 179 Z" fill="' + P.main + '" opacity="0.45"/>' +
      '<path d="M43 106 Q60 113 77 106" fill="none" stroke="' + P.accent + '" stroke-width="4"/>' +
      '<circle cx="43" cy="94" r="6.4" fill="' + P.cloth + '"/><circle cx="77" cy="94" r="6.4" fill="' + P.cloth + '"/>' +
      '<path d="M44 97 Q32 106 36.5 120" fill="none" stroke="' + P.skin + '" stroke-width="6.4" stroke-linecap="round"/>' +
      '<path d="M76 97 Q96 90 101 72" fill="none" stroke="' + P.skin + '" stroke-width="6.4" stroke-linecap="round"/>' +
      '<rect x="54" y="60" width="12" height="26" rx="4" fill="' + P.skin + '"/>' +
      '<circle cx="60" cy="50" r="18" fill="' + P.hair + '"/>' +
      '<path d="M43.5 42 Q37 76 43 98 L49.5 93.5 Q45 68 47.5 44 Z" fill="' + P.accent + '" opacity="0.45"/>' +
      '<path d="M76.5 42 Q83 76 77 98 L70.5 93.5 Q75 68 72.5 44 Z" fill="' + P.accent + '" opacity="0.45"/>' +
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
      '<circle cx="60" cy="29" r="2.7" fill="' + P.cloth + '"/>' +
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
  var calloutEl = document.getElementById('callout');
  var thinkingEl = document.getElementById('thinking');
  var captionEl = document.getElementById('caption-badge');
  var disambigEl = document.getElementById('cmd-disambig');
  var chipsEl = document.getElementById('cmd-chips');

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
      d.tabIndex = 0;
      d.setAttribute('role', 'gridcell');
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
    refreshSquareLabels();
  }

  function refreshSquareLabels() {
    for (var sq = 0; sq < 64; sq++) {
      if (!squareEls[sq]) continue;
      var p = game.board[sq];
      squareEls[sq].setAttribute('aria-label', 'Square ' + E.sqName(sq) +
        (p ? ', ' + sideName(E.colorOf(p)) + ' ' + NAMES[p.toUpperCase()].toLowerCase() : ', empty'));
    }
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

  var marksEl = null;
  function ensureMarks() {
    if (marksEl) return marksEl;
    marksEl = document.createElement('div');
    marksEl.id = 'marks';
    document.body.appendChild(marksEl);
    return marksEl;
  }
  function clearMarks() {
    squareEls.forEach(function (d) {
      d.classList.remove('selected', 'last', 'check');
      d.querySelectorAll('.dot,.ring').forEach(function (n) { n.remove(); });
    });
    if (marksEl) marksEl.innerHTML = '';
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
      // Markers live in a screen-space overlay above the figures: in the
      // tilted 3D view the tall pieces hide anything drawn in the plane.
      var mk = ensureMarks();
      function place(el, sqEl, scale) {
        var r = sqEl.getBoundingClientRect();
        el.style.left = (r.left + r.width / 2) + 'px';
        el.style.top = (r.top + r.height / 2) + 'px';
        el.style.width = (r.width * scale) + 'px';
        el.style.height = (r.width * scale) + 'px';
        mk.appendChild(el);
      }
      var selBox = document.createElement('div');
      selBox.className = 'msel';
      place(selBox, squareEls[selected], 0.97);
      targets.forEach(function (m) {
        var marker = document.createElement('div');
        marker.className = m.captured ? 'mring' : 'mdot';
        place(marker, squareEls[m.to], m.captured ? 0.95 : 0.34);
      });
    }
    var st = game.status();
    if (st.check || (st.over && st.reason === 'checkmate')) {
      var ksq = game.kingSq(game.turn);
      if (ksq >= 0) squareEls[ksq].classList.add('check');
    }
    applyDim();
  }

  /* While a piece is selected, gray out the player's OTHER pieces so the
     chosen one and its targets stand out. Clears itself whenever the
     selection clears (move made, deselect, undo, re-render) because every
     one of those paths funnels through markSquares(). */
  function applyDim() {
    var selColor = (selected >= 0 && game.board[selected]) ? E.colorOf(game.board[selected]) : null;
    Object.keys(pieceEls).forEach(function (k) {
      var el = pieceEls[k];
      var dim = !!(selColor && game.board[k] && E.colorOf(game.board[k]) === selColor && +k !== selected);
      el.classList.toggle('dimmed', dim);
      el.classList.toggle('selpiece', +k === selected);
    });
  }

  window.addEventListener('resize', function () { if (selected >= 0) markSquares(); });
  window.addEventListener('scroll', function () { if (selected >= 0) markSquares(); }, true);

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
    calloutEl.classList.add('hidden');
    calloutEl.textContent = '';
    if (st.over) {
      var txt = st.result === '1-0' ? 'Ivory wins' : st.result === '0-1' ? 'Onyx wins' : 'A draw';
      statusEl.textContent = txt;
      calloutEl.textContent = st.reason === 'checkmate' ? 'Checkmate' :
        st.reason === 'stalemate' ? 'Stalemate' : 'Draw — ' + st.reason;
      calloutEl.classList.remove('hidden');
      statusEl.classList.add('over');
    } else {
      statusEl.textContent = sideName(game.turn) + ' to move';
      if (st.check) {
        calloutEl.textContent = 'Check!';
        calloutEl.classList.remove('hidden');
      }
      statusEl.classList.remove('over');
    }
  }

  function describeMove(m) {
    if (m.castle) return 'King castles ' + (m.castle === 'K' ? 'kingside' : 'queenside');
    var txt = NAMES[m.piece.toUpperCase()] + ' ' + E.sqName(m.from) +
      ((m.captured || m.ep) ? ' captures on ' : ' to ') + E.sqName(m.to);
    if (m.promotion) txt += ', promotes to ' + NAMES[m.promotion.toUpperCase()];
    return txt;
  }

  function renderMoves() {
    movesEl.innerHTML = '';
    for (var i = 0; i < sanHistory.length; i += 2) {
      var li = document.createElement('li');
      var num = document.createElement('span');
      num.className = 'mv-num';
      num.textContent = (i / 2 + 1) + '.';
      li.appendChild(num);
      [i, i + 1].forEach(function (j) {
        if (!sanHistory[j]) return;
        var s = document.createElement('span');
        s.className = 'mv' + (j === sanHistory.length - 1 ? ' latest' : '');
        s.textContent = sanHistory[j];
        var rec = game.history[j];
        if (rec && rec.move) s.title = describeMove(rec.move);
        li.appendChild(s);
      });
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
      { transform: 'translateX(23%) rotate(4.5deg) scale(1.04)', offset: 0.42 },
      { transform: 'translateX(18%) rotate(1deg)', offset: 0.68 },
      { transform: 'translateX(0) rotate(0deg)' }
    ], { duration: u * 0.95, easing: 'ease-out' });
    duelSlash.animate([
      { opacity: 0, transform: 'scale(.7) rotate(-6deg)' },
      { opacity: 1, offset: 0.3 },
      { opacity: 0 }
    ], { duration: u * 0.5, delay: u * 0.3, easing: 'ease-out' });
    duelFlash.animate([
      { opacity: 0 }, { opacity: 0.68, offset: 0.15 }, { opacity: 0 }
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
    ], { duration: u * 1.35, easing: 'ease-in', fill: 'forwards' });
    await sleep(u * 1.35);
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
          { transform: figT() + ' translateY(0)' },
          { transform: figT() + ' translateY(-30%)', offset: 0.5 },
          { transform: figT() + ' translateY(0)' }
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
        { transform: figT() + ' rotate(0deg) scaleY(1)', opacity: 1 },
        { transform: figT() + ' rotate(5deg) scaleY(0.62) translateY(12%)', opacity: 0.15 }
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
      { transform: figT() + ' translateY(0)' },
      { transform: figT() + ' translateY(-26%)', offset: 0.5 },
      { transform: figT() + ' translateY(0)' }
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
    clearDisambig();
    thinkingEl.classList.add('hidden');
    if (selected >= 0 && pieceEls[selected]) setExpr(pieceEls[selected], 'idle');
    selected = -1; targets = [];
    var san = game.toSAN(m, legalCache.length ? legalCache : undefined);
    var capturedSq = m.ep ? (E.rankOf(m.from) * 8 + E.fileOf(m.to)) : (m.captured ? m.to : -1);
    var capturedPiece = capturedSq >= 0 ? game.board[capturedSq] : '';
    game.make(m);
    // With sound muted, a capture still needs its beat: caption it in the strip.
    if (capturedPiece && !soundEl.checked) {
      showCaption(NAMES[m.piece.toUpperCase()] + ' captures ' + NAMES[capturedPiece.toUpperCase()] + ' on ' + E.sqName(m.to));
    }
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
      thinkingEl.classList.remove('hidden');
      setTimeout(function () {
        thinkingEl.classList.add('hidden');
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


  /* Projective mapping: screen point -> board plane square.
     The board is a square in 3D; its screen image is a quad. Four corner
     markers ride in the plane so we can invert the projection exactly. */
  var cornerEls = null;
  function ensureCorners() {
    if (cornerEls) return;
    cornerEls = [];
    [[0, 0], [100, 0], [100, 100], [0, 100]].forEach(function (pt) {
      var s = document.createElement('span');
      s.style.cssText = 'position:absolute;width:2px;height:2px;opacity:0;pointer-events:none;left:' + pt[0] + '%;top:' + pt[1] + '%;';
      boardEl.appendChild(s);
      cornerEls.push(s);
    });
  }
  function planeSquare(clientX, clientY) {
    try {
      ensureCorners();
      var q = cornerEls.map(function (el) {
        var r = el.getBoundingClientRect();
        return [r.left + r.width / 2, r.top + r.height / 2];
      });
      var x0 = q[0][0], y0 = q[0][1], x1 = q[1][0], y1 = q[1][1];
      var x2 = q[2][0], y2 = q[2][1], x3 = q[3][0], y3 = q[3][1];
      var dx1 = x1 - x2, dy1 = y1 - y2, dx2 = x3 - x2, dy2 = y3 - y2;
      var dx3 = x0 - x1 + x2 - x3, dy3 = y0 - y1 + y2 - y3;
      var den = dx1 * dy2 - dx2 * dy1;
      if (!den) return -1;
      var g = (dx3 * dy2 - dx2 * dy3) / den, h = (dx1 * dy3 - dx3 * dy1) / den;
      var a = x1 - x0 + g * x1, b = x3 - x0 + h * x3, c = x0;
      var d = y1 - y0 + g * y1, e = y3 - y0 + h * y3, f = y0;
      var A = e - f * h, B = c * h - b, C = b * f - c * e;
      var det = a * A + d * B + g * C;
      if (!det) return -1;
      var D = f * g - d, E2 = a - c * g, F = c * d - a * f;
      var G = d * h - e * g, H = b * g - a * h, I = a * e - b * d;
      var w = (G * clientX + H * clientY + I) / det;
      if (!w) return -1;
      var u = (A * clientX + B * clientY + C) / det / w;
      var v = (D * clientX + E2 * clientY + F) / det / w;
      if (u < 0 || u >= 1 || v < 0 || v >= 1) return -1;
      var df = Math.floor(u * 8), dr = Math.floor(v * 8);
      var file = flipped ? 7 - df : df;
      var rank = flipped ? dr : 7 - dr;
      return rank * 8 + file;
    } catch (err) { return -1; }
  }

  /* One activation path for mouse taps and keyboard Enter/Space alike.
     figSq = square of the piece/square element hit; plSq = square from the
     projective tap mapping (mouse only; keyboard passes figSq twice). */
  function tapSquares(figSq, plSq) {
    if (rotateMode) return; // dragging the view, not commanding pieces
    if (animating || gameOver || !isHumanTurn()) return;
    function tryMove(to) {
      var cands = findLegal(selected, to);
      if (!cands.length) return false;
      if (cands.length > 1 && cands[0].promotion) { askPromotion(cands, doMove); return true; }
      doMove(cands[0]);
      return true;
    }
    if (selected >= 0) {
      if (plSq >= 0 && tryMove(plSq)) return;
      if (figSq >= 0 && figSq !== plSq && tryMove(figSq)) return;
    }
    var sq = figSq >= 0 ? figSq : plSq;
    if (sq < 0) return;
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
  }

  boardEl.addEventListener('click', function (ev) {
    var figSq = -1, node = ev.target;
    while (node && node !== boardEl) {
      if (node.dataset && node.dataset.sq !== undefined) { figSq = parseInt(node.dataset.sq, 10); break; }
      node = node.parentNode;
    }
    tapSquares(figSq, planeSquare(ev.clientX, ev.clientY));
  });

  boardEl.addEventListener('keydown', function (ev) {
    var node = ev.target;
    if (!node.classList || !node.classList.contains('square')) return;
    var sq = parseInt(node.dataset.sq, 10);
    if (ev.key === 'Enter' || ev.key === ' ') {
      ev.preventDefault();
      tapSquares(sq, sq);
      return;
    }
    // step in display space so arrows move the focus as the eye expects
    var df = dispF(E.fileOf(sq)), dr = dispR(E.rankOf(sq));
    if (ev.key === 'ArrowLeft') df -= 1;
    else if (ev.key === 'ArrowRight') df += 1;
    else if (ev.key === 'ArrowUp') dr -= 1;
    else if (ev.key === 'ArrowDown') dr += 1;
    else return;
    ev.preventDefault();
    if (df < 0 || df > 7 || dr < 0 || dr > 7) return;
    var f = flipped ? 7 - df : df;
    var r = flipped ? dr : 7 - dr;
    var target = squareEls[r * 8 + f];
    if (target) target.focus();
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

  var captionTimer = null;
  function showCaption(text) {
    captionEl.textContent = text;
    captionEl.classList.add('show');
    if (captionTimer) clearTimeout(captionTimer);
    captionTimer = setTimeout(function () {
      captionEl.classList.remove('show');
      captionEl.textContent = '';
    }, 3600);
  }

  function clearDisambig() {
    disambigEl.innerHTML = '';
    disambigEl.classList.add('hidden');
  }

  function longForm(m) {
    var t = m.piece.toUpperCase();
    return (t === 'P' ? '' : t) + E.sqName(m.from) + (m.captured || m.ep ? 'x' : '-') + E.sqName(m.to) +
      (m.promotion ? '=' + m.promotion.toUpperCase() : '');
  }

  function confirmCommand(m, san) {
    if (m.castle) {
      commandNote('Moved: King castles ' + (m.castle === 'K' ? 'kingside' : 'queenside') + ' (' + san + ').');
      return;
    }
    var detail = m.piece.toUpperCase() === 'P' ? san : san + ' · ' + longForm(m);
    commandNote('Moved: ' + NAMES[m.piece.toUpperCase()] + ' to ' + E.sqName(m.to) + ' (' + detail + ').');
  }

  function executeCommandMove(m) {
    var san = game.toSAN(m, legalCache.length ? legalCache : undefined);
    cmdEl.value = '';
    updateChips();
    confirmCommand(m, san);
    doMove(m);
  }

  /* Why is (from,to) not playable? The engine's pseudo-legal list knows the
     piece's raw reach; a pseudo-legal move missing from the legal list was
     filtered for exactly one reason — it leaves the king in check. */
  function illegalReason(from, to, typeUpper) {
    var pseudo = game.pseudoMoves(game.turn);
    var hit = pseudo.some(function (x) { return x.from === from && x.to === to; });
    if (hit) return 'Illegal move: that leaves your king in check.';
    return NAMES[typeUpper] + ' cannot reach ' + E.sqName(to) + '.';
  }

  /* Several same-type pieces can reach the target: ask, with buttons. */
  function chooseFromCandidates(cands, kindLabel) {
    var byFrom = {};
    cands.forEach(function (c) { (byFrom[c.from] = byFrom[c.from] || []).push(c); });
    var froms = Object.keys(byFrom);
    if (froms.length === 1) {
      var only = byFrom[froms[0]];
      if (only.length > 1 && only[0].promotion) { askPromotion(only, executeCommandMove); return; }
      executeCommandMove(only[0]);
      return;
    }
    commandNote('');
    disambigEl.innerHTML = '';
    var q = document.createElement('span');
    q.className = 'disambig-q';
    q.textContent = 'Which ' + kindLabel + '?';
    disambigEl.appendChild(q);
    froms.forEach(function (f) {
      var group = byFrom[f];
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'cand-btn';
      b.textContent = E.sqName(group[0].from) + '–' + E.sqName(group[0].to);
      b.setAttribute('aria-label', 'Move the ' + kindLabel + ' from ' + E.sqName(group[0].from) + ' to ' + E.sqName(group[0].to));
      b.addEventListener('click', function () {
        if (group.length > 1 && group[0].promotion) { askPromotion(group, executeCommandMove); return; }
        executeCommandMove(group[0]);
      });
      disambigEl.appendChild(b);
    });
    disambigEl.classList.remove('hidden');
  }

  function runCommand(raw) {
    if (animating) return;
    if (gameOver) { commandNote('The game is over — start a New game.', true); return; }
    if (!isHumanTurn()) { commandNote('Wait — it is not your move.', true); return; }
    var shown = (raw || '').trim();
    var text = shown.toLowerCase().replace(/[,!.]/g, ' ').replace(/\s+/g, ' ').trim();
    if (!text) return;
    clearDisambig();
    legalCache = game.legalMoves(game.turn);
    var mm, s;

    // castling words: "castle kingside", "o-o"
    var castleSide = null;
    if (text === 'castle kingside' || text === 'castle king side' || text === 'o-o' || text === '0-0') castleSide = 'K';
    if (text === 'castle queenside' || text === 'castle queen side' || text === 'o-o-o' || text === '0-0-0') castleSide = 'Q';
    if (castleSide) {
      var cm = legalCache.filter(function (c) { return c.castle === castleSide; })[0];
      if (!cm) {
        commandNote('Castling ' + (castleSide === 'K' ? 'kingside' : 'queenside') +
          ' is not legal right now — king and rook must be unmoved, the path clear, and the king may not castle out of or through check.', true);
        return;
      }
      executeCommandMove(cm);
      return;
    }

    // coordinate form: e2 to e4 / e2e4 / e2-e4 / e4 takes d5
    mm = text.match(/^([a-h][1-8])\s*(?:to|-|x|takes?|captures?)?\s*([a-h][1-8])(?:\s*(?:=)?\s*(queen|rook|knight|bishop|wizard))?$/);
    if (mm) {
      var from = E.parseSq(mm[1]), to = E.parseSq(mm[2]);
      var piece = game.board[from];
      if (!piece) { commandNote('There is no piece on ' + mm[1] + '.', true); return; }
      if (E.colorOf(piece) !== game.turn) {
        commandNote('The ' + NAMES[piece.toUpperCase()].toLowerCase() + ' on ' + mm[1] + ' belongs to ' +
          sideName(E.colorOf(piece)) + ' — it is ' + sideName(game.turn) + ' to move.', true);
        return;
      }
      var cands = findLegal(from, to);
      if (!cands.length) { commandNote(illegalReason(from, to, piece.toUpperCase()), true); return; }
      if (cands.length > 1 && cands[0].promotion) {
        var want = mm[3] ? PIECE_WORDS[mm[3]] : 'Q';
        var pick = cands.filter(function (c) { return c.promotion && c.promotion.toUpperCase() === want; })[0];
        executeCommandMove(pick || cands[0]);
        return;
      }
      executeCommandMove(cands[0]);
      return;
    }

    // named form: knight to f3 / pawn takes e5
    mm = text.match(/^(pawn|soldier|knight|horse|bishop|wizard|rook|tower|queen|king)\s+(?:to|takes?|captures?|x)\s+([a-h][1-8])$/);
    if (mm) {
      var wantT = PIECE_WORDS[mm[1]], toSq = E.parseSq(mm[2]);
      var named = legalCache.filter(function (c) { return c.piece.toUpperCase() === wantT && c.to === toSq; });
      if (!named.length) {
        var own = [];
        for (s = 0; s < 64; s++) {
          var bp = game.board[s];
          if (bp && bp.toUpperCase() === wantT && E.colorOf(bp) === game.turn) own.push(s);
        }
        if (!own.length) { commandNote('You have no ' + mm[1] + ' left on the board.', true); return; }
        var pseudo = game.pseudoMoves(game.turn);
        var canPattern = own.some(function (fs) {
          return pseudo.some(function (x) { return x.from === fs && x.to === toSq; });
        });
        commandNote(canPattern ? 'Illegal move: that leaves your king in check.'
          : NAMES[wantT] + ' cannot reach ' + mm[2] + '.', true);
        return;
      }
      chooseFromCandidates(named, mm[1]);
      return;
    }

    // algebraic form: Nf3 / exd5 / Ng1f3 / e4 / e8=Q
    var sanText = text.replace(/[+#?!]+$/, '');
    mm = sanText.match(/^([kqrbn])?([a-h])?([1-8])?(x)?([a-h])([1-8])(?:=([qrbn]))?$/);
    if (mm) {
      var typeWanted = mm[1] ? mm[1].toUpperCase() : 'P';
      var toS = E.parseSq(mm[5] + mm[6]);
      var pool = legalCache.filter(function (c) {
        if (c.piece.toUpperCase() !== typeWanted || c.to !== toS) return false;
        if (mm[2] && E.fileOf(c.from) !== 'abcdefgh'.indexOf(mm[2])) return false;
        if (mm[3] && E.rankOf(c.from) !== parseInt(mm[3], 10) - 1) return false;
        if (mm[7] && (!c.promotion || c.promotion.toUpperCase() !== mm[7].toUpperCase())) return false;
        return true;
      });
      if (!pool.length) {
        var anyFrom = -1;
        for (s = 0; s < 64; s++) {
          var bp2 = game.board[s];
          if (bp2 && bp2.toUpperCase() === typeWanted && E.colorOf(bp2) === game.turn) { anyFrom = s; break; }
        }
        if (anyFrom < 0) { commandNote('You have no ' + NAMES[typeWanted].toLowerCase() + ' left on the board.', true); return; }
        commandNote(illegalReason(anyFrom, toS, typeWanted), true);
        return;
      }
      chooseFromCandidates(pool, NAMES[typeWanted].toLowerCase());
      return;
    }

    commandNote('Couldn\'t parse \'' + shown + '\'. Try \'e2 to e4\' or \'knight to f3\'.', true);
  }
  document.getElementById('command-go').addEventListener('click', function () { runCommand(cmdEl.value); });
  cmdEl.addEventListener('keydown', function (ev) { if (ev.key === 'Enter') runCommand(cmdEl.value); });

  /* syntax chips: visible while the command box is empty; click runs the order */
  function updateChips() {
    chipsEl.classList.toggle('hidden', cmdEl.value.trim().length > 0);
  }
  cmdEl.addEventListener('input', updateChips);
  chipsEl.addEventListener('pointerdown', function (ev) { ev.preventDefault(); });
  chipsEl.querySelectorAll('.chip-btn').forEach(function (b) {
    b.addEventListener('click', function () {
      cmdEl.value = b.dataset.cmd;
      runCommand(b.dataset.cmd);
    });
  });

  /* ---------------- controls ---------------- */
  function newGame() {
    game = new E.Game();
    sanHistory = [];
    selected = -1; targets = []; animating = false; gameOver = false;
    flipped = modeEl.value === 'cpu' && sideEl.value === 'b';
    commandNote('');
    clearDisambig();
    thinkingEl.classList.add('hidden');
    renderAll();
    maybeCpu();
  }

  document.getElementById('new-game').addEventListener('click', function () {
    if (sanHistory.length > 0) {
      var movesPlayed = Math.ceil(sanHistory.length / 2);
      if (!window.confirm('Start a new game? This match has ' + movesPlayed +
        (movesPlayed === 1 ? ' move' : ' moves') + ' played and will be discarded.')) return;
    }
    newGame();
  });
  document.querySelectorAll('[data-action="flip"]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      flipped = !flipped;
      renderSquares(); renderPieces(); markSquares(); renderTrays();
    });
  });
  document.querySelectorAll('[data-action="undo"]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (animating) return;
      var n = modeEl.value === 'cpu' ? 2 : 1;
      for (var i = 0; i < n; i++) {
        if (game.unmake()) sanHistory.pop();
      }
      selected = -1; targets = [];
      commandNote('');
      clearDisambig();
      renderPieces(); markSquares(); renderTrays(); renderStatus(); renderMoves();
    });
  });
  [modeEl, sideEl].forEach(function (el) { el.addEventListener('change', newGame); });

  /* Segmented pill groups drive the hidden selects, so every existing
     reader of mode/side/difficulty/speed keeps working unchanged. */
  function wireSeg(segId, selectEl) {
    var seg = document.getElementById(segId);
    if (!seg) return;
    var btns = Array.prototype.slice.call(seg.querySelectorAll('button'));
    function sync() {
      btns.forEach(function (b) {
        var on = b.dataset.value === selectEl.value;
        b.setAttribute('aria-checked', on ? 'true' : 'false');
        b.classList.toggle('on', on);
      });
    }
    btns.forEach(function (b) {
      b.addEventListener('click', function () {
        if (selectEl.value !== b.dataset.value) {
          selectEl.value = b.dataset.value;
          selectEl.dispatchEvent(new Event('change', { bubbles: true }));
        }
        sync();
      });
    });
    seg.addEventListener('keydown', function (ev) {
      if (ev.key !== 'ArrowRight' && ev.key !== 'ArrowLeft') return;
      var i = btns.indexOf(document.activeElement);
      if (i < 0) return;
      ev.preventDefault();
      var next = btns[(i + (ev.key === 'ArrowRight' ? 1 : -1) + btns.length) % btns.length];
      next.focus();
      next.click();
    });
    selectEl.addEventListener('change', sync);
    sync();
  }
  wireSeg('seg-mode', modeEl);
  wireSeg('seg-side', sideEl);
  wireSeg('seg-diff', diffEl);
  wireSeg('seg-speed', speedEl);

  var soundBtn = document.getElementById('sound-toggle');
  function syncSound() {
    soundBtn.setAttribute('aria-pressed', soundEl.checked ? 'true' : 'false');
    soundBtn.textContent = soundEl.checked ? 'Sound: on' : 'Sound: off';
    soundBtn.classList.toggle('primary', soundEl.checked);
  }
  soundBtn.addEventListener('click', function () {
    soundEl.checked = !soundEl.checked;
    syncSound();
  });
  syncSound();
  updateChips();

  /* ---------------- view controls: top view / orbit / flip / reset ---------------- */
  var topBtn = document.getElementById('view-top');
  var rotBtn = document.getElementById('view-rotate');
  var flipViewBtn = document.getElementById('view-flip');
  var resetViewBtn = document.getElementById('view-reset');
  function syncViewButtons() {
    topBtn.textContent = topView ? 'Player view' : 'Top view';
    rotBtn.textContent = rotateMode ? 'Rotate: on' : 'Rotate: off';
    rotBtn.classList.toggle('primary', rotateMode);
  }
  function remarkSoon() { setTimeout(function () { if (selected >= 0) markSquares(); }, 560); }
  topBtn.addEventListener('click', function () {
    topView = !topView;
    viewTilt = topView ? 0 : 55;
    applyView(); syncViewButtons(); remarkSoon();
  });
  rotBtn.addEventListener('click', function () {
    rotateMode = !rotateMode;
    document.body.classList.toggle('rotate-mode', rotateMode);
    stageEl.style.touchAction = rotateMode ? 'none' : '';
    syncViewButtons();
  });
  flipViewBtn.addEventListener('click', function () {
    viewAzimBase += 180; // cumulative: flip as many times as you like
    applyView(); remarkSoon();
  });
  resetViewBtn.addEventListener('click', function () {
    topView = false; viewTilt = 55; viewAzimBase = 0; viewAzimDrag = 0; rotateMode = false;
    document.body.classList.remove('rotate-mode');
    stageEl.style.touchAction = '';
    applyView(); syncViewButtons(); remarkSoon();
  });
  boardEl.addEventListener('transitionend', function (ev) {
    if (ev.propertyName === 'transform' && selected >= 0) markSquares();
  });

  /* Drag to orbit while rotate mode is on. The drag offset is clamped to
     ±80° around the current base (the base moves in 180° steps via Flip
     view), so a drag can never spin the board away from you. */
  var dragState = null;
  stageEl.addEventListener('pointerdown', function (ev) {
    if (!rotateMode || animating) return;
    dragState = { x: ev.clientX, off: viewAzimDrag };
    document.body.classList.add('view-drag');
    if (stageEl.setPointerCapture) { try { stageEl.setPointerCapture(ev.pointerId); } catch (e) { /* noop */ } }
    ev.preventDefault();
  });
  stageEl.addEventListener('pointermove', function (ev) {
    if (!dragState) return;
    var dx = ev.clientX - dragState.x;
    viewAzimDrag = Math.max(-80, Math.min(80, dragState.off + dx * 0.35));
    applyView();
  });
  function endDrag() {
    if (!dragState) return;
    dragState = null;
    document.body.classList.remove('view-drag');
    if (selected >= 0) markSquares();
  }
  stageEl.addEventListener('pointerup', endDrag);
  stageEl.addEventListener('pointercancel', endDrag);

  applyView();
  syncViewButtons();
  renderAll();
  maybeCpu();
})();
