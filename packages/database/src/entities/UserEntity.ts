import { Column, Entity, Index } from 'typeorm';
import { AppEntity } from '../core/AppEntity';

@Entity()
export class UserEntity extends AppEntity {
    @Column()
    name: string;

    @Column()
    @Index({ unique: true })
    email: string;
}
