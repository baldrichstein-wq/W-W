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
        
        // Standard-Boni
        this.grund_atk = 3;   // Für den Angriffswurf
        this.grund_def = 5;   // mindest Rüstungswert
        this.grund_hp = 25;   // Basis-Leben
        
        const rasseLower = rasse.toLowerCase().trim();
        const klasseLower = klasse.toLowerCase().trim();

        // Initialisierung der Boni, um NaN bei unbekannten Rassen zu verhindern
        this.rasse_hp = 0;
        this.rasse_atk = 0;
        this.rasse_def = 0;

        if (rasseLower === "ork") {
            this.rasse_hp = 12;
            this.rasse_atk = 3;
            this.rasse_def = 7;
        } else if (rasseLower === "goblin") {
            this.rasse_hp = 5;
            this.rasse_atk = -1;
            this.rasse_def = 4;
        } else if (rasseLower === "zwerg") {
            this.rasse_hp = 15;
            this.rasse_atk = 2;
            this.rasse_def = 5;
        } else if (rasseLower === "mensch") {
            this.rasse_hp = 10;
            this.rasse_atk = 1;
            this.rasse_def = 2;
        } else if (rasseLower === "elf") {
            this.rasse_hp = 7;
            this.rasse_atk = 1;
            this.rasse_def = 1;
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
        } else if (klasseLower === "magier") {
            this.max_hp = this.grund_hp + this.rasse_hp +3;
            this.atk_bonus = this.grund_atk + this.rasse_atk +4;
            this.def_bonus = this.grund_def + this.rasse_def +1;
            this.ausgeruestete_ruestung = new Item("Stoffrobe", "Ruestung", 10);
            this.ausgeruestete_waffe = new Item("Zauberstab", "Waffe", 8);
        } else if (klasseLower === "schurke") {
            this.max_hp = this.grund_hp + this.rasse_hp +2;
            this.atk_bonus = this.grund_atk +this.rasse_atk +5;
            this.def_bonus = this.grund_def + this.rasse_def +0;
            this.ausgeruestete_ruestung = new Item("Lederrüstung", "Ruestung", 12);
            this.ausgeruestete_waffe = new Item("Dolch", "Waffe", 4);
        } // ... (die anderen Klassen wurden hier der Kürze halber übernommen)
        else {
            this.max_hp = this.grund_hp + this.rasse_hp;
            this.atk_bonus = this.grund_atk + this.rasse_atk;
            this.def_bonus = this.grund_def + this.rasse_def;
        }
        this.hp = this.max_hp;
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
            this.atk_bonus += 1;
            console.log(`\n🌟 LEVEL UP für ${this.name}! Level ${this.level}!`);
        }
    }

    zeige_status() {
        console.log(`-> ${this.name} (${this.klasse}) | HP: ${this.hp}/${this.max_hp} | RK: ${this.ruestung_klasse()} | Tränke: ${this.traenke} | Gold: ${this.gold}`);
    }
}

module.exports = Spieler;