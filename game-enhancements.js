/* Progressive polish: articulated gait, expressive combat, team robes, and material readout. */
(function () {
  'use strict';
  var colors = {
    red: '#c83e3e', blue: '#3978c5', black: '#292b30', yellow: '#d3a82e',
    green: '#3e9363', purple: '#8556ad', ivory: '#c9bb9c'
  };
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
    var nodes = Array.prototype.slice.call(svg.querySelectorAll('path,rect,circle,ellipse,line,polygon'));
    nodes.forEach(function (node, index) {
      var fill = node.getAttribute('fill');
      var stroke = node.getAttribute('stroke');
      var originalCloth = fill === '#96604a' || fill === '#74352e' || stroke === '#96604a' || stroke === '#74352e';
      if (originalCloth) {
        if (fill === '#96604a' || fill === '#74352e') node.setAttribute('fill', 'var(--robe-w)');
        if (stroke === '#96604a' || stroke === '#74352e') node.setAttribute('stroke', 'var(--robe-w)');
      }
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
      var glyph = (node.textContent || '').trim();
      captured[side] += values[glyph] || 0;
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
  function scan() {
    if (board) board.querySelectorAll('.piece').forEach(enhancePiece);
    enhanceDuel();
    refreshAdvantage();
  }
  if (board) new MutationObserver(scan).observe(board, { childList: true, subtree: true });
  [document.getElementById('tray-top'), document.getElementById('tray-bottom')].forEach(function (tray) {
    if (tray) new MutationObserver(refreshAdvantage).observe(tray, { childList: true, subtree: true });
  });
  if (duel) new MutationObserver(enhanceDuel).observe(duel, { childList: true, subtree: true });
  scan();
})();
