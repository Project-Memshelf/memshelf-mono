import { ZodProperty } from '@repo/typeorm-zod';
import { CreateDateColumn, DeleteDateColumn, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { z } from 'zod';

export abstract class AppEntity {
    @PrimaryGeneratedColumn('uuid')
    @ZodProperty(z.string().uuid())
    id: string;

    @CreateDateColumn()
    @Index()
    @ZodProperty(z.date())
    createdAt: Date;

    @UpdateDateColumn()
    @ZodProperty(z.date())
    updatedAt: Date;

    @DeleteDateColumn()
    @ZodProperty(z.date().nullable())
    deletedAt: Date;
}
