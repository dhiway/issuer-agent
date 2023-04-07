import { Entity, PrimaryColumn, Column, BeforeInsert, Unique } from "typeorm";
import "reflect-metadata";
import { v4 as uuidv4 } from "uuid";

@Entity()
export class Regisrty {
  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = "r" + uuidv4();
    }
  }
  @PrimaryColumn()
  id?: string;

  @Column()
  registry?: any;

  @Column()
  authId?: string;

}
