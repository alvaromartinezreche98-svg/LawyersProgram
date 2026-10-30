/**
 * Where an invitation code from a link waits for sign-in (this tab only). The
 * link carries it in the fragment (/entrar#code=…) so it never reaches server
 * logs; Clerk's sign-in also uses the fragment, so the code is moved here first.
 */
export const INVITE_KEY = "prerenta:invite";
