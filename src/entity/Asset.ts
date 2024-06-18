import { Entity, PrimaryColumn, Column, BeforeInsert, Unique } from "typeorm";
import "reflect-metadata";

@Entity()
export class AssetCreateRequest {
    
    @PrimaryColumn()
    id?: string;

    @Column('json')
    data?: string;

}

@Entity()
export class AssetCreate {
    
    @PrimaryColumn()
    id?: string;

    @Column('json')
    data?: string;

}

@Entity()
export class AssetIssueRequest {
    
    @PrimaryColumn()
    id?: string;

    @Column('json')
    data?: string;

}

@Entity()
export class AssetIssue {
    
    @PrimaryColumn()
    id?: string;

    @Column('json')
    data?: string;

}

@Entity()
export class AssetTransferRequest {
    
    @PrimaryColumn()
    id?: string;

    @Column('json')
    data?: string;

}

@Entity()
export class AssetTransfer {
    
    @PrimaryColumn()
    id?: string;

    @Column('json')
    data?: string;

}