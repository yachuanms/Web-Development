import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../../config";
import { setStoredUsername } from "../../utils/authStorage";

const API = API_BASE_URL;

export default function Landing() {
  const [pwd, setPwd] = useState("");
  const [account, setAccount] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    async function checkExistingSession() {
      try {
        const res = await fetch(`${API}/auth/me`, { credentials: "include" });
        const data = await res.json();
        if (data.loggedIn) {
          setStoredUsername(data.username);
          navigate("/");
        }
      } catch (err) {
        console.error("Failed to check session", err);
      }
    }

    checkExistingSession();
  }, [navigate]);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    let googleStatus = searchParams.get("google");
    let fromHash = false;

    if (!googleStatus && window.location.hash.includes("google=")) {
      const [, hashQuery = ""] = window.location.hash.split("?");
      if (hashQuery) {
        const hashParams = new URLSearchParams(hashQuery);
        googleStatus = hashParams.get("google");
        fromHash = Boolean(googleStatus);
      }
    }

    if (!googleStatus) {
      return;
    }

    async function verifyGoogleLogin() {
      const MAX_ATTEMPTS = 3;
      const DELAY_MS = 600;

      async function delay(ms: number) {
        return new Promise((resolve) => setTimeout(resolve, ms));
      }

      try {
        for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
          const res = await fetch(`${API}/auth/me`, { credentials: "include" });
          const data = await res.json();

          if (data.loggedIn) {
            setStoredUsername(data.username);
            navigate("/");
            return;
          }

          if (attempt < MAX_ATTEMPTS) {
            await delay(DELAY_MS);
          }
        }

        if (googleStatus === "success") {
          setError("Google login was not completed. Please try again.");
        } else if (googleStatus === "fail") {
          setError("Google login was cancelled.");
        }
      } catch (err) {
        setError("Unable to verify Google login.");
        console.error("Failed to verify auth state", err);
      } finally {
        if (fromHash) {
          const hashPath = window.location.hash.split("?")[0] || "";
          window.history.replaceState({}, document.title, window.location.pathname);
          window.location.hash = hashPath;
        } else {
          searchParams.delete("google");
          const remaining = searchParams.toString();
          const newUrl = `${window.location.pathname}${remaining ? `?${remaining}` : ""}${window.location.hash}`;
          window.history.replaceState({}, document.title, newUrl);
        }
      }
    }

    verifyGoogleLogin();
  }, [navigate]);

  function handleLogin() {
    fetch(`${API}/login`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: account,
        password: pwd,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setStoredUsername(data.username);
          navigate("/");
        }
      })
      .catch(() => setError("Server error"));
  }

  function handleGoogleLogin() {
    window.location.href = `${API}/auth/google`;
  }

  return (
    <div className="container mt-4" style={{ maxWidth: 420 }}>
      <h2 className="text-center mb-4 fw-bold text-primary">
        Welcome to RiceBook
      </h2>

      {/* 登入 */}
      <div className="card shadow-sm p-4 mb-4 border-0">
        <h5 className="text-center text-secondary mb-3">Login</h5>
        <input
          className="form-control mb-2"
          placeholder="Username (joey)"
          value={account}
          onChange={(e) => setAccount(e.target.value)}
        />
        <input
          className="form-control mb-2"
          type="password"
          placeholder="Password (pass)"
          value={pwd}
          onChange={(e) => setPwd(e.target.value)}
        />
        <button className="btn btn-primary w-100 mb-2" onClick={handleLogin}>
          Login
        </button>
        <button className="btn btn-danger w-100" onClick={handleGoogleLogin}>
          <i className="bi bi-google me-2"></i>
          Login with Google
        </button>
        {error && <p className="text-danger mt-2">{error}</p>}
      </div>

      {/* 註冊 */}
      <Register />
    </div>
  );
}

// ==================== Register ====================

function Register() {
  const [account, setAccount] = useState("");
  const [display, setDisplay] = useState("");
  const [pwd, setPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [birthday, setBirthday] = useState("");
  const [email, setEmail] = useState("");
  const [zipcode, setZipcode] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  function isOver18(birthday: string){
    const today = new Date();
    const birthDate = new Date(birthday);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if(m<0 || (m === 0 && today.getDate() < birthDate.getDate())){
      age--;
    }
    return age >= 18;
  }

  function handleRegister() {
    if (!account || !display || !pwd || !confirmPwd || !email || !zipcode || !phone || !birthday) {
      setError("All fields are required!");
      return;
    }
    if (pwd !== confirmPwd) {
      setError("Passwords do not match!");
      return;
    }

    if (email && !/^[\w.-]+@[\w.-]+\.[A-Za-z]{2,}$/.test(email)) {
      setError("Invalid email format.");
      return;
    }

    if (zipcode && !/^\d{5}$/.test(zipcode)) {
      setError("Zipcode must be 5 digits.");
      return;
    }

    if (phone && !/^\d{3}-\d{3}-\d{4}$/.test(phone)) {
      setError("Phone must be in 123-456-7890 format.");
      return;
    }

    if (!isOver18(birthday)) {
      setError("You must be at least 18 years old to register!");
      return;
    }

    fetch(`${API}/register`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: account,
        password: pwd,
        display,
        email,
        zipcode,
        dob: birthday,
        phone,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setStoredUsername(data.username);
          setError("");
          navigate("/");
        }
      })
      .catch(() => setError("Server error"));
  }

  return (
    <div className="card shadow-sm p-4 border-0">
      <h5 className="text-center text-success mb-3">Register</h5>
      <input
        className="form-control mb-2"
        placeholder="Account name (username)"
        value={account}
        onChange={(e) => setAccount(e.target.value)}
      />
      <input
        className="form-control mb-2"
        placeholder="Display name"
        value={display}
        onChange={(e) => setDisplay(e.target.value)}
      />
      <input
        className="form-control mb-2"
        type="password"
        placeholder="Password"
        value={pwd}
        onChange={(e) => setPwd(e.target.value)}
      />
      <input
        className="form-control mb-2"
        type="password"
        placeholder="Confirm Password"
        value={confirmPwd}
        onChange={(e) => setConfirmPwd(e.target.value)}
      />
      <input
        className="form-control mb-2"
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        className="form-control mb-2"
        type="date"
        max={new Date().toISOString().split("T")[0]} // 不能選未來日期
        placeholder="Birthday"
        value={birthday}
        onChange={(e) => setBirthday(e.target.value)}
      />
      <input
        className="form-control mb-2"
        placeholder="Zipcode"
        value={zipcode}
        onChange={(e) => setZipcode(e.target.value)}
      />
      <input
        className="form-control mb-2"
        placeholder="Phone"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />
      <button className="btn btn-success w-100" onClick={handleRegister}>
        Register
      </button>
      {error && <p className="text-danger mt-2">{error}</p>}
    </div>
  );
}
