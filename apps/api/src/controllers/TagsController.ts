import { DataSource, TagsDbService, validateCreateTag, WorkspaceTagEntity } from '@repo/database';
import type { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { inject, singleton } from 'tsyringe';
import { In } from 'typeorm';
import { BaseController } from './BaseController';

@singleton()
export class TagsController extends BaseController {
    constructor(
        @inject(TagsDbService) private tagsDbService: TagsDbService,
        @inject(DataSource) dataSource: DataSource
    ) {
        super(dataSource);
    }

    async list(c: Context) {
        const user = this.getCurrentUser(c);
        const { workspaceId } = c.req.query();

        if (workspaceId) {
            await this.validateWorkspaceAccess(user.id, workspaceId as string, 'read');
            const workspaceTagsRepo = this.dataSource.getRepository(WorkspaceTagEntity);
            const workspaceTags = await workspaceTagsRepo.find({
                where: { workspaceId: workspaceId as string },
            });
            const tagIds = workspaceTags.map((wt) => wt.tagId);
            if (tagIds.length === 0) {
                return c.json(this.successResponse([]));
            }
            const tags = await this.tagsDbService.findMany({ id: In(tagIds) });
            return c.json(this.successResponse(tags));
        }

        throw new HTTPException(400, { message: 'workspaceId is required' });
    }

    async getWorkspaceTags(c: Context) {
        const user = this.getCurrentUser(c);
        const workspaceId = c.req.param('workspaceId');
        await this.validateWorkspaceAccess(user.id, workspaceId, 'read');

        const workspaceTagsRepo = this.dataSource.getRepository(WorkspaceTagEntity);
        const workspaceTags = await workspaceTagsRepo.find({
            where: { workspaceId },
            relations: ['tag'],
        });
        const tags = workspaceTags.map((wt) => wt.tag);
        return c.json(this.successResponse(tags));
    }

    async addToWorkspace(c: Context) {
        const user = this.getCurrentUser(c);
        const workspaceId = c.req.param('workspaceId');
        await this.validateWorkspaceAccess(user.id, workspaceId, 'write');

        const body = await c.req.json();
        const createDto = validateCreateTag(body);

        const tag = await this.tagsDbService.save(createDto);

        const workspaceTagsRepo = this.dataSource.getRepository(WorkspaceTagEntity);
        await workspaceTagsRepo.save({
            workspaceId,
            tagId: tag.id,
        });

        return c.json(this.successResponse(tag), 201);
    }
}
