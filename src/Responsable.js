import { useEffect, useState } from "react";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function Responsable() {
  const [user, setUser] = useState(null);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [modalData, setModalData] = useState(null);
  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const day = String(tomorrow.getDate()).padStart(2, "0");
    const month = String(tomorrow.getMonth() + 1).padStart(2, "0"); // Months are 0-indexed
    const year = tomorrow.getFullYear();
    return `${day}/${month}/${year}`;
  };

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("user"));
    if (userData) {
      setUser(userData);
      axios
        .get(`${BACKEND_URL}/my-groups/${userData.id}`)
        .then((res) => setGroups(res.data.groups))
        .catch(() => setGroups([]))
        .finally(() => setLoading(false));
    } else setLoading(false);
  }, []);

  const toggleMemberAccess = (groupId, memberId) => {
    setGroups((prev) =>
      prev.map((g) =>
        g.id === groupId
          ? {
              ...g,
              members: g.members.map((m) =>
                m.id === memberId
                  ? { ...m, has_access_today: !m.has_access_today }
                  : m
              ),
            }
          : g
      )
    );
  };

  const confirmUpdate = async (groupId) => {
    const group = groups.find((g) => g.id === groupId);
    if (!group) return;

    const memberIds = group.members.map((m) => m.id);
    const accessStates = group.members.map((m) => m.has_access_today);

    setUpdating(true);
    try {
      await axios.post(`${BACKEND_URL}/members/haveAccess/bulk`, {
        memberIds,
        accessStates,
      });

      const membersWithAccess = group.members.filter((m) => m.has_access_today);
      setModalData({
        groupName: group.name,
        members: membersWithAccess,
      });
    } catch (err) {
      console.error(err);
      setModalData({
        error: true,
        message: "فشل تحديث صلاحيات الدخول",
      });
    } finally {
      setUpdating(false);
    }
  };

  const closeModal = () => setModalData(null);

  if (loading)
    return <p style={styles.loading}>جاري تحميل بيانات المستخدم...</p>;
  if (!user) return <p style={styles.loading}>لا توجد بيانات مستخدم</p>;

  return (
    <div style={styles.container}>
      {/* Toggle CSS */}
      <style>{`
        .switch {
          position: relative;
          display: inline-block;
          width: 50px;
          height: 28px;
        }
        .switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }
        .slider {
          position: absolute;
          cursor: pointer;
          top: 0; left: 0; right: 0; bottom: 0;
          background-color: #ccc;
          transition: 0.4s;
          border-radius: 28px;
        }
        .slider:before {
          position: absolute;
          content: "";
          height: 22px;
          width: 22px;
          left: 3px;
          bottom: 3px;
          background-color: white;
          border-radius: 50%;
          transition: 0.4s;
        }
        input:checked + .slider {
          background-color: #1e90ff;
        }
        input:checked + .slider:before {
          transform: translateX(22px);
        }
      `}</style>

      <h2 style={styles.header}>تصاريح الدخول</h2>

      {groups.map((group) => (
        <div key={group.id} style={styles.groupCard}>
          <h3 style={styles.groupName}>أفراد  {group.name}</h3>
          <ul style={styles.memberList}>
            {group.members.map((member) => (
              <li key={member.id} style={styles.memberItem}>
                <span style={styles.memberName}>{member.name}</span>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={member.has_access_today}
                    onChange={() => toggleMemberAccess(group.id, member.id)}
                  />
                  <span className="slider"></span>
                </label>
              </li>
            ))}
          </ul>

          <button
            onClick={() => confirmUpdate(group.id)}
            disabled={updating}
            style={{
              ...styles.updateBtn,
              opacity: updating ? 0.6 : 1,
              cursor: updating ? "not-allowed" : "pointer",
            }}
          >
            {updating ? "جاري التحديث..." : "تأكيد "}
          </button>
        </div>
      ))}

      {/* Modal */}
      {modalData && (
        <div style={styles.modalOverlay} onClick={closeModal}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            {modalData.error ? (
              <p style={styles.modalMessage}>{modalData.message}</p>
            ) : (
              <>
                <h3 style={styles.modalTitle}>
                  تم تحديث مجموعة {modalData.groupName} بنجاح
                </h3>
                <p style={styles.modalMessage}>
                  {modalData.members.length > 0
                    ? `الأعضاء الذين لديهم صلاحية الدخول غداً (${getTomorrowDate()}) `
                    : `لا يوجد أعضاء لديهم صلاحية دخول غداً (${getTomorrowDate()}) .`}
                </p>
                <ul style={styles.modalList}>
                  {modalData.members.map((m) => (
                    <li key={m.id} style={styles.modalMember}>
                      {m.name} ✅
                    </li>
                  ))}
                </ul>
              </>
            )}
            <button style={styles.modalBtn} onClick={closeModal}>
              إغلاق
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: 16,
    backgroundColor: "#f5f7fb",
    minHeight: "100vh",
    maxWidth: 480,
    margin: "0 auto",
  },
  loading: { textAlign: "center", marginTop: 50, fontSize: 18 },

  header: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  groupCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    border: "1px solid rgba(18, 2, 2, 0.86)",

    marginBottom: 20,
    boxShadow: "0 4px 15px rgba(0,0,0,0.08)",
  },
  modalList: {
    listStyle: "none",
    padding: 0,
    margin: 0,
    maxHeight: 200,
    overflowY: "auto",
  },
  groupName: { fontSize: 16, fontWeight: "bold", marginBottom: 12 },

  memberList: { listStyle: "none", padding: 0, marginTop: 0 },
  memberItem: {
    display: "flex",
    border: "1px solid rgba(18, 2, 2, 0.86)",
    marginTop: "5px",
    padding: "5px",
    borderRadius: 12,
    justifyContent: "space-between",
    alignItems: "center",
  },
  memberName: { fontSize: 16 },
  updateBtn: {
    marginTop: 12,
    padding: "12px 0",
    borderRadius: 8,
    backgroundColor: "#1e90ff",
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    border: "none",
    width: "100%",
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  modal: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    width: "85%",
    maxWidth: 350,
    textAlign: "center",
  },
  modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 12 },
  modalMessage: { fontSize: 16, marginBottom: 12 },
  modalMember: { fontSize: 16, padding: "4px 0" },
  modalBtn: {
    marginTop: 12,
    padding: "10px 0",
    borderRadius: 8,
    backgroundColor: "#1e90ff",
    color: "#fff",
    fontWeight: "bold",
    width: "100%",
    border: "none",
    cursor: "pointer",
  },
};
