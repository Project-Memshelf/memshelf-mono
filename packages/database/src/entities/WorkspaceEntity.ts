import { Column, Entity, Index, OneToMany, type Relation } from 'typeorm';
import { AppEntity } from '../core/AppEntity';
import { NoteEntity } from './NoteEntity';
import { UserPermissionEntity } from './UserPermissionEntity';
import { WorkspaceTagEntity } from './WorkspaceTagEntity';

@Entity()
export class WorkspaceEntity extends AppEntity {
    @Column()
    @Index({ unique: true })
    name: string;

    @Column({ type: 'text', nullable: true })
    description: string | null;

    @OneToMany(
        () => NoteEntity,
        (note) => note.workspace
    )
    notes: Relation<NoteEntity[]>;

    @OneToMany(
        () => UserPermissionEntity,
        (permission) => permission.workspace
    )
    permissions: Relation<UserPermissionEntity[]>;

    @OneToMany(
        () => WorkspaceTagEntity,
        (tag) => tag.workspace
    )
    workspaceTags: Relation<WorkspaceTagEntity[]>;
}
