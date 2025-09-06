import { DataSource, LinksDbService, NotesDbService, validateCreateLink } from '@repo/database';
import type { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { inject, singleton } from 'tsyringe';
import { BaseController } from './BaseController';

@singleton()
export class LinksController extends BaseController {
    constructor(
        @inject(LinksDbService) private linksDbService: LinksDbService,
        @inject(NotesDbService) private notesDbService: NotesDbService,
        @inject(DataSource) dataSource: DataSource
    ) {
        super(dataSource);
    }

    async getNoteLinks(c: Context) {
        const user = this.getCurrentUser(c);
        const noteId = c.req.param('noteId');
        const note = await this.notesDbService.findById(noteId);
        if (!note) {
            throw new HTTPException(404, { message: 'Note not found' });
        }
        await this.validateWorkspaceAccess(user.id, note.workspaceId, 'read');

        const links = await this.linksDbService.findMany([{ sourceNoteId: noteId }, { targetNoteId: noteId }]);

        return c.json(this.successResponse(links));
    }

    async create(c: Context) {
        const user = this.getCurrentUser(c);
        const body = await c.req.json();
        const createDto = validateCreateLink(body);

        const sourceNote = await this.notesDbService.findById(createDto.sourceNoteId);
        if (!sourceNote) {
            throw new HTTPException(404, { message: 'Source note not found' });
        }
        await this.validateWorkspaceAccess(user.id, sourceNote.workspaceId, 'write');

        const targetNote = await this.notesDbService.findById(createDto.targetNoteId);
        if (!targetNote) {
            throw new HTTPException(404, { message: 'Target note not found' });
        }
        await this.validateWorkspaceAccess(user.id, targetNote.workspaceId, 'read');

        const link = await this.linksDbService.save(createDto);

        return c.json(this.successResponse(link), 201);
    }

    async delete(c: Context) {
        const user = this.getCurrentUser(c);
        const linkId = c.req.param('linkId');
        const link = await this.linksDbService.findById(linkId);
        if (!link) {
            throw new HTTPException(404, { message: 'Link not found' });
        }

        const sourceNote = await this.notesDbService.findById(link.sourceNoteId);
        if (!sourceNote) {
            throw new HTTPException(404, { message: 'Source note not found' });
        }
        await this.validateWorkspaceAccess(user.id, sourceNote.workspaceId, 'write');

        await this.linksDbService.remove(linkId);

        return c.body(null, 204);
    }
}
