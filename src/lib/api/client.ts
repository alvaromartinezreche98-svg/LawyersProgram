/*
 * Transport to the firm's Go API (Product Design & Architecture, 29 Oct 2026, §8–9).
 * This file only knows HOW to call the API: base URL, Bearer token and the
 * error codes the document fixes. It defines no endpoints; each one is wired
 * against docs/openapi.yaml once it is published.
 */

/** Base URL of this firm's API deployment. Unset until the backend is connected. */
export const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/+$/, "");

/** What the screens need to know about a failed call, from the status codes agreed in §9. */
export type ApiErrorKind =
  /** 401: not signed in or the session token expired. */
  | "unauthenticated"
  /** 403: signed in, but this user has no access to the app or to this resource. */
  | "forbidden"
  /** 404: the resource does not exist or belongs to someone else (the API does not say which). */
  | "notFound"
  /** 409: someone changed it first, or the case is in a state that does not allow this. Refetch, never overwrite. */
  | "conflict"
  /** 413: the upload is too large. */
  | "tooLarge"
  /** 415: the upload is not PDF, JPEG, PNG, WebP, GIF or HEIC/HEIF (detected from content). */
  | "unsupportedType"
  /** 422: a field did not pass validation. */
  | "invalid"
  /** 5xx or an unexpected status. */
  | "server"
  /** No response at all (offline, DNS, CORS, timeout). */
  | "network";

const KIND: Record<number, ApiErrorKind> = { 401: "unauthenticated", 403: "forbidden", 404: "notFound", 409: "conflict", 413: "tooLarge", 415: "unsupportedType", 422: "invalid" };

export const kindOf = (status: number): ApiErrorKind => KIND[status] ?? "server";

export class ApiError extends Error {
  constructor(
    readonly kind: ApiErrorKind,
    readonly status: number,
    /** Response body as sent, kept for field errors once their format is agreed. Never shown to users or logged. */
    readonly body?: unknown,
  ) {
    super(`API ${status || "network"} (${kind})`);
    this.name = "ApiError";
  }
}

export const isApiError = (e: unknown): e is ApiError => e instanceof ApiError;

export interface ApiRequest {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  /** JSON body, or FormData for uploads. */
  body?: unknown;
  /** Clerk JWT-template token (see useApiToken). */
  token: string | null;
  signal?: AbortSignal;
  headers?: Record<string, string>;
}

/**
 * Calls the API and returns the parsed JSON (undefined for 204), or throws an
 * ApiError. Nothing about the request or response is logged: answers and
 * documents must not end up in logs or error messages (§3).
 */
export async function apiRequest<T>(path: string, { method = "GET", body, token, signal, headers = {} }: ApiRequest): Promise<T> {
  if (!API_URL) throw new ApiError("network", 0);
  const isForm = typeof FormData !== "undefined" && body instanceof FormData;
  let res: Response;
  try {
    res = await fetch(API_URL + path, {
      method,
      signal,
      cache: "no-store",
      headers: {
        Accept: "application/json",
        ...(body !== undefined && !isForm ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      body: body === undefined ? undefined : isForm ? (body as FormData) : JSON.stringify(body),
    });
  } catch (err) {
    if (signal?.aborted) throw err;
    throw new ApiError("network", 0);
  }
  if (res.status === 204) return undefined as T;
  const data: unknown = (res.headers.get("content-type") ?? "").includes("json") ? await res.json().catch(() => undefined) : undefined;
  if (!res.ok) throw new ApiError(kindOf(res.status), res.status, data);
  return data as T;
}
