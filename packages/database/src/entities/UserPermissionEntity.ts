import { ZodProperty } from '@repo/typeorm-zod';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn, type Relation } from 'typeorm';
import { z } from 'zod';
import { AppEntity } from '../core/AppEntity';
import { UserEntity } from './UserEntity';
import { WorkspaceEntity } from './WorkspaceEntity';

@Entity()
export class UserPermissionEntity extends AppEntity {
    @PrimaryColumn('uuid')
    @ZodProperty(z.string().uuid())
    userId: string;

    @ManyToOne(
        () => UserEntity,
        (user) => user.permissions,
        {
            onDelete: 'CASCADE',
        }
    )
    @JoinColumn({ name: 'user_id' })
    user: Relation<UserEntity>;

    @PrimaryColumn('uuid')
    @ZodProperty(z.string().uuid())
    workspaceId: string;

    @ManyToOne(
        () => WorkspaceEntity,
        (workspace) => workspace.permissions,
        {
            onDelete: 'CASCADE',
        }
    )
    @JoinColumn({ name: 'workspace_id' })
    workspace: Relation<WorkspaceEntity>;

    @Column({ default: false })
    @ZodProperty(z.boolean().default(false))
    canWrite: boolean;
}
