import { describe, expect, it, spyOn } from 'bun:test';
import { InflectionNamingStrategy } from '../src';
import * as utils from '../src/utils';

describe('InflectionNamingStrategy.tableName', () => {
    const strategy = new InflectionNamingStrategy();

    const cases = [
        // No suffix
        { input: 'User', expected: 'users' },
        { input: 'Person', expected: 'people' },
        { input: 'APIKey', expected: 'api_keys' },
        { input: 'OrderItem', expected: 'order_items' },
        { input: 'UUIDToken', expected: 'uuid_tokens' },

        // With "Entity" suffix (should strip)
        { input: 'UserEntity', expected: 'users' },
        { input: 'PersonEntity', expected: 'people' },
        { input: 'APIKeyEntity', expected: 'api_keys' },
        { input: 'OrderItemEntity', expected: 'order_items' },
        { input: 'UUIDTokenEntity', expected: 'uuid_tokens' },

        // "Entity" in the middle (should NOT strip)
        { input: 'EntityTracker', expected: 'entity_trackers' },
    ];

    cases.forEach(({ input, expected }) => {
        it(`converts "${input}" to "${expected}"`, () => {
            expect(strategy.tableName(input)).toBe(expected);
        });
    });

    it('returns user-specified name as-is', () => {
        expect(strategy.tableName('User', 'custom_table')).toBe('custom_table');
        expect(strategy.tableName('UserEntity', 'custom_table')).toBe('custom_table');
    });

    it('calls createSafeTableName only once per targetName', () => {
        const spy = spyOn(utils, 'createSafeTableName');
        const cacheStrategy = new InflectionNamingStrategy();

        cacheStrategy.tableName('UserEntity');
        cacheStrategy.tableName('UserEntity');
        cacheStrategy.tableName('UserEntity');

        expect(spy).toHaveBeenCalledTimes(1);
        spy.mockRestore();
    });
});
