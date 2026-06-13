export default class Monster {
    constructor(name, hp, atk, rk, xp, gold) {
        this.name = name;
        this.hp = hp;
        this.max_hp = hp;
        this.atk = atk;
        this.rk = rk;
        this.xp = xp;
        this.gold = gold;
    }
}