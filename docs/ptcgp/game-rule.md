# Pokémon Trading Card Game Pocket — Complete Game Rules

> A detailed, corner-by-corner description of how a battle works in Pokémon Trading Card Game Pocket (PTCGP / ポケポケ). For what the game is and what players do, see [`overview.md`](./overview.md); for the card/expansion inventory, see [`cards.md`](./cards.md).

**Document status:** Research compiled mid-2026 from official rules pages and community references. PTCGP is a live game; some numeric values (turn timers, set-specific card classes) are added or tuned over time. Source URLs are at the end.

PTCGP uses a **deliberately simplified** version of the physical Pokémon Trading Card Game. The core loop is the same — set up Pokémon, attach Energy, attack, knock out the opponent — but deck size, the Energy system, the win condition, the board size, and several timing rules are streamlined. Throughout this document, differences from the physical TCG are flagged as **[vs. paper TCG]**.

---

## 1. Deck Construction

- **Deck size: exactly 20 cards.** **[vs. paper TCG: 60.]**
- **Maximum 2 copies of any card with the same name.** The limit is by **card name**, not by artwork or rarity — e.g., two "Pikachu" total across all of its variants. **[vs. paper TCG: 4 copies.]**
- **At least 1 Basic Pokémon is required.** In practice 5–6 Basics is recommended, because if your only in-play Pokémon is Knocked Out with no replacement available, you lose instantly.
- **Energy cards are NOT in the deck.** They are replaced entirely by the **Energy Zone** (see §5). A deck therefore contains only **Pokémon cards** and **Trainer cards**.
- **Energy types are registered during deck building.** You manually choose which Energy type(s) the Energy Zone will generate. A deck may register **up to 3 Energy types**. Fewer registered types = higher odds of drawing the exact Energy you need each turn (a single-type deck is fully predictable).

### Card categories

- **Pokémon cards**
  - **Basic Pokémon** — played directly from hand into play.
  - **Evolution Pokémon** — **Stage 1** and **Stage 2**; placed on top of the matching lower-stage Pokémon already in play.
  - **Baby Pokémon** (introduced in Wisdom of Sea and Sky / A4) — Basic Pokémon with low HP and no Weakness/Retreat cost.
- **Trainer cards**
  - **Supporter** — powerful effects; **only 1 per turn**.
  - **Item** — no per-turn limit.
  - **Pokémon Tool** (introduced in Space-Time Smackdown / A2) — attached to a Pokémon for an ongoing effect.
  - **Stadium** (introduced in Fantastical Parade / B2) — a field card affecting both players. **[Note: Stadiums did not exist at launch and were added later.]**

---

## 2. Win Condition — the Points System

- **You win by being the first to score 3 points.** **[vs. paper TCG: take all 6 Prize cards.]**
- Points are earned **only by Knocking Out** the opponent's Pokémon:
  | What is Knocked Out | Points awarded |
  | --- | --- |
  | Regular Pokémon | **1 point** |
  | Pokémon **ex** | **2 points** |
  | **Mega Evolution Pokémon ex** | **3 points** (a single KO wins the game) |
- **No Prize cards and no deck-out loss.** Running out of cards to draw does **not** lose you the game — you simply cannot draw and play continues. **[vs. paper TCG: decking out is a loss.]**
- **Alternate loss condition:** if your **Active Pokémon is Knocked Out and you have no Benched Pokémon to promote** into the Active spot, you lose immediately, regardless of points.
- **Conceding:** a player may surrender at any time, giving the opponent the win.
- **Time/turn-limit resolution:** if neither player reaches 3 points before the match limit (see §9), the player with **more points** wins.
- **Simultaneous-KO edge case:** if both players would reach 3 points at the same instant (e.g., a double KO), the winner is whoever **still has Pokémon remaining on the Bench**. True draws are rare.

---

## 3. Game Setup

- **Starting hand: 5 cards.** **[vs. paper TCG: 7.]**
- **No mulligans.** The game **guarantees at least 1 Basic Pokémon** in every opening hand, so the physical mulligan rule is unnecessary.
- **Hand size cap: 10 cards.** **[vs. paper TCG: no hand limit.]** Drawing past 10 is restricted.
- **Who goes first:** decided by a **coin flip**.
- **Board layout:**
  - **1 Active Pokémon** — the only Pokémon that can attack or be attacked.
  - **Up to 3 Benched Pokémon.** **[vs. paper TCG: 5.]** Maximum 4 Pokémon in play at once.
- During setup, each player secretly places one Basic Pokémon as their Active Pokémon and may place additional Basics on the Bench.

---

## 4. Turn Structure (exact order)

Each turn proceeds as follows:

1. **Draw step — draw 1 card.**
   - **Exception:** the player who goes **first does NOT draw on Turn 1**. The second player draws normally on their first turn. **[vs. paper TCG.]**
   - If the deck is empty, you skip drawing and do **not** lose.

2. **Energy generation (Energy Zone).** One Energy becomes available for the turn.
   - **Exception:** the player going **first generates NO Energy on Turn 1** — they cannot attach Energy until their second turn. The second player gets Energy on their first turn.

3. **Main phase — take the following actions in any order, as many as allowed:**
   - **Play Basic Pokémon** from hand to open Bench slots (up to the 3-Bench limit).
   - **Evolve** Pokémon (see restrictions below).
   - **Attach Energy:** attach the turn's single Energy from the Energy Zone to **one** of your Pokémon (Active or Benched). **Maximum 1 Energy attachment per turn** (barring card effects).
   - **Play Trainer cards:** **Supporter — max 1 per turn**; **Item — unlimited**; **Pokémon Tool — attached to a Pokémon**; **Stadium — placed on the field**.
   - **Use Abilities** (do not end the turn; see §8).
   - **Retreat** the Active Pokémon — **max once per turn** (see §7).

4. **Attack (ends the turn).** The Active Pokémon may use one attack if its Energy cost is met. **Resolving an attack immediately ends your turn.** You may also end your turn without attacking (pass).
   - **[vs. paper TCG]** In Pocket you **can attack on your very first turn** if the cost is met (e.g., a zero-Energy attack lets the first player attack on Turn 1 — the first-turn restriction is only on drawing and Energy, not attacking).

5. **Pokémon Checkup (between-turns step).** After a turn ends, status conditions resolve: Poison and Burn deal damage, and coin flips for waking from Sleep / recovering from Burn are made (see §6).

### Evolution timing restrictions

- A Pokémon **cannot evolve on the same turn it was put into play** (including the turn it was placed during setup).
- **No Pokémon can evolve on the very first turn of the game** (either player).
- You evolve by placing the Evolution card directly onto the matching lower-stage Pokémon already in play; HP damage and attached Energy carry over, and most status conditions are cleared by evolving.

---

## 5. Energy Zone (full detail)

The **Energy Zone** is PTCGP's replacement for Energy cards. **[vs. paper TCG: there are no Energy cards in the deck and no per-card Energy attachments from hand.]**

- **It generates 1 Energy per turn**, which you may attach to any one of your Pokémon (Active or Benched).
- **You attach at most 1 Energy per turn** (unless a card effect grants more).
- **Registered types:** during deck building you set which Energy type(s) the Zone produces (**up to 3**). You **cannot choose** which registered type appears on a given turn — among multiple registered types, the generated type is **random** each turn.
- **Next-Energy preview:** the Energy that will be generated **next turn** is shown via a smaller icon (lower-right of the Energy Zone), letting you plan ahead with multi-type decks.
- **Single-type decks** always produce the same type (fully predictable); **multi-type decks** trade consistency for flexibility.
- **First player, Turn 1:** no Energy is generated.
- **Colorless cost:** a colorless symbol in an attack's Energy cost can be paid by **any** Energy type.
- **Discarded Energy** (spent on retreat, attack costs, or card effects) is removed from that Pokémon.
- **Energy acceleration:** some cards/abilities add Energy beyond the once-per-turn norm — e.g., **Misty** and **Moltres ex** generate extra Energy via coin flips; **Gardevoir** can convert Energy-Zone Energy into Psychic Energy.

---

## 6. Damage, HP, Knock Out, Weakness, Status Conditions

### HP, damage, and Knock Out

- Each Pokémon has an **HP** value. Damage accumulates on the Pokémon; when **damage ≥ HP, it is Knocked Out**, and the opponent scores the appropriate point(s) (see §2).

### Weakness and Resistance

- **Weakness adds a flat +20 damage.** **[vs. paper TCG: Weakness multiplies damage ×2.]** If the attacking Pokémon's type matches the defender's Weakness type, the attack deals +20.
- **There is NO Resistance** in PTCGP. **[vs. paper TCG: Resistance reduces damage.]**

### Special Conditions (status)

Only the **Active Pokémon** can be affected by status conditions, and they resolve at the **Pokémon Checkup** between turns.

| Condition               | Effect                                                                                                                                                          | Resolution / cure                                                                                        |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| **Asleep** (ねむり)     | Cannot attack or retreat                                                                                                                                        | Flip a coin each Checkup — **heads = wakes up**. Also cured by retreating, evolving, or Lum Berry.       |
| **Paralyzed** (マヒ)    | Cannot attack or retreat                                                                                                                                        | **Automatically cured after one full turn** (no coin flip). Also cured by retreating/evolving/Lum Berry. |
| **Confused** (こんらん) | When it tries to attack, **flip a coin — heads = attack normally; tails = the attack fails and the Pokémon deals 30 damage to itself**. Heads does NOT cure it. | Cured only by retreating, evolving, or Lum Berry.                                                        |
| **Poisoned** (どく)     | Takes **10 damage** each Checkup                                                                                                                                | Cured by retreating, evolving, or Lum Berry.                                                             |
| **Burned** (やけど)     | Takes **20 damage** each Checkup, then flip a coin — **heads removes Burn**                                                                                     | Also cured by retreating/evolving/Lum Berry.                                                             |

- **Stacking:** only **Poison and Burn can be applied together**. **Asleep, Paralyzed, and Confused are mutually exclusive** — applying a new one of these replaces the previous one.
- **Universal cures:** **retreating, evolving, or using Lum Berry** removes status conditions. Status is also cleared whenever a Pokémon leaves the Active spot (e.g., via a switch effect).

#### Pokémon Checkup resolution order (ポケモンチェック)

When a turn ends, conditions on the Active Pokémon are processed in this fixed order:

1. **Poison** — place 10 damage.
2. **Burn** — place 20 damage, then flip a coin; heads removes Burn.
3. **Asleep** — flip a coin; heads wakes the Pokémon up.
4. **Paralyzed** — a Pokémon that has spent one of its owner's turns paralyzed is cured.

Knock-outs and recoveries are confirmed at this step.

---

## 7. Retreating, Switching, and the Active Pokémon

- The **Active Pokémon** is the one in the battle position; only it can attack and only it can be attacked. Benched Pokémon are safe from direct attacks (barring effects that hit the Bench).
- **Retreat cost:** each Pokémon has a Retreat Cost (a number of Energy symbols). To retreat, **discard that many attached Energy**, then swap the Active Pokémon with a chosen Benched Pokémon, which becomes the new Active Pokémon.
- **Retreat is limited to once per turn**, even with a 0 retreat cost or surplus Energy (prevents stalling loops).
- A Pokémon that is **Asleep or Paralyzed cannot retreat on its own**.
- Retreating **clears the retreating Pokémon's status conditions** — a common way to remove Poison/Burn/Sleep.
- Some card effects **switch** Pokémon between Active and Bench **without** paying the retreat cost.

---

## 8. Abilities vs. Attacks, and Coin Flips

- **Attacks** require meeting the Energy cost shown to the left of the attack name. An attack with **no Energy symbol** can be used with no Energy attached (enabling first-turn attacks). **Using an attack ends your turn.**
- **Abilities** (とくせい) are effects that are **not attacks**: they generally do **not** require Energy and do **not** end the turn. Some are activated, some are passive, and some work from the Bench. Abilities can do things like generate Energy, heal, move damage, or manipulate the board.
- **Coin flips** drive many random effects (extra damage, inflicting status, extra Energy, etc.). The game resolves heads/tails automatically. Some attacks flip multiple coins or flip "until tails."

---

## 9. Special Rules, Edge Cases, and Limits

- **First player's Turn 1:** no card draw, no Energy generation, and no evolving — but the first player **may** use Supporter/Item cards and **may** attack if an attack's cost is already met. This makes going **second** a slight advantage in Pocket.
- **First turn (both players):** no evolving by anyone.
- **Empty deck:** being unable to draw is **not** a loss; play continues.
- **Time and turn limits:**
  - **~90 seconds per turn** — when the timer expires the turn auto-ends.
  - **Versus (PvP) battles: maximum 30 turns.**
  - **Solo battles: maximum 50 turns.**
  - When a limit is reached without anyone hitting 3 points, **the player with more points wins**.
- **Conceding** ends the match in the opponent's favor.

---

## 10. Special Card Types and Their Rules

### Pokémon ex

- Powerful Pokémon worth **2 points** when Knocked Out (vs. 1 for a regular Pokémon). They have no extra in-play drawback beyond the larger point bounty.

### Mega Evolution Pokémon ex (B-series, from Mega Rising / B1)

- Worth **3 points** when Knocked Out — a single KO can win the game. They have very high HP and power, making them high-risk, high-reward.
- **[vs. paper TCG]** In Pocket, a Stage-2 Mega evolves directly from its Stage-1 form via normal evolution rules (e.g., Mega Blaziken ex evolves from Combusken), rather than from a separate "Blaziken ex".

### Fossil cards

- **Fossils are Item cards** that, once played, become Pokémon on the Bench. Examples: Helix Fossil, Dome Fossil, Old Amber, Armor Fossil, Skull Fossil.
- In play they are **Colorless-type Basic Pokémon with 40 HP**, with **no Weakness, no Retreat Cost, no Ability, and no attacks**, and **cannot retreat**.
- You need an **open Bench slot** to play one, and they **cannot** be played during pre-game setup. They serve as the "Basic" stage that the corresponding fossil-line Pokémon evolves from.

### Pokémon Tool cards (from Space-Time Smackdown / A2)

- Trainer cards attached to a Pokémon to grant an ongoing effect (e.g., Giant Cape adds HP, Rocky Helmet deals damage to attackers, Lum Berry cures status).

### Stadium cards (from Fantastical Parade / B2)

- Field cards affecting both players; a new Stadium replaces the previous one. **[Note: not present at launch.]**

### No Stadium-less period note / removed types

- **There are no Special Energy cards or basic Energy cards** in decks (replaced by the Energy Zone).
- **Stadium cards did not exist before B2**, and the physical game's Stadium rules were absent at launch.

---

## Quick Reference: PTCGP vs. Physical TCG

| Rule                            | PTCGP                             | Physical TCG                |
| ------------------------------- | --------------------------------- | --------------------------- |
| Deck size                       | 20                                | 60                          |
| Copies per name                 | 2                                 | 4                           |
| Starting hand                   | 5 (guaranteed Basic, no mulligan) | 7 (mulligan if no Basic)    |
| Hand size cap                   | 10                                | none                        |
| Bench size                      | 3                                 | 5                           |
| Energy                          | Energy Zone (1/turn, auto)        | Energy cards in deck        |
| Win condition                   | First to 3 points                 | Take 6 Prize cards          |
| Regular KO / ex KO / Mega ex KO | 1 / 2 / 3 points                  | (prizes vary)               |
| Weakness                        | +20 flat                          | ×2                          |
| Resistance                      | none                              | reduces damage              |
| Deck-out                        | not a loss                        | loss                        |
| First player Turn 1             | no draw, no Energy, may attack    | draws, no attack first turn |

---

## Sources

- Official Pokémon — Learn How to Build a Deck in Pokémon TCG Pocket: <https://www.pokemon.com/us/strategy/learn-how-to-build-a-deck-in-pokemon-tcg-pocket>
- Official Pokémon Support — Battle Rules FAQ: <https://support.pokemon.com/hc/en-us/articles/38906248102292>
- Official Pokémon Support — Gameplay FAQ: <https://support.pokemon.com/hc/en-us/articles/30330309361172>
- Bulbapedia — Pokémon Trading Card Game Pocket: <https://bulbapedia.bulbagarden.net/wiki/Pok%C3%A9mon_Trading_Card_Game_Pocket>
- Bulbapedia — Special Condition (TCG): <https://bulbapedia.bulbagarden.net/wiki/Special_Condition_(TCG)>
- Bulbapedia — Item card (TCG Pocket) / Fossils: <https://bulbapedia.bulbagarden.net/wiki/Item_card_(TCG_Pocket)>
- Game8 — Battle System, Rule Differences, Point System, Energy Zone, Retreat Costs, Status Effects, Time Limit guides: <https://game8.co/games/Pokemon-TCG-Pocket>
- Pokémon Zone — How to Play Pokémon TCG Pocket: <https://www.pokemon-zone.com/articles/how-to-play-pokemon-tcg-pocket/>
- Pokémon.com — Mega Rising mechanics: <https://www.pokemon.com/us/pokemon-news/mega-rising-ranked-matches-have-begun-in-pokemon-trading-card-game-pocket>
