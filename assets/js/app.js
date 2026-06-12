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

const TYPE_LABELS = {
  residential: "Residential",
  vacant_land: "Vacant Land",
  multifamily: "Multi-Family",
  investment: "Investment",
  commercial: "Commercial",
  mobile_manufactured: "Mobile / Manufactured",
  condo: "Condo / Townhome",
  other: "Property"
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

function safe(value, fallback = "") {
  return value === undefined || value === null || value === "" ? fallback : value;
}

function hasValue(value) {
  return value !== undefined && value !== null && value !== "" && value !== "0" && value !== 0;
}

function statusClass(status) {
  if (status === "pending") return "status pending";
  if (status === "sold") return "status sold";
  return "status";
}

function typeLabel(property) {
  return property.propertyCategoryLabel || property.propertyType || TYPE_LABELS[property.propertyCategory] || "Property";
}

function getSortDate(item) {
  return new Date(item.sortDate || item.soldDate || item.pendingDate || item.listDate || item.date || "1900-01-01").getTime();
}

function formatDate(value) {
  if (!hasValue(value)) return "";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function displayPrice(property) {
  if (property.status === "sold") return safe(property.soldPrice || property.price, "Sold");
  return safe(property.price || property.listPrice, "Contact for price");
}

function soldMeta(property) {
  if (property.status !== "sold") return "";
  const items = [];
  if (hasValue(property.soldDate)) items.push(`<span><strong>Sold:</strong> ${formatDate(property.soldDate)}</span>`);
  if (hasValue(property.listPrice)) items.push(`<span><strong>List Price:</strong> ${property.listPrice}</span>`);
  if (hasValue(property.representedSide)) items.push(`<span><strong>Represented:</strong> ${property.representedSide}</span>`);
  if (hasValue(property.assistingAgent)) items.push(`<span><strong>Assisted by:</strong> ${property.assistingAgent}</span>`);
  if (!items.length && !hasValue(property.saleNotes)) return "";
  return `<div class="sold-meta">${items.join("")}${property.saleNotes ? `<p>${property.saleNotes}</p>` : ""}</div>`;
}

function mostRecent(items, count = 3) {
  return [...items].sort((a, b) => getSortDate(b) - getSortDate(a)).slice(0, count);
}

function propertyUrl(property) {
  return `property.html?id=${encodeURIComponent(property.id)}`;
}

function fullPropertyUrl(property) {
  const base = `${window.location.origin}${window.location.pathname.replace(/[^/]*$/, "")}`;
  return `${base}${propertyUrl(property)}`;
}

function normalizeImage(path) {
  return safe(path, "images/listing-placeholder.jpg");
}

function getDisplayFacts(property, options = {}) {
  const category = property.propertyCategory || "residential";
  const facts = [];

  const add = (label, value) => {
    if (hasValue(value)) facts.push({ label, value });
  };

  if (category === "vacant_land") {
    add("Acres", property.acres || property.lotSize);
    add("Lot Size", property.lotSize);
    add("Zoning", property.zoning);
    add("Frontage", property.frontage);
    add("Utilities", property.utilities);
    add("MLS #", property.mls);
  } else if (category === "multifamily" || category === "investment") {
    add("Units", property.units);
    add("Beds", property.beds);
    add("Baths", property.baths);
    add("Sq Ft", property.sqft);
    add("Gross Rent", property.grossRent);
    add("MLS #", property.mls);
  } else if (category === "commercial") {
    add("Sq Ft", property.sqft);
    add("Acres", property.acres || property.lotSize);
    add("Zoning", property.zoning);
    add("Use", property.useType || property.propertyType);
    add("MLS #", property.mls);
  } else {
    add("Beds", property.beds);
    add("Baths", property.baths);
    add("Sq Ft", property.sqft);
    add("Acres", property.acres);
    add("MLS #", property.mls);
  }

  if (!facts.length && options.fallback !== false) {
    add("Type", typeLabel(property));
    add("Area", property.city);
  }

  return facts;
}

function getTagList(property) {
  const tags = [];
  if (property.status) tags.push(STATUS_LABELS[property.status] || property.status);
  tags.push(typeLabel(property));
  if (Array.isArray(property.tags)) tags.push(...property.tags.filter(Boolean));
  return [...new Set(tags)].slice(0, 6);
}

function propertyCard(property) {
  const hasDetailPage = property.status === "active" || property.status === "pending";
  const detailLink = hasDetailPage ? propertyUrl(property) : "contact.html";
  const linkText = property.status === "sold" ? "Ask About Your Home Value" : "View Property Details";
  const image = normalizeImage(property.image);
  const facts = getDisplayFacts(property).slice(0, 4);
  const tags = getTagList(property).slice(1, 4);

  return `
    <article class="listing premium-listing-card">
      <a href="${detailLink}" aria-label="View ${safe(property.address, "property details")}">
        <div class="listing-image premium-listing-image">
          <img src="${image}" alt="${safe(property.address, "Property photo")}" onerror="this.style.display='none'; this.parentElement.classList.add('missing-image'); this.parentElement.textContent='Property Photo';" />
          <span class="listing-status-overlay ${property.status || "active"}">${STATUS_LABELS[property.status] || safe(property.status, "Active")}</span>
        </div>
      </a>
      <div class="listing-body premium-listing-body">
        <div class="tag-row">${tags.map(tag => `<span class="type-chip">${tag}</span>`).join("")}</div>
        <h3>${safe(property.address, "Property Address")}</h3>
        <div class="price">${displayPrice(property)}</div>
        <div class="mini-facts">
          ${facts.map(fact => `<span><strong>${fact.value}</strong>${fact.label}</span>`).join("")}
        </div>
        ${soldMeta(property)}
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

function renderGallery(property) {
  const gallery = Array.isArray(property.gallery) ? property.gallery.filter(Boolean) : [];
  const images = [property.image, ...gallery].filter(Boolean).slice(0, 8);
  if (!images.length) return `<img class="property-hero-photo" src="images/listing-placeholder.jpg" alt="Property photo" />`;
  if (images.length === 1) return `<img class="property-hero-photo" src="${images[0]}" alt="${safe(property.address, "Property photo")}" />`;

  return `
    <div class="property-gallery-grid">
      <img class="gallery-main" src="${images[0]}" alt="${safe(property.address, "Property photo")}" />
      ${images.slice(1, 5).map(img => `<img src="${img}" alt="${safe(property.address, "Property photo")}" />`).join("")}
    </div>
  `;
}

function renderDetailFacts(property) {
  const facts = getDisplayFacts(property);
  return facts.length ? `
    <div class="property-facts elevated-facts">
      ${facts.map(fact => `<div class="fact"><strong>${fact.value}</strong><span>${fact.label}</span></div>`).join("")}
    </div>
  ` : "";
}

function renderHighlights(property) {
  const features = (property.features || []).filter(Boolean);
  if (!features.length) return "";
  return `
    <section class="detail-panel">
      <h3>Highlights</h3>
      <div class="highlight-grid">
        ${features.map(feature => `<div class="highlight-pill">${feature}</div>`).join("")}
      </div>
    </section>
  `;
}

function qrUrlFor(url) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=12&data=${encodeURIComponent(url)}`;
}

async function renderPropertyDetail() {
  const detail = document.getElementById("property-detail");
  if (!detail) return;

  try {
    const properties = await getProperties();
    const id = getParam("id");
    const property = properties.find(p => p.id === id);

    if (!property) {
      detail.innerHTML = `<div class="empty-state">Property detail page not found. <a class="small-link" href="current-listings.html">Back to listings</a></div>`;
      return;
    }

    document.title = `${safe(property.address, "Property Details")} | Przybylski Team`;
    const titleEl = document.getElementById("property-title");
    const subtitleEl = document.getElementById("property-subtitle");
    if (titleEl) titleEl.textContent = safe(property.address, "Property Details");
    if (subtitleEl) subtitleEl.textContent = `${safe(property.city, "Erie, PA")} • ${typeLabel(property)} • ${STATUS_LABELS[property.status] || property.status}`;

    const pageUrl = fullPropertyUrl(property);
    const qrImage = qrUrlFor(pageUrl);
    const externalButton = property.externalLink
      ? `<a class="btn btn-burgundy" href="${property.externalLink}" target="_blank" rel="noopener">View MLS / Full Listing</a>`
      : "";
    const mapQuery = encodeURIComponent(`${safe(property.address)} ${safe(property.city)}`);

    detail.innerHTML = `
      <main class="property-detail-shell">
        <section class="property-hero-card">
          <div class="tag-row large-tags">
            <span class="${statusClass(property.status)}">${STATUS_LABELS[property.status] || property.status}</span>
            <span class="type-chip gold-chip">${typeLabel(property)}</span>
          </div>
          <h2>${safe(property.address, "Property Address")}</h2>
          <div class="property-price-line">${displayPrice(property)}</div>
          <p class="property-location-line">${safe(property.city, "Erie, PA")}</p>
          ${soldMeta(property)}
          ${renderDetailFacts(property)}
        </section>

        <div class="property-detail-grid">
          <div class="property-left-column">
            <section class="detail-panel gallery-panel">
              ${renderGallery(property)}
            </section>

            <section class="detail-panel description-panel">
              <h3>Property Overview</h3>
              <p>${safe(property.description, property.shortDescription || "Contact the Przybylski Team for details on this property.")}</p>
            </section>

            ${renderHighlights(property)}

            <section class="detail-panel print-flyer-panel">
              <h3>Print-friendly flyer</h3>
              <p>Use this for open houses, showing packets, or sign riders. The QR code points back to this property page.</p>
              <button class="btn btn-burgundy" onclick="window.print()">Print Property Flyer</button>
            </section>
          </div>

          <aside class="property-sidebar premium-sidebar">
            <div class="sidebar-card contact-sidebar-card">
              <h3>Interested in this property?</h3>
              <p>Call or text the Przybylski Team for details, availability, showing options, or similar homes.</p>
              <div class="response-badge">We typically respond within an hour.</div>
              <div class="button-row sidebar-buttons">
                <a class="btn btn-gold" href="tel:8144823344">Call or Text</a>
                <a class="btn btn-burgundy" href="mailto:PrzybylskiTeam@TryAgresti.com?subject=${encodeURIComponent(safe(property.address, "Property inquiry"))}">Email Us</a>
                ${externalButton}
              </div>
            </div>

            <div class="sidebar-card qr-card">
              <h3>Scan for this listing</h3>
              <img src="${qrImage}" alt="QR code for ${safe(property.address, "property page")}" />
              <p>QR code links to this property page.</p>
              <a class="small-link" href="${qrImage}" target="_blank" rel="noopener">Open QR Code</a>
            </div>

            <div class="sidebar-card small-detail-card">
              <h3>Quick Links</h3>
              <a class="small-link" href="https://www.google.com/maps/search/?api=1&query=${mapQuery}" target="_blank" rel="noopener">Open in Google Maps</a>
              <a class="small-link" href="contact.html">Ask a Question</a>
              <a class="small-link" href="current-listings.html">Back to Listings</a>
            </div>
          </aside>
        </div>
      </main>
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
