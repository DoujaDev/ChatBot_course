export class UserProfile {

    public name: string;
    public age: number;

    public companiesToReview = [];

    constructor(name?: string , age?: number){
        this.name = name;
        this.age = age;
    }
  
}