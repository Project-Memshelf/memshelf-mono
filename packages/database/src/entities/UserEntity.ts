import { Column, Entity, Index, OneToMany, type Relation } from 'typeorm';
import { AppEntity } from '../core/AppEntity';
import { UserPermissionEntity } from './UserPermissionEntity';

@Entity()
export class UserEntity extends AppEntity {
    @Column()
    name: string;

    @Column()
    @Index({ unique: true })
    apiKey: string;

    @OneToMany(
        () => UserPermissionEntity,
        (permission) => permission.user
    )
    permissions: Relation<UserPermissionEntity[]>;
}
