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
        this.gund_ap = 0;
        this.grund_mp = 0;
        this.grund_sp = 0; // Stamina Points (nicht mehr verwendet, aber hier zur Vollständigkeit)
        this.grund_ini = 0;
        this.grund_atk_gesch = 0;
        this.grund_cha = 0;
        this.grund_int = 0;
        this.gund_stelf = 0;
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
        this.rasse_stelf = 0;
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
            this.rasse_stelf = 0;
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
            this.rasse_stelf = 0;
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
            this.rasse_stelf = 0;
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
            this.rasse_stelf = 0;
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
            this.rasse_stelf = 0;
            this.rasse_will = 0;
        }

        this.ausgeruestete_waffe = null;
        this.ausgeruestete_ruestung = null;
        this.ausgeruestete_schild = null;   // Standardmäßig kein Schild ausgerüstet

        
        if (klasseLower === "krieger") {
            this.max_hp = this.grund_hp + this.rasse_hp +10;
            this.atk_bonus = this.grund_atk + this.rasse_atk +3;
            this.def_bonus = this.grund_def + this.rasse_def +7;
            this.ausgeruestete_ruestung = new Item("Kettenhemd", "Ruestung", 14);
            this.ausgeruestete_waffe = new Item("Eisenschwert", "Waffe", 6);
            this.ausgeruestete_schild = new Item("Holzschild", "Schild", 2);
            this.ability = { name: "Mächtiger Hieb", ap_kosten: 10, schaden: 15 }; //trifft 1 gegner
            this.ability = { name: "Seitlicher Hieb", ap_kosten: 15, schaden: 15 }; //trift mehrere gegner
            this.ability = { name: "Wutrauch", ap_kosten: 20, schaden: +5 }; // erhöt atk des anwenders
        } else if (klasseLower === "magier") {
            this.max_hp = this.grund_hp + this.rasse_hp +3;
            this.atk_bonus = this.grund_atk + this.rasse_atk +4;
            this.def_bonus = this.grund_def + this.rasse_def +1;
            this.ausgeruestete_ruestung = new Item("Stoffrobe", "Ruestung", 10);
            this.ausgeruestete_waffe = new Item("Zauberstab", "Waffe", 8);
            this.ability = { name: "Feuerball", ap_kosten: 20, schaden: 20 }; // 1.wirkungszeit,macht feuerschaden
            this.ability = { name: "Windschnitt", ap_kosten: 12, schaden: 10 }; // 1.wirkungszeit,macht windschaden
            this.ability = { name: "Erlösung", ap_kosten: 2, schaden: 0 }; // 0.wirkungszeit,töte gegener wenn gegner hpkleiner5 ist
        } else if (klasseLower === "schurke") {
            this.max_hp = this.grund_hp + this.rasse_hp + 2;
            this.atk_bonus = this.grund_atk +this.rasse_atk +5;
            this.def_bonus = this.grund_def + this.rasse_def +0;
            this.ausgeruestete_ruestung = new Item("Lederrüstung", "Ruestung", 12);
            this.ausgeruestete_waffe = new Item("Dolch", "Waffe", 4);
            this.ability = { name: "Meucheln", ap_kosten: 12, schaden: 18 };// doppelter scheden wenn bei anwendung nicht gesehen
            this.ability = { name: "Hinterhalt", ap_kosten: 6, schaden: 5 }; // doppelter scheden wenn bei anwendung nicht gesehen
            this.ability = { name: "Tarnen", ap_kosten: 10, stelf: +6 }; // anwenter wirt nicht gesehen
        } else if (klasseLower === "verteitiger") {
            this.max_hp = this.grund_hp + this.rasse_hp +3;
            this.atk_bonus = this.grund_atk + this.rasse_atk +4;
            this.def_bonus = this.grund_def + this.rasse_def +1;
            this.ausgeruestete_ruestung = new Item("Stoffrobe", "Ruestung", 10);
            this.ausgeruestete_waffe = new Item("Zauberstab", "Waffe", 8);
            this.ability = { name: "Schildstoß", ap_kosten: 8, schaden: 10 }; // schaden basierent auf verteitiger def
            this.ability = { name: "Verspotten" ap_kosten: 12, stelf: -5}, // gegener briorisiert anwender
            this.ability = { name: "Blokenen" ap_kosten: 14, erlidener_schaden: -5}; // anwender bekommt weniger schaden
        } else if (klasseLower === "heiler") {
            this.max_hp = this.grund_hp + this.rasse_hp +3;
            this.atk_bonus = this.grund_atk + this.rasse_atk +4;
            this.def_bonus = this.grund_def + this.rasse_def +1;
            this.ausgeruestete_ruestung = new Item("Stoffrobe", "Ruestung", 10);
            this.ausgeruestete_waffe = new Item("Zauberstab", "Waffe", 8);
            this.ability = { name: "Lichtsegen", ap_kosten: 15, heilung: 20 }; //anwender heilt sich oder ein ziel
            this.ability = { name: "Wiedergeburt", ap_kosten: 30, belebt: 1 }; //anwender blebt ziel wieder
            this.ability = { name: "Lichtstrahl", ap_kosten: 5, schaden: 8}; //gegen untote dobelter schaden
        } else if (klasseLower === "barde") {
            this.max_hp = this.grund_hp + this.rasse_hp +3;
            this.atk_bonus = this.grund_atk + this.rasse_atk +4;
            this.def_bonus = this.grund_def + this.rasse_def +1;
            this.ausgeruestete_ruestung = new Item("Stoffrobe", "Ruestung", 10);
            this.ausgeruestete_waffe = new Item("Zauberstab", "Waffe", 8);
            this.ability = { name: "Inspirierendes Lied", ap_kosten: 10, heilung: 10, schaden: 5 };
            this.ability = { name: "Schlaflied", ap_kosten: 20, schlafen: 1 }; //anwender läst ein ziel eine runde lang einschlaffen
            this.ability = { name: "Songversuch", ap_kosten 15, verwirt :1 }; //anwender verwirt ein ziel eine runde lang,wenn alkohol intus +1 zeit und ziel
        } else if (klasseLower === "tueftler") {
            this.max_hp = this.grund_hp + this.rasse_hp +3;
            this.atk_bonus = this.grund_atk + this.rasse_atk +4;
            this.def_bonus = this.grund_def + this.rasse_def +1;
            this.ausgeruestete_ruestung = new Item("Stoffrobe", "Ruestung", 10);
            this.ausgeruestete_waffe = new Item("Zauberstab", "Waffe", 8);
            this.ability = { name: "Sprengfalle", material_koster: 1 sprengfalle, schaden: 20 }; //wenn sprengfalle in tasche nutzt sie,sonst baut 1.runde
            this.ability = { name: "Geschütz", material_kosten: 1 geschütz, schaden: 10, leben 10 }; //wenn geschütz in tsche nutzt es,sonst baut 1.runde
            this.ability = { name: "Netzkanone", material_kosten: 1 netz, fängt: 1 }; // wenn netz in tasche nutze es,sonst baut 1.runde
        } else if (klasseLower === "alchemist") {
            this.max_hp = this.grund_hp + this.rasse_hp +3;
            this.atk_bonus = this.grund_atk + this.rasse_atk +4;
            this.def_bonus = this.grund_def + this.rasse_def +1;
            this.ausgeruestete_ruestung = new Item("Stoffrobe", "Ruestung", 10);
            this.ausgeruestete_waffe = new Item("Zauberstab", "Waffe", 8);
            this.ability = { name: "Säureflasche", material_kosten: 1 säuretrank, schaden: 20 }; //nur nutzbar wenn säuretrank in tasche,schaden über zeit
            this.ability = { name: "Giftflasche", material_kosten: 1 gifttrank, schaden: 10}; //nur nutzbar wenn gifttrank in tasche,schaden über zeit
            this.ability = { name: "Heilflasche" material_kosten: 1 heiltrank, leben: 10}: //nur nutzbar wenn  heiltrank in tasche,heit ziel
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