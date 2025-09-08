import { expect } from 'bun:test';
import { honoApp } from '../../../src/http-server';
import { testUsers } from '../../fixtures';

export async function authenticatedRequest(
    path: string,
    init: RequestInit = {},
    userType: keyof typeof testUsers = 'admin'
) {
    const headers = new Headers(init.headers);
    headers.set('Authorization', `Bearer ${testUsers[userType].apiKey}`);

    return honoApp.request(path, {
        ...init,
        headers,
    });
}

export async function expectSuccessResponse(response: Response, expectedData?: Record<string, unknown>) {
    const body = await response.json();
    expect(body).toHaveProperty('success', true);
    expect(body).toHaveProperty('data');
    if (expectedData) {
        expect(body.data).toMatchObject(expectedData);
    }
    return body;
}

export async function expectErrorResponse(response: Response, expectedCode?: number) {
    const body = await response.json();
    expect(body).toHaveProperty('success', false);
    expect(body).toHaveProperty('error');
    expect(body.error).toHaveProperty('code');
    expect(body.error).toHaveProperty('message');
    expect(body.error.message.trim()).not.toBe('');
    expect(body.error).toHaveProperty('timestamp');
    if (expectedCode) {
        expect(response.status).toBe(expectedCode);
        expect(body.error.code).toBe(expectedCode);
    }
    return body;
}

export async function expectPaginatedResponse(response: Response) {
    const body = await response.json();
    expect(body).toHaveProperty('success', true);
    expect(body).toHaveProperty('data');
    expect(body).toHaveProperty('pagination');
    expect(response.status).toBe(200);
    expect(body.pagination).toHaveProperty('page');
    expect(body.pagination).toHaveProperty('limit');
    expect(body.pagination).toHaveProperty('total');
    return body;
}
