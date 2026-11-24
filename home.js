
/* =====================================
   READ-X | HOME PAGE JAVASCRIPT
===================================== */


/*
   SAMPLE DATA

   Later, Supabase will provide this information.
   Admin will manage it from the separate dashboard.
*/


// 1. ANNOUNCEMENTS

const announcements = [
    {
        id: 1,
        title: "Welcome to READ-X",
        description: "A new space for reading, creativity and sharing meaningful ideas. Stay tuned for updates.",
        date: "2026-11-24",
        active: true
    },

    {
        id: 2,
        title: "Our platform is growing",
        description: "READ-X is preparing a place where everyone can share stories, poetry and knowledge.",
        date: "2026-11-24",
        active: true
    }
];


// 2. ADVERTISEMENTS

const advertisements = [
    {
        id: 1,
        brandName: "Your Brand",
        description: "Discover something new with our featured brand partner.",
        date: "2026-11-24",
        image: "./images/brand-banner-1.jpg",
        link: "",
        active: true
    },

    {
        id: 2,
        brandName: "Partner With Us",
        description: "Showcase your brand to the READ-X community.",
        date: "2026-11-24",
        image: "./images/brand-banner-2.jpg",
        link: "",
        active: true
    }
];


// 3. FORMAT DATE
// Example: 2026-11-24 becomes 24 Nov 2026

function formatShortDate(dateString) {

    const date = new Date(dateString + "T00:00:00");

    if (Number.isNaN(date.getTime())) {
        return "";
    }

    return new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    }).format(date);
}


// 4. CREATE HTML ELEMENTS SAFELY

function createElement(tag, className, text) {

    const element = document.createElement(tag);

    if (className) {
        element.className = className;
    }

    if (text !== undefined) {
        element.textContent = text;
    }

    return element;
}


// 5. LOAD ANNOUNCEMENTS

function loadAnnouncements() {

    const container = document.getElementById("announcementList");

    if (!container) return;

    container.replaceChildren();

    const publishedAnnouncements = announcements
        .filter(item => item.active)
        .sort((a, b) => new Date(b.date) - new Date(a.date));

    if (publishedAnnouncements.length === 0) {

        container.appendChild(
            createElement(
                "p",
                "empty-message",
                "There are no new announcements right now."
            )
        );

        return;
    }

    publishedAnnouncements.forEach(item => {

        const card = createElement(
            "article",
            "announcement-card glass-card"
        );

        const icon = createElement(
            "div",
            "announcement-icon",
            "✦"
        );

        const content = createElement(
            "div",
            "announcement-content"
        );

        const topline = createElement(
            "div",
            "announcement-topline"
        );

        const title = createElement(
            "h3",
            "",
            item.title
        );

        const date = createElement(
            "span",
            "content-date",
            formatShortDate(item.date)
        );

        const description = createElement(
            "p",
            "",
            item.description
        );

        topline.append(title, date);
        content.append(topline, description);

        const arrow = createElement(
            "span",
            "announcement-arrow",
            "↗"
        );

        card.append(icon, content, arrow);

        container.appendChild(card);

    });
}


// 6. LOAD ADVERTISEMENTS

function loadAdvertisements() {

    const container = document.getElementById("advertisementList");

    if (!container) return;

    container.replaceChildren();

    const activeAdvertisements = advertisements
        .filter(item => item.active)
        .sort((a, b) => new Date(b.date) - new Date(a.date));

    if (activeAdvertisements.length === 0) {

        container.appendChild(
            createElement(
                "p",
                "empty-message",
                "No sponsored advertisements are available right now."
            )
        );

        return;
    }

    activeAdvertisements.forEach(item => {

        const card = createElement(
            "article",
            "ad-card glass-card"
        );

        // Advertisement banner image
        const image = createElement("img", "ad-banner");

        image.src = item.image;
        image.alt = item.brandName + " advertising banner";
        image.loading = "lazy";

        image.addEventListener("error", () => {
            image.style.display = "none";
        });


        // Advertisement information
        const information = createElement(
            "div",
            "ad-information"
        );

        const topline = createElement(
            "div",
            "ad-topline"
        );

        const brand = createElement(
            "span",
            "ad-brand",
            item.brandName
        );

        const date = createElement(
            "span",
            "ad-date",
            formatShortDate(item.date)
        );

        topline.append(brand, date);

        const sponsored = createElement(
            "span",
            "mini-label",
            "SPONSORED"
        );

        const description = createElement(
            "p",
            "",
            item.description
        );

        information.append(
            topline,
            sponsored,
            description
        );

        card.append(image, information);


        // Open the brand website when a valid link exists
        if (item.link) {

            try {

                const destination = new URL(item.link);

                if (
                    destination.protocol === "https:" ||
                    destination.protocol === "http:"
                ) {

                    card.classList.add("clickable-ad");
                    card.setAttribute("role", "link");
                    card.setAttribute("tabindex", "0");

                    const openAdvertisement = () => {
                        window.open(
                            destination.href,
                            "_blank",
                            "noopener,noreferrer"
                        );
                    };

                    card.addEventListener("click", openAdvertisement);

                    card.addEventListener("keydown", event => {

                        if (
                            event.key === "Enter" ||
                            event.key === " "
                        ) {
                            event.preventDefault();
                            openAdvertisement();
                        }

                    });

                }

            } catch (error) {

                console.warn(
                    "Invalid advertisement link:",
                    item.link
                );

            }

        }

        container.appendChild(card);

    });
}


// 7. COPYRIGHT YEAR

const yearElement = document.getElementById("current-year");

if (yearElement) {

    yearElement.textContent = new Date().getFullYear();

}


// 8. FLOATING NAVIGATION

const floatingNav = document.getElementById("floatingNav");

let previousScrollPosition = window.scrollY;

window.addEventListener("scroll", () => {

    const currentScrollPosition = window.scrollY;

    // Always show navigation at the top
    if (currentScrollPosition <= 80) {

        floatingNav.classList.remove("nav-hidden");

    }

    // Hide while scrolling down
    else if (currentScrollPosition > previousScrollPosition) {

        floatingNav.classList.add("nav-hidden");

    }

    // Show while scrolling up
    else {

        floatingNav.classList.remove("nav-hidden");

    }

    previousScrollPosition = currentScrollPosition;

}, { passive: true });


// 9. SCROLL ENTRANCE ANIMATIONS

const animatedElements = document.querySelectorAll(
    ".glass-card, .section-heading, .closing-card"
);

const observer = new IntersectionObserver((entries) => {

    entries.forEach(entry => {

        if (entry.isIntersecting) {

            entry.target.classList.add("visible");

            observer.unobserve(entry.target);

        }

    });

}, {
    threshold: 0.12
});

animatedElements.forEach(element => {

    element.classList.add("reveal");

    observer.observe(element);

});


// 10. START HOME PAGE

loadAnnouncements();
loadAdvertisements();
