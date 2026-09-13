import { CliError, DEFAULT_ORIGIN } from "./contract.mjs";

export function apiOrigin(value = DEFAULT_ORIGIN) {
  let url;
  try { url = new URL(value); } catch { throw new CliError("INVALID_ORIGIN", "Use an HTTPS origin or a loopback HTTP origin."); }
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  if ((url.protocol !== "https:" && !(url.protocol === "http:" && local)) || url.username || url.password || url.pathname !== "/" || url.search || url.hash) {
    throw new CliError("INVALID_ORIGIN", "Use an HTTPS origin or a loopback HTTP origin, without credentials, path or query.");
  }
  return url.origin;
}

export async function requestApi(origin, path, { body, locale = "zh-CN", fetchImpl = fetch } = {}) {
  let response;
  try {
    response = await fetchImpl(`${apiOrigin(origin)}${path}`, {
      method: body ? "POST" : "GET",
      headers: { "Accept": "application/json", "X-Locale": locale, ...(body ? { "Content-Type": "application/json" } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}),
      redirect: "error",
      signal: AbortSignal.timeout(15000),
    });
  } catch {
    throw new CliError("CONNECTION_FAILED", "Could not reach the API within 15 seconds. Check the origin and network; no automatic retry was made.");
  }
  const raw = await response.text();
  let payload;
  try { payload = JSON.parse(raw); } catch {
    throw new CliError("INVALID_RESPONSE", "The server did not return JSON. The API may not be deployed at this origin.", { status: response.status });
  }
  if (!response.ok || payload?.ok === false) {
    throw new CliError(payload?.error?.code || "API_ERROR", payload?.error?.message || "API request failed.", {
      status: response.status,
      ...(payload?.error?.details || {}),
      ...(response.headers.get("retry-after") ? { retryAfter: response.headers.get("retry-after") } : {}),
    });
  }
  return payload;
}
