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
export class Message {
    @BeforeInsert()
    generateId() {
        if (!this.id) {
            // Add "m" prefix to identify this ID as a Msg ID
            this.id = 'm' + uuidv4();
        }
    }
    @PrimaryColumn()
    id?: string;

    @Column()
    unread?: boolean;

    @Column()
    did?: string;

    @Column()
    fromDid?: string;

    @Column('simple-json', { nullable: true, default: null })
    details?: any;

    @CreateDateColumn({ name: 'created_at' })
    createdAt?: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt?: Date;
}
