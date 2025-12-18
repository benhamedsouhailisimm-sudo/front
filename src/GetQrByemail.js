import { useState } from "react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function GetQRByID() {
  const [id, setId] = useState("");
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFetchQR = async () => {
    if (!id) {
      setError("Please enter member ID");
      return;
    }

    setLoading(true);
    setError("");
    setMember(null);

    try {
      const res = await fetch(`${BACKEND_URL}/members/${encodeURIComponent(id)}`);

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Member not found");
      }

      const data = await res.json();
      setMember(data);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Get Member QR Code by ID</h1>

      <input
        type="text"
        placeholder="Enter member ID"
        value={id}
        onChange={(e) => setId(e.target.value)}
        style={styles.input}
      />

      <button onClick={handleFetchQR} disabled={loading} style={styles.button}>
        {loading ? "Fetching..." : "Get QR Code"}
      </button>

      {error && <p style={styles.error}>{error}</p>}

      {member && (
        <div style={styles.qrContainer}>
          <h2 style={styles.memberName}>{member.name}</h2>
          <p>ID: {member.id}</p>
          <p>Group ID: {member.group_id}</p>
          {member.qr_code && (
            <img
              src={member.qr_code}
              alt={`QR Code for ${member.name}`}
              style={styles.qrImage}
            />
          )}
          <p style={{ color: member.access ? "#16a34a" : "#dc2626", fontWeight: "bold", marginTop: 10 }}>
            {member.access ? "✅ Access Granted" : "❌ Access Denied"}
          </p>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", padding: 20, backgroundColor: "#f0f4f8" },
  title: { fontSize: "1.8rem", fontWeight: "700", marginBottom: 20, color: "#1e90ff" },
  input: { padding: 12, fontSize: 16, width: "90%", maxWidth: 350, marginBottom: 15, borderRadius: 8, border: "1px solid #ccc" },
  button: { backgroundColor: "#1e90ff", color: "#fff", padding: "12px 25px", border: "none", borderRadius: 8, cursor: "pointer", marginBottom: 20 },
  error: { color: "red", marginBottom: 15, textAlign: "center" },
  qrContainer: { marginTop: 20, padding: 20, backgroundColor: "#fff", borderRadius: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.1)", width: "90%", maxWidth: 350, textAlign: "center" },
  memberName: { marginBottom: 10, fontSize: "1.4rem" },
  qrImage: { marginTop: 15, width: "80%", maxWidth: 250, height: "auto" },
};
