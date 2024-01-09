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
      // Add "c" prefix to identify this ID as a credential ID
      this.id = 'c' + uuidv4();
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
  did?: string;

  @Column()
  credential?: string;

  @Column('simple-json', { nullable: true, default: null })
  details?: any;

  @CreateDateColumn({ name: 'created_at' })
  createdAt?: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt?: Date;
}
