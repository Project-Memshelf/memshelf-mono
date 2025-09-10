import { inject, singleton } from 'tsyringe';
import { DataSource } from 'typeorm';
import { BaseDbService } from '../core/BaseDbService';
import { WorkspaceEntity } from '../entities';
import type { User, Workspace } from '../entity-schema-types';
import { UserPermissionsDbService } from './UserPermissionsDbService';

export type PermissionCheck = {
    hasPermission: boolean;
    canWrite: boolean;
};

@singleton()
export class WorkspacesDbService extends BaseDbService<WorkspaceEntity> {
    protected userPermissionsDbService: UserPermissionsDbService;

    constructor(
        @inject(DataSource) dataSource: DataSource,
        @inject(UserPermissionsDbService) userPermissionsDbService: UserPermissionsDbService
    ) {
        super(dataSource.getRepository(WorkspaceEntity));
        this.userPermissionsDbService = userPermissionsDbService;
    }

    async permissionCheck(workspace: Workspace, user: User): Promise<PermissionCheck> {
        const permissionCheck: PermissionCheck = {
            hasPermission: false,
            canWrite: false,
        };
        const userPermissions = await this.userPermissionsDbService.getUserPermissions(user.id);
        const workspacePermission = userPermissions.find((p) => p.workspaceId === workspace.id);
        if (workspacePermission) {
            permissionCheck.hasPermission = true;
            permissionCheck.canWrite = workspacePermission.canWrite;
        }
        return permissionCheck;
    }
}
