import { signup, login } from "./auth.js";

var btnSignin = document.querySelector("#signin");
var btnSignup = document.querySelector("#signup");

var body = document.querySelector("body");


if (btnSignin) {
    btnSignin.addEventListener("click", function () {
        body.className = "sign-in-js";
    });
}

if (btnSignup) {
    btnSignup.addEventListener("click", function () {
        body.className = "sign-up-js";
    });
}


const signupForm = document.getElementById("signupForm");
if (signupForm) {
    signupForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    const name = document.getElementById("signupName").value;
    const email = document.getElementById("signupEmail").value;
    const password = document.getElementById("signupPassword").value;

    const result = await signup(email, password, name);
    if (result.success) {
        window.location.href = "dashboard.html";
    } else {
        alert(result.error);
    }
    });
}

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