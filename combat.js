import { question, randomRange, printSlow, wuerfelD20 } from './utils.js';

async function spielerZug(spieler, monster_name, monster_hp, helden) {
    if (spieler.isKI) {
        await printSlow(`\n🤖 [KI-ZUG: ${spieler.name.toUpperCase()}]`);
        
        const istHeilerOderAlchemist = spieler.klasse.toLowerCase() === "heiler" || spieler.klasse.toLowerCase() === "alchemist";

        // 1. Priorität: Selbstheilung wenn HP unter 40%
        if (spieler.hp < spieler.max_hp * 0.4 && spieler.traenke > 0) {
            spieler.traenke -= 1;
            const heilung = randomRange(8, 18);
            spieler.hp = Math.min(spieler.max_hp, spieler.hp + heilung);
            await printSlow(`🧪 ${spieler.name} nutzt einen Trank. +${heilung} HP!`);
            return ["heilung", 0];
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

        // 3. Priorität: Angriff
        const wurf = wuerfelD20();
        const gesamt_angriff = wurf + spieler.atk_bonus;

        // KI nutzt zufällig eine Schadensfähigkeit, wenn genug AP da ist
        const fähigkeit = spieler.abilities.find(a => a.schaden && spieler.ap >= a.ap_kosten);
        if (fähigkeit && Math.random() > 0.6) {
            spieler.ap -= fähigkeit.ap_kosten;
            return ["fähigkeit", { ability: fähigkeit, targetHeld: null }];
        }

        await printSlow(`⚔️ ${spieler.name} greift an! Wurf: ${wurf} (+${spieler.atk_bonus}) = ${gesamt_angriff}`);
        return ["angriff", gesamt_angriff];
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
            return ["angriff", gesamt_angriff];
            
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
            spieler.inventar.forEach((item, i) => {
                console.log(`${i + 1}. ${item.name} (${item.typ}: ${item.wert})`);
            });
            const inv_wahl = await question("Nummer wählen oder 0 für zurück: ");
            const idx = parseInt(inv_wahl) - 1;
            
            if (!isNaN(idx) && idx >= 0 && idx < spieler.inventar.length) {
                const erfolgName = spieler.ausruesten(idx);
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
                console.log(`${i + 1}. ${ab.name} (AP: ${ab.ap_kosten})`);
            });
            const ab_wahl = await question("Wahl (0 für zurück): ");
            const idx = parseInt(ab_wahl) - 1;

            if (!isNaN(idx) && idx >= 0 && idx < spieler.abilities.length) {
                const ability = spieler.abilities[idx];
                if (spieler.ap < ability.ap_kosten) {
                    await printSlow("❌ Nicht genug Aktionspunkte (AP)!");
                    continue;
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

                spieler.ap -= ability.ap_kosten;
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

export async function teamKampf(helden, monster) {
    await printSlow(`\n⚔️ Ein mächtiger ${monster.name} (HP: ${monster.hp} | RK: ${monster.rk}) blockiert den Weg!`);

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
        helden.filter(h => h.hp > 0).forEach(held => {
            const apRegen = 5; // Standard-AP-Regeneration pro Runde
            held.ap = Math.min(held.max_ap, held.ap + apRegen);
            console.log(`✨ ${held.name} regeneriert ${apRegen} AP. (Aktuell: ${held.ap}/${held.max_ap})`);
        });
        for (const held of helden) {
            if (held.hp <= 0) continue;
                
            console.log(`\n--- Gegner: ${monster.name} (${monster.hp} HP) ---`);
            const [aktion, wert] = await spielerZug(held, monster.name, monster.hp, helden);
            
            if (aktion === "angriff") {
                if (wert >= monster.rk) {
                    const waffen_schaden = held.ausgeruestete_waffe ? held.ausgeruestete_waffe.wert : 2;
                    const schaden = randomRange(1, waffen_schaden) + held.level;
                    monster.hp -= schaden;
                    await printSlow(`💥 Treffer! ${held.name} fügt dem ${monster.name} ${schaden} Schaden zu.`);
                    
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
                await printSlow(`✨ ${held.name} setzt ${ability.name} ein!`);

                if (ability.schaden) {
                    monster.hp -= ability.schaden;
                    await printSlow(`💥 ${ability.name} trifft ${monster.name} für ${ability.schaden} Schaden!`);
                    
                    if (monsterStatus.schlaf > 0 && monster.hp > 0) {
                        monsterStatus.schlaf = 0;
                        await printSlow(`❗ ${monster.name} wurde durch den Angriff geweckt!`);
                    }
                }
                if (ability.heilung && targetHeld) {
                    targetHeld.hp = Math.min(targetHeld.max_hp, targetHeld.hp + ability.heilung);
                    await printSlow(`💚 ${targetHeld.name} regeneriert ${ability.heilung} HP.`);
                }
                if (ability.atk_buff) {
                    held.atk_bonus += ability.atk_buff;
                    await printSlow(`🔥 ${held.name} kanalisiert Wut! (+${ability.atk_buff} ATK Bonus)`);
                }
                if (ability.execute_threshold && monster.hp <= ability.execute_threshold) {
                    monster.hp = 0;
                    await printSlow(`💀 GNADENSTOSS! ${monster.name} wurde hingerichtet.`);
                }
                if (ability.belebt && targetHeld) {
                    targetHeld.hp = 10;
                    await printSlow(`☀️ ${targetHeld.name} wurde von den Toten zurückgeholt!`);
                }
                if (ability.schlaf_dauer) {
                    monsterStatus.schlaf = ability.schlaf_dauer;
                    await printSlow(`💤 ${monster.name} ist eingeschlafen!`);
                }
                if (ability.verwirrt) {
                    monsterStatus.verwirrt = ability.verwirrt;
                    await printSlow(`🌀 ${monster.name} ist verwirrt!`);
                }
            }

            if (monster.hp <= 0) break;
        }
                
        if (monster.hp > 0) {
            if (monsterStatus.schlaf > 0) {
                await printSlow(`\n💤 ${monster.name} schläft tief und fest und setzt diese Runde aus.`);
                monsterStatus.schlaf--;
                continue;
            }

            if (monsterStatus.verwirrt > 0) {
                monsterStatus.verwirrt--;
                if (Math.random() > 0.5) {
                    await printSlow(`\n🌀 ${monster.name} ist völlig verwirrt!`);
                    const selbstSchaden = randomRange(5, 10);
                    monster.hp -= selbstSchaden;
                    await printSlow(`💥 Es greift sich selbst an und erleidet ${selbstSchaden} Schaden!`);
                    if (monster.hp <= 0) break;
                    continue;
                }
            }

            const lebende_helden = helden.filter(h => h.hp > 0);
            const ziel = lebende_helden[Math.floor(Math.random() * lebende_helden.length)];
            
            await printSlow(`\n👹 Der ${monster.name} holt aus und greift ${ziel.name} an!`);
            const monster_wurf = wuerfelD20() + monster.atk;
            
            if (monster_wurf >= ziel.ruestung_klasse()) {
                const schaden = randomRange(5, 12);
                ziel.hp = Math.max(0, ziel.hp - schaden);
                await printSlow(`🩸 ${ziel.name} wird getroffen und verliert ${schaden} HP!`);
            } else {
                await printSlow(`🛡️ ${ziel.name} blockt den Angriff erfolgreich ab!`);
            }
        }
    }
                
    if (helden.some(h => h.hp > 0)) {
        await printSlow(`\n🎉 Sieg über den ${monster.name}! Jeder Held erhält ${monster.xp} XP und ${monster.gold} Gold.`);
        helden.forEach(held => {
            held.xp += monster.xp;
            held.gold += monster.gold;
            if (held.hp <= 0) held.hp = 1;
            held.check_levelup();
        });
        return true;
    }
    await printSlow("\n💀 Eure gesamte Gruppe wurde ausgelöscht... GAME OVER.");
    return false;
}