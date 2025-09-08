import { ZodProperty } from '@repo/typeorm-zod';
import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, type Relation, VersionColumn } from 'typeorm';
import { z } from 'zod';
import { AppEntity } from '../core/AppEntity';
import { DiffEntity } from './DiffEntity';
import { LinkEntity } from './LinkEntity';
import { NoteTagEntity } from './NoteTagEntity';
import { WorkspaceEntity } from './WorkspaceEntity';

@Entity()
export class NoteEntity extends AppEntity {
    @Column('uuid')
    @Index()
    @ZodProperty(z.string().uuid())
    workspaceId: string;

    @ManyToOne(
        () => WorkspaceEntity,
        (workspace) => workspace.notes,
        {
            onDelete: 'CASCADE',
        }
    )
    @JoinColumn({ name: 'workspace_id' })
    workspace: Relation<WorkspaceEntity>;

    @Column({ type: 'varchar', length: 500 })
    @Index()
    @ZodProperty(z.string().min(1).max(500))
    title: string;

    @Column({ type: 'longtext', default: '' })
    @ZodProperty(z.string().default(''))
    content: string;

    @VersionColumn()
    @ZodProperty({
        schema: z.number().int().min(0),
        skip: ['create', 'update', 'patch'],
    })
    version: number;

    @OneToMany(
        () => DiffEntity,
        (diff) => diff.note
    )
    diffs: Relation<DiffEntity[]>;

    @OneToMany(
        () => NoteTagEntity,
        (noteTag) => noteTag.note
    )
    noteTags: Relation<NoteTagEntity[]>;

    @OneToMany(
        () => LinkEntity,
        (link) => link.sourceNote
    )
    outgoingLinks: Relation<LinkEntity[]>;

    @OneToMany(
        () => LinkEntity,
        (link) => link.targetNote
    )
    incomingLinks: Relation<LinkEntity[]>;
}
