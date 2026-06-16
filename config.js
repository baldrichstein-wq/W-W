export const RASSEN_LISTE = ["Mensch", "Ork", "Zwerg", "Elf", "Goblin"];
export const KLASSEN_LISTE = ["Krieger", "Magier", "Schurke", "Heiler", "Verteidiger", "Tueftler", "Alchemist", "Barde"];

export const GAME_SETTINGS = {
    DIFFICULTY: "normal" // Mögliche Werte: "easy", "normal", "hard"
};

export const GAME_BALANCE = {
    XP: {
        START_NEEDED: 20,
        LEVEL_UP_MULTIPLIER: 1.5,
        SKILL_POINTS_PER_LEVEL: 5
    },
    STATS: {
        BASE_HP: 25,
        BASE_ATK: 3,
        BASE_DEF: 5,
        BASE_AP: 30,
        BASE_GOLD: 30,
        MAX_SP: 100
    },
    RACE_BONUSES: {
        "ork":    { hp: 12, atk: 3,  def: 7, ini: -1 },
        "goblin": { hp: 5,  atk: -1, def: 4, ini: 2  },
        "zwerg":  { hp: 15, atk: 2,  def: 5, ini: -2 },
        "mensch": { hp: 10, atk: 1,  def: 2, ini: 1  },
        "elf":    { hp: 7,  atk: 1,  def: 1, ini: 3  }
    },
    CLASS_BONUSES: {
        "krieger":     { hp: 10, atk: 3, def: 7 },
        "magier":      { hp: 3,  atk: 4, def: 1 },
        "schurke":     { hp: 2,  atk: 5, def: 0 },
        "verteidiger": { hp: 15, atk: 0, def: 5 },
        "heiler":      { hp: 4,  atk: 0, def: 1 },
        "barde":       { hp: 5,  atk: 2, def: 1 },
        "tueftler":    { hp: 8,  atk: 3, def: 3 },
        "alchemist":   { hp: 8,  atk: 2, def: 3 }
    },
    DIFFICULTY_SETTINGS: {
        "easy": {
            monster_hp_multiplier: 0.75,
            monster_atk_multiplier: 0.75,
            monster_rk_multiplier: 0.75,
            monster_xp_multiplier: 1.0,
            monster_gold_multiplier: 1.0
        },
        "normal": {
            monster_hp_multiplier: 1.0,
            monster_atk_multiplier: 1.0,
            monster_rk_multiplier: 1.0,
            monster_xp_multiplier: 1.0,
            monster_gold_multiplier: 1.0
        },
        "hard": {
            monster_hp_multiplier: 1.25,
            monster_atk_multiplier: 1.25,
            monster_rk_multiplier: 1.25,
            monster_xp_multiplier: 1.2,
            monster_gold_multiplier: 1.2
        }
    }
};

export const CLASS_INFO = {
    "Krieger": { icon: "⚔️", desc: "Nahkämpfer mit hohem physischem Schaden und solider Verteidigung." },
    "Magier": { icon: "🧙", desc: "Beherrscht mächtige Elementarzauber, hat aber wenig Lebenspunkte." },
    "Schurke": { icon: "🔪", desc: "Schnell und tödlich. Verlässt sich auf kritische Treffer und Gift." },
    "Heiler": { icon: "⚕️", desc: "Unterstützt die Gruppe mit Heilmagie und schützenden Segen." },
    "Verteidiger": { icon: "🛡️", desc: "Der Fels in der Brandung. Höchste Verteidigung und Schildfähigkeiten." },
    "Tueftler": { icon: "⚙️", desc: "Nutzt Materialien, um Gadgets und Geschütze zu bauen." },
    "Alchemist": { icon: "⚗️", desc: "Braut Tränke und Bomben für jede Situation." },
    "Barde": { icon: "🎶", desc: "Stärkt Verbündete durch Lieder und schwächt Feinde mit Musik." }
};

export const STARTING_ABILITIES = {
    "krieger": [
        { name: "Mächtiger Hieb", ap_kosten: 10, schaden: 15 },
        { name: "Seitlicher Hieb", ap_kosten: 15, schaden: 15 },
        { name: "Wutrauch", ap_kosten: 20, atk_buff: 5 },
        { name: "Durchbrechen", ap_kosten: 18, schaden: 20 },
        { name: "Zorn des Ares", sp_kosten: 100, schaden: 60, atk_buff: 15, isUltimate: true, element: "Physisch" }
    ],
    "magier": [
        { name: "Feuerball", ap_kosten: 20, schaden: 20 },
        { name: "Windschnitt", ap_kosten: 12, schaden: 10 },
        { name: "Erlösung", ap_kosten: 2, execute_threshold: 5 },
        { name: "Blitzschlag", ap_kosten: 15, schaden: 15 },
        { name: "Armageddon", sp_kosten: 100, schaden: 80, niederhalten: 2, isUltimate: true, element: "Feuer" }
    ],
    "schurke": [
        { name: "Meucheln", ap_kosten: 12, schaden: 18 },
        { name: "Hinterhalt", ap_kosten: 6, schaden: 5 },
        { name: "Tarnen", ap_kosten: 10, stealth_buff: 6 },
        { name: "Giftstoß", ap_kosten: 15, schaden: 10, verwirrt: 1 },
        { name: "Nachtschatten-Exitus", sp_kosten: 100, schaden: 70, verwirrt: 3, isUltimate: true, element: "Physisch" }
    ],
    "heiler": [
        { name: "Lichtsegen", ap_kosten: 15, heilung: 20 },
        { name: "Wiedergeburt", ap_kosten: 30, belebt: 1 },
        { name: "Lichtstrahl", ap_kosten: 5, schaden: 8 },
        { name: "Heiliges Licht", ap_kosten: 10, heilung: 15 },
        { name: "Göttliches Erwachen", sp_kosten: 100, heilung: 50, belebt: 1, atk_buff: 10, isUltimate: true, element: "Heilig" }
    ],
    "verteidiger": [
        { name: "Schildstoß", ap_kosten: 8, schaden: 10 },
        { name: "Verspotten", ap_kosten: 12, stealth_debuff: -5 },
        { name: "Blocken", ap_kosten: 14, schaden_reduktion: 5 },
        { name: "Stahlmauer", ap_kosten: 15, def_buff: 5 },
        { name: "Götterschild", sp_kosten: 100, def_buff: 15, heilung: 30, niederhalten: 1, isUltimate: true, element: "Heilig" }
    ],
    "barde": [
        { name: "Inspirierendes Lied", ap_kosten: 10, heilung: 10, bonus_schaden: 5 },
        { name: "Schlaflied", ap_kosten: 20, schlaf_dauer: 2 },
        { name: "Songversuch", ap_kosten: 15, verwirrt: 3 },
        { name: "Siegeslied", ap_kosten: 12, atk_buff: 3 },
        { name: "Symphonie des Endes", sp_kosten: 100, schaden: 40, atk_buff: 10, schlaf_dauer: 2, isUltimate: true, element: "Schall" }
    ],
    "tueftler": [
        { name: "Sprengfalle", ap_kosten: 0, material_kosten: "Sprengfalle", schaden: 20, level: 1 },
        { name: "Geschütz", ap_kosten: 0, material_kosten: "Geschütz", schaden: 10, leben: 10, level: 1 },
        { name: "Netzkanone", ap_kosten: 0, material_kosten: "Netz", niederhalten: 3, level: 1 },
        { name: "Dampfstoß", ap_kosten: 0, material_kosten: "Dampfpatrone", schaden: 12, level: 1 },
        { name: "Annihilator-Drohne", sp_kosten: 100, schaden: 90, niederhalten: 2, isUltimate: true, element: "Energie" }
    ],
    "alchemist": [
        { name: "Säureflasche", ap_kosten: 0, material_kosten: "Säuretrank", schaden: 20, level: 1 },
        { name: "Giftflasche", ap_kosten: 0, material_kosten: "Gifttrank", schaden: 10, level: 1 },
        { name: "Heilflasche", ap_kosten: 0, material_kosten: "Heiltrank", heilung: 15, level: 1 },
        { name: "Rauchbombe", ap_kosten: 0, material_kosten: "Rauchbombe", verwirrt: 1, level: 1 },
        { name: "Stein der Weisen", sp_kosten: 100, schaden: 50, heilung: 50, verwirrt: 2, isUltimate: true, element: "Säure" }
    ]
};

export const SPECIALIZATIONS = {
    "krieger": [
        { name: "Paladin", passiveBonus: { type: "damage_reduction_bonus", value: 2 } },
        { name: "Berserker", passiveBonus: { type: "atk_bonus", value: 3 } }
    ],
    "magier": [
        { name: "Erzmagier", passiveBonus: { type: "ap_regen_modifier", value: 2 } },
        { name: "Nekromant", passiveBonus: { type: "max_hp", value: 20 } }
    ],
    "schurke": [
        { name: "Assassine", passiveBonus: { type: "crit_threshold_modifier", value: -1 } },
        { name: "Schattenläufer", passiveBonus: { type: "grund_stealth", value: 5 } }
    ],
    "heiler": [
        { name: "Hohepriester", passiveBonus: { type: "healing_output_bonus", value: 0.15 } },
        { name: "Inquisitor", passiveBonus: { type: "atk_bonus", value: 2 } }
    ],
    "verteidiger": [
        { name: "Wächter", passiveBonus: { type: "damage_reduction_bonus", value: 3 } },
        { name: "Ritter", passiveBonus: { type: "def_bonus", value: 3 } }
    ],
    "barde": [
        { name: "Minnesänger", passiveBonus: { type: "buff_duration_bonus", value: 1 } },
        { name: "Troubadour", passiveBonus: { type: "debuff_duration_bonus", value: 1 } }
    ],
    "tueftler": [
        { name: "Maschinist", passiveBonus: { type: "material_efficiency_bonus", value: 0.10 } },
        { name: "Erfinder", passiveBonus: { type: "crafting_success_bonus", value: -2 } }
    ],
    "alchemist": [
        { name: "Meister-Alchemist", passiveBonus: { type: "healing_output_bonus", value: 0.20 } },
        { name: "Mutator", passiveBonus: { type: "hp_regen_bonus", value: 5 } }
    ]
};

export const SHOP_WAREN = {
    "1": { label: "Heiltrank kaufen (5 Gold)", cost: 5, type: "traenke", name: "Heiltrank", lore: "Ein sprudelndes rotes Elixier, das Wunden schließt." },
    "2": { label: "Stahlschwert kaufen (25 Gold, +8 Schaden)", cost: 25, type: "item", name: "Stahlschwert", kind: "Waffe", val: 8, lore: "Eine scharf geschliffene Klinge aus gutem Stahl." },
    "3": { label: "Schuppenpanzer kaufen (25 Gold, RK 15)", cost: 25, type: "item", name: "Schuppenpanzer", kind: "Ruestung", val: 15, lore: "Rüstung aus gehärteten Metallschuppen." },
    "4": { label: "Gifttrank kaufen (5 Gold)", cost: 5, type: "item", name: "Gifttrank", kind: "Trank", val: 0, lore: "Riecht verdächtig nach bitteren Mandeln." },
    "11": { label: "Fackel kaufen (5 Gold)", cost: 5, type: "item", name: "Fackel", kind: "Werkzeug", val: 0, lore: "Erhellt dunkle Orte, brennt aber nach 5 Räumen ab." },
    // Tueftler Materialien
    "5": { label: "Mechanischeteile (1 Gold)", cost: 1, type: "item", name: "Mechanischeteile", kind: "Material", val: 0, lore: "Zahnräder und Federn für Tüftler." },
    "6": { label: "Maschinenoel (1 Gold)", cost: 1, type: "item", name: "Maschinenoel", kind: "Material", val: 0, lore: "Schmiermittel für reibungslose Abläufe." },
    "7": { label: "Schrauben und Muttern (1 Gold)", cost: 1, type: "item", name: "Schrauben und Muttern", kind: "Material", val: 0, lore: "Hält alles zusammen." },
    // Alchemist Materialien
    "8": { label: "Bestienteile (1 Gold)", cost: 1, type: "item", name: "Bestienteile", kind: "Material", val: 0, lore: "Zähne, Klauen und Horn." },
    "9": { label: "Pflanzenteile (1 Gold)", cost: 1, type: "item", name: "Pflanzenteile", kind: "Material", val: 0, lore: "Getrocknete Kräuter und Wurzeln." },
    "10": { label: "Fläschchen (1 Gold)", cost: 1, type: "item", name: "Fläschchen", kind: "Material", val: 0, lore: "Ein leeres Gefäß für Alchemie." },
    // Waffen & Ausrüstung
    "13": { label: "Dolch (6 Gold, + 3 Schaden)", cost: 6, type: "item", name: "Dolch", kind: "Waffe", val: 3, lore: "Klein, aber tödlich in den richtigen Händen." },
    "14": { label: "Axt des Vernichters (20 Gold, + 8 Schaden)", cost: 20, type: "item", name: "Axt des Vernichters", kind: "Waffe", val: 8, lore: "Eine schwere Axt, die Rüstungen spaltet." },
    "15": { label: "Feuriger Zauberstab T2 (10 Gold, + 8 Schaden)", cost: 10, type: "item", name: "Feuerstab T2", kind: "Waffe", val: 8, lore: "Strahlt eine konstante Wärme aus." },
    "16": { label: "Blitzer (10 Gold, + 8 Schaden)", cost: 10, type: "item", name: "Blitzer", kind: "Waffe", val: 8, lore: "Ein Stab, der vor elektrischer Spannung knistert." },
    // Heiler & Barde
    "18": { label: "Stab der Großen Heilung (12 Gold)", cost: 12, type: "item", name: "Heilerstab", kind: "Waffe", val: 2, lore: "Ein heiliges Relikt zur Linderung von Schmerz." },
    "21": { label: "Drehleier (15 Gold)", cost: 15, type: "item", name: "Drehleier", kind: "Waffe", val: 0, lore: "Erzeugt einen melancholischen, stetigen Ton." },
    "22": { label: "Laute der Schönheit (15 Gold)", cost: 15, type: "item", name: "Laute", kind: "Waffe", val: 0, lore: "Klingt so süß, dass sogar Orks innehalten." },
    // Nahrung (Direkte HP Heilung)
    "26": { label: "Essensration (2 Gold, + 4 HP)", cost: 2, type: "hp", val: 4, name: "Essensration", lore: "Nahrhaft und haltbar." },
    "27": { label: "Wasser (2 Gold, + 2 HP)", cost: 2, type: "hp", val: 2, name: "Wasser", lore: "Klar und erfrischend." },
    "28": { label: "BockBier (3 Gold, + 3 HP)", cost: 3, type: "hp", val: 3, name: "BockBier", lore: "Dunkel und kräftig." },
    "29": { label: "Radler des Elfen (2 Gold, + 1 HP)", cost: 2, type: "hp", val: 1, name: "Radler", lore: "Eine leichte Erfrischung." },
    // Verfluchte Items (Stark, aber kosten HP beim Kauf)
    "35": { label: "Seelenfresser (15 Gold, -10 HP, +12 Schaden)", cost: 15, type: "item", name: "Seelenfresser", kind: "Waffe", val: 12, hpPenalty: 10, lore: "Die Klinge verlangt nach Blut. Dem deinen oder dem ihrer Feinde." },
    "36": { label: "Dämonenpanzer (20 Gold, -15 HP, RK 18)", cost: 20, type: "item", name: "Dämonenpanzer", kind: "Ruestung", val: 18, hpPenalty: 15, lore: "Ein Flüstern geht von diesem dunklen Metall aus." },
    "37": { label: "Höllenschild (15 Gold, -8 HP, RK +6)", cost: 15, type: "item", name: "Höllenschild", kind: "Schild", val: 6, hpPenalty: 8, lore: "Verteidigung hat ihren Preis." }
};

export const CRAFTING_REZEPTE = {
    "tueftler": [
        { name: "Sprengfalle", materialien: { "Mechanischeteile": 2, "Schrauben und Muttern": 1 } },
        { name: "Geschütz", materialien: { "Mechanischeteile": 2, "Maschinenoel": 1 } },
        { name: "Netz", materialien: { "Mechanischeteile": 1, "Schrauben und Muttern": 2 } },
        { name: "Dampfpatrone", materialien: { "Maschinenoel": 1, "Schrauben und Muttern": 1 } },
        { name: "Batterie", materialien: { "Mechanischeteile": 1, "Maschinenoel": 1 } },
        { name: "Reparatur-Kit", materialien: { "Mechanischeteile": 1, "Schrauben und Muttern": 1 } },
        { name: "Schockgranate", materialien: { "Mechanischeteile": 2, "Schrauben und Muttern": 1 } },
        { name: "Fokuslinse", materialien: { "Mechanischeteile": 1, "Maschinenoel": 1 } },
        { name: "Stasis-Modul", materialien: { "Mechanischeteile": 3, "Maschinenoel": 1 } },
        { name: "Mini-Rakete", materialien: { "Mechanischeteile": 2, "Schrauben und Muttern": 2 } },
        { name: "Schild-Generator", materialien: { "Mechanischeteile": 2, "Maschinenoel": 2 } },
        { name: "Taktgeber", materialien: { "Schrauben und Muttern": 3, "Maschinenoel": 1 } },
        { name: "Nanobots", materialien: { "Mechanischeteile": 2, "Maschinenoel": 3 } },
        { name: "Ionen-Kern", materialien: { "Mechanischeteile": 4, "Schrauben und Muttern": 2 } },
        { name: "Belagerungs-Kern", materialien: { "Mechanischeteile": 5, "Maschinenoel": 2 } },
        { name: "Drohnen-Steuerung", materialien: { "Mechanischeteile": 3, "Schrauben und Muttern": 3 } }
    ],
    "alchemist": [
        { name: "Säuretrank", materialien: { "Pflanzenteile": 2, "Fläschchen": 1 } },
        { name: "Gifttrank", materialien: { "Bestienteile": 2, "Fläschchen": 1 } },
        { name: "Heiltrank", materialien: { "Pflanzenteile": 1, "Fläschchen": 1 } },
        { name: "Rauchbombe", materialien: { "Pflanzenteile": 2, "Fläschchen": 1 } },
        { name: "Explosivtrank", materialien: { "Bestienteile": 2, "Fläschchen": 1 } },
        { name: "Stärkungstrank", materialien: { "Bestienteile": 1, "Pflanzenteile": 1, "Fläschchen": 1 } },
        { name: "Chaos-Viole", materialien: { "Bestienteile": 2, "Pflanzenteile": 1, "Fläschchen": 1 } },
        { name: "Frosttrank", materialien: { "Pflanzenteile": 3, "Fläschchen": 1 } },
        { name: "Wuttrank", materialien: { "Bestienteile": 3, "Fläschchen": 1 } },
        { name: "Regenerationspaste", materialien: { "Pflanzenteile": 4 } },
        { name: "Säureflasche", materialien: { "Bestienteile": 1, "Fläschchen": 1 } },
        { name: "Magnum Opus", materialien: { "Bestienteile": 3, "Pflanzenteile": 3, "Fläschchen": 2 } },
        { name: "Panacea", materialien: { "Pflanzenteile": 5, "Fläschchen": 2 } },
        { name: "Ultima-Bombe", materialien: { "Bestienteile": 5, "Fläschchen": 2 } }
    ]
};

export const BOSS_LOOT = [
    { name: "Ebenholz-Langbogen", kind: "Waffe", val: 12 },
    { name: "Vampirklinge", kind: "Waffe", val: 14 },
    { name: "Plattenpanzer der Ewigkeit", kind: "Ruestung", val: 22 },
    { name: "Aegis-Schild", kind: "Schild", val: 8 },
    { name: "Kristallstab", kind: "Waffe", val: 15 },
    { name: "Umhang des Schattens", kind: "Ruestung", val: 18 },
    { name: "Sturmbrecher-Hammer", kind: "Waffe", val: 13 },
    { name: "Sonnenschild", kind: "Schild", val: 7 },
    { name: "Gewand der Weisheit", kind: "Ruestung", val: 16 },
    { name: "Frostbiss-Dolch", kind: "Waffe", val: 11 },
    { name: "Himmelsstahl-Panzer", kind: "Ruestung", val: 20 },
    { name: "Drachenschuppen-Schild", kind: "Schild", val: 9 },
    { name: "Mondlicht-Stab", kind: "Waffe", val: 14 },
    { name: "Schattenweber-Gewand", kind: "Ruestung", val: 17 },
    { name: "Großschwert des Champions", kind: "Waffe", val: 16 },
    { name: "Turmschild der Ehre", kind: "Schild", val: 10 },
    { name: "Robe des Erzmagiers", kind: "Ruestung", val: 15 },
    { name: "Blutroter Speer", kind: "Waffe", val: 13 },
    { name: "Geisterwächter-Schild", kind: "Schild", val: 8 },
    { name: "Mithril-Kettenhemd", kind: "Ruestung", val: 19 },
    { name: "Donnerschlag-Axt", kind: "Waffe", val: 15 },
    { name: "Schild des ewigen Feuers", kind: "Schild", val: 9 },
    { name: "Runenverzierte Rüstung", kind: "Ruestung", val: 18 },
    { name: "Obsidian-Klinge", kind: "Waffe", val: 17 },
    { name: "Heiliger Prunkharnisch", kind: "Ruestung", val: 21 },
    { name: "Wyvernkrallen-Dolch", kind: "Waffe", val: 12 }
];

export const RARE_ARTIFACTS = [
    { name: "Ring des Phönix", cost: 80, kind: "Schmuck", val: 5, effekt: { typ: "ap_regen", wert: 4 }, lore: "Ein warmer Ring, der niemals abkühlt." },
    { name: "Schattenklinge", cost: 100, kind: "Waffe", val: 18, effekt: { typ: "lebensraub", wert: 0.15 }, lore: "Verschmilzt fast mit der Dunkelheit." },
    { name: "Gotteswall", cost: 120, kind: "Schild", val: 10, effekt: { typ: "ap_regen", wert: 3 }, lore: "Ein unbezwingbarer Schutz." },
    { name: "Amulett der Götter", cost: 150, kind: "Schmuck", val: 0, effekt: { typ: "ap_regen", wert: 10 }, lore: "Die pure Essenz göttlicher Kraft." }
];