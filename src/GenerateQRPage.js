import { useState } from "react";


const BACKEND_URL =
  process.env.REACT_APP_BACKEND_URL || "http://localhost:4000";

export default function GenerateQRPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const generateAllQRCodes = async () => {
    setLoading(true);
    setMessage("");

    try {
      const token = localStorage.getItem("token"); // or wherever you store JWT
      const res = await fetch(`${BACKEND_URL}/generate-all-qr`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (res.ok) {
        setMessage(data.message || "All QR codes generated successfully ✅");
      } else {
        setMessage(data.message || "Error generating QR codes ❌");
      }
    } catch (err) {
      console.error(err);
      setMessage("Server error ⚠️");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Generate QR Codes</h1>
      <button
        style={styles.button}
        onClick={generateAllQRCodes}
        disabled={loading}
      >
        {loading ? "Generating..." : "Generate All QR Codes"}
      </button>
      {message && <p style={styles.message}>{message}</p>}
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#f0f2f5",
  },
  title: { fontSize: 28, fontWeight: "bold", marginBottom: 20 },
  button: {
    backgroundColor: "#1e90ff",
    color: "#fff",
    fontSize: 18,
    padding: "10px 20px",
    border: "none",
    borderRadius: 10,
    cursor: "pointer",
  },
  message: { marginTop: 20, fontSize: 16 },
};
