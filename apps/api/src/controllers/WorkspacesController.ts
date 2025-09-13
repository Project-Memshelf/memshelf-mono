import { UserPermissionsDbService, WorkspaceEntity, WorkspacesDbService } from '@repo/database';
import type { PaginationOptions } from '@repo/shared-core';
import { inject, singleton } from 'tsyringe';
import { In } from 'typeorm';
import {
    BaseController,
    type ListHookParams,
    type ResultHookParams,
    type SuccessResponseSingle,
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
