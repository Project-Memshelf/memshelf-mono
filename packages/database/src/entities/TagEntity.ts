import { Column, Entity, Index, OneToMany, type Relation } from 'typeorm';
import { AppEntity } from '../core/AppEntity';
import { NoteTagEntity } from './NoteTagEntity';
import { WorkspaceTagEntity } from './WorkspaceTagEntity';

@Entity()
export class TagEntity extends AppEntity {
    @Column({ length: 100 })
    @Index({ unique: true })
    name: string;

    @Column({ length: 100 })
    displayName: string;

    @OneToMany(
        () => NoteTagEntity,
        (noteTag) => noteTag.tag
    )
    noteTags: Relation<NoteTagEntity[]>;

    @OneToMany(
        () => WorkspaceTagEntity,
        (workspaceTag) => workspaceTag.tag
    )
    workspaceTags: Relation<WorkspaceTagEntity[]>;
}
