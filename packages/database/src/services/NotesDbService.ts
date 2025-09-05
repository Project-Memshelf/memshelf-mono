import { inject, singleton } from 'tsyringe';
import { DataSource } from 'typeorm';
import { BaseDbService } from '../core/BaseDbService';
import { NoteEntity } from '../entities';

@singleton()
export class NotesDbService extends BaseDbService<NoteEntity> {
    constructor(@inject(DataSource) dataSource: DataSource) {
        super(dataSource.getRepository(NoteEntity));
    }
}
