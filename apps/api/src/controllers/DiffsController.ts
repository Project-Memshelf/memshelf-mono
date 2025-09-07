import { DataSource, DiffEntity, DiffsDbService, NoteEntity, NotesDbService, validateCreateDiff } from '@repo/database';
import type { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { inject, singleton } from 'tsyringe';
import { BaseController } from './BaseController';

@singleton()
export class DiffsController extends BaseController {
    constructor(
        @inject(DiffsDbService) private diffsDbService: DiffsDbService,
        @inject(NotesDbService) private notesDbService: NotesDbService,
        @inject(DataSource) dataSource: DataSource
    ) {
        super(dataSource);
    }

    async getNoteDiffs(c: Context) {
        const user = this.getCurrentUser(c);
        const noteId = c.req.param('noteId');
        const note = await this.notesDbService.findById(noteId);
        if (!note) {
            throw new HTTPException(404, { message: 'Note not found' });
        }
        await this.validateWorkspaceAccess(user.id, note.workspaceId, 'read');

        const { page, limit } = c.req.query();
        const result = await this.diffsDbService.findPaginated({
            page: page ? parseInt(page, 10) : 1,
            limit: limit ? parseInt(limit, 10) : 10,
            where: { noteId },
            order: { createdAt: 'DESC' },
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

    async applyDiff(c: Context) {
        const user = this.getCurrentUser(c);
        const noteId = c.req.param('noteId');
        const note = await this.notesDbService.findById(noteId);
        if (!note) {
            throw new HTTPException(404, { message: 'Note not found' });
        }
        await this.validateWorkspaceAccess(user.id, note.workspaceId, 'write');

        const body = await c.req.json();
        const createDto = validateCreateDiff(body);

        await this.dataSource.transaction(async (em) => {
            const diff = em.create(DiffEntity, { ...createDto, noteId });
            await em.save(diff);

            const oldContent = note.content;
            const newContent =
                oldContent.slice(0, diff.position) + diff.newText + oldContent.slice(diff.position + diff.length);

            await em.update(NoteEntity, noteId, {
                content: newContent,
                version: note.version + 1,
            });
        });

        return c.json(this.successResponse({ success: true }), 201);
    }
}
