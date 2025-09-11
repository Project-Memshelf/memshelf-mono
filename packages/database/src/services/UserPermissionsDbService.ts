import { inject, singleton } from 'tsyringe';
import { DataSource } from 'typeorm';
import { BaseDbService } from '../core/BaseDbService';
import { UserPermissionEntity } from '../entities';

@singleton()
export class UserPermissionsDbService extends BaseDbService<UserPermissionEntity> {
    constructor(@inject(DataSource) dataSource: DataSource) {
        super(dataSource.getRepository(UserPermissionEntity));
    }

    getUserPermissions(userId: string) {
        return this.findMany({
            userId,
        });
    }
}
