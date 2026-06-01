import { initializeApp } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp }
  from "https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey:            "AIzaSyCpTNt4-ZigWGX1XFfr719jSxhBt1vVUK0",
  authDomain:        "v-ventures-me-portfolio.firebaseapp.com",
  projectId:         "v-ventures-me-portfolio",
  storageBucket:     "v-ventures-me-portfolio.firebasestorage.app",
  messagingSenderId: "316465890102",
  appId:             "1:316465890102:web:1ed3524071d52c83fca997"
};

const app = initializeApp(firebaseConfig, "vv-contact");
const db  = getFirestore(app);

const form      = document.getElementById("contact-form");
const submitBtn = document.getElementById("contact-submit");
const statusEl  = document.getElementById("contact-status");
const charCount = document.getElementById("msg-char-count");
const msgInput  = document.getElementById("contact-msg");

if (msgInput && charCount) {
  msgInput.addEventListener("input", () => {
    charCount.textContent = msgInput.value.length + "/500";
  });
}

if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    submitBtn.disabled = true;
    submitBtn.textContent = "Sending…";
    statusEl.className = "form-status";
    statusEl.textContent = "";

    const payload = {
      name:    form.querySelector("[name='cf-name']").value.trim(),
      phone:   form.querySelector("[name='cf-phone']").value.trim(),
      service: form.querySelector("[name='cf-service']").value,
      message: form.querySelector("[name='cf-message']").value.trim(),
      time:    serverTimestamp(),
      status:  "new"
    };

    try {
      await addDoc(collection(db, "contacts"), payload);
      form.reset();
      if (charCount) charCount.textContent = "0/500";
      statusEl.textContent = "Sent! We'll reply on WhatsApp or email very soon.";
      statusEl.className = "form-status fs-ok";
      submitBtn.textContent = "Sent ✓";
    } catch (err) {
      statusEl.textContent = "Could not send. Please DM us on WhatsApp directly.";
      statusEl.className = "form-status fs-err";
      submitBtn.disabled = false;
      submitBtn.textContent = "Send Message →";
    }
  });
}
