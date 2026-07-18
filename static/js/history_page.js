(function () {
  "use strict";

  const list = document.getElementById("page-history-list");
  const clearBtn = document.getElementById("page-clear-history-btn");

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function renderEmpty() {
    list.innerHTML = `
      <li class="history-page-empty">
        <h2>No prompts yet</h2>
        <p>Generated prompts you copy or download from the builder will show up here.</p>
      </li>`;
  }

  async function loadHistory() {
    try {
      const response = await fetch("/get-prompts");
      const prompts = await response.json();

      list.innerHTML = "";

      if (!Array.isArray(prompts) || prompts.length === 0) {
        renderEmpty();
        return;
      }

      prompts.forEach((item) => {
        const li = document.createElement("li");
        li.className = "history-page-item";
        li.innerHTML = `
          <div class="history-page-item-meta">
            <strong>${escapeHtml(item.name || "Generated prompt")}</strong>
            <span>${escapeHtml(item.created_at || "")}</span>
          </div>
          <pre class="history-page-prompt">${escapeHtml(item.prompt || "")}</pre>
          <div class="history-page-item-actions">
            <button type="button" class="btn btn-secondary btn-sm copy-history-btn">Copy prompt</button>
          </div>`;

        li.querySelector(".copy-history-btn").addEventListener("click", async (e) => {
          const btn = e.currentTarget;
          try {
            await navigator.clipboard.writeText(item.prompt || "");
            const original = btn.textContent;
            btn.textContent = "Copied";
            setTimeout(() => { btn.textContent = original; }, 1500);
          } catch (err) {
            console.error(err);
          }
        });

        list.appendChild(li);
      });
    } catch (err) {
      console.error(err);
      list.innerHTML = `
        <li class="history-page-empty">
          <h2>Couldn't load history</h2>
          <p>Something went wrong fetching your prompts. Try refreshing the page.</p>
        </li>`;
    }
  }

  async function clearHistory() {
    if (!confirm("Delete all prompts? This can't be undone.")) return;

    clearBtn.disabled = true;
    try {
      await fetch("/clear-prompts", { method: "POST" });
      await loadHistory();
    } catch (err) {
      console.error(err);
    } finally {
      clearBtn.disabled = false;
    }
  }

  clearBtn.addEventListener("click", clearHistory);

  loadHistory();
})();
