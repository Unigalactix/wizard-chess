/* Colour Chess — core engine (pure logic, no DOM).
   Board: array of 64, a1 = 0 ... h8 = 63. Pieces: 'P','N','B','R','Q','K' (white),
   lowercase for black, '' for empty. */
(function (global) {
  'use strict';

  var START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  var FILES = 'abcdefgh';
  var KNIGHT_D = [[1, 2], [2, 1], [2, -1], [1, -2], [-1, -2], [-2, -1], [-2, 1], [-1, 2]];
  var KING_D = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]];
  var ROOK_D = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  var BISHOP_D = [[1, 1], [1, -1], [-1, 1], [-1, -1]];

  function fileOf(sq) { return sq & 7; }
  function rankOf(sq) { return sq >> 3; }
  function makeSq(f, r) { return r * 8 + f; }
  function sqName(sq) { return FILES[fileOf(sq)] + (rankOf(sq) + 1); }
  function parseSq(name) { return makeSq(FILES.indexOf(name[0]), name.charCodeAt(1) - 49); }
  function colorOf(p) { return p === '' ? null : (p === p.toUpperCase() ? 'w' : 'b'); }
  function opp(c) { return c === 'w' ? 'b' : 'w'; }

  function Game(fen) {
    this.board = new Array(64).fill('');
    this.turn = 'w';
    this.castling = { K: false, Q: false, k: false, q: false };
    this.ep = -1;
    this.halfmove = 0;
    this.fullmove = 1;
    this.history = [];
    this.loadFEN(fen || START_FEN);
  }

  Game.prototype.loadFEN = function (fen) {
    var parts = fen.trim().split(/\s+/);
    var rows = parts[0].split('/');
    this.board = new Array(64).fill('');
    for (var i = 0; i < 8; i++) {
      var r = 7 - i, f = 0, row = rows[i];
      for (var j = 0; j < row.length; j++) {
        var ch = row[j];
        if (/\d/.test(ch)) { f += parseInt(ch, 10); }
        else { this.board[makeSq(f, r)] = ch; f++; }
      }
    }
    this.turn = parts[1] || 'w';
    var c = parts[2] || '-';
    this.castling = { K: c.indexOf('K') >= 0, Q: c.indexOf('Q') >= 0, k: c.indexOf('k') >= 0, q: c.indexOf('q') >= 0 };
    this.ep = parts[3] && parts[3] !== '-' ? parseSq(parts[3]) : -1;
    this.halfmove = parseInt(parts[4] || '0', 10);
    this.fullmove = parseInt(parts[5] || '1', 10);
    this.history = [];
  };

  Game.prototype.kingSq = function (color) {
    var k = color === 'w' ? 'K' : 'k';
    for (var i = 0; i < 64; i++) if (this.board[i] === k) return i;
    return -1;
  };

  Game.prototype.attacked = function (sq, by) {
    var f = fileOf(sq), r = rankOf(sq), b = this.board, i, df, dr, nf, nr, p;
    // pawns
    var pawn = by === 'w' ? 'P' : 'p';
    var pr = by === 'w' ? r - 1 : r + 1;
    if (pr >= 0 && pr < 8) {
      for (i = -1; i <= 1; i += 2) {
        nf = f + i;
        if (nf >= 0 && nf < 8 && b[makeSq(nf, pr)] === pawn) return true;
      }
    }
    // knights
    var knight = by === 'w' ? 'N' : 'n';
    for (i = 0; i < 8; i++) {
      nf = f + KNIGHT_D[i][0]; nr = r + KNIGHT_D[i][1];
      if (nf >= 0 && nf < 8 && nr >= 0 && nr < 8 && b[makeSq(nf, nr)] === knight) return true;
    }
    // king
    var king = by === 'w' ? 'K' : 'k';
    for (i = 0; i < 8; i++) {
      nf = f + KING_D[i][0]; nr = r + KING_D[i][1];
      if (nf >= 0 && nf < 8 && nr >= 0 && nr < 8 && b[makeSq(nf, nr)] === king) return true;
    }
    // sliders
    var sets = [
      { d: ROOK_D, t: by === 'w' ? 'RQ' : 'rq' },
      { d: BISHOP_D, t: by === 'w' ? 'BQ' : 'bq' }
    ];
    for (var s = 0; s < 2; s++) {
      for (i = 0; i < 4; i++) {
        df = sets[s].d[i][0]; dr = sets[s].d[i][1];
        nf = f + df; nr = r + dr;
        while (nf >= 0 && nf < 8 && nr >= 0 && nr < 8) {
          p = b[makeSq(nf, nr)];
          if (p !== '') { if (sets[s].t.indexOf(p) >= 0) return true; break; }
          nf += df; nr += dr;
        }
      }
    }
    return false;
  };

  Game.prototype.inCheck = function (color) {
    return this.attacked(this.kingSq(color), opp(color));
  };

  Game.prototype.pseudoMoves = function (color) {
    var moves = [], b = this.board;
    for (var sq = 0; sq < 64; sq++) {
      var p = b[sq];
      if (p === '' || colorOf(p) !== color) continue;
      var f = fileOf(sq), r = rankOf(sq), t = p.toUpperCase(), i, nf, nr, tp;
      function add(to, opts) {
        var m = { from: sq, to: to, piece: p, captured: b[to] || '' };
        if (opts) for (var k in opts) m[k] = opts[k];
        moves.push(m);
      }
      if (t === 'P') {
        var dir = color === 'w' ? 1 : -1;
        var startRank = color === 'w' ? 1 : 6;
        var promoRank = color === 'w' ? 7 : 0;
        nr = r + dir;
        if (nr >= 0 && nr < 8) {
          var one = makeSq(f, nr);
          if (b[one] === '') {
            if (nr === promoRank) { ['Q', 'R', 'B', 'N'].forEach(function (pr) { add(one, { promotion: color === 'w' ? pr : pr.toLowerCase() }); }); }
            else {
              add(one);
              if (r === startRank) {
                var two = makeSq(f, r + 2 * dir);
                if (b[two] === '') add(two, { double: true });
              }
            }
          }
          for (i = -1; i <= 1; i += 2) {
            nf = f + i;
            if (nf < 0 || nf > 7) continue;
            var tsq = makeSq(nf, nr);
            tp = b[tsq];
            if (tp !== '' && colorOf(tp) !== color) {
              if (nr === promoRank) { ['Q', 'R', 'B', 'N'].forEach(function (pr) { add(tsq, { promotion: color === 'w' ? pr : pr.toLowerCase() }); }); }
              else add(tsq);
            } else if (tsq === this.ep) {
              add(tsq, { ep: true, captured: color === 'w' ? 'p' : 'P' });
            }
          }
        }
      } else if (t === 'N' || t === 'K') {
        var D = t === 'N' ? KNIGHT_D : KING_D;
        for (i = 0; i < 8; i++) {
          nf = f + D[i][0]; nr = r + D[i][1];
          if (nf < 0 || nf > 7 || nr < 0 || nr > 7) continue;
          tp = b[makeSq(nf, nr)];
          if (tp === '' || colorOf(tp) !== color) add(makeSq(nf, nr));
        }
        if (t === 'K') {
          var home = color === 'w' ? 0 : 7;
          var enemy = opp(color);
          if (r === home && f === 4 && !this.attacked(sq, enemy)) {
            var rights = color === 'w' ? ['K', 'Q'] : ['k', 'q'];
            var rookP = color === 'w' ? 'R' : 'r';
            if (this.castling[rights[0]] && b[makeSq(5, home)] === '' && b[makeSq(6, home)] === '' &&
                b[makeSq(7, home)] === rookP &&
                !this.attacked(makeSq(5, home), enemy) && !this.attacked(makeSq(6, home), enemy)) {
              add(makeSq(6, home), { castle: 'K' });
            }
            if (this.castling[rights[1]] && b[makeSq(3, home)] === '' && b[makeSq(2, home)] === '' && b[makeSq(1, home)] === '' &&
                b[makeSq(0, home)] === rookP &&
                !this.attacked(makeSq(3, home), enemy) && !this.attacked(makeSq(2, home), enemy)) {
              add(makeSq(2, home), { castle: 'Q' });
            }
          }
        }
      } else {
        var dirs = t === 'R' ? ROOK_D : t === 'B' ? BISHOP_D : KING_D;
        for (i = 0; i < dirs.length; i++) {
          nf = f + dirs[i][0]; nr = r + dirs[i][1];
          while (nf >= 0 && nf < 8 && nr >= 0 && nr < 8) {
            tp = b[makeSq(nf, nr)];
            if (tp === '') add(makeSq(nf, nr));
            else { if (colorOf(tp) !== color) add(makeSq(nf, nr)); break; }
            nf += dirs[i][0]; nr += dirs[i][1];
          }
        }
      }
    }
    return moves;
  };

  Game.prototype.make = function (m) {
    var b = this.board;
    var undo = {
      move: m, captured: m.captured || '', ep: this.ep,
      castling: { K: this.castling.K, Q: this.castling.Q, k: this.castling.k, q: this.castling.q },
      halfmove: this.halfmove
    };
    this.history.push(undo);
    var piece = b[m.from];
    b[m.from] = '';
    if (m.ep) {
      var capSq = makeSq(fileOf(m.to), rankOf(m.from));
      undo.epCapSq = capSq;
      b[capSq] = '';
    }
    b[m.to] = m.promotion || piece;
    if (m.castle) {
      var home = rankOf(m.from);
      if (m.castle === 'K') { b[makeSq(5, home)] = b[makeSq(7, home)]; b[makeSq(7, home)] = ''; }
      else { b[makeSq(3, home)] = b[makeSq(0, home)]; b[makeSq(0, home)] = ''; }
    }
    // castling rights updates
    if (piece === 'K') { this.castling.K = false; this.castling.Q = false; }
    if (piece === 'k') { this.castling.k = false; this.castling.q = false; }
    if (m.from === 0 || m.to === 0) this.castling.Q = false;
    if (m.from === 7 || m.to === 7) this.castling.K = false;
    if (m.from === 56 || m.to === 56) this.castling.q = false;
    if (m.from === 63 || m.to === 63) this.castling.k = false;
    this.ep = m.double ? makeSq(fileOf(m.from), (rankOf(m.from) + rankOf(m.to)) / 2) : -1;
    this.halfmove = (piece.toUpperCase() === 'P' || undo.captured) ? 0 : this.halfmove + 1;
    if (this.turn === 'b') this.fullmove++;
    this.turn = opp(this.turn);
    return undo;
  };

  Game.prototype.unmake = function () {
    var undo = this.history.pop();
    if (!undo) return null;
    var m = undo.move, b = this.board;
    this.turn = opp(this.turn);
    if (this.turn === 'b') this.fullmove--;
    b[m.from] = m.piece;
    b[m.to] = '';
    if (m.ep) { b[undo.epCapSq] = undo.captured; }
    else if (undo.captured) { b[m.to] = undo.captured; }
    if (m.castle) {
      var home = rankOf(m.from);
      if (m.castle === 'K') { b[makeSq(7, home)] = b[makeSq(5, home)]; b[makeSq(5, home)] = ''; }
      else { b[makeSq(0, home)] = b[makeSq(3, home)]; b[makeSq(3, home)] = ''; }
    }
    this.ep = undo.ep;
    this.castling = undo.castling;
    this.halfmove = undo.halfmove;
    return m;
  };

  Game.prototype.legalMoves = function (color) {
    color = color || this.turn;
    var res = [], pseudo = this.pseudoMoves(color), i;
    for (i = 0; i < pseudo.length; i++) {
      this.make(pseudo[i]);
      if (!this.attacked(this.kingSq(color), opp(color))) res.push(pseudo[i]);
      this.unmake();
    }
    return res;
  };

  Game.prototype.status = function () {
    var moves = this.legalMoves(this.turn);
    var check = this.inCheck(this.turn);
    if (moves.length === 0) {
      if (check) return { over: true, result: this.turn === 'w' ? '0-1' : '1-0', reason: 'checkmate' };
      return { over: true, result: '1/2-1/2', reason: 'stalemate' };
    }
    if (this.halfmove >= 100) return { over: true, result: '1/2-1/2', reason: 'fifty-move rule' };
    // insufficient material
    var rest = this.board.filter(function (p) { return p !== '' && p.toUpperCase() !== 'K'; });
    if (rest.length === 0) return { over: true, result: '1/2-1/2', reason: 'insufficient material' };
    if (rest.length === 1 && 'BN'.indexOf(rest[0].toUpperCase()) >= 0)
      return { over: true, result: '1/2-1/2', reason: 'insufficient material' };
    return { over: false, check: check };
  };

  Game.prototype.toSAN = function (m, legal) {
    legal = legal || this.legalMoves(this.turn);
    if (m.castle) return m.castle === 'K' ? 'O-O' : 'O-O-O';
    var t = m.piece.toUpperCase();
    var san = '';
    if (t === 'P') {
      if (m.captured) san += FILES[fileOf(m.from)] + 'x';
      san += sqName(m.to);
      if (m.promotion) san += '=' + m.promotion.toUpperCase();
    } else {
      san += t;
      var others = legal.filter(function (x) {
        return x.piece === m.piece && x.to === m.to && x.from !== m.from;
      });
      if (others.length) {
        var sameFile = others.some(function (x) { return fileOf(x.from) === fileOf(m.from); });
        var sameRank = others.some(function (x) { return rankOf(x.from) === rankOf(m.from); });
        if (!sameFile) san += FILES[fileOf(m.from)];
        else if (!sameRank) san += (rankOf(m.from) + 1);
        else san += sqName(m.from);
      }
      if (m.captured) san += 'x';
      san += sqName(m.to);
    }
    this.make(m);
    if (this.inCheck(this.turn)) san += this.legalMoves(this.turn).length === 0 ? '#' : '+';
    this.unmake();
    return san;
  };

  /* ---------- Simple AI: negamax + alpha-beta, material + piece-square tables ---------- */
  var VAL = { P: 100, N: 320, B: 330, R: 500, Q: 900, K: 20000 };
  var PST = {
    P: [0,0,0,0,0,0,0,0, 50,50,50,50,50,50,50,50, 10,10,20,30,30,20,10,10, 5,5,10,25,25,10,5,5, 0,0,0,20,20,0,0,0, 5,-5,-10,0,0,-10,-5,5, 5,10,10,-20,-20,10,10,5, 0,0,0,0,0,0,0,0],
    N: [-50,-40,-30,-30,-30,-30,-40,-50, -40,-20,0,0,0,0,-20,-40, -30,0,10,15,15,10,0,-30, -30,5,15,20,20,15,5,-30, -30,0,15,20,20,15,0,-30, -30,5,10,15,15,10,5,-30, -40,-20,0,5,5,0,-20,-40, -50,-40,-30,-30,-30,-30,-40,-50],
    B: [-20,-10,-10,-10,-10,-10,-10,-20, -10,0,0,0,0,0,0,-10, -10,0,5,10,10,5,0,-10, -10,5,5,10,10,5,5,-10, -10,0,10,10,10,10,0,-10, -10,10,10,10,10,10,10,-10, -10,5,0,0,0,0,5,-10, -20,-10,-10,-10,-10,-10,-10,-20],
    R: [0,0,0,0,0,0,0,0, 5,10,10,10,10,10,10,5, -5,0,0,0,0,0,0,-5, -5,0,0,0,0,0,0,-5, -5,0,0,0,0,0,0,-5, -5,0,0,0,0,0,0,-5, -5,0,0,0,0,0,0,-5, 0,0,0,5,5,0,0,0],
    Q: [-20,-10,-10,-5,-5,-10,-10,-20, -10,0,0,0,0,0,0,-10, -10,0,5,5,5,5,0,-10, -5,0,5,5,5,5,0,-5, 0,0,5,5,5,5,0,-5, -10,5,5,5,5,5,0,-10, -10,0,5,0,0,0,0,-10, -20,-10,-10,-5,-5,-10,-10,-20],
    K: [-30,-40,-40,-50,-50,-40,-40,-30, -30,-40,-40,-50,-50,-40,-40,-30, -30,-40,-40,-50,-50,-40,-40,-30, -30,-40,-40,-50,-50,-40,-40,-30, -20,-30,-30,-40,-40,-30,-30,-20, -10,-20,-20,-20,-20,-20,-20,-10, 20,20,0,0,0,0,20,20, 20,30,10,0,0,10,30,20]
  };

  Game.prototype.evaluate = function () {
    var score = 0;
    for (var sq = 0; sq < 64; sq++) {
      var p = this.board[sq];
      if (p === '') continue;
      var t = p.toUpperCase();
      var idx = colorOf(p) === 'w' ? sq : (7 - rankOf(sq)) * 8 + fileOf(sq);
      var v = VAL[t] + PST[t][idx];
      score += colorOf(p) === 'w' ? v : -v;
    }
    return this.turn === 'w' ? score : -score;
  };

  function orderMoves(game, moves) {
    moves.sort(function (a, b) {
      var sa = a.captured ? VAL[a.captured.toUpperCase()] * 10 - VAL[a.piece.toUpperCase()] : 0;
      var sb = b.captured ? VAL[b.captured.toUpperCase()] * 10 - VAL[b.piece.toUpperCase()] : 0;
      if (a.promotion) sa += 900;
      if (b.promotion) sb += 900;
      return sb - sa;
    });
  }

  Game.prototype.search = function (depth, alpha, beta) {
    if (depth === 0) return this.evaluate();
    var moves = this.legalMoves(this.turn);
    if (moves.length === 0) {
      if (this.inCheck(this.turn)) return -100000 - depth;
      return 0;
    }
    orderMoves(this, moves);
    var best = -Infinity;
    for (var i = 0; i < moves.length; i++) {
      this.make(moves[i]);
      var sc = -this.search(depth - 1, -beta, -alpha);
      this.unmake();
      if (sc > best) best = sc;
      if (best > alpha) alpha = best;
      if (alpha >= beta) break;
    }
    return best;
  };

  Game.prototype.bestMove = function (depth, jitter) {
    var moves = this.legalMoves(this.turn);
    if (!moves.length) return null;
    orderMoves(this, moves);
    var best = -Infinity, bestMoves = [];
    for (var i = 0; i < moves.length; i++) {
      this.make(moves[i]);
      var sc = -this.search(depth - 1, -Infinity, Infinity);
      this.unmake();
      if (jitter) sc += Math.random() * jitter;
      if (sc > best + 0.001) { best = sc; bestMoves = [moves[i]]; }
      else if (Math.abs(sc - best) <= 0.001) bestMoves.push(moves[i]);
    }
    return bestMoves[Math.floor(Math.random() * bestMoves.length)];
  };

  function perft(game, depth) {
    if (depth === 0) return 1;
    var moves = game.legalMoves(game.turn), n = 0;
    for (var i = 0; i < moves.length; i++) {
      game.make(moves[i]);
      n += perft(game, depth - 1);
      game.unmake();
    }
    return n;
  }

  var api = { Game: Game, START_FEN: START_FEN, sqName: sqName, parseSq: parseSq, fileOf: fileOf, rankOf: rankOf, colorOf: colorOf, perft: perft };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.ChessEngine = api;
})(typeof window !== 'undefined' ? window : globalThis);
