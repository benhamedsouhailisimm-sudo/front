import { useState, useEffect } from "react";
import axios from "axios";
import JSZip from "jszip"; // npm install jszip
import { saveAs } from "file-saver"; // npm install file-saver

export default function DownloadQRs() {
  const [members, setMembers] = useState([]);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/members`);
        // Expecting array of members with qr_code and name
        setMembers(res.data);
        console.log(res.data)
      } catch (err) {
        console.error("Failed to fetch members:", err);
      }
    };

    fetchMembers();
  }, []);

  const downloadAll = async () => {
    const zip = new JSZip();
    console.log(members)
    members.forEach((member) => {
      if (member.qr_code) {
        // Remove base64 prefix if exists
        const base64Data = member.qr_code.replace(/^data:image\/png;base64,/, "");
        zip.file(`${member.name}.png`, base64Data, { base64: true });
      }
    });

    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, "qr_codes.zip");
  };

  return (
    <div style={{ padding: 16 }}>
      <h2>Download QR Codes</h2>
      <button onClick={downloadAll} style={styles.button}>
        Download All QR Codes
      </button>

      <ul>
        {members.map((m) => (
          <li key={m.id}>
            {m.name}{" "}
            <a
              href={m.qr_code}
              download={`${m.name}.png`}
              target="_blank"
              rel="noreferrer"
            >
              Download
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

const styles = {
  button: {
    padding: "8px 16px",
    border: "none",
    borderRadius: 6,
    backgroundColor: "#1e90ff",
    color: "#fff",
    cursor: "pointer",
    marginBottom: 12,
  },
};
