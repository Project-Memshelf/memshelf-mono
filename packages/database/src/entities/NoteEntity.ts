import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, type Relation, VersionColumn } from 'typeorm';
import { AppEntity } from '../core/AppEntity';
import { DiffEntity } from './DiffEntity';
import { LinkEntity } from './LinkEntity';
import { NoteTagEntity } from './NoteTagEntity';
import { WorkspaceEntity } from './WorkspaceEntity';

@Entity()
export class NoteEntity extends AppEntity {
    @Column('uuid')
    @Index()
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

    @Column({ length: 500 })
    @Index()
    title: string;

    @Column({ type: 'longtext', default: '' })
    content: string;

    @VersionColumn()
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
