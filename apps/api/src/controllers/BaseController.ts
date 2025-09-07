import { DataSource, type User, UserPermissionEntity } from '@repo/database';
import type { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { inject, singleton } from 'tsyringe';
import type { Repository } from 'typeorm';

@singleton()
export class BaseController {
    protected userPermissionsRepo: Repository<UserPermissionEntity>;

    constructor(@inject(DataSource) protected dataSource: DataSource) {
        this.userPermissionsRepo = this.dataSource.getRepository(UserPermissionEntity);
    }

    protected successResponse<T>(data: T) {
        return {
            success: true,
            data,
            meta: {
                timestamp: new Date().toISOString(),
                version: '1.0.0',
            },
        };
    }

    protected paginatedResponse<T>(
        data: T[],
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrev: boolean;
        }
    ) {
        return {
            success: true,
            data,
            pagination,
            meta: {
                timestamp: new Date().toISOString(),
                version: '1.0.0',
            },
        };
    }

    protected getCurrentUser(c: Context): User {
        const user = c.get('currentUser');
        if (!user) {
            throw new HTTPException(401, { message: 'Authentication required' });
        }
        return user;
    }

    protected async validateWorkspaceAccess(
        userId: string,
        workspaceId: string,
        requiredPermission: 'read' | 'write' = 'read'
    ): Promise<void> {
        const permission = await this.userPermissionsRepo.findOne({
            where: { userId, workspaceId },
        });

        if (!permission) {
            throw new HTTPException(403, { message: 'Forbidden' });
        }

        if (requiredPermission === 'write' && !permission.canWrite) {
            throw new HTTPException(403, { message: 'Forbidden' });
        }
    }
}
