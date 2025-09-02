import { describe, expect, it } from 'bun:test';
import { InflectionNamingStrategy } from '../src';

describe('InflectionNamingStrategy.columnName', () => {
    const strategy = new InflectionNamingStrategy();

    const cases = [
        { property: 'firstName', prefixes: [], expected: 'first_name' },
        { property: 'zipCode', prefixes: ['address'], expected: 'address_zip_code' },
        { property: 'APIKey', prefixes: [], expected: 'api_key' },
        { property: 'createdAt', prefixes: ['metadata'], expected: 'metadata_created_at' },
        { property: 'OrderID', prefixes: ['purchase'], expected: 'purchase_order_id' }, // acronym + prefix
    ];

    cases.forEach(({ property, prefixes, expected }) => {
        it(`converts "${prefixes.join('.')}${prefixes.length ? '.' : ''}${property}" to "${expected}"`, () => {
            expect(strategy.columnName(property, undefined, prefixes)).toBe(expected);
        });
    });

    it('returns custom column name as-is', () => {
        expect(strategy.columnName('firstName', 'custom_column', [])).toBe('custom_column');
        expect(strategy.columnName('zipCode', 'zip_col', ['address'])).toBe('zip_col');
    });
});
