
/* ==========================================
   READ-X | PUBLICATION & READING SYSTEM
   Browse, Search, Open and Read Articles
========================================== */


/* 1. PAGE ELEMENTS */

const publicationList = document.getElementById("publicationList");
const searchInput = document.getElementById("searchInput");
const publicationCount = document.getElementById("publicationCount");
const emptyState = document.getElementById("emptyState");
const floatingNav = document.getElementById("floatingNav");

const articleView = document.getElementById("articleView");
const articleContent = document.getElementById("articleContent");
const backButton = document.getElementById("backToPublications");

const pageIntro = document.getElementById("pageIntro");
const searchSection = document.getElementById("searchSection");
const publicationsSection = document.getElementById("publicationsSection");

let publications = [];
let currentPublication = null;


/* 2. FORMAT DATE */

function getPublicationTime(dateValue) {

    if (!dateValue) return "Recently published";

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
        return "Recently published";
    }

    const seconds = Math.max(
        0,
        Math.floor((Date.now() - date.getTime()) / 1000)
    );

    if (seconds < 60) return "Just now";

    const minutes = Math.floor(seconds / 60);

    if (minutes < 60) {
        return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
    }

    const hours = Math.floor(minutes / 60);

    if (hours < 24) {
        return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
    }

    const days = Math.floor(hours / 24);

    if (days < 30) {
        return `${days} ${days === 1 ? "day" : "days"} ago`;
    }

    return date.toLocaleDateString();
}


/* 3. SHOW EMPTY MESSAGE */

function showEmptyMessage(title, description) {

    publicationList.innerHTML = "";
    emptyState.hidden = false;

    const heading = emptyState.querySelector("h3");
    const paragraph = emptyState.querySelector("p");

    if (heading) heading.textContent = title;
    if (paragraph) paragraph.textContent = description;
}


/* 4. DISPLAY PUBLICATION CARDS */

function displayPublications(items) {

    publicationList.innerHTML = "";

    publicationCount.textContent =
        `${items.length} ${items.length === 1 ? "publication" : "publications"}`;

    if (items.length === 0) {

        showEmptyMessage(
            "No publications found",
            "Try another search or check back later."
        );

        return;
    }

    emptyState.hidden = true;

    items.forEach((item, index) => {

        const card = document.createElement("article");

        card.className = "publication-card";
        card.style.animationDelay = `${index * 0.06}s`;

        card.tabIndex = 0;
        card.setAttribute("role", "button");
        card.setAttribute(
            "aria-label",
            `Read article: ${item.title || "Untitled"}`
        );

        // Author and publication date
        const meta = document.createElement("div");
        meta.className = "publication-meta";

        const author = document.createElement("span");
        author.className = "author-name";
        author.textContent = `By ${item.author_name || "Anonymous"}`;

        const dot = document.createElement("span");
        dot.className = "meta-dot";
        dot.textContent = "•";

        const time = document.createElement("time");
        time.className = "publication-time";
        time.dateTime = item.created_at || "";
        time.textContent = getPublicationTime(item.created_at);

        meta.append(author, dot, time);

        // Title
        const title = document.createElement("h3");
        title.className = "publication-title";
        title.textContent = item.title || "Untitled";

        // Description
        const description = document.createElement("p");
        description.className = "publication-description";
        description.textContent =
            item.description || "No description available.";

        // Topic
        const topic = document.createElement("span");
        topic.className = "publication-topic";
        topic.textContent = item.topic || "General";

        // Read button text
        const readMore = document.createElement("span");
        readMore.className = "read-more";
        readMore.textContent = "Read full article →";

        card.append(meta, title, description, topic, readMore);

        // Open article on click
        card.addEventListener("click", () => {
            openArticle(item);
        });

        // Keyboard support
        card.addEventListener("keydown", (event) => {

            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                openArticle(item);
            }

        });

        publicationList.appendChild(card);

    });

}


/* 5. OPEN FULL ARTICLE */

function openArticle(item) {

    if (!articleView || !articleContent) {
        console.error("READ-X: Article view elements are missing.");
        return;
    }

    currentPublication = item;

    articleContent.innerHTML = "";

    // Article heading
    const heading = document.createElement("h1");
    heading.className = "full-article-title";
    heading.textContent = item.title || "Untitled";

    // Article information
    const meta = document.createElement("div");
    meta.className = "full-article-meta";

    const author = document.createElement("span");
    author.textContent = `By ${item.author_name || "Anonymous"}`;

    const dot = document.createElement("span");
    dot.textContent = "•";

    const date = document.createElement("time");
    date.dateTime = item.created_at || "";
    date.textContent = getPublicationTime(item.created_at);

    meta.append(author, dot, date);

    // Topic
    const topic = document.createElement("span");
    topic.className = "full-article-topic";
    topic.textContent = item.topic || "General";

    // Description
    const description = document.createElement("p");
    description.className = "full-article-description";
    description.textContent =
        item.description || "";

    // Article body
    const body = document.createElement("div");
    body.className = "full-article-body";

    const content = (item.content || "").trim();

    if (content) {

        // Preserve paragraph breaks and readable spacing
        const paragraphs = content.split(/\n\s*\n/);

        paragraphs.forEach(paragraphText => {

            if (!paragraphText.trim()) return;

            const paragraph = document.createElement("p");
            paragraph.textContent = paragraphText.trim();

            body.appendChild(paragraph);

        });

    } else {

        const message = document.createElement("p");
        message.textContent = "No full article content is available.";
        body.appendChild(message);

    }

    // Add all article parts
    articleContent.append(
        heading,
        meta,
        topic
    );

    if (item.description) {
        articleContent.appendChild(description);
    }

    articleContent.appendChild(body);

    // Switch from publication list to article
    pageIntro.hidden = true;
    searchSection.hidden = true;
    publicationsSection.hidden = true;

    articleView.hidden = false;

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


/* 6. BACK TO PUBLICATIONS */

function backToPublications() {

    if (!articleView) return;

    articleView.hidden = true;

    pageIntro.hidden = false;
    searchSection.hidden = false;
    publicationsSection.hidden = false;

    currentPublication = null;

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}

if (backButton) {
    backButton.addEventListener("click", backToPublications);
}


/* 7. SHOW LOADING MESSAGE */

function showLoadingMessage() {

    publicationList.innerHTML = "";

    const message = document.createElement("p");

    message.className = "loading-message";
    message.textContent = "Discovering publications...";

    publicationList.appendChild(message);

    emptyState.hidden = true;
    publicationCount.textContent = "Loading...";

}


/* 8. LOAD PUBLICATIONS FROM SUPABASE */

async function loadPublications() {

    showLoadingMessage();

    try {

        if (!window.readxSupabase) {
            throw new Error("Supabase connection is missing.");
        }

        if (typeof window.getPublishedPublications !== "function") {
            throw new Error("Publication loading function is missing.");
        }

        const result = await window.getPublishedPublications();

        if (result.error) {
            throw new Error(
                result.error.message || "Unable to retrieve publications."
            );
        }

        publications = Array.isArray(result.data)
            ? result.data
            : [];

        searchPublications();

        console.log(
            "READ-X: Publications loaded:",
            publications.length
        );

    } catch (error) {

        console.error("READ-X: Publication loading failed:", error);

        publications = [];

        publicationCount.textContent = "Connection error";

        showEmptyMessage(
            "Unable to load publications",
            error.message || "Please try again later."
        );

    }

}


/* 9. SEARCH PUBLICATIONS */

function searchPublications() {

    const searchTerm = searchInput.value.trim().toLowerCase();

    const filteredPublications = publications.filter(item => {

        const title = (item.title || "").toLowerCase();
        const author = (item.author_name || "").toLowerCase();
        const topic = (item.topic || "").toLowerCase();
        const description = (item.description || "").toLowerCase();
        const content = (item.content || "").toLowerCase();

        return (
            title.includes(searchTerm) ||
            author.includes(searchTerm) ||
            topic.includes(searchTerm) ||
            description.includes(searchTerm) ||
            content.includes(searchTerm)
        );

    });

    displayPublications(filteredPublications);

}

if (searchInput) {
    searchInput.addEventListener("input", searchPublications);
}


/* 10. FLOATING NAVIGATION */

let lastScrollPosition = window.scrollY;

window.addEventListener("scroll", () => {

    if (!floatingNav) return;

    const currentPosition = window.scrollY;

    if (currentPosition < 20) {

        floatingNav.classList.remove("nav-hidden");

    } else if (currentPosition > lastScrollPosition + 5) {

        floatingNav.classList.add("nav-hidden");

    } else if (currentPosition < lastScrollPosition - 5) {

        floatingNav.classList.remove("nav-hidden");

    }

    lastScrollPosition = currentPosition;

}, { passive: true });


/* 11. START READ-X */

if (
    publicationList &&
    searchInput &&
    publicationCount &&
    emptyState
) {
    loadPublications();
}

console.log("READ-X: Reading system initialized.");
