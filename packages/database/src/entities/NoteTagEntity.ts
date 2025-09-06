import { ZodProperty } from '@repo/typeorm-zod';
import { CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryColumn, type Relation } from 'typeorm';
import { z } from 'zod';
import { NoteEntity } from './NoteEntity';
import { TagEntity } from './TagEntity';

@Entity()
export class NoteTagEntity {
    @PrimaryColumn('uuid')
    @ZodProperty(z.string().uuid())
    noteId: string;

    @ManyToOne(
        () => NoteEntity,
        (note) => note.noteTags,
        {
            onDelete: 'CASCADE',
        }
    )
    @JoinColumn({ name: 'note_id' })
    note: Relation<NoteEntity>;

    @PrimaryColumn('uuid')
    @ZodProperty(z.string().uuid())
    tagId: string;

    @ManyToOne(
        () => TagEntity,
        (tag) => tag.noteTags,
        { onDelete: 'CASCADE' }
    )
    @JoinColumn({ name: 'tag_id' })
    tag: Relation<TagEntity>;

    @CreateDateColumn()
    @ZodProperty(z.date())
    createdAt: Date;
}
