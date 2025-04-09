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
export class Account {
  @BeforeInsert()
  generateId() {
    if (!this.id) {
      // Add "a" prefix to identify this ID as a credential ID
      this.id = 'a' + uuidv4();
    }
  }
  @PrimaryColumn()
  id?: string;

  @Column()
  name?: string;

  @Column()
  active?: boolean;

  @Column()
  token?: string;

  @Column()
  authorizationId?: string;

  @Column('jsonb', { nullable: true, default: null })
  mnemonic?: any;

  @Column('jsonb', { nullable: true, default: null })
  didDocument?: any;

  @CreateDateColumn({ name: 'created_at' })
  createdAt?: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt?: Date;
}
