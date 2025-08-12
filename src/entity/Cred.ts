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
@Unique(['credId'])
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
  credId?: string;

  @Column()
  address?: string;

  @Column()
  profileId?: string;

  @Column()
  registryId?: string;

  @Column({ default: true })
  active?: boolean;

  @Column()
  issuerDid?: string;

  @Column()
  holderDid?: string;

  @Column('simple-json', { nullable: true, default: null })
  vc?: any;

  @CreateDateColumn({ name: 'created_at' })
  createdAt?: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt?: Date;

  @Column({ nullable: true })
  token?: string;
}
