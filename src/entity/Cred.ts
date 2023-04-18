import {
    Entity,
    PrimaryColumn,
    Column,
    BeforeInsert,
    CreateDateColumn,
    UpdateDateColumn,
    Unique,
} from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

@Entity()
@Unique(['identifier', 'hash'])
export class Cred {
    @BeforeInsert()
    generateId() {
        if (!this.id) {
            // Add "u" prefix to identify this ID as a User ID
            this.id = 'u' + uuidv4();
        }
    }
    @PrimaryColumn()
    id?: string;

    @Column()
    active?: boolean;

    @Column()
    identifier?: string;

    @Column({ default: null, nullable: true })
    hash?: string;

    @Column()
    userId?: string;

    @Column()
    credential?: string;

    @Column('simple-json', { nullable: true, default: null })
    details?: {};

    @CreateDateColumn({ name: 'created_at' })
    createdAt?: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt?: Date;
}
