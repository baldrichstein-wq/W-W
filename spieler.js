const Item = require('./item');

class Spieler {
    constructor(name, rasse, klasse) {
        this.name = name;
        this.rasse = rasse;
        this.klasse = klasse;
        this.level = 1;
        this.xp = 0;
        this.xp_needed = 20;
        this.traenke = 0;
        this.inventar = [];
        this.gold = 15; // Startgold
        this.ap = 0; // Aktionspunkte
        this.max_ap = 0; // Maximale Aktionspunkte
        
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
        this.rasse_will = 0;

        if (rasseLower === "ork") {
            this.rasse_hp = 12;
            this.rasse_atk = 3;
            this.rasse_def = 7;
            this.rasse_ap = 0;
            this.rasse_mp = 0;
            this.rasse_sp = 0;
            this.rasse_ini = 0;
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
            this.rasse_ini = 0;
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
            this.rasse_ini = 0;
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
            this.rasse_ini = 0;
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
            this.rasse_ini = 0;
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
            this.ausgeruestete_ruestung = new Item("Kettenhemd", "Ruestung", 14);
            this.ausgeruestete_waffe = new Item("Eisenschwert", "Waffe", 6);
            this.ausgeruestete_schild = new Item("Holzschild", "Schild", 2);
            this.abilities = [
                { name: "Mächtiger Hieb", ap_kosten: 10, schaden: 15 },
                { name: "Seitlicher Hieb", ap_kosten: 15, schaden: 15 },
                { name: "Wutrauch", ap_kosten: 20, atk_buff: 5 }
            ];
        } else if (klasseLower === "magier") {
            this.max_hp = this.grund_hp + this.rasse_hp +3;
            this.atk_bonus = this.grund_atk + this.rasse_atk +4;
            this.def_bonus = this.grund_def + this.rasse_def +1;
            this.ausgeruestete_ruestung = new Item("Stoffrobe", "Ruestung", 10);
            this.ausgeruestete_waffe = new Item("Zauberstab", "Waffe", 8);
            this.abilities = [
                { name: "Feuerball", ap_kosten: 20, schaden: 20 },
                { name: "Windschnitt", ap_kosten: 12, schaden: 10 },
                { name: "Erlösung", ap_kosten: 2, execute_threshold: 5 }
            ];
        } else if (klasseLower === "schurke") {
            this.max_hp = this.grund_hp + this.rasse_hp + 2;
            this.atk_bonus = this.grund_atk +this.rasse_atk +5;
            this.def_bonus = this.grund_def + this.rasse_def +0;
            this.ausgeruestete_ruestung = new Item("Lederrüstung", "Ruestung", 12);
            this.ausgeruestete_waffe = new Item("Dolch", "Waffe", 4);
            this.abilities = [
                { name: "Meucheln", ap_kosten: 12, schaden: 18 },
                { name: "Hinterhalt", ap_kosten: 6, schaden: 5 },
                { name: "Tarnen", ap_kosten: 10, stealth_buff: 6 }
            ];
        } else if (klasseLower === "verteidiger") {
            this.max_hp = this.grund_hp + this.rasse_hp + 15;
            this.atk_bonus = this.grund_atk + this.rasse_atk + 0;
            this.def_bonus = this.grund_def + this.rasse_def + 5;
            this.ausgeruestete_ruestung = new Item("Plattenpanzer", "Ruestung", 16);
            this.ausgeruestete_waffe = new Item("Keule", "Waffe", 4);
            this.ausgeruestete_schild = new Item("Turmschild", "Schild", 4);
            this.abilities = [
                { name: "Schildstoß", ap_kosten: 8, schaden: 10 },
                { name: "Verspotten", ap_kosten: 12, stealth_debuff: -5 },
                { name: "Blocken", ap_kosten: 14, schaden_reduktion: 5 }
            ];
        } else if (klasseLower === "heiler") {
            this.max_hp = this.grund_hp + this.rasse_hp + 4;
            this.atk_bonus = this.grund_atk + this.rasse_atk + 0;
            this.def_bonus = this.grund_def + this.rasse_def +1;
            this.ausgeruestete_ruestung = new Item("Stoffrobe", "Ruestung", 10);
            this.ausgeruestete_waffe = new Item("Heilerstab", "Waffe", 3);
            this.abilities = [
                { name: "Lichtsegen", ap_kosten: 15, heilung: 20 },
                { name: "Wiedergeburt", ap_kosten: 30, belebt: 1 },
                { name: "Lichtstrahl", ap_kosten: 5, schaden: 8 }
            ];
        } else if (klasseLower === "barde") {
            this.max_hp = this.grund_hp + this.rasse_hp + 5;
            this.atk_bonus = this.grund_atk + this.rasse_atk + 2;
            this.def_bonus = this.grund_def + this.rasse_def +1;
            this.ausgeruestete_ruestung = new Item("Stoffrobe", "Ruestung", 10);
            this.ausgeruestete_waffe = new Item("Laute", "Waffe", 4);
            this.abilities = [
                { name: "Inspirierendes Lied", ap_kosten: 10, heilung: 10, bonus_schaden: 5 },
                { name: "Schlaflied", ap_kosten: 20, schlaf_dauer: 1 },
                { name: "Songversuch", ap_kosten: 15, verwirrt: 1 }
            ];
        } else if (klasseLower === "tueftler") {
            this.max_hp = this.grund_hp + this.rasse_hp + 8;
            this.atk_bonus = this.grund_atk + this.rasse_atk + 3;
            this.def_bonus = this.grund_def + this.rasse_def + 3;
            this.ausgeruestete_ruestung = new Item("Lederrüstung", "Ruestung", 12);
            this.ausgeruestete_waffe = new Item("Schraubenschlüssel", "Waffe", 5);
            this.abilities = [
                { name: "Sprengfalle", material_kosten: "Sprengfalle", schaden: 20 },
                { name: "Geschütz", material_kosten: "Geschütz", schaden: 10, leben: 10 },
                { name: "Netzkanone", material_kosten: "Netz", faengt: 1 }
            ];
        } else if (klasseLower === "alchemist") {
            this.max_hp = this.grund_hp + this.rasse_hp + 8;
            this.atk_bonus = this.grund_atk + this.rasse_atk + 2;
            this.def_bonus = this.grund_def + this.rasse_def + 3;
            this.ausgeruestete_ruestung = new Item("Lederschürze", "Ruestung", 11);
            this.ausgeruestete_waffe = new Item("Wurfbombe", "Waffe", 7);
            this.abilities = [
                { name: "Säureflasche", material_kosten: "Säuretrank", schaden: 20 },
                { name: "Giftflasche", material_kosten: "Gifttrank", schaden: 10 },
                { name: "Heilflasche", material_kosten: "Heiltrank", leben: 10 }
            ];
        } 
        else {
            this.max_hp = this.grund_hp + this.rasse_hp;
            this.atk_bonus = this.grund_atk + this.rasse_atk;
            this.def_bonus = this.grund_def + this.rasse_def;
        }
        
        // Korrektur des Typo und Initialisierung der AP
        this.grund_ap = 20; // Standard-Aktionspunkte
        this.max_ap = this.grund_ap + this.rasse_ap;
        this.hp = this.max_hp;
        this.ap = this.max_ap; // AP starten voll
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
            this.max_hp += 8;
            this.hp = this.max_hp;
            this.ap = this.max_ap; // AP regenerieren beim Level-Up
            this.atk_bonus += 1;
            console.log(`\n🌟 LEVEL UP für ${this.name}! Level ${this.level}!`);
        }
    }

    zeige_status() {
        console.log(`-> ${this.name} (${this.klasse}) | HP: ${this.hp}/${this.max_hp} | AP: ${this.ap}/${this.max_ap} | RK: ${this.ruestung_klasse()} | Tränke: ${this.traenke} | Gold: ${this.gold}`);
    }
}

module.exports = Spieler;