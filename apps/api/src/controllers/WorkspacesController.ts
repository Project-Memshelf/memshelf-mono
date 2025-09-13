import { UserPermissionsDbService, WorkspaceEntity, WorkspacesDbService } from '@repo/database';
import type { PaginationOptions } from '@repo/shared-core';
import type { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { inject, singleton } from 'tsyringe';
import { In } from 'typeorm';
import {
    BaseController,
    type DeleteHookParams,
    type ListHookParams,
    type ReadHookParams,
    type ResultHookParams,
    type SuccessResponseSingle,
    type UpdateHookParams,
} from './BaseController';

@singleton()
export class WorkspacesController extends BaseController<WorkspaceEntity> {
    constructor(
        @inject(WorkspacesDbService) workspacesDbService: WorkspacesDbService,
        @inject(UserPermissionsDbService) userPermissionsDbService: UserPermissionsDbService
    ) {
        super(WorkspaceEntity, workspacesDbService, userPermissionsDbService);
    }

    protected override async beforeList({
        context,
        paginationOptions,
    }: ListHookParams<WorkspaceEntity>): Promise<PaginationOptions<WorkspaceEntity>> {
        const user = this.getCurrentUser(context);
        const permissions = await this.userPermissionsDbService.getUserPermissions(user.id);
        const validWorkspaceIds = permissions.map((ws) => ws.workspaceId);
        return {
            ...paginationOptions,
            where: {
                ...paginationOptions.where,
                id: In<string>(validWorkspaceIds),
            },
        };
    }

    protected async permissionCheck(context: Context, entity: WorkspaceEntity, requireWrite: boolean = false) {
        const user = this.getCurrentUser(context);
        const permissionCheck = await (this.dbService as WorkspacesDbService).permissionCheck(entity, user);

        if (!permissionCheck.hasPermission || (requireWrite && !permissionCheck.canWrite)) {
            throw new HTTPException(403, { message: 'Forbidden' });
        }

        return entity;
    }
    protected override async beforeRead({
        context,
        entity,
    }: ReadHookParams<WorkspaceEntity>): Promise<WorkspaceEntity> {
        return this.permissionCheck(context, entity);
    }

    protected override async beforeUpdate({ context, entity, data }: UpdateHookParams<WorkspaceEntity>) {
        await this.permissionCheck(context, entity, true);
        return data;
    }

    protected override async beforeDelete({
        context,
        entity,
    }: DeleteHookParams<WorkspaceEntity>): Promise<WorkspaceEntity> {
        return this.permissionCheck(context, entity, true);
    }

    protected override async afterCreate({
        context,
        entity,
    }: ResultHookParams<WorkspaceEntity>): Promise<SuccessResponseSingle<WorkspaceEntity>> {
        const user = this.getCurrentUser(context);
        await this.userPermissionsDbService.save({
            userId: user.id,
            workspaceId: entity.id,
            canWrite: true,
        });
        return this.successResponseSingle(entity);
    }
}
