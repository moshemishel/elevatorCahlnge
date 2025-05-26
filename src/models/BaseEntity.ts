export class BaseEntity {
    readonly #id: number;
    constructor(id:number){
        this.#id = id;
    }

    get id(){
        return this.#id
    }
}