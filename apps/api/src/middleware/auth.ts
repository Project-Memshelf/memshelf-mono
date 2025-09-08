import { UsersDbService } from '@repo/database';
import { bearerAuth } from 'hono/bearer-auth';
import { container } from '../config';

export const authMiddleware = bearerAuth({
    verifyToken: async (token, c) => {
        const usersService = container.resolve(UsersDbService);
        const user = await usersService.findOne({ apiKey: token });
        if (user) {
            c.set('currentUser', user);
            return true;
        }
        return false;
    },
});
