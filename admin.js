import { initializeApp }   from "https://www.gstatic.com/firebasejs/12.12.1/firebase-app.js";
import { getFirestore, collection, doc, addDoc, setDoc, getDocs, deleteDoc,
         onSnapshot, query, orderBy, updateDoc, serverTimestamp, writeBatch }
  from "https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js";

const ADMIN_PASSWORD = "vventures2026";

const firebaseConfig = {
  apiKey:            "AIzaSyCpTNt4-ZigWGX1XFfr719jSxhBt1vVUK0",
  authDomain:        "v-ventures-me-portfolio.firebaseapp.com",
  projectId:         "v-ventures-me-portfolio",
  storageBucket:     "v-ventures-me-portfolio.firebasestorage.app",
  messagingSenderId: "316465890102",
  appId:             "1:316465890102:web:1ed3524071d52c83fca997"
};

const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);

function playSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [660, 880, 1108].forEach((freq, i) => {
      const osc = ctx.createOscillator(), gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = "sine"; osc.frequency.value = freq;
      const t = ctx.currentTime + i * 0.13;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.25, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
      osc.start(t); osc.stop(t + 0.42);
    });
  } catch (_) {}
}

function browserNotify(title, body) {
  if (Notification.permission !== "granted") return;
  const n = new Notification(title, { body, icon: "my logo.png", tag: "vv-chat" });
  n.onclick = () => { window.focus(); n.close(); };
}

const loginScreen  = document.getElementById("login-screen");
const adminApp     = document.getElementById("admin-app");
const passInput    = document.getElementById("admin-pass");
const loginBtn     = document.getElementById("login-btn");
const loginError   = document.getElementById("login-error");
const logoutBtn    = document.getElementById("logout-btn");
const chatList     = document.getElementById("chat-list");
const chatCountEl  = document.getElementById("chat-count");
const leadsListEl  = document.getElementById("leads-list");
const leadsCountEl = document.getElementById("leads-count");
const emptyState   = document.getElementById("empty-state");
const convPanel    = document.getElementById("conversation");
const leadDetail   = document.getElementById("lead-detail");
const convName     = document.getElementById("conv-name");
const convPage     = document.getElementById("conv-page");
const convAvatar   = document.getElementById("conv-avatar");
const convMessages = document.getElementById("conv-messages");
const adminInput   = document.getElementById("admin-input");
const adminSend    = document.getElementById("admin-send");
const backBtn      = document.getElementById("back-btn");
const backLeadBtn  = document.getElementById("back-lead-btn");
const delChatBtn   = document.getElementById("delete-chat-btn");
const delLeadBtn   = document.getElementById("delete-lead-btn");
const ldName       = document.getElementById("ld-name");
const ldPhone      = document.getElementById("ld-phone");
const ldServiceVal = document.getElementById("ld-service-val");
const ldService    = document.getElementById("ld-service");
const ldTime       = document.getElementById("ld-time");
const ldMessage    = document.getElementById("ld-message");
const ldWaBtn      = document.getElementById("ld-wa-btn");
const ldAvatar     = document.getElementById("ld-avatar");
const ldStatusSel  = document.getElementById("ld-status-sel");

let currentSessionId   = null;
let msgUnsubscribe     = null;
let sessionsUnsub      = null;
let isFirstAdminReply  = true;
const isMobile         = () => window.innerWidth <= 640;

const isAuthed = () => sessionStorage.getItem("vv_admin_auth") === "ok";
if (isAuthed()) showApp();

loginBtn.addEventListener("click", tryLogin);
passInput.addEventListener("keydown", e => { if (e.key === "Enter") tryLogin(); });

function tryLogin() {
  if (passInput.value === ADMIN_PASSWORD) {
    sessionStorage.setItem("vv_admin_auth", "ok");
    loginError.classList.add("hidden");
    showApp();
  } else {
    loginError.classList.remove("hidden");
    passInput.value = ""; passInput.focus();
  }
}

logoutBtn.addEventListener("click", async () => {
  await setAdminStatus(false);
  sessionStorage.removeItem("vv_admin_auth");
  if (sessionsUnsub) sessionsUnsub();
  if (msgUnsubscribe) msgUnsubscribe();
  if (leadsUnsub) leadsUnsub();
  adminApp.classList.add("hidden");
  loginScreen.classList.remove("hidden");
});

window.addEventListener("beforeunload", () => {
  if (isAuthed()) setAdminStatus(false);
});

async function setAdminStatus(online) {
  try { await setDoc(doc(db, "status", "admin"), { online, lastSeen: serverTimestamp() }); } catch (_) {}
}

function showApp() {
  loginScreen.classList.add("hidden");
  adminApp.classList.remove("hidden");
  if (Notification.permission === "default") Notification.requestPermission();
  setAdminStatus(true);
  startSessionsListener();
  startLeadsListener();
}

backBtn.addEventListener("click", () => {
  convPanel.classList.add("hidden");
  emptyState.classList.remove("hidden");
  document.querySelector(".sidebar").classList.remove("mobile-hidden");
  currentSessionId = null;
  document.querySelectorAll(".chat-item").forEach(el => el.classList.remove("active"));
});

let sessionsInitLoad = true;
function startSessionsListener() {
  const q = query(collection(db, "chats"), orderBy("lastTime", "desc"));
  sessionsUnsub = onSnapshot(q, snapshot => {
    snapshot.docChanges().forEach(change => {
      if (change.type === "added" && !sessionsInitLoad) {
        const s = change.doc.data();
        playSound();
        browserNotify("💬 New chat | V Ventures", `${s.name || "Visitor"}: ${s.lastMessage || ""}`);
      }
    });
    sessionsInitLoad = false;
    const sessions = [];
    snapshot.forEach(d => sessions.push({ id: d.id, ...d.data() }));
    renderChatList(sessions);
  }, err => {
    chatList.innerHTML = `<p class="empty-list" style="color:#f87171">Firebase error: ${err.message}</p>`;
  });
}

function renderChatList(sessions) {
  chatCountEl.textContent = sessions.length;
  if (!sessions.length) {
    chatList.innerHTML = '<p class="empty-list">No chats yet. Waiting for visitors…</p>'; return;
  }
  chatList.innerHTML = "";
  sessions.forEach(s => {
    const item = document.createElement("div");
    item.className = "chat-item" + (s.id === currentSessionId ? " active" : "");
    item.dataset.id = s.id;
    const initial = (s.name || "V").charAt(0).toUpperCase();
    const timeStr = s.lastTime ? formatTime(s.lastTime.toDate ? s.lastTime.toDate() : new Date()) : "";
    const unread  = s.unreadAdmin || 0;
    item.innerHTML = `
      <div class="chat-av">${initial}</div>
      <div class="chat-item-info">
        <div class="chat-item-name">${escHtml(s.name || "Visitor")}${s.status === "closed" ? ' <span class="tag-closed">ended</span>' : ""}</div>
        <div class="chat-item-preview">${escHtml(s.lastMessage || "No messages yet")}</div>
      </div>
      <div class="chat-item-meta">
        <div class="chat-item-time">${timeStr}</div>
        ${unread > 0 ? `<span class="unread-badge">${unread}</span>` : ""}
      </div>`;
    item.addEventListener("click", () => openConversation(s));
    chatList.appendChild(item);
  });
}

function openConversation(session) {
  currentSessionId     = session.id;
  isFirstAdminReply    = !session.hasAdminReplied;
  convName.textContent = session.name || "Visitor";
  convPage.textContent = session.page || "";
  convAvatar.textContent = (session.name || "V").charAt(0).toUpperCase();
  convMessages.innerHTML = "";

  updateDoc(doc(db, "chats", session.id), { unreadAdmin: 0 }).catch(() => {});
  emptyState.classList.add("hidden");
  convPanel.classList.remove("hidden");
  if (isMobile()) document.querySelector(".sidebar").classList.add("mobile-hidden");

  document.querySelectorAll(".chat-item").forEach(el =>
    el.classList.toggle("active", el.dataset.id === session.id));

  if (msgUnsubscribe) { msgUnsubscribe(); msgUnsubscribe = null; }

  const q = query(collection(db, "chats", session.id, "messages"), orderBy("time", "asc"));
  let convInitLoad = true;
  msgUnsubscribe = onSnapshot(q, snap => {
    snap.docChanges().forEach(change => {
      if (change.type === "added") {
        const msg = change.doc.data();
        appendMsg(session.id, change.doc.id, msg);
        if (!convInitLoad && msg.sender !== "admin") {
          playSound();
          browserNotify(`💬 ${session.name || "Visitor"}`, msg.text || "📎 file");
        }
      }
      if (change.type === "removed") {
        document.querySelector(`[data-mid="${change.doc.id}"]`)?.remove();
      }
    });
    convInitLoad = false;
  });
  adminInput.focus();
}

adminSend.addEventListener("click", sendAdminReply);
adminInput.addEventListener("keydown", e => { if (e.key === "Enter") sendAdminReply(); });

async function sendAdminReply() {
  if (!currentSessionId) return;
  const text = adminInput.value.trim(); if (!text) return;
  adminInput.value = "";
  try {
    await addDoc(collection(db, "chats", currentSessionId, "messages"), {
      text, sender: "admin", senderName: "V Ventures", time: serverTimestamp()
    });
    const upd = { lastMessage: text, lastTime: serverTimestamp() };
    if (isFirstAdminReply) { upd.hasAdminReplied = true; isFirstAdminReply = false; }
    await updateDoc(doc(db, "chats", currentSessionId), upd);
  } catch (err) { console.error(err); }
}

async function deleteMessage(sessionId, msgId) {
  if (!confirm("Delete this message?")) return;
  try { await deleteDoc(doc(db, "chats", sessionId, "messages", msgId)); }
  catch (err) { console.error(err); }
}

delChatBtn.addEventListener("click", async () => {
  if (!currentSessionId) return;
  if (!confirm("Delete this entire conversation? This cannot be undone.")) return;
  try {
    const msgSnap = await getDocs(collection(db, "chats", currentSessionId, "messages"));
    const batch   = writeBatch(db);
    msgSnap.docs.forEach(d => batch.delete(d.ref));
    await batch.commit();
    await deleteDoc(doc(db, "chats", currentSessionId));
    currentSessionId = null;
    convPanel.classList.add("hidden");
    emptyState.classList.remove("hidden");
  } catch (err) { console.error(err); alert("Delete failed: " + err.message); }
});

function appendMsg(sessionId, msgId, msg) {
  const isAdmin = msg.sender === "admin";
  const wrap    = document.createElement("div");
  wrap.className   = `msg ${isAdmin ? "msg-admin" : "msg-visitor"}`;
  wrap.dataset.mid = msgId;

  let content = "";
  if (msg.fileType === "image" && (msg.fileData || msg.fileUrl)) {
    const src = escHtml(msg.fileData || msg.fileUrl);
    content = `<a href="${src}" target="_blank" rel="noreferrer"><img src="${src}" class="conv-img" alt="${escHtml(msg.fileName || 'image')}" /></a>`;
  } else if (msg.fileType === "file" && msg.fileUrl) {
    content = `<a href="${escHtml(msg.fileUrl)}" target="_blank" rel="noreferrer" class="conv-file-link">📎 ${escHtml(msg.fileName)}</a>`;
  } else {
    content = `<div class="bubble">${escHtml(msg.text || "")}</div>`;
  }

  const botLabel = msg.isBot ? " <span class='bot-tag'>Bot</span>" : "";
  wrap.innerHTML = `
    ${content}
    <div class="msg-meta">
      <span class="msg-sender">${escHtml(isAdmin ? (msg.isBot ? "V Ventures Bot" : "V Ventures (you)") : (msg.senderName || "Visitor"))}</span>${botLabel}
      <button class="del-msg-btn" title="Delete message">🗑</button>
    </div>`;
  wrap.querySelector(".del-msg-btn").addEventListener("click", () =>
    deleteMessage(sessionId, msgId));

  convMessages.appendChild(wrap);
  convMessages.scrollTop = convMessages.scrollHeight;
}

function formatTime(d) {
  if (!d) return "";
  const diff = Date.now() - d;
  if (diff < 60000) return "just now";
  if (diff < 3600000) return Math.floor(diff / 60000) + "m ago";
  if (diff < 86400000) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function escHtml(s) {
  return String(s || "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

let activeTab = "chats";
document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    activeTab = btn.dataset.tab;
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.toggle("active", b === btn));
    document.querySelectorAll(".tab-panel").forEach(p => p.classList.toggle("hidden", p.dataset.panel !== activeTab));
    emptyState.classList.remove("hidden");
    convPanel.classList.add("hidden");
    leadDetail.classList.add("hidden");
    currentSessionId = null;
    currentLeadId = null;
  });
});

let currentLeadId   = null;
let leadsUnsub      = null;
let leadsInitLoad   = true;

function startLeadsListener() {
  const q = query(collection(db, "contacts"), orderBy("time", "desc"));
  leadsUnsub = onSnapshot(q, snapshot => {
    snapshot.docChanges().forEach(change => {
      if (change.type === "added" && !leadsInitLoad) {
        const d = change.doc.data();
        playSound();
        browserNotify("📋 New Lead | V Ventures", `${d.name || "Someone"} needs ${d.service || "help"}`);
      }
    });
    leadsInitLoad = false;
    const leads = [];
    snapshot.forEach(d => leads.push({ id: d.id, ...d.data() }));
    renderLeadsList(leads);
  });
}

function renderLeadsList(leads) {
  leadsCountEl.textContent = leads.length;
  if (!leads.length) {
    leadsListEl.innerHTML = '<p class="empty-list">No contact submissions yet.</p>'; return;
  }
  leadsListEl.innerHTML = "";
  leads.forEach(lead => {
    const item = document.createElement("div");
    const isNew = lead.status === "new";
    item.className = "chat-item" + (lead.id === currentLeadId ? " active" : "");
    item.dataset.id = lead.id;
    const initial = (lead.name || "L").charAt(0).toUpperCase();
    const timeStr = lead.time ? formatTime(lead.time.toDate ? lead.time.toDate() : new Date()) : "";
    item.innerHTML = `
      <div class="chat-av lead-av">${initial}</div>
      <div class="chat-item-info">
        <div class="chat-item-name">${escHtml(lead.name || "Unknown")} ${isNew ? '<span class="tag-new">NEW</span>' : ""}</div>
        <div class="chat-item-preview">${escHtml(lead.service || "")} · ${escHtml((lead.message || "").slice(0, 40))}…</div>
      </div>
      <div class="chat-item-meta">
        <div class="chat-item-time">${timeStr}</div>
      </div>`;
    item.addEventListener("click", () => openLead(lead));
    leadsListEl.appendChild(item);
  });
}

function openLead(lead) {
  currentLeadId    = lead.id;
  const initial    = (lead.name || "L").charAt(0).toUpperCase();
  ldAvatar.textContent    = initial;
  ldName.textContent      = lead.name || "Unknown";
  ldService.textContent   = lead.service || "";
  ldServiceVal.textContent = lead.service || "Not specified";
  ldPhone.textContent     = lead.phone || "No phone";
  ldPhone.href            = `https://wa.me/${(lead.phone || "").replace(/\D/g, "")}`;
  ldMessage.textContent   = lead.message || "No message.";
  ldWaBtn.href            = `https://wa.me/${(lead.phone || "").replace(/\D/g, "")}?text=${encodeURIComponent("Hi " + (lead.name || "") + ", thanks for reaching out to V Ventures! We received your enquiry and will get back to you shortly.")}`;
  ldStatusSel.value       = lead.status || "new";
  const t = lead.time?.toDate ? lead.time.toDate() : null;
  ldTime.textContent      = t ? t.toLocaleString() : "Unknown";

  emptyState.classList.add("hidden");
  convPanel.classList.add("hidden");
  leadDetail.classList.remove("hidden");
  if (isMobile()) document.querySelector(".sidebar").classList.add("mobile-hidden");

  document.querySelectorAll("#leads-list .chat-item").forEach(el =>
    el.classList.toggle("active", el.dataset.id === lead.id));

  if (lead.status === "new") {
    updateDoc(doc(db, "contacts", lead.id), { status: "read" }).catch(() => {});
  }
}

backLeadBtn.addEventListener("click", () => {
  leadDetail.classList.add("hidden");
  emptyState.classList.remove("hidden");
  document.querySelector(".sidebar").classList.remove("mobile-hidden");
  currentLeadId = null;
  document.querySelectorAll("#leads-list .chat-item").forEach(el => el.classList.remove("active"));
});

ldStatusSel.addEventListener("change", () => {
  if (!currentLeadId) return;
  updateDoc(doc(db, "contacts", currentLeadId), { status: ldStatusSel.value }).catch(() => {});
});

delLeadBtn.addEventListener("click", async () => {
  if (!currentLeadId) return;
  if (!confirm("Delete this lead permanently?")) return;
  try {
    await deleteDoc(doc(db, "contacts", currentLeadId));
    leadDetail.classList.add("hidden");
    emptyState.classList.remove("hidden");
    currentLeadId = null;
  } catch (err) { alert("Delete failed: " + err.message); }
});

