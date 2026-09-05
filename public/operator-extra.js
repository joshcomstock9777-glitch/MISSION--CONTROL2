const SISTER_STATUSES = ["ACTIVE", "UNVERIFIED", "POC", "NOT SOURCE OF TRUTH"];

function sisterStatusMatch(current, candidate) {
  return String(current || "").toUpperCase() === String(candidate || "").toUpperCase();
}

function renderRepos(repos) {
  const el = $("repos");
  if (!repos?.length) {
    el.innerHTML = `<div class="empty">No sister repos</div>`;
    return;
  }
  el.innerHTML = repos
    .map(
      (r) => `
    <div class="row repo-row" data-name="${escapeHtml(r.name)}">
      <div class="repo-info">
        <div class="name"><a class="link" href="${escapeHtml(r.url || "#")}" target="_blank" rel="noreferrer">${escapeHtml(r.name)}</a></div>
        <div class="lane">${escapeHtml(r.role || "")}</div>
        <div class="status-line">${pill(r.status)}</div>
      </div>
      <div class="btn-group repo-btns">
        ${SISTER_STATUSES.map(
          (st) =>
            `<button type="button" class="btn sm ${sisterStatusMatch(r.status, st) ? "active" : ""}" data-status="${st}">${st === "NOT SOURCE OF TRUTH" ? "NOT SOT" : st}</button>`
        ).join("")}
      </div>
    </div>`
    )
    .join("");

  el.querySelectorAll(".repo-btns button").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const name = btn.closest(".repo-row").dataset.name;
      const status = btn.dataset.status;
      btn.disabled = true;
      try {
        await api(`/api/sister-repos/${encodeURIComponent(name)}`, {
          method: "PATCH",
          body: JSON.stringify({ status, updatedBy: "operator-ui" }),
        });
        await refresh();
      } catch (err) {
        alert("Sister repo update failed: " + err.message);
      } finally {
        btn.disabled = false;
      }
    });
  });
}

function wireSweep() {
  const btn = $("sweep-btn");
  if (!btn || btn.dataset.wired === "1") return;
  btn.dataset.wired = "1";
  btn.addEventListener("click", async () => {
    btn.disabled = true;
    try {
      await api("/api/sweep", {
        method: "POST",
        body: JSON.stringify({ updatedBy: "operator-ui" }),
      });
      await refresh();
    } catch (err) {
      alert("Sweep failed: " + err.message);
    } finally {
      btn.disabled = false;
    }
  });
}

wireSweep();
