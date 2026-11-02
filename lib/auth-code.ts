/** Preserve leading zeroes; allow the spaces/dashes inserted by authenticator apps. */
export const normalizeAuthCode=(code:string)=>code.normalize('NFKC').replace(/[\s\u200B-\u200D\u2060\uFEFF-]/gu,'');
