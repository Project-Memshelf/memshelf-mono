import { ZodProperty } from '@repo/typeorm-zod';
import { Column, Entity, JoinColumn, ManyToOne, type Relation, Unique } from 'typeorm';
import { z } from 'zod';
import { AppEntity } from '../core/AppEntity';
import { UserEntity } from './UserEntity';
import { WorkspaceEntity } from './WorkspaceEntity';

@Entity()
@Unique(['userId', 'workspaceId'])
export class UserPermissionEntity extends AppEntity {
    @ZodProperty(z.string().uuid())
    @Column({ type: 'uuid' })
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

    @ZodProperty(z.string().uuid())
    @Column({ type: 'uuid' })
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
