import { describe, expect, it } from 'bun:test';
import { InflectionNamingStrategy } from '../src';

describe('InflectionNamingStrategy.indexName', () => {
    const strategy = new InflectionNamingStrategy();
    const cases = [
        // Without Entity suffix
        { entity: 'User', columns: ['firstName'], where: undefined, expected: 'users_first_name' },
        {
            entity: 'Person',
            columns: ['firstName', 'lastName'],
            where: undefined,
            expected: 'people_first_name_last_name',
        },
        { entity: 'Order', columns: ['createdAt'], where: 'deletedAt IS NULL', expected: 'orders_created_at_partial' },
        { entity: 'APIKey', columns: ['keyValue'], where: undefined, expected: 'api_keys_key_value' },
        {
            entity: 'PurchaseOrder',
            columns: ['OrderID', 'UserID'],
            where: undefined,
            expected: 'purchase_orders_order_id_user_id',
        },

        // With Entity suffix
        { entity: 'UsersEntity', columns: ['firstName'], where: undefined, expected: 'users_first_name' },
        {
            entity: 'PeopleEntity',
            columns: ['firstName', 'lastName'],
            where: undefined,
            expected: 'people_first_name_last_name',
        },
        {
            entity: 'OrdersEntity',
            columns: ['createdAt'],
            where: 'deletedAt IS NULL',
            expected: 'orders_created_at_partial',
        },
        { entity: 'APIKeysEntity', columns: ['keyValue'], where: undefined, expected: 'api_keys_key_value' },
        {
            entity: 'PurchaseOrdersEntity',
            columns: ['OrderID', 'UserID'],
            where: undefined,
            expected: 'purchase_orders_order_id_user_id',
        },
    ];

    cases.forEach(({ entity, columns, where, expected }) => {
        it(`converts entity "${entity}" and columns [${columns.join(', ')}]${where ? ` with WHERE "${where}"` : ''} to "${expected}"`, () => {
            // Normalize the table name first using the tableName strategy
            const tableName = strategy.tableName(entity);
            expect(strategy.indexName(tableName, columns, where)).toBe(expected);
        });
    });
});
