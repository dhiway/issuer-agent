import { Entity, PrimaryColumn, Column, BeforeInsert, Unique } from "typeorm";
import "reflect-metadata";
import { v4 as uuidv4 } from "uuid";

@Entity()
export class Schema {
  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = "s" + uuidv4();
    }
  }
  @PrimaryColumn()
  id?: string;

  @Column({ default: false })
  registry?: boolean;

  @Column()
  title?: string;

  @Column()
  description?: string;

  @Column()
  schema?: any;

  @Column({ default: null, nullable: true })
  properties?: string;
}
