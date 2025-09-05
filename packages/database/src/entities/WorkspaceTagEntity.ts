import { CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryColumn, type Relation } from 'typeorm';
import { TagEntity } from './TagEntity';
import { WorkspaceEntity } from './WorkspaceEntity';

@Entity()
export class WorkspaceTagEntity {
    @PrimaryColumn('uuid')
    workspaceId: string;

    @ManyToOne(
        () => WorkspaceEntity,
        (workspace) => workspace.workspaceTags,
        {
            onDelete: 'CASCADE',
        }
    )
    @JoinColumn({ name: 'workspace_id' })
    workspace: Relation<WorkspaceEntity>;

    @PrimaryColumn('uuid')
    tagId: string;

    @ManyToOne(
        () => TagEntity,
        (tag) => tag.workspaceTags,
        {
            onDelete: 'CASCADE',
        }
    )
    @JoinColumn({ name: 'tag_id' })
    tag: Relation<TagEntity>;

    @CreateDateColumn()
    createdAt: Date;
}
