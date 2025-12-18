import axios from "axios";
import { useEffect, useState } from "react";

const BACKEND_URL = "https://your-ngrok-url.ngrok-free.dev";

export default function MemberQR({ memberId }) {
  const [qrUrl, setQrUrl] = useState("");

  useEffect(() => {
    const fetchQr = async () => {
      try {
        const res = await axios.get(`${BACKEND_URL}/members/${memberId}`);
        setQrUrl(res.data.qr_code);
      } catch (err) {
        console.error(err);
      }
    };
    fetchQr();
  }, [memberId]);

  return (
    <div style={{ textAlign: "center", marginTop: 50 }}>
      {qrUrl ? (
        <img src={qrUrl} alt="Member QR" style={{ width: 250, height: 250 }} />
      ) : (
        <p>No QR code found</p>
      )}
    </div>
  );
}
