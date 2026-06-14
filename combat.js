import { question, randomRange, printSlow, wuerfelD20, updateUI } from './utils.js';
import * as Story from './story.js';

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
                const kosten = ability.ap_kosten || 0;
                if (spieler.ap < kosten) {
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

                spieler.ap -= kosten;
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
        monster.lastDmg = 0;
        helden.filter(h => h.hp > 0).forEach(held => {
            let apRegen = 5; // Standard
            // Zusätzliche AP durch Ausrüstung (Boss-Loot)
            const ausruestung = [held.ausgeruestete_waffe, held.ausgeruestete_ruestung, held.ausgeruestete_schild];
            ausruestung.forEach(item => {
                if (item?.effekt?.typ === "ap_regen") apRegen += item.effekt.wert;
            });

            held.ap = Math.min(held.max_ap, held.ap + apRegen);
            console.log(`<span class="effect-ap">✨ ${held.name} regeneriert ${apRegen} AP.</span> (Aktuell: ${held.ap}/${held.max_ap})`);
        });
        updateUI(helden, monster, monsterStatus);

        for (const held of helden) {
            if (held.hp <= 0) continue;
                
            console.log(`\n--- Gegner: ${monster.name} (${monster.hp} HP) ---`);
            const [aktion, wert] = await spielerZug(held, monster.name, monster.hp, helden);
            
            if (aktion === "angriff") {
                monster.lastDmg = 0;
                // Basis SP-Gewinn pro Angriffsversuch
                held.sp = Math.min(held.max_sp, held.sp + 10);

                const { roll, natural } = wert;
                const isCrit = natural === 20;
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
                    held.sp = Math.min(held.max_sp, held.sp + schaden);
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
                await printSlow(`✨ ${held.name} setzt ${ability.name} ein!`);
                monster.lastDmg = 0;

                if (ability.schaden) {
                    monster.hp -= ability.schaden;
                    monster.lastDmg = ability.schaden;
                    held.sp = Math.min(held.max_sp, held.sp + ability.schaden);
                    await printSlow(`💥 ${ability.name} trifft ${monster.name} für ${ability.schaden} Schaden!`);

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
                    await printSlow(`💚 ${targetHeld.name} regeneriert ${ability.heilung} HP.`);
                }
                if (ability.atk_buff) {
                    held.atk_bonus += ability.atk_buff;
                    await printSlow(`<span class="buff-text">🔥 ${held.name} kanalisiert Wut! (+${ability.atk_buff} ATK Bonus)</span>`);
                }
                if (ability.def_buff) {
                    held.def_bonus += ability.def_buff;
                    await printSlow(`<span class="buff-text">🛡️ ${held.name} stärkt die Verteidigung! (+${ability.def_buff} RK Bonus)</span>`);
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
                await printSlow(`🩸 ${m_isCrit ? "KRIT! " : ""}${ziel.name} wird getroffen und verliert ${schaden} HP!`);
            } else {
                await printSlow(`🛡️ ${ziel.name} blockt den Angriff erfolgreich ab!`);
            }
        }
    }
                
    if (helden.some(h => h.hp > 0)) {
        await printSlow(`\n🎉 Sieg über den ${monster.name}! Jeder Held erhält ${monster.xp} XP und ${monster.gold} Gold.`);
        for (const held of helden) {
            held.xp += monster.xp;
            held.gold += monster.gold;
            if (held.hp <= 0) held.hp = 1;
            if (held.check_levelup()) {
                await Story.faehigkeitWaehlen(held);
            }
        }
        return true;
    }
    await printSlow("\n💀 Eure gesamte Gruppe wurde ausgelöscht... GAME OVER.");
    return false;
}