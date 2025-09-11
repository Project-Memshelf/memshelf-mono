import {
    DataSource,
    DiffsDbService,
    initializeDatabase,
    LinksDbService,
    NotesDbService,
    TagsDbService,
    UserPermissionsDbService,
    UsersDbService,
    WorkspacesDbService,
} from '@repo/database';
import { container } from '../../../src/config';
import { testUsers, testWorkspaces } from '../../fixtures';

export async function setupTestDatabase() {
    const dataSource = container.resolve(DataSource);
    // Initialize database with migrations and seed data
    await initializeDatabase(dataSource);
}

export async function resetTestData() {
    const dataSource = container.resolve(DataSource);

    // Clear ALL data we're going to recreate (in FK order)
    const diffsService = container.resolve(DiffsDbService);
    const linksService = container.resolve(LinksDbService);
    const notesService = container.resolve(NotesDbService);
    const tagsService = container.resolve(TagsDbService);
    const userPermissionsService = container.resolve(UserPermissionsDbService);
    const workspacesService = container.resolve(WorkspacesDbService);
    const usersService = container.resolve(UsersDbService);

    // Use services for main entities
    await diffsService.clearTable();
    await linksService.clearTable();
    await notesService.clearTable();
    await tagsService.clearTable();
    await userPermissionsService.clearTable();
    await workspacesService.clearTable();
    await usersService.clearTable();

    // Use raw SQL for join tables (composite primary keys)
    await dataSource.query('DELETE FROM note_tags');
    await dataSource.query('DELETE FROM workspace_tags');

    // Recreate fixture data
    await createFixtureData();
}

async function createFixtureData() {
    const usersService = container.resolve(UsersDbService);
    const workspacesService = container.resolve(WorkspacesDbService);
    const userPermissionsService = container.resolve(UserPermissionsDbService);

    // Create users from fixtures
    await usersService.saveMany(Object.values(testUsers));

    // Create workspaces from fixtures
    await workspacesService.saveMany(Object.values(testWorkspaces));

    // Create user permissions (from seed migration logic)
    const permissions = [
        { userId: testUsers.admin.id, workspaceId: testWorkspaces.engineering.id, canWrite: true },
        { userId: testUsers.admin.id, workspaceId: testWorkspaces.design.id, canWrite: true },
        { userId: testUsers.admin.id, workspaceId: testWorkspaces.product.id, canWrite: true },
        { userId: testUsers.john.id, workspaceId: testWorkspaces.engineering.id, canWrite: true },
        { userId: testUsers.jane.id, workspaceId: testWorkspaces.design.id, canWrite: false },
    ];

    await userPermissionsService.saveMany(permissions);
}
