# Pokémon Trading Card Game Pocket — Overview

> A comprehensive reference describing **what Pokémon Trading Card Game Pocket is made for** and **what players can do** in it. For battle mechanics see [`game-rule.md`](./game-rule.md); for the expansion and card inventory see [`cards.md`](./cards.md).

**Document status:** Research compiled mid-2026 from official and community sources (English and Japanese). PTCGP is a live-service game; numeric values (prices, timers, ranked tiers, trading costs, event line-ups) change with updates, and figures reflect commonly cited values at time of writing. Japanese in-game term names (ポケポケ is the game's own nickname) are included because the game is Japanese-first. Source URLs are at the end.

---

## 1. What PTCGP Is

**Pokémon Trading Card Game Pocket** (Japanese: ポケモンカードゲーム ポケット, nicknamed **「ポケポケ」/ "Poképoke"**, abbreviated **PTCGP**) is a free-to-play mobile game that reimagines the physical Pokémon Trading Card Game around two pillars: **collecting beautiful digital cards** and **playing fast, simplified strategic battles**.

| Attribute            | Detail                                                                                  |
| -------------------- | --------------------------------------------------------------------------------------- |
| **Genre**            | Digital collectible card game (CCG)                                                     |
| **Platforms**        | iOS and Android (smartphones and tablets)                                               |
| **Price model**      | Free-to-start, with optional in-app purchases                                           |
| **Developers**       | Creatures Inc. (original creators of the physical Pokémon TCG) and DeNA Co., Ltd.       |
| **Publisher**        | The Pokémon Company                                                                     |
| **Soft launch**      | New Zealand, September 26, 2024                                                         |
| **Worldwide launch** | October 30, 2024                                                                        |
| **Languages**        | Japanese (primary), English, and other locales                                          |
| **Connectivity**     | Always-online; account tied to a Pokémon Trainer Club / Nintendo / Google / Apple login |

### 1.1 The design intent — what it is made for

The game is built for **accessibility and short, repeatable daily enjoyment**, deliberately contrasting with the depth and time cost of the physical TCG and the older _Pokémon TCG Live_ client:

- **A low barrier to entry.** Battles use a stripped-down rule set — 20-card decks, no separate Energy cards, "first to 3 points wins" — so a newcomer can play a full match within minutes of installing, while deck-building still rewards strategy. See [`game-rule.md`](./game-rule.md).
- **Collecting as the core product.** The cards _are_ the game. PTCGP leans on nostalgia (reprinted classic Pokémon), exclusive new artwork, and motion/3D foil effects impossible in print — most famously **immersive cards (イマーシブ)**, whose animated artwork you can pan around in 3D as if you stepped inside the scene, sometimes with their own short cinematic and music.
- **A few minutes a day.** The free economy is metered (two free packs a day) so the intended loop is a short daily session — open packs, fill the dex, do missions, Wonder Pick, trade, and play a couple of battles — rather than a marathon. It is explicitly engineered for "bite-sized" play.

### 1.2 What it is _not_

- It is **not a real-money card marketplace**: there is no buying or selling of individual cards for cash, and no auction house. Cards come only from pack openings, Wonder Picks, trades with friends, in-game ticket exchanges, and events.
- It is **not the full physical TCG**: many mechanics (60-card decks, Prize cards, Energy cards, Resistance, Stadiums at launch) are removed or simplified.
- It is **not primarily a PvP esport** (though it has ranked play): the marketing and reward structure center on collecting first, competing second.

---

## 2. Cards

Cards are the fundamental unit of PTCGP — both the collectible and the thing you battle with. Every card belongs to one of two top-level classes: **Pokémon cards (ポケモンのカード)** and **Trainer cards (トレーナーズ)**. Crucially, **there are no Energy cards** — the physical TCG's Energy cards are replaced by the deck-level **Energy Zone** (see [`game-rule.md`](./game-rule.md)). All art variants of a card share identical battle stats; rarity is purely visual/collectible.

### 2.1 Kinds of cards (カードの種類)

**Pokémon cards** — placed in play, take damage, and attack:

| Kind                  | Japanese       | Description                                                                                                     |
| --------------------- | -------------- | --------------------------------------------------------------------------------------------------------------- |
| **Basic**             | たね           | Played directly from hand; the only Pokémon you can put into play without evolving.                             |
| **Stage 1**           | 1 進化         | Evolves from a specific Basic.                                                                                  |
| **Stage 2**           | 2 進化         | Evolves from a specific Stage 1. (Rare Candy can skip Stage 1 — see [`game-rule.md`](./game-rule.md).)          |
| **Baby Pokémon**      | ベビィポケモン | Basics with ~30 HP whose attacks and retreat cost **no Energy**; do not evolve. (From _Wisdom of Sea and Sky_.) |
| **Pokémon ex**        | ポケモンex     | Higher HP/damage, but a Knock Out gives the opponent **2 points** instead of 1. Can be Basic, Stage 1, or 2.    |
| **Mega Evolution ex** | メガシンカex   | Even stronger; a KO gives the opponent **3 points** (an instant loss). Introduced in the B-series Mega era.     |

Two modifiers can apply on top of a Pokémon card rather than being a separate kind:

- **Ultra Beast (ウルトラビースト / UB)** — a keyword tag on certain Pokémon that some cards interact with (introduced with _Extradimensional Crisis_).
- **Fossil** — technically an **Item** (see below) that is _played as_ a 40-HP Colorless Basic Pokémon that cannot retreat.

**Trainer cards (トレーナーズ)** — one-shot or ongoing effects; no HP, type, or attacks:

| Subtype          | Japanese         | Rule                                                                                            |
| ---------------- | ---------------- | ----------------------------------------------------------------------------------------------- |
| **Supporter**    | サポート         | **Only one per turn**, then discarded (e.g., Professor's Research, Sabrina, Misty).             |
| **Item**         | グッズ           | Any number per turn, then discarded (e.g., Poké Ball, Potion).                                  |
| **Pokémon Tool** | ポケモンのどうぐ | Attached to one Pokémon (max one per Pokémon); stays until that Pokémon leaves play. (From A2.) |
| **Stadium**      | スタジアム       | A field card affecting both players; one in play at a time, persists until replaced. (From B2.) |
| **Fossil**       | かせき           | An Item that becomes a Basic Pokémon in play (see above).                                       |

### 2.2 Types / elements (タイプ)

Each Pokémon card has exactly one of **10 types**, which also define the Energy costs of attacks. The mainline games' 18 types are consolidated into these 10 (e.g., Ice → Water, Ghost/Fairy → Psychic, Ground/Rock → Fighting, Bug → Grass, Poison → Grass or Darkness, Normal/Flying → Colorless, Steel → Metal).

| Type          | Japanese        | Symbol       | Typically weak to |
| ------------- | --------------- | ------------ | ----------------- |
| **Grass**     | 草 (くさ)       | green leaf   | Fire              |
| **Fire**      | 炎 (ほのお)     | red flame    | Water             |
| **Water**     | 水 (みず)       | blue droplet | Lightning         |
| **Lightning** | 雷 (かみなり)   | yellow bolt  | Fighting          |
| **Psychic**   | 超 (エスパー)   | purple orb   | Darkness          |
| **Fighting**  | 闘 (かくとう)   | orange fist  | Psychic           |
| **Darkness**  | 悪 (あく)       | teal eye     | Grass             |
| **Metal**     | 鋼 (はがね)     | silver gear  | Fire              |
| **Dragon**    | 竜 (ドラゴン)   | gold         | **none**          |
| **Colorless** | 無色 (むしょく) | white star   | Fighting          |

**How weakness works in PTCGP:**

- If an attack's type matches the defending Active Pokémon's printed Weakness, it deals a **flat +20 damage** (the physical TCG multiplies ×2).
- **There is no Resistance** in Pocket, and each Pokémon has **at most one Weakness**.
- Weakness is a **per-card value**, printed on the card. It almost always follows the convention above, but exceptions exist, so treat the table as the default rather than a strict chart.
- **Dragon** Pokémon have no Weakness (and nothing is weak to Dragon); their attacks characteristically require **two different Energy types**, so a Dragon deck must register multiple types in its Energy Zone.
- **Colorless** is not a generatable element — a Colorless cost symbol (used for generic costs and retreat) can be paid by **any** Energy type.

### 2.3 Anatomy of a card

A **Pokémon card** prints: **HP**; **type**; **evolution stage** (and what it evolves from); an optional **Ability (とくせい)** — an effect that is _not_ an attack and does not end the turn, either _active_ (used on demand) or _passive_ (always on); **1–2 attacks (ワザ)**, each with an **Energy cost** (a row of type symbols), a **damage** number, and optional **effect text**; a **Weakness**; a **Retreat Cost** (Energy to discard to switch out); ex/Mega markers implying the KO point value; the **Ultra Beast** tag if applicable; **Pokédex data / flavor text** (mainly on full-art rarities); an **illustrator credit**; a **card number** (e.g., `036/226` = position / set base size — secret/parallel cards exceed the base count); a **rarity symbol**; and its **expansion and booster pack**.

A **Trainer card** prints instead: a **subtype banner** (Supporter / Item / Tool / Stadium / Fossil), **effect text**, and the same shared fields (number, rarity, illustrator, set/pack). Fossils additionally print an HP of 40 because they act as Pokémon in play.

### 2.4 Attacks, Abilities, and typical effects

Attacks cost Energy and (usually) end the turn; Abilities do not. Beyond flat damage, effects fall into recurring categories. Representative examples (verified numbers):

| Effect category             | Example card & move                                | Cost → damage              | Effect                                                                    |
| --------------------------- | -------------------------------------------------- | -------------------------- | ------------------------------------------------------------------------- |
| **Flat damage**             | Mewtwo ex — _Psychic Sphere_ (サイコスフィア)      | Psychic + Colorless → 50   | none                                                                      |
| **Coin-flip scaling**       | Marowak ex — _Bonemerang_ (ホネブーメラン)         | 2 Fighting → 80 ×heads     | Flip 2 coins; 80 damage per heads (0/80/160).                             |
| **Board-state scaling**     | Pikachu ex — _Circle Circuit_ (サーキットサークル) | 2 Lightning → 30 ×bench    | 30 damage per Benched Lightning Pokémon (max 90).                         |
| **Energy acceleration**     | Moltres ex — _Inferno Dance_ (ability)             | —                          | Flip 3 coins; attach that many Fire Energy from the Zone to Benched Fire. |
| **Energy accel (Trainer)**  | Misty (Supporter)                                  | —                          | Flip a coin until tails; attach 1 Water Energy per heads.                 |
| **Self-discard / recoil**   | Charizard ex — _Crimson Storm_ (くれないの嵐)      | 2 Fire + 2 Colorless → 200 | Discard 2 Fire Energy from this Pokémon.                                  |
| **Status infliction**       | Wigglytuff ex / Vileplume-type "Sleep" attacks     | varies                     | Makes the opponent's Active **Asleep / Poisoned / Paralyzed**, etc.       |
| **Bench / spread damage**   | Darkrai ex — _Nightmare Aura_ (ability)            | —                          | 20 damage to the opponent's Active each time Darkness Energy is attached. |
| **Healing (Trainer)**       | Erika (Supporter) / Potion (Item)                  | —                          | Heal 50 (Erika, Grass) / 20 (Potion) damage.                              |
| **Draw / search (Trainer)** | Professor's Research / Poké Ball                   | —                          | Draw 2 cards / put a random Basic from deck into hand.                    |
| **Switch / gust (Trainer)** | Sabrina (ナツメ) / Cyrus (アカギ)                  | —                          | Force the opponent to swap Active / drag a damaged Benched Pokémon up.    |
| **Damage buff (Trainer)**   | Giovanni (サカキ) / Red (レッド)                   | —                          | +10 damage this turn / +20 vs. Pokémon ex this turn.                      |

> Status conditions inflicted by attacks resolve during the **Pokémon Checkup**; see [`game-rule.md`](./game-rule.md) for exact resolution (note: Confusion in Pocket causes the attack to fail on tails with **no self-damage**).

### 2.5 Rarity, variants, and foil

Every card shows a **rarity symbol in the lower-left corner** (beneath the illustrator credit). From most common to rarest:

| Tier                         | Symbol | Japanese           | What it is                                                                                             |
| ---------------------------- | ------ | ------------------ | ------------------------------------------------------------------------------------------------------ |
| Common                       | ◇      | ダイヤ1            | Basic Pokémon, basic Trainers — the floor of every pack                                                |
| Uncommon                     | ◇◇     | ダイヤ2            | Stage 1 Pokémon, some Basics/Trainers                                                                  |
| Rare                         | ◇◇◇    | ダイヤ3            | Stage 2 and higher-power Pokémon                                                                       |
| Double Rare                  | ◇◇◇◇   | ダイヤ4            | **Pokémon ex** in standard art; art begins to push past the frame                                      |
| Illustration Rare / Full Art | ☆      | star1              | Full-art version of a non-ex Pokémon — the first true "chase" tier                                     |
| Ultra Rare / Special Art     | ☆☆     | star2              | Full-art **ex** and full-art **Supporters**; includes special-illustration ("rainbow border") variants |
| Immersive                    | ☆☆☆    | star3 (イマーシブ) | Animated, interactive art you can pan around in 3D; the showpiece unique to Pocket                     |
| Shiny Rare                   | ✸      | シャイニー1        | Special illustration of a **Shiny** non-ex Pokémon (added in Shining Revelry / A2b)                    |
| Shiny Ultra Rare             | ✸✸     | シャイニー2        | Special illustration of a **Shiny ex** Pokémon                                                         |
| Crown Rare                   | ♛      | クラウン           | The single rarest tier — gold/"hyper rare" full-art cards                                              |

**Actual rarity order (rarest → least, post-Shining Revelry):**
♛ Crown → ☆☆☆ Immersive → ✸✸ 2-Shiny → ☆☆ 2-Star → ✸ 1-Shiny → ☆ 1-Star → ◇◇◇◇ → ◇◇◇ → ◇◇ → ◇.
(A 2-Star special-illustration card is individually rarer than a 3-Star immersive in pull terms.)

**Pull rates in a standard 5-card pack** — rarity is rolled **per card slot**; slots 1–3 are always Common, and slot 5 has the most generous odds:

| Rarity                 | Cards 1–3 | Card 4 | Card 5  |
| ---------------------- | --------- | ------ | ------- |
| ◇ Common               | 100%      | 0%     | 0%      |
| ◇◇ Uncommon            | 0%        | 90%    | 60%     |
| ◇◇◇ Rare               | 0%        | 5%     | 20%     |
| ◇◇◇◇ Double Rare (ex)  | 0%        | ~1.67% | ~6.66%  |
| ☆ 1-Star               | 0%        | ~2.57% | ~10.29% |
| ☆☆ 2-Star              | 0%        | 0.5%   | 2%      |
| ☆☆☆ 3-Star (Immersive) | 0%        | ~0.22% | ~0.89%  |
| ✸ 1-Shiny              | 0%        | ~0.71% | ~2.86%  |
| ✸✸ 2-Shiny             | 0%        | ~0.33% | ~1.33%  |
| ♛ Crown                | 0%        | ~0.04% | ~0.16%  |

- **Rare Packs ("God Packs"):** ~**0.05% (1 in 2,000)** of packs open with **all 5 cards at ☆ (1-Star) or higher** — no diamond cards at all.
- **Pack Points:** every opening earns Pack Points, redeemable for specific named cards (a chase ☆☆ costs ~1,350; higher tiers ~1,500) — a pity/targeting system, earned and spent per expansion.
- **Variants worth distinguishing:** the same Pokémon has a base ◇ printing plus higher-rarity **parallels** (full-art, immersive, Crown) at card numbers above the set base; **parallel foil** cards were introduced in _Deluxe Pack: ex_ (A4b); **promo** cards come from events/shop and cannot be traded; **flair** and animation are per-owned-copy cosmetics distinct from card identity.

> The per-set inventory of which specific cards exist at each rarity is in [`cards.md`](./cards.md).

### 2.6 A structured data model

The above maps cleanly onto typed models, useful for any later tooling (a card database, deck builder, or collection tracker):

```ts
type EnergyType =
  | "Grass"
  | "Fire"
  | "Water"
  | "Lightning"
  | "Psychic"
  | "Fighting"
  | "Darkness"
  | "Metal"
  | "Dragon"
  | "Colorless";

type Rarity =
  | "◇"
  | "◇◇"
  | "◇◇◇"
  | "◇◇◇◇" // Diamond tiers
  | "☆"
  | "☆☆"
  | "☆☆☆" // Star tiers (☆☆☆ = immersive)
  | "✸"
  | "✸✸" // Shiny tiers
  | "♛"; // Crown

type PokemonStage = "Basic" | "Stage1" | "Stage2";
type TrainerSubtype =
  | "Supporter"
  | "Item"
  | "PokemonTool"
  | "Stadium"
  | "Fossil";

interface CardBase {
  id: string; // e.g. "A1-036"
  name: string;
  nameJa?: string;
  setCode: string; // "A1", "A1a", "B1", ...
  numberInSet: number; // 36
  setBaseSize: number; // 226 (secrets exceed this)
  rarity: Rarity;
  illustrator: string;
  packs?: string[]; // pack-exclusivity, e.g. ["Charizard"]
  isPromo: boolean;
  isParallelFoil?: boolean;
  flairSupported: boolean;
}

interface Attack {
  name: string;
  nameJa?: string;
  cost: EnergyType[]; // ["Fire","Fire","Colorless","Colorless"]
  damage: number | null; // null when the attack prints no fixed number
  effect?: string; // rules text
}

interface Ability {
  name: string;
  nameJa?: string;
  trigger: "active" | "passive";
  effect: string;
}

interface PokemonCard extends CardBase {
  kind: "Pokemon";
  pokedexNumber: number;
  type: EnergyType;
  hp: number;
  stage: PokemonStage;
  evolvesFrom?: string;
  isEx: boolean;
  isMegaEx: boolean; // KO worth 3 points
  isUltraBeast: boolean;
  isBaby: boolean;
  weakness: EnergyType | null; // +20 damage; null for Dragon
  retreatCost: number; // Energy discarded to switch out
  koPoints: 1 | 2 | 3; // 1 normal, 2 ex, 3 Mega ex
  ability?: Ability;
  attacks: Attack[]; // 0–2
  flavorText?: string;
}

interface TrainerCard extends CardBase {
  kind: "Trainer";
  subtype: TrainerSubtype;
  effect: string;
  // Fossils act as a Pokémon once played:
  fossilInPlay?: { hp: 40; type: "Colorless"; canRetreat: false };
}

type Card = PokemonCard | TrainerCard;
```

---

## 3. The Collecting Experience (the central activity)

### 3.1 Opening booster packs (パック開封)

- **Pack contents.** Each booster pack contains **5 cards**. Card rarity is rolled **per slot**: slots 1–3 are always the lowest rarity, while **slot 5 has the most generous odds** for rare pulls. (Full rarity ladder and pull-rate table are in [`cards.md`](./cards.md).)
- **Choosing a pack.** Most expansions split into multiple themed booster packs — e.g., the launch set offered **Charizard / Mewtwo / Pikachu** packs — and you choose which to open. Some cards are **pack-exclusive**, so collectors target specific packs.
- **The free pack economy — Pack Power & Pack Hourglasses.**
  - Free packs are gated by a regenerating gauge (**パックパワー / "Pack Power"**). It refills **one pack roughly every 12 hours** and **stocks a maximum of two**, so the design nudges you to log in about twice a day; leaving two banked stalls further regeneration.
  - **Pack Hourglasses (パック砂時計)** are consumable items that each cut the timer by **1 hour**; spending **12** opens a pack immediately. They come from missions, level-ups, events, the shop, and the Premium Pass — there is no daily cap on spending them.
- **No way to "read" a pack in advance.** The 5-card result is determined when you open; there is no reliable method to detect a jackpot pack beforehand.

### 3.2 Rare Packs / "God Packs" (レアパック / 神パック)

- Roughly **0.05% (about 1 in 2,000)** of openings trigger a **Rare Pack**, in which **all 5 cards are ☆ (one-star) rarity or higher** — i.e., entirely full-art, special-art, immersive, shiny, or crown cards, with no diamond commons at all. This is the collecting jackpot.

### 3.3 Wonder Pick (ワンダーピック)

A signature, social-flavored acquisition feature:

- When another player (a **friend**, or a featured/random player) opens a pack, that pack can surface in your **Wonder Pick** feed. Its 5 cards are shown, then **shuffled face-down**, and you **pick one at random to keep for free**.
- Picking costs **Wonder Stamina (ワンダーピックスタミナ)**, which refills over time; **Challenge/Wonder Hourglasses** shave an hour off the refill, and stamina can be topped up with Poké Gold.
- Friends' packs tend to appear near the top of your feed, raising the chance their pulls are picked. Your **wishlisted** and **already-owned** cards are flagged in the picker so you can chase what you need.
- After someone Wonder-Picks from your pack they can send a **"Thanks!" (ありがとう!)**, which awards you **Shop Tickets**.
- The very highest rarities are generally excluded from Wonder Pick pools, but high-value cards (including from god packs) can appear.

### 3.4 Tracking and completing the collection

- **Card dex / Card File (図鑑 / カードファイル).** A per-expansion list shows which cards you **own vs. are missing**, your **completion percentage**, and grants rewards for collection milestones. Completing major dex goals can award chase cards (e.g., the Genetic Apex **Mew** immersive is a Kanto-dex completion reward).
- **Wishlist.** Heart cards you are hunting; the flag then appears across pack results and Wonder Picks.
- **Pack Points (パックポイント).** Every pack opening earns Pack Points, redeemable for **specific named cards** — a pity/targeting mechanism that guarantees chase cards eventually (a 2-star costs roughly 1,350 points; higher tiers ~1,500). Pack Points are earned and spent **per expansion**.

### 3.5 Customizing and showing off cards

- **Flair (フレア).** Cosmetic effects attached to a specific card. There are two kinds: **Cosmetic Flair** (shown in your binder/board/in play) and **Battle Flair** (an effect when the card enters play). Flair is bought with **duplicate cards + Shinedust (ひかりのすな)**; cost scales by rarity (≈50 Shinedust for a 1-diamond card up to 20,000+ for a Crown). Most cards support up to 4 flairs. A flaired card can only be traded for another flaired card.
- **Motion & 3D viewing.** Cards respond with parallax/holo motion when you tilt the device; the top tiers are 3D-modelled (☆☆) or fully animated and pannable (☆☆☆ immersive).
- **Display Boards & Community Showcase.** From **Level 4** you can build a **Display Board** — a chosen backdrop with featured card(s) and flair — and set it **public or private**. Public boards appear in the **Community Showcase**, where likes from other players can earn you Shop Tickets. Backdrops range from free (e.g., "Sleek Frame," "Eevee") to premium (bought with special tickets). **Binders** are an additional way to organize and view the collection.

> Note: PTCGP does not implement traditional physical-style "sleeves/deck boxes" as a separate collection system — Display Boards, backdrops, binders, and flair are the showcase/customization equivalents.

---

## 4. Battling

### 4.1 Game modes

- **Solo (ひとりで) — vs. CPU.** Tutorials and beginner battles, plus:
  - **Solo Battle Events** — structured, story-like ladders with **Battle Tasks** that grant packs, hourglasses, promo cards, and cosmetics.
  - **Solo Random Battles** — face CPU opponents using randomly generated decks.
  - **Auto-battle** is available in solo play for grinding task rewards.
- **Versus (だれかと) — PvP.** Online matchmaking against other players, plus **private matches** with friends set up via a **shared password** (both players enter the same short password within ~30 seconds). Private matches grant account XP.
- **Ranked Match (ランクマッチ).** A competitive seasonal ladder — see §4.2.
- **Event battles.** Rotating limited-time content: Solo Battle Events, **Drop Events** (item drops scaled to difficulty), **Emblem Events**, Mass Outbreaks, and special **Wonder Pick events**, awarding promo cards, currency, and cosmetics.

### 4.2 Ranked Match in detail

- **Introduced** in late March 2025; runs in **seasons** (roughly monthly; early Series A seasons ran ~1 month, later ones shorter).
- **Rank ladder:** **Beginner → Poké Ball → Great Ball → Ultra Ball → Master Ball** (ビギナー〜マスターボール). Each rank below Master Ball is split into **4 tiers** (~17 steps total); **Master Ball** is a single open-ended tier measured by Rank Points (RP).
- **Scoring:** roughly **+10 RP per win**, with **consecutive-win bonuses**; losses cost RP at higher ranks.
- **Loss protection:** from the bottom rank up through roughly **Great Ball 1**, a loss does **not** subtract RP, and you cannot drop below those floors.
- **Leaderboard:** top Master Ball players (e.g., top ~10,000 by RP) get a displayed ranking. Master Ball cutoffs vary by season.
- **Rewards:** playing at least one ranked battle in a season qualifies you for end-of-season rewards — **Pack Hourglasses, Shinedust, and exclusive rank emblems** — scaling with the rank reached.

### 4.3 Deck-building tools

- **Deck builder.** Construct a legal **20-card** deck (max 2 copies per card name, ≥1 Basic Pokémon) and **register the Energy type(s)** (up to 3) the Energy Zone will generate. See [`game-rule.md`](./game-rule.md) for construction rules.
- **Auto-build (おまかせ).** Pick one or two types and the game assembles the strongest legal deck it can from cards you already own (including a handful of Trainers).
- **Sample / rental decks.** Pre-built decks playable **even without owning the cards**, used to teach the game and demonstrate archetypes (e.g., a Ralts → Gardevoir energy-acceleration deck feeding Mewtwo ex).

### 4.4 In-battle interface notes

- **Turn timer** (~90 seconds) and **match turn caps** (30 in PvP, 50 in solo) keep games short.
- **Concede/surrender** is available almost any time (some players intentionally concede early to farm battle-count rewards).
- **No in-battle chat, emotes, or stickers.** The only lightweight social signals are the post-action "Thanks!" and liking boards/cards.

---

## 5. Social Features

- **Friends (フレンド).** Add via a numeric **Friend ID**, after a PvP match, or after Wonder-Picking from someone's pack. Friends populate your Wonder Pick feed and are required for trading. The Battle Hub and trading unlock at **player Level 3**.
- **Trading (トレード).** Trade cards with friends, subject to rules:
  - Both players must be **friends** and at least **Level 3**.
  - **Both offered cards must be the same rarity.** If one has flair, the other must too.
  - **Promo cards cannot be traded**, and the highest "chase" rarities (Crown, immersive, etc.) remain restricted; the tradeable rarity range has **expanded over time** (e.g., 2-Star and Shiny cards from older sets became tradeable in late 2025).
  - Each trade consumes **Trade Stamina / Trade Power (トレードパワー)** — naturally maxing around 5, recovering ~1/day — and, for higher rarities, **Shinedust**.
  - **History note:** higher-rarity trading originally required **Trade Tokens / Trade Medals (トレードメダル)** earned by destroying duplicates, a system widely criticized as costly. On **July 30, 2025** Trade Tokens were **removed** and replaced with **Shinedust (ひかりのすな)**; leftover tokens converted to Pack Hourglasses/Shinedust. (Exact Shinedust costs per rarity are listed in [`cards.md`](./cards.md).)
- **Showcases & likes.** Public Display Boards and binders can be browsed and liked by friends and the community; "Thanks!" and likes both feed back small currency rewards.

---

## 6. Monetization (what real money does)

PTCGP is free to play; spending **accelerates collecting and unlocks cosmetics**, and never sells competitive power directly or individual cards for cash (all card art variants have identical battle stats).

- **Poké Gold (ポケゴールド)** — the premium currency, bought with real money. Tiers run from about **$0.99 / a few hundred yen** at the bottom to roughly **$99.99 / ¥10,000+** at the top, with better per-unit value in larger bundles. Poké Gold buys booster packs, **Pack/Wonder Hourglasses**, Wonder Pick stamina, shop bundles, cosmetics, and the Premium Pass. (It can also be spent directly to speed the pack timer — 1 Poké Gold ≈ −2 hours.)
- **Premium Pass (プレミアムパス)** — a monthly subscription (about **$9.99 / ¥980**, regional equivalents; ~14-day free trial). Benefits:
  - **One extra daily pack** from a dedicated, separate pack gauge (≈30 extra packs/month — the cheapest per-pack rate in the game).
  - **Premium Missions (プレミアムミッション)** — monthly tasks granting extra Pack/Wonder Hourglasses and **Premium Tickets**.
  - **Premium Shop access** — exclusive promo cards and cosmetics (sleeves, playmats, coins, deck covers, backdrops) bought with Premium Tickets.
- **Other in-game currencies** (mostly earned, not bought):
  - **Pack Hourglasses** / **Wonder (Challenge) Hourglasses** — speed the pack / Wonder Pick timers.
  - **Shop Tickets (ショップチケット)** — from Wonder Pick "Thanks," missions, likes; buy hourglasses, accessories, promos.
  - **Pack Points** — from opening packs; redeem for specific cards.
  - **Shinedust (ひかりのすな)** — from duplicates; used for flair and high-rarity trading.
  - **Premium Tickets** — Premium Pass shop currency.
  - **Emblem Tickets** — historically earned via dex/themed-collection missions for profile emblems; **this system was discontinued around the Pulsing Aura (B3) update**, after which emblems are earned by collecting a set quota of cards.

---

## 7. Progression & the Daily Loop

- **Daily missions (デイリーミッション).** Reset daily (≈15:00 JST / overnight in other regions); completing several grants bonus rewards (Pack Hourglasses, EXP, Shinedust, items). Most complete passively through normal play.
- **Player level / EXP.** Earned mainly from battles and play (no stamina cost to battle). Leveling unlocks features (**Level 3:** Battle Hub + trading; **Level 4:** Display Boards) and grants hourglasses.
- **Login bonuses & the Complimentary Item Set.** A free daily grant (a Wonder Hourglass + a Shop Ticket) plus event-based login bonuses provide steady drip rewards.
- **Events.** Solo Battle Events, Drop Events, Emblem Events, themed collection challenges, and Wonder Pick events rotate continuously, supplying promo cards, currency, and cosmetics.
- **Expansion cadence.** New sets arrive on a steady schedule — roughly **a major expansion every ~3 months with a smaller mini-set about six weeks later** (~4 major sets per year) — each adding cards, missions, events, and frequently new mechanics (Tools, Baby Pokémon, Stadiums, Mega Evolution). The full chronology is in [`cards.md`](./cards.md).

### A representative day

Claim the day's free packs and the Complimentary Item Set → open packs (hoping for a Rare Pack) → fill missing dex entries and redeem Pack Points → clear the 3 daily missions → Wonder Pick from friends → trade away duplicates for Shinedust value → play a few Ranked or event battles → tidy/show off the Display Board. A complete loop takes only a few minutes, by design.

---

## 8. Reception (brief)

PTCGP was an immediate commercial success — surpassing **100 million downloads** and **$500 million USD** in revenue within months of launch, and earning a Best Mobile Game nomination at The Game Awards 2024. (Detailed background/history is intentionally out of scope for this document.)

---

## Sources

- Wikipedia — Pokémon Trading Card Game Pocket: <https://en.wikipedia.org/wiki/Pok%C3%A9mon_Trading_Card_Game_Pocket>
- Official site: <https://tcgpocket.pokemon.com/en-us/>
- Bulbapedia — Pokémon Trading Card Game Pocket: <https://bulbapedia.bulbagarden.net/wiki/Pok%C3%A9mon_Trading_Card_Game_Pocket>
- Pokémon Support — Gameplay FAQ / Trading FAQ / Purchase & Premium Pass FAQ: <https://support.pokemon.com/hc/en-us/articles/30330309361172>
- Pokémon.com — Guide to Collecting Cards & Wonder Picks: <https://www.pokemon.com/us/strategy/a-guide-to-collecting-cards-and-using-wonder-picks-in-pokemon-trading-card-game-pocket>
- Game8 (EN) — Battle System, Wonder Pick, Pack Hourglasses, Rare Packs, Ranked, Trading, Currencies, Premium Pass guides: <https://game8.co/games/Pokemon-TCG-Pocket>
- Game8 (JP) / GameWith (JP) / altema (JP) — 遊び方・できること, パック砂時計, トレード, ランクマッチ, プレミアムパス: <https://game8.jp/pokemon-tcg-pocket> · <https://gamewith.jp/pokemon-tcg-pocket>
- Pokémon Zone — How to Play, Trading, In-Game Economy, Premium Pass: <https://www.pokemon-zone.com/articles/how-to-play-pokemon-tcg-pocket/>
- ptcgpocket.gg — Rare Packs, Expansions, Premium Pass, Trading update: <https://ptcgpocket.gg/>
