# PTCGP Card Data — Genetic Apex (A1)

This folder holds machine-readable card data for Pokémon TCG Pocket, designed to be parsed and reused. It follows the card model described in [`../overview.md`](../overview.md) §2.

## File: `genetic-apex-a1.jsonl`

- **Format:** [JSON Lines](https://jsonlines.org/) — one card object per line, UTF-8, newline-terminated. Parse by reading line by line and `JSON.parse`-ing each line.
- **Contents:** all **286** cards of the first expansion, **Genetic Apex (A1 / 最強の遺伝子)**, in card-number order (`#1`–`#286`). 267 Pokémon + 19 Trainer cards.
- **Source:** the community card database at `dotgg.gg` (fetched 2026-07). Card game text is quoted from that source.

### Scope notes

- The data source also lists two out-of-range rows (`#328` Erika, `#334` Giovanni) under A1; these are promo/reprint entries outside the 286-card set and are **excluded**.
- All **art/rarity variants of a card share identical battle stats** — e.g., Charizard ex exists as `◇◇◇◇`, `☆☆`, `☆☆☆`, and `♛` separate entries with the same HP/attacks.
- Some fields are intentionally present but empty in this set (`null`/`false`); they are **reserved for extensibility** so the same schema serves later expansions (see the last section).

## Schema

### Top-level fields (every card)

| Field          | Type           | Notes                                                                       |
| -------------- | -------------- | --------------------------------------------------------------------------- |
| `id`           | string         | Stable key, `"A1-280"`.                                                     |
| `set`          | object         | `{ code, name, nameJa }` — e.g., `A1` / Genetic Apex / 最強の遺伝子.        |
| `number`       | integer        | Card number within the set (1–286).                                         |
| `setSize`      | integer        | Base set size (286).                                                        |
| `name`         | object         | `{ en, ja }` — `ja` is `null` here (see reserved fields).                   |
| `rarity`       | object         | `{ symbol, code, label }` — see the rarity enum below.                      |
| `category`     | string         | `"Pokemon"` or `"Trainer"`.                                                 |
| `pokemon`      | object \| null | Present when `category = "Pokemon"`, else `null`.                           |
| `trainer`      | object \| null | Present when `category = "Trainer"`, else `null`.                           |
| `illustrator`  | string \| null | Art credit.                                                                 |
| `boosterPacks` | array \| null  | Which pack(s) yield it (Charizard/Mewtwo/Pikachu). `null` = not in source.  |
| `flavorText`   | string \| null | Pokédex-style text. `null` = not in source.                                 |
| `shop`         | object         | `{ packPoints, dupeShinedust }` — Pack-Point cost and Shinedust dupe value. |
| `source`       | object         | `{ provider, slug }` — provenance.                                          |

### `pokemon` object

| Field            | Type             | Notes                                                            |
| ---------------- | ---------------- | ---------------------------------------------------------------- |
| `type`           | string           | One of the ten energy types (enum below).                        |
| `hp`             | integer          | Hit points.                                                      |
| `stage`          | string           | `"Basic"`, `"Stage1"`, or `"Stage2"`.                            |
| `evolvesFrom`    | string \| null   | Name of the required lower stage; `null` for Basics.             |
| `ruleBox`        | string           | `"None"` or `"ex"` (open enum — extensible to `MegaEx`, `V`, …). |
| `isBaby`         | boolean          | Baby Pokémon flag (all `false` in A1).                           |
| `classification` | string \| null   | `UltraBeast` / `Ancient` / `Future` / `null` (all `null` in A1). |
| `weakness`       | string \| null   | Energy type that deals +20; `null` if none (Dragon).             |
| `retreatCost`    | integer          | Energy to discard to switch out.                                 |
| `abilities`      | array of Ability | Usually 0 or 1.                                                  |
| `attacks`        | array of Attack  | 0–2.                                                             |

### `trainer` object

| Field     | Type   | Notes                                                                                                   |
| --------- | ------ | ------------------------------------------------------------------------------------------------------- |
| `subtype` | string | `"Supporter"`, `"Item"` (open enum: `PokemonTool`, `Stadium`, `Fossil`). Fossils appear here as `Item`. |
| `text`    | string | Rules text.                                                                                             |

### `Attack` object

| Field          | Type            | Notes                                                                                                 |
| -------------- | --------------- | ----------------------------------------------------------------------------------------------------- |
| `name`         | object          | `{ en, ja }`.                                                                                         |
| `cost`         | array of string | Energy types required, e.g., `["Fire","Fire","Colorless","Colorless"]`. Empty array = no Energy cost. |
| `damage`       | integer \| null | Base printed damage; `null` for effect-only attacks.                                                  |
| `damageSuffix` | string \| null  | `"+"` (does more under a condition) or `"×"` (per heads/count); else `null`.                          |
| `text`         | string \| null  | Effect text (energy symbols kept in `{X}` notation).                                                  |

### `Ability` object

| Field  | Type   | Notes         |
| ------ | ------ | ------------- |
| `name` | object | `{ en, ja }`. |
| `text` | string | Effect text.  |

## Enumerations

**Energy types (`type`, `weakness`, `cost` entries):** Grass, Fire, Water, Lightning, Psychic, Fighting, Darkness, Metal, Dragon, Colorless. (Note: there is no Dragon energy — Dragon attacks cost other types; Colorless costs accept any energy.)

**Rarity (`rarity.code` → `symbol` / `label`):**

| Code    | Symbol | Label            | In A1 |
| ------- | ------ | ---------------- | ----- |
| `C`     | ◇      | Common           | 100   |
| `U`     | ◇◇     | Uncommon         | 71    |
| `R`     | ◇◇◇    | Rare             | 42    |
| `RR`    | ◇◇◇◇   | Double Rare (ex) | 15    |
| `AR`    | ☆      | Art Rare         | 24    |
| `SR`    | ☆☆     | Super Rare       | 23    |
| `SAR`   | ☆☆     | Special Art Rare | 6     |
| `IM`    | ☆☆☆    | Immersive Rare   | 4     |
| `Crown` | ♛      | Crown Rare       | 3     |

(Shiny tiers `✸` / `✸✸` do not appear until Shining Revelry / A2b.)

**`stage`:** Basic, Stage1, Stage2 · **`ruleBox`:** None, ex · **`trainer.subtype`:** Supporter, Item.

## Reserved / extensible fields

These are modeled now so the identical schema scales to later sets and richer sourcing, even though they are empty for A1:

- `name.ja` and attack/ability `name.ja` — Japanese names (the source is English-only).
- `boosterPacks` — pack-exclusivity, not exposed by the source.
- `flavorText` — not exposed by the source.
- `pokemon.classification` — `UltraBeast` arrives in A3a; `Ancient`/`Future` in B3a.
- `pokemon.isBaby` — Baby Pokémon arrive in A4.
- `pokemon.ruleBox` and `trainer.subtype` are **open enumerations**: later sets add `MegaEx`, `PokemonTool`, `Stadium`, etc.
