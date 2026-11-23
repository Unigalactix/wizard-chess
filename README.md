# ♞ Wizard Chess

**The living stone game.** A playable take on wizard's chess: the pieces are
stone soldiers and royals who **walk the board on their own**, and when one
takes another, it does not go politely — the attacker strikes, the victim
**cracks and crumbles to rubble**. You watch from your own side of the board,
by candlelight.

## Play it

**Live:** https://unigalactix.github.io/wizard-chess/

**Repo:** https://github.com/Unigalactix/wizard-chess

Or open `index.html` in any browser — no build step, no server, no accounts.

## Command them

As in the stories, the pieces answer to orders. Type one into the command box:

- `knight to f3`
- `pawn takes e5`
- `e2 to e4`

…or just tap a piece and then a marked square.

## Modes

- **1 Player vs Computer** — play as Ivory (first) or Onyx (second), three
  difficulty levels (Easy / Medium / Hard).
- **2 Players — offline** — both sides on the same board, pass-and-play.

## Features

- Full chess rules: legal moves, check, checkmate, stalemate, castling,
  en passant, promotion (with a picker), fifty-move and insufficient-material draws.
- Living stone pieces, drawn from scratch as SVG characters — a foot-soldier
  pawn, a knight on horseback, a pointed-hat wizard (bishop), a tower guardian
  (rook), a queen and a bearded king — each with a face:
  - **determined** when you pick them, **focused** while walking,
  - **angry** when they strike, **scared** when cornered,
  - a **worried** king in check, **celebrating** winners and **dizzy** losers.
- Capture duels in close-up: the charge, the blow, the cracks, the crumble.
- Pieces walk square by square (knights hop), seen from a tilted,
  player-point-of-view board — your army in front of you, theirs down the hall.
- Animation speed control, tiny synthesized sound effects (WebAudio),
  move list in algebraic notation, captured-piece trays with material score,
  undo and board flip. Responsive down to phone size.

## How it works

- `engine.js` — a self-contained chess engine (move generation, legality,
  SAN notation, alpha-beta search with piece-square tables). Verified with
  perft: start position perft(3) = 8,902 and the Kiwipete position
  perft(3) = 97,862, both exact.
- `wizard.js` — the characters, rendering, animation choreography, the duel,
  the command parser and the computer player.
- `wizard.css` — the great-hall stone theme: slate and marble, walnut,
  candlelight and brass.

## Credit

A fan-made tribute to wizard's chess and to the classic animated chess game
Battle Chess (the reel that started this). No assets from either are used —
every character, colour and line of code here is new.
