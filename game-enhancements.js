/* Progressive polish: articulated gait, expressive combat, team robes, and material readout. */
(function () {
  'use strict';
  var colors = { red: '#c83e3e', blue: '#3978c5', black: '#292b30', yellow: '#d3a82e', green: '#3e9363', purple: '#8556ad', ivory: '#c9bb9c' };
  var defaults = { w: 'ivory', b: 'black' };
  var selects = { w: document.getElementById('ivory-color'), b: document.getElementById('onyx-color') };
  var board = document.getElementById('board');
  var duel = document.getElementById('duel');
  var materialNodes = {
    ivory: document.getElementById('advantage-ivory'), onyx: document.getElementById('advantage-onyx'),
    ivoryScore: document.getElementById('advantage-ivory-score'), onyxScore: document.getElementById('advantage-onyx-score'),
    label: document.getElementById('advantage-label')
  };
  var values = { Q: 9, R: 5, B: 3, N: 3, P: 1, '♛': 9, '♜': 5, '♝': 3, '♞': 3, '♟': 1 };

  // Keep the magical-hall treatment modular and ensure it loads after the base styles.
  var hallStyles = document.createElement('link');
  hallStyles.rel = 'stylesheet';
  hallStyles.href = 'hall-effects.css?v=1';
  document.head.appendChild(hallStyles);

  function readColor(side) {
    try { return localStorage.getItem('wizard-chess-robe-' + side) || defaults[side]; }
    catch (e) { return defaults[side]; }
  }
  function saveColor(side) {
    var select = selects[side];
    if (!select) return;
    var color = colors[select.value] ? select.value : defaults[side];
    document.documentElement.style.setProperty('--robe-' + side, colors[color]);
    try { localStorage.setItem('wizard-chess-robe-' + side, color); } catch (e) { /* storage optional */ }
  }
  Object.keys(selects).forEach(function (side) {
    if (!selects[side]) return;
    selects[side].value = readColor(side);
    saveColor(side);
    selects[side].addEventListener('change', function () { saveColor(side); });
  });

  function svgSide(svg) {
    var markup = svg.innerHTML;
    if (markup.indexOf('#c9bb9c') !== -1) return 'w';
    if (markup.indexOf('#5d6066') !== -1) return 'b';
    return null;
  }
  function animatePartClasses(svg) {
    if (svg.dataset.livingPartsReady) return;
    svg.dataset.livingPartsReady = '1';
    Array.prototype.slice.call(svg.querySelectorAll('path,rect,circle,ellipse,line,polygon')).forEach(function (node, index) {
      var fill = node.getAttribute('fill');
      var stroke = node.getAttribute('stroke');
      if (fill === '#96604a' || fill === '#74352e') node.setAttribute('fill', 'var(--robe-w)');
      if (stroke === '#96604a' || stroke === '#74352e') node.setAttribute('stroke', 'var(--robe-w)');
      // Both armies have the same warm human complexion; team identity comes from cloth and stone.
      if (fill === '#7a7d84' || fill === '#d9cbae') node.setAttribute('fill', '#d2ad89');
      var box;
      try { box = node.getBBox(); } catch (e) { return; }
      if (!box.width && !box.height) return;
      var x = box.x + box.width / 2, y = box.y + box.height / 2;
      node.style.transformBox = 'fill-box';
      node.style.transformOrigin = 'center';
      if (y > 137) node.classList.add(index % 2 ? 'living-leg-b' : 'living-leg-a');
      else if (y > 83 && y < 139 && (x < 43 || x > 77)) node.classList.add(x < 60 ? 'living-arm-a' : 'living-arm-b');
      else if (y < 82 && x > 42 && x < 78) node.classList.add('living-head');
    });
  }
  function enhancePiece(piece) {
    var figure = piece.querySelector('.figure');
    var svg = figure && figure.querySelector('svg');
    if (!svg) return;
    var side = svgSide(svg);
    if (side) {
      piece.classList.add(side === 'w' ? 'team-ivory' : 'team-onyx');
      figure.style.setProperty('--robe-w', 'var(--robe-' + side + ')');
    }
    animatePartClasses(svg);
  }
  function enhanceDuel() {
    if (!duel) return;
    ['duel-atk', 'duel-vic'].forEach(function (id) {
      var figure = document.getElementById(id);
      var svg = figure && figure.querySelector('.holder svg');
      if (!svg) return;
      var side = svgSide(svg);
      if (side) figure.style.setProperty('--robe-w', 'var(--robe-' + side + ')');
      animatePartClasses(svg);
    });
  }
  function refreshAdvantage() {
    var captured = { w: 0, b: 0 };
    document.querySelectorAll('#tray-top span.cap-ivory, #tray-bottom span.cap-ivory, #tray-top span.cap-onyx, #tray-bottom span.cap-onyx').forEach(function (node) {
      var side = node.classList.contains('cap-ivory') ? 'w' : 'b';
      captured[side] += values[(node.textContent || '').trim()] || 0;
    });
    if (!materialNodes.ivory) return;
    var total = captured.w + captured.b;
    var ivoryPct = total ? (captured.w / total) * 100 : 50;
    materialNodes.ivory.style.width = ivoryPct + '%';
    materialNodes.onyx.style.width = (100 - ivoryPct) + '%';
    materialNodes.ivoryScore.textContent = captured.w;
    materialNodes.onyxScore.textContent = captured.b;
    var delta = captured.w - captured.b;
    materialNodes.label.textContent = delta === 0 ? 'Even' : (delta > 0 ? 'Ivory +' + delta : 'Onyx +' + Math.abs(delta));
  }
  function refreshFallenPieces() {
    ['tray-top', 'tray-bottom'].forEach(function (id) {
      var tray = document.getElementById(id);
      if (!tray) return;
      var pieces = tray.querySelectorAll('span.cap-ivory, span.cap-onyx');
      tray.dataset.fallenCount = pieces.length;
      tray.classList.toggle('has-fallen', pieces.length > 0);
      pieces.forEach(function (piece, i) {
        piece.classList.add('fallen-fragment');
        piece.style.setProperty('--fragment-turn', ((i % 5) - 2) * 8 + 'deg');
        piece.setAttribute('title', 'Captured piece — shattered in the duel');
      });
    });
  }
  function burstDuelEffects() {
    if (!duel || duel.classList.contains('hidden') || duel.dataset.effectsActive === 'true') return;
    duel.dataset.effectsActive = 'true';
    var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) { duel.dataset.effectsActive = 'false'; return; }
    for (var i = 0; i < 13; i++) {
      var puff = document.createElement('i');
      puff.className = 'duel-smoke';
      puff.style.left = (24 + Math.random() * 52) + '%';
      puff.style.top = (45 + Math.random() * 38) + '%';
      puff.style.setProperty('--smoke-x', ((Math.random() - .5) * 90) + 'px');
      puff.style.setProperty('--smoke-y', (-35 - Math.random() * 90) + 'px');
      puff.style.setProperty('--smoke-size', (18 + Math.random() * 48) + 'px');
      puff.style.animationDelay = (Math.random() * 220) + 'ms';
      duel.appendChild(puff);
      setTimeout(function (node) { node.remove(); }, 1550, puff);
    }
    // Stylized crimson magic sparks, not graphic injury.
    for (var j = 0; j < 11; j++) {
      var ember = document.createElement('i');
      ember.className = 'duel-ember';
      ember.style.left = (42 + Math.random() * 18) + '%';
      ember.style.top = (50 + Math.random() * 22) + '%';
      ember.style.setProperty('--ember-x', ((Math.random() - .5) * 150) + 'px');
      ember.style.setProperty('--ember-y', ((Math.random() - .65) * 110) + 'px');
      duel.appendChild(ember);
      setTimeout(function (node) { node.remove(); }, 920, ember);
    }
    setTimeout(function () { if (duel) duel.dataset.effectsActive = 'false'; }, 1750);
  }
  function scan() {
    if (board) board.querySelectorAll('.piece').forEach(enhancePiece);
    enhanceDuel();
    refreshAdvantage();
    refreshFallenPieces();
  }
  if (board) new MutationObserver(scan).observe(board, { childList: true, subtree: true });
  ['tray-top', 'tray-bottom'].forEach(function (id) {
    var tray = document.getElementById(id);
    if (tray) new MutationObserver(function () { refreshAdvantage(); refreshFallenPieces(); }).observe(tray, { childList: true, subtree: true });
  });
  if (duel) {
    new MutationObserver(enhanceDuel).observe(duel, { childList: true, subtree: true });
    new MutationObserver(burstDuelEffects).observe(duel, { attributes: true, attributeFilter: ['class'] });
  }
  scan();
})();
