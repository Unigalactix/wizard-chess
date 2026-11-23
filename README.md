# ♞ Colour Chess

**Battle Chess, in colour.** An original, fan-made tribute to the classic animated
chess game — rebuilt from scratch in vanilla JavaScript. The pieces are little
characters on coloured discs that **idle and bob in place, walk square by square**
across the board, and **duel when they capture**.

![style](https://img.shields.io/badge/style-rainbow%20board%20%E2%80%A2%20Sun%20vs%20Moon-8b5cf6)

## Play it

**Live:** https://unigalactix.github.io/colour-chess/

Or open `index.html` in any browser — no build step, no server, no accounts.

## Modes

- **1 Player vs Computer** — play as Sun (first) or Moon (second), three
  difficulty levels (Easy / Medium / Hard).
- **2 Players — offline** — both sides on the same board, pass-and-play.

## Features

- Full chess rules: legal moves, check, checkmate, stalemate, castling,
  en passant, promotion (with a picker), fifty-move and insufficient-material draws.
- Battle-Chess-style actions:
  - pieces **walk** their path square by square (knights hop),
  - **capture duels** — the attacker lunges, the victim shakes, sparks fly, it falls,
  - idle bobbing, last-move and check highlights, legal-move dots and capture rings.
- Animation speed control — including a loving "Battle Chess slow" setting.
- Tiny synthesized sound effects (WebAudio, no audio files).
- Move list in algebraic notation, captured-piece trays with material score.
- Undo, board flip, responsive layout for phones.

## How it works

- `engine.js` — a self-contained chess engine (move generation, legality,
  SAN notation, alpha-beta search with piece-square tables). Verified with
  perft: start position perft(3) = 8,902 and the Kiwipete position
  perft(3) = 97,862, both exact.
- `app.js` — rendering, animation choreography, game flow and the computer player.
- `style.css` — the rainbow frame, pastel/violet board and the Sun (gold) vs
  Moon (blue-violet) armies.

## Credit

Inspired by a reel of the original *Battle Chess* playing on a CRT monitor.
No assets from the original game are used — every glyph, colour and line of
code here is new.
