import Item from './item.js';
import { GAME_BALANCE, STARTING_ABILITIES } from './config.js';

export default class Spieler {
    constructor(name, rasse, klasse) {
        this.name = name;
        this.rasse = rasse;
        this.klasse = klasse;
        this.level = 1;
        this.xp = 0;
        this.xp_needed = GAME_BALANCE.XP.START_NEEDED;
        this.traenke = 0;
        this.inventar = [];
        this.isCriticalHpSoundPlayed = false; // Flag für kritische HP-Soundwiedergabe
        this.isKI = false;
        this.gold = GAME_BALANCE.STATS.BASE_GOLD; // Startgold
        this.ap = 0;
        this.totalDamageDealt = 0;
        this.totalDamageTaken = 0;
        this.damageSources = {};
        this.max_ap = 0; // Maximale Aktionspunkte
        this.max_mp = 0; // Maximale Manapunkte
        this.sp = 0; // Spezialpunkte für Ultimates
        this.max_sp = GAME_BALANCE.STATS.MAX_SP;
        
        // Standard-Boni
        this.grund_atk = GAME_BALANCE.STATS.BASE_ATK;
        this.grund_def = GAME_BALANCE.STATS.BASE_DEF;
        this.grund_hp = GAME_BALANCE.STATS.BASE_HP;
        this.grund_ap = GAME_BALANCE.STATS.BASE_AP;
        this.grund_mp = GAME_BALANCE.STATS.BASE_MP;
        this.grund_sp = 0; // Stamina Points (nicht mehr verwendet, aber hier zur Vollständigkeit)
        this.grund_ini = 0;
        this.grund_atk_gesch = 0;
        this.grund_cha = 0;
        this.grund_int = 0;
        this.grund_stealth = 0;
        this.grund_gesch = 0; // Neues Attribut: Geschicklichkeit
        this.hasGedankenschaerfe = false; // Passive Fähigkeit für Magier
        this.grund_will = 0;
        // Neue passive Bonus-Eigenschaften für Spezialisierungen
        this.crit_threshold_modifier = 0; // Reduziert den benötigten natürlichen Wurf für einen kritischen Treffer (z.B. -1 bedeutet Krit auf 19+)
        this.ap_regen_modifier = 0; // Bonus AP-Regeneration pro Runde
        this.crafting_success_bonus = 0; // Bonus auf den Crafting-Wurf (reduziert DC)
        this.material_efficiency_bonus = 0; // Chance, Materialien beim Crafting nicht zu verbrauchen (0.0 - 1.0)
        this.debuff_duration_bonus = 0; // Bonus auf die Dauer von Debuffs, die der Spieler anwendet (in Runden)
        this.buff_duration_bonus = 0; // Bonus auf die Dauer von Buffs, die der Spieler anwendet (in Runden)
        this.healing_output_bonus = 0; // Multiplikator für die ausgehende Heilung (z.B. 0.15 für +15%)
        this.damage_reduction_bonus = 0; // Flache Schadensreduktion pro Treffer
        this.hp_regen_bonus = 0; // Bonus HP-Regeneration pro Runde
        this.trap_detection_bonus = 0; // Bonus auf Fallen-Entdeckung (Rassen-Passiv)
        this.completedQuests = []; // Verfolgt abgeschlossene Quests
        this.achievements = []; // Array für freigeschaltete Achievements

        const rasseLower = rasse.toLowerCase().trim();
        const klasseLower = klasse.toLowerCase().trim();

        // Initialisierung der Boni, um NaN bei unbekannten Rassen zu verhindern
        this.rasse_hp = 0;
        this.rasse_atk = 0;
        this.rasse_def = 0;
        this.rasse_ap = 0;
        this.rasse_mp = 0;
        this.rasse_sp = 0;
        this.rasse_ini = 0;
        this.rasse_gesch = 0;
        this.rasse_cha = 0;
        this.rasse_int = 0;
        this.rasse_stealth = 0;
        this.rasse_will = 0;

        const rb = GAME_BALANCE.RACE_BONUSES[rasseLower] || { hp: 10, atk: 1, def: 2, ini: 1 };
        this.rasse_hp = rb.hp;
        this.rasse_atk = rb.atk;
        this.rasse_def = rb.def;
        this.rasse_ini = rb.ini;
        if (rb.gesch) this.rasse_gesch = rb.gesch;
        if (rb.trap_detect) this.trap_detection_bonus = rb.trap_detect;

        const cb = GAME_BALANCE.CLASS_BONUSES[klasseLower] || { hp: 0, atk: 0, def: 0 };
        this.max_hp = this.grund_hp + this.rasse_hp + cb.hp;
        this.atk_bonus = this.grund_atk + this.rasse_atk + cb.atk;
        this.def_bonus = this.grund_def + this.rasse_def + cb.def;
        this.max_mp = this.grund_mp + (rb.mp || 0) + (cb.mp || 0);
        this.mp = this.max_mp;

        this.abilities = [...(STARTING_ABILITIES[klasseLower] || [])];

        if (klasseLower === "krieger") {
            this.ausgeruestete_ruestung = new Item("Kettenhemd", "Ruestung", 14, null, "Standard-Schutz für Soldaten.");
            this.ausgeruestete_waffe = new Item("Eisenschwert", "Waffe", 6, null, "Ein solides Schwert aus geschmiedetem Eisen.");
            this.ausgeruestete_schild = new Item("Holzschild", "Schild", 2, null, "Ein einfacher Schild aus verstärktem Holz.");
            this.inventar.push(new Item("Essensration", "Gegenstand", 4, null, "Getrocknetes Fleisch und Brot. Sättigt gut."));
            this.inventar.push(new Item("Wetzstein", "Material", 2, null, "Hält deine Klingen scharf und bereit."));
        }

        else if (klasseLower === "magier") {
            this.grund_cha = 2;
            this.hasGedankenschaerfe = true; // Magier erhalten Gedankenschärfe
            this.ausgeruestete_ruestung = new Item("Stoffrobe", "Ruestung", 10, null, "Eine einfache Robe, die den Fluss des Manas nicht behindert.");
            this.ausgeruestete_waffe = new Item("Zauberstab", "Waffe", 8, null, "Fokussiert die arkanenen Energien des Trägers.");
            this.inventar.push(new Item("Wasser", "Gegenstand", 2, null, "Frisches Quellwasser. Überlebenswichtig."));
            this.inventar.push(new Item("Kristallsplitter", "Material", 5, null, "Ein vibrierender Splitter voller Energie."));
        } else if (klasseLower === "schurke") {
            this.grund_cha = 1;
            this.grund_gesch = 3; // Schurken sind geschickt
            this.ausgeruestete_ruestung = new Item("Lederrüstung", "Ruestung", 12);
            this.ausgeruestete_waffe = new Item("Dolch", "Waffe", 4);
            this.inventar.push(new Item("Gifttrank", "Trank", 5));
            this.inventar.push(new Item("Wurfmesser", "Waffe", 2));
        } else if (klasseLower === "verteidiger") {
            this.ausgeruestete_ruestung = new Item("Plattenpanzer", "Ruestung", 16);
            this.ausgeruestete_waffe = new Item("Keule", "Waffe", 4);
            this.ausgeruestete_schild = new Item("Turmschild", "Schild", 4);
            this.inventar.push(new Item("Essensration", "Gegenstand", 4));
            this.inventar.push(new Item("Rüstungspolitur", "Material", 3));
        } else if (klasseLower === "heiler") {
            this.grund_cha = 2;
            this.ausgeruestete_ruestung = new Item("Stoffrobe", "Ruestung", 10);
            this.ausgeruestete_waffe = new Item("Heilerstab", "Waffe", 3);
            this.inventar.push(new Item("Heiliges Wasser", "Gegenstand", 5));
            this.inventar.push(new Item("Verbandszeug", "Material", 3));
        } else if (klasseLower === "barde") {
            this.grund_cha = 6;
            this.ausgeruestete_ruestung = new Item("Stoffrobe", "Ruestung", 10);
            this.ausgeruestete_waffe = new Item("Laute", "Waffe", 4);
            this.inventar.push(new Item("BockBier", "Gegenstand", 3));
            this.inventar.push(new Item("Ersatzsaiten", "Material", 2));
        } else if (klasseLower === "tueftler") {
            this.grund_cha = 1;
            this.grund_gesch = 2;
            this.grund_int = 3;
            this.ausgeruestete_ruestung = new Item("Lederrüstung", "Ruestung", 12);
            this.ausgeruestete_waffe = new Item("Schraubenschlüssel", "Waffe", 5);
            this.inventar.push(new Item("Mechanischeteile", "Material", 0));
            this.inventar.push(new Item("Mechanischeteile", "Material", 0));
            this.inventar.push(new Item("Schrauben und Muttern", "Material", 0));
            this.inventar.push(new Item("Maschinenoel", "Material", 0));
            this.inventar.push(new Item("Dampfpatrone", "Spezial", 0));
        } else if (klasseLower === "alchemist") {
            this.grund_cha = 1;
            this.grund_gesch = 1;
            this.grund_int = 4;
            this.ausgeruestete_ruestung = new Item("Lederschürze", "Ruestung", 11);
            this.ausgeruestete_waffe = new Item("Wurfbombe", "Waffe", 7);
            this.inventar.push(new Item("Pflanzenteile", "Material", 0));
            this.inventar.push(new Item("Pflanzenteile", "Material", 0));
            this.inventar.push(new Item("Fläschchen", "Material", 0));
            this.inventar.push(new Item("Fläschchen", "Material", 0));
            this.inventar.push(new Item("Bestienteile", "Material", 0));
        } else if (klasseLower === "beschwoerer" || klasseLower === "beschwörer") {
            this.grund_int = 3;
            this.ausgeruestete_ruestung = new Item("Ledergewand", "Ruestung", 11);
            this.ausgeruestete_waffe = new Item("Beschwörerstab", "Waffe", 7);
            this.inventar.push(new Item("Kristallsplitter", "Material", 0));
            this.inventar.push(new Item("Bestienteile", "Material", 0));
            this.inventar.push(new Item("Heiltrank", "Gegenstand", 10));
        }
        else {
            this.inventar.push(new Item("Altes Brot", "Gegenstand", 1));
        }
        
        this.grund_gesch += this.rasse_gesch; // Add racial bonus to base dexterity
        this.max_sp = GAME_BALANCE.STATS.MAX_SP;
        this.max_ap = this.grund_ap + this.rasse_ap;
        this.grund_cha += this.rasse_cha;
        this.hp = this.max_hp;
        this.ap = this.max_ap;
        this.mp = this.max_mp;
        this.verbrauchteMaterialien = [];
        this.activeQuests = [];
        this.tavernBanRooms = 0; // Verbleibende Räume für das Hausverbot
    }

    ruestung_klasse() {
        const ruestung_wert = this.ausgeruestete_ruestung ? this.ausgeruestete_ruestung.wert : 0;
        const schild_wert = this.ausgeruestete_schild ? this.ausgeruestete_schild.wert : 0;
        return ruestung_wert + schild_wert + this.def_bonus;
    }

    ausruesten(index) {
        if (index < 0 || index >= this.inventar.length) return null;

        const item = this.inventar[index];
        let slotProperty = "";

        if (item.typ === "Waffe") slotProperty = "ausgeruestete_waffe";
        else if (item.typ === "Ruestung") slotProperty = "ausgeruestete_ruestung";
        else if (item.typ === "Schild") slotProperty = "ausgeruestete_schild";
        else return null; // Gegenstandstyp nicht ausrüstbar (z.B. Trank oder Goldwert)

        // Gegenstand aus Inventar entfernen
        this.inventar.splice(index, 1);

        // Aktuell ausgerüsteten Gegenstand zurück ins Inventar legen
        if (this[slotProperty]) {
            this.inventar.push(this[slotProperty]);
        }

        // Neuen Gegenstand anlegen
        this[slotProperty] = item;
        return item.name;
    }

    kiAutomatischAusruesten() {
        if (!this.isKI) return;

        const typen = ["Waffe", "Ruestung", "Schild"];
        
        for (const typ of typen) {
            // Finde alle Items dieses Typs im Inventar
            const passendeItems = this.inventar
                .map((item, index) => ({ item, index }))
                .filter(obj => obj.item.typ === typ);

            if (passendeItems.length === 0) continue;

            // Sortiere nach Wert (absteigend), um das beste Item zuerst zu prüfen
            passendeItems.sort((a, b) => b.item.wert - a.item.wert);
            const bestesItemObj = passendeItems[0];
            let aktuellerWert = 0;

            if (typ === "Waffe" && this.ausgeruestete_waffe) aktuellerWert = this.ausgeruestete_waffe.wert;
            else if (typ === "Ruestung" && this.ausgeruestete_ruestung) aktuellerWert = this.ausgeruestete_ruestung.wert;
            else if (typ === "Schild" && this.ausgeruestete_schild) aktuellerWert = this.ausgeruestete_schild.wert;

            if (bestesItemObj.item.wert > aktuellerWert) {
                const name = this.ausruesten(bestesItemObj.index);
                console.log(`🤖 ${this.name} (KI) rüstet automatisch aus: ${name} (Stärke: ${bestesItemObj.item.wert})`);
                // Rekursiver Aufruf, da sich die Inventar-Indizes nach ausruesten() verschieben
                return this.kiAutomatischAusruesten(); 
            }
        }
    }

    check_levelup() {
        let levelsGained = 0;
        while (this.xp >= this.xp_needed) {
            this.level += 1;
            this.xp -= this.xp_needed;
            this.xp_needed = Math.floor(this.xp_needed * GAME_BALANCE.XP.LEVEL_UP_MULTIPLIER);
            levelsGained++;
        }
        if (levelsGained > 0) {
            this.hp = this.max_hp;
            this.ap = this.max_ap;
            this.mp = this.max_mp;
            return levelsGained; // Gibt die Anzahl der gewonnenen Level zurück
        }
        return 0;
    }

    zeige_status() {
        console.log(`-> ${this.name} (${this.klasse}) | HP: ${this.hp}/${this.max_hp} | AP: ${this.ap}/${this.max_ap} | RK: ${this.ruestung_klasse()} | Tränke: ${this.traenke} | Gold: ${this.gold}`);
    }
}