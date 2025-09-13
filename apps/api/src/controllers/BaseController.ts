import type { AppEntity, DbServiceInterface, DeepPartial, User, UserPermissionsDbService } from '@repo/database';
import type { PaginatedResult, PaginationOptions } from '@repo/shared-core';
import { createEntitySchemas, type EntitySchemas } from '@repo/typeorm-zod';
import type { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';
import type { AppEnv } from '../http-server';

export interface ListHookParams<Entity> {
    context: Context<AppEnv>;
    paginationOptions: PaginationOptions<Entity>;
}

export interface CreateHookParams<Entity> {
    context: Context<AppEnv>;
    data: DeepPartial<Entity>;
}

export interface UpdateHookParams<Entity> {
    context: Context<AppEnv>;
    entity: Entity;
    data: DeepPartial<Entity>;
}

export interface ReadHookParams<Entity> {
    context: Context<AppEnv>;
    entity: Entity;
}

export interface DeleteHookParams<Entity> {
    context: Context<AppEnv>;
    entity: Entity;
}

export interface ListResultHookParams<Entity> {
    context: Context<AppEnv>;
    paginatedData: PaginatedResult<Entity>;
}

export interface ResultHookParams<Entity> {
    context: Context<AppEnv>;
    entity: Entity;
}

type PaginationInfo<Entity> = Omit<PaginatedResult<Entity>, 'items'>;

export type SuccessResponseSingle<Entity> = {
    success: true;
    data: Entity;
};

export type SuccessResponsePaginated<Entity> = {
    success: true;
    data: Entity[];
    pagination: PaginationInfo<Entity>;
};

export abstract class BaseController<Entity extends AppEntity = AppEntity> {
    protected dbService: DbServiceInterface<Entity>;
    protected userPermissionsDbService: UserPermissionsDbService;
    protected schemas: EntitySchemas<Entity>;

    constructor(
        entity: new () => Entity,
        dbService: DbServiceInterface<Entity>,
        userPermissionsDbService: UserPermissionsDbService
    ) {
        this.dbService = dbService;
        this.userPermissionsDbService = userPermissionsDbService;
        this.schemas = createEntitySchemas(entity);
    }

    protected getCurrentUser(context: Context<AppEnv>): User {
        const user = context.get('currentUser');
        if (!user) {
            throw new HTTPException(403, { message: 'No user found' });
        }

        return user;
    }

    protected successResponseSingle(data: Entity): SuccessResponseSingle<Entity> {
        return {
            success: true,
            data,
        };
    }

    protected paginatedResponse(paginatedData: PaginatedResult<Entity>): SuccessResponsePaginated<Entity> {
        const { items, ...pagination } = paginatedData;
        return {
            success: true,
            data: items,
            pagination,
        };
    }

    protected getPaginationInfoFromContext(context: Context<AppEnv>): PaginationOptions<Entity> {
        const { page, limit, orderDir, orderField } = context.req.query();
        const _orderField = orderField ?? 'createdAt';
        const _orderDir = orderDir === 'ASC' ? 'ASC' : 'DESC';

        return {
            page: Number(page ?? 1),
            limit: Number(limit ?? 10),
            order: {
                [_orderField]: _orderDir,
            },
        };
    }

    protected async findByContextOrFail(context: Context<AppEnv>): Promise<{ id: string | number; entity: Entity }> {
        const { id } = context.req.param();
        if (!id) {
            throw new HTTPException(404);
        }
        const entity = await this.dbService.findById(id);
        if (!entity) {
            throw new HTTPException(404);
        }
        return { id, entity };
    }

    protected async beforeList(params: ListHookParams<Entity>): Promise<PaginationOptions<Entity>> {
        return params.paginationOptions;
    }

    protected async beforeCreate(params: CreateHookParams<Entity>): Promise<DeepPartial<Entity>> {
        return params.data;
    }

    protected async beforeUpdate(params: UpdateHookParams<Entity>): Promise<DeepPartial<Entity>> {
        return params.data;
    }

    protected async beforeRead(params: ReadHookParams<Entity>): Promise<Entity> {
        return params.entity;
    }

    protected async beforeDelete(params: DeleteHookParams<Entity>): Promise<Entity> {
        return params.entity;
    }

    protected async afterCreate(params: ResultHookParams<Entity>): Promise<SuccessResponseSingle<Entity>> {
        return this.successResponseSingle(params.entity);
    }

    protected async afterUpdate(params: ResultHookParams<Entity>): Promise<SuccessResponseSingle<Entity>> {
        return this.successResponseSingle(params.entity);
    }

    protected async afterRead(params: ResultHookParams<Entity>): Promise<SuccessResponseSingle<Entity>> {
        return this.successResponseSingle(params.entity);
    }

    protected async afterDelete(params: ResultHookParams<Entity>): Promise<SuccessResponseSingle<Entity>> {
        return this.successResponseSingle(params.entity);
    }

    protected async afterList(params: ListResultHookParams<Entity>): Promise<SuccessResponsePaginated<Entity>> {
        return this.paginatedResponse(params.paginatedData);
    }

    async list(context: Context<AppEnv>) {
        const paginationParams = this.getPaginationInfoFromContext(context);
        const paginationOptions = await this.beforeList({ context, paginationOptions: paginationParams });
        const paginatedData = await this.dbService.findPaginated(paginationOptions);
        return context.json(await this.afterList({ context, paginatedData }));
    }

    async create(context: Context<AppEnv>) {
        const body = await context.req.json();
        const parsed = this.schemas.create.parse(body) as DeepPartial<Entity>;
        const data = await this.beforeCreate({ context, data: parsed });
        const entity = await this.dbService.save(data);
        return context.json(await this.afterCreate({ context, entity }), 201);
    }

    async read(context: Context<AppEnv>) {
        let { entity } = await this.findByContextOrFail(context);
        entity = await this.beforeRead({ context, entity });
        return context.json(await this.afterRead({ context, entity }));
    }

    async delete(context: Context<AppEnv>) {
        const { id, entity } = await this.findByContextOrFail(context);
        await this.beforeDelete({ context, entity });
        await this.dbService.softDelete(id);
        return new Response(null, { status: 204 });
    }

    async update(context: Context<AppEnv>) {
        const { entity } = await this.findByContextOrFail(context);
        const body = await context.req.json();
        const parsed = this.schemas.update.parse(body) as DeepPartial<Entity>;
        const data = await this.beforeUpdate({ context, entity, data: parsed });
        const updated = await this.dbService.update(entity, data);
        return context.json(await this.afterUpdate({ context, entity: updated }));
    }
}
