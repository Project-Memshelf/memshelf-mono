import { Check, Column, Entity, Index, JoinColumn, ManyToOne, type Relation } from 'typeorm';
import { AppEntity } from '../core/AppEntity';
import { NoteEntity } from './NoteEntity';

@Entity()
@Index(['sourceNoteId', 'targetNoteId', 'position'], { unique: true })
@Check('"source_note_id" <> "target_note_id"')
export class LinkEntity extends AppEntity {
    @Column('uuid')
    @Index()
    sourceNoteId: string;

    @ManyToOne(
        () => NoteEntity,
        (note) => note.outgoingLinks,
        {
            onDelete: 'CASCADE',
        }
    )
    @JoinColumn({ name: 'source_note_id' })
    sourceNote: Relation<NoteEntity>;

    @Column('uuid')
    @Index()
    targetNoteId: string;

    @ManyToOne(
        () => NoteEntity,
        (note) => note.incomingLinks,
        {
            onDelete: 'CASCADE',
        }
    )
    @JoinColumn({ name: 'target_note_id' })
    targetNote: Relation<NoteEntity>;

    @Column({ length: 500 })
    linkText: string;

    @Column('int')
    position: number;
}
