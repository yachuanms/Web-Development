import { useEffect, useState } from "react";
import { API_BASE_URL } from "../../config";
import { setStoredUsername } from "../../utils/authStorage";

const BACKEND_URL = API_BASE_URL;

type Profile = {
  username: string;
  display: string;
  headline: string;
  avatar: string;
};

export default function UserInfo() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [headline, setHeadline] = useState("Loading...");
  const [newHeadline, setNewHeadline] = useState("");

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch(`${BACKEND_URL}/profile`, {
          credentials: "include",
        });
        const data = await res.json();
        if (data.username) {
          setProfile({
            username: data.username,
            display: data.display || data.username,
            headline: data.headline || "",
            avatar:
              data.avatar ||
              `https://i.pravatar.cc/100?u=${data.username}`,
          });
          setHeadline(data.headline || "");
          setStoredUsername(data.username);
        }
      } catch (e) {
        console.error("Failed to load profile", e);
      }
    }

    loadProfile();
  }, []);

  async function handleUpdateHeadline() {
    if (!newHeadline.trim()) return;

    const res = await fetch(`${BACKEND_URL}/headline`, {
      method: "PUT",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ headline: newHeadline }),
    });

    const data = await res.json();

    if (data.error) {
      alert(data.error);
    } else {
      setHeadline(data.headline);
      setNewHeadline("");
    }
  }

  if (!profile) {
    return <div className="card p-3 mb-4 shadow-sm">Loading...</div>;
  }

  return (
    <div className="card p-3 mb-4 shadow-sm d-flex flex-row align-items-center">
      <img
        src={profile.avatar}
        alt="User avatar"
        className="rounded-circle me-3 shadow-sm"
        width={80}
        height={80}
      />
      <div className="flex-grow-1">
        <h5 className="mb-1 text-primary">{profile.display}</h5>
        <small className="text-muted d-block mb-1">
          @{profile.username}
        </small>
        <p className="mb-2">{headline}</p>
        <div className="input-group">
          <input
            className="form-control"
            placeholder="Update your headline..."
            value={newHeadline}
            onChange={(e) => setNewHeadline(e.target.value)}
          />
          <button
            className="btn btn-outline-primary"
            onClick={handleUpdateHeadline}
          >
            Update
          </button>
        </div>
      </div>
    </div>
  );
}
