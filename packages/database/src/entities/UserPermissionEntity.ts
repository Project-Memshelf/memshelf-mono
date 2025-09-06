import { ZodProperty } from '@repo/typeorm-zod';
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryColumn, type Relation } from 'typeorm';
import { z } from 'zod';
import { UserEntity } from './UserEntity';
import { WorkspaceEntity } from './WorkspaceEntity';

@Entity()
export class UserPermissionEntity {
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

    @CreateDateColumn()
    @ZodProperty(z.date())
    createdAt: Date;
}
