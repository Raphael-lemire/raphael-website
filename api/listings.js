const BLOB_PATH = 'listing-tracker/listings.json';
const BLOB_BASE_URL = 'https://blob.vercel-storage.com';

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
  const response = await fetch(`${BLOB_BASE_URL}/${BLOB_PATH}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.status === 404) return [];
  if (!response.ok) throw new Error(`Blob read failed with ${response.status}`);
  return response.json();
}

async function writeListings(token, listings) {
  const response = await fetch(`${BLOB_BASE_URL}/${BLOB_PATH}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json; charset=utf-8',
      'x-content-type': 'application/json; charset=utf-8',
      'x-add-random-suffix': '0',
      'x-cache-control-max-age': '0',
    },
    body: JSON.stringify(listings, null, 2),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Blob write failed with ${response.status}: ${text}`);
  }
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
