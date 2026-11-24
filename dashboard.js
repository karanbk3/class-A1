/* ==========================================
   READ-X | ADMIN DASHBOARD
========================================== */

const db = window.readxSupabase;

const STORAGE_BUCKET = "readx-media";

let allPublications = [];
let allAnnouncements = [];
let allAdvertisements = [];

let announcementCurrentImage = "";
let advertisementCurrentImage = "";

let announcementRemoveImage = false;
let advertisementRemoveImage = false;


/* ==========================================
   HELPER FUNCTIONS
========================================== */

function getElement(id) {
    return document.getElementById(id);
}

function setText(id, value) {
    const element = getElement(id);
    if (element) element.textContent = value;
}

function formatDate(value) {
    if (!value) return "Unknown date";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "Unknown date";

    return date.toLocaleString();
}

function showMessage(id, message, isError = true) {
    const element = getElement(id);
    if (!element) return;

    element.textContent = message;
    element.style.color = isError ? "#cc5665" : "#27966b";
}

function makeElement(tag, className, text) {
    const element = document.createElement(tag);

    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;

    return element;
}

function createActionButton(label, action, id, extraClass = "") {
    const button = document.createElement("button");

    button.type = "button";
    button.textContent = label;
    button.className = `table-action ${extraClass}`.trim();

    button.dataset.action = action;
    button.dataset.id = id;

    return button;
}

function refreshIcons() {
    if (window.lucide) {
        window.lucide.createIcons();
    }
}


/* ==========================================
   ADMIN SECURITY
========================================== */

async function verifyAdminAccess() {
    try {
        if (!db) {
            throw new Error("Supabase connection is missing.");
        }

        const { data, error } = await db.auth.getUser();

        if (error || !data.user) {
            window.location.replace("./admin.html");
            return false;
        }

        const { data: isAdmin, error: permissionError } =
            await db.rpc("is_readx_admin");

        if (permissionError || isAdmin !== true) {
            await db.auth.signOut();
            window.location.replace("./admin.html");
            return false;
        }

        console.log("READ-X: Admin access verified.");
        return true;

    } catch (error) {
        console.error("Admin verification failed:", error);
        window.location.replace("./admin.html");
        return false;
    }
}


/* ==========================================
   NAVIGATION
========================================== */

const pageInformation = {
    overview: {
        title: "Overview",
        subtitle: "Welcome to your READ-X control center."
    },
    publications: {
        title: "Publications",
        subtitle: "Review and manage community submissions."
    },
    announcements: {
        title: "Announcements",
        subtitle: "Manage important website updates."
    },
    advertisements: {
        title: "Advertisements",
        subtitle: "Manage your brand partners."
    },
    people: {
        title: "New People",
        subtitle: "See the latest publication authors."
    }
};

const sidebar = getElement("sidebar");
const sidebarOverlay = getElement("sidebarOverlay");
const menuToggle = getElement("menuToggle");

function closeSidebar() {
    sidebar?.classList.remove("open");
    sidebarOverlay?.classList.remove("active");
}

function showSection(sectionName) {
    if (!pageInformation[sectionName]) return;

    const selectedSection = getElement(sectionName);
    if (!selectedSection) return;

    document.querySelectorAll(".dashboard-section").forEach(section => {
        section.classList.remove("active");
    });

    selectedSection.classList.add("active");

    document.querySelectorAll(".menu-item").forEach(button => {
        button.classList.toggle(
            "active",
            button.dataset.section === sectionName
        );
    });

    setText("pageTitle", pageInformation[sectionName].title);
    setText("pageSubtitle", pageInformation[sectionName].subtitle);

    closeSidebar();

    if (sectionName === "overview") {
        loadDashboardStatistics();
        loadRecentPublications();
    }

    if (sectionName === "publications") {
        loadPublications();
    }

    if (sectionName === "announcements") {
        loadAnnouncements();
    }

    if (sectionName === "advertisements") {
        loadAdvertisements();
    }

    if (sectionName === "people") {
        loadNewPeople();
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
}

document.querySelectorAll("[data-section]").forEach(button => {
    button.addEventListener("click", () => {
        showSection(button.dataset.section);
    });
});

menuToggle?.addEventListener("click", () => {
    sidebar?.classList.add("open");
    sidebarOverlay?.classList.add("active");
});

sidebarOverlay?.addEventListener("click", closeSidebar);


/* ==========================================
   DATE
========================================== */

function displayCurrentDate() {
    const element = getElement("todayDate");

    if (!element) return;

    element.textContent = new Date().toLocaleDateString("en-US", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric"
    });
}


/* ==========================================
   DASHBOARD STATISTICS
========================================== */

async function getCount(table, filterColumn, filterValue) {
    let query = db
        .from(table)
        .select("id", { count: "exact", head: true });

    if (filterColumn) {
        query = query.eq(filterColumn, filterValue);
    }

    const { count, error } = await query;

    if (error) throw error;

    return count || 0;
}

async function loadDashboardStatistics() {
    if (!db) return;

    try {
        const [
            publishedCount,
            pendingCount,
            announcementCount,
            advertisementCount
        ] = await Promise.all([
            getCount("publications", "status", "published"),
            getCount("publications", "status", "pending"),
            getCount("announcements"),
            getCount("advertisements", "is_active", true)
        ]);

        setText("totalPublications", publishedCount);
        setText("totalPending", pendingCount);
        setText("pendingCount", pendingCount);
        setText("totalAnnouncements", announcementCount);
        setText("totalAdvertisements", advertisementCount);

    } catch (error) {
        console.error("Statistics error:", error.message);
    }
}


/* ==========================================
   RECENT PUBLICATIONS
========================================== */

async function loadRecentPublications() {
    const container = getElement("recentPublications");

    if (!container) return;

    container.textContent = "Loading publications...";

    try {
        const { data, error } = await db
            .from("publications")
            .select("id,title,author_name,status,created_at")
            .order("created_at", { ascending: false })
            .limit(5);

        if (error) throw error;

        container.replaceChildren();

        if (!data || data.length === 0) {
            container.appendChild(
                makeElement("div", "empty-placeholder", "No publications yet.")
            );
            return;
        }

        data.forEach(publication => {
            const item = makeElement("div", "recent-item");
            const details = document.createElement("div");

            details.appendChild(
                makeElement("h4", "", publication.title || "Untitled")
            );

            details.appendChild(
                makeElement(
                    "p",
                    "",
                    `By ${publication.author_name || "Anonymous"}`
                )
            );

            const badge = makeElement(
                "span",
                `status-badge status-${publication.status}`,
                publication.status || "unknown"
            );

            item.append(details, badge);
            container.appendChild(item);
        });

    } catch (error) {
        console.error("Recent publications error:", error);
        container.textContent = "Could not load recent publications.";
    }
}


/* ==========================================
   PUBLICATIONS
========================================== */

async function loadPublications() {
    const container = getElement("publicationManagement");

    if (!container) return;

    container.textContent = "Loading publications...";

    try {
        const { data, error } = await db
            .from("publications")
            .select(`
                id,
                title,
                author_name,
                topic,
                description,
                content,
                status,
                created_at
            `)
            .order("created_at", { ascending: false });

        if (error) throw error;

        allPublications = data || [];

        renderPublications();

        await loadDashboardStatistics();
        await loadRecentPublications();

    } catch (error) {
        console.error("Publication loading error:", error);

        container.textContent =
            "Could not load publications. Check database permissions.";
    }
}

function renderPublications() {
    const container = getElement("publicationManagement");

    if (!container) return;

    const search = (getElement("publicationSearch")?.value || "")
        .trim()
        .toLowerCase();

    const filter = getElement("publicationFilter")?.value || "all";

    const filtered = allPublications.filter(item => {
        const text = [
            item.title,
            item.author_name,
            item.topic
        ].join(" ").toLowerCase();

        return text.includes(search) &&
            (filter === "all" || item.status === filter);
    });

    container.replaceChildren();

    if (!filtered.length) {
        container.appendChild(
            makeElement("div", "empty-placeholder", "No matching publications.")
        );
        return;
    }

    const table = makeElement("table", "management-table");
    const thead = document.createElement("thead");
    const header = document.createElement("tr");

    ["Title", "Author", "Topic", "Date", "Status", "Actions"].forEach(label => {
        header.appendChild(makeElement("th", "", label));
    });

    thead.appendChild(header);

    const tbody = document.createElement("tbody");

    filtered.forEach(publication => {
        const row = document.createElement("tr");

        function addCell(value) {
            const cell = makeElement("td", "", value || "—");
            row.appendChild(cell);
            return cell;
        }

        addCell(publication.title);
        addCell(publication.author_name);
        addCell(publication.topic);
        addCell(formatDate(publication.created_at));

        const statusCell = addCell("");
        statusCell.appendChild(
            makeElement(
                "span",
                `status-badge status-${publication.status}`,
                publication.status || "unknown"
            )
        );

        const actionCell = document.createElement("td");
        const actions = makeElement("div", "table-actions");

        actions.appendChild(
            createActionButton("View", "view", publication.id, "view-button")
        );

        if (publication.status !== "published") {
            actions.appendChild(
                createActionButton("Approve", "approve", publication.id, "approve-button")
            );
        }

        if (publication.status !== "rejected") {
            actions.appendChild(
                createActionButton("Reject", "reject", publication.id, "reject-button")
            );
        }

        actions.appendChild(
            createActionButton("Delete", "delete", publication.id, "delete-button")
        );

        actionCell.appendChild(actions);
        row.appendChild(actionCell);
        tbody.appendChild(row);
    });

    table.append(thead, tbody);
    container.appendChild(table);
}

function showPublication(publication) {
    const overlay = makeElement("div", "modal-overlay open");
    const card = makeElement("div", "modal-card");

    const title = makeElement("h2", "", publication.title || "Untitled");
    const author = makeElement("p", "", `Author: ${publication.author_name || "Anonymous"}`);
    const topic = makeElement("p", "", `Topic: ${publication.topic || "Not specified"}`);
    const description = makeElement("p", "", publication.description || "No description.");

    const content = makeElement("div", "");
    content.style.cssText = "margin-top:18px; padding-top:15px; border-top:1px solid #e5e7eb; white-space:pre-wrap; line-height:1.8;";
    content.textContent = publication.content || "No writing content.";

    const close = makeElement("button", "primary-button", "Close");
    close.type = "button";

    const closeModal = () => overlay.remove();

    close.addEventListener("click", closeModal);
    overlay.addEventListener("click", event => {
        if (event.target === overlay) closeModal();
    });

    card.append(title, author, topic, description, content, close);
    overlay.appendChild(card);
    document.body.appendChild(overlay);
}

async function updatePublicationStatus(id, status) {
    const question = status === "published"
        ? "Approve this publication?"
        : "Reject this publication?";

    if (!confirm(question)) return;

    try {
        const { error } = await db
            .from("publications")
            .update({ status })
            .eq("id", id);

        if (error) throw error;

        await loadPublications();

        alert("Publication status updated.");

    } catch (error) {
        console.error(error);
        alert("Could not update publication: " + error.message);
    }
}

async function deletePublication(id) {
    if (!confirm("Delete this publication permanently?")) return;

    try {
        const { error } = await db
            .from("publications")
            .delete()
            .eq("id", id);

        if (error) throw error;

        await loadPublications();
        alert("Publication deleted.");

    } catch (error) {
        console.error(error);
        alert("Could not delete publication: " + error.message);
    }
}

getElement("publicationManagement")?.addEventListener("click", async event => {
    const button = event.target.closest("[data-action]");
    if (!button) return;

    const publication = allPublications.find(
        item => item.id === button.dataset.id
    );

    if (!publication) return;

    const action = button.dataset.action;

    if (action === "view") showPublication(publication);
    if (action === "approve") await updatePublicationStatus(publication.id, "published");
    if (action === "reject") await updatePublicationStatus(publication.id, "rejected");
    if (action === "delete") await deletePublication(publication.id);
});

getElement("publicationSearch")?.addEventListener("input", renderPublications);
getElement("publicationFilter")?.addEventListener("change", renderPublications);


/* ==========================================
   STORAGE IMAGE HELPERS
========================================== */

function safeImageUrl(url) {
    if (!url) return "";

    try {
        const parsed = new URL(url);

        if (parsed.protocol === "https:" || parsed.protocol === "http:") {
            return parsed.href;
        }

        return "";
    } catch {
        return "";
    }
}

async function uploadImage(file, folder) {
    if (!file) return null;

    const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp"
    ];

    if (!allowedTypes.includes(file.type)) {
        throw new Error("Please choose a JPG, PNG or WEBP image.");
    }

    if (file.size > 5 * 1024 * 1024) {
        throw new Error("Image must be smaller than 5 MB.");
    }

    const extension = file.type === "image/png"
        ? "png"
        : file.type === "image/webp"
            ? "webp"
            : "jpg";

    const filePath = `${folder}/${crypto.randomUUID()}.${extension}`;

    const { error } = await db.storage
        .from(STORAGE_BUCKET)
        .upload(filePath, file, {
            cacheControl: "3600",
            upsert: false,
            contentType: file.type
        });

    if (error) throw error;

    const { data } = db.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(filePath);

    return {
        path: filePath,
        url: data.publicUrl
    };
}

async function removeStorageImage(path) {
    if (!path) return;

    const { error } = await db.storage
        .from(STORAGE_BUCKET)
        .remove([path]);

    if (error) {
        console.warn("Could not remove old image:", error.message);
    }
}


/* ==========================================
   MODAL HELPERS
========================================== */

function openModal(id) {
    getElement(id)?.classList.add("open");
    getElement(id)?.setAttribute("aria-hidden", "false");
}

function closeModal(id) {
    getElement(id)?.classList.remove("open");
    getElement(id)?.setAttribute("aria-hidden", "true");
}

function resetImagePreview(prefix) {
    const preview = getElement(`${prefix}ImagePreview`);
    const image = getElement(`${prefix}PreviewImage`);
    const input = getElement(`${prefix}Image`);

    if (preview) preview.hidden = true;
    if (image) image.removeAttribute("src");
    if (input) input.value = "";
}


/* ==========================================
   ANNOUNCEMENTS
========================================== */

async function loadAnnouncements() {
    const container = getElement("announcementManagement");

    if (!container) return;

    container.textContent = "Loading announcements...";

    try {
        const { data, error } = await db
            .from("announcements")
            .select("id,title,message,status,image_url,image_path,created_at,updated_at")
            .order("created_at", { ascending: false });

        if (error) throw error;

        allAnnouncements = data || [];

        renderAnnouncements();
        await loadDashboardStatistics();

    } catch (error) {
        console.error("Announcement loading error:", error);
        container.textContent =
            "Could not load announcements. Check the announcement table columns and permissions.";
    }
}

function renderAnnouncements() {
    const container = getElement("announcementManagement");
    if (!container) return;

    const search = (getElement("announcementSearch")?.value || "")
        .trim()
        .toLowerCase();

    const filter = getElement("announcementFilter")?.value || "all";

    const filtered = allAnnouncements.filter(item => {
        const text = `${item.title || ""} ${item.message || ""}`.toLowerCase();

        return text.includes(search) &&
            (filter === "all" || item.status === filter);
    });

    container.replaceChildren();

    if (!filtered.length) {
        container.appendChild(
            makeElement("div", "empty-placeholder", "No announcements found.")
        );
        return;
    }

    filtered.forEach(item => {
        const card = makeElement("article", "content-card");

        if (item.image_url && safeImageUrl(item.image_url)) {
            const image = document.createElement("img");
            image.className = "content-card-image";
            image.src = safeImageUrl(item.image_url);
            image.alt = item.title || "Announcement image";
            image.loading = "lazy";
            card.appendChild(image);
        }

        const body = makeElement("div", "content-card-body");

        body.appendChild(makeElement("h3", "", item.title));
        body.appendChild(makeElement("p", "", item.message));

        const meta = makeElement("div", "content-card-meta");

        meta.appendChild(
            makeElement(
                "span",
                `status-badge status-${item.status}`,
                item.status
            )
        );

        meta.appendChild(
            makeElement("small", "", formatDate(item.created_at))
        );

        body.appendChild(meta);

        const actions = makeElement("div", "content-card-actions");

        actions.appendChild(
            createActionButton("Edit", "edit-announcement", item.id, "edit-button")
        );

        actions.appendChild(
            createActionButton("Delete", "delete-announcement", item.id, "delete-button")
        );

        body.appendChild(actions);
        card.appendChild(body);
        container.appendChild(card);
    });
}

function resetAnnouncementForm() {
    getElement("announcementForm")?.reset();
    setText("announcementFormTitle", "Add announcement");
    setText("saveAnnouncement", "Save announcement");
    getElement("announcementId").value = "";

    announcementCurrentImage = "";
    announcementRemoveImage = false;

    resetImagePreview("announcement");
    showMessage("announcementMessageStatus", "", false);
}

function openAnnouncementForm(item = null) {
    resetAnnouncementForm();

    if (item) {
        setText("announcementFormTitle", "Edit announcement");
        setText("saveAnnouncement", "Update announcement");

        getElement("announcementId").value = item.id;
        getElement("announcementTitle").value = item.title || "";
        getElement("announcementMessage").value = item.message || "";
        getElement("announcementStatus").value = item.status || "draft";

        announcementCurrentImage = item.image_path || "";

        if (item.image_url && safeImageUrl(item.image_url)) {
            getElement("announcementPreviewImage").src = safeImageUrl(item.image_url);
            getElement("announcementImagePreview").hidden = false;
        }
    }

    openModal("announcementModal");
}

getElement("addAnnouncement")?.addEventListener("click", () => {
    openAnnouncementForm();
});

getElement("closeAnnouncement")?.addEventListener("click", () => {
    closeModal("announcementModal");
});

getElement("cancelAnnouncement")?.addEventListener("click", () => {
    closeModal("announcementModal");
});

getElement("announcementModal")?.addEventListener("click", event => {
    if (event.target.id === "announcementModal") {
        closeModal("announcementModal");
    }
});

getElement("announcementImage")?.addEventListener("change", event => {
    const file = event.target.files[0];
    if (!file) return;

    const preview = getElement("announcementPreviewImage");
    preview.src = URL.createObjectURL(file);

    getElement("announcementImagePreview").hidden = false;
    announcementRemoveImage = false;
});

getElement("removeAnnouncementImage")?.addEventListener("click", () => {
    announcementRemoveImage = true;
    announcementCurrentImage = "";
    resetImagePreview("announcement");
});

getElement("announcementForm")?.addEventListener("submit", async event => {
    event.preventDefault();

    const saveButton = getElement("saveAnnouncement");
    saveButton.disabled = true;
    showMessage("announcementMessageStatus", "Saving announcement...", false);

    let uploadedImage = null;

    try {
        const id = getElement("announcementId").value;

        const title = getElement("announcementTitle").value.trim();
        const message = getElement("announcementMessage").value.trim();
        const status = getElement("announcementStatus").value;
        const file = getElement("announcementImage").files[0];

        if (!title || !message) {
            throw new Error("Please enter a title and message.");
        }

        if (file) {
            uploadedImage = await uploadImage(file, "announcements");
        }

        const imagePath = uploadedImage
            ? uploadedImage.path
            : announcementRemoveImage
                ? null
                : announcementCurrentImage || null;

        const imageUrl = uploadedImage
            ? uploadedImage.url
            : announcementRemoveImage
                ? null
                : getElement("announcementPreviewImage").src.startsWith("http")
                    ? getElement("announcementPreviewImage").src
                    : null;

        const values = {
            title,
            message,
            status,
            image_url: imageUrl,
            image_path: imagePath,
            updated_at: new Date().toISOString()
        };

        let result;

        if (id) {
            result = await db
                .from("announcements")
                .update(values)
                .eq("id", id);
        } else {
            result = await db
                .from("announcements")
                .insert(values);
        }

        if (result.error) throw result.error;

        if (id && (uploadedImage || announcementRemoveImage) && announcementCurrentImage) {
            await removeStorageImage(announcementCurrentImage);
        }

        closeModal("announcementModal");
        resetAnnouncementForm();

        await loadAnnouncements();

        alert(id ? "Announcement updated." : "Announcement added.");

    } catch (error) {
        console.error("Announcement save error:", error);

        if (uploadedImage?.path) {
            await removeStorageImage(uploadedImage.path);
        }

        showMessage("announcementMessageStatus", error.message);

    } finally {
        saveButton.disabled = false;
    }
});

async function deleteAnnouncement(id) {
    const item = allAnnouncements.find(entry => entry.id === id);
    if (!item) return;

    if (!confirm("Delete this announcement permanently?")) return;

    try {
        const { error } = await db
            .from("announcements")
            .delete()
            .eq("id", id);

        if (error) throw error;

        if (item.image_path) {
            await removeStorageImage(item.image_path);
        }

        await loadAnnouncements();
        alert("Announcement deleted.");

    } catch (error) {
        console.error(error);
        alert("Could not delete announcement: " + error.message);
    }
}

getElement("announcementManagement")?.addEventListener("click", event => {
    const button = event.target.closest("[data-action]");
    if (!button) return;

    const item = allAnnouncements.find(
        entry => entry.id === button.dataset.id
    );

    if (!item) return;

    if (button.dataset.action === "edit-announcement") {
        openAnnouncementForm(item);
    }

    if (button.dataset.action === "delete-announcement") {
        deleteAnnouncement(item.id);
    }
});

getElement("announcementSearch")?.addEventListener("input", renderAnnouncements);
getElement("announcementFilter")?.addEventListener("change", renderAnnouncements);


/* ==========================================
   ADVERTISEMENTS
========================================== */

async function loadAdvertisements() {
    const container = getElement("advertisementManagement");

    if (!container) return;

    container.textContent = "Loading advertisements...";

    try {
        const { data, error } = await db
            .from("advertisements")
            .select("id,brand_name,description,image_url,is_active,created_at")
            .order("created_at", { ascending: false });

        if (error) throw error;

        allAdvertisements = data || [];

        renderAdvertisements();
        await loadDashboardStatistics();

    } catch (error) {
        console.error("Advertisement loading error:", error);

        container.textContent =
            "Could not load advertisements. Check your database permissions.";
    }
}

function renderAdvertisements() {
    const container = getElement("advertisementManagement");
    if (!container) return;

    container.replaceChildren();

    if (!allAdvertisements.length) {
        container.appendChild(
            makeElement("div", "empty-placeholder", "No advertisements have been added.")
        );
        return;
    }

    allAdvertisements.forEach(item => {
        const card = makeElement("article", "content-card");

        const imageArea = makeElement("div", "brand-image");

        if (item.image_url && safeImageUrl(item.image_url)) {
            const image = document.createElement("img");
            image.src = safeImageUrl(item.image_url);
            image.alt = `${item.brand_name} logo`;
            image.loading = "lazy";
            imageArea.appendChild(image);
        } else {
            imageArea.appendChild(
                makeElement("span", "", "No brand image")
            );
        }

        const body = makeElement("div", "content-card-body");

        body.appendChild(
            makeElement("h3", "", item.brand_name || "Unnamed brand")
        );

        body.appendChild(
            makeElement("p", "", item.description || "No description provided.")
        );

        const meta = makeElement("div", "content-card-meta");

        meta.appendChild(
            makeElement(
                "span",
                `status-badge ${item.is_active ? "status-published" : "status-draft"}`,
                item.is_active ? "Active" : "Inactive"
            )
        );

        meta.appendChild(
            makeElement("small", "", formatDate(item.created_at))
        );

        body.appendChild(meta);

        const actions = makeElement("div", "content-card-actions");

        actions.appendChild(
            createActionButton("Edit", "edit-advertisement", item.id, "edit-button")
        );

        actions.appendChild(
            createActionButton(
                item.is_active ? "Deactivate" : "Activate",
                "toggle-advertisement",
                item.id,
                "view-button"
            )
        );

        actions.appendChild(
            createActionButton("Delete", "delete-advertisement", item.id, "delete-button")
        );

        body.appendChild(actions);
        card.append(imageArea, body);
        container.appendChild(card);
    });
}

function resetAdvertisementForm() {
    getElement("advertisementForm")?.reset();
    setText("advertisementFormTitle", "Add advertisement");
    setText("saveAdvertisement", "Save advertisement");
    getElement("advertisementId").value = "";

    advertisementCurrentImage = "";
    advertisementRemoveImage = false;

    resetImagePreview("advertisement");
    showMessage("advertisementMessageStatus", "", false);
}

function openAdvertisementForm(item = null) {
    resetAdvertisementForm();

    if (item) {
        setText("advertisementFormTitle", "Edit advertisement");
        setText("saveAdvertisement", "Update advertisement");

        getElement("advertisementId").value = item.id;
        getElement("advertisementBrand").value = item.brand_name || "";
        getElement("advertisementDescription").value = item.description || "";
        getElement("advertisementStatus").value = String(item.is_active);

        advertisementCurrentImage = item.image_path || "";

        if (item.image_url && safeImageUrl(item.image_url)) {
            getElement("advertisementPreviewImage").src = safeImageUrl(item.image_url);
            getElement("advertisementImagePreview").hidden = false;
        }
    }

    openModal("advertisementModal");
}

getElement("addAdvertisement")?.addEventListener("click", () => {
    openAdvertisementForm();
});

getElement("closeAdvertisement")?.addEventListener("click", () => {
    closeModal("advertisementModal");
});

getElement("cancelAdvertisement")?.addEventListener("click", () => {
    closeModal("advertisementModal");
});

getElement("advertisementModal")?.addEventListener("click", event => {
    if (event.target.id === "advertisementModal") {
        closeModal("advertisementModal");
    }
});

getElement("advertisementImage")?.addEventListener("change", event => {
    const file = event.target.files[0];
    if (!file) return;

    getElement("advertisementPreviewImage").src = URL.createObjectURL(file);
    getElement("advertisementImagePreview").hidden = false;

    advertisementRemoveImage = false;
});

getElement("removeAdvertisementImage")?.addEventListener("click", () => {
    advertisementRemoveImage = true;
    advertisementCurrentImage = "";
    resetImagePreview("advertisement");
});

getElement("advertisementForm")?.addEventListener("submit", async event => {
    event.preventDefault();

    const saveButton = getElement("saveAdvertisement");
    saveButton.disabled = true;

    showMessage("advertisementMessageStatus", "Saving advertisement...", false);

    let uploadedImage = null;

    try {
        const id = getElement("advertisementId").value;

        const brandName = getElement("advertisementBrand").value.trim();
        const description = getElement("advertisementDescription").value.trim();
        const isActive = getElement("advertisementStatus").value === "true";
        const file = getElement("advertisementImage").files[0];

        if (!brandName) {
            throw new Error("Please enter the brand name.");
        }

        if (file) {
            uploadedImage = await uploadImage(file, "advertisements");
        }

        const values = {
            brand_name: brandName,
            description,
            is_active: isActive,
            image_url: uploadedImage
                ? uploadedImage.url
                : advertisementRemoveImage
                    ? null
                    : getElement("advertisementPreviewImage").src.startsWith("http")
                        ? getElement("advertisementPreviewImage").src
                        : null,
            image_path: uploadedImage
                ? uploadedImage.path
                : advertisementRemoveImage
                    ? null
                    : advertisementCurrentImage || null,
            updated_at: new Date().toISOString()
        };

        let result;

        if (id) {
            result = await db
                .from("advertisements")
                .update(values)
                .eq("id", id);
        } else {
            result = await db
                .from("advertisements")
                .insert(values);
        }

        if (result.error) throw result.error;

        if (id && (uploadedImage || advertisementRemoveImage) && advertisementCurrentImage) {
            await removeStorageImage(advertisementCurrentImage);
        }

        closeModal("advertisementModal");
        resetAdvertisementForm();

        await loadAdvertisements();

        alert(id ? "Advertisement updated." : "Advertisement added.");

    } catch (error) {
        console.error("Advertisement save error:", error);

        if (uploadedImage?.path) {
            await removeStorageImage(uploadedImage.path);
        }

        showMessage("advertisementMessageStatus", error.message);

    } finally {
        saveButton.disabled = false;
    }
});

async function toggleAdvertisement(id, currentStatus) {
    try {
        const { error } = await db
            .from("advertisements")
            .update({
                is_active: !currentStatus,
                updated_at: new Date().toISOString()
            })
            .eq("id", id);

        if (error) throw error;

        await loadAdvertisements();

    } catch (error) {
        console.error(error);
        alert("Could not change advertisement status: " + error.message);
    }
}

async function deleteAdvertisement(id) {
    const item = allAdvertisements.find(entry => entry.id === id);
    if (!item) return;

    if (!confirm("Delete this advertisement permanently?")) return;

    try {
        const { error } = await db
            .from("advertisements")
            .delete()
            .eq("id", id);

        if (error) throw error;

        if (item.image_path) {
            await removeStorageImage(item.image_path);
        }

        await loadAdvertisements();
        alert("Advertisement deleted.");

    } catch (error) {
        console.error(error);
        alert("Could not delete advertisement: " + error.message);
    }
}

getElement("advertisementManagement")?.addEventListener("click", event => {
    const button = event.target.closest("[data-action]");
    if (!button) return;

    const item = allAdvertisements.find(
        entry => entry.id === button.dataset.id
    );

    if (!item) return;

    if (button.dataset.action === "edit-advertisement") {
        openAdvertisementForm(item);
    }

    if (button.dataset.action === "toggle-advertisement") {
        toggleAdvertisement(item.id, item.is_active);
    }

    if (button.dataset.action === "delete-advertisement") {
        deleteAdvertisement(item.id);
    }
});


/* ==========================================
   NEW PEOPLE
   Uses author names from publications.
========================================== */

async function loadNewPeople() {
    const container = getElement("peopleManagement");

    if (!container) return;

    container.textContent = "Loading people...";

    try {
        const { data, error } = await db
            .from("publications")
            .select("author_name,created_at")
            .order("created_at", { ascending: false });

        if (error) throw error;

        const uniquePeople = [];
        const seenNames = new Set();

        (data || []).forEach(item => {
            const name = (item.author_name || "").trim();

            if (!name) return;

            const key = name.toLowerCase();

            if (!seenNames.has(key)) {
                seenNames.add(key);

                uniquePeople.push({
                    name,
                    date: item.created_at
                });
            }
        });

        renderNewPeople(uniquePeople);

    } catch (error) {
        console.error("People loading error:", error);

        container.textContent = "Could not load people.";
    }
}

function renderNewPeople(people) {
    const container = getElement("peopleManagement");
    if (!container) return;

    const search = (getElement("peopleSearch")?.value || "")
        .trim()
        .toLowerCase();

    const filtered = people.filter(person =>
        person.name.toLowerCase().includes(search)
    );

    container.replaceChildren();

    if (!filtered.length) {
        container.appendChild(
            makeElement("div", "empty-placeholder", "No people found yet.")
        );
        return;
    }

    const list = makeElement("div", "people-list");

    filtered.forEach(person => {
        const row = makeElement("div", "person-row");

        const avatar = makeElement(
            "div",
            "person-avatar",
            person.name.charAt(0).toUpperCase()
        );

        const details = makeElement("div", "person-details");

        details.appendChild(makeElement("strong", "", person.name));
        details.appendChild(
            makeElement("small", "", `First seen: ${formatDate(person.date)}`)
        );

        row.append(avatar, details);
        list.appendChild(row);
    });

    container.appendChild(list);
}

getElement("peopleSearch")?.addEventListener("input", loadNewPeople);


/* ==========================================
   LOGOUT
========================================== */

getElement("logoutButton")?.addEventListener("click", async () => {
    if (!confirm("Are you sure you want to log out?")) return;

    const button = getElement("logoutButton");
    button.disabled = true;

    try {
        const { error } = await db.auth.signOut();

        if (error) throw error;

        window.location.replace("./admin.html");

    } catch (error) {
        console.error("Logout error:", error);
        alert("Could not log out: " + error.message);
        button.disabled = false;
    }
});


/* ==========================================
   START DASHBOARD
========================================== */

async function startDashboard() {
    if (!db) {
        alert("READ-X could not connect to Supabase.");
        return;
    }

    const authorized = await verifyAdminAccess();

    if (!authorized) return;

    displayCurrentDate();

    await Promise.all([
        loadDashboardStatistics(),
        loadRecentPublications()
    ]);

    refreshIcons();

    console.log("READ-X dashboard is ready.");
}

startDashboard();


/* ==========================================
   AVAILABLE DASHBOARD FUNCTIONS
========================================== */

window.readxDashboard = {
    showSection,
    loadPublications,
    loadAnnouncements,
    loadAdvertisements,
    loadNewPeople,
    loadDashboardStatistics,
    loadRecentPublications,
    verifyAdminAccess
};