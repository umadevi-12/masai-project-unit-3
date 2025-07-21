import { auth } from './firebase-config.js';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

// Toggle between login and register views
document.getElementById('showRegister').addEventListener('click', () => {
  document.getElementById('loginBox').style.display = 'none';
  document.getElementById('registerBox').style.display = 'block';
});

document.getElementById('showLogin').addEventListener('click', () => {
  document.getElementById('loginBox').style.display = 'block';
  document.getElementById('registerBox').style.display = 'none';
});

// Email validation
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

const message = document.getElementById('message');

// Register
document.getElementById('registerBtn').addEventListener('click', () => {
  const email = document.getElementById('registerEmail').value.trim();
  const password = document.getElementById('registerPassword').value.trim();

  if (!isValidEmail(email)) {
    message.textContent = "❌ Invalid email format";
    return;
  }

  createUserWithEmailAndPassword(auth, email, password)
    .then(() => {
      message.textContent = "✅ Registered successfully! Please login.";
      document.getElementById('loginBox').style.display = 'block';
      document.getElementById('registerBox').style.display = 'none';
    })
    .catch(err => {
      message.textContent = `❌ ${err.message}`;
    });
});

// Login
document.getElementById('loginBtn').addEventListener('click', () => {
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value.trim();

  if (!isValidEmail(email)) {
    message.textContent = "❌ Invalid email format";
    return;
  }

  signInWithEmailAndPassword(auth, email, password)
    .then(() => {
      message.textContent = "✅ Login successful! Redirecting...";
      setTimeout(() => {
        window.location.href = 'recipe.html';
      }, 1000);
    })
    .catch(err => {
      message.textContent = `❌ ${err.message}`;
    });
});
