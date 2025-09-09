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

export async function expectSuccessResponse(
    rawResponse: Response,
    expectedStatus: number = 200,
    expectedData?: Record<string, unknown>
) {
    let body: Record<string, unknown> | null;

    // Handle 204 No Content or other responses without body
    const contentLength = rawResponse.headers.get('content-length');
    if (rawResponse.status === 204 || contentLength === '0') {
        body = null;
    } else {
        try {
            body = (await rawResponse.json()) as Record<string, unknown>;
        } catch {
            // If JSON parsing fails, treat as empty body
            body = null;
        }
    }

    if (rawResponse.status !== expectedStatus) {
        const errorMessage = `Expected status failure: ${JSON.stringify(
            {
                actual: rawResponse.status,
                expected: expectedStatus,
                body,
            },
            null,
            8
        )}`;
        console.log(errorMessage);
        expect(rawResponse.status).toBe(expectedStatus);
    }

    // Only validate JSON structure if we have a body
    if (body) {
        expect(body).toHaveProperty('success', true);
        expect(body).toHaveProperty('data');
        if (expectedData) {
            expect(body.data).toMatchObject(expectedData);
        }
    }

    return body;
}

export async function expectErrorResponse(rawResponse: Response, expectedCode: number) {
    const body = await rawResponse.json();

    if (rawResponse.status !== expectedCode) {
        const errorMessage = `Expected error status failure: ${JSON.stringify(
            {
                actual: rawResponse.status,
                expected: expectedCode,
                body,
            },
            null,
            8
        )}`;
        console.log(errorMessage);
        expect(rawResponse.status).toBe(expectedCode);
    }

    expect(body).toHaveProperty('success', false);
    expect(body).toHaveProperty('error');
    expect(body.error).toHaveProperty('code');
    expect(body.error).toHaveProperty('message');
    expect(body.error.message.trim()).not.toBe('');
    expect(body.error).toHaveProperty('timestamp');
    expect(body.error.code).toBe(expectedCode);
    return body;
}

export async function expectPaginatedResponse(rawResponse: Response) {
    const body = await rawResponse.json();

    if (rawResponse.status !== 200) {
        const errorMessage = `Expected status 200 for paginated response failure: ${JSON.stringify(
            {
                actual: rawResponse.status,
                expected: 200,
                body,
            },
            null,
            8
        )}`;
        console.log(errorMessage);
        expect(rawResponse.status).toBe(200);
    }

    expect(body).toHaveProperty('success', true);
    expect(body).toHaveProperty('data');
    expect(body).toHaveProperty('pagination');
    expect(body.pagination).toHaveProperty('page');
    expect(body.pagination).toHaveProperty('limit');
    expect(body.pagination).toHaveProperty('total');
    return body;
}
