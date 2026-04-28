/* global process */

const REALM = 'Raphael Tools';

function unauthorized() {
  return new Response('Authentication required.', {
    status: 401,
    headers: {
      'WWW-Authenticate': `Basic realm="${REALM}", charset="UTF-8"`,
    },
  });
}

function safeEqual(left, right) {
  if (left.length !== right.length) return false;

  let result = 0;
  for (let index = 0; index < left.length; index += 1) {
    result |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }

  return result === 0;
}

export default function middleware(request) {
  const username = process.env.LISTING_TRACKER_USERNAME;
  const password = process.env.LISTING_TRACKER_PASSWORD;

  if (!username || !password) {
    return new Response('Private tools password is not configured in Vercel.', {
      status: 503,
      headers: {
        'Content-Type': 'text/plain; charset=UTF-8',
      },
    });
  }

  const authorization = request.headers.get('authorization');
  if (!authorization) return unauthorized();

  const [scheme, encoded] = authorization.split(' ');
  if (scheme !== 'Basic' || !encoded) return unauthorized();

  try {
    const decoded = atob(encoded);
    const separatorIndex = decoded.indexOf(':');
    const submittedUsername = decoded.slice(0, separatorIndex);
    const submittedPassword = decoded.slice(separatorIndex + 1);

    if (
      separatorIndex > -1
      && safeEqual(submittedUsername, username)
      && safeEqual(submittedPassword, password)
    ) {
      return undefined;
    }
  } catch {
    return unauthorized();
  }

  return unauthorized();
}

export const config = {
  matcher: ['/tools/:path*', '/listing-tracker/:path*', '/closing-cost-calculator/:path*', '/tax-vault/:path*'],
};
