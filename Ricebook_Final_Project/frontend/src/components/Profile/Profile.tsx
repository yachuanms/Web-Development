import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../../config";
import { setStoredUsername } from "../../utils/authStorage";

type ProfileResponse = {
  username: string;
  display: string;
  email: string;
  zipcode: string;
  phone: string;
  dob: string;
  avatar: string;
  headline?: string;
};

type AuthProvider = {
  provider: string;
  providerId?: string;
  email?: string;
};

type AuthState = {
  providers: AuthProvider[];
  hasLocalPassword: boolean;
};

const API = API_BASE_URL;

export default function Profile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [form, setForm] = useState({
    display: "",
    email: "",
    phone: "",
    zipcode: "",
    dob: "",
  });
  const [passwords, setPasswords] = useState({ password: "", confirm: "" });
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [authState, setAuthState] = useState<AuthState>({ providers: [], hasLocalPassword: false });
  const [isSaving, setIsSaving] = useState(false);
  const [isAvatarUploading, setIsAvatarUploading] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch(`${API}/profile`, { credentials: "include" });
        const data = await res.json();
        if (data.error) {
          setError(data.error);
          return;
        }
        setProfile(data);
        setForm({
          display: data.display || data.username,
          email: data.email || "",
          phone: data.phone || "",
          zipcode: data.zipcode || "",
          dob: data.dob ? data.dob.substring(0, 10) : "",
        });
        setStoredUsername(data.username);
        if (data.avatar) {
          localStorage.setItem("avatar", data.avatar);
        }
      } catch (err) {
        console.error("Failed to load profile", err);
        setError("Unable to load profile information.");
      }
    }

    async function loadAuthState() {
      try {
        const res = await fetch(`${API}/auth/me`, { credentials: "include" });
        const data = await res.json();
        if (data.loggedIn) {
          setAuthState({
            providers: data.providers || [],
            hasLocalPassword: Boolean(data.hasLocalPassword),
          });
        }
      } catch (err) {
        console.error("Failed to load auth state", err);
      }
    }

    loadProfile();
    loadAuthState();
  }, []);

  function updateFormField(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch(`${API}/profile`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setProfile(data);
        setMessage("Profile updated successfully.");
      }
    } catch (err) {
      console.error("Failed to update profile", err);
      setError("Unable to save profile changes.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsAvatarUploading(true);
    setMessage(null);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await fetch(`${API}/avatar`, {
        method: "PUT",
        credentials: "include",
        body: formData,
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setProfile((prev) => (prev ? { ...prev, avatar: data.avatar } : prev));
        localStorage.setItem("avatar", data.avatar);
        setMessage("Avatar updated.");
      }
    } catch (err) {
      console.error("Failed to upload avatar", err);
      setError("Unable to update avatar.");
    } finally {
      setIsAvatarUploading(false);
      e.target.value = "";
    }
  }

  async function handlePasswordUpdate() {
    setMessage(null);
    setError(null);
    if (!passwords.password) {
      setError("Please enter a new password.");
      return;
    }
    if (passwords.password !== passwords.confirm) {
      setError("Passwords do not match.");
      return;
    }
    try {
      const res = await fetch(`${API}/password`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ newPassword: passwords.password }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setMessage("Password updated.");
        setPasswords({ password: "", confirm: "" });
      }
    } catch (err) {
      console.error("Failed to update password", err);
      setError("Unable to update password.");
    }
  }

  function handleLinkGoogle() {
    window.location.href = `${API}/auth/google/link`;
  }

  async function handleUnlinkGoogle() {
    setMessage(null);
    setError(null);
    try {
      const res = await fetch(`${API}/auth/link/google`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setAuthState((prev) => ({
          ...prev,
          providers: data.providers || prev.providers,
        }));
        setMessage("Google account unlinked.");
      }
    } catch (err) {
      console.error("Failed to unlink google", err);
      setError("Unable to unlink Google right now.");
    }
  }

  if (!profile) {
    return (
      <div className="container mt-5 text-center text-muted" style={{ maxWidth: 520 }}>
        Loading profile...
      </div>
    );
  }

  const isGoogleLinked = authState.providers.some((p) => p.provider === "google");
  const authSummary = [
    authState.hasLocalPassword ? "local" : null,
    ...authState.providers.map((p) => p.provider),
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
        <div>
          <h2 className="text-primary mb-0">Profile</h2>
          <small className="text-muted">Signed in as @{profile.username}</small>
        </div>
        <button className="btn btn-outline-secondary" onClick={() => navigate("/")}>
          Back to Main
        </button>
      </div>

      {(message || error) && (
        <div className={`alert ${error ? "alert-danger" : "alert-success"} py-2 mb-4`}>
          {error || message}
        </div>
      )}

      <div className="row g-4">
        <div className="col-lg-4">
          <div className="card h-100 shadow-sm border-0">
            <div className="card-body text-center">
              <img
                src={profile.avatar || `https://i.pravatar.cc/150?u=${profile.username}`}
                alt="avatar"
                className="rounded-circle shadow-sm mb-3"
                width={140}
                height={140}
              />
              <p className="text-muted small mb-3">Visible everywhere on RiceBook</p>
              <label className="btn btn-outline-primary btn-sm w-100 mb-2">
                {isAvatarUploading ? "Uploading..." : "Change Avatar"}
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={handleAvatarChange}
                  disabled={isAvatarUploading}
                />
              </label>
              <div className="bg-light rounded p-2 text-start small">
                <div><strong>Display:</strong> {form.display || profile.username}</div>
                <div><strong>Email:</strong> {form.email || "—"}</div>
                <div><strong>Providers:</strong> {authSummary || "local only"}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-8">
          <div className="card shadow-sm border-0 mb-4">
            <div className="card-header bg-white border-0 pb-0">
              <h5 className="mb-1">Profile Details</h5>
              <small className="text-muted">Update your contact info and birthday</small>
            </div>
            <div className="card-body">
              <form onSubmit={handleSaveProfile}>
                <div className="row g-3">
                  <div className="col-sm-6">
                    <label className="form-label">Display Name</label>
                    <input
                      className="form-control"
                      value={form.display}
                      onChange={(e) => updateFormField("display", e.target.value)}
                    />
                  </div>
                  <div className="col-sm-6">
                    <label className="form-label">Email</label>
                    <input
                      className="form-control"
                      type="email"
                      value={form.email}
                      onChange={(e) => updateFormField("email", e.target.value)}
                    />
                  </div>
                  <div className="col-sm-6">
                    <label className="form-label">Phone</label>
                    <input
                      className="form-control"
                      value={form.phone}
                      onChange={(e) => updateFormField("phone", e.target.value)}
                    />
                  </div>
                  <div className="col-sm-6">
                    <label className="form-label">Zipcode</label>
                    <input
                      className="form-control"
                      value={form.zipcode}
                      onChange={(e) => updateFormField("zipcode", e.target.value)}
                    />
                  </div>
                  <div className="col-sm-6">
                    <label className="form-label">Birthday</label>
                    <input
                      className="form-control"
                      type="date"
                      value={form.dob}
                      onChange={(e) => updateFormField("dob", e.target.value)}
                    />
                  </div>
                </div>
                <button className="btn btn-success w-100 mt-3" type="submit" disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save Profile"}
                </button>
              </form>
            </div>
          </div>

          <div className="row g-4">
            <div className="col-md-6">
              <div className="card shadow-sm border-0 h-100">
                <div className="card-body">
                  <h5 className="mb-3">Change Password</h5>
                  <input
                    className="form-control mb-2"
                    type="password"
                    placeholder="New Password"
                    value={passwords.password}
                    onChange={(e) => setPasswords((prev) => ({ ...prev, password: e.target.value }))}
                  />
                  <input
                    className="form-control mb-3"
                    type="password"
                    placeholder="Confirm Password"
                    value={passwords.confirm}
                    onChange={(e) => setPasswords((prev) => ({ ...prev, confirm: e.target.value }))}
                  />
                  <button className="btn btn-outline-primary w-100" onClick={handlePasswordUpdate}>
                    Update Password
                  </button>
                </div>
              </div>
            </div>

            <div className="col-md-6">
              <div className="card shadow-sm border-0 h-100">
                <div className="card-body">
                  <h5 className="mb-2">Account Linking</h5>
                  <p className="small text-muted mb-3">
                    Manage Google linking without affecting your local login.
                  </p>
                  {isGoogleLinked ? (
                    <button className="btn btn-outline-danger w-100" onClick={handleUnlinkGoogle}>
                      Unlink Google Account
                    </button>
                  ) : (
                    <button className="btn btn-outline-danger w-100" onClick={handleLinkGoogle}>
                      Link Google Account
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
