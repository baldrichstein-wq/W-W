export default class Monster {
    constructor(name, hp, atk, rk, xp, gold, resistenzen = {}) {
        this.name = name;
        this.hp = hp;
        this.max_hp = hp;
        this.atk = atk;
        this.rk = rk;
        this.xp = xp;
        this.gold = gold;
        this.klasse = null;
        this.resistenzen = resistenzen; // { ElementTyp: Multiplikator }
    }
}