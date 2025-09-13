import { describe, expect, it } from 'bun:test';
import { UsersDbService } from '@repo/database';
import { createRepoConfig } from '@repo/shared-core';
import { container } from '../src/config';
import { honoApp } from '../src/http-server';
import { resetTestData, setupTestDatabase } from './integration/config/database';

describe('testing init', () => {
    describe('env vars', () => {
        it('loads the proper env', async () => {
            const config = createRepoConfig({
                logger: {
                    name: 'ApiTest',
                },
            });

            expect(config.nodeEnv.isTesting).toBeTrue();
            expect(config.nodeEnv.isDevelopment).toBeFalse();
            expect(String(config.nodeEnv.env)).toBe('test');
        });
    });

    describe('integration tests', () => {
        it('can fetch the health endpoint', async () => {
            const response = await honoApp.request('/health');

            expect(response.status).toBe(200);
        });
    });

    describe('db connection', () => {
        it('can conned to the db', async () => {
            await setupTestDatabase();
            await resetTestData();
            const userService = container.resolve(UsersDbService);
            const userCount = await userService.count();
            expect(userCount).toBeGreaterThan(0);
        });
    });
});
