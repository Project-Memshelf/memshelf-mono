// Use the existing seed data from migrations
// These match the actual seed data in packages/database/src/migrations/

export const testUsers = {
    admin: {
        id: '00000000-0000-4000-8000-000000000001',
        name: 'Admin User',
        apiKey: 'dev_admin_key_0123456789abcdef0123456789abcdef01234567',
    },
    john: {
        id: '00000000-0000-4000-8000-000000000002',
        name: 'John Developer',
        apiKey: 'dev_john_key_fedcba9876543210fedcba9876543210fedcba98',
    },
    jane: {
        id: '00000000-0000-4000-8000-000000000003',
        name: 'Jane Designer',
        apiKey: 'dev_jane_key_abcdef0123456789abcdef0123456789abcdef01',
    },
};

export const testWorkspaces = {
    engineering: {
        id: '20000000-0000-4000-8000-000000000001',
        name: 'Engineering Team',
        description: 'Engineering team knowledge base',
    },
    design: {
        id: '20000000-0000-4000-8000-000000000002',
        name: 'Design System',
        description: 'Design system documentation and guidelines',
    },
    product: {
        id: '20000000-0000-4000-8000-000000000003',
        name: 'Product Requirements',
        description: 'Product requirements and specifications',
    },
};

// No need for seedTestData function - migrations handle this
// Test setup just needs to run migrations
