import { mock } from 'bun:test';
import type { User, Workspace } from '@repo/database';
import type { Context, Next } from 'hono';

export interface TestContextOptions {
    currentUser?: User | null;
    workspace?: Workspace | null;
    requestId?: string;
    params?: Record<string, string>;
    variables?: Record<string, unknown>;
}

export interface TestContext extends Context {
    getLastResponse?(): { body: unknown; status: number } | null;
}

/**
 * Creates a mock Hono Context for testing middleware and controllers
 */
export function createTestContext(options: TestContextOptions = {}): TestContext {
    const {
        currentUser = null,
        workspace = null,
        requestId = 'test-request-id',
        params = {},
        variables = {},
    } = options;

    let response: { body: unknown; status: number } | null = null;

    const context: TestContext = {
        // Mock request object
        req: {
            param: mock((name: string) => params[name] || undefined),
            query: mock(() => ({})),
            header: mock(() => undefined),
            raw: new Request('http://localhost'),
        } as Context['req'],

        // Mock get method for retrieving context variables
        get: mock((key: string) => {
            switch (key) {
                case 'currentUser': {
                    return currentUser;
                }
                case 'workspace': {
                    return workspace;
                }
                case 'requestId': {
                    return requestId;
                }
                default: {
                    return variables[key];
                }
            }
        }),

        // Mock set method for setting context variables
        set: mock((key: string, value: unknown) => {
            // In a real test, you might want to track these assignments
            variables[key] = value;
        }),

        // Mock json method for responses (used in error handler tests)
        json: mock((body: unknown, status: number = 200) => {
            response = { body, status };
            return new Response(JSON.stringify(body), { status });
        }),

        // Mock other common context methods
        text: mock(() => Promise.resolve('')),
        html: mock(() => Promise.resolve('')),
        redirect: mock(() => new Response(null, { status: 302 })),
        header: mock(() => context),
        status: mock(() => context),

        // Helper method to get the last response (for error handler tests)
        getLastResponse: () => response,

        // Required Response properties
        res: {
            status: 200,
            headers: new Headers(),
        } as Context['res'],
    } as unknown as TestContext;

    return context;
}

/**
 * Creates a mock Next function for testing middleware
 */
export function createMockNext(): Next {
    return mock(() => Promise.resolve());
}

/**
 * Creates a mock Next function that throws an error
 */
export function createMockNextThatThrows(error: Error): Next {
    return mock(() => Promise.reject(error));
}

/**
 * Common test data for unit tests
 */
export const testUserData = {
    admin: {
        id: '00000000-0000-4000-8000-000000000001',
        name: 'Admin User',
        email: 'admin@example.com',
        apiKey: 'dev_admin_key_0123456789abcdef0123456789abcdef01234567',
        createdAt: new Date(),
        updatedAt: new Date(),
    },
    user: {
        id: '00000000-0000-4000-8000-000000000002',
        name: 'Test User',
        email: 'test@example.com',
        apiKey: 'dev_john_key_fedcba9876543210fedcba9876543210fedcba98',
        createdAt: new Date(),
        updatedAt: new Date(),
    },
};

export const testWorkspaceData = {
    workspace1: {
        id: '20000000-0000-4000-8000-000000000001',
        name: 'Test Workspace 1',
        description: 'First test workspace',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
    },
    workspace2: {
        id: '20000000-0000-4000-8000-000000000002',
        name: 'Test Workspace 2',
        description: 'Second test workspace',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
    },
};

/**
 * Helper factory functions for common test scenarios
 */
export const testContextFactory = {
    /**
     * Creates a context with an authenticated admin user
     */
    withAdminUser: (overrides: Partial<TestContextOptions> = {}) =>
        createTestContext({ currentUser: testUserData.admin, ...overrides }),

    /**
     * Creates a context with an authenticated regular user
     */
    withRegularUser: (overrides: Partial<TestContextOptions> = {}) =>
        createTestContext({ currentUser: testUserData.user, ...overrides }),

    /**
     * Creates a context with no authenticated user
     */
    withNoAuth: (overrides: Partial<TestContextOptions> = {}) => createTestContext({ currentUser: null, ...overrides }),

    /**
     * Creates a context with workspace parameters
     */
    withWorkspace: (workspaceId: string, overrides: Partial<TestContextOptions> = {}) =>
        createTestContext({
            params: { workspaceId },
            ...overrides,
        }),

    /**
     * Creates a context with workspace in context variables
     */
    withWorkspaceContext: (workspace: Workspace, overrides: Partial<TestContextOptions> = {}) =>
        createTestContext({
            workspace,
            ...overrides,
        }),
};
