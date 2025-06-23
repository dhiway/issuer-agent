import {
  Entity,
  PrimaryColumn,
  Column,
  BeforeInsert,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import 'reflect-metadata';
import { v4 as uuidv4 } from 'uuid';

@Entity()
export class Registry {
  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = 'r' + uuidv4();
    }
  }
  @PrimaryColumn()
  id?: string;

  @Column()
  registryId?: string;

  @Column('simple-json', { nullable: true, default: null })
  schema?: any;

  @Column()
  address?: string;

  @Column()
  profileId?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt?: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt?: Date;
}
