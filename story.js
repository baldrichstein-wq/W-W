import Item from './item.js';
import { printSlow, question, wuerfelD20, randomRange, updateUI, formatAbilityDesc, triggerGoldAnimation } from './utils.js';
import { SPECIALIZATIONS, GAME_BALANCE, SHOP_WAREN, CRAFTING_REZEPTE, BOSS_LOOT, RARE_ARTIFACTS } from './config.js';

let schluesselGefunden = false;
 
let hofnarr = {
    name: "Pippin der Lustige", 
    hp: 60, 
    max_hp: 60, 
    active: false, 
    completed: false,
    duoConfusions: 0 // Zähler für das Comedy-Duo Achievement
};

const JESTER_JOKES = [
    "Warum gehen Skelette nicht tanzen? Sie haben niemanden zum Mitnehmen!",
    "Was ist ein Keks unter einem Baum? Ein schattiges Plätzchen.",
    "Wie nennt man einen dicken Schriftsteller? Kugelschreiber.",
    "Was macht ein Clown im Büro? Faxen.",
    "Warum sind Geister so schlechte Lügner? Man kann sie direkt durchschauen.",
    "Was ist grün und klopft an die Tür? Ein Klopfsalat.",
    "Was ist das Lieblingsessen von Vampiren? Ein Alphabet-Suppe ohne 'L' - weil sie kein Licht mögen?",
    "Warum können Piraten keinen Kreis berechnen? Weil sie Pi raten.",
    "Was ist ein kleiner Hund, der zaubern kann? Ein Labrakadabrador.",
    "Wie nennt man ein Kaninchen im Fitnessstudio? Pumpernickel.",
    "Was sitzt im Wald und schmollt? Ein Reh-Genschirm.",
    "Was ist gelb und kann schießen? Eine Banone.",
    "Warum fliegen Vögel im Winter in den Süden? Weil es zum Laufen zu weit ist.",
    "Was ist die Lieblingsmusik von Anglern? Der Barsch-Chor.",
    "Wie nennt man ein verschwundenes Rindvieh? Ox-gon.",
    "Was ist orange und wandert durch den Wald? Eine Wanderine.",
    "Warum tragen Fische keine Brillen? Weil sie in der Schule immer schwänzen.",
    "Was macht ein Pferd im Laden? Es kauft Äpfel.",
    "Was ist weiß und stört beim Essen? Eine Lawine.",
    "Warum sind Zwerge immer so glücklich? Weil jeder Grashalm ihnen Komplimente macht.",
    "Was ist braun, süß und läuft durch den Wald? Ein Schokoreh.",
    "Wie nennt man einen Hund, der am Strand liegt? Eine Hot Dog.",
    "Was ist ein Brot, das im Wald lebt? Ein Schwarzbrot-Bär.",
    "Was ist blau und steht am Straßenrand? Eine Blaubeere.",
    "Warum gehen Ameisen nicht in die Kirche? Weil sie In-Sekten sind.",
    "Was ist rot und sitzt auf dem Klo? Eine Klomate.",
    "Wie nennt man einen Bumerang, der nicht zurückkommt? Stock.",
    "Was ist klein, grün und dreieckig? Ein kleines grünes Dreieck.",
    "Warum haben Elefanten rote Augen? Damit sie sich im Kirschbaum verstecken können.",
    "Hast du schon mal einen Elefanten im Kirschbaum gesehen? Nein? Siehst du, wie gut sie sich verstecken!",
    "Was ist der Unterschied zwischen einem Joghurt und einem Mathematiker? Der Joghurt hat eine lebende Kultur.",
    "Was macht ein Mathematiker im Garten? Wurzeln ziehen.",
    "Was ist weiß und hüpft durch den Wald? Ein Jumpignon.",
    "Warum sind PC-Spiele im Mittelalter so schwer? Wegen der vielen Lags in der Rüstung.",
    "Wie nennt man einen Ritter mit einer Grippe? Blechschaden.",
    "Was ist das Gegenteil von Reformhaus? Reh-hinterm-Haus.",
    "Warum können Geister so gut Fußball spielen? Weil sie den Ball durchlassen.",
    "Was ist die Lieblingssportart von Schafen? Määäh-rathlon.",
    "Wie nennt man eine intelligente Toilette? Klugscheißer.",
    "Was ist schwarz-weiß und sitzt im Gefängnis? Ein Knast-Zebra.",
    "Warum sind Orks so schlechte Gärtner? Weil sie alles kurz und klein schlagen.",
    "Was ist die Lieblingsspeise von Helden? Heldensalat.",
    "Wie nennt man ein helles Monster? Ein Leuchtfeuer.",
    "Was macht ein Drache, wenn er wütend ist? Er kocht vor Wut.",
    "Warum haben Hexen Besen? Weil Staubsauger zu laut sind.",
    "Was ist ein Cow-boy ohne Pferd? Ein Sattelschlepper.",
    "Wie nennt man einen dicken Drachen? Ein Pfund-Speier.",
    "Was macht ein Skelett im Fitnessstudio? Es trainiert seine Knochen.",
    "Was ist ein runder Ritter? Sir Cumference.",
    "Warum hassen Programmierer die Natur? Zu viele Bugs!"
];

const RUMOR_POOL = [
    "Ein Gast flüstert: 'Der Skelett-König lauert tief in den Ruinen von Ebene 2...'",
    "Die Wirtin zwinkert: 'Man sagt, in der Labyrinth-Ebene gibt es Sackgassen, die von Elite-Wächtern bewacht werden.'",
    "Ein alter Abenteurer warnt: 'Vorsicht vor den Truhen in Ebene 7, manche haben Zähne!'",
    "Ein Barde spielt eine Weise: 'Nur das Lied des Lichts vertreibt den Schatten in der Tiefe...'",
    "Ein Dieb prahlt: 'Der Goldene Siegelring öffnet Wege, die kein Sterblicher je sah.'",
    "Ein Page erzählt: 'König Theron vermisst seinen Hofnarren Pippin schmerzlich.'",
    "Man sagt, in der Secret Ebene nach dem Sieg versteckt sich ein unsichtbarer rosa Ork...",
    "Der Händler am Eingang hat manchmal seltene Artefakte, wenn man genug Gold hat.",
    "In der zehnten Ebene fließt pures Magma, nehmt genug Tränke mit!"
];

function hatMaterialien(spieler, materialien) {
    const counts = {};
    spieler.inventar.forEach(it => counts[it.name] = (counts[it.name] || 0) + 1);
    return Object.entries(materialien).every(([name, menge]) => (counts[name] || 0) >= menge);
}

function berechneMaxHerstellbar(spieler, materialien) {
    const counts = {};
    spieler.inventar.forEach(it => counts[it.name] = (counts[it.name] || 0) + 1);
    let max = Infinity;
    for (const [name, menge] of Object.entries(materialien)) {
        const besitz = counts[name] || 0;
        const moeglich = Math.floor(besitz / menge);
        if (moeglich < max) max = moeglich;
    }
    return max === Infinity ? 0 : max;
}

function verbraucheMaterialien(spieler, materialien) {
    Object.entries(materialien).forEach(([name, menge]) => {
        for (let i = 0; i < menge; i++) {
            const idx = spieler.inventar.findIndex(it => it.name === name);
            if (idx !== -1) spieler.inventar.splice(idx, 1);
        }
    });
}

const QUEST_POOL = [
    { id: 1, title: "Jagdfieber", desc: "Besiege 10 Kreaturen im Wald (Ebene 1).", goal: 10, reward: { gold: 30, xp: 20 } },
    { id: 2, title: "Ersatzteile", desc: "Bringe dem Schmied 3 Mechanischeteile.", item: "Mechanischeteile", goal: 3, reward: { gold: 20, xp: 15 } },
    { id: 3, title: "Königsmörder", desc: "Besiege den Skelett-König in den Ruinen.", reward: { gold: 100, xp: 50 } },
    { id: 4, title: "Der Alchemist", desc: "Sammle 5 Pflanzenteile für den Tränkemeister.", item: "Pflanzenteile", goal: 5, reward: { gold: 40, xp: 30 } },
    { id: 5, title: "Der verlorene Ring", desc: "Finde den Goldenen Siegelring in den Tiefen des Dungeons.", item: "Goldener Siegelring", reward: { gold: 150, xp: 100 } },
    { id: 6, title: "Ein komischer Kauz", desc: "Begleite den Hofnarren Pippin sicher zur Burg.", reward: { gold: 200, xp: 150 } },
    { id: 7, title: "Gegen die Finsternis", desc: "Besorge 5 Fackeln für die Stadtwache.", item: "Fackel", goal: 5, reward: { gold: 25, xp: 20 } },
    { id: 8, title: "Sumpf-Säuberung", desc: "Besiege 5 Kreaturen im modrigen Sumpf (Ebene 4).", goal: 5, reward: { gold: 50, xp: 40 } },
    { id: 9, title: "Materialbeschaffung", desc: "Sammle 3 Bestienteile für neue Rüstungen.", item: "Bestienteile", goal: 3, reward: { gold: 35, xp: 25 } },
    { id: 10, title: "Spendierhosen", desc: "Gib insgesamt 50 Gold in der Taverne aus.", goal: 50, reward: { gold: 25, xp: 40 } }
];

const RAETSEL_MASTER_POOL = [
    { q: "Ich habe Städte, aber keine Häuser. Ich habe Berge, aber keine Bäume. Ich habe Wasser, aber keine Fische. Was bin ich?", a: "landkarte" },
    { q: "Was wird nass, während es trocknet?", a: "handtuch" },
    { q: "Je mehr man davon wegnimmt, desto größer wird es. Was ist das?", a: "loch" },
    { q: "Was läuft, hat aber keine Beine?", a: "nase" },
    { q: "Welcher Tag ist der längste in der Woche?", a: "donnerstag" },
    { q: "Wer es macht, der sagt es nicht. Wer es nimmt, der kennt es nicht. Wer es kennt, der will es nicht. Was ist das?", a: "falschgeld" },
    { q: "Was hat Augen, kann aber nichts sehen?", a: "kartoffel" }
];

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

        // Gruppierung für die Anzeige
        const groupedLoot = [];
        loot.forEach(item => {
            const entry = groupedLoot.find(g => g.name === item.name && g.typ === item.typ && g.wert === item.wert);
            if (entry) entry.count++;
            else groupedLoot.push({ name: item.name, typ: item.typ, wert: item.wert, count: 1 });
        });

        console.log(`\n--- ♻️ ZERLEGEN: ${held.name} ---`);
        groupedLoot.forEach((g, i) => console.log(`${i + 1}. ${g.count > 1 ? g.count + 'x ' : ''}${g.name} (${g.typ}, Wert: ${g.wert})`));
        console.log("0. Zurück");

        const wahl = await question("Welches Item zerlegen? ");
        if (wahl === "0") {
            aktiv = false;
        } else {
            const idx = parseInt(wahl) - 1;
            if (idx >= 0 && idx < groupedLoot.length) {
                const selected = groupedLoot[idx];
                const anzInput = await question(`Wie viele ${selected.name} zerlegen? (Max ${selected.count}): `);
                const anz = parseInt(anzInput);

                if (!isNaN(anz) && anz > 0 && anz <= selected.count) {
                    let matsGefunden = {};
                    for (let n = 0; n < anz; n++) {
                        const itemIdx = held.inventar.findIndex(it => it.name === selected.name && it.typ === selected.typ && it.wert === selected.wert);
                        if (itemIdx !== -1) {
                            held.inventar.splice(itemIdx, 1);
                            const mat = materialNachKlasse(held);
                            const menge = randomRange(1, 2);
                            for (let i = 0; i < menge; i++) {
                                held.inventar.push(new Item(mat, "Material", 0, null, "Rohstoff für Handwerkskunst."));
                                matsGefunden[mat] = (matsGefunden[mat] || 0) + 1;
                            }
                            // Chance auf seltene Komponenten
                            if (Math.random() < 0.05) { // 5% Chance
                                const rareMat = held.klasse.toLowerCase() === "tueftler" ? "Ionen-Kern" : "Magnum Opus";
                                held.inventar.push(new Item(rareMat, "Material", 0, null, "Eine seltene und mächtige Komponente."));
                                matsGefunden[rareMat] = (matsGefunden[rareMat] || 0) + 1;
                                await printSlow(`✨ ${held.name} findet eine seltene Komponente: <span class="rare-item">${rareMat}</span>!`);
                            }

                        }
                    }
                    const matString = Object.entries(matsGefunden).map(([name, count]) => `${count}x ${name}`).join(", ");
                    await printSlow(`🔨 ${held.name} zerlegt ${anz}x ${selected.name} und gewinnt: ${matString}!`);
                } else {
                    await printSlow("❌ Ungültige Anzahl.");
                }
            }
        }
    }
}

async function schwarzeTafel(helden) {
    await printSlow("\n📜 Ihr tretet an die verwitterte Schwarze Tafel am Eingang heran. Mehrere Aushänge flattern im Wind.");
    
    let amBrett = true;
    while (amBrett) {
        console.log("\n--- 📜 DIE SCHWARZE TAFEL ---");
        QUEST_POOL.forEach((q, i) => {
            const istAngenommen = helden.some(h => h.activeQuests.some(aq => aq.id === q.id));
            const istAbgeschlossen = helden.some(h => h.completedQuests.includes(q.id));
            let status = istAbgeschlossen ? "[ABGESCHLOSSEN]" : (istAngenommen ? "[AKTIV]" : "");
            console.log(`${i + 1}. ${q.title} ${status}`);
            console.log(`   - ${q.desc} (Belohnung: ${q.reward.gold} Gold, ${q.reward.xp} XP)`);
        });
        console.log("0. Tafel verlassen");

        const wahl = await question("\nWelchen Auftrag wollt ihr annehmen? ");
        if (wahl === "0") {
            amBrett = false;
        } else {
            const idx = parseInt(wahl) - 1;
            if (idx >= 0 && idx < QUEST_POOL.length) {
                const q = QUEST_POOL[idx];
                const bereitsAngenommen = helden.some(h => h.activeQuests.some(aq => aq.id === q.id));
                const bereitsAbgeschlossen = helden.some(h => h.completedQuests.includes(q.id));
                
                if (bereitsAbgeschlossen) {
                    await printSlow("❌ Diesen Auftrag habt ihr bereits erledigt.");
                } else if (bereitsAngenommen) {
                    await printSlow("❌ Diesen Auftrag verfolgt ihr bereits.");
                } else {
                    helden.forEach(h => h.activeQuests.push({...q, progress: 0}));
                    if (q.id === 6) {
                        hofnarr.active = true;
                        hofnarr.hp = hofnarr.max_hp;
                    }
                    await printSlow(`✅ Ihr habt den Auftrag angenommen: <span class="rare-item">${q.title}</span>!`);
                    // Sofort-Check falls Bedingungen bereits erfüllt (z.B. Items im Inventar)
                    await checkQuests(helden, { type: 'inventory' });
                }
            } else {
                console.log("Ungültige Wahl.");
            }
        }
    }
}

async function checkQuests(helden, context = {}) {
    for (const h of helden) {
        for (let i = h.activeQuests.length - 1; i >= 0; i--) {
            const q = h.activeQuests[i];
            let done = false;

            // Quest 1: Jagdfieber (10 Wald-Kills auf Ebene 1)
            if (q.id === 1 && context.type === 'kill' && context.ebene === 1) {
                q.progress = (q.progress || 0) + 1;
                if (q.progress >= q.goal) {
                    done = true;
                } else {
                    await printSlow(`📜 Quest-Fortschritt (${q.title}): ${q.progress}/${q.goal} Kills erreicht.`);
                }
            }
            
            // Sammel-Quests (ID 2, 4, 7, 9)
            if (q.id === 2 || q.id === 4 || q.id === 7 || q.id === 9) {
                const teile = h.inventar.filter(it => it.name === q.item).length;
                if (teile >= q.goal) {
                    let entfernt = 0;
                    for (let j = h.inventar.length - 1; j >= 0 && entfernt < q.goal; j--) {
                        if (h.inventar[j].name === q.item) {
                            h.inventar.splice(j, 1);
                            entfernt++;
                        }
                    }
                    done = true;
                } else if (context.type === 'inventory' && teile !== q.progress) {
                    q.progress = teile;
                    if (teile > 0) await printSlow(`📜 Quest-Fortschritt (${q.title}): ${teile}/${q.goal} ${q.item} gesammelt.`);
                }
            }

            // Quest 3: Königsmörder (Skelett-König)
            if (q.id === 3 && context.type === 'kill' && context.monster && context.monster.name.includes("Skelett-König")) {
                done = true;
            }

            // Quest 5: Der verlorene Ring (Goldener Siegelring finden)
            if (q.id === 5) {
                const hatRing = h.inventar.some(it => it.name === q.item);
                if (hatRing) {
                    done = true; // Ring wird nicht entfernt, da er für die Secret Ebene gebraucht wird
                }
            }

            // Quest 6: Ein komischer Kauz (Wird durch Interaktion mit dem König abgeschlossen)
            if (q.id === 6 && context.type === 'quest_complete' && context.questId === 6) {
                done = true;
            }

            // Quest 8: Sumpf-Säuberung (5 Kills auf Ebene 4)
            if (q.id === 8 && context.type === 'kill' && context.ebene === 4) {
                q.progress = (q.progress || 0) + 1;
                if (q.progress >= q.goal) {
                    done = true;
                } else {
                    await printSlow(`📜 Quest-Fortschritt (${q.title}): ${q.progress}/${q.goal} Kills erreicht.`);
                }
            }

            // Quest 10: Spendierhosen (Gold in der Taverne ausgeben)
            if (q.id === 10 && context.type === 'spend_gold') {
                q.progress = (q.progress || 0) + context.amount;
                if (q.progress >= q.goal) {
                    done = true;
                } else {
                    await printSlow(`📜 Quest-Fortschritt (${q.title}): ${q.progress}/${q.goal} Gold ausgegeben.`);
                }
            }

            if (done) {
                h.gold += q.reward.gold;
                h.xp += q.reward.xp;
                h.completedQuests.push(q.id);
                h.activeQuests.splice(i, 1);
                await printSlow(`\n✅ <span class="hp-gain">AUFTRAG ERFÜLLT: ${q.title}!</span>`);
                triggerGoldAnimation();
                
                // Quest-Benachrichtigung im UI aufblinken lassen
                const progressUi = document.getElementById('dungeon-progress-ui');
                if (progressUi) {
                    progressUi.classList.remove('quest-flash-active');
                    void progressUi.offsetWidth; // Force Reflow um die Animation neu zu starten
                    progressUi.classList.add('quest-flash-active');
                }

                await printSlow(`💰 Belohnung: ${q.reward.gold} Gold und ${q.reward.xp} XP erhalten.`);
                
                const levelsGained = h.check_levelup();
                if (levelsGained > 0) {
                    await printSlow(`\n🌟 LEVEL UP für ${h.name}! Level ${h.level}!`, 'level-up-animation');
                    await levelUpMenu(h, levelsGained);
                }
                updateUI(helden);
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
                        held.inventar.push(new Item(mat, "Material", 0, null, "Rohstoff für Handwerkskunst."));
                        await printSlow(`🤖 ${held.name} zerlegt ${it.name} -> ${mat}.`);
                    }
                }

                const rezepte = CRAFTING_REZEPTE[held.klasse.toLowerCase()];
                const machbar = rezepte.find(r => hatMaterialien(held, r.materialien));
                if (machbar) {
                    const wurf = wuerfelD20();
                    if (wurf + held.grund_int >= 10) {
                        verbraucheMaterialien(held, machbar.materialien);
                        held.inventar.push(new Item(machbar.name, "Spezial", 0, null, "Ein handgefertigtes Werkzeug."));
                        await printSlow(`🤖 ${held.name} (KI) hat ${machbar.name} erfolgreich hergestellt.`);
                    } else {
                        verbraucheMaterialien(held, machbar.materialien);
                        await printSlow(`🤖 ${held.name} (KI) ist beim Crafting von ${machbar.name} gescheitert!`);
                    }
                }
                amBasteln = false;
                continue;
            }

            console.log(`\n--- 🛠️ WERK BANK: ${held.name} (${held.klasse}) | Intelligenz: ${held.grund_int} ---`);
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
            const inventarZaehler = held.inventar.reduce((acc, it) => {
                acc[it.name] = (acc[it.name] || 0) + 1;
                return acc;
            }, {});

            rezepte.forEach((r, i) => {
                const mats = Object.entries(r.materialien).map(([n, m]) => {
                    const besitz = inventarZaehler[n] || 0;
                    const farbe = besitz >= m ? 'hp-gain' : 'effect-lifesteal';
                    return `${m}x <span class="${farbe}">${n}</span> (Du hast: ${besitz})`;
                }).join(", ");
                console.log(`${i + 1}. ${r.name} herstellen - Kosten: ${mats}`);
            });
            console.log("0. Werkbank verlassen");

            const wahl = await question("Was möchtest du herstellen? ");
            if (wahl === "0") {
                amBasteln = false;
            } else {
                const rezept = rezepte[parseInt(wahl) - 1];
                if (rezept) {
                    const maxHerstellbar = berechneMaxHerstellbar(held, rezept.materialien);
                    if (maxHerstellbar === 0) {
                        await printSlow("❌ Fehlende Materialien!");
                        continue;
                    }

                    const anzInput = await question(`Wie viele ${rezept.name} herstellen? (Max ${maxHerstellbar}, 0 zum Abbrechen): `);
                    const anz = parseInt(anzInput);
                    
                    if (!isNaN(anz) && anz > 0 && anz <= maxHerstellbar) {
                        const dc = 10 + (held.crafting_success_bonus || 0); // DC wird durch Bonus reduziert
                        let erfolge = 0;
                        let patzer = 0;
                        for (let i = 0; i < anz; i++) {
                            let materialsConsumed = true;
                            if (held.material_efficiency_bonus > 0 && Math.random() < held.material_efficiency_bonus) {
                                await printSlow(`♻️ ${held.name}s Materialeffizienz verhindert den Verbrauch von Materialien für ${rezept.name}!`);
                                materialsConsumed = false;
                            }
                            if (materialsConsumed) {
                                verbraucheMaterialien(held, rezept.materialien);
                            }
                            
                            const wurf = wuerfelD20();
                            if (wurf + held.grund_int >= dc) {
                                held.inventar.push(new Item(rezept.name, "Spezial", 0, null, "Ein handgefertigtes Werkzeug."));
                                erfolge++;
                            } else {
                                patzer++;
                            }
                        }
                        if (erfolge > 0) await printSlow(`✨ Erfolg! ${held.name} hat ${erfolge}x ${rezept.name} hergestellt.`);
                        if (patzer > 0) await printSlow(`💥 Patzer! Bei ${patzer} Versuchen wurden die Materialien zerstört.`);
                    }
                } else {
                    await printSlow("❌ Ungültige Wahl.");
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
        { name: "Klinge der Götter", ap_kosten: 40, schaden: 40, element: "Physisch" },
        { name: "Erschütternder Schlag", ap_kosten: 20, schaden: 22, verwirrt: 1 },
        { name: "Berserker-Modus", ap_kosten: 25, atk_buff: 12, def_buff: -5 },
        { name: "Schildwall", ap_kosten: 20, def_buff: 10 },
        { name: "Drachenhieb", ap_kosten: 30, schaden: 35, element: "Feuer" },
        { name: "Unaufhaltsam", ap_kosten: 0, heilung: 15, ap_regen: 5 },
        { name: "Waffengewalt", ap_kosten: 20, schaden: 10, element: "Physisch" }
    ],
    "magier": [
        { name: "Meteor", mp_kosten: 35, schaden: 50, element: "Feuer" },
        { name: "Frostnova", mp_kosten: 20, schlaf_dauer: 1, element: "Eis" },
        { name: "Arkaner Fokus", mp_kosten: 10, atk_buff: 10 },
        { name: "Mana-Schild", mp_kosten: 20, def_buff: 10 },
        { name: "Eiszeit", mp_kosten: 30, schlaf_dauer: 2, element: "Eis" },
        { name: "Kettenblitz", mp_kosten: 25, schaden: 30, element: "Blitz" },
        { name: "Zeitstopp", mp_kosten: 50, schlaf_dauer: 2 },
        { name: "Spiegelbild", mp_kosten: 15, def_buff: 8 },
        { name: "Desintegration", mp_kosten: 40, execute_threshold: 15 },
        { name: "Elementarsturm", mp_kosten: 60, schaden: 60, element: "Energie" },
        { name: "Arkane Überladung", mp_kosten: 25, schaden: 15, element: "Energie" }
    ],
    "schurke": [
        { name: "Giftiger Dolch", ap_kosten: 15, schaden: 15, verwirrt: 1, element: "Gift" },
        { name: "Schattenschritt", ap_kosten: 20, atk_buff: 6 },
        { name: "Fächerstoß", ap_kosten: 25, schaden: 22, element: "Physisch" },
        { name: "Tödlicher Stoß", ap_kosten: 25, execute_threshold: 15, element: "Physisch" },
        { name: "Schattentanz", ap_kosten: 25, atk_buff: 8 },
        { name: "Rauchbombe", ap_kosten: 15, verwirrt: 2 },
        { name: "Nierenhieb", ap_kosten: 18, schlaf_dauer: 1 },
        { name: "Adrenalinrausch", ap_kosten: 0, ap_regen: 10 },
        { name: "Ausweidertanz", ap_kosten: 30, schaden: 32 },
        { name: "Meisterschütze", ap_kosten: 22, schaden: 28 },
        { name: "Präzisionsschlag", ap_kosten: 20, schaden: 12, element: "Physisch" }
    ],
    "heiler": [
        { name: "Heiliger Regen", mp_kosten: 20, heilung: 30, element: "Heilig" },
        { name: "Göttlicher Schutz", mp_kosten: 15, def_buff: 5 },
        { name: "Reinigung", mp_kosten: 8, heilung: 15, element: "Heilig" },
        { name: "Lebenslicht", mp_kosten: 30, heilung: 40, element: "Heilig" },
        { name: "Göttlicher Zorn", mp_kosten: 20, schaden: 25, element: "Heilig" },
        { name: "Segnung", mp_kosten: 15, atk_buff: 5, def_buff: 5 },
        { name: "Zuflucht", mp_kosten: 25, heilung: 45 },
        { name: "Bannung", mp_kosten: 15, schaden: 20, element: "Heilig" },
        { name: "Märtyrer-Segen", mp_kosten: 12, heilung: 60, hp_kosten: 15 },
        { name: "Licht-Avatar", mp_kosten: 45, atk_buff: 15, def_buff: 10 },
        { name: "Heiliges Leuchten", mp_kosten: 10, licht: 5, licht_def: 2, abschrecken: 30 }
    ],
    "verteidiger": [
        { name: "Bollwerk", ap_kosten: 25, def_buff: 10 },
        { name: "Herausforderung", ap_kosten: 15, atk_buff: 3 },
        { name: "Eiserner Wille", ap_kosten: 20, heilung: 15 },
        { name: "Eiserner Wall", ap_kosten: 30, def_buff: 12 },
        { name: "Vergeltung", ap_kosten: 25, schaden: 20, atk_buff: 5, element: "Physisch" },
        { name: "Standhalten", ap_kosten: 20, heilung: 25 },
        { name: "Schildschlag", ap_kosten: 18, schaden: 15, verwirrt: 1 },
        { name: "Unerschütterlich", ap_kosten: 25, def_buff: 15 },
        { name: "Phalanx", ap_kosten: 35, def_buff: 8 },
        { name: "Reflektionsschild", ap_kosten: 20, schaden: 15 }
    ],
    "barde": [
        { name: "Hymne des Sieges", mp_kosten: 25, atk_buff: 15 },
        { name: "Spottvers", mp_kosten: 10, schaden: 12, verwirrt: 1, element: "Schall" },
        { name: "Lied der Ruhe", mp_kosten: 20, schlaf_dauer: 1, element: "Schall" },
        { name: "Requiem", mp_kosten: 35, schaden: 30, verwirrt: 2, element: "Schall" },
        { name: "Symphonie der Hoffnung", mp_kosten: 30, heilung: 20, atk_buff: 5 },
        { name: "Dissonanz", mp_kosten: 15, schaden: 18, verwirrt: 1 },
        { name: "Ballade der Stärke", mp_kosten: 12, atk_buff: 10 },
        { name: "Tanz der Schwerter", mp_kosten: 20, schaden: 25 },
        { name: "Echo der Ahnen", mp_kosten: 18, heilung: 20 },
        { name: "Finale der Verdammnis", mp_kosten: 50, schaden: 55 },
        { name: "Lied des Lichts", mp_kosten: 12, licht: 5, licht_atk: 2 }
    ],
    "tueftler": [
        { name: "Tesla-Spule", ap_kosten: 0, material_kosten: "Batterie", schaden: 35, element: "Blitz" },
        { name: "Reparatur-Bot", ap_kosten: 0, material_kosten: "Reparatur-Kit", heilung: 25 },
        { name: "Schockgranate", ap_kosten: 0, material_kosten: "Schockgranate", schlaf_dauer: 1, element: "Energie" },
        { name: "Laserstrahl", ap_kosten: 0, material_kosten: "Fokuslinse", schaden: 45, element: "Energie" },
        { name: "Stasis-Feld", ap_kosten: 0, material_kosten: "Stasis-Modul", niederhalten: 2, element: "Energie" },
        { name: "Mini-Rakete", ap_kosten: 0, material_kosten: "Mini-Rakete", schaden: 30, element: "Feuer" },
        { name: "Energiefeld", ap_kosten: 0, material_kosten: "Schild-Generator", def_buff: 10 },
        { name: "Overclock", ap_kosten: 0, material_kosten: "Taktgeber", atk_buff: 12 },
        { name: "Nanobots", ap_kosten: 0, material_kosten: "Nanobots", heilung: 30 },
        { name: "Ionenkanone", ap_kosten: 0, material_kosten: "Ionen-Kern", schaden: 65, element: "Blitz" }
    ],
    "alchemist": [
        { name: "Explosives Gemisch", ap_kosten: 0, material_kosten: "Explosivtrank", schaden: 40, element: "Feuer" },
        { name: "Stärkungstrank", ap_kosten: 0, material_kosten: "Stärkungstrank", atk_buff: 10 },
        { name: "Nebelbombe", ap_kosten: 0, material_kosten: "Rauchbombe", verwirrt: 1, element: "Gift" },
        { name: "Elixier des Lebens", ap_kosten: 0, material_kosten: "Heiltrank", heilung: 45 },
        { name: "Chaos-Viole", ap_kosten: 0, material_kosten: "Chaos-Viole", schaden: 30, verwirrt: 2, element: "Säure" },
        { name: "Frosttrank", ap_kosten: 0, material_kosten: "Frosttrank", schlaf_dauer: 1, element: "Eis" },
        { name: "Fläschchen der Wut", ap_kosten: 0, material_kosten: "Wuttrank", atk_buff: 15 },
        { name: "Regenerationspaste", ap_kosten: 0, material_kosten: "Regenerationspaste", heilung: 35 },
        { name: "Ätzende Wolke", ap_kosten: 0, material_kosten: "Säureflasche", schaden: 25, element: "Säure" },
        { name: "Magnum Opus", ap_kosten: 0, material_kosten: "Magnum Opus", schaden: 45, heilung: 20, element: "Energie" }
    ],
    // --- SPEZIALISIERUNGEN ---
    "paladin": [
        { name: "Göttliches Urteil", ap_kosten: 35, schaden: 40, heilung: 15, element: "Heilig" },
        { name: "Heiliger Schild", ap_kosten: 25, def_buff: 15, heilung: 10 }
    ],
    "berserker": [
        { name: "Blutrausch", ap_kosten: 30, atk_buff: 20, hp_kosten: 10 },
        { name: "Köpfen", ap_kosten: 40, schaden: 50, execute_threshold: 25 }
    ],
    "erzmagier": [
        { name: "Zeitkrümmung", ap_kosten: 50, ap_regen: 20, schlaf_dauer: 1 },
        { name: "Kometeneinschlag", ap_kosten: 60, schaden: 85, element: "Feuer" }
    ],
    "nekromant": [
        { name: "Schattenbeschwörung", ap_kosten: 40, schaden: 35, element: "Schatten" },
        { name: "Lebensentzug", ap_kosten: 30, schaden: 25, heilung: 20, element: "Schatten" }
    ],
    "assassine": [
        { name: "Todesstoß", ap_kosten: 35, schaden: 100, execute_threshold: 30 },
        { name: "Schattenfluch", ap_kosten: 20, verwirrt: 3, element: "Schatten" }
    ],
    "schattenläufer": [
        { name: "Schattenschlag", ap_kosten: 20, schaden: 30, element: "Schatten" },
        { name: "Nebelschleier", ap_kosten: 15, def_buff: 8 }
    ],
    "hohepriester": [
        { name: "Avatar des Lichts", ap_kosten: 50, heilung: 100, belebt: 1 },
        { name: "Heilige Aura", ap_kosten: 30, def_buff: 10, ap_regen: 5 }
    ],
    "inquisitor": [
        { name: "Glaubenseifer", ap_kosten: 25, atk_buff: 12 },
        { name: "Ketzerbann", ap_kosten: 20, schaden: 35, element: "Heilig" }
    ],
    "wächter": [
        { name: "Unsterblichkeit", ap_kosten: 45, def_buff: 30, heilung: 20 },
        { name: "Schild der Vergeltung", ap_kosten: 30, schaden: 30, def_buff: 10 }
    ],
    "ritter": [
        { name: "Ehrenhafter Stoß", ap_kosten: 20, schaden: 35 },
        { name: "Eiserne Disziplin", ap_kosten: 15, def_buff: 12 }
    ],
    "minnesänger": [
        { name: "Lied der Sehnsucht", ap_kosten: 30, heilung: 40 },
        { name: "Heldenepos", ap_kosten: 25, atk_buff: 8 }
    ],
    "troubadour": [
        { name: "Spottlied", ap_kosten: 20, verwirrt: 2 },
        { name: "Reim-Attacke", ap_kosten: 15, schaden: 25, element: "Schall" }
    ],
    "liedmeister": [
        { name: "Refrain der Erneuerung", ap_kosten: 25, mp_restoration_team: 10 },
        { name: "Harmonische Resonanz", ap_kosten: 30, schaden: 25, element: "Schall" }
    ],
    "maschinist": [
        { name: "Belagerungsmodus", ap_kosten: 0, material_kosten: "Belagerungs-Kern", schaden: 70, element: "Physisch" },
        { name: "Drohnen-Schwarm", ap_kosten: 0, material_kosten: "Drohnen-Steuerung", schaden: 40, verwirrt: 2 }
    ],
    "erfinder": [
        { name: "Automaton", ap_kosten: 0, material_kosten: "Mechanischeteile", schaden: 35 },
        { name: "Energie-Zelle", ap_kosten: 0, material_kosten: "Maschinenoel", ap_regen: 20 }
    ],
    "meister-alchemist": [
        { name: "Panacea", ap_kosten: 0, material_kosten: "Panacea", heilung: 80, ap_regen: 20 },
        { name: "Ultima-Bombe", ap_kosten: 0, material_kosten: "Ultima-Bombe", schaden: 90, element: "Energie" }
    ],
    "mutator": [
        { name: "Adrenalin-Serum", ap_kosten: 0, material_kosten: "Bestienteile", atk_buff: 15 },
        { name: "Regenerations-Mutagen", ap_kosten: 0, material_kosten: "Pflanzenteile", heilung: 50 }
    ],
    "beschwörer": [
        { name: "Dämonen-Armee", mp_kosten: 40, schaden: 45, element: "Schatten" },
        { name: "Leeren-Schild", mp_kosten: 20, def_buff: 12 }
    ],
    "dämonologe": [
        { name: "Pakt mit dem Teufel", ap_kosten: 30, schaden: 60, hp_kosten: 15, element: "Feuer" },
        { name: "Chaos-Invasion", ap_kosten: 45, schaden: 50, verwirrt: 2 },
        { name: "Dämonische Übernahme", ap_kosten: 40, subjugated: 1, element: "Schatten" }
    ],
    "elementarist": [
        { name: "Elementarsturm", ap_kosten: 40, schaden: 40, element: "Energie" },
        { name: "Kristallfokus", ap_kosten: 20, mp_restoration_team: 15 }
    ]
};

const SYNERGIE_ABILITIES = {
    "krieger+heiler": { name: "Heiliger Ansturm", ap_kosten: 15, schaden: 15, heilung: 10, element: "Heilig" },
    "magier+alchemist": { name: "Mana-Explosion", ap_kosten: 0, schaden: 35, verwirrt: 1, element: "Energie" },
    "schurke+barde": { name: "Schatten-Serenade", ap_kosten: 18, schlaf_dauer: 1, atk_buff: 5, element: "Schall" },
    "verteidiger+tueftler": { name: "Bollwerk-Upgrade", ap_kosten: 0, def_buff: 8 },
    "krieger+schurke": { name: "Blutiges Duo", ap_kosten: 20, schaden: 30, element: "Physisch" },
    "magier+barde": { name: "Sphärenklang", ap_kosten: 22, schaden: 20, schlaf_dauer: 1, element: "Schall" },
    "verteidiger+heiler": { name: "Glaubensmauer", ap_kosten: 20, def_buff: 5, heilung: 15, element: "Heilig" },
    "liedmeister+erzmagier": { name: "Arkaner Refrain", ap_kosten: 0, mp_restoration_team: 15, ap_restoration_team: 15, element: "Energie" },
    "beschwoerer+nekromant": { name: "Schattenbund", ap_kosten: 25, schaden: 35, heilung: 20, element: "Schatten" },
    "dämonologe+nekromant": { name: "Höllenschlund-Riss", ap_kosten: 30, schaden: 50, element: "Schatten" },
    "elementarist+nekromant": { name: "Spektraler Sturm", ap_kosten: 30, schaden: 40, verwirrt: 2, element: "Schatten" }
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

async function raetselMeisterBegegnung(helden) {
    const r = RAETSEL_MASTER_POOL[randomRange(0, RAETSEL_MASTER_POOL.length - 1)];
    await printSlow("\n🎭 <span class='rare-item'>Ein mysteriöser Rätselmeister erscheint aus dem Schatten!</span>");
    await printSlow("'Seid gegrüßt, Wanderer. Löst mein Rätsel und werdet belohnt. Scheitert ihr, wird es schmerzhaft...'");
    await printSlow(`\n"<span class="synergy-text">${r.q}</span>"`);
    
    const antwort = await question("Deine Antwort: ");
    const spielerAntwort = antwort.toLowerCase().trim().replace(/\.$/, "");

    if (spielerAntwort === r.a.toLowerCase()) {
        await printSlow(`\n✨ <span class="hp-gain">'Hervorragend! Ihr seid weiser als ihr ausseht.'</span>`);
        const goldPlus = randomRange(40, 80);
        const xpPlus = randomRange(25, 50);
        
        for (const h of helden) {
            h.gold += goldPlus;
            h.xp += xpPlus;
            h.hp = Math.min(h.max_hp, h.hp + 15);
            const levelsGained = h.check_levelup();
            if (levelsGained > 0) {
                await printSlow(`\n🌟 LEVEL UP für ${h.name}! Level ${h.level}!`, 'level-up-animation');
                await levelUpMenu(h, levelsGained);
            }
        }
        triggerGoldAnimation();
        await printSlow(`🎁 Die Gruppe erhält <span class="hp-gain">${goldPlus} Gold, ${xpPlus} XP</span> und regeneriert <span class="hp-gain">15 HP</span>!`);
    } else {
        await printSlow(`\n💨 <span class="effect-lifesteal">'Leider falsch! Die Antwort war: ${r.a}. Bereitet euch auf meine Strafe vor!'</span>`);
        const schaden = randomRange(10, 25);
        for (const h of helden) {
            h.hp = Math.max(1, h.hp - schaden);
            h.totalDamageTaken += schaden;
            h.damageSources["Rätselmeister"] = (h.damageSources["Rätselmeister"] || 0) + schaden;
        }
        await printSlow(`💥 <span class="effect-lifesteal">Ein magischer Blitz trifft die Gruppe! Jeder verliert ${schaden} HP.</span>`);
    }
    updateUI(helden);
}

async function bossLootGeben(helden) {
    await printSlow("\n🎁 Der Wächter hinterlässt seltene Schätze für die Sieger!");
    const lebendeHelden = helden.filter(h => h.hp > 0);
    if (lebendeHelden.length === 0) return;

    for (const empfaenger of lebendeHelden) {
        const itemData = BOSS_LOOT[randomRange(0, BOSS_LOOT.length - 1)];
        const item = new Item(itemData.name, itemData.kind, itemData.val, null, itemData.lore || "Ein legendärer Schatz des Wächters.");
        empfaenger.inventar.push(item);
        await printSlow(`✨ ${empfaenger.name} erhält ein <span class="rare-item">seltenes Fundstück: ${item.name}</span> (${item.typ}: ${item.wert})!`);
        if (empfaenger.isKI) empfaenger.kiAutomatischAusruesten();
    }

    // Chance auf das Secret Item (30% bei Mini-Bossen, falls noch nicht gefunden)
    if (!schluesselGefunden && Math.random() < 0.3) {
        const siegel = new Item("Goldener Siegelring", "Secret", 0, null, "Ein uraltes Erbstück. Er vibriert in der Nähe von Portalen.");
        const finder = lebendeHelden[randomRange(0, lebendeHelden.length - 1)];
        finder.inventar.push(siegel);
        schluesselGefunden = true;
        await printSlow(`\n🗝️ <span class="rare-item">HALT! Was ist das?</span> ${finder.name} findet zudem einen **${siegel.name}**. Er scheint magisch zu vibrieren...`);
    }
}

async function raetselPhase() {
    const raetselPool = [
        { q: "Was hat Städte, aber keine Häuser; Berge, aber keine Bäume; und Wasser, aber keine Fische?", a: "landkarte" },
        { q: "Ich bin immer hungrig, ich muss immer gefüttert werden. Das Holz, das ich berühre, wird bald rot. Was bin ich?", a: "feuer" },
        { q: "Ich habe einen Hals, aber keinen Kopf. Ich habe zwei Arme, aber keine Hände. Was bin ich?", a: "hemd" },
        { q: "Was wird nass, während es trocknet?", a: "handtuch" }
    ];

    const r = raetselPool[randomRange(0, raetselPool.length - 1)];
    await printSlow("\n🔮 Eine spektrale Stimme hallt durch den Raum:");
    await printSlow(`"<span class="synergy-text">${r.q}</span>"`);
    
    const antwort = await question("Deine Antwort: ");
    // Wir nutzen trim() und entfernen einen evtl. Punkt am Ende der Antwort
    if (antwort.toLowerCase().trim().replace(/\.$/, "") === r.a) {
        await printSlow(`\n✨ <span class="hp-gain">"Richtig... tretet ein in das Reich, das jenseits der Zeit liegt."</span>`);
        return true;
    } else {
        await printSlow(`\n💨 <span class="effect-lifesteal">"Falsch! Das Portal bleibt euch verschlossen."</span>`);
        return false;
    }
}

async function secretEbeneIntro() {
    const logPanel = document.getElementById('log-panel');
    if (logPanel) logPanel.style.backgroundImage = "url('img/Dungon-Secret.png')";
    await printSlow(`\n🌌 <span class="rare-item">DIE VERBORGENE DIMENSION</span> 🌌`);
    await printSlow("Ihr tretet durch den Riss in der Realität. Hier gelten die Gesetze der Natur nicht mehr.");
    await printSlow("Vor euch schwebt der **Leeren-Wächter**, das wahre Ende dieses Dungeons.");
}

async function levelUpMenu(held, helden, levelsGained = 1) {
    let skillPunkte = GAME_BALANCE.XP.SKILL_POINTS_PER_LEVEL * levelsGained;
    await printSlow(`\n✨ --- LEVEL UP: ${held.name} (Level ${held.level}) ---`);
    if (levelsGained > 1) {
        await printSlow(`Beeindruckend! Ihr seid gleich <span class="rare-item">${levelsGained} Stufen</span> auf einmal aufgestiegen!`);
    }
    await printSlow(`Ihr erhaltet <span class="rare-item">${skillPunkte} Skill-Punkte</span> zum freien Verteilen auf eure Attribute!`);

    const attribute = {
        "1": { name: "Konstitution", prop: "max_hp", gain: 5, label: "+5 Max HP" },
        "2": { name: "Stärke", prop: "atk_bonus", gain: 1, label: "+1 ATK" },
        "3": { name: "Verteidigung", prop: "def_bonus", gain: 1, label: "+1 RK" },
        "4": { name: "Fokus", prop: "max_ap", gain: 5, label: "+5 Max AP" },
        "5": { name: "Geschicklichkeit", prop: "grund_gesch", gain: 1, label: "+1 GES" }, // Neues Attribut
        "6": { name: "Charisma", prop: "grund_cha", gain: 1, label: "+1 CHA" },
        "7": { name: "Intelligenz", prop: "grund_int", gain: 1, label: "+1 INT" },
        "8": { name: "Mana", prop: "max_mp", gain: 10, label: "+10 Max MP" }
    };

    while (skillPunkte > 0) {
        if (held.isKI) {
            // KI bevorzugt Mana nur, wenn sie auch MP besitzt
            const keys = Object.keys(attribute).filter(k => k !== "8" || held.max_mp > 0);
            const wahl = keys[randomRange(0, keys.length - 1)];
            const attr = attribute[wahl];
            held[attr.prop] += attr.gain;
            if (attr.prop === "max_hp") held.hp += attr.gain;
            if (attr.prop === "max_ap") held.ap += attr.gain;
            if (attr.prop === "max_mp") held.mp += attr.gain;
            skillPunkte--;
            await printSlow(`🤖 ${held.name} investiert in ${attr.name}.`);
        } else {
            console.log(`\nVerfügbare Punkte: ${skillPunkte}`);
            Object.entries(attribute).forEach(([key, attr]) => {
                console.log(`${key}. ${attr.name} (${attr.label} | Aktuell: ${held[attr.prop]})`);
            });

            const wahl = await question("Was möchtest du steigern? ");
            const attr = attribute[wahl];
            if (attr) {
                held[attr.prop] += attr.gain;
                if (attr.prop === "max_hp") held.hp += attr.gain;
                if (attr.prop === "max_ap") held.ap += attr.gain;
                if (attr.prop === "max_mp") held.mp += attr.gain;
                skillPunkte--;
                await printSlow(`✅ ${attr.name} gesteigert!`);
            } else {
                await printSlow("❌ Ungültige Wahl.");
            }
        }
    }

    await printSlow("Alle Punkte wurden erfolgreich investiert.");

    // Spezialisierungs-Auswahl ab Level 15
    const basisKlasse = held.klasse.toLowerCase();
    if (held.level >= 15 && SPECIALIZATIONS[basisKlasse]) {
        const optionen = SPECIALIZATIONS[basisKlasse];
        await printSlow(`\n🌟 <span class="rare-item">${held.name}</span> hat eine neue Stufe der Meisterschaft erreicht!`);
        await printSlow(`Wählt einen Pfad, um eure Kräfte zu spezialisieren:`);

        optionen.forEach((opt, i) => console.log(`${i + 1}. ${opt.name}`));

        let wahlIdx = -1;
        if (held.isKI) {
            wahlIdx = randomRange(0, optionen.length - 1);
        } else {
            const wahl = await question(`Eure Wahl (1-${optionen.length}): `);
            wahlIdx = parseInt(wahl) - 1;
            if (isNaN(wahlIdx) || wahlIdx < 0 || wahlIdx >= optionen.length) wahlIdx = 0;
        }

        const chosenSpecialization = optionen[wahlIdx];
        const neueKlasse = chosenSpecialization.name;
        held.klasse = neueKlasse;
        await printSlow(`✨ Unglaublich! ${held.name} ist nun ein <span class="rare-item">${neueKlasse}</span>!`);
        await printSlow(`Neue, mächtigere Fähigkeiten stehen euch nun beim nächsten Lernen zur Verfügung.`);

        // Passive Boni anwenden
        if (chosenSpecialization && chosenSpecialization.passiveBonus) {
            const bonus = chosenSpecialization.passiveBonus;
            switch (bonus.type) {
                case "crit_threshold_modifier":
                    held.crit_threshold_modifier += bonus.value;
                    await printSlow(`📈 ${held.name} erhält einen passiven Bonus: Kritische Treffer sind nun leichter zu erzielen!`);
                    break;
                case "ap_regen_modifier":
                    held.ap_regen_modifier += bonus.value;
                    await printSlow(`✨ ${held.name} regeneriert nun zusätzlich ${bonus.value} AP pro Runde!`);
                    break;
                case "atk_bonus":
                    held.atk_bonus += bonus.value;
                    await printSlow(`⚔️ ${held.name} erhält einen passiven Bonus: +${bonus.value} ATK!`);
                    break;
                case "def_bonus":
                    held.def_bonus += bonus.value;
                    await printSlow(`🛡️ ${held.name} erhält einen passiven Bonus: +${bonus.value} RK!`);
                    break;
                case "max_hp":
                    held.max_hp += bonus.value;
                    held.hp += bonus.value; // Heilt auch um den neuen Max-HP-Wert
                    await printSlow(`❤️ ${held.name} erhält einen passiven Bonus: +${bonus.value} Max HP!`);
                    break;
                case "healing_output_bonus":
                    held.healing_output_bonus += bonus.value;
                    await printSlow(`💚 ${held.name}s Heilzauber und Tränke sind nun um ${bonus.value * 100}% effektiver!`);
                    break;
                case "damage_reduction_bonus":
                    held.damage_reduction_bonus += bonus.value;
                    await printSlow(`🛡️ ${held.name} erleidet nun ${bonus.value} weniger Schaden pro Treffer!`);
                    break;
                case "buff_duration_bonus":
                    held.buff_duration_bonus += bonus.value;
                    await printSlow(`⏳ ${held.name}s Buffs halten nun ${bonus.value} Runde(n) länger!`);
                    break;
                case "debuff_duration_bonus":
                    held.debuff_duration_bonus += bonus.value;
                    await printSlow(`⏳ ${held.name}s Debuffs halten nun ${bonus.value} Runde(n) länger!`);
                    break;
                case "crafting_success_bonus":
                    held.crafting_success_bonus += bonus.value;
                    await printSlow(`🛠️ ${held.name} ist nun geschickter beim Handwerken (Crafting-DC um ${Math.abs(bonus.value)} reduziert)!`);
                    break;
                case "material_efficiency_bonus":
                    held.material_efficiency_bonus += bonus.value;
                    await printSlow(`♻️ ${held.name} hat nun eine ${bonus.value * 100}% Chance, Materialien beim Crafting nicht zu verbrauchen!`);
                    break;
                case "grund_stealth":
                    held.grund_stealth += bonus.value;
                    await printSlow(`👤 ${held.name} ist nun noch verstohlener (+${bonus.value} Stealth)!`);
                    break;
                case "hp_regen_bonus":
                    held.hp_regen_bonus += bonus.value;
                    await printSlow(`❤️ ${held.name} regeneriert nun zusätzlich ${bonus.value} HP pro Runde!`);
                    break;
                case "mp_regen_modifier":
                    held.mp_regen_modifier += bonus.value;
                    await printSlow(`🔮 ${held.name} regeneriert nun zusätzlich ${bonus.value} MP pro Runde!`);
                    break;
                default:
                    await printSlow(`Ein unbekannter passiver Bonus wurde für ${held.name} angewendet.`);
            }
        }
    }

    // Nach einer möglichen Spezialisierung prüfen wir erneut auf Synergien
    await synergienPruefen(helden);

    // Achievement-Check für "Arkaner Meister"
    if (held.klasse.toLowerCase() === "magier" && held.grund_int >= 30 && !held.achievements.includes("Arkaner Meister")) {
        held.achievements.push("Arkaner Meister");
        await printSlow(`\n✨ <span class="hp-gain">🏆 ERRUNGENSCHAFT FREIGESCHALTET: ARKANER MEISTER!</span> (${held.name} hat eine Intelligenz von 30 erreicht und seine Gedankenschärfe perfektioniert!)`);
    }
    // Im Anschluss eine neue Fähigkeit wählen lassen
    await faehigkeitWaehlen(held);
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
            let info = "";
            let warning = "";
            if (a.isUltimate) info = `(ULTIMATE - SP: ${a.sp_kosten})`;
            else if (a.material_kosten) {
                const count = spieler.inventar.filter(it => it.name === a.material_kosten).length;
                info = `(Benötigt: ${a.material_kosten})`;
                if (count === 0) warning = ' <span class="effect-lifesteal">[Kein Vorrat]</span>';
            }
            else info = `(AP: ${a.ap_kosten})`;
            const desc = formatAbilityDesc(a, spieler);
            console.log(`${i + 1}. <span class="tooltip">${a.name}<span class="tooltiptext"><strong>${a.name}</strong><br>${desc}</span></span> ${info}${warning}`);
        });
        const wahl = await question("Wähle eine Fähigkeit (1-2): ");
        const idx = parseInt(wahl) - 1;
        const gewaehlt = (idx >= 0 && idx < auswahl.length) ? auswahl[idx] : auswahl[0];

        if (gewaehlt.material_kosten) {
            const count = spieler.inventar.filter(it => it.name === gewaehlt.material_kosten).length;
            if (count === 0) {
                await printSlow(`⚠️ <span class="effect-lifesteal">Warnung:</span> Du hast keine **${gewaehlt.material_kosten}** im Inventar. Du musst diese erst herstellen, um die Fähigkeit nutzen zu können!`);
            }
        }

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
    const gesamt = wurf + (aktiver.trap_detection_bonus || 0);
    await printSlow(`🎲 Wurf: ${wurf}${aktiver.trap_detection_bonus > 0 ? ' (+' + aktiver.trap_detection_bonus + ' Halbling-Sinn)' : ''} = ${gesamt}`);

    if (gesamt >= 10) {
        if (wurf < 10 && gesamt >= 10) {
            await printSlow(`✨ Dank der geschärften Sinne eines Halblings bemerkt ${aktiver.name} eine verborgene Druckplatte und umgeht sie geschickt!`);
        }

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

        let goldFund = randomRange(1, 50);
        if (aktiver.hatBardenBuff) goldFund = Math.floor(goldFund * 1.1);
        aktiver.gold += goldFund;
        triggerGoldAnimation();
        await printSlow(`💎 Erfolg! ${aktiver.name} öffnet die Truhe und findet ${goldFund} Gold!`);

        for (const h of helden) {
            const randomData = itemPool[randomRange(0, itemPool.length - 1)];
            const loot = new Item(randomData.name, randomData.typ, randomData.wert, null, "In einer alten Truhe gefunden.");
            h.inventar.push(loot);
            await printSlow(`🎁 ${h.name} erhält: <span class="rare-item">${loot.name}</span> (${loot.typ}: ${loot.wert})`);
            
            if (h.isKI) {
                h.kiAutomatischAusruesten();
            }
        }
    } else {
        await printSlow("💥 Eine Falle explodiert! Alle Spieler verlieren 5 HP.");
        helden.forEach(h => {
            h.hp -= 5;
            h.totalDamageTaken += 5;
            const sourceName = "Truhen-Falle";
            h.damageSources[sourceName] = (h.damageSources[sourceName] || 0) + 5;
        });
    }
}

async function shopBesuch(helden, istNachBoss = false) {
    if (istNachBoss) {
        await printSlow("\n🏆 <span class=\"rare-item\">DER SIEGER-BONUS:</span> Der Händler ist beeindruckt von eurem Sieg und bietet euch Sonderkonditionen!");
    }
    await printSlow("\n🏪 Ihr findet einen reisenden Händler im Dungeon.");
    
    // Glückswurf für seltene Artefakte (einmal pro Shop-Besuch)
    let seltenesArtefakt = null;
    const gluecksWurf = wuerfelD20();
    if (gluecksWurf >= 18 || (istNachBoss && gluecksWurf >= 10)) {
        seltenesArtefakt = RARE_ARTIFACTS[randomRange(0, RARE_ARTIFACTS.length - 1)];
        await printSlow(`✨ <span class="rare-item">Der Händler flüstert: 'Ich habe heute etwas ganz Besonderes unter dem Tresen...'</span>`);
    }

    for (const held of helden) {
        let shopping = true;
        while (shopping) {
            // Charisma-Bonus berechnen (5% pro Punkt)
            const charismaRabatt = 1 - (held.grund_cha * 0.05);
            const bossRabatt = istNachBoss ? 0.8 : 1.0;
            const buyDiscount = Math.max(0.4, charismaRabatt * bossRabatt);
            const sellBonus = Math.min(1.0, 0.5 + (held.grund_cha * 0.05));

            console.log(`\n--- 🛒 SHOP: ${held.name} (Gold: ${held.gold} | Charisma: ${held.grund_cha}) ---`);
            if (istNachBoss) console.log("✨ <span class=\"hp-gain\">Aktion: 20% Sieger-Rabatt aktiv!</span>");
            
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
                
                // Gruppiertes Inventar für die Anzeige
                const groupedInv = [];
                held.inventar.forEach(item => {
                    const entry = groupedInv.find(g => g.name === item.name);
                    if (entry) entry.count++;
                    else groupedInv.push({ name: item.name, count: 1, wert: item.wert });
                });

                groupedInv.forEach((g, i) => {
                    const verkaufsPreis = Math.max(1, Math.floor(g.wert * sellBonus));
                    console.log(`${i + 1}. ${g.count > 1 ? g.count + 'x ' : ''}${g.name} - Wert: ${verkaufsPreis} Gold`);
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
                    if (!isNaN(idx) && idx >= 0 && idx < groupedInv.length) {
                        const selected = groupedInv[idx];
                        const preis = Math.max(1, Math.floor(selected.wert * sellBonus));
                        
                        const anz = parseInt(await question(`Wie viele ${selected.name} verkaufen? (Max ${selected.count}): `));
                        if (!isNaN(anz) && anz > 0 && anz <= selected.count) {
                            let geloescht = 0;
                            // Von hinten löschen um Indizes während des Durchlaufs stabil zu halten
                            for (let i = held.inventar.length - 1; i >= 0 && geloescht < anz; i--) {
                                if (held.inventar[i].name === selected.name) {
                                    held.inventar.splice(i, 1);
                                    geloescht++;
                                }
                            }
                            held.gold += geloescht * preis;
                            await printSlow(`💰 Du verkaufst ${geloescht}x ${selected.name} für ${geloescht * preis} Gold.`);
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
                        if (ware.type === "traenke") {
                            held.traenke += 1;
                        } else if (ware.type === "item") {
                            held.inventar.push(new Item(ware.name, ware.kind, ware.val, ware.effekt || null, ware.lore || null));
                            if (ware.hpPenalty) {
                                held.hp = Math.max(1, held.hp - ware.hpPenalty);
                                held.totalDamageTaken += ware.hpPenalty;
                                held.damageSources["Verfluchter Gegenstand"] = (held.damageSources["Verfluchter Gegenstand"] || 0) + ware.hpPenalty;
                                await printSlow(`💀 <span class="effect-lifesteal">Ein dunkler Fluch zehrt an ${held.name}!</span> -${ware.hpPenalty} HP.`);
                            }
                        } else if (ware.type === "hp") {
                            held.inventar.push(new Item(ware.name, "Gegenstand", ware.val, null, ware.lore || null));
                        }
                    }

                    if (ware.type === "traenke") await printSlow(`🧪 ${held.name} kauft ${anz}x Heiltrank.`);
                    else if (ware.type === "item") {
                        await printSlow(`📦 ${held.name} kauft ${anz}x ${ware.name}.`);
                        if (held.isKI) held.kiAutomatischAusruesten();
                    }
                    else if (ware.type === "hp") await printSlow(`📦 ${held.name} kauft ${anz}x ${ware.name} als Vorrat.`);
                }
            } else {
                await printSlow("❌ Ungültige Wahl!");
            }
        }
    }
}

async function tavernenBesuch(helden) {
    await printSlow("\n🍺 Ihr betretet die gemütliche Taverne 'Zum tanzenden JS-Bug'.");

    // --- SPEZIELLES EVENT: Beschwörer & Nekromant ---
    const summoner = helden.find(h => ["beschwoerer", "beschwörer"].includes(h.klasse.toLowerCase()) && h.hp > 0);
    const necro = helden.find(h => h.klasse.toLowerCase() === "nekromant" && h.hp > 0);

    if (summoner && necro) {
        await printSlow(`\n🕯️ Eine unnatürliche Kälte breitet sich in der Schänke aus, als ${summoner.name} und ${necro.name} sich in eine dunkle Ecke zurückziehen.`);
        await printSlow(`${summoner.name}: "Die Schleier zwischen den Welten sind hier dünn, Nekromant. Spürst du die Resonanz?"`);
        await printSlow(`${necro.name}: "In der Tat. Die Echos der Verstorbenen in diesem Dungeon nähren unsere Macht."`);
        await printSlow(`Die beiden kanalisieren gemeinsam die ätherische Energie der Umgebung.`);
        
        summoner.mp = Math.min(summoner.max_mp, summoner.mp + 20);
        necro.mp = Math.min(necro.max_mp, necro.mp + 20);
        
        await printSlow(`✨ <span class="synergy-text">Dunkle Erkenntnis:</span> Beide Helden regenerieren <span class="hp-gain">20 MP</span> durch ihren Wissensaustausch.`);
        updateUI(helden);
    }

    for (const held of helden) {
        // Prüfung auf Hausverbot
        if (held.tavernBanRooms > 0) {
            await printSlow(`🚫 ${held.name} darf die Taverne nicht betreten! Der Wirt fuchtelt wütend mit einem Nudelholz. (Noch ${held.tavernBanRooms} Räume Hausverbot)`);
            continue;
        }

        held.hp = Math.min(held.max_hp, held.hp + 10);
        if (held.max_mp > 0) held.mp = Math.min(held.max_mp, held.mp + 5);
        await printSlow(`🛌 ${held.name} ruht sich aus und regeneriert HP sowie etwas MP.`);

        if (held.isKI) {
            // KI regeneriert automatisch, wenn AP unter 50% und genug Gold vorhanden ist
            if (held.ap < held.max_ap * 0.5 && held.gold >= 10) {
                held.gold -= 10;
                held.ap = held.max_ap;
                await printSlow(`🤖 ${held.name} (KI) kauft sich eine Erfrischung und regeneriert AP.`);
                await checkQuests([held], { type: 'spend_gold', amount: 10 });
            }
            // KI regeneriert Mana
            if (held.mp < held.max_mp * 0.4 && held.gold >= 15) {
                held.gold -= 15;
                held.mp = held.max_mp;
                await printSlow(`🤖 ${held.name} (KI) trinkt einen Manatrank.`);
                await checkQuests([held], { type: 'spend_gold', amount: 15 });
            }
        } else {
            let tavernenWahl = true;
            while(tavernenWahl) {
                console.log(`\n--- 🍺 TAVERNE: ${held.name} (Gold: ${held.gold} | AP: ${held.ap}/${held.max_ap}) ---`);
                console.log("1. Ein Starkbier für dich (10 Gold, AP voll)");
                const lebendeHelden = helden.filter(h => h.hp > 0);
                const kostenRunde = lebendeHelden.length * 10;
                console.log(`2. Eine Runde für alle schmeißen (${kostenRunde} Gold, alle AP voll)`);
                if (held.max_mp > 0) console.log("M. Blauer Enzian (15 Gold, MP voll)");
                console.log("3. Einem Gast ein Bier spendieren für Gerüchte (5 Gold)");
                console.log("4. Würfelspiel gegen den Wirt (Einsatz setzen)");
                console.log("0. Taverne verlassen");

                const wahl = await question("Deine Wahl: ");
                if (wahl === "1") {
                    if (held.ap >= held.max_ap) {
                        await printSlow("❌ Du bist bereits voller Energie!");
                    } else if (held.gold >= 10) {
                        held.gold -= 10;
                        held.ap = held.max_ap;
                        await printSlow(`✨ ${held.name} trinkt das Starkbier und fühlt sich voller Energie! (AP regeneriert)`);
                        await checkQuests([held], { type: 'spend_gold', amount: 10 });
                    } else {
                        await printSlow("❌ Du hast nicht genug Gold für ein Starkbier!");
                    }
                } else if (wahl === "2") {
                    if (held.gold >= kostenRunde) {
                        held.gold -= kostenRunde;
                        lebendeHelden.forEach(h => h.ap = h.max_ap);
                        await printSlow(`🍻 ${held.name} schmeißt eine Runde! Alle Helden fühlen sich erfrischt! (Alle AP regeneriert)`);
                        await checkQuests([held], { type: 'spend_gold', amount: kostenRunde });
                    } else {
                        await printSlow(`❌ Du hast nicht genug Gold, um eine Runde für alle zu schmeißen! Benötigt: ${kostenRunde} Gold.`);
                    }
                } else if (wahl.toLowerCase() === "m" && held.max_mp > 0) {
                    if (held.mp >= held.max_mp) {
                        await printSlow("❌ Dein Geist ist bereits kristallklar!");
                    } else if (held.gold >= 15) {
                        held.gold -= 15;
                        held.mp = held.max_mp;
                        await printSlow(`🔮 ${held.name} trinkt den Blauen Enzian. Die magische Energie kehrt zurück!`);
                        await checkQuests([held], { type: 'spend_gold', amount: 15 });
                    } else {
                        await printSlow("❌ Nicht genug Gold für diesen edlen Tropfen!");
                    }
                } else if (wahl === "3") {
                    if (held.gold >= 5) {
                        held.gold -= 5;
                        const geruecht = RUMOR_POOL[randomRange(0, RUMOR_POOL.length - 1)];
                        await printSlow(`\n🗣️ <span class="buff-text">${geruecht}</span>`);
                        await checkQuests([held], { type: 'spend_gold', amount: 5 });
                    } else {
                        await printSlow("❌ Du hast nicht genug Gold, um Informationen zu kaufen.");
                    }
                } else if (wahl === "4") {
                    const einsatzStr = await question(`Wie viel Gold möchtest du setzen? (Dein Gold: ${held.gold}): `);
                    const einsatz = parseInt(einsatzStr);

                    if (!isNaN(einsatz) && einsatz > 0 && einsatz <= held.gold) {
                        let schummelVersuch = false;
                        let erwischt = false;

                        // Schurken-Spezial: Schummeln basierend auf Geschicklichkeit
                        const istSchurke = ["schurke", "assassine", "schattenläufer"].includes(held.klasse.toLowerCase());
                        if (istSchurke) {
                            const schummelWahl = await question("Möchtest du versuchen zu schummeln? (ja/nein): ");
                            if (schummelWahl.toLowerCase().trim() === "ja") {
                                schummelVersuch = true;
                                await printSlow(`🤫 ${held.name} lässt unauffällig einen gezinkten Würfel aus dem Ärmel gleiten...`);
                                
                                // Der Schwierigkeitsgrad (DC) steigt mit dem Einsatz
                                const dc = 12 + Math.floor(einsatz / 15);
                                const check = wuerfelD20() + held.grund_gesch;
                                
                                if (check >= dc) {
                                    await printSlow("✨ Ein perfektes Ablenkungsmanöver! Der Wirt bemerkt den Betrug nicht.");
                                } else {
                                    erwischt = true;
                                    await printSlow("⚠️ <span class='log-critical'>ERWISCHT!</span> Der Wirt sieht den gezinkten Würfel auf den Tisch rollen!");
                                }
                            }
                        }

                        if (erwischt) {
                            const strafe = einsatz * 2;
                            held.gold -= Math.min(held.gold, strafe);
                            await printSlow(`💀 "Hier wird nicht beschissen!" brüllt der Wirt. Er nimmt dir ${strafe} Gold als "Strafe" ab.`);
                            
                            // 30% Chance auf Verbannung aus der Taverne
                            if (Math.random() < 0.3) {
                                held.tavernBanRooms = 3;
                                await printSlow(`🚫 "RAUS HIER! Und lass dich die nächsten 3 Räume nicht blicken!" Der Wirt wirft ${held.name} hochkant aus der Taverne.`);
                                tavernenWahl = false; // Beendet den Tavernenbesuch für diesen Helden sofort
                            }
                        } else {
                            await printSlow(`🎲 Du legst ${einsatz} Gold auf den Tresen. Der Wirt schüttelt grinsend seinen Becher...`);
                            
                            // Wenn erfolgreich geschummelt wurde, ist der Wurf garantiert hoch (16-20)
                            let deinWurf = schummelVersuch ? randomRange(16, 20) : wuerfelD20();
                            const wirtWurf = wuerfelD20();
                            await printSlow(`🎲 Dein Wurf: **${deinWurf}** | Wirt: **${wirtWurf}**`);

                            if (deinWurf > wirtWurf) {
                                held.gold += einsatz;
                                await printSlow(`🎉 Sieg! Der Wirt flucht leise und schiebt dir <span class="hp-gain">${einsatz} Gold</span> Gewinn rüber.`);
                                triggerGoldAnimation();
                            } else if (deinWurf < wirtWurf) {
                                held.gold -= einsatz;
                                await printSlow(`💀 Verloren! Der Wirt streicht grinsend deine ${einsatz} Goldmünzen ein.`);
                            } else {
                                await printSlow("🤝 Unentschieden! Keiner verliert Gold, aber der Wirt spendiert dir einen respektvollen Nicker.");
                            }
                        }
                        // Der Einsatz zählt für die "Spendierhosen"-Quest
                        await checkQuests([held], { type: 'spend_gold', amount: einsatz });
                    } else if (einsatzStr !== null) {
                        await printSlow("❌ Ungültiger Einsatz!");
                    }
                } else if (wahl === "0") {
                    tavernenWahl = false;
                } else {
                    await printSlow("Ungültige Wahl.");
                }
            }
        }
    }
}

async function vorraeteNutzen(helden) {
    await printSlow("\n🎒 Die Gruppe öffnet ihre Rucksäcke, um sich zu stärken.");
    
    let amEssen = true;
    while (amEssen) {
        updateUI(helden);
        console.log("\n--- 🍎 VORRÄTE VERBRAUCHEN ---");
        helden.forEach((h, i) => {
            console.log(`${i + 1}. ${h.name} (HP: ${h.hp}/${h.max_hp})`);
        });
        console.log("0. Zurück");

        const heldWahl = await question("Welcher Held soll etwas essen? ");
        if (heldWahl === "0") {
            amEssen = false;
        } else {
            const hIdx = parseInt(heldWahl) - 1;
            if (hIdx >= 0 && hIdx < helden.length) {
                const held = helden[hIdx];
                const vorraete = held.inventar.filter(it => (it.typ === "Gegenstand" || it.typ === "Mana-Gegenstand") && it.wert > 0);
                
                if (vorraete.length === 0) {
                    await printSlow(`❌ ${held.name} hat keine Vorräte im Inventar.`);
                    continue;
                }

                const grouped = [];
                vorraete.forEach(it => {
                    const entry = grouped.find(g => g.name === it.name);
                    if (entry) entry.count++;
                    else grouped.push({ name: it.name, val: it.wert, count: 1, type: it.typ });
                });

                console.log(`\nVorräte von ${held.name}:`);
                grouped.forEach((g, i) => {
                    const unit = g.type === "Mana-Gegenstand" ? "MP" : "HP";
                    console.log(`${i + 1}. ${g.count > 1 ? g.count + 'x ' : ''}${g.name} (+${g.val} ${unit})`);
                });
                console.log("0. Zurück");

                const itemWahl = await question("Was soll verzehrt werden? ");
                if (itemWahl === "0") continue;

                const iIdx = parseInt(itemWahl) - 1;
                if (iIdx >= 0 && iIdx < grouped.length) {
                    const sel = grouped[iIdx];
                    if (sel.type === "Mana-Gegenstand") {
                        if (held.mp >= held.max_mp) {
                            await printSlow(`❌ ${held.name}s Mana ist bereits voll!`);
                            continue;
                        }
                        held.mp = Math.min(held.max_mp, held.mp + sel.val);
                    } else {
                        if (held.hp >= held.max_hp) {
                            await printSlow(`❌ ${held.name} ist bereits bei voller Gesundheit!`);
                            continue;
                        }
                        held.hp = Math.min(held.max_hp, held.hp + sel.val);
                    }
                    const invIdx = held.inventar.findIndex(it => it.name === sel.name && it.typ === sel.type);
                    held.inventar.splice(invIdx, 1);
                    const unit = sel.type === "Mana-Gegenstand" ? "MP" : "HP";
                    await printSlow(`🍴 ${held.name} nutzt ${sel.name} und regeneriert <span class="hp-gain">${sel.val} ${unit}</span>.`);
                }
            }
        }
    }
}

async function bardenLied(helden) {
    const barde = helden.find(h => h.klasse.toLowerCase() === "barde");
    if (!barde) return;

    await printSlow(`\n🎵 <span class="buff-text">${barde.name} spielt eine heroische Ballade am Lagerfeuer.</span>`);
    await printSlow("Die Flammen tanzen im Takt und die Herzen der Gefährten schlagen höher!");
    await printSlow("✨ <span class=\"hp-gain\">Gruppen-Buff erhalten: +5 Max HP, +1 ATK & +10% Gold</span> (Hält bis zum Ende von Ebene 1)");

    helden.forEach(h => {
        h.max_hp += 5;
        h.hp += 5;
        h.atk_bonus += 1;
        h.hatBardenBuff = true;
    });
}

async function feenBegegnung(helden) {
    await printSlow("\n🧚 <span class='hp-gain'>Eine kleine, leuchtende Fee erscheint plötzlich vor euch!</span>");
    await printSlow("'Ihr seht aus, als hättet ihr eine Aufmunterung verdient! Bitte sehr!'");

    helden.forEach(h => {
        if (h.hp > 0) {
            const heilung = Math.floor(h.max_hp * 0.25);
            h.hp = Math.min(h.max_hp, h.hp + heilung);
            h.ap = Math.min(h.max_ap, h.ap + 10);
            if (h.max_mp > 0) h.mp = Math.min(h.max_mp, h.mp + 15);
        }
    });

    await printSlow("✨ Die Fee kichert. <span class='hp-gain'>(HP & AP regeneriert!)</span>");
    await printSlow("'Wollt ihr noch mehr? Für etwas Gold kann ich euch die Geheimnisse des Dungeons flüstern...'");

    for (const h of helden) {
        if (h.hp <= 0 || h.isKI) continue;

        let tauschen = true;
        while (tauschen && h.gold >= 10) {
            updateUI(helden);
            console.log(`\n--- 🧚 FEE: ${h.name} (Gold: ${h.gold} | XP: ${h.xp}/${h.xp_needed}) ---`);
            const antwort = await question("Möchtest du Gold gegen XP tauschen? (10 Gold = 15 XP). Gib die Anzahl der Tausche ein (0 für Ende): ");
            const anzahl = parseInt(antwort);

            if (!isNaN(anzahl) && anzahl > 0) {
                const gesamtKosten = anzahl * 10;
                if (h.gold >= gesamtKosten) {
                    h.gold -= gesamtKosten;
                    h.xp += anzahl * 15;
                    await printSlow(`✨ Die Fee flüstert ${h.name} Wissen zu. <span class='rare-item'>+${anzahl * 15} XP!</span>`);
                    
                    const levelsGained = h.check_levelup();
                    if (levelsGained > 0) {
                        await printSlow(`\n🌟 LEVEL UP für ${h.name}! Level ${h.level}!`, 'level-up-animation');
                        await levelUpMenu(h, levelsGained);
                    }
                } else {
                    await printSlow("❌ Du hast nicht genug Gold für so viel Wissen.");
                }
            } else {
                tauschen = false;
            }
        }
    }

    await printSlow("✨ Die Fee verschwindet in einer Glitzerwolke.");
    updateUI(helden);
}

async function castleInteraction(helden) {
    await printSlow("\n🏰 Ihr betretet die majestätische Burg. Goldene Banner wehen im Wind und Wachen salutieren.");
    await printSlow("Ein freundlicher Diener führt euch in den Thronsaal, wo König Theron auf euch wartet.");

    let interacting = true;
    while (interacting) {
        await printSlow("\n--- IM THRONSAAL DER BURG ---");
        console.log("1. Mit König Theron sprechen");
        console.log("2. Die Burg erkunden (Shop/Taverne)");
        console.log("0. Das Spiel beenden (Siegerehrung)");

        const wahl = await question("Was möchtet ihr tun? ");

        if (wahl === "1") {
            await printSlow("\n👑 König Theron: 'Seid gegrüßt, Helden! Eure Taten sind legendär.'");
            
            // Quest "Ein komischer Kauz" abgeben
            const jesterQuestActive = helden[0].activeQuests.some(q => q.id === 6);
            const jesterQuestCompleted = helden[0].completedQuests.includes(6);

            if (jesterQuestActive && hofnarr.active && hofnarr.hp > 0 && !jesterQuestCompleted) {
                await printSlow(`\n🤡 ${hofnarr.name} springt vor den König: "Eure Majestät! Ich bin zurück! Und diese Helden haben mich sicher hierher gebracht!"`);
                await printSlow("👑 König Theron: 'Ah, mein lieber Pippin! Ich hatte die Hoffnung schon fast aufgegeben. Ihr habt meine Erwartungen übertroffen, tapfere Helden!'");
                
                // Trigger quest completion for all heroes
                for (const h of helden) {
                    const questToComplete = h.activeQuests.find(q => q.id === 6);
                    if (questToComplete) {
                        await checkQuests([h], { type: 'quest_complete', questId: 6 }); // Pass single hero for checkQuests
                    }
                }
                hofnarr.completed = true; // Mark Pippin's quest as completed globally
                await printSlow(`\n👑 König Theron: 'Als Zeichen meiner Dankbarkeit, nehmt diese Belohnung!'`);
            } else if (jesterQuestCompleted) {
                await printSlow("👑 König Theron: 'Pippin ist in Sicherheit, dank euch. Euer Ruhm eilt euch voraus.'");
            } else {
                await printSlow("👑 König Theron: 'Ich habe gehört, ihr seid auf der Suche nach Abenteuern. Vielleicht kann ich euch bald einen Auftrag geben.'");
            }
        } else if (wahl === "2") {
            await shopBesuch(helden); // Shop in der Burg
            await tavernenBesuch(helden); // Taverne in der Burg
        } else if (wahl === "0") {
            interacting = false;
            // Finales Spielende mit Rangliste
            console.log("\n" + "★".repeat(50));
            await printSlow("🏆 SIEG! Der Thron des Dungeons wurde erobert!");
            
            // Ranking erstellen
            const sieger = [...helden].sort((a, b) => 
                (b.totalDamageDealt - b.totalDamageTaken) - (a.totalDamageDealt - a.totalDamageTaken)
            );
            
            await printSlow("\n👑 DAS SIEGERTREPPCHEN 👑");
            for (let i = 0; i < sieger.length; i++) {
                const h = sieger[i];
                const medal = i === 0 ? "🥇" : (i === 1 ? "🥈" : "🥉");
                await printSlow(`${medal} Platz ${i+1}: <span class="rare-item">${h.name}</span> (Level ${h.level})`);
                await printSlow(`   ⚔️ Schaden Ausgeteilt: ${h.totalDamageDealt} | 🩸 Schaden Erlitten: ${h.totalDamageTaken}`);
                let maxSource = "Keine";
                let maxDmg = 0;
                for (const [source, dmg] of Object.entries(h.damageSources)) {
                    if (dmg > maxDmg) { maxDmg = dmg; maxSource = source; }
                }
                if (maxDmg > 0) await printSlow(`   💀 Meiste Pein durch: ${maxSource} (${maxDmg} Dmg)`);
                if (h.totalDamageTaken === 0) { await printSlow(`   ✨ <span class="hp-gain">🏆 ERRUNGENSCHAFT: UNANTASTBAR!</span> (${h.name} hat das gesamte Abenteuer ohne einen einzigen Kratzer überstanden!)`); }
                if (h.totalDamageDealt < 100) { await printSlow(`   🕊️ <span class="hp-gain">🏆 ERRUNGENSCHAFT: PAZIFIST!</span> (${h.name} hat den Sieg mit minimaler Gewalt errungen!)`); }
            }
            const champion = sieger[0];
            localStorage.setItem('dungeon_champion', JSON.stringify({ name: champion.name, level: champion.level, klasse: champion.klasse }));
            const history = JSON.parse(localStorage.getItem('dungeon_history')) || [];
            history.push({ 
                name: champion.name, 
                level: champion.level, 
                klasse: champion.klasse, 
                xp: champion.xp, 
                dmg: champion.totalDamageDealt,
                datum: new Date().toLocaleDateString() 
            });
            localStorage.setItem('dungeon_history', JSON.stringify(history));
            await printSlow(`\n⚠️ Eine dunkle Macht ergreift Besitz von ${champion.name}... Er wird als nächster Wächter zurückkehren.`);
            await printSlow("\nDie restlichen Überlebenden verlassen den Dungeon durch das goldene Portal.");
            const namen = helden.length > 1 ? helden.slice(0, -1).map(h => h.name).join(", ") + " und " + helden[helden.length - 1].name : helden[0].name;
            await printSlow(`${namen} werden als Retter des Reiches in die Geschichte eingehen!`);
            console.log("★".repeat(50));
            
            const endWahl = await question("\nWas möchtet ihr tun?\n1. Ein neues Abenteuer beginnen\n2. Das Spiel beenden\nWahl: ");
            if (endWahl === "1") {
                location.reload();
            } else {
                document.body.innerHTML = `
                    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background: #1a0f0a; color: #d4af37; font-family: 'Cinzel', serif; text-align: center; padding: 40px;">
                        <h1 style="color: #b22222; font-size: 3.5em; margin-bottom: 20px; text-shadow: 0 0 20px rgba(178, 34, 34, 0.5);">DANKE FÜR'S SPIELEN!</h1>
                        <p style="font-size: 1.8em; line-height: 1.6; max-width: 800px; color: #f5e6d3;">Eure Taten in der Burg wurden in die Chroniken der Welt aufgenommen. Danke, dass ihr das Spiel gespielt habt!</p>
                        <div style="margin-top: 50px; border-top: 1px solid #d4af37; padding-top: 20px; width: 200px;">
                            <button onclick="location.reload()" style="background: none; border: 1px solid #d4af37; color: #d4af37; padding: 10px 20px; cursor: pointer; font-family: 'Cinzel';">Hauptmenü</button>
                        </div>
                    </div>`;
            }
        } else {
            await printSlow("Ungültige Wahl.");
        }
    }
}

export { hofnarr, JESTER_JOKES, schatzFinden, shopBesuch, tavernenBesuch, bossLootGeben, levelUpMenu, synergienPruefen, craftingMenue, schwarzeTafel, raetselPhase, secretEbeneIntro, vorraeteNutzen, bardenLied, feenBegegnung, raetselMeisterBegegnung, checkQuests, castleInteraction };