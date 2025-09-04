import type { RepoConfig } from '@repo/shared-core';
import { Agenda } from 'agenda';

export const createAgendaInstance = (config: RepoConfig) => {
    return new Agenda({
        ...config.queues,
        db: {
            address: config.queues.dbUrl,
        },
    });
};
