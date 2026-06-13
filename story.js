import Item from './item.js';
import { printSlow, question, wuerfelD20, randomRange } from './utils.js';

const SHOP_WAREN = {
    "1": { label: "Heiltrank kaufen (5 Gold)", cost: 5, type: "traenke" },
    "2": { label: "Stahlschwert kaufen (25 Gold, +8 Schaden)", cost: 25, type: "item", name: "Stahlschwert", kind: "Waffe", val: 8 },
    "3": { label: "Schuppenpanzer kaufen (25 Gold, RK 15)", cost: 25, type: "item", name: "Schuppenpanzer", kind: "Ruestung", val: 15 },
    "4": { label: "Gifttrank kaufen (5 Gold)", cost: 5, type: "item", name: "Gifttrank", kind: "Trank", val: 0 },
    // Tueftler Materialien
    "5": { label: "Mechanischeteile (1 Gold)", cost: 1, type: "item", name: "Mechanischeteile", kind: "Material", val: 0 },
    "6": { label: "Maschinenoel (1 Gold)", cost: 1, type: "item", name: "Maschinenoel", kind: "Material", val: 0 },
    "7": { label: "Schrauben und Muttern (1 Gold)", cost: 1, type: "item", name: "Schrauben und Muttern", kind: "Material", val: 0 },
    // Alchemist Materialien
    "8": { label: "Bestienteile (1 Gold)", cost: 1, type: "item", name: "Bestienteile", kind: "Material", val: 0 },
    "9": { label: "Pflanzenteile (1 Gold)", cost: 1, type: "item", name: "Pflanzenteile", kind: "Material", val: 0 },
    "10": { label: "Fläschchen (1 Gold)", cost: 1, type: "item", name: "Fläschchen", kind: "Material", val: 0 },
    // Waffen & Ausrüstung
    "13": { label: "Dager (6 Gold, + 3 Schaden)", cost: 6, type: "item", name: "Dager", kind: "Waffe", val: 3 },
    "14": { label: "Axt des Vernichters (20 Gold, + 8 Schaden)", cost: 20, type: "item", name: "Axt des Vernichters", kind: "Waffe", val: 8 },
    "15": { label: "Feuriger Zauberstab T2 (10 Gold, + 8 Schaden)", cost: 10, type: "item", name: "Feuerstab T2", kind: "Waffe", val: 8 },
    "16": { label: "Blitzer (10 Gold, + 8 Schaden)", cost: 10, type: "item", name: "Blitzer", kind: "Waffe", val: 8 },
    // Heiler & Barde
    "18": { label: "Stab der Großen Heilung (12 Gold)", cost: 12, type: "item", name: "Heilerstab", kind: "Waffe", val: 2 },
    "21": { label: "Drehleier (15 Gold)", cost: 15, type: "item", name: "Drehleier", kind: "Instrument", val: 0 },
    "22": { label: "Laute der Schönheit (15 Gold)", cost: 15, type: "item", name: "Laute", kind: "Instrument", val: 0 },
    // Nahrung (Direkte HP Heilung)
    "26": { label: "Essensration (2 Gold, + 4 HP)", cost: 2, type: "hp", val: 4, name: "Essensration" },
    "27": { label: "Wasser (2 Gold, + 2 HP)", cost: 2, type: "hp", val: 2, name: "Wasser" },
    "28": { label: "BockBier (3 Gold, + 3 HP)", cost: 3, type: "hp", val: 3, name: "BockBier" },
    "29": { label: "Radler des Elfen (2 Gold, + 1 HP)", cost: 2, type: "hp", val: 1, name: "Radler" }
};

const BOSS_LOOT = [
    { name: "Ebenholz-Langbogen", kind: "Waffe", val: 12 },
    { name: "Vampirklinge", kind: "Waffe", val: 14 },
    { name: "Plattenpanzer der Ewigkeit", kind: "Ruestung", val: 22 },
    { name: "Aegis-Schild", kind: "Schild", val: 8 },
    { name: "Kristallstab", kind: "Waffe", val: 15 },
    { name: "Umhang des Schattens", kind: "Ruestung", val: 18 }
];

const RARE_ARTIFACTS = [
    { name: "Ring des Phönix", cost: 80, kind: "Schmuck", val: 5, effekt: { typ: "ap_regen", wert: 4 } },
    { name: "Schattenklinge", cost: 100, kind: "Waffe", val: 18, effekt: { typ: "lebensraub", wert: 0.15 } },
    { name: "Gotteswall", cost: 120, kind: "Schild", val: 10, effekt: { typ: "ap_regen", wert: 3 } },
    { name: "Amulett der Götter", cost: 150, kind: "Schmuck", val: 0, effekt: { typ: "ap_regen", wert: 10 } }
];

const CRAFTING_REZEPTE = {
    "tueftler": [
        { name: "Sprengfalle", materialien: { "Mechanischeteile": 2, "Schrauben und Muttern": 1 } },
        { name: "Geschütz", materialien: { "Mechanischeteile": 2, "Maschinenoel": 1 } },
        { name: "Netz", materialien: { "Mechanischeteile": 1, "Schrauben und Muttern": 2 } }
    ],
    "alchemist": [
        { name: "Säuretrank", materialien: { "Pflanzenteile": 2, "Fläschchen": 1 } },
        { name: "Gifttrank", materialien: { "Bestienteile": 2, "Fläschchen": 1 } },
        { name: "Heiltrank", materialien: { "Pflanzenteile": 1, "Fläschchen": 1 } }
    ]
};

function hatMaterialien(spieler, materialien) {
    const counts = {};
    spieler.inventar.forEach(it => counts[it.name] = (counts[it.name] || 0) + 1);
    return Object.entries(materialien).every(([name, menge]) => (counts[name] || 0) >= menge);
}

function verbraucheMaterialien(spieler, materialien) {
    Object.entries(materialien).forEach(([name, menge]) => {
        for (let i = 0; i < menge; i++) {
            const idx = spieler.inventar.findIndex(it => it.name === name);
            if (idx !== -1) spieler.inventar.splice(idx, 1);
        }
    });
}

function materialNachKlasse(held) {
    const isTueftler = held.klasse.toLowerCase() === "tueftler";
    const pool = isTueftler 
        ? ["Mechanischeteile", "Maschinenoel", "Schrauben und Muttern"] 
        : ["Bestienteile", "Pflanzenteile", "Fläschchen"];
    return pool[randomRange(0, pool.length - 1)];
}

async function zerlegenMenue(held) {
    let aktiv = true;
    while (aktiv) {
        const loot = held.inventar.filter(it => ["Waffe", "Ruestung", "Schild"].includes(it.typ));
        if (loot.length === 0) {
            await printSlow(`❌ ${held.name} hat keine zerlegbare Ausrüstung.`);
            return;
        }

        console.log(`\n--- ♻️ ZERLEGEN: ${held.name} ---`);
        loot.forEach((it, i) => console.log(`${i + 1}. ${it.name} (${it.typ}, Wert: ${it.wert})`));
        console.log("0. Zurück");

        const wahl = await question("Welches Item zerlegen? ");
        if (wahl === "0") {
            aktiv = false;
        } else {
            const idx = parseInt(wahl) - 1;
            if (idx >= 0 && idx < loot.length) {
                const item = loot[idx];
                held.inventar.splice(held.inventar.indexOf(item), 1);
                
                const mat = materialNachKlasse(held);
                const menge = randomRange(1, 2);
                for(let i=0; i<menge; i++) {
                    held.inventar.push(new Item(mat, "Material", 0));
                }
                await printSlow(`🔨 ${held.name} zerlegt ${item.name} und gewinnt ${menge}x ${mat}!`);
            }
        }
    }
}

async function craftingMenue(helden) {
    const handwerker = helden.filter(h => ["tueftler", "alchemist"].includes(h.klasse.toLowerCase()));
    if (handwerker.length === 0) return;

    for (const held of handwerker) {
        let amBasteln = true;
        while (amBasteln) {
            if (held.isKI) {
                // KI-Salvage: Zerlegt alles, was nicht besser als die aktuelle Ausrüstung ist
                const salvageable = held.inventar.filter(it => ["Waffe", "Ruestung", "Schild"].includes(it.typ));
                for (const it of salvageable) {
                    let schlechter = false;
                    if (it.typ === "Waffe" && (!held.ausgeruestete_waffe || it.wert <= held.ausgeruestete_waffe.wert)) schlechter = true;
                    if (it.typ === "Ruestung" && (!held.ausgeruestete_ruestung || it.wert <= held.ausgeruestete_ruestung.wert)) schlechter = true;
                    if (it.typ === "Schild" && (!held.ausgeruestete_schild || it.wert <= held.ausgeruestete_schild.wert)) schlechter = true;
                    
                    if (schlechter) {
                        held.inventar.splice(held.inventar.indexOf(it), 1);
                        const mat = materialNachKlasse(held);
                        held.inventar.push(new Item(mat, "Material", 0));
                        await printSlow(`🤖 ${held.name} zerlegt ${it.name} -> ${mat}.`);
                    }
                }

                const rezepte = CRAFTING_REZEPTE[held.klasse.toLowerCase()];
                const machbar = rezepte.find(r => hatMaterialien(held, r.materialien));
                if (machbar) {
                    verbraucheMaterialien(held, machbar.materialien);
                    held.inventar.push(new Item(machbar.name, "Spezial", 0));
                    await printSlow(`🤖 ${held.name} (KI) hat ${machbar.name} hergestellt.`);
                }
                amBasteln = false;
                continue;
            }

            console.log(`\n--- 🛠️ WERK BANK: ${held.name} (${held.klasse}) ---`);
            console.log("1. Gegenstand herstellen");
            console.log("2. Ausrüstung zerlegen (Salvage)");
            console.log("0. Werkbank verlassen");

            const modus = await question("Wahl: ");
            if (modus === "0") {
                amBasteln = false;
                continue;
            }
            if (modus === "2") {
                await zerlegenMenue(held);
                continue;
            }
            if (modus !== "1") continue;

            const rezepte = CRAFTING_REZEPTE[held.klasse.toLowerCase()];
            rezepte.forEach((r, i) => {
                const mats = Object.entries(r.materialien).map(([n, m]) => `${m}x ${n}`).join(", ");
                console.log(`${i + 1}. ${r.name} herstellen (${mats})`);
            });
            console.log("0. Werkbank verlassen");

            const wahl = await question("Was möchtest du herstellen? ");
            if (wahl === "0") {
                amBasteln = false;
            } else {
                const rezept = rezepte[parseInt(wahl) - 1];
                if (rezept) {
                    if (hatMaterialien(held, rezept.materialien)) {
                        verbraucheMaterialien(held, rezept.materialien);
                        held.inventar.push(new Item(rezept.name, "Spezial", 0));
                        await printSlow(`✨ Erfolg! ${held.name} hat ${rezept.name} hergestellt.`);
                    } else {
                        await printSlow("❌ Fehlende Materialien!");
                        amBasteln = false;
                    }
                } else {
                    await printSlow("❌ Ungültige Wahl.");
                    amBasteln = false;
                }
            }
        }
    }
}

const KLASSEN_ABILITIES = {
    "krieger": [
        { name: "Wirbelwind", ap_kosten: 25, schaden: 20, element: "Physisch" },
        { name: "Kriegsschrei", ap_kosten: 20, atk_buff: 8 },
        { name: "Durchbohren", ap_kosten: 15, schaden: 25, element: "Physisch" },
        { name: "Blutdurst", ap_kosten: 30, atk_buff: 10 },
        { name: "Klinge der Götter", ap_kosten: 40, schaden: 40, element: "Physisch" }
    ],
    "magier": [
        { name: "Meteor", ap_kosten: 40, schaden: 50, element: "Feuer" },
        { name: "Frostnova", ap_kosten: 25, schlaf_dauer: 1, element: "Eis" },
        { name: "Arkaner Fokus", ap_kosten: 10, atk_buff: 10 },
        { name: "Mana-Schild", ap_kosten: 25, def_buff: 10 },
        { name: "Eiszeit", ap_kosten: 35, schlaf_dauer: 2, element: "Eis" }
    ],
    "schurke": [
        { name: "Giftiger Dolch", ap_kosten: 15, schaden: 15, verwirrt: 1, element: "Gift" },
        { name: "Schattenschritt", ap_kosten: 20, atk_buff: 6 },
        { name: "Fächerstoß", ap_kosten: 25, schaden: 22, element: "Physisch" },
        { name: "Tödlicher Stoß", ap_kosten: 25, execute_threshold: 15, element: "Physisch" },
        { name: "Schattentanz", ap_kosten: 25, atk_buff: 8 }
    ],
    "heiler": [
        { name: "Heiliger Regen", ap_kosten: 25, heilung: 30, element: "Heilig" },
        { name: "Göttlicher Schutz", ap_kosten: 20, def_buff: 5 },
        { name: "Reinigung", ap_kosten: 10, heilung: 15, element: "Heilig" },
        { name: "Lebenslicht", ap_kosten: 40, heilung: 40, element: "Heilig" },
        { name: "Göttlicher Zorn", ap_kosten: 25, schaden: 25, element: "Heilig" }
    ],
    "verteidiger": [
        { name: "Bollwerk", ap_kosten: 25, def_buff: 10 },
        { name: "Herausforderung", ap_kosten: 15, atk_buff: 3 },
        { name: "Eiserner Wille", ap_kosten: 20, heilung: 15 },
        { name: "Eiserner Wall", ap_kosten: 30, def_buff: 12 },
        { name: "Vergeltung", ap_kosten: 25, schaden: 20, atk_buff: 5, element: "Physisch" }
    ],
    "barde": [
        { name: "Hymne des Sieges", ap_kosten: 30, atk_buff: 15 },
        { name: "Spottvers", ap_kosten: 15, schaden: 12, verwirrt: 1, element: "Schall" },
        { name: "Lied der Ruhe", ap_kosten: 25, schlaf_dauer: 1, element: "Schall" },
        { name: "Requiem", ap_kosten: 40, schaden: 30, verwirrt: 2, element: "Schall" },
        { name: "Symphonie der Hoffnung", ap_kosten: 35, heilung: 20, atk_buff: 5 }
    ],
    "tueftler": [
        { name: "Tesla-Spule", ap_kosten: 0, schaden: 35, element: "Blitz" },
        { name: "Reparatur-Bot", ap_kosten: 0, heilung: 25 },
        { name: "Schockgranate", ap_kosten: 0, schlaf_dauer: 1, element: "Energie" },
        { name: "Laserstrahl", ap_kosten: 0, schaden: 45, element: "Energie" },
        { name: "Stasis-Feld", ap_kosten: 0, niederhalten: 2, element: "Energie" }
    ],
    "alchemist": [
        { name: "Explosives Gemisch", ap_kosten: 0, schaden: 40, element: "Feuer" },
        { name: "Stärkungstrank", ap_kosten: 0, atk_buff: 10 },
        { name: "Nebelbombe", ap_kosten: 0, verwirrt: 1, element: "Gift" },
        { name: "Elixier des Lebens", ap_kosten: 0, heilung: 45 },
        { name: "Chaos-Viole", ap_kosten: 0, schaden: 30, verwirrt: 2, element: "Säure" }
    ]
};

const SYNERGIE_ABILITIES = {
    "krieger+heiler": { name: "Heiliger Ansturm", ap_kosten: 15, schaden: 15, heilung: 10, element: "Heilig" },
    "magier+alchemist": { name: "Mana-Explosion", ap_kosten: 0, schaden: 35, verwirrt: 1, element: "Energie" },
    "schurke+barde": { name: "Schatten-Serenade", ap_kosten: 18, schlaf_dauer: 1, atk_buff: 5, element: "Schall" },
    "verteidiger+tueftler": { name: "Bollwerk-Upgrade", ap_kosten: 0, def_buff: 8 },
    "krieger+schurke": { name: "Blutiges Duo", ap_kosten: 20, schaden: 30, element: "Physisch" },
    "magier+barde": { name: "Sphärenklang", ap_kosten: 22, schaden: 20, schlaf_dauer: 1, element: "Schall" },
    "verteidiger+heiler": { name: "Glaubensmauer", ap_kosten: 20, def_buff: 5, heilung: 15, element: "Heilig" }
};

async function synergienPruefen(helden) {
    if (helden.length < 2) return;

    // Wir prüfen alle möglichen Paare in der Gruppe
    for (let i = 0; i < helden.length; i++) {
        for (let j = i + 1; j < helden.length; j++) {
            const k1 = helden[i].klasse.toLowerCase();
            const k2 = helden[j].klasse.toLowerCase();
            
            // Prüfe beide Richtungen (z.B. Krieger+Heiler und Heiler+Krieger)
            const kombinationen = [`${k1}+${k2}`, `${k2}+${k1}`];
            const synergiename = kombinationen.find(k => SYNERGIE_ABILITIES[k]);

            if (synergiename) {
                const fähigkeit = SYNERGIE_ABILITIES[synergiename];
                await printSlow(`\n<span class="synergy-text">🔗 SYNERGIE ENTDECKT!</span> ${helden[i].name} & ${helden[j].name} bilden ein eingespieltes Team.`);
                await printSlow(`✨ Beide erlernen die mächtige Team-Fähigkeit: <span class="rare-item">${fähigkeit.name}</span>!`);
                
                // Die Fähigkeit wird beiden Spielern hinzugefügt
                if (!helden[i].abilities.some(a => a.name === fähigkeit.name)) helden[i].abilities.push({...fähigkeit});
                if (!helden[j].abilities.some(a => a.name === fähigkeit.name)) helden[j].abilities.push({...fähigkeit});
            }
        }
    }
}

async function bossLootGeben(helden) {
    await printSlow("\n🎁 Der Wächter hinterlässt einen seltenen Schatz!");
    const itemData = BOSS_LOOT[randomRange(0, BOSS_LOOT.length - 1)];
    const item = new Item(itemData.name, itemData.kind, itemData.val);
    
    const lebendeHelden = helden.filter(h => h.hp > 0);
    if (lebendeHelden.length === 0) return;
    
    const empfaenger = lebendeHelden[randomRange(0, lebendeHelden.length - 1)];
    empfaenger.inventar.push(item);
    
    await printSlow(`✨ ${empfaenger.name} erhält ein <span class="rare-item">seltenes Fundstück: ${item.name}</span> (${item.typ}: ${item.wert})!`);
    
    if (empfaenger.isKI) empfaenger.kiAutomatischAusruesten();
}

async function faehigkeitWaehlen(spieler) {
    const klasse = spieler.klasse.toLowerCase();
    const pool = KLASSEN_ABILITIES[klasse] || [];
    const verfuegbar = pool.filter(a => !spieler.abilities.some(existing => existing.name === a.name));

    if (verfuegbar.length === 0) return;

    await printSlow(`\n🎓 ${spieler.name} kann eine neue Fähigkeit lernen!`);
    
    const auswahl = [];
    const tempPool = [...verfuegbar];
    for(let i=0; i < 2 && tempPool.length > 0; i++) {
        const idx = randomRange(0, tempPool.length - 1);
        auswahl.push(tempPool.splice(idx, 1)[0]);
    }

    if (spieler.isKI) {
        const gewaehlt = auswahl[randomRange(0, auswahl.length - 1)];
        spieler.abilities.push(gewaehlt);
        await printSlow(`🤖 ${spieler.name} lernt: ${gewaehlt.name}!`);
    } else {
        auswahl.forEach((a, i) => {
            console.log(`${i + 1}. ${a.name} (AP: ${a.ap_kosten})`);
        });
        const wahl = await question("Wähle eine Fähigkeit (1-2): ");
        const idx = parseInt(wahl) - 1;
        const gewaehlt = (idx >= 0 && idx < auswahl.length) ? auswahl[idx] : auswahl[0];
        spieler.abilities.push(gewaehlt);
        await printSlow(`✨ Du hast ${gewaehlt.name} gelernt!`);
    }
}

async function schatzFinden(helden) {
    await printSlow("\n--- RAUM 1: Die Kammer der Prüfungen ---");
    await printSlow("Ihr findet eine schwere Eisentruhe. Wer von euch versucht, sie zu knacken?");
    helden.forEach((h, i) => console.log(`${i + 1}. ${h.name}`));
    
    let index;
    while (true) {
        const wahl = await question(`Wahl (1-${helden.length}): `);
        index = parseInt(wahl) - 1;
        if (!isNaN(index) && index >= 0 && index < helden.length) break;
        console.log("Ungültige Wahl.");
    }
    const aktiver = helden[index];
    
    await printSlow(`${aktiver.name} tritt vor und würfelt...`);
    const wurf = wuerfelD20();
    await printSlow(`🎲 Wurf: ${wurf}`);
    if (wurf >= 10) {
        const itemPool = [
            { name: "Breitschwert", typ: "Waffe", wert: 10 },
            { name: "Ritterrüstung", typ: "Ruestung", wert: 16 },
            { name: "Lederhelm", typ: "Ruestung", wert: 3 },
            { name: "Bronzeschwert", typ: "Waffe", wert: 5 },
            { name: "Kleiner Schild", typ: "Schild", wert: 1 },
            { name: "Magierrobe", typ: "Ruestung", wert: 2 },
            { name: "Kurzbogen", typ: "Waffe", wert: 4 },
            { name: "Dolch des Assassinen", typ: "Waffe", wert: 6 },
            { name: "Eisenstiefel", typ: "Ruestung", wert: 4 },
            { name: "Kampfhammer", typ: "Waffe", wert: 7 },
            { name: "Schuppenpanzer", typ: "Ruestung", wert: 10 },
            { name: "Großer Schild", typ: "Schild", wert: 3 },
            { name: "Langschwert", typ: "Waffe", wert: 8 },
            { name: "Plattenhandschuhe", typ: "Ruestung", wert: 5 },
            { name: "Kriegsaxt", typ: "Waffe", wert: 9 },
            { name: "Mithrilkette", typ: "Ruestung", wert: 12 }
        ];

        const goldFund = randomRange(1, 50);
        aktiver.gold += goldFund;
        await printSlow(`💎 Erfolg! ${aktiver.name} öffnet die Truhe und findet ${goldFund} Gold!`);

        for (const h of helden) {
            const randomData = itemPool[randomRange(0, itemPool.length - 1)];
            const loot = new Item(randomData.name, randomData.typ, randomData.wert);
            h.inventar.push(loot);
            await printSlow(`🎁 ${h.name} erhält: <span class="rare-item">${loot.name}</span> (${loot.typ}: ${loot.wert})`);
            
            if (h.isKI) {
                h.kiAutomatischAusruesten();
            }
        }
    } else {
        await printSlow("💥 Eine Falle explodiert! Alle Spieler verlieren 5 HP.");
        helden.forEach(h => h.hp -= 5);
    }
}

async function shopBesuch(helden, istEingang = false) {
    // Das aktuelle Bild vom Panel speichern und zum Händler wechseln
    const logPanel = document.getElementById('log-panel');
    const altesBild = logPanel ? logPanel.style.backgroundImage : "";
    const händlerBild = istEingang ? "Dungon-Haendler1.png" : "Dungon-Haendler2.png";
    if (logPanel) logPanel.style.backgroundImage = `url('img/${händlerBild}')`;

    await printSlow("\n🏪 Ihr findet einen reisenden Händler im Dungeon.");
    
    // Glückswurf für seltene Artefakte (einmal pro Shop-Besuch)
    let seltenesArtefakt = null;
    const gluecksWurf = wuerfelD20();
    if (gluecksWurf >= 18) {
        seltenesArtefakt = RARE_ARTIFACTS[randomRange(0, RARE_ARTIFACTS.length - 1)];
        await printSlow(`✨ <span class="rare-item">Der Händler flüstert: 'Ich habe heute etwas ganz Besonderes unter dem Tresen...'</span>`);
    }

    for (const held of helden) {
        let shopping = true;
        while (shopping) {
            // Charisma-Bonus berechnen (5% pro Punkt)
            const buyDiscount = Math.max(0.5, 1 - (held.grund_cha * 0.05));
            const sellBonus = Math.min(1.0, 0.5 + (held.grund_cha * 0.05));

            console.log(`\n--- 🛒 SHOP: ${held.name} (Gold: ${held.gold} | Charisma: ${held.grund_cha}) ---`);
            console.log("KAUFEN:");
            
            Object.keys(SHOP_WAREN).forEach(id => {
                const ware = SHOP_WAREN[id];
                const finalCost = Math.max(1, Math.ceil(ware.cost * buyDiscount));
                console.log(`${id}. ${ware.label} -> DEIN PREIS: ${finalCost} Gold`);
            });
            if (seltenesArtefakt) {
                const finalCost = Math.max(1, Math.ceil(seltenesArtefakt.cost * buyDiscount));
                console.log(`50. <span class="rare-item">UNIKAT: ${seltenesArtefakt.name}</span> (${seltenesArtefakt.kind}: ${seltenesArtefakt.val}) -> PREIS: ${finalCost} Gold`);
            }
            console.log("31. EIGENE ITEMS VERKAUFEN");
            console.log("0. Shop verlassen");
            
            const wahl = await question("Deine Wahl: ");
            
            if (wahl === "0" || wahl === "30") {
                shopping = false;
            } else if (wahl === "31") {
                // --- VERKAUFS-MODUS ---
                if (held.inventar.length === 0 && held.traenke === 0) {
                    await printSlow("❌ Du hast nichts zum Verkaufen!");
                    continue;
                }

                console.log("\n--- Dein Inventar zum Verkauf ---");
                const potionSellPrice = Math.max(1, Math.floor(5 * sellBonus)); // 5 ist Basiswert
                if (held.traenke > 0) console.log(`T. Heiltränke (${held.traenke}x) - Wert: ${potionSellPrice} Gold/Stk`);
                held.inventar.forEach((it, i) => {
                    const verkaufsPreis = Math.max(1, Math.floor(it.wert * sellBonus));
                    console.log(`${i + 1}. ${it.name} - Wert: ${verkaufsPreis} Gold`);
                });
                console.log("B. Zurück zum Kauf-Menü");

                const verkaufWahl = await question("Was möchtest du verkaufen? (Nr/T/B): ");
                if (verkaufWahl.toLowerCase() === "b") continue;

                if (verkaufWahl.toLowerCase() === "t" && held.traenke > 0) {
                    const anz = parseInt(await question(`Wie viele Heiltränke verkaufen? (Max ${held.traenke}): `));
                    if (!isNaN(anz) && anz > 0 && anz <= held.traenke) {
                        held.traenke -= anz;
                        held.gold += anz * potionSellPrice;
                        await printSlow(`💰 Du verkaufst ${anz} Tränke für ${anz * potionSellPrice} Gold.`);
                    }
                } else {
                    const idx = parseInt(verkaufWahl) - 1;
                    if (!isNaN(idx) && idx >= 0 && idx < held.inventar.length) {
                        const item = held.inventar[idx];
                        const preis = Math.max(1, Math.floor(item.wert * sellBonus));
                        const count = held.inventar.filter(i => i.name === item.name).length;
                        
                        const anz = parseInt(await question(`Wie viele ${item.name} verkaufen? (Max ${count}): `));
                        if (!isNaN(anz) && anz > 0 && anz <= count) {
                            let geloescht = 0;
                            // Von hinten löschen um Indizes während des Durchlaufs stabil zu halten
                            for (let i = held.inventar.length - 1; i >= 0 && geloescht < anz; i--) {
                                if (held.inventar[i].name === item.name) {
                                    held.inventar.splice(i, 1);
                                    geloescht++;
                                }
                            }
                            held.gold += geloescht * preis;
                            await printSlow(`💰 Du verkaufst ${geloescht}x ${item.name} für ${geloescht * preis} Gold.`);
                        }
                    }
                }
            } else if (wahl === "50" && seltenesArtefakt) {
                const finalCost = Math.max(1, Math.ceil(seltenesArtefakt.cost * buyDiscount));
                if (held.gold >= finalCost) {
                    held.gold -= finalCost;
                    held.inventar.push(new Item(seltenesArtefakt.name, seltenesArtefakt.kind, seltenesArtefakt.val, seltenesArtefakt.effekt));
                    await printSlow(`✨ <span class="rare-item">${held.name} erwirbt das legendäre Artefakt: ${seltenesArtefakt.name}!</span>`);
                    seltenesArtefakt = null; // Unikat wurde verkauft
                    if (held.isKI) held.kiAutomatischAusruesten();
                } else {
                    await printSlow("❌ Nicht genug Gold für dieses wertvolle Stück!");
                }
            } else if (SHOP_WAREN[wahl]) {
                // --- KAUF-MODUS ---
                const ware = SHOP_WAREN[wahl];
                const finalCost = Math.max(1, Math.ceil(ware.cost * buyDiscount));
                const maxKaufbar = Math.floor(held.gold / finalCost);
                
                if (maxKaufbar <= 0) {
                    await printSlow("❌ Nicht genug Gold!");
                    continue;
                }

                const anz = parseInt(await question(`Wie oft kaufen? (Max ${maxKaufbar}, 0 zum Abbrechen): `));
                if (!isNaN(anz) && anz > 0 && anz <= maxKaufbar) {
                    held.gold -= anz * finalCost;
                    for (let i = 0; i < anz; i++) {
                        if (ware.type === "traenke") held.traenke += 1;
                        else if (ware.type === "item") held.inventar.push(new Item(ware.name, ware.kind, ware.val));
                        else if (ware.type === "hp") held.hp = Math.min(held.max_hp, held.hp + ware.val);
                    }

                    if (ware.type === "traenke") await printSlow(`🧪 ${held.name} kauft ${anz}x Heiltrank.`);
                    else if (ware.type === "item") {
                        await printSlow(`📦 ${held.name} kauft ${anz}x ${ware.name}.`);
                        if (held.isKI) held.kiAutomatischAusruesten();
                    }
                    else if (ware.type === "hp") await printSlow(`🍎 ${held.name} nutzt ${anz}x ${ware.name} und regeneriert HP.`);
                }
            } else {
                await printSlow("❌ Ungültige Wahl!");
            }
        }
    }

    // Hintergrund im Panel wieder zurücksetzen
    if (logPanel) logPanel.style.backgroundImage = altesBild;
}

async function tavernenBesuch(helden) {
    // Das aktuelle Bild vom Panel speichern und auf Taverne wechseln
    const logPanel = document.getElementById('log-panel');
    const altesBild = logPanel ? logPanel.style.backgroundImage : "";
    if (logPanel) logPanel.style.backgroundImage = "url('img/Dungon-Taverne.png')";

    await printSlow("\n🍺 Ihr betretet die gemütliche Taverne 'Zum tanzenden JS-Bug'.");
    await printSlow("Die Gruppe ruht sich aus und regeneriert 10 HP.");
    helden.forEach(h => h.hp = Math.min(h.max_hp, h.hp + 10));

    await question("\nDer Kamin knistert gemütlich. Drückt Enter, um die Taverne wieder zu verlassen...");
    
    // Hintergrund im Panel wieder zurücksetzen
    if (logPanel) logPanel.style.backgroundImage = altesBild;
}

export { schatzFinden, shopBesuch, tavernenBesuch, bossLootGeben, faehigkeitWaehlen, synergienPruefen, craftingMenue };