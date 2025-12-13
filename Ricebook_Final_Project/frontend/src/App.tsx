import Main from "./components/Main/Main"
import Landing from "./components/Landing/Landing"
import Profile from "./components/Profile/Profile"
//import { Routes, Route } from "react-router-dom"

/*
function App() {
  return (
    <div style={{ width: "500px", margin: "0 auto" }}>
      <Routes>
        <Route path="/" element={<Main />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/landing" element={<Landing />} />
      </Routes>
    </div>
  )
}

export default App
*/

import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AUTH_EVENT, getStoredUsername } from "./utils/authStorage";


export default function App() {
  const [username, setUsername] = useState<string | null>(getStoredUsername());

  useEffect(() => {
    const handleAuthChange = () => {
      setUsername(getStoredUsername());
    };

    window.addEventListener(AUTH_EVENT, handleAuthChange);
    window.addEventListener("storage", handleAuthChange);

    return () => {
      window.removeEventListener(AUTH_EVENT, handleAuthChange);
      window.removeEventListener("storage", handleAuthChange);
    };
  }, []);

  return (
    <BrowserRouter basename="/">
      <Routes>
        {/* 預設首頁 */}
        <Route
          path="/"
          element={
            username ? (
              <Navigate to="/main" replace />
            ) : (
              <Navigate to="/landing" replace />
            )
          }
        />

        {/* 登入頁 */}
        <Route path="/landing" element={<Landing />} />

        {/* 主頁 */}
        <Route
          path="/main"
          element={
            username ? <Main /> : <Navigate to="/landing" replace />
          }
        />

        {/* 個人資料頁 */}
        <Route
          path="/profile"
          element={
            username ? <Profile /> : <Navigate to="/landing" replace />
          }
        />

        {/* 兜底路由 */}
        <Route path="*" element={<p>Page not found 😢</p>} />
      </Routes>
    </BrowserRouter>
  );
}
