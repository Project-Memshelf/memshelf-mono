import { ZodProperty } from '@repo/typeorm-zod';
import { Column, Entity, Index, OneToMany, type Relation } from 'typeorm';
import { z } from 'zod';
import { AppEntity } from '../core/AppEntity';
import { UserPermissionEntity } from './UserPermissionEntity';

@Entity()
export class UserEntity extends AppEntity {
    @Column()
    @ZodProperty(z.string().min(1).max(255))
    name: string;

    @Column()
    @Index({ unique: true })
    @ZodProperty(z.string().min(32).max(64))
    apiKey: string;

    @OneToMany(
        () => UserPermissionEntity,
        (permission) => permission.user
    )
    permissions: Relation<UserPermissionEntity[]>;
}
