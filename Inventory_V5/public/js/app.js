(function () {
  "use strict";

  const cfg = window.INVENTORY_CONFIG || {};
  const supabaseUrl = (cfg.supabaseUrl || "").trim();
  const supabaseAnonKey = (cfg.supabaseAnonKey || "").trim();

  let client = null;
  let authSession = null;
  const AUTH_STORAGE_KEY = "inventory_v5_supabase_session";
  const authStateListeners = new Set();

  let authMode = "signin";
  /** @type {{ id: string; email?: string | null } | null} */
  let currentUser = null;

  /** @type {{ id: string; name: string; sort_order: number | null }[]} */
  let categoriesCache = [];
  /** @type {{ id: string; code: string; label: string; sort_order: number | null }[]} */
  let unitsCache = [];

  const $ = (id) => {
    const el = document.getElementById(id);
    if (!el) throw new Error("Missing element #" + id);
    return el;
  };

  function show(el, visible) {
    el.hidden = !visible;
  }

  function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  function formatSupabaseError(err) {
    if (!err) return "Something went wrong.";
    if (typeof err === "string") return err;
    if (err.error_description) return err.error_description;
    if (err.error) return err.error;
    if (err.msg) return err.msg;
    if (err.message) return err.message;
    return String(err);
  }

  function normalizeSupabaseError(err, fallback) {
    if (!err) return { message: fallback || "Something went wrong." };
    if (typeof err === "string") return { message: err };
    if (err instanceof Error) return err;
    const message =
      err.message ||
      err.error_description ||
      err.error ||
      err.msg ||
      fallback ||
      "Something went wrong.";
    return Object.assign({ message }, err);
  }

  function storageGet(key) {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  function storageSet(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      // Ignore storage write failures and continue without persistence.
    }
  }

  function storageRemove(key) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // Ignore storage removal failures.
    }
  }

  function readStoredSession() {
    const raw = storageGet(AUTH_STORAGE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      storageRemove(AUTH_STORAGE_KEY);
      return null;
    }
  }

  function nowEpochSeconds() {
    return Math.floor(Date.now() / 1000);
  }

  function normalizeSession(sessionLike) {
    if (!sessionLike || !sessionLike.access_token) return null;
    const expiresAt = Number(sessionLike.expires_at);
    const expiresIn = Number(sessionLike.expires_in);
    return Object.assign({}, sessionLike, {
      expires_at:
        Number.isFinite(expiresAt) && expiresAt > 0
          ? expiresAt
          : Number.isFinite(expiresIn) && expiresIn > 0
            ? nowEpochSeconds() + expiresIn
            : null,
    });
  }

  function notifyAuthStateChange(event, session) {
    authStateListeners.forEach((listener) => {
      try {
        listener(event, session);
      } catch {
        // Ignore listener failures so auth state stays consistent.
      }
    });
  }

  function setAuthSession(sessionLike, event) {
    authSession = normalizeSession(sessionLike);
    if (authSession) {
      storageSet(AUTH_STORAGE_KEY, JSON.stringify(authSession));
    } else {
      storageRemove(AUTH_STORAGE_KEY);
    }
    if (event) notifyAuthStateChange(event, authSession);
    return authSession;
  }

  function sessionExpiresSoon(sessionLike) {
    return !sessionLike || !sessionLike.expires_at || sessionLike.expires_at - nowEpochSeconds() < 60;
  }

  function buildSupabaseUrl(path) {
    const base = supabaseUrl.endsWith("/") ? supabaseUrl : supabaseUrl + "/";
    return new URL(path.replace(/^\//, ""), base).toString();
  }

  async function parseResponsePayload(res) {
    const text = await res.text();
    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }

  async function supabaseFetch(path, options) {
    const opts = options || {};
    const headers = new Headers(opts.headers || {});
    headers.set("apikey", supabaseAnonKey);
    if (opts.accessToken) {
      headers.set("Authorization", "Bearer " + opts.accessToken);
    }
    let body = opts.body;
    if (body != null && typeof body !== "string") {
      headers.set("Content-Type", "application/json");
      body = JSON.stringify(body);
    }

    const res = await fetch(buildSupabaseUrl(path), {
      method: opts.method || "GET",
      headers,
      body,
    });

    const payload = await parseResponsePayload(res);
    if (!res.ok) {
      throw normalizeSupabaseError(payload, res.status + " " + res.statusText);
    }
    return payload;
  }

  async function fetchAuthenticated(path, options) {
    const session = await getActiveSession();
    if (!session || !session.access_token) {
      throw normalizeSupabaseError({ message: "Your session has expired. Please sign in again." });
    }
    return supabaseFetch(path, Object.assign({}, options, { accessToken: session.access_token }));
  }

  function buildRestPath(table, options) {
    const opts = options || {};
    const params = new URLSearchParams();
    if (opts.select) params.set("select", opts.select);
    if (opts.order && opts.order.length) params.set("order", opts.order.join(","));
    if (opts.filters) {
      for (const filter of opts.filters) {
        params.append(filter.column, (filter.operator || "eq") + "." + String(filter.value));
      }
    }
    const query = params.toString();
    return "/rest/v1/" + table + (query ? "?" + query : "");
  }

  async function restRequest(table, options) {
    const opts = options || {};
    return fetchAuthenticated(buildRestPath(table, opts), {
      method: opts.method || "GET",
      headers: Object.assign(
        { Accept: "application/json" },
        opts.prefer ? { Prefer: opts.prefer } : {},
        opts.headers || {}
      ),
      body: opts.body,
    });
  }

  async function refreshSession() {
    if (!authSession || !authSession.refresh_token) {
      setAuthSession(null, "SIGNED_OUT");
      return null;
    }
    try {
      const refreshed = await supabaseFetch("/auth/v1/token?grant_type=refresh_token", {
        method: "POST",
        body: { refresh_token: authSession.refresh_token },
      });
      return setAuthSession(refreshed, "TOKEN_REFRESHED");
    } catch {
      setAuthSession(null, "SIGNED_OUT");
      return null;
    }
  }

  async function getSessionUser(accessToken) {
    return supabaseFetch("/auth/v1/user", {
      accessToken,
      headers: { Accept: "application/json" },
    });
  }

  function initClient() {
    if (typeof window.fetch !== "function") {
      throw new Error("This browser does not support the Fetch API.");
    }
    authSession = normalizeSession(readStoredSession());
    return { ready: true };
  }

  async function getActiveSession() {
    if (!authSession) {
      authSession = normalizeSession(readStoredSession());
    }
    if (!authSession) return null;
    if (sessionExpiresSoon(authSession)) {
      const refreshed = await refreshSession();
      if (!refreshed) return null;
    }
    if (!authSession.user) {
      try {
        const user = await getSessionUser(authSession.access_token);
        setAuthSession(Object.assign({}, authSession, { user }), null);
      } catch {
        setAuthSession(null, "SIGNED_OUT");
        return null;
      }
    }
    return authSession;
  }

  function onAuthStateChange(listener) {
    authStateListeners.add(listener);
    return function unsubscribe() {
      authStateListeners.delete(listener);
    };
  }

  async function signInWithPassword(email, password) {
    const session = await supabaseFetch("/auth/v1/token?grant_type=password", {
      method: "POST",
      body: { email, password },
    });
    return setAuthSession(session, "SIGNED_IN");
  }

  async function signUpWithPassword(email, password) {
    const payload = await supabaseFetch("/auth/v1/signup", {
      method: "POST",
      body: { email, password },
    });
    const session = payload && payload.access_token ? setAuthSession(payload, "SIGNED_IN") : null;
    return { session, user: payload && payload.user ? payload.user : null };
  }

  async function signOutSession() {
    const session = await getActiveSession();
    try {
      if (session && session.access_token) {
        await supabaseFetch("/auth/v1/logout", {
          method: "POST",
          accessToken: session.access_token,
        });
      }
    } finally {
      setAuthSession(null, "SIGNED_OUT");
    }
  }

  function showSetupBanner() {
    const banner = $("app-setup-banner");
    banner.hidden = false;
    banner.className = "alert alert--warning";
    banner.style.margin = "0";
    banner.style.borderRadius = "0";
    banner.innerHTML =
      "<strong>Configuration needed.</strong> Set <code>supabaseUrl</code> and " +
      "<code>supabaseAnonKey</code> in <code>public/js/config.js</code> (see " +
      "<code>config.example.js</code>). Run the SQL scripts in <code>docs/SUPABASE_MANUAL_SETUP.md</code> first.";
  }

  function setAuthMode(mode) {
    authMode = mode;
    const submit = $("btn-auth-submit");
    const toggle = $("btn-toggle-auth-mode");
    const title = $("auth-visible-title");
    if (mode === "signin") {
      title.textContent = "Sign in";
      submit.textContent = "Sign in";
      toggle.textContent = "Need an account? Sign up";
      $("auth-password").setAttribute("autocomplete", "current-password");
    } else {
      title.textContent = "Sign up";
      submit.textContent = "Sign up";
      toggle.textContent = "Already have an account? Sign in";
      $("auth-password").setAttribute("autocomplete", "new-password");
    }
  }

  function showAuthError(msg) {
    const box = $("auth-alert");
    if (!msg) {
      show(box, false);
      return;
    }
    box.textContent = msg;
    show(box, true);
  }

  function showAuthSuccess(msg) {
    const box = $("auth-success");
    if (!msg) {
      show(box, false);
      return;
    }
    box.textContent = msg;
    show(box, true);
  }

  function showInventoryAlert(msg) {
    const box = $("inventory-alert");
    if (!msg) {
      show(box, false);
      return;
    }
    box.textContent = msg;
    show(box, true);
  }

  function showViewsForSession(user) {
    currentUser = user;
    const authed = !!user;
    show($("app-header"), authed);
    show($("view-auth"), !authed);
    show($("view-inventory"), authed);
    if (user) {
      setText("header-email", user.email || "");
    }
    if (authed) {
      loadReferenceData().then(() => refreshInventoryList());
    }
  }

  async function loadReferenceData() {
    if (!client) return;
    const [catRes, unitRes] = await Promise.all([
      restRequest("product_categories", {
        select: "id,name,sort_order",
        order: ["sort_order.asc.nullslast", "name.asc"],
      }).then((data) => ({ data, error: null })).catch((error) => ({ data: null, error })),
      restRequest("units", {
        select: "id,code,label,sort_order",
        order: ["sort_order.asc.nullslast", "label.asc"],
      }).then((data) => ({ data, error: null })).catch((error) => ({ data: null, error })),
    ]);
    if (catRes.error) throw catRes.error;
    if (unitRes.error) throw unitRes.error;
    categoriesCache = catRes.data || [];
    unitsCache = unitRes.data || [];
    populateReferenceSelects();
  }

  function populateReferenceSelects() {
    const catSel = $("item-category");
    const unitSel = $("item-unit");
    const preserveCat = catSel.value;
    const preserveUnit = unitSel.value;

    catSel.replaceChildren();
    const catPlaceholder = document.createElement("option");
    catPlaceholder.value = "";
    catPlaceholder.textContent = "Select category…";
    catSel.appendChild(catPlaceholder);

    for (const row of categoriesCache) {
      const opt = document.createElement("option");
      opt.value = row.id;
      opt.textContent = row.name;
      catSel.appendChild(opt);
    }

    unitSel.replaceChildren();
    const unitPlaceholder = document.createElement("option");
    unitPlaceholder.value = "";
    unitPlaceholder.textContent = "Select unit…";
    unitSel.appendChild(unitPlaceholder);
    for (const u of unitsCache) {
      const opt = document.createElement("option");
      opt.value = u.id;
      opt.textContent = u.label + " (" + u.code + ")";
      unitSel.appendChild(opt);
    }

    if (preserveCat) catSel.value = preserveCat;
    if (preserveUnit) unitSel.value = preserveUnit;
  }

  function setListLoading(loading) {
    show($("inventory-loading"), loading);
    if (loading) {
      show($("inventory-empty"), false);
      show($("inventory-error"), false);
      show($("inventory-table-wrap"), false);
    }
  }

  function todayISODate() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return y + "-" + m + "-" + day;
  }

  function isExpired(isoDate) {
    if (!isoDate) return false;
    return isoDate < todayISODate();
  }

  function statusBadgeClass(status) {
    if (status === "active") return "badge badge--active";
    if (status === "inactive") return "badge badge--inactive";
    if (status === "discontinued") return "badge badge--discontinued";
    return "badge";
  }

  function formatQty(q, unitRow) {
    const u = unitRow && unitRow.label ? unitRow.label : "";
    const n = q == null ? "" : String(q);
    return u ? n + " " + u : n;
  }

  function formatCategory(cat) {
    if (!cat) return "—";
    const name = cat.name ? String(cat.name) : "";
    return name;
  }

  function enrichInventoryRow(row) {
    const cat = categoriesCache.find((c) => c.id === row.category_id);
    const unit = unitsCache.find((u) => u.id === row.unit_id);
    return Object.assign({}, row, {
      product_categories: cat ? { name: cat.name } : null,
      units: unit ? { code: unit.code, label: unit.label } : null,
    });
  }

  async function refreshInventoryList() {
    if (!client) return;
    showInventoryAlert("");
    setListLoading(true);
    let data = null;
    let error = null;

    const withEmbed = await restRequest("inventory_items", {
      select:
        "id,code,barcode,name,category_id,supplier,expiry_date,status,cost_price,selling_price,quantity,unit_id,updated_at,product_categories(name),units(code,label)",
      order: ["updated_at.desc"],
    }).then((data) => ({ data, error: null })).catch((err) => ({ data: null, error: err }));

    if (withEmbed.error) {
      const plain = await restRequest("inventory_items", {
        select:
          "id,code,barcode,name,category_id,supplier,expiry_date,status,cost_price,selling_price,quantity,unit_id,updated_at",
        order: ["updated_at.desc"],
      }).then((rows) => ({ data: rows, error: null })).catch((err) => ({ data: null, error: err }));
      error = plain.error;
      data = (plain.data || []).map(enrichInventoryRow);
    } else {
      data = withEmbed.data;
      error = withEmbed.error;
    }

    setListLoading(false);

    if (error) {
      show($("inventory-error"), true);
      $("inventory-error").textContent =
        "Could not load inventory: " + formatSupabaseError(error);
      show($("inventory-empty"), false);
      show($("inventory-table-wrap"), false);
      return;
    }

    show($("inventory-error"), false);
    const rows = data || [];
    const tbody = $("inventory-tbody");
    tbody.replaceChildren();

    if (!rows.length) {
      show($("inventory-empty"), true);
      show($("inventory-table-wrap"), false);
      return;
    }

    show($("inventory-empty"), false);
    show($("inventory-table-wrap"), true);

    for (const row of rows) {
      const tr = document.createElement("tr");

      const tdCode = document.createElement("td");
      tdCode.textContent = row.code || "";
      tr.appendChild(tdCode);

      const tdName = document.createElement("td");
      tdName.textContent = row.name || "";
      if (row.status === "active" && isExpired(row.expiry_date)) {
        const warn = document.createElement("div");
        warn.className = "text-muted";
        warn.style.marginTop = "var(--space-1)";
        warn.textContent = "Expiry passed — consider updating status.";
        tdName.appendChild(warn);
      }
      tr.appendChild(tdName);

      const tdCat = document.createElement("td");
      tdCat.textContent = formatCategory(row.product_categories);
      tr.appendChild(tdCat);

      const tdQty = document.createElement("td");
      tdQty.textContent = formatQty(row.quantity, row.units);
      tr.appendChild(tdQty);

      const tdStatus = document.createElement("td");
      const badge = document.createElement("span");
      badge.className = statusBadgeClass(row.status);
      badge.textContent = row.status || "";
      tdStatus.appendChild(badge);
      tr.appendChild(tdStatus);

      const tdAct = document.createElement("td");
      tdAct.className = "data-table__actions";
      const btnEdit = document.createElement("button");
      btnEdit.type = "button";
      btnEdit.className = "btn btn--ghost btn--sm";
      btnEdit.textContent = "Edit";
      btnEdit.addEventListener("click", () => openItemDialog(row));
      const btnDel = document.createElement("button");
      btnDel.type = "button";
      btnDel.className = "btn btn--danger btn--sm";
      btnDel.textContent = "Delete";
      btnDel.addEventListener("click", () => deleteItem(row));
      tdAct.appendChild(btnEdit);
      tdAct.appendChild(btnDel);
      tr.appendChild(tdAct);

      tbody.appendChild(tr);
    }
  }

  async function deleteItem(row) {
    if (!client) return;
    const ok = window.confirm(
      "Delete this item? This cannot be undone.\n\n" + (row.name || row.code || row.id)
    );
    if (!ok) return;
    showInventoryAlert("");
    const error = await restRequest("inventory_items", {
      method: "DELETE",
      filters: [{ column: "id", operator: "eq", value: row.id }],
      prefer: "return=minimal",
    }).then(() => null).catch((err) => err);
    if (error) {
      showInventoryAlert(formatSupabaseError(error));
      return;
    }
    await refreshInventoryList();
  }

  const dialog = $("dialog-item");

  function closeItemDialog() {
    if (dialog.open) dialog.close();
    clearFormItemAlerts();
  }

  function clearFormItemAlerts() {
    show($("form-item-alert"), false);
    show($("form-item-warning"), false);
    $("form-item-alert").textContent = "";
    $("form-item-warning").textContent = "";
    document.querySelectorAll(".field--error").forEach((el) => el.classList.remove("field--error"));
    document.querySelectorAll(".field__error").forEach((el) => {
      el.hidden = true;
      el.textContent = "";
    });
  }

  function openItemDialog(existing) {
    clearFormItemAlerts();
    $("form-item").reset();
    $("item-id").value = existing ? existing.id : "";
    $("dialog-item-title").textContent = existing ? "Edit item" : "Add item";
    $("item-status").value = "active";
    $("item-quantity").value = "0";

    if (existing) {
      $("item-code").value = existing.code || "";
      $("item-barcode").value = existing.barcode || "";
      $("item-name").value = existing.name || "";
      $("item-category").value = existing.category_id || "";
      $("item-unit").value = existing.unit_id || "";
      $("item-supplier").value = existing.supplier || "";
      $("item-expiry").value = existing.expiry_date || "";
      $("item-status").value = existing.status || "active";
      $("item-quantity").value =
        existing.quantity != null ? String(existing.quantity) : "0";
      $("item-cost").value =
        existing.cost_price != null ? String(existing.cost_price) : "";
      $("item-selling").value =
        existing.selling_price != null ? String(existing.selling_price) : "";
    }

    updateExpiryWarning();
    if (!dialog.open) dialog.showModal();
    $("item-code").focus();
  }

  function updateExpiryWarning() {
    const exp = $("item-expiry").value;
    const status = $("item-status").value;
    const warn = $("form-item-warning");
    if (status === "active" && isExpired(exp)) {
      warn.textContent =
        "This expiry date is in the past while status is Active. You may want to update status or the date.";
      show(warn, true);
    } else {
      show(warn, false);
    }
  }

  function parseOptionalDecimal(input) {
    const t = (input || "").trim();
    if (!t) return null;
    const n = Number(t);
    if (!Number.isFinite(n)) return NaN;
    return n;
  }

  function parseRequiredDecimal(input, minInclusive) {
    const t = (input || "").trim();
    if (!t) return NaN;
    const n = Number(t);
    if (!Number.isFinite(n)) return NaN;
    if (n < minInclusive) return NaN;
    return n;
  }

  function setFieldError(fieldId, errId, message) {
    const wrap = $(fieldId);
    const err = $(errId);
    if (message) {
      wrap.classList.add("field--error");
      err.textContent = message;
      err.hidden = false;
    } else {
      wrap.classList.remove("field--error");
      err.hidden = true;
      err.textContent = "";
    }
  }

  function validateItemForm() {
    let ok = true;
    const code = $("item-code").value.trim();
    const name = $("item-name").value.trim();
    const categoryId = $("item-category").value;
    const unitId = $("item-unit").value;
    const qty = parseRequiredDecimal($("item-quantity").value, 0);
    const cost = parseOptionalDecimal($("item-cost").value);
    const sell = parseOptionalDecimal($("item-selling").value);
    const barcode = $("item-barcode").value.trim();

    setFieldError("field-code", "err-code", "");
    setFieldError("field-name", "err-name", "");
    setFieldError("field-category", "err-category", "");
    setFieldError("field-unit", "err-unit", "");
    setFieldError("field-quantity", "err-quantity", "");
    setFieldError("field-cost", "err-cost", "");
    setFieldError("field-selling", "err-selling", "");
    setFieldError("field-barcode", "err-barcode", "");

    if (!code) {
      setFieldError("field-code", "err-code", "Product code is required.");
      ok = false;
    }
    if (!name) {
      setFieldError("field-name", "err-name", "Name is required.");
      ok = false;
    }
    if (!categoryId) {
      setFieldError("field-category", "err-category", "Choose a category.");
      ok = false;
    }
    if (!unitId) {
      setFieldError("field-unit", "err-unit", "Choose a unit of measure.");
      ok = false;
    }
    if (!Number.isFinite(qty)) {
      setFieldError("field-quantity", "err-quantity", "Enter a valid quantity (0 or greater).");
      ok = false;
    }
    if ($("item-cost").value.trim() && !Number.isFinite(cost)) {
      setFieldError("field-cost", "err-cost", "Enter a valid number or leave blank.");
      ok = false;
    } else if (Number.isFinite(cost) && cost < 0) {
      setFieldError("field-cost", "err-cost", "Cost must be 0 or greater.");
      ok = false;
    }
    if ($("item-selling").value.trim() && !Number.isFinite(sell)) {
      setFieldError("field-selling", "err-selling", "Enter a valid number or leave blank.");
      ok = false;
    } else if (Number.isFinite(sell) && sell < 0) {
      setFieldError("field-selling", "err-selling", "Selling price must be 0 or greater.");
      ok = false;
    }
    if (barcode && barcode.length > 120) {
      setFieldError("field-barcode", "err-barcode", "Barcode is too long.");
      ok = false;
    }

    return ok;
  }

  async function saveItem(ev) {
    ev.preventDefault();
    if (!client || !currentUser) return;
    clearFormItemAlerts();
    if (!validateItemForm()) return;

    const id = $("item-id").value.trim();
    const payload = {
      code: $("item-code").value.trim(),
      barcode: $("item-barcode").value.trim() || null,
      name: $("item-name").value.trim(),
      category_id: $("item-category").value,
      supplier: $("item-supplier").value.trim() || null,
      expiry_date: $("item-expiry").value || null,
      status: $("item-status").value,
      cost_price: parseOptionalDecimal($("item-cost").value),
      selling_price: parseOptionalDecimal($("item-selling").value),
      quantity: parseRequiredDecimal($("item-quantity").value, 0),
      unit_id: $("item-unit").value,
    };

    const btn = $("btn-item-save");
    btn.disabled = true;

    try {
      if (id) {
        await restRequest("inventory_items", {
          method: "PATCH",
          body: {
            code: payload.code,
            barcode: payload.barcode,
            name: payload.name,
            category_id: payload.category_id,
            supplier: payload.supplier,
            expiry_date: payload.expiry_date,
            status: payload.status,
            cost_price: payload.cost_price,
            selling_price: payload.selling_price,
            quantity: payload.quantity,
            unit_id: payload.unit_id,
          },
          filters: [
            { column: "id", operator: "eq", value: id },
            { column: "user_id", operator: "eq", value: currentUser.id },
          ],
          prefer: "return=minimal",
        });
      } else {
        await restRequest("inventory_items", {
          method: "POST",
          body: {
            user_id: currentUser.id,
            ...payload,
          },
          prefer: "return=minimal",
        });
      }
      closeItemDialog();
      await refreshInventoryList();
    } catch (err) {
      const msg = formatSupabaseError(err);
      const friendly =
        msg.includes("duplicate key") || msg.includes("23505")
          ? "That code or barcode is already used on another of your items."
          : msg;
      $("form-item-alert").textContent = friendly;
      show($("form-item-alert"), true);
    } finally {
      btn.disabled = false;
    }
  }

  async function handleAuthSubmit(ev) {
    ev.preventDefault();
    if (!client) return;
    showAuthError("");
    showAuthSuccess("");
    const email = $("auth-email").value.trim();
    const password = $("auth-password").value;
    const btn = $("btn-auth-submit");
    btn.disabled = true;
    try {
      if (authMode === "signin") {
        await signInWithPassword(email, password);
      } else {
        const data = await signUpWithPassword(email, password);
        if (data.session) {
          showAuthSuccess("Account created. You are signed in.");
        } else {
          showAuthSuccess(
            "Check your email to confirm your account, then sign in. If confirmation is disabled in Supabase, try signing in now."
          );
        }
      }
    } catch (err) {
      showAuthError(formatSupabaseError(err));
    } finally {
      btn.disabled = false;
    }
  }

  async function handleSignOut() {
    if (!client) return;
    showInventoryAlert("");
    await signOutSession();
  }

  function wireEvents() {
    $("btn-toggle-auth-mode").addEventListener("click", () => {
      setAuthMode(authMode === "signin" ? "signup" : "signin");
      showAuthError("");
      showAuthSuccess("");
    });
    $("form-auth").addEventListener("submit", handleAuthSubmit);
    $("btn-sign-out").addEventListener("click", handleSignOut);
    $("btn-add-item").addEventListener("click", () => openItemDialog(null));
    $("form-item").addEventListener("submit", saveItem);
    $("btn-dialog-close").addEventListener("click", closeItemDialog);
    $("btn-item-cancel").addEventListener("click", closeItemDialog);
    $("item-expiry").addEventListener("change", updateExpiryWarning);
    $("item-status").addEventListener("change", updateExpiryWarning);
  }

  async function boot() {
    if (!supabaseUrl || !supabaseAnonKey) {
      showSetupBanner();
      return;
    }

    try {
      client = initClient();
    } catch (e) {
      showSetupBanner();
      $("app-setup-banner").textContent = formatSupabaseError(e);
      return;
    }

    wireEvents();
    setAuthMode("signin");

    const session = await getActiveSession();
    showViewsForSession(session && session.user ? session.user : null);

    onAuthStateChange((_event, session) => {
      showViewsForSession(session && session.user ? session.user : null);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
