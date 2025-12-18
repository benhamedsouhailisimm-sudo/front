import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import JSZip from "jszip"; // npm install jszip
import { saveAs } from "file-saver"; // npm install file-saver

export default function Admin() {
  const [groups, setGroups] = useState([]);
  const [selectedGroupName, setSelectedGroupName] = useState(null);
  const [editGroup, setEditGroup] = useState(null);
  const [loading, setLoading] = useState({});
  const [loadingAdd, setLoadingAdd] = useState(false);
  const [newMemberName, setNewMemberName] = useState("");
  const [members, setMembers] = useState([]);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const res = await axios.get(
          `${process.env.REACT_APP_BACKEND_URL}/members`
        );
        // Expecting array of members with qr_code and name
        setMembers(res.data);
        console.log(res.data);
      } catch (err) {
        console.error("Failed to fetch members:", err);
      }
    };

    fetchMembers();
  }, []);

  const downloadAll = async () => {
    const zip = new JSZip();
    console.log(members);
    members.forEach((member) => {
      if (member.qr_code) {
        // Remove base64 prefix if exists
        const base64Data = member.qr_code.replace(
          /^data:image\/png;base64,/,
          ""
        );
        zip.file(`${member.name}.png`, base64Data, { base64: true });
      }
    });

    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, "qr_codes.zip");
  };
  /* ================= FETCH GROUPS ================= */
  const fetchGroups = useCallback(async () => {
    try {
      const res = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/groups`
      );
      const mapped = (res.data || []).map((g) => ({
        id: g.id,
        name: g.name,
        members: g.membersCount ?? 0,
        accessToday: g.accessToday ?? 0,
        entered: g.entered ?? 0,
        memberDetails: (g.memberDetails || []).map((m) => ({
          id: m.id,
          name: m.name,
          hasAccess: !!m.has_access_today,
          entered: !!m.entered,
          qr_code: m.qr_code, // ← add this
        })),
      }));

      const isEqual = JSON.stringify(mapped) === JSON.stringify(groups);
      if (!isEqual) setGroups(mapped);
    } catch (err) {
      console.error("خطأ في جلب المجموعات:", err);
    }
  }, [groups]);

  useEffect(() => {
    fetchGroups();
    const interval = setInterval(fetchGroups, 1000);
    return () => clearInterval(interval);
  }, [fetchGroups]);

  /* ================= LOCK SCROLL ================= */
  useEffect(() => {
    document.body.style.overflow =
      selectedGroupName || editGroup ? "hidden" : "auto";
    return () => (document.body.style.overflow = "auto");
  }, [selectedGroupName, editGroup]);

  const selectedGroup = groups.find((g) => g.name === selectedGroupName);
  const totalAccessToday = groups.reduce((s, g) => s + g.accessToday, 0);
  const totalEntered = groups.reduce((s, g) => s + g.entered, 0);

  const sortMembers = (members) =>
    [...members].sort((a, b) => {
      const score = (m) => (m.hasAccess && m.entered ? 2 : m.hasAccess ? 1 : 0);
      return score(b) - score(a);
    });

  /* ================= HANDLERS ================= */
  const handleAddMember = async () => {
    const name = newMemberName.trim();
    if (!name || !editGroup) return;

    setLoadingAdd(true);

    try {
      const payload = { groupId: Number(editGroup.id), name };
      const res = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/groups/addmembers`,
        payload
      );

      const newMember = {
        id: res.data.id,
        name: res.data.name,
        hasAccess: !!res.data.has_access_today,
        entered: !!res.data.entered,
      };

      setGroups((prev) =>
        prev.map((g) =>
          g.id === editGroup.id
            ? {
                ...g,
                memberDetails: [...g.memberDetails, newMember],
                members: g.members + 1,
              }
            : g
        )
      );

      setEditGroup((prev) => ({
        ...prev,
        memberDetails: [...prev.memberDetails, newMember],
      }));

      setNewMemberName("");
    } catch (err) {
      console.error("Failed to add member:", err.response || err);
    } finally {
      setLoadingAdd(false);
    }
  };

  const handleDeleteMember = async (memberId) => {
    if (!editGroup) return;
    setLoading((prev) => ({ ...prev, [memberId]: true }));

    try {
      await axios.delete(
        `${process.env.REACT_APP_BACKEND_URL}/members/delete/${memberId}`
      );

      setGroups((prev) =>
        prev.map((g) =>
          g.id === editGroup.id
            ? {
                ...g,
                memberDetails: g.memberDetails.filter((m) => m.id !== memberId),
              }
            : g
        )
      );
      setEditGroup((prev) => ({
        ...prev,
        memberDetails: prev.memberDetails.filter((m) => m.id !== memberId),
      }));
    } catch (err) {
      console.error("خطأ في حذف العضو:", err);
    } finally {
      setLoading((prev) => ({ ...prev, [memberId]: false }));
    }
  };

  return (
    <div style={styles.container}>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>

      <h1 style={styles.title}>لوحة تحكم المسؤول</h1>

      <div style={styles.totals}>
        <Stat label="عدد التصاريح الجملي" value={totalAccessToday} />
        <Stat label="الدخول الفعلي" value={totalEntered} />
      </div>

      {/* Groups */}
      <div style={styles.groupList}>
        {groups.map((g) => (
          <div
            key={g.name}
            style={styles.card}
            onClick={() => setSelectedGroupName(g.name)}
          >
            <div style={styles.cardHeader}>
              <button
                style={styles.settings}
                onClick={(e) => {
                  e.stopPropagation();
                  setEditGroup(g);
                }}
              >
                ⚙️
              </button>

              <p style={styles.cardTitle}>{g.name}</p>
            </div>

            <div style={styles.cardStats}>
              <Stat label="أصلي السرية" value={g.members} />
              <Stat label="عدد التصاريح" value={g.accessToday} />
              <Stat label="دخلوا" value={`${g.entered}/${g.accessToday}`} />
            </div>
          </div>
        ))}
      </div>

      {/* View Modal */}
      {selectedGroup && (
        <div
          style={styles.sheetOverlay}
          onClick={() => setSelectedGroupName(null)}
        >
          <div style={styles.sheet} onClick={(e) => e.stopPropagation()}>
            <div style={styles.sheetHeader}>
              <h3 style={styles.sheetTitle}>{selectedGroup.name}</h3>
              <button
                style={styles.sheetClose}
                onClick={() => setSelectedGroupName(null)}
              >
                ✕
              </button>
            </div>
            <div style={styles.sheetBody}>
              {sortMembers(selectedGroup.memberDetails).map((m, i) => (
                <div key={i} style={styles.memberCard}>
                  <p style={styles.memberName}>{m.name}</p>
                  <div style={styles.badges}>
                    <Badge
                      text="لديه دخول"
                      color={m.hasAccess ? "#16a34a" : "#dc2626"}
                    />
                    <Badge
                      text="دخل"
                      color={m.entered ? "#2563eb" : "#9ca3af"}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editGroup && (
        <div style={styles.sheetOverlay} onClick={() => setEditGroup(null)}>
          <div style={styles.sheet} onClick={(e) => e.stopPropagation()}>
            <div style={styles.sheetHeader}>
              <h3 style={styles.sheetTitle}>
                تعديل الأعضاء - {editGroup.name}
              </h3>
              <button
                style={styles.sheetClose}
                onClick={() => setEditGroup(null)}
              >
                ✕
              </button>
            </div>
            <div style={styles.sheetBody}>
              {sortMembers(editGroup.memberDetails).map((m, i) => (
                <div key={m.id} style={styles.memberCard}>
                  <p style={styles.memberName}>{m.name}</p>

                  {/* Download QR Code */}
                  {m.qr_code && (
                    <a
                      href={m.qr_code}
                      download={`${m.name}.png`}
                      target="_blank"
                      rel="noreferrer"
                      style={styles.qr}
                    >
                     حفض الرمز
                    </a>
                  )}

                  <button
                    onClick={() => handleDeleteMember(m.id)}
                    style={styles.sup}
                  >
                    {loading[m.id] ? <div style={styles.spinner}></div> : "حذف"}
                  </button>
                </div>
              ))}

              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <input
                  type="text"
                  placeholder="اسم العضو"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  style={{
                    flex: 1,
                    padding: 6,
                    borderRadius: 8,
                    border: "1px solid #ccc",
                  }}
                />
                <button onClick={handleAddMember} style={styles.add}>
                  {loadingAdd ? <div style={styles.spinner}></div> : "إضافة"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <button onClick={downloadAll} style={styles.button}>
        حفض جميع الرموز
      </button>
    </div>
  );
}

/* ================= COMPONENTS ================= */
const Stat = ({ label, value }) => (
  <div style={styles.cardStatCentered}>
    <p style={styles.statLabel}>{label}</p>
    <div style={styles.statValue}>{value}</div>
  </div>
);

const Badge = ({ text, color }) => (
  <span style={{ ...styles.badge, background: color }}>{text}</span>
);

/* ---------- Styles ---------- */
const styles = {
  container: {
    padding: 16,
    minHeight: "100vh",
    background: "#f1f5f9",
    fontFamily: "system-ui",
  },
  title: {
    textAlign: "center",
    fontSize: 22,
    marginBottom: 16,
    color: "#1e3a8a",
  },
  totals: {
    background: "linear-gradient(135deg,#1e3a8a,#2563eb)",
    borderRadius: 16,
    padding: 16,
    display: "flex",
    justifyContent: "space-between",
    color: "#fff",

    border: "1px solid #0c010177", // ✅ REQUIRED
  },
  groupList: {
    marginTop: 20,
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  card: {
    background: "#f8fcfeb0",
    borderRadius: 16,
    padding: 10,
    color: "#0b0000ff",
    border: "1px solid #0c010177", // ✅ REQUIRED
    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
    cursor: "pointer",
  },
  cardHeader: {
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: 700,
    margin: 0,
    textAlign: "center",
  },

  settings: {
    position: "absolute",
    right: 0, // stick to the right
    border: "none",
    background: "transparent",
    cursor: "pointer",
    fontSize: 22,
    width: 40,
    height: 40,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },

  cardStats: {
    display: "flex",
    justifyContent: "space-around",
    padding: "8px 0",
  },
  cardStatCentered: {
    flex: 1,
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 4,
  },
  statLabel: {
    fontSize: 14,
    opacity: 0.8,
    margin: 0,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 700,
    backgroundColor: "#2563eb",
    color: "#fff",
    padding: "4px 10px",
    borderRadius: 8,
    minWidth: 30,
    textAlign: "center",
  },
  sheetOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,.45)",
    display: "flex",
    alignItems: "flex-end",
    zIndex: 1000,
  },
  sheet: {
    width: "100%",
    maxHeight: "85vh",
    background: "#fff",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 16,
    display: "flex",
    flexDirection: "column",
  },
  sheetHeader: {
    display: "flex",
    justifyContent: "space-between",
    borderBottom: "1px solid #e5e7eb",
    paddingBottom: 12,
  },
  sheetTitle: { margin: 0, fontSize: 18, fontWeight: 700 },
  sheetClose: {
    border: "none",
    background: "#f1f5f9",
    borderRadius: 10,
    padding: "6px 12px",
    cursor: "pointer",
  },
  sheetBody: { marginTop: 12, overflowY: "auto", flex: 1 },
  memberCard: {
    background: "#f8fafc",
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  memberName: { fontWeight: 600, margin: 0 },
  badges: { display: "flex", gap: 8 },
  badge: {
    padding: "4px 12px",
    borderRadius: 999,
    color: "#fff",
    fontSize: 12,
    fontWeight: 600,
  },
  sup: {
    marginLeft: 8,
    color: "#fff",
    border: "none",
    background: "red",
    borderRadius: "30%",
    width: "50px",
    height: "40px",
    cursor: "pointer",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  add: {
    padding: "6px 14px",
    backgroundColor: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    cursor: "pointer",
    fontWeight: 600,
    transition: "background 0.2s",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  spinner: {
    width: 16,
    height: 16,
    border: "3px solid #fff",
    borderTop: "3px solid transparent",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
button: {
  padding: "8px 16px",
  border: "none",
  borderRadius: 6,
  backgroundColor: "#1e90ff",
  color: "#fff",
  cursor: "pointer",
  display: "block",      // make button a block element
  margin: "12px auto",   // top/bottom 12px, left/right auto -> centers it
  textAlign: "center",
},

  
  qr: {
    padding: "6px 12px",
    backgroundColor: "#2563eb",
    color: "#fff",
    borderRadius: 8,
    textDecoration: "none", // remove underline
    fontWeight: 600,
    fontSize: 14,
    cursor: "pointer",
    transition: "background 0.2s",
    display: "inline-block",
    textAlign: "center",
  },
};
