import { DataSource, NotesDbService, NoteTagEntity } from '@repo/database';
import type { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { inject, singleton } from 'tsyringe';
import { BaseController } from './BaseController';

@singleton()
export class NoteTagsController extends BaseController {
    constructor(
        @inject(NotesDbService) private notesDbService: NotesDbService,
        @inject(DataSource) dataSource: DataSource
    ) {
        super(dataSource);
    }

    async getNoteTags(c: Context) {
        const user = this.getCurrentUser(c);
        const noteId = c.req.param('noteId');
        const note = await this.notesDbService.findById(noteId);
        if (!note) {
            throw new HTTPException(404, { message: 'Note not found' });
        }
        await this.validateWorkspaceAccess(user.id, note.workspaceId, 'read');

        const noteTagsRepo = this.dataSource.getRepository(NoteTagEntity);
        const noteTags = await noteTagsRepo.find({
            where: { noteId },
            relations: ['tag'],
        });
        const tags = noteTags.map((nt) => nt.tag);
        return c.json(this.successResponse(tags));
    }

    async addTagToNote(c: Context) {
        const user = this.getCurrentUser(c);
        const noteId = c.req.param('noteId');
        const note = await this.notesDbService.findById(noteId);
        if (!note) {
            throw new HTTPException(404, { message: 'Note not found' });
        }
        await this.validateWorkspaceAccess(user.id, note.workspaceId, 'write');

        const { tagId } = await c.req.json();
        if (!tagId) {
            throw new HTTPException(400, { message: 'tagId is required' });
        }

        const noteTagsRepo = this.dataSource.getRepository(NoteTagEntity);
        const noteTag = await noteTagsRepo.save({
            noteId,
            tagId,
        });

        return c.json(this.successResponse(noteTag), 201);
    }

    async removeTagFromNote(c: Context) {
        const user = this.getCurrentUser(c);
        const noteId = c.req.param('noteId');
        const tagId = c.req.param('tagId');

        if (!tagId) {
            throw new HTTPException(400, { message: 'tagId is required' });
        }

        const note = await this.notesDbService.findById(noteId);
        if (!note) {
            throw new HTTPException(404, { message: 'Note not found' });
        }
        await this.validateWorkspaceAccess(user.id, note.workspaceId, 'write');

        const noteTagsRepo = this.dataSource.getRepository(NoteTagEntity);
        await noteTagsRepo.delete({
            noteId,
            tagId,
        });

        return c.body(null, 204);
    }
}
