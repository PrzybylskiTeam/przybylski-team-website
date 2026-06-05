
const STATUS_LABELS = {
  active: "Active",
  pending: "Pending",
  sold: "Sold"
};

function getParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

async function getJSON(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`Could not load ${path}`);
  return response.json();
}

function statusClass(status) {
  if (status === "pending") return "status pending";
  if (status === "sold") return "status sold";
  return "status";
}

function propertyCard(property) {
  const detailLink = property.status === "sold"
    ? "contact.html"
    : `property.html?id=${encodeURIComponent(property.id)}`;

  const linkText = property.status === "sold"
    ? "Ask About Your Home Value"
    : "View Property Details";

  return `
    <article class="listing">
      <a href="${detailLink}" aria-label="View ${property.address}">
        <div class="listing-image">
          <img src="${property.image}" alt="${property.address}" onerror="this.style.display='none'; this.parentElement.textContent='PROPERTY PHOTO';" />
        </div>
      </a>
      <div class="listing-body">
        <span class="${statusClass(property.status)}">${STATUS_LABELS[property.status] || property.status}</span>
        <h3>${property.address}</h3>
        <div class="price">${property.price}</div>
        <div class="details">${property.beds} Beds • ${property.baths} Baths • ${property.sqft} Sq Ft • MLS #${property.mls}</div>
        <p>${property.shortDescription}</p>
        <a class="small-link" href="${detailLink}">${linkText}</a>
      </div>
    </article>
  `;
}

async function renderFeaturedProperties() {
  const container = document.getElementById("featured-properties");
  if (!container) return;

  try {
    const properties = await getJSON("data/properties.json");
    const featured = properties.filter(p => p.featured).slice(0, 3);
    container.innerHTML = featured.length
      ? featured.map(propertyCard).join("")
      : `<div class="empty-state">No featured properties have been added yet.</div>`;
  } catch (error) {
    container.innerHTML = `<div class="empty-state">Property data could not be loaded.</div>`;
  }
}

async function renderPropertiesPage() {
  const grid = document.getElementById("properties-grid");
  const buttons = document.querySelectorAll("[data-filter]");
  if (!grid) return;

  let properties = [];
  try {
    properties = await getJSON("data/properties.json");
  } catch (error) {
    grid.innerHTML = `<div class="empty-state">Property data could not be loaded.</div>`;
    return;
  }

  const initial = getParam("status") || "all";

  function applyFilter(filter) {
    buttons.forEach(button => button.classList.toggle("active", button.dataset.filter === filter));
    const filtered = filter === "all" ? properties : properties.filter(p => p.status === filter);
    grid.innerHTML = filtered.length
      ? filtered.map(propertyCard).join("")
      : `<div class="empty-state">No ${filter === "all" ? "" : filter} properties have been added yet.</div>`;
  }

  buttons.forEach(button => button.addEventListener("click", () => {
    const filter = button.dataset.filter;
    history.replaceState(null, "", filter === "all" ? "properties.html" : `properties.html?status=${filter}`);
    applyFilter(filter);
  }));

  applyFilter(initial);
}

async function renderPropertyDetail() {
  const detail = document.getElementById("property-detail");
  if (!detail) return;

  try {
    const properties = await getJSON("data/properties.json");
    const id = getParam("id");
    const property = properties.find(p => p.id === id);

    if (!property) {
      detail.innerHTML = `<div class="empty-state">Property not found. <a class="small-link" href="properties.html">Back to properties</a></div>`;
      return;
    }

    document.getElementById("property-title").textContent = property.address;
    document.getElementById("property-subtitle").textContent = `${property.city} • ${STATUS_LABELS[property.status] || property.status}`;

    const features = (property.features || []).map(feature => `<li>${feature}</li>`).join("");
    const externalButton = property.externalLink
      ? `<a class="btn btn-burgundy" href="${property.externalLink}" target="_blank" rel="noopener">View MLS / Full Listing</a>`
      : "";

    detail.innerHTML = `
      <main class="property-main">
        <img class="property-photo" src="${property.image}" alt="${property.address}" onerror="this.remove();" />
        <span class="${statusClass(property.status)}">${STATUS_LABELS[property.status] || property.status}</span>
        <h2>${property.address}</h2>
        <div class="price">${property.price}</div>
        <p>${property.description}</p>

        <div class="property-facts">
          <div class="fact"><strong>${property.beds}</strong>Beds</div>
          <div class="fact"><strong>${property.baths}</strong>Baths</div>
          <div class="fact"><strong>${property.sqft}</strong>Sq Ft</div>
          <div class="fact"><strong>${property.mls}</strong>MLS #</div>
        </div>

        <h3 style="color: var(--navy-dark);">Highlights</h3>
        <ul>${features}</ul>
      </main>

      <aside class="property-side">
        <h3>Interested in this property?</h3>
        <p>Call or text the Przybylski Team for details, availability, showing options, or similar homes.</p>
        <div class="response-badge">We typically respond within an hour.</div>
        <div class="button-row">
          <a class="btn btn-gold" href="tel:8144823344">Call or Text</a>
          <a class="btn btn-burgundy" href="mailto:PrzybylskiTeam@TryAgresti.com?subject=${encodeURIComponent(property.address)}">Email Us</a>
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
      <span class="platform">${review.platform}</span>
      <div class="stars">${stars(review.rating)}</div>
      <blockquote>“${review.quote}”</blockquote>
      <p><strong>${review.name}</strong> ${review.date ? `• ${review.date}` : ""}</p>
      ${link}
    </article>
  `;
}

async function renderFeaturedReviews() {
  const container = document.getElementById("featured-reviews");
  if (!container) return;

  try {
    const reviews = await getJSON("data/reviews.json");
    const featured = reviews.filter(r => r.featured).slice(0, 2);
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
    const reviews = await getJSON("data/reviews.json");
    container.innerHTML = reviews.length
      ? reviews.map(reviewCard).join("")
      : `<div class="empty-state">No reviews have been added yet.</div>`;
  } catch (error) {
    container.innerHTML = `<div class="empty-state">Review data could not be loaded.</div>`;
  }
}
