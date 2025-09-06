import { ZodProperty } from '@repo/typeorm-zod';
import { Column, Entity, Index, OneToMany, type Relation } from 'typeorm';
import { z } from 'zod';
import { AppEntity } from '../core/AppEntity';
import { NoteEntity } from './NoteEntity';
import { UserPermissionEntity } from './UserPermissionEntity';
import { WorkspaceTagEntity } from './WorkspaceTagEntity';

@Entity()
export class WorkspaceEntity extends AppEntity {
    @Column()
    @Index({ unique: true })
    @ZodProperty(z.string().min(1).max(255))
    name: string;

    @Column({ type: 'text', nullable: true })
    @ZodProperty(z.string().max(1000).nullable())
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
