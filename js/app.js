import { login } from "./auth.js";

const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    const result = await login(email, password);
    if (result.success) {
        window.location.href = "dashboard.html";
    } else {
        alert(result.error);
    }
    });
}