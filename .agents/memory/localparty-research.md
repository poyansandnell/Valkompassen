---
name: Lokalpartiresearch
description: Hur de 138 lokala partiernas hemsidor/beskrivningar/svar togs fram och hur de regenereras
---

# Lokalpartiresearch (juli 2026)

`scripts/src/data/localPartyResearch.json` innehåller redaktionell research om lokalpartierna: hemsida, neutraliserad beskrivning och (för ~74 partier) strikt bedömda svar på de 20 generiska kommunfrågorna. Kvalificeringströskeln sänktes aug 2026 till 40 % (quizData.ts); fler lokalpartier med 8–9 bedömda svar av 20 kvalificeras nu. Nystartade partier utan SCB-mandat (t.ex. Ett bättre Eskilstuna, mars 2026) läggs in manuellt i seed.ts LOCAL_PARTIES med inAssembly:false. Tidigare nådde endast 4 partier 50 %-tröskeln — lokalpartier publicerar tunt material, det är väntat och ärligt.

**Regel:** svaren bedöms ENDAST utifrån vad partiets publicerade material faktiskt säger — aldrig gissningar från namn/ideologi; hellre null. Beskrivningar neutraliseras (inga värdeord). Källor märks "Partiets webbplats" bara när domänen matchar partiets sajt, annars "Extern källa (host)".

**Why:** neutralitetskravet — ett litet parti får aldrig tillskrivas åsikter utan belägg.

**How to apply:** vid regenerering (t.ex. efter valet 2026): pipeline = webSearch → webFetch (startsida + program-undersidor) → queryWithLLM med strikt prompt och responseSchema. Filen har `questionFingerprint` (första/sista frågetext + antal) som seed.ts validerar — ändras kommunfrågorna måste researchen göras om. OBS: `URL` finns inte i CodeExecution-sandboxens durable scope — normalisera URL:er med regex. Filtrera bort tromanpublik/nyhetssajter/svt-valkompass som "hemsida".
