import { useEffect, useState } from "react";
import { API_BASE_URL } from "../../../config";

export type FollowUser = {
  name: string;
  headline: string;
  avatar: string;
};

export default function Sidebar({
  onFollowersChange,
}: {
  onFollowersChange: (followers: FollowUser[]) => void;
}) {
  const [followers, setFollowers] = useState<FollowUser[]>([]);
  const [newUser, setNewUser] = useState("");

  const backend = API_BASE_URL;

  async function getFollowerProfile(name: string) {
    const res = await fetch(`${backend}/profile/${name}`, {
      credentials: "include",
    });
    const data = await res.json();

    if (data.error) {
      throw new Error(data.error);
    }

    return {
      name,
      headline: data.headline || "No headline",
      avatar:
        data.avatar && data.avatar.trim()
          ? data.avatar
          : `https://i.pravatar.cc/100?u=${name}`,
    } satisfies FollowUser;
  }

  useEffect(() => {
    async function loadFollowing() {
      const res = await fetch(`${backend}/following`, {
        credentials: "include",
      });
      const data = await res.json();

      if (!data.following) return;

      const result: FollowUser[] = [];
      for (const name of data.following) {
        try {
          const info = await getFollowerProfile(name);
          result.push(info);
        } catch (err) {
          console.error("Failed to fetch follower profile", err);
        }
      }

      setFollowers(result);
      onFollowersChange(result);
    }

    loadFollowing();
  }, [onFollowersChange]);

  async function handleAddUser() {
    if (!newUser.trim()) return;

    const res = await fetch(`${backend}/following/${newUser}`, {
      method: "PUT",
      credentials: "include",
    });
    const data = await res.json();

    if (data.error) {
      alert(data.error);
      return;
    }

    const updated: FollowUser[] = [];
    for (const name of data.following) {
      try {
        const info = await getFollowerProfile(name);
        updated.push(info);
      } catch (err) {
        console.error("Failed to fetch follower profile", err);
      }
    }

    setFollowers(updated);
    onFollowersChange(updated);
    setNewUser("");
  }

  async function handleUnfollow(name: string) {
    const res = await fetch(`${backend}/following/${name}`, {
      method: "DELETE",
      credentials: "include",
    });

    const data = await res.json();

    const updated: FollowUser[] = [];

    for (const n of data.following) {
      try {
        const info = await getFollowerProfile(n);
        updated.push(info);
      } catch (err) {
        console.error("Failed to fetch follower profile", err);
      }
    }

    setFollowers(updated);
    onFollowersChange(updated);
  }

  return (
    <div className="card p-3 shadow-sm" style={{ backgroundColor: "#f9fafb" }}>
      <h5 className="mb-3 text-primary">Following</h5>

      {followers.length === 0 ? (
        <p className="text-muted text-center mb-3">You have no followers yet.</p>
      ) : (
        followers.map((user) => (
          <div
            key={user.name}
            className="d-flex align-items-center justify-content-between mb-2"
          >
            <div className="d-flex align-items-center gap-2">
              <img
                src={user.avatar}
                alt={user.name}
                width={40}
                height={40}
                className="rounded-circle"
              />
              <div>
                <strong>{user.name}</strong>
                <p className="mb-0 small text-muted">{user.headline}</p>
              </div>
            </div>
            <button
              className="btn btn-sm btn-outline-danger"
              onClick={() => handleUnfollow(user.name)}
            >
              Unfollow
            </button>
          </div>
        ))
      )}

      {/* 新增追蹤者欄位（新註冊使用者也有） */}
      <div className="input-group mt-3">
        <input
          className="form-control"
          placeholder="Add new user..."
          value={newUser}
          onChange={(e) => setNewUser(e.target.value)}
        />
        <button className="btn btn-success" onClick={handleAddUser}>
          Add
        </button>
      </div>
    </div>
  );
}
