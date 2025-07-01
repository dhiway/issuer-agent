import {
  Entity,
  PrimaryColumn,
  Column,
  BeforeInsert,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';
import 'reflect-metadata';
import { v4 as uuidv4 } from 'uuid';

@Entity()
@Unique(['profileId', 'mnemonic'])
export class Profile {
  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = 'p' + uuidv4();
    }
  }
  @PrimaryColumn()
  id?: string;

  @Column()
  profileId?: string;

  @Column()
  address?: string;

  @Column()
  publicKey?: string;

  @Column()
  mnemonic?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt?: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt?: Date;
}
