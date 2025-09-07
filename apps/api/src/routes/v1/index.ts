import { Hono } from 'hono';
import { container } from '../../config';
import {
    DiffsController,
    LinksController,
    NotesController,
    NoteTagsController,
    TagsController,
    WorkspacesController,
} from '../../controllers';
import { authMiddleware } from '../../middleware/auth';

const v1Routes = new Hono();

// Resolve controllers from container
const notesController = container.resolve(NotesController);
const workspacesController = container.resolve(WorkspacesController);
const tagsController = container.resolve(TagsController);
const noteTagsController = container.resolve(NoteTagsController);
const linksController = container.resolve(LinksController);
const diffsController = container.resolve(DiffsController);

// Apply auth middleware to all routes
v1Routes.use('*', authMiddleware);
// Notes routes
v1Routes.get('/notes', (c) => notesController.list(c));
v1Routes.get('/notes/:id', (c) => notesController.getById(c));
v1Routes.post('/notes', (c) => notesController.create(c));
v1Routes.put('/notes/:id', (c) => notesController.update(c));
v1Routes.delete('/notes/:id', (c) => notesController.delete(c));

// Workspaces routes
v1Routes.get('/workspaces', (c) => workspacesController.list(c));
v1Routes.get('/workspaces/:id', (c) => workspacesController.getById(c));
v1Routes.post('/workspaces', (c) => workspacesController.create(c));
v1Routes.put('/workspaces/:id', (c) => workspacesController.update(c));
v1Routes.delete('/workspaces/:id', (c) => workspacesController.delete(c));

// Tags routes
v1Routes.get('/tags', (c) => tagsController.list(c));
v1Routes.get('/workspaces/:workspaceId/tags', (c) => tagsController.getWorkspaceTags(c));
v1Routes.post('/workspaces/:workspaceId/tags', (c) => tagsController.addToWorkspace(c));

// NoteTags routes
v1Routes.get('/notes/:noteId/tags', (c) => noteTagsController.getNoteTags(c));
v1Routes.post('/notes/:noteId/tags', (c) => noteTagsController.addTagToNote(c));
v1Routes.delete('/notes/:noteId/tags/:tagId', (c) => noteTagsController.removeTagFromNote(c));

// Links routes
v1Routes.get('/notes/:noteId/links', (c) => linksController.getNoteLinks(c));
v1Routes.post('/links', (c) => linksController.create(c));
v1Routes.delete('/links/:linkId', (c) => linksController.delete(c));

// Diffs routes
v1Routes.get('/notes/:noteId/diffs', (c) => diffsController.getNoteDiffs(c));
v1Routes.post('/notes/:noteId/diffs', (c) => diffsController.applyDiff(c));

export { v1Routes };
