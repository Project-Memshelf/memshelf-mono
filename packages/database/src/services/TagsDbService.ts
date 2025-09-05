import { inject, singleton } from 'tsyringe';
import { DataSource } from 'typeorm';
import { BaseDbService } from '../core/BaseDbService';
import { TagEntity } from '../entities';

@singleton()
export class TagsDbService extends BaseDbService<TagEntity> {
    constructor(@inject(DataSource) dataSource: DataSource) {
        super(dataSource.getRepository(TagEntity));
    }
}
