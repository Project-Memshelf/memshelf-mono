import type { PaginatedResult, PaginationOptions } from '@repo/shared-core';
import type { DeepPartial, FindManyOptions, FindOptionsWhere, Repository } from 'typeorm';
import type { AppEntity } from './AppEntity';
import type { DbServiceInterface } from './DbServiceInterface';
import type { QueryDeepPartialEntity } from './types';

export class BaseDbService<T extends AppEntity> implements DbServiceInterface<T> {
    constructor(protected readonly repo: Repository<T>) {}

    public get repository(): Repository<T> {
        return this.repo;
    }

    async findById(id: number | string, options?: { relations?: string[] }): Promise<T | null> {
        return this.repo.findOne({
            where: { id } as FindOptionsWhere<T>,
            relations: options?.relations,
        });
    }

    async findByIdOrFail(id: number | string): Promise<T> {
        return this.repo.findOneByOrFail({ id } as FindOptionsWhere<T>);
    }

    async findMany(where: FindOptionsWhere<T> | FindOptionsWhere<T>[]): Promise<T[]> {
        return this.repo.find({ where });
    }

    async findOne(where: FindOptionsWhere<T>): Promise<T | null> {
        return this.repo.findOne({ where });
    }

    async exists(where: FindOptionsWhere<T>): Promise<boolean> {
        const count = await this.repo.count({ where, take: 1 });
        return count > 0;
    }

    async count(where?: FindOptionsWhere<T>): Promise<number> {
        return this.repo.count(where ? { where } : undefined);
    }

    async save(entity: DeepPartial<T>): Promise<T> {
        return this.repo.save(entity);
    }

    async update(id: number | string, data: QueryDeepPartialEntity<T>): Promise<void> {
        await this.repo.update(id, data);
    }

    async remove(id: number | string): Promise<void> {
        await this.repo.delete(id);
    }

    async upsert(entity: QueryDeepPartialEntity<T>, conflictPathsOrOptions: string[]): Promise<void> {
        await this.repo.upsert(entity, conflictPathsOrOptions);
    }

    async upsertAndReload(entity: QueryDeepPartialEntity<T>, conflictPathsOrOptions: string[]): Promise<T> {
        const result = await this.repo.upsert(entity, conflictPathsOrOptions);

        // TypeORM's upsert returns identifiers for affected rows
        // For new inserts, we can use the generated identifier
        // For updates, we need to use the original identifier from the entity
        const identifier = result.identifiers?.[0];
        const entityId = identifier?.id || (entity as Record<string, unknown>).id;

        if (!entityId) {
            throw new Error('Cannot reload entity after upsert: no identifier found in result or entity');
        }

        const reloadedEntity = await this.findById(entityId);
        if (!reloadedEntity) {
            throw new Error(`Entity with id ${entityId} not found after upsert operation`);
        }

        return reloadedEntity;
    }

    async softDelete(id: number | string): Promise<void> {
        await this.repo.softDelete(id);
    }

    async restore(id: number | string): Promise<void> {
        await this.repo.restore(id);
    }

    async findPaginated(options: PaginationOptions<T> = {}): Promise<PaginatedResult<T>> {
        const { page = 1, limit = 10, where, order = { id: 'DESC' }, relations } = options;

        const [items, total] = await this.repo.findAndCount({
            where,
            order,
            relations,
            take: limit,
            skip: (page - 1) * limit,
        } as FindManyOptions<T>);

        return {
            items,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
}
