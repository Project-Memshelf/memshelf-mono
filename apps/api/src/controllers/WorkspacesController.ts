import {
    DataSource,
    UserPermissionEntity,
    validateCreateWorkspace,
    validateUpdateWorkspace,
    WorkspaceEntity,
    WorkspacesDbService,
} from '@repo/database';
import type { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { inject, singleton } from 'tsyringe';
import { In } from 'typeorm';
import { BaseController } from './BaseController';

@singleton()
export class WorkspacesController extends BaseController {
    constructor(
        @inject(WorkspacesDbService) private workspacesDbService: WorkspacesDbService,
        @inject(DataSource) dataSource: DataSource
    ) {
        super(dataSource);
    }

    async list(c: Context) {
        const user = this.getCurrentUser(c);
        const permissions = await this.userPermissionsRepo.find({ where: { userId: user.id } });
        const workspaceIds = permissions.map((p: UserPermissionEntity) => p.workspaceId);

        if (workspaceIds.length === 0) {
            return c.json(
                this.paginatedResponse([], {
                    page: 1,
                    limit: 10,
                    total: 0,
                    totalPages: 0,
                    hasNext: false,
                    hasPrev: false,
                })
            );
        }

        const workspaces = await this.workspacesDbService.findMany({ id: In(workspaceIds) });

        return c.json(this.successResponse(workspaces));
    }

    async getById(c: Context) {
        const user = this.getCurrentUser(c);
        const workspaceId = c.req.param('id');
        await this.validateWorkspaceAccess(user.id, workspaceId, 'read');

        const workspace = await this.workspacesDbService.findById(workspaceId);
        if (!workspace) {
            throw new HTTPException(404, { message: 'Workspace not found' });
        }

        return c.json(this.successResponse(workspace));
    }

    async create(c: Context) {
        const user = this.getCurrentUser(c);
        const body = await c.req.json();
        const createDto = validateCreateWorkspace(body);

        const newWorkspace = await this.dataSource.transaction(async (em) => {
            const workspace = await em.save(em.create(WorkspaceEntity, createDto));
            const permission = em.create(UserPermissionEntity, {
                userId: user.id,
                workspaceId: workspace.id,
                canWrite: true,
            });
            await em.save(permission);
            return workspace;
        });

        return c.json(this.successResponse(newWorkspace), 201);
    }

    async update(c: Context) {
        const user = this.getCurrentUser(c);
        const workspaceId = c.req.param('id');
        await this.validateWorkspaceAccess(user.id, workspaceId, 'write');

        const body = await c.req.json();
        const updateDto = validateUpdateWorkspace(body);

        await this.workspacesDbService.update(workspaceId, updateDto);

        return c.json(this.successResponse({ id: workspaceId, ...updateDto }));
    }

    async delete(c: Context) {
        const user = this.getCurrentUser(c);
        const workspaceId = c.req.param('id');
        await this.validateWorkspaceAccess(user.id, workspaceId, 'write');

        await this.workspacesDbService.softDelete(workspaceId);

        return c.body(null, 204);
    }
}
