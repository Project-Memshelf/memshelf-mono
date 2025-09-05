import { inject, singleton } from 'tsyringe';
import { DataSource } from 'typeorm';
import { BaseDbService } from '../core/BaseDbService';
import { LinkEntity } from '../entities';

@singleton()
export class LinksDbService extends BaseDbService<LinkEntity> {
    constructor(@inject(DataSource) dataSource: DataSource) {
        super(dataSource.getRepository(LinkEntity));
    }
}
