
/* ==========================================
   READ-X | SHARE SECTION
========================================== */

// 1. SUPABASE CONNECTION

const db = window.readxSupabase;


// 2. PAGE ELEMENTS

const shareForm = document.getElementById("shareForm");
const submitButton = document.getElementById("submitButton");
const formMessage = document.getElementById("formMessage");
const floatingNav = document.getElementById("floatingNav");


// 3. SHOW MESSAGE

function showMessage(message, type) {
    if (!formMessage) return;

    formMessage.textContent = message;
    formMessage.className = `form-message ${type}`;
}


// 4. VALIDATE FORM

function validateForm() {

    const authorName = document.getElementById("authorName").value.trim();
    const phoneNumber = document.getElementById("phoneNumber").value.trim();
    const topic = document.getElementById("topic").value;
    const title = document.getElementById("title").value.trim();
    const description = document.getElementById("description").value.trim();
    const content = document.getElementById("content").value.trim();

    if (!authorName || !phoneNumber || !topic || !title || !description || !content) {
        showMessage("Please complete all the fields.", "error");
        return false;
    }

    if (authorName.length < 2) {
        showMessage("Please enter a valid name.", "error");
        return false;
    }

    if (phoneNumber.length < 7 || phoneNumber.length > 20) {
        showMessage("Please check your phone number.", "error");
        return false;
    }

    if (title.length < 3) {
        showMessage("Your title is too short.", "error");
        return false;
    }

    if (description.length < 10) {
        showMessage("Please write a longer description.", "error");
        return false;
    }

    if (content.length < 30) {
        showMessage("Please write at least 30 characters.", "error");
        return false;
    }

    return true;
}


// 5. SUBMIT PUBLICATION

async function submitPublication() {

    if (!db) {
        showMessage("Supabase is not connected.", "error");
        console.error("READ-X: Supabase client missing.");
        return;
    }

    if (!validateForm()) return;

    const publication = {
        author_name: document.getElementById("authorName").value.trim(),
        phone_number: document.getElementById("phoneNumber").value.trim(),
        topic: document.getElementById("topic").value,
        title: document.getElementById("title").value.trim(),
        description: document.getElementById("description").value.trim(),
        content: document.getElementById("content").value.trim(),
        status: "pending"
    };

    submitButton.disabled = true;
    submitButton.textContent = "Submitting...";

    showMessage("Submitting your publication...", "info");

    try {

        const { error } = await db
            .from("publications")
            .insert([publication]);

        if (error) throw error;

        showMessage(
            "Your publication was submitted successfully! It is waiting for review.",
            "success"
        );

        shareForm.reset();

    } catch (error) {

        console.error("READ-X submission error:", error);

        showMessage(
            `Submission failed: ${error.message}`,
            "error"
        );

    } finally {

        submitButton.disabled = false;
        submitButton.textContent = "Submit publication";

    }
}


// 6. FORM SUBMISSION

if (shareForm) {

    shareForm.addEventListener("submit", function(event) {
        event.preventDefault();
        submitPublication();
    });

    shareForm.addEventListener("input", function() {
        if (formMessage) {
            formMessage.textContent = "";
            formMessage.className = "form-message";
        }
    });

}


// 7. FLOATING NAVIGATION

let lastScrollPosition = window.scrollY;

window.addEventListener("scroll", function() {

    if (!floatingNav) return;

    const currentScrollPosition = window.scrollY;

    if (currentScrollPosition < 20) {
        floatingNav.classList.remove("nav-hidden");
    } else if (currentScrollPosition > lastScrollPosition + 5) {
        floatingNav.classList.add("nav-hidden");
    } else if (currentScrollPosition < lastScrollPosition - 5) {
        floatingNav.classList.remove("nav-hidden");
    }

    lastScrollPosition = currentScrollPosition;

}, { passive: true });


// 8. PAGE READY

console.log("READ-X Share section loaded successfully.");
console.log("Supabase connection:", db ? "Available" : "Missing");
