import type { AppEntity } from '@repo/database';
import { BaseController } from './BaseController';

export abstract class BaseWorkspaceController<Entity extends AppEntity = AppEntity> extends BaseController<Entity> {}
