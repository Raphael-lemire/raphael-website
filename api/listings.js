import { get, put } from '@vercel/blob';

const BLOB_PATH = 'listing-tracker/listings.json';

function getBasicCredentials(request) {
  const authorization = request.headers.authorization || '';
  const [scheme, encoded] = authorization.split(' ');
  if (scheme !== 'Basic' || !encoded) return null;

  try {
    const decoded = Buffer.from(encoded, 'base64').toString('utf8');
    const separatorIndex = decoded.indexOf(':');
    if (separatorIndex === -1) return null;
    return {
      username: decoded.slice(0, separatorIndex),
      password: decoded.slice(separatorIndex + 1),
    };
  } catch {
    return null;
  }
}

function isAuthorized(request) {
  const expectedUsername = process.env.LISTING_TRACKER_USERNAME;
  const expectedPassword = process.env.LISTING_TRACKER_PASSWORD;
  const automationToken = process.env.LISTING_TRACKER_AUTOMATION_TOKEN;
  const authorization = request.headers.authorization || '';
  const [scheme, value] = authorization.split(' ');

  if (scheme === 'Bearer' && automationToken && value === automationToken) {
    return true;
  }

  const credentials = getBasicCredentials(request);

  return Boolean(
    expectedUsername
      && expectedPassword
      && credentials
      && credentials.username === expectedUsername
      && credentials.password === expectedPassword
  );
}

function send(response, statusCode, body) {
  response.statusCode = statusCode;
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.end(JSON.stringify(body));
}

async function readBody(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  return Buffer.concat(chunks).toString('utf8');
}

async function readListings(token) {
  const result = await get(BLOB_PATH, {
    access: 'private',
    token,
  });

  if (!result?.stream) return [];

  const text = await new Response(result.stream).text();
  return JSON.parse(text || '[]');
}

async function writeListings(token, listings) {
  await put(BLOB_PATH, JSON.stringify(listings, null, 2), {
    access: 'private',
    addRandomSuffix: false,
    allowOverwrite: true,
    cacheControlMaxAge: 60,
    contentType: 'application/json; charset=utf-8',
    token,
  });
}

export default async function handler(request, response) {
  if (!isAuthorized(request)) {
    response.setHeader('WWW-Authenticate', 'Basic realm="Raphael Tools", charset="UTF-8"');
    send(response, 401, { error: 'Unauthorized' });
    return;
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    send(response, 503, { error: 'Storage is not connected yet.' });
    return;
  }

  try {
    if (request.method === 'GET') {
      send(response, 200, { listings: await readListings(token) });
      return;
    }

    if (request.method === 'PUT') {
      const body = JSON.parse(await readBody(request) || '{}');
      const listings = Array.isArray(body.listings) ? body.listings : [];
      await writeListings(token, listings);
      send(response, 200, { listings });
      return;
    }

    response.setHeader('Allow', 'GET, PUT');
    send(response, 405, { error: 'Method not allowed' });
  } catch (error) {
    send(response, 500, { error: error.message || 'Unexpected server error' });
  }
}
