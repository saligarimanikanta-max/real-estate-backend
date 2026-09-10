/**
 * EstateHub Frontend Application Logic
 * Integrates with Express REST API at http://localhost:5000/api
 */

const API = "http://localhost:5000/api";

// Fallback high-res real estate illustration for listings without photos
const DEFAULT_IMG = "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80";

// App State
let token = localStorage.getItem("estateToken");
let currentUser = JSON.parse(localStorage.getItem("estateUser") || "null");
const savedFavourites = new Set();

const $ = (id) => document.getElementById(id);

// -----------------------------------------------------------------------------
// Utilities & Helpers
// -----------------------------------------------------------------------------

function authHeaders(isJson = false) {
  const h = {};
  if (isJson) h["Content-Type"] = "application/json";
  if (token) h["Authorization"] = `Bearer ${token}`;
  return h;
}

function money(amount) {
  if (amount == null || isNaN(amount)) return "Price on request";
  return "₹" + Number(amount).toLocaleString("en-IN");
}

function escapeHtml(str) {
  return String(str ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      }[c])
  );
}

function toast(message, type = "info") {
  const container = $("toastContainer");
  if (!container) return;

  const el = document.createElement("div");
  el.className = `toast toast-${type}`;
  const icon = type === "success" ? "✓" : type === "error" ? "⚠" : "ℹ";
  el.innerHTML = `<span>${icon}</span> <span>${escapeHtml(message)}</span>`;

  container.appendChild(el);

  setTimeout(() => {
    el.style.opacity = "0";
    setTimeout(() => el.remove(), 300);
  }, 4000);
}

// -----------------------------------------------------------------------------
// Authentication & User Session
// -----------------------------------------------------------------------------

async function fetchCurrentUser() {
  if (!token) return;
  try {
    const res = await fetch(`${API}/auth/me`, { headers: authHeaders() });
    if (res.ok) {
      const data = await res.json();
      currentUser = data.data?.user || currentUser;
      localStorage.setItem("estateUser", JSON.stringify(currentUser));
      updateNavbarState();
    }
  } catch (err) {
    console.warn("Could not verify session:", err);
  }
}

function updateNavbarState() {
  const loggedInContainer = $("authActionsLoggedIn");
  const loggedOutContainer = $("authActionsLoggedOut");
  const favBtn = $("navFavouritesBtn");
  const enqBtn = $("navEnquiriesBtn");
  const addPropBtn = $("navAddPropertyBtn");
  const heroPostBtn = $("heroPostPropBtn");

  if (token && currentUser) {
    loggedOutContainer.classList.add("hidden");
    loggedInContainer.classList.remove("hidden");

    $("userName").textContent = currentUser.name || "User";
    $("userRole").textContent = currentUser.role || "buyer";
    $("userAvatar").textContent = (currentUser.name || "U")[0].toUpperCase();

    // Show/Hide Role-specific navigation items
    if (currentUser.role === "buyer") {
      favBtn.classList.remove("hidden");
      enqBtn.classList.remove("hidden");
      $("enquiryNavLabel").textContent = "My Enquiries";
      addPropBtn.classList.add("hidden");
    } else if (currentUser.role === "agent") {
      favBtn.classList.add("hidden");
      enqBtn.classList.remove("hidden");
      $("enquiryNavLabel").textContent = "Leads";
      addPropBtn.classList.remove("hidden");
    } else {
      // Admin
      favBtn.classList.add("hidden");
      enqBtn.classList.add("hidden");
      addPropBtn.classList.add("hidden");
    }

    if (heroPostBtn) {
      heroPostBtn.onclick = () => {
        if (currentUser.role === "agent") {
          openAddPropertyModal();
        } else {
          toast("Only verified agents can post listings. Switch to an agent account!", "info");
        }
      };
    }
  } else {
    loggedInContainer.classList.add("hidden");
    loggedOutContainer.classList.remove("hidden");
    favBtn.classList.add("hidden");
    enqBtn.classList.add("hidden");
    addPropBtn.classList.add("hidden");

    if (heroPostBtn) {
      heroPostBtn.onclick = () => {
        openAuthModal("register");
        toast("Please create an Agent account to list properties.", "info");
      };
    }
  }
}

function openAuthModal(tab = "login") {
  switchAuthTab(tab);
  $("authMessage").textContent = "";
  $("authModal").classList.remove("hidden");
}

function closeAuthModal() {
  $("authModal").classList.add("hidden");
}

function switchAuthTab(tab) {
  const tabLogin = $("tabLogin");
  const tabReg = $("tabRegister");
  const formLogin = $("loginForm");
  const formReg = $("registerForm");
  $("authMessage").textContent = "";

  if (tab === "login") {
    tabLogin.classList.add("active");
    tabReg.classList.remove("active");
    formLogin.classList.remove("hidden");
    formReg.classList.add("hidden");
  } else {
    tabLogin.classList.remove("active");
    tabReg.classList.add("active");
    formLogin.classList.add("hidden");
    formReg.classList.remove("hidden");
  }
}

async function handleLogin(e) {
  e.preventDefault();
  const feedback = $("authMessage");
  feedback.textContent = "Signing in...";
  feedback.style.color = "var(--text-muted)";

  const email = $("loginEmail").value.trim();
  const password = $("loginPassword").value;

  try {
    const res = await fetch(`${API}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Invalid credentials");

    token = data.data?.token;
    currentUser = data.data?.user;
    localStorage.setItem("estateToken", token);
    localStorage.setItem("estateUser", JSON.stringify(currentUser));

    updateNavbarState();
    closeAuthModal();
    toast(`Welcome back, ${currentUser.name}!`, "success");

    if (currentUser.role === "buyer") {
      await loadFavourites();
    }
  } catch (err) {
    feedback.textContent = err.message;
    feedback.style.color = "var(--color-danger)";
  }
}

async function handleRegister(e) {
  e.preventDefault();
  const feedback = $("authMessage");
  feedback.textContent = "Creating your account...";
  feedback.style.color = "var(--text-muted)";

  const name = $("regName").value.trim();
  const email = $("regEmail").value.trim();
  const phone = $("regPhone").value.trim();
  const password = $("regPassword").value;
  const role = $("regRole").value;

  try {
    const res = await fetch(`${API}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, phone, password, role }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Registration failed");

    token = data.data?.token;
    currentUser = data.data?.user;
    localStorage.setItem("estateToken", token);
    localStorage.setItem("estateUser", JSON.stringify(currentUser));

    updateNavbarState();
    closeAuthModal();
    toast(`Account registered successfully as ${role}!`, "success");

    if (role === "agent") {
      toast("Note: Agent listings require admin approval before going public.", "info");
    }
  } catch (err) {
    feedback.textContent = err.message;
    feedback.style.color = "var(--color-danger)";
  }
}

function handleLogout() {
  token = null;
  currentUser = null;
  savedFavourites.clear();
  localStorage.removeItem("estateToken");
  localStorage.removeItem("estateUser");
  updateNavbarState();
  $("favCount").textContent = "0";
  toast("You have signed out.", "info");
  loadProperties();
}

// -----------------------------------------------------------------------------
// Property Listings & Search
// -----------------------------------------------------------------------------

async function loadProperties() {
  const statusEl = $("status");
  const gridEl = $("propertyGrid");
  statusEl.textContent = "Loading properties...";

  const params = new URLSearchParams();
  const city = $("city").value.trim();
  const listingType = $("listingType").value;
  const propertyType = $("propertyType").value;
  const bedrooms = $("bedrooms").value;
  const minPrice = $("minPrice").value;
  const maxPrice = $("maxPrice").value;

  if (city) params.set("city", city);
  if (listingType) params.set("type", listingType);
  if (propertyType) params.set("propertyType", propertyType);
  if (bedrooms) params.set("bedrooms", bedrooms);
  if (minPrice) params.set("minPrice", minPrice);
  if (maxPrice) params.set("maxPrice", maxPrice);
  params.set("limit", "24");

  try {
    const res = await fetch(`${API}/properties/search?${params}`, {
      headers: authHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Could not load properties");

    const list = data.data?.properties || [];

    if (!list.length) {
      gridEl.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <h3>No properties match your criteria</h3>
          <p>Try clearing your filters or searching for another city.</p>
        </div>`;
      statusEl.textContent = "0 properties found.";
      return;
    }

    gridEl.innerHTML = list.map((p) => renderPropertyCard(p)).join("");
    statusEl.textContent = `Showing ${list.length} verified propert${list.length === 1 ? "y" : "ies"}.`;
  } catch (err) {
    statusEl.textContent = `Error: ${err.message}`;
    gridEl.innerHTML = "";
  }
}

function renderPropertyCard(p) {
  const isSaved = savedFavourites.has(p._id);
  const photo = p.images && p.images.length ? p.images[0] : DEFAULT_IMG;
  const purposeTag = p.type === "rent" ? "rent" : "sale";
  const purposeLabel = p.type === "rent" ? "For Rent" : "For Sale";
  const statusLabel = p.status || "Available";

  return `
    <article class="property-card">
      <div class="property-image-wrapper">
        <img 
          class="property-image" 
          src="${escapeHtml(photo)}" 
          alt="${escapeHtml(p.title)}" 
          loading="lazy"
          onerror="this.src='${DEFAULT_IMG}'" 
        />
        <div class="badge-overlay-container">
          <span class="tag-purpose ${purposeTag}">${purposeLabel}</span>
          <span class="tag-status ${statusLabel === "Under Negotiation" ? "negotiation" : ""}">${statusLabel}</span>
        </div>
      </div>

      <div class="property-content">
        <div class="property-price">${money(p.price)}${p.type === "rent" ? "<small style='font-size:0.8rem; font-weight:normal;'> / mo</small>" : ""}</div>
        <h3 class="property-title" title="${escapeHtml(p.title)}">${escapeHtml(p.title)}</h3>
        
        <div class="property-location">
          <span>📍</span>
          <span>${escapeHtml(p.locality ? p.locality + ", " : "")}${escapeHtml(p.city || "India")}</span>
        </div>

        <div class="property-specs">
          <div class="spec-item" title="Bedrooms">
            <span>🛏</span> <span class="spec-value">${p.bedrooms ?? 0}</span> Beds
          </div>
          <div class="spec-item" title="Bathrooms">
            <span>🚿</span> <span class="spec-value">${p.bathrooms ?? 0}</span> Baths
          </div>
          <div class="spec-item" title="Area">
            <span>📐</span> <span class="spec-value">${p.areaSqft ? p.areaSqft.toLocaleString() : "-"}</span> sq.ft
          </div>
        </div>

        <div class="property-card-actions">
          <button class="btn btn-outline full-width" onclick="showDetail('${p._id}')">
            View Details
          </button>
          <button 
            class="btn btn-fav ${isSaved ? "saved" : ""}" 
            title="${isSaved ? "Saved in Favourites" : "Save to Favourites"}"
            onclick="toggleFavourite('${p._id}')"
          >
            ${isSaved ? "♥ Saved" : "♡ Save"}
          </button>
        </div>
      </div>
    </article>
  `;
}

function resetFilters() {
  $("city").value = "";
  $("listingType").value = "";
  $("propertyType").value = "";
  $("bedrooms").value = "";
  $("minPrice").value = "";
  $("maxPrice").value = "";
  loadProperties();
}

// -----------------------------------------------------------------------------
// Property Detail Modal
// -----------------------------------------------------------------------------

async function showDetail(id) {
  const content = $("detailContent");
  content.innerHTML = "<div class='empty-state'>Loading details...</div>";
  $("detailModal").classList.remove("hidden");

  try {
    const res = await fetch(`${API}/properties/${id}`, { headers: authHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to load property details");

    const p = data.data?.property;
    if (!p) throw new Error("Property not found");

    const photo = p.images && p.images.length ? p.images[0] : DEFAULT_IMG;
    const isSaved = savedFavourites.has(p._id);
    const agent = p.agentId || {};

    content.innerHTML = `
      <img class="detail-hero-img" src="${escapeHtml(photo)}" onerror="this.src='${DEFAULT_IMG}'" alt="${escapeHtml(p.title)}" />
      <div class="detail-inner">
        <div class="detail-header-meta">
          <div>
            <div class="section-eyebrow">${escapeHtml(p.propertyType || "Property")} • ${p.type === "rent" ? "For Rent" : "For Sale"}</div>
            <h2 class="modal-title">${escapeHtml(p.title)}</h2>
            <div class="property-location" style="margin-top: 6px;">
              <span>📍</span>
              <span>${escapeHtml(p.locality ? p.locality + ", " : "")}${escapeHtml(p.city || "")}</span>
            </div>
          </div>
          <div class="detail-price">${money(p.price)}${p.type === "rent" ? "<small style='font-size:1rem; font-weight:normal;'>/month</small>" : ""}</div>
        </div>

        <div class="detail-specs-grid">
          <div class="detail-spec-box">
            <span class="detail-spec-label">Bedrooms</span>
            <span class="detail-spec-value">${p.bedrooms ?? "-"} BHK</span>
          </div>
          <div class="detail-spec-box">
            <span class="detail-spec-label">Bathrooms</span>
            <span class="detail-spec-value">${p.bathrooms ?? "-"}</span>
          </div>
          <div class="detail-spec-box">
            <span class="detail-spec-label">Carpet Area</span>
            <span class="detail-spec-value">${p.areaSqft ? p.areaSqft.toLocaleString() + " sq.ft" : "-"}</span>
          </div>
          <div class="detail-spec-box">
            <span class="detail-spec-label">Category</span>
            <span class="detail-spec-value" style="text-transform: capitalize;">${escapeHtml(p.propertyType || "-")}</span>
          </div>
          <div class="detail-spec-box">
            <span class="detail-spec-label">Current Status</span>
            <span class="detail-spec-value">${escapeHtml(p.status || "Available")}</span>
          </div>
        </div>

        <h4 style="margin: 20px 0 8px;">About this property</h4>
        <p style="color: var(--text-muted); line-height: 1.7;">
          ${escapeHtml(p.description || "No description provided by the agent.")}
        </p>

        <div class="agent-box">
          <div>
            <span style="font-size:0.75rem; font-weight:700; color:var(--color-primary); text-transform:uppercase;">Listed by Verified Agent</span>
            <h4 style="margin-top:2px;">${escapeHtml(agent.name || "EstateHub Agent")}</h4>
            <p style="font-size:0.85rem; color:var(--text-muted);">${agent.phone ? "📞 " + escapeHtml(agent.phone) : ""}</p>
          </div>
          <button class="btn btn-outline btn-sm" onclick="toggleFavourite('${p._id}')">
            ${isSaved ? "♥ Saved in Favourites" : "♡ Add to Favourites"}
          </button>
        </div>

        <div class="enquiry-card">
          <h4>Interested in this property?</h4>
          <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:12px;">
            Send an enquiry directly to the agent to schedule a site visit or request pricing.
          </p>
          <textarea id="enquiryInput" placeholder="Hi, I am interested in this listing. Please contact me regarding site visit and pricing details..."></textarea>
          <button class="btn btn-primary full-width" style="margin-top:10px;" onclick="submitEnquiry('${p._id}')">
            ✉ Send Enquiry to Agent
          </button>
        </div>
      </div>
    `;
  } catch (err) {
    content.innerHTML = `<div class="empty-state">Error: ${escapeHtml(err.message)}</div>`;
  }
}

function closeDetailModal() {
  $("detailModal").classList.add("hidden");
}

// -----------------------------------------------------------------------------
// Enquiry Submission
// -----------------------------------------------------------------------------

async function submitEnquiry(propertyId) {
  if (!token) {
    openAuthModal("login");
    toast("Please sign in or register to send an enquiry.", "info");
    return;
  }

  const input = $("enquiryInput");
  const message = input ? input.value.trim() : "";
  if (!message) {
    toast("Please write a short message for the agent.", "error");
    return;
  }

  try {
    const res = await fetch(`${API}/enquiries`, {
      method: "POST",
      headers: authHeaders(true),
      body: JSON.stringify({ propertyId, message }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to submit enquiry");

    toast("Enquiry submitted successfully! The agent will contact you soon.", "success");
    if (input) input.value = "";
  } catch (err) {
    toast(err.message, "error");
  }
}

// -----------------------------------------------------------------------------
// Favourites Module
// -----------------------------------------------------------------------------

async function loadFavourites() {
  if (!token || currentUser?.role !== "buyer") return;
  try {
    const res = await fetch(`${API}/favourites`, { headers: authHeaders() });
    if (!res.ok) return;
    const data = await res.json();
    const list = data.data?.favourites || [];
    savedFavourites.clear();
    list.forEach((f) => {
      if (f.propertyId?._id) savedFavourites.add(f.propertyId._id);
    });
    $("favCount").textContent = String(savedFavourites.size);
  } catch (err) {
    console.warn("Error fetching favourites:", err);
  }
}

async function toggleFavourite(propertyId) {
  if (!token) {
    openAuthModal("login");
    toast("Sign in to save favourite properties.", "info");
    return;
  }
  if (currentUser?.role !== "buyer") {
    toast("Favourites are available for buyer accounts.", "info");
    return;
  }

  const isSaved = savedFavourites.has(propertyId);
  try {
    if (isSaved) {
      const res = await fetch(`${API}/favourites/${propertyId}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.message || "Could not remove favourite");
      }
      savedFavourites.delete(propertyId);
      toast("Removed from your favourites.", "info");
    } else {
      const res = await fetch(`${API}/favourites`, {
        method: "POST",
        headers: authHeaders(true),
        body: JSON.stringify({ propertyId }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.message || "Could not save favourite");
      savedFavourites.add(propertyId);
      toast("Added to your favourites!", "success");
    }

    $("favCount").textContent = String(savedFavourites.size);
    loadProperties();
  } catch (err) {
    toast(err.message, "error");
  }
}

async function openFavouritesModal() {
  const listEl = $("favouritesList");
  listEl.innerHTML = "<p class='empty-state'>Loading your saved favourites...</p>";
  $("favouritesModal").classList.remove("hidden");

  try {
    const res = await fetch(`${API}/favourites`, { headers: authHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Could not load favourites");

    const list = data.data?.favourites || [];
    if (!list.length) {
      listEl.innerHTML = `
        <div class="empty-state">
          <h4>No saved properties yet</h4>
          <p>Click "♡ Save" on any listing to bookmark it here.</p>
        </div>`;
      return;
    }

    listEl.innerHTML = list
      .filter((f) => f.propertyId)
      .map((f) => {
        const p = f.propertyId;
        const photo = p.images && p.images.length ? p.images[0] : DEFAULT_IMG;
        return `
          <div class="list-item-card">
            <div class="list-item-left">
              <img class="list-item-thumb" src="${escapeHtml(photo)}" onerror="this.src='${DEFAULT_IMG}'" alt="${escapeHtml(p.title)}" />
              <div class="list-item-info">
                <h4>${escapeHtml(p.title)}</h4>
                <p>📍 ${escapeHtml(p.locality ? p.locality + ", " : "")}${escapeHtml(p.city || "")} • <b>${money(p.price)}</b></p>
              </div>
            </div>
            <div style="display:flex; gap:8px;">
              <button class="btn btn-outline btn-sm" onclick="closeFavouritesModal(); showDetail('${p._id}')">Details</button>
              <button class="btn btn-fav btn-sm" onclick="removeFavouriteFromModal('${p._id}')">Remove</button>
            </div>
          </div>
        `;
      })
      .join("");
  } catch (err) {
    listEl.innerHTML = `<div class="empty-state">Error: ${escapeHtml(err.message)}</div>`;
  }
}

async function removeFavouriteFromModal(propertyId) {
  await toggleFavourite(propertyId);
  openFavouritesModal();
}

function closeFavouritesModal() {
  $("favouritesModal").classList.add("hidden");
}

// -----------------------------------------------------------------------------
// Enquiries & Agent Leads Modal
// -----------------------------------------------------------------------------

async function openEnquiriesModal() {
  const modal = $("enquiriesModal");
  const listEl = $("enquiriesList");
  const titleEl = $("enquiriesModalTitle");
  const subtitleEl = $("enquiriesModalSubtitle");

  modal.classList.remove("hidden");
  listEl.innerHTML = "<p class='empty-state'>Loading records...</p>";

  const isAgent = currentUser?.role === "agent";

  if (isAgent) {
    titleEl.textContent = "Agent Lead Management";
    subtitleEl.textContent = "Inquiries received from prospective buyers/tenants";

    try {
      const res = await fetch(`${API}/enquiries/agent`, { headers: authHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load leads");

      const list = data.data?.enquiries || [];
      if (!list.length) {
        listEl.innerHTML = `<div class="empty-state">No buyer leads received yet.</div>`;
        return;
      }

      listEl.innerHTML = list
        .map((e) => {
          const prop = e.propertyId || {};
          const buyer = e.buyerId || {};
          return `
            <div class="list-item-card" style="flex-direction:column; align-items:flex-start;">
              <div style="display:flex; justify-content:space-between; width:100%; align-items:center;">
                <h4>${escapeHtml(prop.title || "Property")}</h4>
                <span class="tag-status">${escapeHtml(e.status || "New")}</span>
              </div>
              <p style="margin: 4px 0 8px; font-size:0.85rem; color:var(--text-main);">
                "<em>${escapeHtml(e.message)}</em>"
              </p>
              <div style="font-size:0.8rem; color:var(--text-muted); width:100%; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
                <span>Buyer: <b>${escapeHtml(buyer.name || "Anonymous")}</b> (${escapeHtml(buyer.email || "")}${buyer.phone ? " • " + escapeHtml(buyer.phone) : ""})</span>
                <div style="display:flex; gap:6px;">
                  ${e.status === "New" ? `<button class="btn btn-outline btn-sm" onclick="updateLeadStatus('${e._id}', 'Contacted')">Mark Contacted</button>` : ""}
                  ${e.status === "Contacted" ? `<button class="btn btn-outline btn-sm" onclick="updateLeadStatus('${e._id}', 'In Progress')">Mark In Progress</button>` : ""}
                  ${e.status !== "Closed" ? `<button class="btn btn-outline btn-sm" onclick="updateLeadStatus('${e._id}', 'Closed')">Close Lead</button>` : ""}
                </div>
              </div>
            </div>
          `;
        })
        .join("");
    } catch (err) {
      listEl.innerHTML = `<div class="empty-state">Error: ${escapeHtml(err.message)}</div>`;
    }
  } else {
    // Buyer view
    titleEl.textContent = "My Sent Enquiries";
    subtitleEl.textContent = "Status of properties you inquired about";

    try {
      const res = await fetch(`${API}/enquiries/my`, { headers: authHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load your enquiries");

      const list = data.data?.enquiries || [];
      if (!list.length) {
        listEl.innerHTML = `
          <div class="empty-state">
            <h4>No enquiries submitted yet</h4>
            <p>View any property details and send a direct enquiry to the agent.</p>
          </div>`;
        return;
      }

      listEl.innerHTML = list
        .map((e) => {
          const prop = e.propertyId || {};
          return `
            <div class="list-item-card">
              <div class="list-item-info">
                <h4>${escapeHtml(prop.title || "Property")}</h4>
                <p style="color:var(--text-muted);">📍 ${escapeHtml(prop.city || "")} • ${money(prop.price)}</p>
                <p style="font-size:0.82rem; margin-top:4px;">"${escapeHtml(e.message)}"</p>
              </div>
              <div>
                <span class="tag-status">${escapeHtml(e.status || "New")}</span>
              </div>
            </div>
          `;
        })
        .join("");
    } catch (err) {
      listEl.innerHTML = `<div class="empty-state">Error: ${escapeHtml(err.message)}</div>`;
    }
  }
}

async function updateLeadStatus(enquiryId, status) {
  try {
    const res = await fetch(`${API}/enquiries/${enquiryId}/status`, {
      method: "PUT",
      headers: authHeaders(true),
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to update status");
    toast(`Lead marked as ${status}.`, "success");
    openEnquiriesModal();
  } catch (err) {
    toast(err.message, "error");
  }
}

function closeEnquiriesModal() {
  $("enquiriesModal").classList.add("hidden");
}

// -----------------------------------------------------------------------------
// Agent Add Property
// -----------------------------------------------------------------------------

function openAddPropertyModal() {
  $("addPropertyForm").reset();
  $("addPropertyModal").classList.remove("hidden");
}

function closeAddPropertyModal() {
  $("addPropertyModal").classList.add("hidden");
}

async function handleCreateProperty(e) {
  e.preventDefault();

  const title = $("propTitle").value.trim();
  const type = $("propType").value;
  const propertyType = $("propCategory").value;
  const price = parseFloat($("propPrice").value);
  const city = $("propCity").value.trim();
  const locality = $("propLocality").value.trim();
  const bedrooms = parseInt($("propBedrooms").value, 10) || 0;
  const bathrooms = parseInt($("propBathrooms").value, 10) || 0;
  const areaSqft = parseFloat($("propArea").value) || undefined;
  const imageUrl = $("propImageUrl").value.trim();
  const description = $("propDescription").value.trim();

  const payload = {
    title,
    type,
    propertyType,
    price,
    city,
    locality,
    bedrooms,
    bathrooms,
    areaSqft,
    description,
    images: imageUrl ? [imageUrl] : [],
  };

  try {
    const res = await fetch(`${API}/properties`, {
      method: "POST",
      headers: authHeaders(true),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to create listing");

    toast("Property listed successfully! Awaiting admin verification before going public.", "success");
    closeAddPropertyModal();
    loadProperties();
  } catch (err) {
    toast(err.message, "error");
  }
}

// -----------------------------------------------------------------------------
// Event Listeners & Startup
// -----------------------------------------------------------------------------

$("searchBtn").onclick = loadProperties;
$("resetFilterBtn").onclick = resetFilters;
$("refreshBtn").onclick = loadProperties;
$("openAuthModalBtn").onclick = () => openAuthModal("login");
$("logoutBtn").onclick = handleLogout;
$("navFavouritesBtn").onclick = openFavouritesModal;
$("navEnquiriesBtn").onclick = openEnquiriesModal;
$("navAddPropertyBtn").onclick = openAddPropertyModal;

// Initialize app
(async function init() {
  updateNavbarState();
  if (token) {
    await fetchCurrentUser();
    if (currentUser?.role === "buyer") {
      await loadFavourites();
    }
  }
  loadProperties();
})();
