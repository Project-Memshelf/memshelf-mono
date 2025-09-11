import { ZodProperty } from '@repo/typeorm-zod';
import { Column, Entity, Index, OneToMany, type Relation } from 'typeorm';
import { z } from 'zod';
import { AppEntity } from '../core/AppEntity';
import { NoteTagEntity } from './NoteTagEntity';
import { WorkspaceTagEntity } from './WorkspaceTagEntity';

@Entity()
export class TagEntity extends AppEntity {
    @Column({ type: 'varchar', length: 100 })
    @Index({ unique: true })
    @ZodProperty(
        z
            .string()
            .min(1)
            .max(100)
            .refine((val) => val.trim().length > 0, { message: 'Name cannot be empty or whitespace only' })
    )
    name: string;

    @Column({ type: 'varchar', length: 100 })
    @ZodProperty(
        z
            .string()
            .min(1)
            .max(100)
            .refine((val) => val.trim().length > 0, { message: 'Display name cannot be empty or whitespace only' })
    )
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
