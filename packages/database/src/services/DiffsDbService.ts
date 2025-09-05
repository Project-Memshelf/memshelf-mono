import { inject, singleton } from 'tsyringe';
import { DataSource } from 'typeorm';
import { BaseDbService } from '../core/BaseDbService';
import { DiffEntity } from '../entities';

@singleton()
export class DiffsDbService extends BaseDbService<DiffEntity> {
    constructor(@inject(DataSource) dataSource: DataSource) {
        super(dataSource.getRepository(DiffEntity));
    }
}
