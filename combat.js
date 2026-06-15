import { question, randomRange, printSlow, wuerfelD20, updateUI, formatAbilityDesc, triggerGoldAnimation } from './utils.js';
import * as Story from './story.js';

async function spielerZug(spieler, monster_name, monster_hp, helden) {
    if (spieler.isVerwirrt && Math.random() < 0.4) {
        await printSlow(`\n🌀 ${spieler.name} tappt orientierungslos im Dunkeln umher und verpasst vor lauter Verwirrung seinen Zug!`);
        if (Math.random() < 0.3) {
            const selbstSchaden = randomRange(3, 7);
            spieler.hp -= selbstSchaden;
            spieler.totalDamageTaken += selbstSchaden;
            await printSlow(`💥 Vor lauter Panik verletzt sich ${spieler.name} selbst für <span class="effect-lifesteal">${selbstSchaden} HP</span>!`);
        }
        return ["verwirrt", 0];
    }

    if (spieler.isKI) {
        await printSlow(`\n🤖 [KI-ZUG: ${spieler.name.toUpperCase()}]`);
        
        const istHeilerOderAlchemist = spieler.klasse.toLowerCase() === "heiler" || spieler.klasse.toLowerCase() === "alchemist";

        // 1. Priorität: Selbstheilung wenn HP unter 40%
        if (spieler.hp < spieler.max_hp * 0.4) {
            if (spieler.traenke > 0) {
                spieler.traenke -= 1;
                const heilung = randomRange(8, 18);
                spieler.hp = Math.min(spieler.max_hp, spieler.hp + heilung);
                await printSlow(`🧪 ${spieler.name} nutzt einen Trank. +${heilung} HP!`);
                return ["heilung", 0];
            } else {
                const foodIdx = spieler.inventar.findIndex(it => it.typ === "Gegenstand" && it.wert > 0);
                if (foodIdx !== -1) {
                    const food = spieler.inventar[foodIdx];
                    spieler.hp = Math.min(spieler.max_hp, spieler.hp + food.wert);
                    spieler.inventar.splice(foodIdx, 1);
                    await printSlow(`🍴 ${spieler.name} verbraucht ${food.name} aus dem Vorrat. +${food.wert} HP!`);
                    return ["heilung", 0];
                }
            }
        }

        // 2. Priorität: Verbündeten heilen, wenn dessen HP unter 30%
        const lowAlly = helden.find(h => h !== spieler && h.hp > 0 && h.hp < h.max_hp * 0.3);
        if (lowAlly && (istHeilerOderAlchemist || spieler.traenke > 0)) {
            let heilMethode = "";
            if (istHeilerOderAlchemist) {
                heilMethode = spieler.klasse.toLowerCase() === "heiler" ? "nutzt Heilmagie" : "mischt ein schnelles Elixier";
            } else {
                spieler.traenke -= 1;
                heilMethode = "reicht einen Trank";
            }

            const heilung = randomRange(10, 20);
            lowAlly.hp = Math.min(lowAlly.max_hp, lowAlly.hp + heilung);
            await printSlow(`🧪 ${spieler.name} ${heilMethode}! +${heilung} HP für ${lowAlly.name}.`);
            return ["heilung_verbündeter", 0];
        }

        // NEU: Ultimate nutzen, wenn SP voll sind
        const ultimate = spieler.abilities.find(a => a.isUltimate && spieler.sp >= 100);
        if (ultimate) {
            spieler.sp = 0;
            return ["fähigkeit", { ability: ultimate, targetHeld: null }];
        }

        // 3. Priorität: Angriff
        const wurf = wuerfelD20();
        const gesamt_angriff = wurf + spieler.atk_bonus;

        // KI nutzt zufällig eine Schadensfähigkeit, wenn genug AP da ist
        const fähigkeit = spieler.abilities.find(a => a.schaden && (a.ap_kosten !== undefined) && spieler.ap >= a.ap_kosten);
        if (fähigkeit && Math.random() > 0.6) {
            spieler.ap -= fähigkeit.ap_kosten;
            return ["fähigkeit", { ability: fähigkeit, targetHeld: null }];
        }

        await printSlow(`⚔️ ${spieler.name} greift an! Wurf: ${wurf} (+${spieler.atk_bonus}) = ${gesamt_angriff}`);
        return ["angriff", { roll: gesamt_angriff, natural: wurf }];
    }

    while (true) {
        console.log(`\n🎮 [ZUG VON ${spieler.name.toUpperCase()}] HP: ${spieler.hp}/${spieler.max_hp} | AP: ${spieler.ap}/${spieler.max_ap}`);
        console.log("1. Angreifen");
        console.log("2. Heiltrank nutzen");
        console.log("3. Ausrüstung wechseln");
        if (helden.length > 1) console.log("4. Verbündeten heilen");
        console.log("5. Fähigkeit einsetzen");
        const wahl = await question(`Was tust du? (1-5): `);
        
        if (wahl === "1") {
            const wurf = wuerfelD20();
            const gesamt_angriff = wurf + spieler.atk_bonus;
            await printSlow(`🎲 Würfel: ${wurf} (+${spieler.atk_bonus}) = ${gesamt_angriff} gegen RK des Monsters.`);
            return ["angriff", { roll: gesamt_angriff, natural: wurf }];
            
        } else if (wahl === "2") {
            if (spieler.traenke > 0) {
                spieler.traenke -= 1;
                const heilung = randomRange(8, 18);
                spieler.hp = Math.min(spieler.max_hp, spieler.hp + heilung);
                await printSlow(`🧪 ${spieler.name} trinkt einen Trank. +${heilung} HP!`);
                return ["heilung", 0];
            } else {
                await printSlow("Keine Tränke mehr!");
            }
                
        } else if (wahl === "3") {
            if (spieler.inventar.length === 0) {
                await printSlow("Dein Inventar ist leer.");
                continue;
            }
            
            // Gruppierung für die Anzeige
            const groupedInv = [];
            spieler.inventar.forEach(item => {
                const entry = groupedInv.find(g => g.name === item.name && g.typ === item.typ && g.wert === item.wert);
                if (entry) entry.count++;
                else groupedInv.push({ name: item.name, typ: item.typ, wert: item.wert, count: 1 });
            });

            groupedInv.forEach((g, i) => {
                console.log(`${i + 1}. ${g.count > 1 ? g.count + 'x ' : ''}${g.name} (${g.typ}: ${g.wert})`);
            });

            const inv_wahl = await question("Nummer wählen oder 0 für zurück: ");
            const idx = parseInt(inv_wahl) - 1;
            
            if (!isNaN(idx) && idx >= 0 && idx < groupedInv.length) {
                const sel = groupedInv[idx];
                const originalIdx = spieler.inventar.findIndex(it => it.name === sel.name && it.typ === sel.typ && it.wert === sel.wert);
                
                if (sel.typ === "Gegenstand" && sel.wert > 0) {
                    spieler.hp = Math.min(spieler.max_hp, spieler.hp + sel.wert);
                    spieler.inventar.splice(originalIdx, 1);
                    await printSlow(`🍴 ${spieler.name} verbraucht ${sel.name} und heilt <span class="hp-gain">${sel.wert} HP</span>!`);
                    return ["heilung", 0];
                }

                const erfolgName = spieler.ausruesten(originalIdx);
                if (erfolgName) {
                    await printSlow(`🛡️ Gegenstand ${erfolgName} ausgerüstet!`);
                    return ["ausruesten", 0];
                } else {
                    await printSlow("❌ Dieser Gegenstand kann nicht ausgerüstet werden.");
                }
            }
        } else if (wahl === "5") {
            if (spieler.abilities.length === 0) {
                await printSlow("❌ Du hast noch keine besonderen Fähigkeiten gelernt.");
                continue;
            }
            console.log("\n--- Verfügbare Fähigkeiten ---");
            spieler.abilities.forEach((ab, i) => {
                let info = "";
                if (ab.isUltimate) {
                    info = `(ULTIMATE - SP: ${ab.sp_kosten})`;
                } else if (ab.material_kosten) {
                    const count = spieler.inventar.filter(it => it.name === ab.material_kosten).length;
                    const warn = count === 0 ? ' <span class="effect-lifesteal">[FEHLT]</span>' : '';
                    info = `(Vorrat: ${count}x ${ab.material_kosten})${warn}`;
                } else {
                    info = `(AP: ${ab.ap_kosten})`;
                }
                const desc = formatAbilityDesc(ab, spieler);
                console.log(`${i + 1}. <span class="tooltip">${ab.name}<span class="tooltiptext"><strong>${ab.name}</strong><br>${desc}</span></span> ${info}`);
            });
            const ab_wahl = await question("Wahl (0 für zurück): ");
            const idx = parseInt(ab_wahl) - 1;

            if (!isNaN(idx) && idx >= 0 && idx < spieler.abilities.length) {
                const ability = spieler.abilities[idx];

                if (ability.isUltimate) {
                    if (spieler.sp < 100) {
                        await printSlow("❌ Deine Spezialleiste (SP) ist noch nicht voll!");
                        continue;
                    }
                } else {
                    if (spieler.ap < (ability.ap_kosten || 0)) {
                        await printSlow("❌ Nicht genug Aktionspunkte (AP)!");
                        continue;
                    }
                }

                // Materialprüfung für Tüftler/Alchemist
                if (ability.material_kosten) {
                    const m_idx = spieler.inventar.findIndex(it => it.name === ability.material_kosten);
                    if (m_idx === -1) {
                        await printSlow(`❌ Du benötigst ${ability.material_kosten} im Inventar!`);
                        continue;
                    }
                    spieler.inventar.splice(m_idx, 1);
                }

                let targetHeld = null;
                if (ability.heilung || ability.belebt) {
                    const ziele = ability.belebt ? helden.filter(h => h.hp <= 0) : helden.filter(h => h.hp > 0);
                    if (ziele.length === 0) {
                        await printSlow("Kein gültiges Ziel verfügbar!");
                        continue;
                    }
                    console.log("\nZiel wählen:");
                    ziele.forEach((z, i) => console.log(`${i + 1}. ${z.name}`));
                    const z_wahl = await question("Wahl: ");
                    targetHeld = ziele[parseInt(z_wahl) - 1];
                    if (!targetHeld) continue;
                }

                if (ability.isUltimate) {
                    spieler.sp = 0;
                } else {
                    spieler.ap -= (ability.ap_kosten || 0);
                }
                
                return ["fähigkeit", { ability, targetHeld }];
            }
        }
        else if (wahl === "4" && helden.length > 1) {
            const verbuendete = helden.filter(h => h !== spieler && h.hp > 0);
            const istHeilerOderAlchemist = spieler.klasse.toLowerCase() === "heiler" || spieler.klasse.toLowerCase() === "alchemist";

            if (verbuendete.length === 0) {
                await printSlow("Keine lebenden Verbündeten zum Heilen!");
                continue;
            }

            if (istHeilerOderAlchemist || spieler.traenke > 0) {
                console.log("\nWen möchtest du heilen?");
                verbuendete.forEach((h, i) => console.log(`${i + 1}. ${h.name} (${h.hp}/${h.max_hp} HP)`));
                const ziel_wahl = await question("Wahl: ");
                const idx = parseInt(ziel_wahl) - 1;
                
                if (!isNaN(idx) && idx >= 0 && idx < verbuendete.length) {
                    const ziel = verbuendete[idx];

                    let heilMethode = "";
                    if (istHeilerOderAlchemist) {
                        heilMethode = spieler.klasse.toLowerCase() === "heiler" ? "seine Heilmagie" : "ein selbstgemischtes Elixier";
                    } else {
                        spieler.traenke -= 1;
                        heilMethode = "einen Heiltrank";
                    }

                    const heilung = randomRange(10, 20);
                    ziel.hp = Math.min(ziel.max_hp, ziel.hp + heilung);
                    await printSlow(`🧪 ${spieler.name} nutzt ${heilMethode}! +${heilung} HP für ${ziel.name}.`);
                    return ["heilung_verbündeter", 0];
                } else {
                    await printSlow("Ungültige Wahl.");
                }
            } else {
                await printSlow("Nur Heiler, Alchemisten oder Helden mit Tränken können Verbündete heilen!");
            }
        }
    }
}

export async function teamKampf(helden, monster, imDunkeln = false, ebene = null) {
    if (imDunkeln) {
        await printSlow("\n🌑 <span class='effect-lifesteal'>Die Dunkelheit hier ist absolut! Ohne Fackel seid ihr orientierungslos.</span>");
        await printSlow(`👹 Der ${monster.name} nutzt die Schatten für einen Hinterhalt!`);
        
        const lebende = helden.filter(h => h.hp > 0);
        if (lebende.length > 0) {
            const ziel = lebende[Math.floor(Math.random() * lebende.length)];
            const m_roll = wuerfelD20();
            const monster_wurf = m_roll + monster.atk;
            
            if (monster_wurf >= ziel.ruestung_klasse() || m_roll === 20) {
                let schaden = randomRange(5, 12);
                if (m_roll === 20) schaden *= 2;
                ziel.hp = Math.max(0, ziel.hp - schaden);
                ziel.totalDamageTaken += schaden;
                ziel.damageSources[monster.name] = (ziel.damageSources[monster.name] || 0) + schaden;
                await printSlow(`🩸 <span class="log-critical">HINTERHALT!</span> ${ziel.name} wird im Dunkeln überrascht und verliert ${schaden} HP!`);
            } else {
                await printSlow(`🛡️ ${ziel.name} hört ein Rascheln und blockt den Angriff im Dunkeln gerade noch ab!`);
            }
        }
        // Alle Spieler für diesen Kampf verwirren
        helden.forEach(h => h.isVerwirrt = true);
    } else {
        await printSlow(`\n⚔️ Ein mächtiger ${monster.name} (HP: ${monster.hp} | RK: ${monster.rk}) blockiert den Weg!`);
    }

    let monsterStatus = { schlaf: 0, verwirrt: 0 };

    // Monsterwerte basierend auf Spieleranzahl skalieren
    const numPlayers = helden.length;
    if (numPlayers > 1) {
        monster.hp = Math.floor(monster.hp * (1 + (numPlayers - 1) * 0.5)); // +50% HP pro zusätzlichem Spieler
        monster.max_hp = monster.hp; // Max HP anpassen
        monster.atk = monster.atk + Math.floor((numPlayers - 1) * 0.5); // +1 ATK für je 2 zusätzliche Spieler
        monster.rk = monster.rk + Math.floor((numPlayers - 1) * 0.5); // +1 RK für je 2 zusätzliche Spieler
        monster.xp = monster.xp * numPlayers; // XP pro Spieler
        monster.gold = monster.gold * numPlayers; // Gold pro Spieler
        await printSlow(`(Das Monster skaliert mit ${numPlayers} Helden: HP: ${monster.hp}, ATK: ${monster.atk}, RK: ${monster.rk})`);
    }
    
    while (monster.hp > 0 && helden.some(h => h.hp > 0)) {
        // AP-Regeneration für alle lebenden Helden am Rundenanfang
        await printSlow("\n--- RUNDENBEGINN ---");
        monster.lastDmg = 0;
        helden.filter(h => h.hp > 0).forEach(held => {
            let apRegen = 5; // Standard
            apRegen += (held.ap_regen_bonus || 0);
            // Zusätzliche AP durch Ausrüstung (Boss-Loot)
            const ausruestung = [held.ausgeruestete_waffe, held.ausgeruestete_ruestung, held.ausgeruestete_schild];
            ausruestung.forEach(item => {
                if (item?.effekt?.typ === "ap_regen") apRegen += item.effekt.wert;
            });

            held.ap = Math.min(held.max_ap, held.ap + apRegen);
            // Unterdrücke die AP-Meldung für Klassen, die keine AP nutzen
            if (!["tueftler", "alchemist"].includes(held.klasse.toLowerCase())) {
                console.log(`<span class="effect-ap">✨ ${held.name} regeneriert ${apRegen} AP.</span> (Aktuell: ${held.ap}/${held.max_ap})`);
            }
        });
        updateUI(helden, monster, monsterStatus);
        
        // HP-Regeneration durch Spezialisierungs-Bonus
        helden.filter(h => h.hp > 0 && h.hp_regen_bonus > 0).forEach(held => {
            held.hp = Math.min(held.max_hp, held.hp + held.hp_regen_bonus);
            console.log(`<span class="hp-gain">❤️ ${held.name} regeneriert ${held.hp_regen_bonus} HP durch passiven Bonus.</span> (Aktuell: ${held.hp}/${held.max_hp})`);
        });

        // Pippin erzählt einen Witz zu Beginn jeder Runde
        if (Story.hofnarr.active && !Story.hofnarr.completed && Story.hofnarr.hp > 0) {
            const witz = Story.JESTER_JOKES[randomRange(0, Story.JESTER_JOKES.length - 1)];
            await printSlow(`\n🤡 <span class="buff-text">${Story.hofnarr.name}: "${witz}"</span>`);

            let confusionChance = 0.25; // Basis 25% Chance
            const hasBard = helden.some(h => h.klasse.toLowerCase() === "barde" && h.hp > 0);
            if (hasBard) {
                confusionChance += 0.15; // +15% wenn ein Barde in der Gruppe ist
                await printSlow(`🎶 Die Anwesenheit des Barden verstärkt Pippins Witz!`);
            }
            // Fähigkeit: Witzige Ablenkung
            if (Math.random() < confusionChance) {
                monsterStatus.verwirrt = Math.max(monsterStatus.verwirrt, 1);
                await printSlow(`🌀 Der ${monster.name} ist von Pippins Humor so <span class="badge-debuff">verwirrt</span>, dass er seine Deckung vergisst!`);
                
                // Achievement-Check: Comedy-Duo
                if (hasBard) {
                    Story.hofnarr.duoConfusions++;
                    if (Story.hofnarr.duoConfusions === 50) {
                        helden.forEach(h => {
                            if (!h.achievements.includes("Comedy-Duo")) h.achievements.push("Comedy-Duo");
                        });
                        await printSlow(`\n✨ <span class="hp-gain">🏆 ERRUNGENSCHAFT FREIGESCHALTET: COMEDY-DUO!</span>\nPippin und der Barde haben gemeinsam 50 Monster in den Wahnsinn getrieben!`);
                    }
                }
                updateUI(helden, monster, monsterStatus);
            }
        }

        for (const held of helden) {
            if (held.hp <= 0) continue;
            monster.lastDmg = 0; // Schaden für den neuen Zug zurücksetzen
                
            console.log(`\n--- Gegner: ${monster.name} (${monster.hp} HP) ---`);
            const [aktion, wert] = await spielerZug(held, monster.name, monster.hp, helden);
            
            if (aktion === "angriff") {
                // Basis SP-Gewinn pro Angriffsversuch
                held.sp = Math.min(held.max_sp, held.sp + 10);

                const { roll, natural } = wert;
                // Kritische Trefferchance basierend auf Geschicklichkeit
                // Jede 5 Punkte Geschicklichkeit reduzieren den benötigten natürlichen Wurf für einen kritischen Treffer um 1, bis zu einem Minimum von 15.
                const critThreshold = Math.max(15, 20 - Math.floor(held.grund_gesch / 5) + (held.crit_threshold_modifier || 0)); 
                const isCrit = natural >= critThreshold;
                const isFumble = natural === 1;

                if (isFumble) {
                    await printSlow(`<span class="log-fumble">😵 KRITISCHER FEHLSCHLAG! 😵</span>`);
                    const sprueche = [
                        `${held.name} stolpert über einen losen Stein!`,
                        `${held.name} verrutscht die Waffe in der Hand und schlägt weit daneben!`,
                        `${held.name} wird von einem fiesen Staubkorn im Auge geblendet!`,
                        `Die Ausrüstung von ${held.name} klappert so laut, dass der Schlag völlig misslingt!`,
                        `${held.name} unterschätzt das Gewicht der Waffe und gerät ins Wanken!`
                    ];
                    await printSlow(`${sprueche[randomRange(0, sprueche.length - 1)]} (Fehlschlag & -5 AP)`);
                    held.ap = Math.max(0, held.ap - 5);
                } else if (roll >= monster.rk || isCrit) {
                    const waffen_schaden = held.ausgeruestete_waffe ? held.ausgeruestete_waffe.wert : 2;
                    let schaden = randomRange(1, waffen_schaden) + held.level;

                    if (isCrit) {
                        schaden *= 2;
                        await printSlow(`<span class="log-critical">💥 KRITISCHER TREFFER! 💥</span>`);
                    }

                    monster.hp -= schaden;
                    monster.lastDmg = schaden;
                    held.totalDamageDealt += schaden;
                    held.sp = Math.min(held.max_sp, held.sp + schaden);
                    updateUI(helden, monster, monsterStatus);
                    await printSlow(`💥 ${isCrit ? "KRIT! " : "Treffer!"} ${held.name} fügt dem ${monster.name} ${schaden} Schaden zu.`);

                    // Effekt: Lebensraub
                    if (held.ausgeruestete_waffe?.effekt?.typ === "lebensraub") {
                        const heilung = Math.floor(schaden * held.ausgeruestete_waffe.effekt.wert);
                        if (heilung > 0) {
                            held.hp = Math.min(held.max_hp, held.hp + heilung);
                            await printSlow(`<span class="effect-lifesteal">🩸 Lebensraub!</span> ${held.name} heilt sich um <span class="hp-gain">${heilung} HP</span>.`);
                        }
                    }
                    
                    if (monsterStatus.schlaf > 0 && monster.hp > 0) {
                        monsterStatus.schlaf = 0;
                        await printSlow(`❗ ${monster.name} wurde durch den Angriff geweckt!`);
                    }
                } else {
                    await printSlow("❌ Verfehlt!");
                }
            }

            if (aktion === "fähigkeit") {
                const { ability, targetHeld } = wert;
                
                if (ability.isUltimate) {
                    console.log(`
                        <div class="log-ultimate-container">
                            <span class="ultimate-bolt">⚡</span>
                            <h2 style="color:var(--accent-color); margin:0;">ULTIMATE: ${ability.name.toUpperCase()}</h2>
                            <p style="margin:5px 0 0 0;">${held.name} entfesselt seine wahre Macht!</p>
                        </div>`);
                    await new Promise(resolve => setTimeout(resolve, 1000));
                } else {
                    await printSlow(`✨ ${held.name} setzt ${ability.name} ein!`);
                }

                if (ability.licht) {
                    const isBarde = held.klasse.toLowerCase() === "barde";
                    const durationProp = isBarde ? "bardenLichtDauer" : "heilerLichtDauer";
                    const bonusProp = isBarde ? "atk_bonus" : "def_bonus";
                    const bonusVal = isBarde ? ability.licht_atk : ability.licht_def;
                    const emoji = isBarde ? "🎯" : "🛡️";
                    const statName = isBarde ? "ATK" : "RK";

                    if (!held[durationProp] || held[durationProp] <= 0) {
                        helden.forEach(h => h[bonusProp] += (bonusVal || 0));
                    }
                    held[durationProp] = ability.licht;
                    
                    if (isBarde) {
                        await printSlow(`\n🌟 Das magische Leuchten von ${held.name} erhellt die Umgebung und schärft eure Sinne! (+${bonusVal} ${statName})`);
                    } else {
                        await printSlow(`\n✨ Das heilige Leuchten von ${held.name} vertreibt die Schatten und stärkt eure Abwehr! (+${bonusVal} ${statName})`);
                    }
                }

                if (ability.schaden) {
                    let schadenTotal = ability.schaden;

                    // Sonderlogik für Schildschlag/Schildstoß (RK + ATK)
                    if (ability.name === "Schildschlag" || ability.name === "Schildstoß") {
                        schadenTotal = held.ruestung_klasse() + held.atk_bonus;
                    }

                    // Sonderlogik für Präzisionsschlag (Skaliert mit GES + erhöhter Crit-Schaden)
                    if (ability.name === "Präzisionsschlag") {
                        const critWurf = wuerfelD20();
                        const critThreshold = Math.max(15, 20 - Math.floor(held.grund_gesch / 5));
                        const istCrit = critWurf >= critThreshold;
                        
                        schadenTotal = ability.schaden + (held.grund_gesch * 2);
                        if (istCrit) {
                            schadenTotal = Math.floor(schadenTotal * 2.5); // 2.5x Crit-Schaden
                            await printSlow(`<span class="log-critical">🎯 PRÄZISIONS-VOLTREFFER! 🎯</span>`);
                        }
                    }

                    // Sonderlogik für Waffengewalt (Skaliert stark mit Stärke/ATK)
                    if (ability.name === "Waffengewalt") {
                        schadenTotal = ability.schaden + (held.atk_bonus * 3);
                    }

                    // Sonderlogik für Arkane Überladung (Skaliert mit Intelligenz)
                    if (ability.name === "Arkane Überladung") {
                        schadenTotal = ability.schaden + (held.grund_int * 4);
                    }

                    monster.hp -= schadenTotal;
                    monster.lastDmg = schadenTotal;
                    held.totalDamageDealt += schadenTotal;
                    held.sp = Math.min(held.max_sp, held.sp + schadenTotal);
                    updateUI(helden, monster, monsterStatus);
                    await printSlow(`💥 ${ability.name} trifft ${monster.name} für ${schadenTotal} Schaden!`);

                    // Lebensraub funktioniert auch bei Fähigkeiten, wenn die Waffe es erlaubt
                    if (held.ausgeruestete_waffe?.effekt?.typ === "lebensraub") {
                        const heilung = Math.floor(ability.schaden * held.ausgeruestete_waffe.effekt.wert);
                        if (heilung > 0) {
                            held.hp = Math.min(held.max_hp, held.hp + heilung);
                            await printSlow(`<span class="effect-lifesteal">🩸 Lebensraub!</span> ${held.name} heilt sich um <span class="hp-gain">${heilung} HP</span>.`);
                        }
                    }
                    
                    if (monsterStatus.schlaf > 0 && monster.hp > 0) {
                        monsterStatus.schlaf = 0;
                        await printSlow(`❗ ${monster.name} wurde durch den Angriff geweckt!`);
                    }
                }
                if (ability.heilung && targetHeld) {
                    targetHeld.hp = Math.min(targetHeld.max_hp, targetHeld.hp + ability.heilung);
                    let actualHealing = ability.heilung;
                    if (held.healing_output_bonus > 0) {
                        actualHealing = Math.floor(actualHealing * (1 + held.healing_output_bonus));
                    }
                    await printSlow(`💚 ${targetHeld.name} regeneriert ${ability.heilung} HP.`);
                }
                if (ability.atk_buff) {
                    if (held.klasse.toLowerCase() === "barde") {
                        helden.filter(h => h.hp > 0).forEach(h => h.atk_bonus += ability.atk_buff);
                        await printSlow(`<span class="buff-text">🎶 ${held.name} spielt ein inspirierendes Lied! Die gesamte Gruppe erhält +${ability.atk_buff} ATK.</span>`);
                    } else {
                        held.atk_bonus += ability.atk_buff;
                        await printSlow(`<span class="buff-text">🔥 ${held.name} kanalisiert Wut! (+${ability.atk_buff} ATK Bonus)</span>`);
                    }
                }
                if (ability.def_buff) {
                    if (held.klasse.toLowerCase() === "barde") {
                        helden.filter(h => h.hp > 0).forEach(h => h.def_bonus += ability.def_buff);
                        await printSlow(`<span class="buff-text">🎶 ${held.name} spielt ein schützendes Lied! Die gesamte Gruppe erhält +${ability.def_buff} RK.</span>`);
                    } else {
                        held.def_bonus += ability.def_buff;
                        await printSlow(`<span class="buff-text">🛡️ ${held.name} stärkt die Verteidigung! (+${ability.def_buff} RK Bonus)</span>`);
                    }
                }
                if (ability.execute_threshold && monster.hp <= ability.execute_threshold) {
                    monster.hp = 0;
                    updateUI(helden, monster, monsterStatus);
                    await printSlow(`💀 GNADENSTOSS! ${monster.name} wurde hingerichtet.`);
                }
                if (ability.belebt && targetHeld) {
                    let revivedHp = 10;
                    if (held.healing_output_bonus > 0) {
                        revivedHp = Math.floor(revivedHp * (1 + held.healing_output_bonus));
                    }
                    targetHeld.hp = revivedHp;
                    await printSlow(`☀️ ${targetHeld.name} wurde von den Toten zurückgeholt und hat ${revivedHp} HP!`);
                }
                if (ability.schlaf_dauer) {
                    let duration = ability.schlaf_dauer;
                    if (held.debuff_duration_bonus > 0) {
                        duration += held.debuff_duration_bonus;
                    }
                    monsterStatus.schlaf = duration;
                    await printSlow(`💤 ${monster.name} ist eingeschlafen!`);
                }
                if (ability.verwirrt) {
                    monsterStatus.verwirrt = ability.verwirrt;
                    await printSlow(`🌀 ${monster.name} ist verwirrt!`);
                }
                if (ability.verwirrt) {
                    let duration = ability.verwirrt;
                    if (held.debuff_duration_bonus > 0) {
                        duration += held.debuff_duration_bonus;
                    }
                    monsterStatus.verwirrt = duration;
                    await printSlow(`🌀 ${monster.name} ist verwirrt!`);
                }
                if (ability.hp_kosten) {
                    held.hp = Math.max(0, held.hp - ability.hp_kosten);
                    held.totalDamageTaken += ability.hp_kosten;
                    held.damageSources["Eigen-Schaden (Fähigkeit)"] = (held.damageSources["Eigen-Schaden (Fähigkeit)"] || 0) + ability.hp_kosten;
                    await printSlow(`🩸 ${held.name} zahlt ${ability.hp_kosten} HP für die Kraft der Fähigkeit!`);
                }

                // Passive Fähigkeit: Gedankenschärfe (Magier)
                if (held.klasse.toLowerCase() === "magier" && held.hasGedankenschaerfe) {
                    // Prüfen, ob es sich um einen Intelligenz-skalierten Zauber handelt (hier: Arkane Überladung)
                    // In einem komplexeren System könnte man ein 'scalesWith' Attribut in der Fähigkeit definieren.
                    if (ability.name === "Arkane Überladung") {
                        const gedankenschaerfeChance = Math.min(1.0, 0.25 + (held.grund_int * 0.025)); // 25% Basis + 2.5% pro INT-Punkt, max 100%
                        if (Math.random() < gedankenschaerfeChance) {
                            const refundedAP = Math.floor((ability.ap_kosten || 0) * 0.5); // 50% der AP-Kosten zurückerstatten
                            held.ap = Math.min(held.max_ap, held.ap + refundedAP);
                            await printSlow(`✨ <span class="effect-ap">${held.name}s Gedankenschärfe aktiviert!</span> ${refundedAP} AP wurden zurückgewonnen.`);
                        }
                    }
                }
            }

            if (monster.hp <= 0) break;
        }
                
        const lebende_helden = helden.filter(h => h.hp > 0);
        
        if (monster.hp > 0 && lebende_helden.length > 0) {
            if (monsterStatus.schlaf > 0) {
                await printSlow(`\n💤 ${monster.name} schläft tief und fest und setzt diese Runde aus.`);
                monsterStatus.schlaf--;
                continue; // Springt zum Rundenanfang zurück
            } else if (monsterStatus.verwirrt > 0) {
                monsterStatus.verwirrt--;
                if (Math.random() > 0.5) {
                    await printSlow(`\n🌀 ${monster.name} ist völlig verwirrt!`);
                    const selbstSchaden = randomRange(5, 10);
                    monster.hp -= selbstSchaden;
                    monster.lastDmg = selbstSchaden;
                    updateUI(helden, monster, monsterStatus);
                    await printSlow(`💥 Es greift sich selbst an und erleidet ${selbstSchaden} Schaden!`);
                    continue;
                }
            }

            // Zielprüfung: Sicherstellen, dass noch jemand lebt
            if (lebende_helden.length === 0) break;

            const ziel = lebende_helden[Math.floor(Math.random() * lebende_helden.length)];
            
            await printSlow(`\n👹 Der ${monster.name} holt aus und greift ${ziel.name} an!`);
            const m_roll = wuerfelD20();
            const monster_wurf = m_roll + monster.atk;
            const m_isCrit = m_roll === 20;
            const m_isFumble = m_roll === 1;
            
            if (m_isFumble) {
                await printSlow(`<span class="log-fumble">🌀 DER GEGNER PATZT! 🌀</span>`);
                const monsterSprueche = [
                    `Der ${monster.name} rutscht auf einer Pfütze aus!`,
                    `Der Angriff vom ${monster.name} geht völlig ins Leere!`,
                    `Der ${monster.name} stolpert über seine eigenen Gliedmaßen!`,
                    `Der ${monster.name} verfängt sich kurzzeitig in der Umgebung!`,
                    `Ein plötzlicher Krampf lässt den Schlag vom ${monster.name} verpuffen!`
                ];
                await printSlow(monsterSprueche[randomRange(0, monsterSprueche.length - 1)]);
            } else if (monster_wurf >= ziel.ruestung_klasse() || m_isCrit) {
                let schaden = randomRange(5, 12);
                if (m_isCrit) {
                    schaden *= 2;
                    await printSlow(`<span class="log-critical">💀 KRITISCHER GEGNER-TREFFER! 💀</span>`);
                }
                ziel.hp = Math.max(0, ziel.hp - schaden);
                ziel.totalDamageTaken += schaden;
                ziel.damageSources[monster.name] = (ziel.damageSources[monster.name] || 0) + schaden;
                await printSlow(`🩸 ${m_isCrit ? "KRIT! " : ""}${ziel.name} wird getroffen und verliert ${schaden} HP!`);
            } else {
                await printSlow(`🛡️ ${ziel.name} blockt den Angriff erfolgreich ab!`);
            }
        }
    }
                
    if (helden.some(h => h.hp > 0)) {
        helden.forEach(h => h.isVerwirrt = false); // Verwirrung nach Kampf lösen
        
        const hasBuff = helden.some(h => h.hatBardenBuff);
        const goldBetrag = hasBuff ? Math.floor(monster.gold * 1.1) : monster.gold;

        await printSlow(`\n🎉 Sieg über den ${monster.name}! Jeder Held erhält ${monster.xp} XP und ${goldBetrag} Gold.`);
        triggerGoldAnimation();
        for (const held of helden) {
            held.xp += monster.xp;
            held.gold += (held.hatBardenBuff ? Math.floor(monster.gold * 1.1) : monster.gold);
            if (held.hp <= 0) held.hp = 1;

            // Visuelles Feedback vor dem Level-Up
            updateUI(helden, monster); 
            if (held.xp >= held.xp_needed) {
                await printSlow(`\n✨ <span class="rare-item">${held.name} steht an der Schwelle zu neuer Macht!</span>`);
            }

            const levelsGained = held.check_levelup();
            if (levelsGained > 0) {
                await printSlow(`\n🌟 LEVEL UP für ${held.name}! Level ${held.level}!`, 'level-up-animation');
                await Story.levelUpMenu(held, levelsGained);
            }
        }
        // Quest-Check nach dem Kampf (Kills tracken)
        await Story.checkQuests(helden, { type: 'kill', monster: monster, ebene: ebene });
        
        return true;
    }
    await printSlow("\n💀 Eure gesamte Gruppe wurde ausgelöscht... GAME OVER.");
    return false;
}