export type CustomFetchOptions = RequestInit & {
  responseType?: "json" | "text" | "blob" | "auto";
};

export type ErrorType<T = unknown> = ApiError<T>;

export type BodyType<T> = T;

export type AuthTokenGetter = () => Promise<string | null> | string | null;

const NO_BODY_STATUS = new Set([204, 205, 304]);
const DEFAULT_JSON_ACCEPT = "application/json, application/problem+json";

// ---------------------------------------------------------------------------
// Module-level configuration
// ---------------------------------------------------------------------------

let _baseUrl: string | null = null;
let _authTokenGetter: AuthTokenGetter | null = null;

/**
 * Set a base URL that is prepended to every relative request URL
 * (i.e. paths that start with `/`).
 *
 * Useful for Expo bundles that need to call a remote API server.
 * Pass `null` to clear the base URL.
 */
export function setBaseUrl(url: string | null): void {
  _baseUrl = url ? url.replace(/\/+$/, "") : null;
}

/**
 * Register a getter that supplies a bearer auth token.  Before every fetch
 * the getter is invoked; when it returns a non-null string, an
 * `Authorization: Bearer <token>` header is attached to the request.
 *
 * Useful for Expo bundles making token-gated API calls.
 * Pass `null` to clear the getter.
 */
export function setAuthTokenGetter(getter: AuthTokenGetter | null): void {
  _authTokenGetter = getter;
}

function isRequest(input: RequestInfo | URL): input is Request {
  return typeof Request !== "undefined" && input instanceof Request;
}

function resolveMethod(input: RequestInfo | URL, explicitMethod?: string): string {
  if (explicitMethod) return explicitMethod.toUpperCase();
  if (isRequest(input)) return input.method.toUpperCase();
  return "GET";
}

// Use loose check for URL — some runtimes (e.g. React Native) polyfill URL
// differently, so `instanceof URL` can fail.
function isUrl(input: RequestInfo | URL): input is URL {
  return typeof URL !== "undefined" && input instanceof URL;
}

function applyBaseUrl(input: RequestInfo | URL): RequestInfo | URL {
  if (!_baseUrl) return input;
  const url = resolveUrl(input);
  // Only prepend to relative paths (starting with /)
  if (!url.startsWith("/")) return input;

  const absolute = `${_baseUrl}${url}`;
  if (typeof input === "string") return absolute;
  if (isUrl(input)) return new URL(absolute);
  return new Request(absolute, input as Request);
}

function resolveUrl(input: RequestInfo | URL): string {
  if (typeof input === "string") return input;
  if (isUrl(input)) return input.toString();
  return input.url;
}

function mergeHeaders(...sources: Array<HeadersInit | undefined>): Headers {
  const headers = new Headers();

  for (const source of sources) {
    if (!source) continue;
    new Headers(source).forEach((value, key) => {
      headers.set(key, value);
    });
  }

  return headers;
}

function getMediaType(headers: Headers): string | null {
  const value = headers.get("content-type");
  return value ? value.split(";", 1)[0].trim().toLowerCase() : null;
}

function isJsonMediaType(mediaType: string | null): boolean {
  return mediaType === "application/json" || Boolean(mediaType?.endsWith("+json"));
}

function isTextMediaType(mediaType: string | null): boolean {
  return Boolean(
    mediaType &&
      (mediaType.startsWith("text/") ||
        mediaType === "application/xml" ||
        mediaType === "text/xml" ||
        mediaType.endsWith("+xml") ||
        mediaType === "application/x-www-form-urlencoded"),
  );
}

// Use strict equality: in browsers, `response.body` is `null` when the
// response genuinely has no content.  In React Native, `response.body` is
// always `undefined` because the ReadableStream API is not implemented —
// even when the response carries a full payload readable via `.text()` or
// `.json()`.  Loose equality (`== null`) matches both `null` and `undefined`,
// which causes every React Native response to be treated as empty.
function hasNoBody(response: Response, method: string): boolean {
  if (method === "HEAD") return true;
  if (NO_BODY_STATUS.has(response.status)) return true;
  if (response.headers.get("content-length") === "0") return true;
  if (response.body === null) return true;
  return false;
}

function stripBom(text: string): string {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

function looksLikeJson(text: string): boolean {
  const trimmed = text.trimStart();
  return trimmed.startsWith("{") || trimmed.startsWith("[");
}

function getStringField(value: unknown, key: string): string | undefined {
  if (!value || typeof value !== "object") return undefined;

  const candidate = (value as Record<string, unknown>)[key];
  if (typeof candidate !== "string") return undefined;

  const trimmed = candidate.trim();
  return trimmed === "" ? undefined : trimmed;
}

function truncate(text: string, maxLength = 300): string {
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text;
}

function buildErrorMessage(response: Response, data: unknown): string {
  const prefix = `HTTP ${response.status} ${response.statusText}`;

  if (typeof data === "string") {
    const text = data.trim();
    return text ? `${prefix}: ${truncate(text)}` : prefix;
  }

  const title = getStringField(data, "title");
  const detail = getStringField(data, "detail");
  const message =
    getStringField(data, "message") ??
    getStringField(data, "error_description") ??
    getStringField(data, "error");

  if (title && detail) return `${prefix}: ${title} — ${detail}`;
  if (detail) return `${prefix}: ${detail}`;
  if (message) return `${prefix}: ${message}`;
  if (title) return `${prefix}: ${title}`;

  return prefix;
}

export class ApiError<T = unknown> extends Error {
  readonly name = "ApiError";
  readonly status: number;
  readonly statusText: string;
  readonly data: T | null;
  readonly headers: Headers;
  readonly response: Response;
  readonly method: string;
  readonly url: string;

  constructor(
    response: Response,
    data: T | null,
    requestInfo: { method: string; url: string },
  ) {
    super(buildErrorMessage(response, data));
    Object.setPrototypeOf(this, new.target.prototype);

    this.status = response.status;
    this.statusText = response.statusText;
    this.data = data;
    this.headers = response.headers;
    this.response = response;
    this.method = requestInfo.method;
    this.url = response.url || requestInfo.url;
  }
}

export class ResponseParseError extends Error {
  readonly name = "ResponseParseError";
  readonly status: number;
  readonly statusText: string;
  readonly headers: Headers;
  readonly response: Response;
  readonly method: string;
  readonly url: string;
  readonly rawBody: string;
  readonly cause: unknown;

  constructor(
    response: Response,
    rawBody: string,
    cause: unknown,
    requestInfo: { method: string; url: string },
  ) {
    super(
      `Failed to parse response from ${requestInfo.method} ${response.url || requestInfo.url} ` +
        `(${response.status} ${response.statusText}) as JSON`,
    );
    Object.setPrototypeOf(this, new.target.prototype);

    this.status = response.status;
    this.statusText = response.statusText;
    this.headers = response.headers;
    this.response = response;
    this.method = requestInfo.method;
    this.url = response.url || requestInfo.url;
    this.rawBody = rawBody;
    this.cause = cause;
  }
}

async function parseJsonBody(
  response: Response,
  requestInfo: { method: string; url: string },
): Promise<unknown> {
  const raw = await response.text();
  const normalized = stripBom(raw);

  if (normalized.trim() === "") {
    return null;
  }

  try {
    return JSON.parse(normalized);
  } catch (cause) {
    throw new ResponseParseError(response, raw, cause, requestInfo);
  }
}

async function parseErrorBody(response: Response, method: string): Promise<unknown> {
  if (hasNoBody(response, method)) {
    return null;
  }

  const mediaType = getMediaType(response.headers);

  // Fall back to text when blob() is unavailable (e.g. some React Native builds).
  if (mediaType && !isJsonMediaType(mediaType) && !isTextMediaType(mediaType)) {
    return typeof response.blob === "function" ? response.blob() : response.text();
  }

  const raw = await response.text();
  const normalized = stripBom(raw);
  const trimmed = normalized.trim();

  if (trimmed === "") {
    return null;
  }

  if (isJsonMediaType(mediaType) || looksLikeJson(normalized)) {
    try {
      return JSON.parse(normalized);
    } catch {
      return raw;
    }
  }

  return raw;
}

function inferResponseType(response: Response): "json" | "text" | "blob" {
  const mediaType = getMediaType(response.headers);

  if (isJsonMediaType(mediaType)) return "json";
  if (isTextMediaType(mediaType) || mediaType == null) return "text";
  return "blob";
}

async function parseSuccessBody(
  response: Response,
  responseType: "json" | "text" | "blob" | "auto",
  requestInfo: { method: string; url: string },
): Promise<unknown> {
  if (hasNoBody(response, requestInfo.method)) {
    return null;
  }

  const effectiveType =
    responseType === "auto" ? inferResponseType(response) : responseType;

  switch (effectiveType) {
    case "json":
      return parseJsonBody(response, requestInfo);

    case "text": {
      const text = await response.text();
      return text === "" ? null : text;
    }

    case "blob":
      if (typeof response.blob !== "function") {
        throw new TypeError(
          "Blob responses are not supported in this runtime. " +
            "Use responseType \"json\" or \"text\" instead.",
        );
      }
      return response.blob();
  }
}

export async function customFetch<T = unknown>(
  input: RequestInfo | URL,
  options: CustomFetchOptions = {},
): Promise<T> {
  input = applyBaseUrl(input);
  const { responseType = "auto", headers: headersInit, ...init } = options;

  const method = resolveMethod(input, init.method);

  if (init.body != null && (method === "GET" || method === "HEAD")) {
    throw new TypeError(`customFetch: ${method} requests cannot have a body.`);
  }

  const headers = mergeHeaders(isRequest(input) ? input.headers : undefined, headersInit);

  if (
    typeof init.body === "string" &&
    !headers.has("content-type") &&
    looksLikeJson(init.body)
  ) {
    headers.set("content-type", "application/json");
  }

  if (responseType === "json" && !headers.has("accept")) {
    headers.set("accept", DEFAULT_JSON_ACCEPT);
  }

  // Attach bearer token when an auth getter is configured and no
  // Authorization header has been explicitly provided.
  if (_authTokenGetter && !headers.has("authorization")) {
    const token = await _authTokenGetter();
    if (token) {
      headers.set("authorization", `Bearer ${token}`);
    }
  }

  const requestInfo = { method, url: resolveUrl(input) };

  // ---------- OFFLINE MVP MOCK INTERCEPTOR ----------
  const urlStr = requestInfo.url;
  if (!urlStr.includes("localhost:5000") && typeof window !== "undefined") {

    // --- Seed demo pets into localStorage on first access ---
    function ensureSeedData() {
      if (typeof localStorage === "undefined") return;
      const SEED_KEY = "mock_pets_seeded_v2";
      if (localStorage.getItem(SEED_KEY)) return;

      const existing = JSON.parse(localStorage.getItem("mock_pets") || "{}");
      const demoPets = [
        { id: "demo-001", petId: "DOG001", name: "Buddy", species: "Dog", breed: "Golden Retriever", age: 3, gender: "Male", photoUrl: "/images/dogs/dogo1.jpeg", status: "Pending", createdAt: "2025-11-15T00:00:00.000Z",rhinariumId: "RH-2025-BDY1", owner: { id: "owner-1", name: "John Smith", phone: "5551234567", email: "john@example.com" }, vaccinations: [{ id: "v1", petId: "demo-001", type: "Rabies", date: "2025-06-01T00:00:00.000Z", verified: true, notes: null }, { id: "v2", petId: "demo-001", type: "Parvo", date: "2025-06-15T00:00:00.000Z", verified: true, notes: null }, { id: "v3", petId: "demo-001", type: "Distemper", date: "2025-07-01T00:00:00.000Z", verified: false, notes: null }], medicalRecords: [] },
        { id: "demo-002", petId: "DOG002", name: "Max", species: "Dog", breed: "German Shepherd", age: 5, gender: "Male", photoUrl: "/images/dogs/dogo2.jpeg", status: "Pending", createdAt: "2025-09-22T00:00:00.000Z", rhinariumId: "RH-2025-MAX2", owner: { id: "owner-2", name: "Sarah Johnson", phone: "5559876543", email: "sarah@example.com" }, vaccinations: [{ id: "v4", petId: "demo-002", type: "Rabies", date: "2025-05-01T00:00:00.000Z", verified: true, notes: null }, { id: "v5", petId: "demo-002", type: "Parvo", date: "2025-05-15T00:00:00.000Z", verified: true, notes: null }, { id: "v6", petId: "demo-002", type: "Bordetella", date: "2025-06-01T00:00:00.000Z", verified: false, notes: null }], medicalRecords: [] },
        { id: "demo-003", petId: "DOG003", name: "Bella", species: "Dog", breed: "Labrador Retriever", age: 2, gender: "Female", photoUrl: "/images/dogs/dogo3.jpeg", status: "Pending", createdAt: "2026-01-08T00:00:00.000Z", rhinariumId: "RH-2026-BLA3", owner: { id: "owner-3", name: "Emily Davis", phone: "5555551234", email: "emily@example.com" }, vaccinations: [{ id: "v7", petId: "demo-003", type: "Rabies", date: "2025-12-01T00:00:00.000Z", verified: true, notes: null }, { id: "v8", petId: "demo-003", type: "Distemper", date: "2025-12-15T00:00:00.000Z", verified: true, notes: null }, { id: "v9", petId: "demo-003", type: "Leptospirosis", date: "2026-01-01T00:00:00.000Z", verified: false, notes: null }], medicalRecords: [] },
        { id: "demo-004", petId: "DOG004", name: "Charlie", species: "Dog", breed: "Beagle", age: 4, gender: "Male", photoUrl: "/images/dogs/dogo4.jpeg", status: "Pending", createdAt: "2025-12-03T00:00:00.000Z", rhinariumId: "RH-2025-CHL4", owner: { id: "owner-4", name: "Michael Brown", phone: "5551112222", email: "michael@example.com" }, vaccinations: [{ id: "v10", petId: "demo-004", type: "Rabies", date: "2025-10-01T00:00:00.000Z", verified: true, notes: null }, { id: "v11", petId: "demo-004", type: "Parvo", date: "2025-10-15T00:00:00.000Z", verified: true, notes: null }, { id: "v12", petId: "demo-004", type: "Distemper", date: "2025-11-01T00:00:00.000Z", verified: true, notes: null }, { id: "v13", petId: "demo-004", type: "Hepatitis", date: "2025-11-15T00:00:00.000Z", verified: false, notes: null }], medicalRecords: [] },
        { id: "demo-005", petId: "DOG005", name: "Luna", species: "Dog", breed: "Siberian Husky", age: 1, gender: "Female", photoUrl: "/images/dogs/dogo5.jpeg", status: "Pending", createdAt: "2026-02-14T00:00:00.000Z", rhinariumId: "RH-2026-LNA5", owner: { id: "owner-5", name: "Jessica Wilson", phone: "5553334444", email: "jessica@example.com" }, vaccinations: [{ id: "v14", petId: "demo-005", type: "Rabies", date: "2026-01-15T00:00:00.000Z", verified: true, notes: null }, { id: "v15", petId: "demo-005", type: "Parvo", date: "2026-02-01T00:00:00.000Z", verified: false, notes: null }], medicalRecords: [] },
        { id: "demo-006", petId: "DOG006", name: "Rocky", species: "Dog", breed: "Rottweiler", age: 6, gender: "Male", photoUrl: "/images/dogs/dogo6.jpeg", status: "Verified", createdAt: "2025-10-30T00:00:00.000Z", rhinariumId: "RH-2025-RKY6", owner: { id: "owner-6", name: "David Martinez", phone: "5556667777", email: "david@example.com" }, vaccinations: [{ id: "v16", petId: "demo-006", type: "Rabies", date: "2025-08-01T00:00:00.000Z", verified: true, notes: null }, { id: "v17", petId: "demo-006", type: "Distemper", date: "2025-08-15T00:00:00.000Z", verified: true, notes: null }, { id: "v18", petId: "demo-006", type: "Parvo", date: "2025-09-01T00:00:00.000Z", verified: true, notes: null }, { id: "v19", petId: "demo-006", type: "Bordetella", date: "2025-09-15T00:00:00.000Z", verified: true, notes: null }], medicalRecords: [] },
        { id: "demo-007", petId: "DOG007", name: "Daisy", species: "Dog", breed: "Poodle", age: 3, gender: "Female", photoUrl: "/images/dogs/dogo7.jpeg", status: "Verified", createdAt: "2026-03-01T00:00:00.000Z", rhinariumId: "RH-2026-DSY7", owner: { id: "owner-7", name: "Amanda Taylor", phone: "5558889999", email: "amanda@example.com" }, vaccinations: [{ id: "v20", petId: "demo-007", type: "Rabies", date: "2026-01-01T00:00:00.000Z", verified: true, notes: null }, { id: "v21", petId: "demo-007", type: "Leptospirosis", date: "2026-01-15T00:00:00.000Z", verified: true, notes: null }, { id: "v22", petId: "demo-007", type: "Canine Influenza", date: "2026-02-01T00:00:00.000Z", verified: true, notes: null }], medicalRecords: [] },
        { id: "demo-008", petId: "DOG008", name: "Cooper", species: "Dog", breed: "Border Collie", age: 2, gender: "Male", photoUrl: "/images/dogs/dogo8.jpeg", status: "Verified", createdAt: "2025-08-19T00:00:00.000Z", rhinariumId: "RH-2025-CPR8", owner: { id: "owner-8", name: "Robert Anderson", phone: "5550001111", email: "robert@example.com" }, vaccinations: [{ id: "v23", petId: "demo-008", type: "Rabies", date: "2025-06-01T00:00:00.000Z", verified: true, notes: null }, { id: "v24", petId: "demo-008", type: "Parvo", date: "2025-06-15T00:00:00.000Z", verified: true, notes: null }, { id: "v25", petId: "demo-008", type: "Distemper", date: "2025-07-01T00:00:00.000Z", verified: true, notes: null }], medicalRecords: [] },
        { id: "demo-009", petId: "DOG009", name: "Datta", species: "Dog", breed: "Labrador", age: 4, gender: "Male", photoUrl: "/images/dogs/datta.jpeg", status: "Verified", createdAt: "2026-01-25T00:00:00.000Z", rhinariumId: "RH-2026-DTA9", owner: { id: "owner-9", name: "James Thomas", phone: "5552223333", email: "james@example.com" }, vaccinations: [{ id: "v26", petId: "demo-009", type: "Rabies", date: "2025-11-01T00:00:00.000Z", verified: true, notes: null }, { id: "v27", petId: "demo-009", type: "Parvo", date: "2025-11-15T00:00:00.000Z", verified: true, notes: null }, { id: "v28", petId: "demo-009", type: "Distemper", date: "2025-12-01T00:00:00.000Z", verified: true, notes: null }, { id: "v29", petId: "demo-009", type: "Leptospirosis", date: "2025-12-15T00:00:00.000Z", verified: true, notes: null }], medicalRecords: [] },
        { id: "demo-010", petId: "DOG010", name: "Skye", species: "Dog", breed: "Golden Retriever", age: 3, gender: "Female", photoUrl: "/images/dogs/skye.jpg", status: "Verified", createdAt: "2026-02-28T00:00:00.000Z", rhinariumId: "RH-2026-SKY0", owner: { id: "owner-10", name: "Patricia Garcia", phone: "5554445555", email: "patricia@example.com" }, vaccinations: [{ id: "v30", petId: "demo-010", type: "Rabies", date: "2026-01-01T00:00:00.000Z", verified: true, notes: null }, { id: "v31", petId: "demo-010", type: "Bordetella", date: "2026-01-15T00:00:00.000Z", verified: true, notes: null }, { id: "v32", petId: "demo-010", type: "Canine Influenza", date: "2026-02-01T00:00:00.000Z", verified: true, notes: null }], medicalRecords: [] },
      ];

      for (const pet of demoPets) {
        if (!existing[pet.id]) {
          existing[pet.id] = pet;
        }
      }
      localStorage.setItem("mock_pets", JSON.stringify(existing));
      localStorage.setItem(SEED_KEY, "true");
    }

    // Always ensure seed data exists
    ensureSeedData();

    // --- Helper to get all mock pets ---
    function getMockPets(): Record<string, any> {
      return JSON.parse(localStorage.getItem("mock_pets") || "{}");
    }
    function saveMockPets(pets: Record<string, any>) {
      localStorage.setItem("mock_pets", JSON.stringify(pets));
    }

    // --- Upload photo: send to Vite dev server middleware to save to disk ---
    if (method === "POST" && urlStr.includes("/upload")) {
      // Let this request through to the Vite dev server middleware
      // which will save the file to public/images/dogs
      try {
        const response = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: init.body,
        });
        if (response.ok) {
          return (await response.json()) as T;
        }
      } catch (e) {
        // Fallback: use dataUrl directly
      }
      let bodyData: any = {};
      if (typeof init.body === "string") {
        try { bodyData = JSON.parse(init.body); } catch(e){}
      }
      const url = bodyData?.dataUrl || "https://images.unsplash.com/photo-1543466835-00a7907e9de1";
      return { url } as T;
    }
    
    // --- Create pet ---
    if (method === "POST" && urlStr.endsWith("/api/pets")) {
      let bodyData: any = {};
      if (typeof init.body === "string") {
        try { bodyData = JSON.parse(init.body); } catch(e){}
      }
      
      // Generate sequential DOGXXX ID
      const allPets = getMockPets();
      let maxNum = 10;
      for (const pet of Object.values(allPets) as any[]) {
        const match = pet.petId?.match(/^DOG(\d+)$/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > maxNum) maxNum = num;
        }
      }
      const petId = `DOG${String(maxNum + 1).padStart(3, "0")}`;
      const id = "mock-" + Date.now();
      const newPet = { 
        ...bodyData, 
        id, 
        petId, 
        status: "Pending", 
        createdAt: new Date().toISOString(),
        owner: { id: "owner-" + id, name: bodyData.ownerName, phone: bodyData.ownerPhone, email: bodyData.ownerEmail },
        vaccinations: [],
        medicalRecords: []
      };
      
      allPets[id] = newPet;
      saveMockPets(allPets);
      
      return newPet as T;
    }
    
    // --- Get pet by ID (including demo- and mock- IDs) ---
    if (method === "GET" && urlStr.match(/\/api\/pets\/(demo-|mock-)[^/?]+$/)) {
      const match = urlStr.match(/\/api\/pets\/([^/?]+)$/);
      if (match) {
        const id = match[1];
        const pets = getMockPets();
        if (pets[id]) {
          return pets[id] as T;
        }
      }
    }
    
    // --- Verify pet (search by petId, phone, or rhinariumId) ---
    if (method === "GET" && urlStr.includes("/api/pets/verify")) {
      const allPets = Object.values(getMockPets()) as any[];

      const urlObj = new URL(urlStr, window.location.origin);
      const petIdTerm = urlObj.searchParams.get("petId")?.toUpperCase();
      const phoneTerm = urlObj.searchParams.get("phone");
      const rhinariumTerm = urlObj.searchParams.get("rhinariumId");

      const results = allPets.filter((p: any) => {
        if (petIdTerm && p.petId?.toUpperCase() === petIdTerm) return true;
        if (phoneTerm && p.owner?.phone === phoneTerm) return true;
        if (rhinariumTerm && p.rhinariumId === rhinariumTerm) return true;
        return false;
      });

      return results as T;
    }
    
    // --- List all pets (with optional search filter) ---
    if (method === "GET" && (urlStr.endsWith("/api/pets") || urlStr.includes("/api/pets?"))) {
      let results = Object.values(getMockPets()) as any[];
      
      // Handle search param filtering
      const urlObj = new URL(urlStr, window.location.origin);
      const searchTerm = urlObj.searchParams.get("search");
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        results = results.filter((p: any) => 
          p.name?.toLowerCase().includes(term) ||
          p.petId?.toLowerCase().includes(term) ||
          p.species?.toLowerCase().includes(term) ||
          p.breed?.toLowerCase().includes(term) ||
          p.owner?.name?.toLowerCase().includes(term)
        );
      }
      
      return results as T;
    }

    // --- Admin stats ---
    if (method === "GET" && urlStr.includes("/api/admin/stats")) {
      const allPets = Object.values(getMockPets()) as any[];
      const total = allPets.length;
      const verified = allPets.filter(p => p.status === "Verified").length;
      const pending = allPets.filter(p => p.status === "Pending").length;
      const incomplete = allPets.filter(p => p.status === "Incomplete").length;
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const recentRegistrations = allPets.filter(p => new Date(p.createdAt) >= oneWeekAgo).length;
      return { total, verified, pending, incomplete, recentRegistrations } as T;
    }

    // --- Mark pet as verified ---
    if (method === "PATCH" && urlStr.match(/\/api\/pets\/[^/]+\/verify/)) {
      const id = urlStr.split("/").slice(-2, -1)[0];
      const pets = getMockPets();
      if (pets[id]) {
        pets[id].status = "Verified";
        saveMockPets(pets);
        return pets[id] as T;
      }
    }

    // --- Add vaccination record ---
    if (method === "POST" && urlStr.match(/\/api\/pets\/[^/]+\/vaccinations/)) {
      const id = urlStr.split("/").slice(-2, -1)[0];
      let bodyData: any = {};
      if (typeof init.body === "string") {
        try { bodyData = JSON.parse(init.body); } catch(e){}
      }
      const pets = getMockPets();
      if (pets[id]) {
        const record = { id: "vax-" + Date.now(), petId: id, ...bodyData };
        if (!Array.isArray(pets[id].vaccinations)) pets[id].vaccinations = [];
        pets[id].vaccinations.push(record);
        saveMockPets(pets);
        return record as T;
      }
    }

    // --- Add medical record ---
    if (method === "POST" && urlStr.match(/\/api\/pets\/[^/]+\/medical/)) {
      const id = urlStr.split("/").slice(-2, -1)[0];
      let bodyData: any = {};
      if (typeof init.body === "string") {
        try { bodyData = JSON.parse(init.body); } catch(e){}
      }
      const pets = getMockPets();
      if (pets[id]) {
        const record = { id: "med-" + Date.now(), petId: id, createdAt: new Date().toISOString(), ...bodyData };
        if (!Array.isArray(pets[id].medicalRecords)) pets[id].medicalRecords = [];
        pets[id].medicalRecords.push(record);
        saveMockPets(pets);
        return record as T;
      }
    }

    // --- Vet login ---
    if (method === "POST" && urlStr.includes("/api/vet/login")) {
      let bodyData: any = {};
      if (typeof init.body === "string") {
        try { bodyData = JSON.parse(init.body); } catch(e){}
      }
      if (bodyData.username === "vetdemo" && bodyData.password === "vet1234") {
        return {
          token: "demo-token-12345",
          vet: { id: "demo-id", username: "vetdemo", name: "Dr. Demo Vet", clinic: "Demo Veterinary Clinic" }
        } as T;
      }
      // Simulate a failed login
      throw new ApiError(
        new Response(JSON.stringify({ error: "Invalid credentials" }), { status: 401, statusText: "Unauthorized" }),
        { error: "Invalid credentials" },
        requestInfo
      );
    }

    // --- Health check ---
    if (method === "GET" && urlStr.includes("/api/healthz")) {
      return { status: "ok" } as T;
    }
  }
  // ----------------------------------------------------

  const response = await fetch(input, { ...init, method, headers });

  if (!response.ok) {
    const errorData = await parseErrorBody(response, method);
    throw new ApiError(response, errorData, requestInfo);
  }

  return (await parseSuccessBody(response, responseType, requestInfo)) as T;
}
