---
name: Lokalpartiresearch
description: Hur de 138 lokala partiernas hemsidor/beskrivningar/svar togs fram och hur de regenereras
---

# Lokalpartiresearch (juli 2026)

`scripts/src/data/localPartyResearch.json` innehåller redaktionell research om lokalpartierna: hemsida, neutraliserad beskrivning och (för ~74 partier) strikt bedömda svar på de 20 generiska kommunfrågorna. Endast 4 partier når 50 %-tröskeln och blir kvalificerade — lokalpartier publicerar tunt material, det är väntat och ärligt.

**Regel:** svaren bedöms ENDAST utifrån vad partiets publicerade material faktiskt säger — aldrig gissningar från namn/ideologi; hellre null. Beskrivningar neutraliseras (inga värdeord). Källor märks "Partiets webbplats" bara när domänen matchar partiets sajt, annars "Extern källa (host)".

**Why:** neutralitetskravet — ett litet parti får aldrig tillskrivas åsikter utan belägg.

**How to apply:** vid regenerering (t.ex. efter valet 2026): pipeline = webSearch → webFetch (startsida + program-undersidor) → queryWithLLM med strikt prompt och responseSchema. Filen har `questionFingerprint` (första/sista frågetext + antal) som seed.ts validerar — ändras kommunfrågorna måste researchen göras om. OBS: `URL` finns inte i CodeExecution-sandboxens durable scope — normalisera URL:er med regex. Filtrera bort tromanpublik/nyhetssajter/svt-valkompass som "hemsida".
