
/* ==========================================
   READ-X | ADMIN LOGIN SYSTEM
========================================== */

// 1. GET PAGE ELEMENTS

const loginForm = document.getElementById("adminLoginForm");
const emailInput = document.getElementById("adminEmail");
const passwordInput = document.getElementById("adminPassword");
const loginButton = document.getElementById("loginButton");
const loginMessage = document.getElementById("loginMessage");


// 2. SHOW LOGIN MESSAGE

function showLoginMessage(message, type = "") {
    loginMessage.textContent = message;
    loginMessage.className = `login-message ${type}`;
}


// 3. CHECK ADMIN PERMISSION

async function checkAdminPermission() {

    const { data, error } = await window.readxSupabase
        .rpc("is_readx_admin");

    if (error) {
        throw error;
    }

    return data === true;
}


// 4. ADMIN LOGIN

loginForm.addEventListener("submit", async function (event) {

    event.preventDefault();

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
        showLoginMessage(
            "Please enter your email and password.",
            "error"
        );
        return;
    }

    loginButton.disabled = true;
    loginButton.textContent = "Checking account...";

    showLoginMessage("Verifying your credentials...");

    try {

        // Authenticate with Supabase

        const { data, error } = await window.readxSupabase
            .auth
            .signInWithPassword({
                email: email,
                password: password
            });

        if (error) {
            throw new Error("Incorrect email or password.");
        }

        // Check administrator permission

        const isAdmin = await checkAdminPermission();

        if (!isAdmin) {

            // Sign out unauthorized accounts

            await window.readxSupabase.auth.signOut();

            throw new Error(
                "Access denied. This account is not an administrator."
            );
        }

        // Successful login

        showLoginMessage(
            "Login successful. Opening dashboard...",
            "success"
        );

        loginButton.textContent = "Access granted";

        // Open admin dashboard

        window.location.href = "./dashboard.html";

    } catch (error) {

        console.error("READ-X Admin Login:", error);

        showLoginMessage(
            error.message || "Something went wrong. Please try again.",
            "error"
        );

        loginButton.disabled = false;
        loginButton.innerHTML =
            'Sign in to dashboard <span>→</span>';

    }

});


// 5. PAGE READY

console.log("READ-X Admin Login system loaded.");
