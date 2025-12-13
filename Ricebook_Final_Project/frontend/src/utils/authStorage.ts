export const AUTH_EVENT = "auth-change";

export function getStoredUsername(): string | null {
  return localStorage.getItem("username");
}

export function setStoredUsername(username: string | null) {
  if (username) {
    localStorage.setItem("username", username);
  } else {
    localStorage.removeItem("username");
  }
  window.dispatchEvent(new CustomEvent(AUTH_EVENT, { detail: username }));
}
