import { useState } from "react";
import UserInfo from "../Auth/UserInfo";
import Posts from "./Posts/Posts";
import Sidebar from "./Sidebar/Sidebar";
import type { FollowUser } from "./Sidebar/Sidebar";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../../config";
import { setStoredUsername } from "../../utils/authStorage";

const BACKEND_URL = API_BASE_URL;

export default function Main() {
  const navigate = useNavigate();
  const [followers, setFollowers] = useState<FollowUser[]>([]);

  async function handleLogout() {
    try {
      await fetch(`${BACKEND_URL}/logout`, {
        method: "PUT",
        credentials: "include",
      });
    } catch (e) {
      console.error("Logout request failed", e);
    }

    setStoredUsername(null);
    localStorage.removeItem("headline");
    localStorage.removeItem("avatar");
    Object.keys(localStorage)
      .filter((k) => k.startsWith("myPosts_"))
      .forEach((k) => localStorage.removeItem(k));

    navigate("/landing");
  }

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        gap: "50px",
        padding: "20px 40px",
        maxWidth: "1400px",
        margin: "0 auto",
      }}
    >
      <div style={{ flex: 2, minWidth: "600px" }}>
        <h1 className="text-primary mb-4">My Feed</h1>
        <UserInfo />
        <Posts followers={followers} />
      </div>

      <div
        style={{
          flex: 1,
          minWidth: "320px",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: "20px",
        }}
      >
        <div className="d-flex gap-2">
          <button
            className="btn btn-outline-secondary"
            onClick={() => navigate("/profile")}
          >
            Profile
          </button>
          <button className="btn btn-outline-danger" onClick={handleLogout}>
            Logout
          </button>
        </div>
        <Sidebar onFollowersChange={setFollowers} />
      </div>
    </div>
  );
}
