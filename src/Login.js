import axios, { isAxiosError } from "axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import tunImage from "./tun5.jpg";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [loggedUser, setLoggedUser] = useState(null);
  const [Myerror, seterror] = useState(false);

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (user) setLoggedUser(JSON.parse(user));
  }, []);

  useEffect(() => {
    if (loggedUser) {
      if (loggedUser.role === "admin") navigate("/admin");
      else if (loggedUser.role === "group_responsible")
        navigate("/responsable");
      else if (loggedUser.role === "scanner") navigate("/scanner");
    }
  }, [loggedUser, navigate]);

  const handleLogin = async () => {
    seterror(false);
    if (!email || !password) return;

    setLoading(true);
    try {
      const res = await axios.post(`${BACKEND_URL}/login`, {
        email,
        password,
      });
      const user = res.data.user;
      localStorage.setItem("user", JSON.stringify(user));
      setLoggedUser(user);
    } catch (err) {
      if (isAxiosError(err)) seterror(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* BACKGROUND IMAGE */}
      <style>
        {`
  .login-input::placeholder {
    color: rgba(255, 255, 255, 1);
  }
`}
      </style>

      <div
        style={{
          ...styles.background,
          backgroundImage: `url(${tunImage})`,
        }}
      />

      {/* LOGIN CARD */}
      <div style={styles.formWrapper}>
        <input
          type="email"
          className="login-input"
          placeholder="البريد الإلكتروني"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={styles.input}
        />

        <input
          type="password"
          className="login-input"
          placeholder="كلمة المرور"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={styles.input}
        />

        {Myerror && (
          <div style={styles.errorMessage}>
            البريد الإلكتروني أو كلمة المرور غير صحيحة
          </div>
        )}

        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            ...styles.button,
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? "..." : "تسجيل الدخول"}
        </button>
      </div>
    </div>
  );
}

/* ================= STYLES ================= */

const styles = {
  container: {
    height: "100vh",
    width: "100vw",
    position: "relative",
    overflow: "hidden",
    fontFamily: "system-ui",
    backgroundColor: "#000",
  },

  background: {
    position: "absolute",
    inset: 0,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "center",
    backgroundSize: "cover", // fills screen
    transform: "scale(0.99)", // slight zoom (not huge)
  },
  formWrapper: {
    position: "absolute",
    inset: 0,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    gap: 14,
    padding: "0 20px",
    background: "rgba(0,0,0,0.15)", // very light overlay
  },

  input: {
    width: "100%",
    padding: 14,
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.6)",
    background: "rgba(255, 0, 0, 0)", // ✅ transparent
    color: "#fff",
    fontSize: 15,
    outline: "none",
    boxSizing: "border-box",
  },

  errorMessage: {
    background: "rgba(255,0,0,0.25)",
    color: "#fff",
    padding: 10,
    borderRadius: 10,
    fontSize: 14,
    textAlign: "center",
  },

  button: {
    marginTop: 200,
    padding: 14,
    borderRadius: 12,
    border: "none",
    background: "rgba(37,99,235,0.8)",
    color: "#fff",
    fontSize: 16,
    fontWeight: 700,
    cursor: "pointer",
    backdropFilter: "blur(4px)",
  },
};
