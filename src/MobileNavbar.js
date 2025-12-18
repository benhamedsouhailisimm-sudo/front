import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import tunImage from "./tun4.png";

export default function MobileNavbar() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user") || "null");
    if (storedUser) setUser(storedUser);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <>
      {/* NAVBAR */}
<div style={styles.navbar} dir="ltr">
        {/* LEFT */}
        <div style={styles.left}>
          <img src={tunImage} alt="Tunisia" style={styles.image} />
        </div>

        {/* CENTER */}
        <div style={styles.center}>
          {user && <span style={styles.centerTitle}>{user.name}</span>}
        </div>

        {/* RIGHT */}
        <div style={styles.right}>
          <button onClick={() => setOpen(!open)} style={styles.menuBtn}>
            ☰
          </button>
        </div>
      </div>

      {/* MENU */}
      {open && (
        <div style={styles.menu}>
          <button style={styles.menuItem} onClick={handleLogout}>
            🚪 تسجيل الخروج
          </button>
        </div>
      )}
    </>
  );
}
const styles = {
  navbar: {
    height: 56,
    backgroundColor: "#021414ff",
    color: "#fff",
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    display: "flex",
    alignItems: "center",
    padding: "0 12px",
  },

  left: {
    width: 60,
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-start",
  },

  center: {
    flex: 1,
    textAlign: "center",
  },

  right: {
    width: 60,
    display: "flex",
    justifyContent: "flex-end",
  },

  centerTitle: {
    fontSize: 16,
    fontWeight: "bold",
    whiteSpace: "nowrap",
  },

  menuBtn: {
    fontSize: 24,
    background: "none",
    border: "none",
    color: "#fff",
    cursor: "pointer",
  },

  menu: {
    position: "fixed",
    top: 56,
    right: 10,
    backgroundColor: "#fff",
    borderRadius: 10,
    boxShadow: "0 5px 20px rgba(0,0,0,0.15)",
    zIndex: 999,
    width: 180,
  },

  menuItem: {
    width: "100%",
    padding: 14,
    border: "none",
    background: "none",
    textAlign: "left",
    fontSize: 16,
    cursor: "pointer",
  },

  image: {
    height: 62,
    objectFit: "contain",
  },
};
