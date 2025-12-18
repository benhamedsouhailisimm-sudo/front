import { Html5Qrcode } from "html5-qrcode";
import { useRef, useState } from "react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function Scanner() {
  const html5QrcodeRef = useRef(null);
  const [member, setMember] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [already, setAlready] = useState(false);
  const [error, setError] = useState("");

  /* ---------------- START SCAN ---------------- */
  const startScan = async () => {
    setMember(null);
    setError("");
    setScanning(true);

    setTimeout(async () => {
      html5QrcodeRef.current = new Html5Qrcode("qr-reader");
      try {
        await html5QrcodeRef.current.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 300, height: 300 } },
          async (decodedText) => {
            await handleDecoded(decodedText);
          },
          (errMsg) => console.warn("Scan warning:", errMsg)
        );
      } catch (err) {
        console.error("Cannot start scanner:", err);
        setError("❌ Cannot access camera");
        setScanning(false);
      }
    }, 100);
  };

  /* ---------------- STOP SCAN ---------------- */
  const stopScan = async () => {
    try {
      if (html5QrcodeRef.current) {
        await html5QrcodeRef.current.stop();
        await html5QrcodeRef.current.clear();
        html5QrcodeRef.current = null;
      }
    } catch (err) {
      console.warn("Stop scan error:", err);
    }
    setScanning(false);
  };

  /* ---------------- HANDLE QR RESULT ---------------- */
  const handleDecoded = async (decodedText) => {
    try {
      let memberId;
      try {
        const parsed = JSON.parse(decodedText);
        memberId = parsed.id;
      } catch {
        memberId = decodedText;
      }

      if (!memberId) throw new Error("❌ QR code does not contain an ID");

      // 1️⃣ تحقق أولاً إذا كان العضو دخل مسبقًا
      const checkRes = await fetch(`${BACKEND_URL}/hisenter/${memberId}`);
      if (checkRes.status === 404) {
        setError("❌ Member not found");
        await stopScan();
        return;
      }
      const checkData = await checkRes.json();
      const alreadyEntered = checkData.entered;

      // 2️⃣ جلب معلومات العضو
      const res = await fetch(`${BACKEND_URL}/members/${memberId}`);
      const result = await res.json();

      const simplifiedMember = {
        id: result.id,
        name: result.name,
        group_id: result.group_id,
        access: result.has_access_today,
        entered: alreadyEntered,
      };

      if (!simplifiedMember.access) {
        setError("❌ لا يملك العضو إذن الدخول اليوم");
      } else if (!simplifiedMember.entered) {
        // تسجيل الدخول للمرة الأولى
        const enterRes = await fetch(`${BACKEND_URL}/members/${simplifiedMember.id}/enter`, { method: "POST" });
        if (enterRes.ok) {
          simplifiedMember.entered = true;
        }
      }

      setAlready(alreadyEntered);
      setMember(simplifiedMember);
      await stopScan();
    } catch (err) {
      console.error(err);
      setError(err.message);
      await stopScan();
    }
  };

  /* ---------------- UI ---------------- */
  return (
    <div style={styles.container}>
      <h1 style={styles.title}>ماسح QR</h1>

      {!scanning && !member && (
        <div style={styles.cameraBox} onClick={startScan}>
          <div style={styles.cameraIcon}>📷</div>
          <p style={styles.cameraText}>اضغط لفتح الكاميرا</p>
        </div>
      )}

      {scanning && (
        <div style={styles.cameraBox}>
          <div id="qr-reader" style={styles.qrReader}></div>
          <button style={styles.stopButton} onClick={stopScan}>
            إيقاف الكاميرا
          </button>
        </div>
      )}

      {member && (
        <div style={styles.memberCard}>
          <h2 style={styles.memberName}>{member.name}</h2>
          <p>رقم المجموعة: {member.group_id}</p>

          <div
            style={{
              ...styles.accessBadge,
              backgroundColor: member.access ? "#dcfce7" : "#fee2e2",
              color: member.access ? "#166534" : "#991b1b",
            }}
          >
            {member.access ? "✅ دخول مسموح" : "❌ لا يملك إذن الدخول"}
          </div>

          {member.access && (
            <div
              style={{
                ...styles.accessBadge,
                backgroundColor: member.entered ? "#16da61ff" : "#facc15",
                color: "#000",
              }}
            >
              {already ? "⚠️ تم دخول العضو مسبقًا" : member.entered ? "✅ تم الدخول" : "❌ لم يتم الدخول"}
            </div>
          )}

          <button
            style={styles.button}
            onClick={async () => {
              // مباشرة امسح مرة ثانية بدون فتح الكاميرا
              setError("");
              if (member) {
                await handleDecoded(member.id);
              }
            }}
          >
            مسح مرة أخرى
          </button>
        </div>
      )}
    </div>
  );
}

/* ---------------- STYLES ---------------- */
const styles = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(135deg,#e0e7ff,#f8fafc)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: 15,
  },
  title: { fontSize: "5vw", fontWeight: "bold", marginBottom: 20, color: "#1e40af", textAlign: "center" },
  cameraBox: {
    width: "70vw",
    maxWidth: 350,
    height: "70vw",
    maxHeight: 350,
    borderRadius: 20,
    border: "3px solid #2563eb",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    background: "#f8fafc",
    boxShadow: "0 15px 30px rgba(0,0,0,0.1)",
    cursor: "pointer",
    transition: "all 0.3s ease",
  },
  cameraIcon: { fontSize: "12vw", marginBottom: 10 },
  cameraText: { fontSize: "4.5vw", fontWeight: "bold", color: "#2563eb", textAlign: "center" },
  qrReader: { width: "85vw", maxWidth: 300, height: "85vw", maxHeight: 300, borderRadius: 12, overflow: "hidden" },
  stopButton: { background: "#dc2626", color: "#fff", padding: "3vw 5vw", fontSize: "4vw", borderRadius: 12, border: "none", cursor: "pointer", marginTop: 15 },
  memberCard: { marginTop: 30, padding: 30, backgroundColor: "#fff", borderRadius: 16, boxShadow: "0 10px 25px rgba(0,0,0,0.1)", width: "90vw", maxWidth: 380, textAlign: "center" },
  memberName: { fontSize: 26, fontWeight: "bold", marginBottom: 10 },
  accessBadge: { padding: "12px 18px", borderRadius: 12, fontSize: 18, fontWeight: "bold", marginBottom: 15 },
  button: { background: "#2563eb", color: "#fff", padding: "3vw 5vw", fontSize: "4vw", borderRadius: 12, border: "none", cursor: "pointer", marginTop: 15 },
};
