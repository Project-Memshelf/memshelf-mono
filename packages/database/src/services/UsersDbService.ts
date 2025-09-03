import { inject, singleton } from 'tsyringe';
import { DataSource } from 'typeorm';
import { BaseDbService } from '../core/BaseDbService';
import { UserEntity } from '../entities';

@singleton()
export class UsersDbService extends BaseDbService<UserEntity> {
    constructor(@inject(DataSource) dataSource: DataSource) {
        super(dataSource.getRepository(UserEntity));
    }
}
