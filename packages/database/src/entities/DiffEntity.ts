import { ZodProperty } from '@repo/typeorm-zod';
import { Column, Entity, Index, JoinColumn, ManyToOne, type Relation } from 'typeorm';
import { z } from 'zod';
import { AppEntity } from '../core/AppEntity';
import { NoteEntity } from './NoteEntity';

@Entity()
export class DiffEntity extends AppEntity {
    @Column('uuid')
    @Index()
    @ZodProperty(z.string().uuid())
    noteId: string;

    @ManyToOne(
        () => NoteEntity,
        (note) => note.diffs,
        { onDelete: 'CASCADE' }
    )
    @JoinColumn({ name: 'note_id' })
    note: Relation<NoteEntity>;

    @Column('int')
    @ZodProperty(z.number().int().min(0))
    position: number;

    @Column('int', { default: 0 })
    @ZodProperty(z.number().int().min(0).default(0))
    length: number;

    @Column({ type: 'text', default: '' })
    @ZodProperty(z.string().default(''))
    newText: string;

    @Column({ type: 'timestamp', nullable: true })
    @ZodProperty(z.date().nullable())
    appliedAt: Date | null;
}
