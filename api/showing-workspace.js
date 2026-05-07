/* global Buffer, process */
import { get, put } from '@vercel/blob';

const BLOB_PATH = 'mass-showing-booker/workspace.json';
const SESSION_COOKIE = 'raphael_tools_session';

function normalizeUsername(value) {
  return value.trim().toLowerCase();
}

function sessionValue(username, password) {
  return Buffer.from(`${username}:${password}`, 'utf8').toString('base64');
}

function getCookie(request, name) {
  const cookieHeader = request.headers.cookie || '';
  const cookies = cookieHeader.split(';').map((cookie) => cookie.trim());
  const match = cookies.find((cookie) => cookie.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : '';
}

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

  if (!expectedUsername || !expectedPassword) return false;

  if (scheme === 'Bearer' && automationToken && value === automationToken) {
    return true;
  }

  if (getCookie(request, SESSION_COOKIE) === sessionValue(expectedUsername, expectedPassword)) {
    return true;
  }

  const credentials = getBasicCredentials(request);

  return Boolean(
    credentials
      && normalizeUsername(credentials.username) === normalizeUsername(expectedUsername)
      && credentials.password === expectedPassword
  );
}

function send(response, statusCode, body) {
  response.statusCode = statusCode;
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.setHeader('Cache-Control', 'no-store');
  response.end(JSON.stringify(body));
}

async function readBody(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  return Buffer.concat(chunks).toString('utf8');
}

async function readWorkspace(token) {
  try {
    const result = await get(BLOB_PATH, {
      access: 'private',
      token,
    });

    if (!result?.stream) return null;

    const text = await new Response(result.stream).text();
    return JSON.parse(text || 'null');
  } catch (error) {
    if (/not found|404/i.test(error.message || '')) return null;
    throw error;
  }
}

async function writeWorkspace(token, workspace) {
  await put(BLOB_PATH, JSON.stringify(workspace, null, 2), {
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
      send(response, 200, { workspace: await readWorkspace(token) });
      return;
    }

    if (request.method === 'PUT') {
      const body = JSON.parse(await readBody(request) || '{}');
      const workspace = body.workspace && typeof body.workspace === 'object'
        ? body.workspace
        : { activePlanId: '', plans: [] };
      await writeWorkspace(token, workspace);
      send(response, 200, { workspace });
      return;
    }

    response.setHeader('Allow', 'GET, PUT');
    send(response, 405, { error: 'Method not allowed' });
  } catch (error) {
    send(response, 500, { error: error.message || 'Unexpected server error' });
  }
}
