import { Column, Entity, Index, JoinColumn, ManyToOne, type Relation } from 'typeorm';
import { AppEntity } from '../core/AppEntity';
import { NoteEntity } from './NoteEntity';

@Entity()
export class DiffEntity extends AppEntity {
    @Column('uuid')
    @Index()
    noteId: string;

    @ManyToOne(
        () => NoteEntity,
        (note) => note.diffs,
        { onDelete: 'CASCADE' }
    )
    @JoinColumn({ name: 'note_id' })
    note: Relation<NoteEntity>;

    @Column('int')
    position: number;

    @Column('int', { default: 0 })
    length: number;

    @Column({ type: 'text', default: '' })
    newText: string;

    @Column({ type: 'timestamp', nullable: true })
    appliedAt: Date | null;
}
