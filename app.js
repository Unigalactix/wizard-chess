/* Colour Chess — UI: colourful board, walking pieces, capture duels. */
(function () {
  'use strict';
  var E = window.ChessEngine;
  var GLYPH = { K: '♚', Q: '♛', R: '♜', B: '♝', N: '♞', P: '♟' };
  var VAL = { P: 1, N: 3, B: 3, R: 5, Q: 9, K: 0 };
  var START_COUNT = { P: 8, N: 2, B: 2, R: 2, Q: 1, K: 1 };

  var boardEl = document.getElementById('board');
  var fxEl = document.getElementById('fx');
  var statusEl = document.getElementById('status');
  var movesEl = document.getElementById('moves');
  var trayTop = document.getElementById('tray-top');
  var trayBottom = document.getElementById('tray-bottom');

  var game = new E.Game();
  var flipped = false;
  var selected = -1;
  var legalCache = [];
  var targets = [];
  var animating = false;
  var sanHistory = [];
  var gameOver = false;

  var modeEl = document.getElementById('mode');
  var sideEl = document.getElementById('side');
  var diffEl = document.getElementById('difficulty');
  var speedEl = document.getElementById('speed');
  var soundEl = document.getElementById('sound');

  function humanColor() { return modeEl.value === 'cpu' ? sideEl.value : null; }
  function stepMs() { return parseInt(speedEl.value, 10); }
  function isHumanTurn() {
    if (modeEl.value !== 'cpu') return true;
    return game.turn === humanColor();
  }

  /* ---------------- sounds (tiny WebAudio synth) ---------------- */
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

  /* ---------------- board geometry ---------------- */
  function dispF(f) { return flipped ? 7 - f : f; }
  function dispR(r) { return flipped ? r : 7 - r; }
  function posStyle(sq) {
    return { left: (dispF(E.fileOf(sq)) * 12.5) + '%', top: (dispR(E.rankOf(sq)) * 12.5) + '%' };
  }
  function sqFromEvent(ev) {
    var rect = boardEl.getBoundingClientRect();
    var x = (ev.clientX - rect.left) / rect.width, y = (ev.clientY - rect.top) / rect.height;
    if (x < 0 || x >= 1 || y < 0 || y >= 1) return -1;
    var df = Math.floor(x * 8), dr = Math.floor(y * 8);
    var f = flipped ? 7 - df : df;
    var r = flipped ? dr : 7 - dr;
    return r * 8 + f;
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

  var pieceEls = {}; // sq -> element
  function makePieceEl(p) {
    var el = document.createElement('div');
    el.className = 'piece ' + (E.colorOf(p) === 'w' ? 'sun' : 'moon');
    var disc = document.createElement('div'); disc.className = 'disc';
    var g = document.createElement('span'); g.className = 'glyph';
    g.textContent = GLYPH[p.toUpperCase()];
    g.style.animationDelay = (Math.random() * 2) + 's';
    el.appendChild(disc); el.appendChild(g);
    return el;
  }
  function renderPieces() {
    Object.keys(pieceEls).forEach(function (k) { pieceEls[k].remove(); });
    pieceEls = {};
    for (var sq = 0; sq < 64; sq++) {
      var p = game.board[sq];
      if (!p) continue;
      var el = makePieceEl(p);
      var ps = posStyle(sq);
      el.style.left = ps.left; el.style.top = ps.top;
      el.dataset.sq = sq;
      boardEl.appendChild(el);
      pieceEls[sq] = el;
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

  /* ---------------- trays + status + moves ---------------- */
  function renderTrays() {
    var counts = { w: { P: 0, N: 0, B: 0, R: 0, Q: 0 }, b: { P: 0, N: 0, B: 0, R: 0, Q: 0 } };
    game.board.forEach(function (p) {
      if (p && p.toUpperCase() !== 'K') counts[E.colorOf(p)][p.toUpperCase()]++;
    });
    function trayFor(capturedColor) {
      // pieces of `capturedColor` that have been captured, shown in the capturer's tray
      var html = '', pts = 0;
      ['Q', 'R', 'B', 'N', 'P'].forEach(function (t) {
        var missing = START_COUNT[t] - counts[capturedColor][t];
        // promotions can make counts exceed start; clamp display of extras
        for (var i = 0; i < missing; i++) {
          html += '<span class="cap-' + (capturedColor === 'w' ? 'sun' : 'moon') + '">' + GLYPH[t] + '</span>';
          pts += VAL[t];
        }
      });
      return { html: html, pts: pts };
    }
    var sunCaps = trayFor('b'), moonCaps = trayFor('w');
    var topIsSun = flipped; // top tray belongs to the player shown at top
    var topTray = topIsSun ? sunCaps : moonCaps;
    var botTray = topIsSun ? moonCaps : sunCaps;
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
    // squares the piece passes through, excluding start, including destination
    var path = [];
    var f0 = E.fileOf(m.from), r0 = E.rankOf(m.from);
    var f1 = E.fileOf(m.to), r1 = E.rankOf(m.to);
    var t = m.piece.toUpperCase();
    if (t === 'N') return [m.to];
    var df = Math.sign(f1 - f0), dr = Math.sign(r1 - r0);
    var f = f0 + df, r = r0 + dr;
    while (f !== f1 || r !== r1) { path.push(r * 8 + f); f += df; r += dr; }
    path.push(m.to);
    return path;
  }

  function sparksAt(sq, colors) {
    var ps = posStyle(sq);
    var cx = parseFloat(ps.left) + 6.25, cy = parseFloat(ps.top) + 6.25;
    for (var i = 0; i < 10; i++) {
      var s = document.createElement('div');
      s.className = 'spark';
      s.style.background = colors[i % colors.length];
      s.style.left = cx + '%'; s.style.top = cy + '%';
      var ang = (i / 10) * Math.PI * 2 + Math.random() * 0.5;
      var dist = 4 + Math.random() * 5;
      s.style.setProperty('--dx', Math.cos(ang) * dist * 8 + 'px');
      s.style.setProperty('--dy', Math.sin(ang) * dist * 8 + 'px');
      fxEl.appendChild(s);
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
    mover.classList.add('walking');
    mover.style.zIndex = 5;
    mover.style.transition = 'left ' + ms + 'ms linear, top ' + ms + 'ms linear';
    for (var i = 0; i < path.length; i++) {
      var isLast = i === path.length - 1;
      if (isLast && victim) break; // stop one step short for the duel
      var ps = posStyle(path[i]);
      if (isKnight) {
        mover.animate([
          { transform: 'translateY(0) scale(1)' },
          { transform: 'translateY(-46%) scale(1.12)', offset: 0.5 },
          { transform: 'translateY(0) scale(1)' }
        ], { duration: ms + 120, easing: 'ease-in-out' });
      }
      mover.style.left = ps.left; mover.style.top = ps.top;
      sfx.step();
      await sleep(ms);
    }
    if (victim) {
      // DUEL: attacker lunges, victim shakes, sparks, victim falls
      mover.classList.add('lunge');
      var vps = posStyle(m.to);
      mover.style.transition = 'left 130ms ease-in, top 130ms ease-in';
      mover.style.left = vps.left; mover.style.top = vps.top;
      victim.classList.add('shake');
      sfx.capture();
      await sleep(150);
      sparksAt(capturedSq, ['#fbbf24', '#f472b6', '#38bdf8', '#ffffff']);
      victim.classList.add('dying');
      mover.animate([
        { transform: 'rotate(0deg)' }, { transform: 'rotate(-13deg)', offset: 0.4 },
        { transform: 'rotate(9deg)', offset: 0.7 }, { transform: 'rotate(0deg)' }
      ], { duration: 340, easing: 'ease-out' });
      await sleep(430);
      victim.remove();
      delete pieceEls[capturedSq];
    } else {
      sfx.land();
    }
    mover.classList.remove('walking', 'lunge');
    mover.style.transition = '';
    mover.style.zIndex = 3;
  }

  async function animateCastleRook(m) {
    var ms = stepMs();
    if (ms === 0) return;
    var home = E.rankOf(m.from);
    var rf = m.castle === 'K' ? 7 : 0, rt = m.castle === 'K' ? 5 : 3;
    var rook = pieceEls[home * 8 + rf];
    if (!rook) return;
    rook.style.transition = 'left ' + ms + 'ms linear, top ' + ms + 'ms linear';
    rook.animate([
      { transform: 'translateY(0)' }, { transform: 'translateY(-34%)', offset: 0.5 }, { transform: 'translateY(0)' }
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
      b.className = color === 'w' ? 'sun' : 'moon';
      b.textContent = GLYPH[m.promotion.toUpperCase()];
      b.addEventListener('click', function () { modal.classList.add('hidden'); cb(m); });
      box.appendChild(b);
    });
    modal.classList.remove('hidden');
  }

  boardEl.addEventListener('click', function (ev) {
    if (animating || gameOver || !isHumanTurn()) return;
    var sq = sqFromEvent(ev);
    if (sq < 0) return;
    if (selected >= 0) {
      var cands = findLegal(selected, sq);
      if (cands.length) {
        if (cands.length > 1 && cands[0].promotion) { askPromotion(cands, doMove); return; }
        doMove(cands[0]);
        return;
      }
    }
    var p = game.board[sq];
    if (p && E.colorOf(p) === game.turn) {
      selected = sq;
      legalCache = game.legalMoves(game.turn);
      targets = legalCache.filter(function (m) { return m.from === sq; });
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
