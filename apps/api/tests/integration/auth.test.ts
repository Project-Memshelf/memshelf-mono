import { beforeAll, beforeEach, describe, it } from 'bun:test';
import { honoApp } from '../../src/http-server';
import { resetTestData, setupTestDatabase } from './config/database';
import { authenticatedRequest, expectErrorResponse, expectSuccessResponse } from './helpers/api';

describe('API Authentication', () => {
    beforeAll(async () => {
        await setupTestDatabase();
    });

    beforeEach(async () => {
        await resetTestData();
    });

    describe('Bearer Token Validation', () => {
        it('should accept valid API key', async () => {
            const response = await authenticatedRequest('/api/v1/workspaces');

            await expectSuccessResponse(response, 200);
        });

        it('should reject request without Authorization header', async () => {
            const response = await honoApp.request('/api/v1/workspaces');

            await expectErrorResponse(response, 401);
        });

        it('should reject invalid API key format', async () => {
            const response = await honoApp.request('/api/v1/workspaces', {
                headers: { Authorization: 'Bearer invalid-key-format' },
            });

            await expectErrorResponse(response, 401);
        });

        it('should reject non-existent API key', async () => {
            const response = await honoApp.request('/api/v1/workspaces', {
                headers: { Authorization: 'Bearer dev_nonexistent_key_0000000000000000000000000000000000000000' },
            });

            await expectErrorResponse(response, 401);
        });

        it('should reject malformed Authorization header', async () => {
            const response = await honoApp.request('/api/v1/workspaces', {
                headers: { Authorization: 'InvalidFormat dev_admin_key_0123456789abcdef0123456789abcdef01234567' },
            });

            await expectErrorResponse(response, 400);
        });

        it('should work with different user types', async () => {
            // Test with john user
            const johnResponse = await authenticatedRequest('/api/v1/workspaces', {}, 'john');
            await expectSuccessResponse(johnResponse, 200);

            // Test with jane user
            const janeResponse = await authenticatedRequest('/api/v1/workspaces', {}, 'jane');
            await expectSuccessResponse(janeResponse, 200);
        });
    });
});
