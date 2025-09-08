import { DataSource, initializeDatabase, UserEntity, UserPermissionEntity, WorkspaceEntity } from '@repo/database';
import { container } from '../../../src/config';
import { testUsers, testWorkspaces } from '../../fixtures';

const dataSource = container.resolve(DataSource);

export async function setupTestDatabase() {
    // Initialize database with migrations and seed data
    await initializeDatabase(dataSource);
}

export async function resetTestData() {
    // Clear ALL data we're going to recreate (in FK order)
    await dataSource.query('DELETE FROM diffs');
    await dataSource.query('DELETE FROM links');
    await dataSource.query('DELETE FROM note_tags');
    await dataSource.query('DELETE FROM notes');
    await dataSource.query('DELETE FROM user_permissions');
    await dataSource.query('DELETE FROM workspaces');
    await dataSource.query('DELETE FROM users');

    // Recreate fixture data
    await createFixtureData();
}

async function createFixtureData() {
    const userRepo = dataSource.getRepository(UserEntity);
    const workspaceRepo = dataSource.getRepository(WorkspaceEntity);
    const permissionRepo = dataSource.getRepository(UserPermissionEntity);

    // Create users from fixtures
    await userRepo.save(Object.values(testUsers));

    // Create workspaces from fixtures
    await workspaceRepo.save(Object.values(testWorkspaces));

    // Create user permissions (from seed migration logic)
    const permissions = [
        { userId: testUsers.admin.id, workspaceId: testWorkspaces.engineering.id, canWrite: true },
        { userId: testUsers.admin.id, workspaceId: testWorkspaces.design.id, canWrite: true },
        { userId: testUsers.admin.id, workspaceId: testWorkspaces.product.id, canWrite: true },
        { userId: testUsers.john.id, workspaceId: testWorkspaces.engineering.id, canWrite: true },
        { userId: testUsers.jane.id, workspaceId: testWorkspaces.design.id, canWrite: false },
    ];

    await permissionRepo.save(permissions);
}
