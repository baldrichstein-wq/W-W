export default class Item {
    constructor(name, typ, wert, effekt = null, lore = null) {
        this.name = name;
        this.typ = typ; // "Waffe", "Ruestung", "Schild"
        this.wert = wert;
        this.effekt = effekt;
        this.lore = lore;
    }
}