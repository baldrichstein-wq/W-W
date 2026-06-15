import Item from './item.js';

export default class Spieler {
    constructor(name, rasse, klasse) {
        this.name = name;
        this.rasse = rasse;
        this.klasse = klasse;
        this.level = 1;
        this.xp = 0;
        this.xp_needed = 20;
        this.traenke = 0;
        this.inventar = [];
        this.isCriticalHpSoundPlayed = false; // Flag für kritische HP-Soundwiedergabe
        this.isKI = false;
        this.gold = 30; // Startgold
        this.ap = 0; // Aktionspunkte
        this.totalDamageDealt = 0;
        this.totalDamageTaken = 0;
        this.damageSources = {};
        this.max_ap = 0; // Maximale Aktionspunkte
        this.sp = 0; // Spezialpunkte für Ultimates
        this.max_sp = 100;
        
        // Standard-Boni
        this.grund_atk = 3;   // Für den Angriffswurf
        this.grund_def = 5;   // mindest Rüstungswert
        this.grund_hp = 25;   // Basis-Leben
        this.grund_ap = 0;
        this.grund_mp = 0;
        this.grund_sp = 0; // Stamina Points (nicht mehr verwendet, aber hier zur Vollständigkeit)
        this.grund_ini = 0;
        this.grund_atk_gesch = 0;
        this.grund_cha = 0;
        this.grund_int = 0;
        this.grund_stealth = 0;
        this.grund_gesch = 0; // Neues Attribut: Geschicklichkeit
        this.grund_will = 0;

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
        this.rasse_gesch = 0; // Rassenbonus für Geschicklichkeit
        this.rasse_will = 0;

        if (rasseLower === "ork") {
            this.rasse_hp = 12;
            this.rasse_atk = 3;
            this.rasse_def = 7;
            this.rasse_ap = 0;
            this.rasse_mp = 0;
            this.rasse_sp = 0;
            this.rasse_ini = -1; // Orks sind langsamer
            this.rasse_gesch = 0;
            this.rasse_cha = 0;
            this.rasse_int = 0;
            this.rasse_stealth = 0;
            this.rasse_will = 0;
        } else if (rasseLower === "goblin") {
            this.rasse_hp = 5;
            this.rasse_atk = -1;
            this.rasse_def = 4;
            this.rasse_ap = 0;
            this.rasse_mp = 0;
            this.rasse_sp = 0;
            this.rasse_ini = 2; // Goblins sind flinker
            this.rasse_gesch = 0;
            this.rasse_cha = 0;
            this.rasse_int = 0;
            this.rasse_stealth = 0;
            this.rasse_will = 0;
        } else if (rasseLower === "zwerg") {
            this.rasse_hp = 15;
            this.rasse_atk = 2;
            this.rasse_def = 5;
            this.rasse_ap = 0;
            this.rasse_mp = 0;
            this.rasse_sp = 0;
            this.rasse_ini = -2; // Zwerge sind behäbiger
            this.rasse_gesch = 0;
            this.rasse_cha = 0;
            this.rasse_int = 0;
            this.rasse_stealth = 0;
            this.rasse_will = 0;
        } else if (rasseLower === "mensch") {
            this.rasse_hp = 10;
            this.rasse_atk = 1;
            this.rasse_def = 2;
            this.rasse_ap = 0;
            this.rasse_mp = 0;
            this.rasse_sp = 0;
            this.rasse_ini = 1;
            this.rasse_gesch = 0;
            this.rasse_cha = 0;
            this.rasse_int = 0;
            this.rasse_stealth = 0;
            this.rasse_will = 0;
        } else if (rasseLower === "elf") {
            this.rasse_hp = 7;
            this.rasse_atk = 1;
            this.rasse_def = 1;
            this.rasse_ap = 0;
            this.rasse_mp = 0;
            this.rasse_sp = 0;
            this.rasse_ini = 3; // Elfen sind sehr agil
            this.rasse_gesch = 0;
            this.rasse_cha = 0;
            this.rasse_int = 0;
            this.rasse_stealth = 0;
            this.rasse_will = 0;
        }

        this.ausgeruestete_waffe = null;
        this.ausgeruestete_ruestung = null;
        this.ausgeruestete_schild = null;   // Standardmäßig kein Schild ausgerüstet
        this.abilities = [];

        
        if (klasseLower === "krieger") {
            this.max_hp = this.grund_hp + this.rasse_hp +10;
            this.atk_bonus = this.grund_atk + this.rasse_atk +3;
            this.def_bonus = this.grund_def + this.rasse_def +7;
            this.grund_cha = 0;
            this.grund_gesch = 0;
            this.ausgeruestete_ruestung = new Item("Kettenhemd", "Ruestung", 14, null, "Standard-Schutz für Soldaten.");
            this.ausgeruestete_waffe = new Item("Eisenschwert", "Waffe", 6, null, "Ein solides Schwert aus geschmiedetem Eisen.");
            this.ausgeruestete_schild = new Item("Holzschild", "Schild", 2, null, "Ein einfacher Schild aus verstärktem Holz.");
            this.abilities = [
                { name: "Mächtiger Hieb", ap_kosten: 10, schaden: 15 },
                { name: "Seitlicher Hieb", ap_kosten: 15, schaden: 15 },
                { name: "Wutrauch", ap_kosten: 20, atk_buff: 5 },
                { name: "Durchbrechen", ap_kosten: 18, schaden: 20 },
                { name: "Zorn des Ares", sp_kosten: 100, schaden: 60, atk_buff: 15, isUltimate: true, element: "Physisch" }
            ];
            this.inventar.push(new Item("Essensration", "Gegenstand", 4, null, "Getrocknetes Fleisch und Brot. Sättigt gut."));
            this.inventar.push(new Item("Wetzstein", "Material", 2, null, "Hält deine Klingen scharf und bereit."));
        } else if (klasseLower === "magier") {
            this.max_hp = this.grund_hp + this.rasse_hp +3;
            this.atk_bonus = this.grund_atk + this.rasse_atk +4;
            this.def_bonus = this.grund_def + this.rasse_def +1;
            this.grund_cha = 2;
            this.grund_gesch = 0;
            this.ausgeruestete_ruestung = new Item("Stoffrobe", "Ruestung", 10, null, "Eine einfache Robe, die den Fluss des Manas nicht behindert.");
            this.ausgeruestete_waffe = new Item("Zauberstab", "Waffe", 8, null, "Fokussiert die arkanenen Energien des Trägers.");
            this.abilities = [
                { name: "Feuerball", ap_kosten: 20, schaden: 20 },
                { name: "Windschnitt", ap_kosten: 12, schaden: 10 },
                { name: "Erlösung", ap_kosten: 2, execute_threshold: 5 },
                { name: "Blitzschlag", ap_kosten: 15, schaden: 15 },
                { name: "Armageddon", sp_kosten: 100, schaden: 80, niederhalten: 2, isUltimate: true, element: "Feuer" }
            ];
            this.inventar.push(new Item("Wasser", "Gegenstand", 2, null, "Frisches Quellwasser. Überlebenswichtig."));
            this.inventar.push(new Item("Kristallsplitter", "Material", 5, null, "Ein vibrierender Splitter voller Energie."));
        } else if (klasseLower === "schurke") {
            this.max_hp = this.grund_hp + this.rasse_hp + 2;
            this.atk_bonus = this.grund_atk +this.rasse_atk +5;
            this.def_bonus = this.grund_def + this.rasse_def +0;
            this.grund_cha = 1;
            this.grund_gesch = 3; // Schurken sind geschickt
            this.ausgeruestete_ruestung = new Item("Lederrüstung", "Ruestung", 12);
            this.ausgeruestete_waffe = new Item("Dolch", "Waffe", 4);
            this.abilities = [
                { name: "Meucheln", ap_kosten: 12, schaden: 18 },
                { name: "Hinterhalt", ap_kosten: 6, schaden: 5 },
                { name: "Tarnen", ap_kosten: 10, stealth_buff: 6 },
                { name: "Giftstoß", ap_kosten: 15, schaden: 10, verwirrt: 1 },
                { name: "Nachtschatten-Exitus", sp_kosten: 100, schaden: 70, verwirrt: 3, isUltimate: true, element: "Physisch" }
            ];
            this.inventar.push(new Item("Gifttrank", "Trank", 5));
            this.inventar.push(new Item("Wurfmesser", "Waffe", 2));
        } else if (klasseLower === "verteidiger") {
            this.max_hp = this.grund_hp + this.rasse_hp + 15;
            this.atk_bonus = this.grund_atk + this.rasse_atk + 0;
            this.def_bonus = this.grund_def + this.rasse_def + 5;
            this.grund_cha = 0;
            this.grund_gesch = 0;
            this.ausgeruestete_ruestung = new Item("Plattenpanzer", "Ruestung", 16);
            this.ausgeruestete_waffe = new Item("Keule", "Waffe", 4);
            this.ausgeruestete_schild = new Item("Turmschild", "Schild", 4);
            this.abilities = [
                { name: "Schildstoß", ap_kosten: 8, schaden: 10 },
                { name: "Verspotten", ap_kosten: 12, stealth_debuff: -5 },
                { name: "Blocken", ap_kosten: 14, schaden_reduktion: 5 },
                { name: "Stahlmauer", ap_kosten: 15, def_buff: 5 },
                { name: "Götterschild", sp_kosten: 100, def_buff: 15, heilung: 30, niederhalten: 1, isUltimate: true, element: "Heilig" }
            ];
            this.inventar.push(new Item("Essensration", "Gegenstand", 4));
            this.inventar.push(new Item("Rüstungspolitur", "Material", 3));
        } else if (klasseLower === "heiler") {
            this.max_hp = this.grund_hp + this.rasse_hp + 4;
            this.atk_bonus = this.grund_atk + this.rasse_atk + 0;
            this.def_bonus = this.grund_def + this.rasse_def +1;
            this.grund_cha = 2;
            this.grund_gesch = 0;
            this.ausgeruestete_ruestung = new Item("Stoffrobe", "Ruestung", 10);
            this.ausgeruestete_waffe = new Item("Heilerstab", "Waffe", 3);
            this.abilities = [
                { name: "Lichtsegen", ap_kosten: 15, heilung: 20 },
                { name: "Wiedergeburt", ap_kosten: 30, belebt: 1 },
                { name: "Lichtstrahl", ap_kosten: 5, schaden: 8 },
                { name: "Heiliges Licht", ap_kosten: 10, heilung: 15 },
                { name: "Göttliches Erwachen", sp_kosten: 100, heilung: 50, belebt: 1, atk_buff: 10, isUltimate: true, element: "Heilig" }
            ];
            this.inventar.push(new Item("Heiliges Wasser", "Gegenstand", 5));
            this.inventar.push(new Item("Verbandszeug", "Material", 3));
        } else if (klasseLower === "barde") {
            this.max_hp = this.grund_hp + this.rasse_hp + 5;
            this.atk_bonus = this.grund_atk + this.rasse_atk + 2;
            this.def_bonus = this.grund_def + this.rasse_def +1;
            this.grund_cha = 6;
            this.grund_gesch = 0;
            this.ausgeruestete_ruestung = new Item("Stoffrobe", "Ruestung", 10);
            this.ausgeruestete_waffe = new Item("Laute", "Waffe", 4);
            this.abilities = [
                { name: "Inspirierendes Lied", ap_kosten: 10, heilung: 10, bonus_schaden: 5 },
                { name: "Schlaflied", ap_kosten: 20, schlaf_dauer: 2 },
                { name: "Songversuch", ap_kosten: 15, verwirrt: 3 },
                { name: "Siegeslied", ap_kosten: 12, atk_buff: 3 },
                { name: "Symphonie des Endes", sp_kosten: 100, schaden: 40, atk_buff: 10, schlaf_dauer: 2, isUltimate: true, element: "Schall" }
            ];
            this.inventar.push(new Item("BockBier", "Gegenstand", 3));
            this.inventar.push(new Item("Ersatzsaiten", "Material", 2));
        } else if (klasseLower === "tueftler") {
            this.max_hp = this.grund_hp + this.rasse_hp + 8;
            this.atk_bonus = this.grund_atk + this.rasse_atk + 3;
            this.def_bonus = this.grund_def + this.rasse_def + 3;
            this.grund_cha = 1;
            this.grund_gesch = 2;
            this.grund_int = 3;
            this.ausgeruestete_ruestung = new Item("Lederrüstung", "Ruestung", 12);
            this.ausgeruestete_waffe = new Item("Schraubenschlüssel", "Waffe", 5);
            this.abilities = [
                { name: "Sprengfalle", ap_kosten: 0, material_kosten: "Sprengfalle", schaden: 20, level: 1 },
                { name: "Geschütz", ap_kosten: 0, material_kosten: "Geschütz", schaden: 10, leben: 10, level: 1 },
                { name: "Netzkanone", ap_kosten: 0, material_kosten: "Netz", niederhalten: 3, level: 1 },
                { name: "Dampfstoß", ap_kosten: 0, material_kosten: "Dampfpatrone", schaden: 12, level: 1 },
                { name: "Annihilator-Drohne", sp_kosten: 100, schaden: 90, niederhalten: 2, isUltimate: true, element: "Energie" }
            ];
            this.inventar.push(new Item("Mechanischeteile", "Material", 0));
            this.inventar.push(new Item("Mechanischeteile", "Material", 0));
            this.inventar.push(new Item("Schrauben und Muttern", "Material", 0));
            this.inventar.push(new Item("Maschinenoel", "Material", 0));
            this.inventar.push(new Item("Dampfpatrone", "Spezial", 0));
        } else if (klasseLower === "alchemist") {
            this.max_hp = this.grund_hp + this.rasse_hp + 8;
            this.atk_bonus = this.grund_atk + this.rasse_atk + 2;
            this.def_bonus = this.grund_def + this.rasse_def + 3;
            this.grund_cha = 1;
            this.grund_gesch = 1;
            this.grund_int = 4;
            this.ausgeruestete_ruestung = new Item("Lederschürze", "Ruestung", 11);
            this.ausgeruestete_waffe = new Item("Wurfbombe", "Waffe", 7);
            this.abilities = [
                { name: "Säureflasche", ap_kosten: 0, material_kosten: "Säuretrank", schaden: 20, level: 1 },
                { name: "Giftflasche", ap_kosten: 0, material_kosten: "Gifttrank", schaden: 10, level: 1 },
                { name: "Heilflasche", ap_kosten: 0, material_kosten: "Heiltrank", heilung: 15, level: 1 },
                { name: "Rauchbombe", ap_kosten: 0, material_kosten: "Rauchbombe", verwirrt: 1, level: 1 },
                { name: "Stein der Weisen", sp_kosten: 100, schaden: 50, heilung: 50, verwirrt: 2, isUltimate: true, element: "Säure" }
            ];
            this.inventar.push(new Item("Pflanzenteile", "Material", 0));
            this.inventar.push(new Item("Pflanzenteile", "Material", 0));
            this.inventar.push(new Item("Fläschchen", "Material", 0));
            this.inventar.push(new Item("Fläschchen", "Material", 0));
            this.inventar.push(new Item("Bestienteile", "Material", 0));
        } 
        else {
            this.max_hp = this.grund_hp + this.rasse_hp;
            this.atk_bonus = this.grund_atk + this.rasse_atk;
            this.def_bonus = this.grund_def + this.rasse_def;
            this.grund_gesch = 0;
            this.grund_cha = 0;
            this.inventar.push(new Item("Altes Brot", "Gegenstand", 1));
        }
        
        // Korrektur des Typo und Initialisierung der AP
        this.grund_ap = 30; // Erhöht auf 30 (vorher 20)
        this.grund_gesch += this.rasse_gesch; // Add racial bonus to base dexterity
        this.max_sp = 100; // Sicherstellen, dass Ultimates 100 benötigen
        this.max_ap = this.grund_ap + this.rasse_ap;
        this.grund_cha += this.rasse_cha;
        this.hp = this.max_hp;
        this.ap = this.max_ap; // AP starten voll
        this.verbrauchteMaterialien = [];
        this.activeQuests = [];
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
        if (this.xp >= this.xp_needed) {
            this.level += 1;
            this.xp -= this.xp_needed;
            this.xp_needed = Math.floor(this.xp_needed * 1.5);
            // Nur Heilung, Steigerungen passieren im Skill-Menü
            this.hp = this.max_hp; // Full HP on level up
            this.ap = this.max_ap; // AP regenerieren beim Level-Up
            return true;
        }
        return false;
    }

    zeige_status() {
        console.log(`-> ${this.name} (${this.klasse}) | HP: ${this.hp}/${this.max_hp} | AP: ${this.ap}/${this.max_ap} | RK: ${this.ruestung_klasse()} | Tränke: ${this.traenke} | Gold: ${this.gold}`);
    }
}