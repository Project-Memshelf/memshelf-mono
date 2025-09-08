import { describe, expect, it } from 'bun:test';
import { createRepoConfig } from '@repo/shared-core';
import { honoApp } from '../src/http-server';

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
            expect(config.database.port).toBe(8383);
        });
    });

    describe('integration tests', () => {
        it('can fetch the health endpoint', async () => {
            const response = await honoApp.request('/health');

            expect(response.status).toBe(200);
        });
    });
});
