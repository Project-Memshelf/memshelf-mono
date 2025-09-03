import { createRepoConfig } from '@repo/shared-core';
import { createDataSource } from './config';

const repoConfig = createRepoConfig({
    logger: {
        name: 'Database',
    },
});

/**
 * Package-level data source for migrations and package internal use
 */
export const AppDataSource = createDataSource(repoConfig);
