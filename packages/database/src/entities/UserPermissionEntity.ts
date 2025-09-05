import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryColumn, type Relation } from 'typeorm';
import { UserEntity } from './UserEntity';
import { WorkspaceEntity } from './WorkspaceEntity';

@Entity()
export class UserPermissionEntity {
    @PrimaryColumn('uuid')
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
    canWrite: boolean;

    @CreateDateColumn()
    createdAt: Date;
}
