import { createRepoConfig } from '@repo/shared-core';
import { createContainer } from '@repo/shared-services';

export const config = createRepoConfig({
    logger: {
        name: 'ApiServer',
    },
});

export const container = createContainer(config);
