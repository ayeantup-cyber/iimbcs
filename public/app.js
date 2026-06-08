const socket = io();

const chatWindow = document.getElementById("chat-window");
const input = document.getElementById("msg-input");
const sendBtn = document.getElementById("send-btn");
                                                                                        const menuBtn = document.getElementById("menu-btn");
const sideMenu = document.getElementById("side-menu");

// ---------------- MENU ----------------
menuBtn.onclick = () => {
  sideMenu.classList.toggle("open");
};

// ---------------- THEME ----------------
document.querySelectorAll(".theme-btn").forEach(btn => {
  btn.onclick = () => {
    document.documentElement.setAttribute("data-theme", btn.dataset.theme);
  };
});

// ---------------- USER ID ----------------
let username = localStorage.getItem("iimbcs-user");

if (!username) {
  username = "user_" + Math.floor(Math.random() * 100000);
  localStorage.setItem("iimbcs-user", username);
}

const userDisplay = document.getElementById("user-display");
if (userDisplay) {
  userDisplay.textContent = username;
}

// ---------------- MESSAGE RENDER ----------------
function createMessage(message) {
  const card = document.createElement("div");
  card.className = "message-card";

  const time = new Date().toLocaleTimeString();

  const contentClass =
    message.type === "code"
      ? "msg-content code-message"
      : "msg-content";

  card.innerHTML = `
    <div class="msg-top">
      <span class="msg-user">${message.user}</span>
      <button class="msg-copy">⧉</button>
    </div>

    <div class="${contentClass}"></div>

    <div class="msg-bottom">
      ${time}
    </div>
  `;

  const contentEl = card.querySelector(".msg-content");
  contentEl.textContent = message.content; // SAFE: prevents code execution

  // COPY BUTTON
  card.querySelector(".msg-copy").onclick = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
    } catch (err) {
      // fallback for older browsers
      const temp = document.createElement("textarea");
      temp.value = message.content;
      document.body.appendChild(temp);
      temp.select();
      document.execCommand("copy");
      temp.remove();
    }
  };

  chatWindow.appendChild(card);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

// ---------------- DETECT TYPE ----------------
function detectMessageType(text) {
  const patterns = [
    "<html",
    "<!DOCTYPE",
    "function ",
    "const ",
    "let ",
    "{",
    "}"
  ];

  return patterns.some(p => text.includes(p)) ? "code" : "text";
}

// ---------------- SEND MESSAGE ----------------
function sendMessage() {
  const text = input.value.trim();
  if (!text) return;

  const message = {
    user: username,
    type: detectMessageType(text),
    content: text
  };

  // SEND TO SERVER (REAL-TIME)
  socket.emit("chat-message", message);

  input.value = "";
}

// ---------------- BUTTON EVENTS ----------------
sendBtn.onclick = sendMessage;

input.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

// ---------------- RECEIVE FROM SERVER ----------------
socket.on("chat-message", (message) => {
  createMessage(message);
});

// ---------------- INIT USER (from server) ----------------
socket.on("init", (data) => {
  if (data?.userId) {
    username = data.userId;
    localStorage.setItem("iimbcs-user", username);

    if (userDisplay) {
      userDisplay.textContent = username;
    }
  }
});