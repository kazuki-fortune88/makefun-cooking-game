# Ember & Egg — Twilight Kitchen

[![make.fun](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/kazuki-fortune88/makefun-cooking-game/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/kazuki-fortune88/makefun-cooking-game/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)

A night-market cooking game: one chef, one wok, a hungry crowd. Built for the
[make.fun best cooking game bounty](https://make.fun/bounty/best-cooking-game-20261125-0137)
— play it free via [make.fun/r/4fxhr3y1](https://make.fun/r/4fxhr3y1).

## The game

You run a street-food stall at a twilight night market. Tickets appear on the
order board with a patience bar that drains away. Grab ingredients from the
crates, chop chicken, tomato and chili on the board, fry egg, noodle and chicken
in the wok (don't let it burn!), stack food on a plate to match a ticket, and
serve it at the window before the customer walks away.

- **6 recipes** to combine: Sunny Rice Bowl, Ember Fried Rice, Chicken Noodle,
  Tomato Omelette, Chili Chicken Rice, Golden Noodle.
- **3-minute dinner shift** with a big countdown timer; RUSH HOUR hits in
  minutes 1 and 2 — orders arrive twice as fast with shorter patience.
- **Tips & combos**: fast serves earn tips; clean serves in a row raise your
  tip multiplier to x3.
- **Feel**: chopping sparks, wok steam and sizzle, coins bursting on a serve,
  and a synthesized WebAudio soundscape (chop, sizzle, order ding, coin
  jingle, pentatonic night-market music) — no audio files, M to mute.
- **Score screen** with 1–3 stars based on coins earned.

## How to play

- **Move**: WASD or arrow keys — or click anywhere to walk there.
- **Interact**: E, Space, or click a station to grab / use it. You carry one
  thing at a time.
- **Crates** (top left): Rice, Noodle, Egg, Chicken, Tomato, Chili.
- **Chop board**: chops chicken, tomato, chili (~1.5 s).
- **Wok**: cooks egg → fried egg, noodle → cooked noodle, chicken → grilled
  chicken (~4 s). Leave it ~9 s and it burns — toss it in the trash.
- **Plates**: stack up to 3 items; a plate that matches a ticket glows READY.
- **Serve window**: hand over a matching plate to earn coins + tip.
- **M** mute, **P** pause, **R** restart.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

Everything is static files under `game/` — no network requests, no build step.
Screenshots are staged deterministically with `?shot=cover|chop|rush|serve&seed=7`.

## License

MIT — see [LICENSE](LICENSE).
