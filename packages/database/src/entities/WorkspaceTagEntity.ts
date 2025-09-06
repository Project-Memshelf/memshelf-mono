import { ZodProperty } from '@repo/typeorm-zod';
import { CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryColumn, type Relation } from 'typeorm';
import { z } from 'zod';
import { TagEntity } from './TagEntity';
import { WorkspaceEntity } from './WorkspaceEntity';

@Entity()
export class WorkspaceTagEntity {
    @PrimaryColumn('uuid')
    @ZodProperty(z.string().uuid())
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
    @ZodProperty(z.string().uuid())
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
    @ZodProperty(z.date())
    createdAt: Date;
}
