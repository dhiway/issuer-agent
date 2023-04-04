import {
    Entity,
    PrimaryColumn,
    Column,
    BeforeInsert,
    Unique,
} from 'typeorm';
import "reflect-metadata";
import { v4 as uuidv4 } from 'uuid';


@Entity()

export class Schema {
    @BeforeInsert()
    generateId() {
        if (!this.id) {
            this.id = 's' + uuidv4();
        }
    }
    @PrimaryColumn()
    id?: string;

    @Column({ default: false })
    registry?: boolean;

    @Column()
    name?: string;

    @Column()
    email?: string;
}
