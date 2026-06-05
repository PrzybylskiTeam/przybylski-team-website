const STATUS_LABELS = {
  active: "Active",
  pending: "Pending",
  sold: "Sold"
};

const STATUS_PAGE_TITLES = {
  active: "current listings",
  pending: "pending properties",
  sold: "past sales"
};

const PROPERTIES_PER_PAGE = 25;

function getParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

async function getJSON(path) {
  const response = await fetch(path, { cache: "no-store" });
  if (!response.ok) throw new Error(`Could not load ${path}`);
  return response.json();
}

async function getProperties() {
  const data = await getJSON("data/properties.json");
  return Array.isArray(data) ? data : (data.properties || []);
}

async function getReviews() {
  const data = await getJSON("data/reviews.json");
  return Array.isArray(data) ? data : (data.reviews || []);
}

function statusClass(status) {
  if (status === "pending") return "status pending";
  if (status === "sold") return "status sold";
  return "status";
}

function getSortDate(item) {
  return new Date(item.sortDate || item.soldDate || item.pendingDate || item.listDate || item.date || "1900-01-01").getTime();
}

function mostRecent(items, count = 3) {
  return [...items].sort((a, b) => getSortDate(b) - getSortDate(a)).slice(0, count);
}

function safe(value, fallback = "") {
  return value === undefined || value === null || value === "" ? fallback : value;
}

function propertyCard(property) {
  const hasDetailPage = property.status === "active" || property.status === "pending";
  const detailLink = hasDetailPage
    ? `property.html?id=${encodeURIComponent(property.id)}`
    : "contact.html";

  const linkText = property.status === "sold"
    ? "Ask About Your Home Value"
    : "View Property Details";

  const meta = property.status === "sold"
    ? `${safe(property.city, "Erie, PA")} • ${safe(property.propertyType, "Residential")}`
    : `${safe(property.beds, "-")} Beds • ${safe(property.baths, "-")} Baths • ${safe(property.sqft, "-")} Sq Ft • MLS #${safe(property.mls, "-")}`;

  const image = safe(property.image, "images/listing-placeholder.jpg");

  return `
    <article class="listing">
      <a href="${detailLink}" aria-label="View ${safe(property.address, "property details")}">
        <div class="listing-image">
          <img src="${image}" alt="${safe(property.address, "Property photo")}" onerror="this.style.display='none'; this.parentElement.textContent='PROPERTY PHOTO';" />
        </div>
      </a>
      <div class="listing-body">
        <span class="${statusClass(property.status)}">${STATUS_LABELS[property.status] || property.status}</span>
        <h3>${safe(property.address, "Property Address")}</h3>
        <div class="price">${safe(property.price, "Contact for price")}</div>
        <div class="details">${meta}</div>
        <p>${safe(property.shortDescription, "Contact the Przybylski Team for details on this property.")}</p>
        <a class="small-link" href="${detailLink}">${linkText}</a>
      </div>
    </article>
  `;
}

function getCurrentPage() {
  const page = parseInt(getParam("page") || "1", 10);
  return Number.isFinite(page) && page > 0 ? page : 1;
}

function setPageInUrl(page) {
  const url = new URL(window.location.href);
  if (page <= 1) url.searchParams.delete("page");
  else url.searchParams.set("page", String(page));
  history.replaceState(null, "", url.pathname + url.search);
}

function renderPagination(container, items, currentPage, onPageChange) {
  let pagination = document.getElementById("pagination");
  if (!pagination) {
    pagination = document.createElement("div");
    pagination.id = "pagination";
    pagination.className = "pagination";
    container.insertAdjacentElement("afterend", pagination);
  }

  const totalPages = Math.ceil(items.length / PROPERTIES_PER_PAGE);
  if (totalPages <= 1) {
    pagination.innerHTML = "";
    return;
  }

  const buttons = [];
  buttons.push(`<button ${currentPage === 1 ? "disabled" : ""} data-page="${currentPage - 1}">Previous</button>`);

  for (let page = 1; page <= totalPages; page++) {
    if (page === 1 || page === totalPages || Math.abs(page - currentPage) <= 2) {
      buttons.push(`<button class="${page === currentPage ? "active" : ""}" data-page="${page}">${page}</button>`);
    } else if (!buttons[buttons.length - 1].includes("ellipsis")) {
      buttons.push(`<span class="ellipsis">…</span>`);
    }
  }

  buttons.push(`<button ${currentPage === totalPages ? "disabled" : ""} data-page="${currentPage + 1}">Next</button>`);
  pagination.innerHTML = buttons.join("");

  pagination.querySelectorAll("button[data-page]").forEach(button => {
    button.addEventListener("click", () => {
      const page = parseInt(button.dataset.page, 10);
      if (page >= 1 && page <= totalPages) onPageChange(page);
    });
  });
}

function renderPagedProperties(grid, properties, page = 1) {
  const totalPages = Math.max(1, Math.ceil(properties.length / PROPERTIES_PER_PAGE));
  const currentPage = Math.min(Math.max(page, 1), totalPages);
  const start = (currentPage - 1) * PROPERTIES_PER_PAGE;
  const pageItems = properties.slice(start, start + PROPERTIES_PER_PAGE);

  grid.innerHTML = pageItems.length
    ? pageItems.map(propertyCard).join("")
    : `<div class="empty-state">No properties have been added yet.</div>`;

  renderPagination(grid, properties, currentPage, newPage => {
    setPageInUrl(newPage);
    renderPagedProperties(grid, properties, newPage);
    window.scrollTo({ top: grid.offsetTop - 120, behavior: "smooth" });
  });
}

async function renderHomepageActivity() {
  const activePendingContainer = document.getElementById("homepage-active-pending");
  const salesContainer = document.getElementById("homepage-sales");
  if (!activePendingContainer && !salesContainer) return;

  try {
    const properties = await getProperties();
    const activePending = mostRecent(properties.filter(p => p.status === "active" || p.status === "pending"), 3);
    const sales = mostRecent(properties.filter(p => p.status === "sold"), 3);

    if (activePendingContainer) {
      activePendingContainer.innerHTML = activePending.length
        ? activePending.map(propertyCard).join("")
        : `<div class="empty-state">No current listings or pending properties have been added yet.</div>`;
    }

    if (salesContainer) {
      salesContainer.innerHTML = sales.length
        ? sales.map(propertyCard).join("")
        : `<div class="empty-state">No past sales have been added yet.</div>`;
    }
  } catch (error) {
    const message = `<div class="empty-state">Property data could not be loaded.</div>`;
    if (activePendingContainer) activePendingContainer.innerHTML = message;
    if (salesContainer) salesContainer.innerHTML = message;
  }
}

async function renderPropertyCollection(status) {
  const grid = document.getElementById("properties-grid");
  if (!grid) return;

  try {
    const properties = await getProperties();
    const filtered = mostRecent(properties.filter(p => p.status === status), 9999);
    if (!filtered.length) {
      grid.innerHTML = `<div class="empty-state">No ${STATUS_PAGE_TITLES[status] || "properties"} have been added yet.</div>`;
      return;
    }
    renderPagedProperties(grid, filtered, getCurrentPage());
  } catch (error) {
    grid.innerHTML = `<div class="empty-state">Property data could not be loaded.</div>`;
  }
}

async function renderPropertiesPage() {
  const grid = document.getElementById("properties-grid");
  const buttons = document.querySelectorAll("[data-filter]");
  if (!grid) return;

  let properties = [];
  try {
    properties = await getProperties();
  } catch (error) {
    grid.innerHTML = `<div class="empty-state">Property data could not be loaded.</div>`;
    return;
  }

  const initial = getParam("status") || "all";

  function applyFilter(filter, page = 1) {
    buttons.forEach(button => button.classList.toggle("active", button.dataset.filter === filter));
    const filtered = filter === "all" ? mostRecent(properties, 9999) : mostRecent(properties.filter(p => p.status === filter), 9999);

    const url = new URL(window.location.href);
    if (filter === "all") url.searchParams.delete("status"); else url.searchParams.set("status", filter);
    if (page <= 1) url.searchParams.delete("page"); else url.searchParams.set("page", String(page));
    history.replaceState(null, "", url.pathname + url.search);

    if (!filtered.length) {
      grid.innerHTML = `<div class="empty-state">No ${filter === "all" ? "" : filter} properties have been added yet.</div>`;
      return;
    }
    renderPagedProperties(grid, filtered, page);
  }

  buttons.forEach(button => button.addEventListener("click", () => applyFilter(button.dataset.filter, 1)));
  applyFilter(initial, getCurrentPage());
}

async function renderPropertyDetail() {
  const detail = document.getElementById("property-detail");
  if (!detail) return;

  try {
    const properties = await getProperties();
    const id = getParam("id");
    const property = properties.find(p => p.id === id);

    if (!property || property.status === "sold") {
      detail.innerHTML = `<div class="empty-state">Property detail page not found. <a class="small-link" href="current-listings.html">Back to listings</a></div>`;
      return;
    }

    document.getElementById("property-title").textContent = safe(property.address, "Property Details");
    document.getElementById("property-subtitle").textContent = `${safe(property.city, "Erie, PA")} • ${STATUS_LABELS[property.status] || property.status}`;

    const features = (property.features || []).filter(Boolean).map(feature => `<li>${feature}</li>`).join("");
    const externalButton = property.externalLink
      ? `<a class="btn btn-burgundy" href="${property.externalLink}" target="_blank" rel="noopener">View MLS / Full Listing</a>`
      : "";

    detail.innerHTML = `
      <main class="property-main">
        <img class="property-photo" src="${safe(property.image, "images/listing-placeholder.jpg")}" alt="${safe(property.address, "Property photo")}" onerror="this.remove();" />
        <span class="${statusClass(property.status)}">${STATUS_LABELS[property.status] || property.status}</span>
        <h2>${safe(property.address, "Property Address")}</h2>
        <div class="price">${safe(property.price, "Contact for price")}</div>
        <p>${safe(property.description, property.shortDescription)}</p>

        <div class="property-facts">
          <div class="fact"><strong>${safe(property.beds, "-")}</strong>Beds</div>
          <div class="fact"><strong>${safe(property.baths, "-")}</strong>Baths</div>
          <div class="fact"><strong>${safe(property.sqft, "-")}</strong>Sq Ft</div>
          <div class="fact"><strong>${safe(property.mls, "-")}</strong>MLS #</div>
        </div>

        ${features ? `<h3 style="color: var(--navy-dark);">Highlights</h3><ul>${features}</ul>` : ""}
      </main>

      <aside class="property-side">
        <h3>Interested in this property?</h3>
        <p>Call or text the Przybylski Team for details, availability, showing options, or similar homes.</p>
        <div class="response-badge">We typically respond within an hour.</div>
        <div class="button-row">
          <a class="btn btn-gold" href="tel:8144823344">Call or Text</a>
          <a class="btn btn-burgundy" href="mailto:PrzybylskiTeam@TryAgresti.com?subject=${encodeURIComponent(safe(property.address, "Property inquiry"))}">Email Us</a>
          ${externalButton}
        </div>
      </aside>
    `;
  } catch (error) {
    detail.innerHTML = `<div class="empty-state">Property data could not be loaded.</div>`;
  }
}

function stars(rating) {
  const count = Math.max(0, Math.min(5, Number(rating) || 0));
  return "★".repeat(count) + "☆".repeat(5 - count);
}

function reviewCard(review) {
  const link = review.link ? `<a class="small-link" href="${review.link}" target="_blank" rel="noopener">View Source</a>` : "";
  return `
    <article class="review-card">
      <span class="platform">${safe(review.platform, "Review")}</span>
      <div class="stars">${stars(review.rating)}</div>
      <blockquote>“${safe(review.quote, "") }”</blockquote>
      <p><strong>${safe(review.name, "Client")}</strong> ${review.date ? `• ${review.date}` : ""}</p>
      ${link}
    </article>
  `;
}

async function renderFeaturedReviews() {
  const container = document.getElementById("featured-reviews");
  if (!container) return;

  try {
    const reviews = await getReviews();
    const featured = mostRecent(reviews.filter(r => r.featured), 3);
    container.innerHTML = featured.length
      ? featured.map(reviewCard).join("")
      : `<div class="empty-state">No featured reviews have been added yet.</div>`;
  } catch (error) {
    container.innerHTML = `<div class="empty-state">Review data could not be loaded.</div>`;
  }
}

async function renderReviewsPage() {
  const container = document.getElementById("reviews-list");
  if (!container) return;

  try {
    const reviews = await getReviews();
    const sorted = mostRecent(reviews, 500);
    container.innerHTML = sorted.length
      ? sorted.map(reviewCard).join("")
      : `<div class="empty-state">No reviews have been added yet.</div>`;
  } catch (error) {
    container.innerHTML = `<div class="empty-state">Review data could not be loaded.</div>`;
  }
}
