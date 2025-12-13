// Jasmine integration tests for RiceBook backend
const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
const fetchFn = typeof fetch === 'function'
  ? fetch
  : (...args) => import('node-fetch').then(({ default: f }) => f(...args));

let cookie = '';

async function request(path, { method = 'GET', headers = {}, body } = {}) {
  const finalHeaders = { ...headers };
  if (cookie) {
    finalHeaders.Cookie = cookie;
  }

  const response = await fetchFn(`${BASE_URL}${path}`, {
    method,
    headers: finalHeaders,
    body,
  });

  const setCookie = response.headers.get('set-cookie');
  if (setCookie) {
    cookie = setCookie.split(';')[0];
  }

  const text = await response.text();
  let data = {};
  if (text) {
    try {
      data = JSON.parse(text);
    } catch (err) {
      fail(`Failed to parse JSON response from ${path}: ${err.message}`);
    }
  }

  return { response, data };
}

describe('RiceBook backend API', () => {
  const uniqueId = Date.now();
  const username = `testUser${uniqueId}`;
  const password = '123';
  const headline = `Hello from ${uniqueId}`;
  const articleText = `Test article ${uniqueId}`;

  it('registers a new user', async () => {
    const payload = {
      username,
      password,
      email: `${username}@example.com`,
      zipcode: '77005',
      dob: '1990-01-01',
      phone: '123-456-7890',
      display: username,
    };

    const { response, data } = await request('/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    expect(response.status).toBe(200);
    expect(data).toEqual(jasmine.objectContaining({ result: 'success', username }));
  });

  it('logs in the registered user', async () => {
    const { response, data } = await request('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    expect(response.status).toBe(200);
    expect(data).toEqual(jasmine.objectContaining({ result: 'success', username }));
    expect(cookie).toContain('sid=');
  });

  it('creates a new article and verifies it exists', async () => {
    const { response, data } = await request('/article', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: articleText }),
    });

    expect(response.status).toBe(200);
    expect(Array.isArray(data.articles)).toBeTrue();
    expect(data.articles.length).toBeGreaterThan(0);
    expect(data.articles[0].body).toBe(articleText);
    expect(data.articles[0].author).toBe(username);

    const articlesResponse = await request('/articles');
    const list = articlesResponse.data.articles || [];
    const exists = list.some((article) => article.body === articleText && article.author === username);
    expect(exists).toBeTrue();
  });

  it('updates the headline and reads it back', async () => {
    const updateResult = await request('/headline', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ headline }),
    });

    expect(updateResult.response.status).toBe(200);
    expect(updateResult.data).toEqual(jasmine.objectContaining({ headline }));

    const { response, data } = await request('/headline');
    expect(response.status).toBe(200);
    expect(data.headline).toBe(headline);
    expect(data.username).toBe(username);
  });

  it('logs out the user', async () => {
    const { response, data } = await request('/logout', { method: 'PUT' });
    expect(response.status).toBe(200);
    expect(data).toEqual(jasmine.objectContaining({ result: 'OK' }));
    cookie = '';
  });
});
