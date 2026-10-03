// Path helpers so the app also works when it is served from a sub-path
// (for example https://host/Research-IITB/) instead of the domain root.
//
// Vite sets import.meta.env.BASE_URL from the `base` option in vite.config.js.
// Local dev and a plain production build keep it as '/', so behaviour is unchanged.

const TRAILING = /\/+$/;

// `import.meta.env` only exists under Vite. Node scripts (npm run embed) import
// modules from this folder too, so fall back to plain defaults there.
const ENV = import.meta.env || {};

/** Base path without a trailing slash. '' at the domain root, '/Research-IITB' on a sub-path. */
const BASE = (ENV.BASE_URL || '/').replace(TRAILING, '');

/** Router basename: React Router wants '/' rather than an empty string. */
export const BASENAME = BASE || '/';

/** Prefix a public asset path ('/ugac-logo.svg') with the deployment base. */
export const asset = (p) => BASE + (p.startsWith('/') ? p : `/${p}`);

/** API prefix. Override with VITE_API_BASE when the API lives under the same sub-path. */
export const API = (ENV.VITE_API_BASE || '/api').replace(TRAILING, '');
