const { question, randomRange, printSlow, wuerfelD20 } = require('./utils');

async function spielerZug(spieler, monster_name, monster_hp) {
    while (true) {
        console.log(`\n🎮 [ZUG VON ${spieler.name.toUpperCase()}] (${spieler.hp}/${spieler.max_hp} HP)`);
        console.log("1. Angreifen");
        console.log("2. Heiltrank nutzen");
        console.log("3. Ausrüstung wechseln");
        const wahl = await question("Was tust du? (1/2/3): ");
        
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
                const item = spieler.inventar.splice(idx, 1)[0];
                if (item.typ === "Waffe") {
                    if (spieler.ausgeruestete_waffe) spieler.inventar.push(spieler.ausgeruestete_waffe);
                    spieler.ausgeruestete_waffe = item;
                } else if (item.typ === "Ruestung") {
                    if (spieler.ausgeruestete_ruestung) spieler.inventar.push(spieler.ausgeruestete_ruestung);
                    spieler.ausgeruestete_ruestung = item;
                } else if (item.typ === "Schild") {
                    if (spieler.ausgeruestete_schild) {
                        spieler.inventar.push(spieler.ausgeruestete_schild);
                    }
                    spieler.ausgeruestete_schild = item;
                }
                await printSlow(`🛡️ Gegenstand ${item.name} ausgerüstet!`);
                return ["ausruesten", 0];
            }
        }
    }
}

async function teamKampf(helden, monster) {
    await printSlow(`\n⚔️ Ein mächtiger ${monster.name} (HP: ${monster.hp} | RK: ${monster.rk}) blockiert den Weg!`);
    
    while (monster.hp > 0 && helden.some(h => h.hp > 0)) {
        for (const held of helden) {
            if (held.hp <= 0) continue;
                
            console.log(`\n--- Gegner: ${monster.name} (${monster.hp} HP) ---`);
            const [aktion, wert] = await spielerZug(held, monster.name, monster.hp);
            
            if (aktion === "angriff") {
                if (wert >= monster.rk) {
                    const waffen_schaden = held.ausgeruestete_waffe ? held.ausgeruestete_waffe.wert : 2;
                    const schaden = randomRange(1, waffen_schaden) + held.level;
                    monster.hp -= schaden;
                    await printSlow(`💥 Treffer! ${held.name} fügt dem ${monster.name} ${schaden} Schaden zu.`);
                } else {
                    await printSlow("❌ Verfehlt!");
                }
            }
            if (monster.hp <= 0) break;
        }
                
        if (monster.hp > 0) {
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

module.exports = { teamKampf };