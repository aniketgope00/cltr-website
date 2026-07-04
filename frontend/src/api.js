const API_ROOT = import.meta.env.VITE_API_BASE_URL ?? "/api";

async function readJson(response) {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.detail || payload.message || "Something went wrong.");
  }
  return payload;
}

export async function fetchWaitlistOverview(signal) {
  const response = await fetch(`${API_ROOT}/waitlist/overview`, { signal });
  return readJson(response);
}

export async function joinWaitlist(email) {
  const response = await fetch(`${API_ROOT}/waitlist/join`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email }),
  });
  return readJson(response);
}

export async function saveWaitlistInterests(entryId, interests) {
  const response = await fetch(`${API_ROOT}/waitlist/${entryId}/interests`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ interests }),
  });
  return readJson(response);
}
