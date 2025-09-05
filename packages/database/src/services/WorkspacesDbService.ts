import { inject, singleton } from 'tsyringe';
import { DataSource } from 'typeorm';
import { BaseDbService } from '../core/BaseDbService';
import { WorkspaceEntity } from '../entities';

@singleton()
export class WorkspacesDbService extends BaseDbService<WorkspaceEntity> {
    constructor(@inject(DataSource) dataSource: DataSource) {
        super(dataSource.getRepository(WorkspaceEntity));
    }
}
