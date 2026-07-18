(function () {
  "use strict";

  const els = {
    name: document.getElementById("name"),
    category: document.getElementById("category"),
    logoType: document.getElementById("logo_type"),
    style: document.getElementById("style"),
    detailing: document.getElementById("detailing"),
    vibe: document.getElementById("vibe"),
    colors: document.getElementById("colors"),
    symbol: document.getElementById("symbol"),
    ratioPreset: document.getElementById("ratio_preset"),
    ratioCustom: document.getElementById("ratio_custom"),
    includeTip: document.getElementById("include-tip"),
    categoryHint: document.getElementById("category-hint"),
    swatchRow: document.getElementById("swatch-row"),
    promptOutput: document.getElementById("prompt-output"),
    wordCount: document.getElementById("word-count"),
    copyBtn: document.getElementById("copy-btn"),
    downloadBtn: document.getElementById("download-btn"),
    copyFeedback: document.getElementById("copy-feedback"),
    randomizeBtn: document.getElementById("randomize-btn"),
    clearBtn: document.getElementById("clear-btn"),
    clearHistoryBtn: document.getElementById("clear-history-btn"),
    historyList: document.getElementById("history-list"),
    ticketNo: document.getElementById("ticket-no"),
    form: document.getElementById("logo-form"),
  };

  // Concept inspiration + placeholder names per category
  const CATEGORY_IDEAS = {
    Tech: {
      concept: "a circuit-inspired abstract mark, connected nodes, or a forward-facing arrow",
      sampleName: "Nimbus Systems"
    },
    Fintech: {
      concept: "an ascending bar or coin-inspired abstract shape suggesting growth and trust",
      sampleName: "Ledger & Vale"
    },
    Health: {
      concept: "a pulse line, leaf, or shield motif suggesting care and vitality",
      sampleName: "Everwell Clinic"
    },
    Education: {
      concept: "an open book, ascending path, or lightbulb-and-leaf hybrid suggesting growth through learning",
      sampleName: "Sulehri Paper Mart"
    },
    Food: {
      concept: "a wheat sprig, steam swirl, or utensil silhouette suggesting freshness",
      sampleName: "Harvest & Hearth"
    },
    Retail: {
      concept: "a shopping-bag silhouette or interlocking geometric shape suggesting variety",
      sampleName: "Marrow & Co."
    },
    Consulting: {
      concept: "a compass, ascending steps, or interlocking arrows suggesting direction and strategy",
      sampleName: "Northbridge Partners"
    }
  };

  // Representative swatch colors per palette option
  const PALETTE_SWATCHES = {
    "Monochrome": ["#1a1a1a", "#5c5c5c", "#bfbfbf"],
    "Navy/Gold": ["#1b2a4a", "#d98e04", "#f5efe1"],
    "Neon/Vibrant": ["#ff3d81", "#00e0c6", "#ffd400"],
    "Pastel": ["#f7c6c7", "#c9e4de", "#f9f1c6"],
    "Earth Tones": ["#7a5230", "#a9744f", "#c8a165"],
    "Forest Green/Charcoal": ["#1f3d2b", "#3f7369", "#2b2b2b"]
  };

  const HISTORY_PREFIX = "logoPromptBuilder.history";
  const MAX_HISTORY = 8;
  const CURRENT_EMAIL_KEY = "logoPromptBuilder.currentEmail";
  const VERIFIED_EMAILS_KEY = "logoPromptBuilder.verifiedEmails";
  const EMAIL_HISTORY_KEY = "logoPromptBuilder.emailHistory";
  const MAX_EMAIL_HISTORY = 10;
  const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const PLACEHOLDER_EMPTY = "Fill in the business name and category to see your prompt take shape here.";
  const PLACEHOLDER_LOCKED = "Your ticket is ready. Verify your email to generate and reveal the prompt.";

  let ticketCounter = 1;
  let pendingAction = null;
  let pendingVerification = null; // { email, code }

  function pad(n) { return String(n).padStart(3, "0"); }

  function randomFrom(list) { return list[Math.floor(Math.random() * list.length)]; }

  function getSelectOptions(selectEl) {
    return Array.from(selectEl.options).map(o => o.value);
  }

  function currentRatio() {
    if (els.ratioPreset.value === "custom") {
      return els.ratioCustom.value.trim() || "1:1";
    }
    return els.ratioPreset.value;
  }

  function requiredFieldsValid() {
    return Boolean(els.name.value.trim() && els.category.value);
  }

  function buildPromptText() {
    const name = els.name.value.trim();
    const category = els.category.value;
    const idea = CATEGORY_IDEAS[category];
    const concept = els.symbol.value.trim() || (idea ? idea.concept : "a clean, symbolic representation of the industry");

    let prompt =
      `Generate a professional high-quality logo for '${name}'. ` +
      `Industry: ${category}. ` +
      `Logo Style: ${els.style.value}. ` +
      `Visual Detailing: ${els.detailing.value}. ` +
      `Logo Type: ${els.logoType.value}. ` +
      `Color Palette: ${els.colors.value}. ` +
      `Mood: ${els.vibe.value}. ` +
      `Concept: ${concept}. ` +
      `Output requirements: ${els.detailing.value}, professional branding, centered, ` +
      `white background, high resolution, vector aesthetics. ` +
      `Aspect Ratio: ${currentRatio()}.`;

    if (els.includeTip.checked && idea) {
      prompt += ` Consider incorporating ${idea.concept} to reinforce the ${category.toLowerCase()} identity.`;
    }

    return prompt;
  }

  function updatePreview() {

    const valid = requiredFieldsValid();

    if (!valid) {
        els.promptOutput.textContent = PLACEHOLDER_EMPTY;
        els.wordCount.textContent = "0 words";
        return;
    }

    const prompt = buildPromptText();

    els.promptOutput.textContent = prompt;

    const words = prompt.trim().split(/\s+/).length;

    els.wordCount.textContent = `${words} words`;
}

  function markValidity() {
    els.name.classList.toggle("invalid", false);
    els.category.classList.toggle("invalid", false);
  }


  /* ---------------- Form helpers ---------------- */

  function updateCategoryHint() {
    const idea = CATEGORY_IDEAS[els.category.value];
    els.categoryHint.textContent = idea
      ? `Tip: try ${idea.concept}.`
      : "Pick a category to see abstract concept ideas.";
  }

  function updateSwatches() {
    const colorsList = PALETTE_SWATCHES[els.colors.value] || [];
    els.swatchRow.innerHTML = "";
    colorsList.forEach(hex => {
      const dot = document.createElement("span");
      dot.className = "swatch";
      dot.style.background = hex;
      els.swatchRow.appendChild(dot);
    });
  }

  function handleRatioPresetChange() {
    const isCustom = els.ratioPreset.value === "custom";
    els.ratioCustom.disabled = !isCustom;
    if (!isCustom) els.ratioCustom.value = "";
    updatePreview();
  }

  function randomizeForm() {
    els.category.value = randomFrom(getSelectOptions(els.category).filter(Boolean));
    els.logoType.value = randomFrom(getSelectOptions(els.logoType));
    els.style.value = randomFrom(getSelectOptions(els.style));
    els.detailing.value = randomFrom(getSelectOptions(els.detailing));
    els.vibe.value = randomFrom(getSelectOptions(els.vibe));
    els.colors.value = randomFrom(getSelectOptions(els.colors));
    els.ratioPreset.value = randomFrom(getSelectOptions(els.ratioPreset).filter(v => v !== "custom"));
    els.ratioCustom.disabled = true;
    els.ratioCustom.value = "";

    if (!els.name.value.trim()) {
      const idea = CATEGORY_IDEAS[els.category.value];
      els.name.value = idea ? idea.sampleName : "Ridgeline Studio";
    }

    updateCategoryHint();
    updateSwatches();
    updatePreview();
  }

  function clearForm() {
    els.form.reset();
    els.ratioCustom.disabled = true;
    updateCategoryHint();
    updateSwatches();
    updatePreview();
  }

  function showFeedback(message) {
    els.copyFeedback.textContent = message;
    setTimeout(() => {
      if (els.copyFeedback.textContent === message) {
        els.copyFeedback.textContent = "";
      }
    }, 3000);
  }

  /* ---------------- Copy / download (gated) ---------------- */

  async function copyPrompt() {

    if (!requiredFieldsValid()) {
        showFeedback("Fill all required fields first.");
        return;
    }

    const prompt = buildPromptText();

    await navigator.clipboard.writeText(prompt);

    showFeedback("Prompt copied.");

    savePrompt(prompt);
}

  function downloadPrompt() {

    if (!requiredFieldsValid()) {

        showFeedback("Add a business name and category first.");

        return;

    }

    const prompt = buildPromptText();

    const blob = new Blob([prompt], {
        type: "text/plain"
    });

    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");

    const safeName =
        (els.name.value.trim() || "logo-prompt")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-");

    a.href = url;

    a.download = `${safeName}-prompt.txt`;

    document.body.appendChild(a);

    a.click();

    document.body.removeChild(a);

    URL.revokeObjectURL(url);

    savePrompt(prompt);

}

  /* ---------------- Per-email prompt history (dashboard isolation) ---------------- */
async function renderHistory() {

    try {

        const response = await fetch("/get-prompts");

        const prompts = await response.json();

        els.historyList.innerHTML = "";

        if (prompts.length === 0) {

            els.historyList.innerHTML =
                `<li class="history-empty">
                    No prompts generated yet.
                </li>`;

            return;

        }

        prompts.forEach(item => {

            const li = document.createElement("li");

            li.className = "history-item";

            li.innerHTML =
                `<strong>${item.name}</strong><br>
                 ${item.created_at}`;

            li.onclick = () => {

                els.promptOutput.textContent = item.prompt;

                els.wordCount.textContent =
                    item.prompt.trim().split(/\s+/).length + " words";

            };

            els.historyList.appendChild(li);

        });

    }

    catch(err){

        console.error(err);

    }

}

async function clearHistory(){

    if(!confirm("Delete all prompts?"))
        return;

    await fetch("/clear-prompts",{

        method:"POST"

    });

    renderHistory();

}

  function bumpTicketNumber() {
    ticketCounter += 1;
    els.ticketNo.textContent = `No. ${pad(ticketCounter)}`;
  }
  async function savePrompt(prompt) {

    try {

        const response = await fetch("/save-prompt", {

            method: "POST",

            headers: {
                "Content-Type":
                "application/x-www-form-urlencoded"
            },

            body: "prompt=" + encodeURIComponent(prompt)

        });

        const data = await response.json();

        console.log(data);

    }
    catch(err){

        console.error(err);

    }

}

  // Wire up events
  [els.name, els.symbol, els.ratioCustom].forEach(el =>
    el.addEventListener("input", updatePreview)
  );
  [els.logoType, els.style, els.detailing, els.vibe, els.includeTip].forEach(el =>
    el.addEventListener("change", updatePreview)
  );
  els.category.addEventListener("change", () => {
    updateCategoryHint();
    updatePreview();
  });
  els.colors.addEventListener("change", () => {
    updateSwatches();
    updatePreview();
  });
  els.ratioPreset.addEventListener("change", handleRatioPresetChange);

  els.copyBtn.addEventListener("click", () => { copyPrompt(); bumpTicketNumber(); });
  els.downloadBtn.addEventListener("click", () => { downloadPrompt(); bumpTicketNumber(); });
  els.randomizeBtn.addEventListener("click", randomizeForm);
  els.clearBtn.addEventListener("click", clearForm);
  els.clearHistoryBtn.addEventListener("click", clearHistory);


  // Init
  updateCategoryHint();
  updateSwatches();
  updatePreview();
  renderHistory();
})();