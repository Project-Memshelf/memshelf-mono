import { DataSource, NotesDbService, validateCreateNote, validateUpdateNote } from '@repo/database';
import type { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { inject, singleton } from 'tsyringe';
import { BaseController } from './BaseController';

@singleton()
export class NotesController extends BaseController {
    constructor(
        @inject(NotesDbService) private notesDbService: NotesDbService,
        @inject(DataSource) dataSource: DataSource
    ) {
        super(dataSource);
    }

    async list(c: Context) {
        const user = this.getCurrentUser(c);
        const { page, limit, workspaceId } = c.req.query();

        if (!workspaceId) {
            throw new HTTPException(400, { message: 'workspaceId is required' });
        }
        await this.validateWorkspaceAccess(user.id, workspaceId, 'read');

        const result = await this.notesDbService.findPaginated({
            page: page ? parseInt(page, 10) : 1,
            limit: limit ? parseInt(limit, 10) : 10,
            where: { workspaceId },
        });

        return c.json(
            this.paginatedResponse(result.items, {
                page: result.page,
                limit: result.limit,
                total: result.total,
                totalPages: result.totalPages,
                hasNext: result.page < result.totalPages,
                hasPrev: result.page > 1,
            })
        );
    }

    async getById(c: Context) {
        const user = this.getCurrentUser(c);
        const noteId = c.req.param('id');
        const note = await this.notesDbService.findById(noteId);

        if (!note) {
            throw new HTTPException(404, { message: 'Note not found' });
        }
        await this.validateWorkspaceAccess(user.id, note.workspaceId, 'read');

        return c.json(this.successResponse(note));
    }

    async create(c: Context) {
        const user = this.getCurrentUser(c);
        const body = await c.req.json();
        const createDto = validateCreateNote(body);

        await this.validateWorkspaceAccess(user.id, createDto.workspaceId, 'write');

        const newNote = await this.notesDbService.save({
            ...createDto,
            version: 1,
        });

        return c.json(this.successResponse(newNote), 201);
    }

    async update(c: Context) {
        const user = this.getCurrentUser(c);
        const noteId = c.req.param('id');
        const body = await c.req.json();
        const updateDto = validateUpdateNote(body);

        const note = await this.notesDbService.findById(noteId);
        if (!note) {
            throw new HTTPException(404, { message: 'Note not found' });
        }
        await this.validateWorkspaceAccess(user.id, note.workspaceId, 'write');

        const version = updateDto.content && updateDto.content !== note.content ? note.version + 1 : note.version;

        await this.notesDbService.update(noteId, { ...updateDto, version });

        return c.json(this.successResponse({ id: noteId, ...updateDto, version }));
    }

    async delete(c: Context) {
        const user = this.getCurrentUser(c);
        const noteId = c.req.param('id');

        const note = await this.notesDbService.findById(noteId);
        if (!note) {
            throw new HTTPException(404, { message: 'Note not found' });
        }
        await this.validateWorkspaceAccess(user.id, note.workspaceId, 'write');

        await this.notesDbService.softDelete(noteId);

        return c.body(null, 204);
    }
}
