import { initializeApp } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-app.js";
import { getFirestore, collection, doc, addDoc, setDoc, getDoc, onSnapshot,
         serverTimestamp, query, orderBy, updateDoc, increment }
  from "https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js";

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

function playSound(type = "receive") {
  try {
    const ctx   = new (window.AudioContext || window.webkitAudioContext)();
    const notes = type === "receive" ? [880, 1108] : [660, 880];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator(), gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = "sine"; osc.frequency.value = freq;
      const t = ctx.currentTime + i * 0.14;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.18, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
      osc.start(t); osc.stop(t + 0.38);
    });
  } catch (_) {}
}

const BOT_RULES = [
  [/\b(hi|hello|hey|good\s*(morning|afternoon|evening))\b/i,
   "Hey! 👋 Welcome to V Ventures Tech Solutions! We build websites, apps & graphics. What can I help you with today?"],
  [/\b(price|cost|how much|charge|fee|rate|budget|quote|afford|pricing)\b/i,
   "Our pricing is affordable and depends on your project 💰. Check the Pricing section on this page for our packages. A team member will send your exact quote in ~5 minutes!"],
  [/\b(deposit|payment|pay|transfer|installment|upfront)\b/i,
   "We take a 50% deposit to start and the balance on delivery 🤝. Safe and simple. A team member will confirm details in ~5 minutes!"],
  [/\b(shop|store|e-?commerce|sell|selling|online store)\b/i,
   "We build e-commerce stores with payment & delivery integration 🛒. Our team will reply with details in ~5 minutes!"],
  [/\b(where|location|based|address|office|nigeria|delta)\b/i,
   "We're based in Delta State, Nigeria 🇳🇬 and we work with clients everywhere. Our team will be with you in ~5 minutes!"],
  [/\b(fix|repair|redesign|rebuild|update my|edit my|existing)\b/i,
   "Yes, we also upgrade and fix existing websites & apps 🔧. Tell us what needs work. Team reply in ~5 minutes!"],
  [/\b(maintenance|support|host|hosting|domain)\b/i,
   "We handle hosting, domains and ongoing maintenance 🛠. Our team will explain the options in ~5 minutes!"],
  [/\b(website|web site|landing page|web design|webpage)\b/i,
   "We build fast, clean, professional websites 🌐, from landing pages to full platforms. Our team will get back to you in ~5 minutes!"],
  [/\b(app|mobile|android|ios|flutter|application)\b/i,
   "We develop amazing apps 📱: mobile, web apps, dashboards. Our dev team will reply shortly, ~5 minutes!"],
  [/\b(logo|graphic|design|brand|banner|flyer|poster)\b/i,
   "Our design team handles logos, brand identity, graphics & more 🎨. A designer will reach out in ~5 minutes!"],
  [/\b(how long|timeline|deadline|when|fast|quick|urgent|asap)\b/i,
   "We work very fast ⚡! Our team will give you exact timelines in ~5 minutes!"],
  [/\b(portfolio|example|project|work|sample)\b/i,
   "Check out our Projects section on this page 👀. Our team will be with you in ~5 minutes!"],
  [/\b(whatsapp|call|phone|contact|reach|number)\b/i,
   "You can also reach us on WhatsApp: +234 913 896 6840 📞. Or stay here. We reply in ~5 minutes!"],
  [/\b(thank|thanks|okay|ok|alright|cool|great|perfect)\b/i,
   "You're welcome! 😊 Our team will be with you shortly. Anything else I can help with?"],
];

let lastBotTime = 0;
function getBotReply(text) {
  for (const [rx, reply] of BOT_RULES) { if (rx.test(text)) return reply; }
  return "Thanks for reaching out! 🙌 Our team at V Ventures will get back to you in about 5 minutes. Feel free to describe what you need!";
}

async function triggerBot(userText) {
  if (!botActive) return;
  if (Date.now() - lastBotTime < 6000) return;
  await new Promise(r => setTimeout(r, 2500));
  if (!botActive) return;
  try {
    const snap = await getDoc(doc(db, "chats", sessionId));
    if (snap.exists() && snap.data().hasAdminReplied) { botActive = false; return; }
  } catch (_) {}
  lastBotTime = Date.now();
  try {
    const ref = await addDoc(collection(db, "chats", sessionId, "messages"), {
      text: getBotReply(userText), sender: "admin",
      senderName: "V Ventures Bot", isBot: true, time: serverTimestamp()
    });
    seenIds.add(ref.id);
    renderMsg({ text: getBotReply(userText), sender: "admin", senderName: "V Ventures Bot", isBot: true });
  } catch (_) {}
}

let sessionId = localStorage.getItem("vv_session_id");
if (!sessionId) {
  sessionId = "s_" + Date.now() + "_" + Math.random().toString(36).slice(2, 9);
  localStorage.setItem("vv_session_id", sessionId);
}
const endedKey  = "vv_ended_" + sessionId;
let chatStarted = localStorage.getItem("vv_chat_started") === "true";
let chatEnded   = localStorage.getItem(endedKey) === "true";
let botActive   = true;
let msgListener = null;
let isWindowOpen = false;
let isInitLoad   = true;
let unreadCount  = 0;
const seenIds    = new Set();

const toggleBtn  = document.getElementById("chat-toggle");
const chatWindow = document.getElementById("chat-window");
const closeBtn   = document.getElementById("chat-close");
const msgArea    = document.getElementById("chat-messages");
const startForm  = document.getElementById("chat-start-form");
const replyArea  = document.getElementById("chat-reply-area");
const nameIn     = document.getElementById("chat-name");
const firstMsgIn = document.getElementById("chat-first-msg");
const startBtn   = document.getElementById("chat-start-btn");
const chatIn     = document.getElementById("chat-input");
const sendBtn    = document.getElementById("chat-send");
const badge      = document.getElementById("chat-unread");
const endBtn     = document.getElementById("chat-end-btn");
const endedState = document.getElementById("chat-ended-state");
const newChatBtn = document.getElementById("chat-new-btn");
const fileBtn    = document.getElementById("chat-file-btn");
const fileInput  = document.getElementById("chat-file-input");
const uploadProg = document.getElementById("file-upload-progress");
const progBar    = document.getElementById("file-progress-bar");
const progLabel  = document.getElementById("file-progress-label");

if (chatEnded) {
  startForm.classList.add("chat-hidden");
  replyArea.classList.add("chat-hidden");
  endedState.classList.remove("chat-hidden");
  startListener();
} else if (chatStarted) {
  startForm.classList.add("chat-hidden");
  replyArea.classList.remove("chat-hidden");
  endBtn.classList.remove("chat-hidden");
  startListener();
  checkBotStatus();
}

toggleBtn.addEventListener("click", () => {
  isWindowOpen = !isWindowOpen;
  chatWindow.classList.toggle("chat-hidden", !isWindowOpen);
  if (isWindowOpen) {
    unreadCount = 0; badge.style.display = "none";
    scrollBottom();
    if (chatStarted && !chatEnded) chatIn.focus();
    else if (!chatStarted) firstMsgIn.focus();
  }
});
closeBtn.addEventListener("click", () => {
  isWindowOpen = false; chatWindow.classList.add("chat-hidden");
});

startBtn.addEventListener("click", sendFirst);
firstMsgIn.addEventListener("keydown", e => { if (e.key === "Enter") sendFirst(); });

document.querySelectorAll(".qr-chip").forEach(chip => {
  chip.addEventListener("click", () => {
    firstMsgIn.value = chip.dataset.msg;
    sendFirst();
  });
});

async function sendFirst() {
  const text = firstMsgIn.value.trim();
  if (!text || startBtn.disabled) return;
  const name = nameIn.value.trim() || "Visitor";
  startBtn.disabled = true; startBtn.textContent = "Sending…";
  firstMsgIn.disabled = true; nameIn.disabled = true;
  try {
    await setDoc(doc(db, "chats", sessionId), {
      name, sessionId,
      lastMessage: text, lastTime: serverTimestamp(),
      unreadAdmin: 1, status: "open",
      hasAdminReplied: false, page: window.location.href
    });
    const ref = await addDoc(collection(db, "chats", sessionId, "messages"), {
      text, sender: "visitor", senderName: name, time: serverTimestamp()
    });
    seenIds.add(ref.id);
    renderMsg({ text, sender: "visitor", senderName: name });
    chatStarted = true;
    localStorage.setItem("vv_chat_started", "true");
    playSound("send");
    startForm.classList.add("chat-hidden");
    replyArea.classList.remove("chat-hidden");
    endBtn.classList.remove("chat-hidden");
    chatIn.focus();
    startListener();
    triggerBot(text);
  } catch (err) {
    console.error(err);
    startBtn.disabled = false; startBtn.textContent = "Send →";
    firstMsgIn.disabled = false; nameIn.disabled = false;
    appendSystem("⚠ Could not connect. Check your internet and Firestore rules.");
  }
}

sendBtn.addEventListener("click", sendMsg);
chatIn.addEventListener("keydown", e => { if (e.key === "Enter") sendMsg(); });

async function sendMsg() {
  const text = chatIn.value.trim();
  if (!text || chatIn.disabled) return;
  const savedText = text;
  chatIn.value = ""; chatIn.disabled = true; sendBtn.disabled = true;
  try {
    const ref = await addDoc(collection(db, "chats", sessionId, "messages"), {
      text, sender: "visitor", time: serverTimestamp()
    });
    seenIds.add(ref.id);
    renderMsg({ text, sender: "visitor" });
    await updateDoc(doc(db, "chats", sessionId), {
      lastMessage: text, lastTime: serverTimestamp(), unreadAdmin: increment(1)
    });
    playSound("send");
    triggerBot(text);
  } catch (err) {
    console.error(err);
    chatIn.value = savedText; // restore typed text
    appendSystem("⚠ Message failed to send. Check your connection.");
  } finally {
    chatIn.disabled = false; sendBtn.disabled = false; chatIn.focus();
  }
}

fileBtn.addEventListener("click", () => fileInput.click());
fileInput.addEventListener("change", () => {
  const file = fileInput.files[0]; if (!file) return; fileInput.value = "";
  if (!file.type.startsWith("image/")) {
    alert("Only images are supported. Please send a JPG, PNG or GIF."); return;
  }
  if (file.size > 5 * 1024 * 1024) {
    alert("Image too large. Please use an image under 5 MB."); return;
  }
  processImage(file);
});

async function processImage(file) {
  uploadProg.classList.remove("chat-hidden");
  progBar.style.width = "30%"; progLabel.textContent = "Processing…";
  chatIn.disabled = true; sendBtn.disabled = true; fileBtn.disabled = true;
  try {
    const base64 = await compressImage(file, 900, 0.75);
    progBar.style.width = "80%"; progLabel.textContent = "Sending…";
    const ref = await addDoc(collection(db, "chats", sessionId, "messages"), {
      sender: "visitor", fileData: base64,
      fileName: file.name, fileType: "image", time: serverTimestamp()
    });
    seenIds.add(ref.id);
    renderMsg({ sender: "visitor", fileData: base64, fileName: file.name, fileType: "image" });
    await updateDoc(doc(db, "chats", sessionId), {
      lastMessage: `🖼 ${file.name}`, lastTime: serverTimestamp(), unreadAdmin: increment(1)
    });
    progBar.style.width = "100%";
    playSound("send");
  } catch (err) {
    console.error(err); alert("Failed to send image. Try a smaller one.");
  } finally {
    uploadProg.classList.add("chat-hidden");
    progBar.style.width = "0%";
    chatIn.disabled = false; sendBtn.disabled = false; fileBtn.disabled = false;
  }
}

function compressImage(file, maxPx, quality) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let w = img.width, h = img.height;
      if (w > maxPx || h > maxPx) {
        if (w > h) { h = Math.round(h * maxPx / w); w = maxPx; }
        else       { w = Math.round(w * maxPx / h); h = maxPx; }
      }
      const canvas = document.createElement("canvas");
      canvas.width = w; canvas.height = h;
      canvas.getContext("2d").drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = reject;
    img.src = url;
  });
}

endBtn.addEventListener("click", () => {
  if (!confirm("End this conversation?")) return;
  doEndChat();
});

async function doEndChat() {
  try { await updateDoc(doc(db, "chats", sessionId), { status: "closed", endedAt: serverTimestamp() }); } catch (_) {}
  localStorage.setItem(endedKey, "true");
  chatEnded = true;
  replyArea.classList.add("chat-hidden");
  endBtn.classList.add("chat-hidden");
  endedState.classList.remove("chat-hidden");
  appendSystem("Conversation ended");
}

newChatBtn.addEventListener("click", () => {
  sessionId = "s_" + Date.now() + "_" + Math.random().toString(36).slice(2, 9);
  localStorage.setItem("vv_session_id", sessionId);
  localStorage.removeItem("vv_chat_started");
  localStorage.removeItem(endedKey);
  chatStarted = false; chatEnded = false; botActive = true;
  isInitLoad = true; lastBotTime = 0; seenIds.clear();
  if (msgListener) { msgListener(); msgListener = null; }
  msgArea.innerHTML = `<div class="chat-msg admin-msg"><p>Hi there! 👋 Welcome back! How can we help you today?</p><span class="msg-time">Just now</span></div>`;
  endedState.classList.add("chat-hidden");
  startForm.classList.remove("chat-hidden");
  firstMsgIn.value = ""; startBtn.disabled = false; startBtn.textContent = "Send →";
  firstMsgIn.disabled = false; nameIn.disabled = false;
});

function startListener() {
  if (msgListener) return;
  const q = query(collection(db, "chats", sessionId, "messages"), orderBy("time", "asc"));
  msgListener = onSnapshot(q, snapshot => {
    snapshot.docChanges().forEach(change => {
      if (change.type !== "added") return;
      const id = change.doc.id;
      if (seenIds.has(id)) return; // already rendered locally
      seenIds.add(id);
      const msg = change.doc.data();
      if (isInitLoad || msg.sender === "admin") {
        renderMsg(msg);
      }
      if (msg.sender === "admin" && !isInitLoad) {
        playSound("receive");
        if (!msg.isBot) botActive = false;
        if (!isWindowOpen) { unreadCount++; badge.textContent = unreadCount; badge.style.display = "grid"; }
      }
    });
    isInitLoad = false;
  }, err => {
    console.error("Firestore listener error:", err.message);
    appendSystem("⚠ Connection issue. Messages may not load.");
  });
}

async function checkBotStatus() {
  try {
    const s = await getDoc(doc(db, "chats", sessionId));
    if (s.exists() && s.data().hasAdminReplied) botActive = false;
  } catch (_) {}
}

function renderMsg(msg) {
  const isAdmin = msg.sender === "admin";
  const wrap = document.createElement("div");
  wrap.className = `chat-msg ${isAdmin ? "admin-msg" : "user-msg"}`;

  if (msg.fileType === "image" && (msg.fileData || msg.fileUrl)) {
    const src = msg.fileData || msg.fileUrl;
    const img = document.createElement("img");
    img.src = src; img.className = "chat-img"; img.alt = msg.fileName || "image";
    img.onclick = () => window.open(src, "_blank");
    wrap.appendChild(img);
  } else if (msg.fileType === "file" && msg.fileUrl) {
    const a = document.createElement("a");
    a.href = msg.fileUrl; a.target = "_blank"; a.rel = "noreferrer";
    a.className = "chat-file-link";
    a.innerHTML = `📎 <span>${escHtml(msg.fileName)}</span>`;
    wrap.appendChild(a);
  } else {
    const p = document.createElement("p");
    p.textContent = msg.text || "";
    wrap.appendChild(p);
  }

  const t = document.createElement("span"); t.className = "msg-time";
  const now = new Date();
  t.textContent = msg.isBot
    ? "Bot · just now"
    : now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  wrap.appendChild(t);
  msgArea.appendChild(wrap);
  scrollBottom();
}

function appendSystem(text) {
  const d = document.createElement("div"); d.className = "chat-sys"; d.textContent = text;
  msgArea.appendChild(d); scrollBottom();
}

function escHtml(s) { return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }
function scrollBottom() { msgArea.scrollTop = msgArea.scrollHeight; } 