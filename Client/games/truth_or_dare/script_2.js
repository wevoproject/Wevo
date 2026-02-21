localStorage.setItem("wevo_learning-speed", 6);
localStorage.setItem("wevo_reduction-coef", 0.5);
localStorage.setItem("iteration_algo_cringe_level", 0);


function createPlayerVariables() {
  const storedConfig = localStorage.getItem("wevo_app_json");
  if (!storedConfig) return false;

  const config = JSON.parse(storedConfig);
  const players = config.Players || [];

  players.forEach((player) => {
    if (player.Name) {
      const key = `wevo_cringe_estimated_${player.Name}`;
      const key2 = `wevo_cringe_last_action_${player.Name}`;
      if (localStorage.getItem(key) === null) {
        localStorage.setItem(key, 10);
        localStorage.setItem(key2, 0);
      }
    }
  });
  return true;
}

const waitForConfigInterval = setInterval(() => {
  if (createPlayerVariables()) {
    clearInterval(waitForConfigInterval);
  }
}, 500);

const resetConfigBtn = document.getElementById("reset-localstorage-btn");
resetConfigBtn.addEventListener("click", () => {
  localStorage.removeItem("wevo_app_json");
  localStorage.removeItem("wevo_system_json");

  Object.keys(localStorage).forEach((key) => {
    if (
      key.startsWith("wevo_") &&
      key !== "wevo_app_json" &&
      key !== "wevo_system_json"
    ) {
      localStorage.removeItem(key);
    }
  });

  showAlert("Configuration réinitialisée", "success");
  location.reload();
});

const downloadConfigBtn = document.getElementById("download-config-btn");
downloadConfigBtn.addEventListener("click", () => {
  const configJSON = localStorage.getItem("wevo_app_json");
  if (!configJSON) {
    showAlert("Aucune configuration à télécharger", "error");
    return;
  }

  const blob = new Blob([configJSON], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "wevo_app_json.json";
  a.click();
  URL.revokeObjectURL(url);
  showAlert("Configuration téléchargée", "success");
});

const nameUserDiv = document.getElementById("name-user");

function pickRandomPlayer() {
  const storedConfig = localStorage.getItem("wevo_app_json");
  if (!storedConfig) {
    showAlert("No configuration found!", "error");
    return null;
  }

  const config = JSON.parse(storedConfig);
  const players = config.Players;
  if (!players || players.length === 0) {
    showAlert("No players in configuration!", "error");
    return null;
  }

  const randomIndex = Math.floor(Math.random() * players.length);
  const selectedPlayer = players[randomIndex];

  localStorage.setItem("wevo_selected_player", JSON.stringify(selectedPlayer));

  nameUserDiv.textContent = selectedPlayer.Name || "Unknown";

  return selectedPlayer;
}

newRoundBtn.addEventListener("click", () => {
  pickRandomPlayer();
  openPopup(choicePopUp);
});

let selectedChoice = null;

const saveBtn = document.getElementById("close-choice");

truthBtn.addEventListener("click", () => {
  selectedChoice = "Truth";
  truthBtn.classList.add("selected");
  dareBtn.classList.remove("selected");
});

dareBtn.addEventListener("click", () => {
  selectedChoice = "Dare";
  dareBtn.classList.add("selected");
  truthBtn.classList.remove("selected");
});

saveBtn.addEventListener("click", () => {
  if (!selectedChoice) return;

  localStorage.setItem("wevo_last_choice", selectedChoice);

  selectedChoice = null;
  truthBtn.classList.remove("selected");
  dareBtn.classList.remove("selected");
});

const finishBtn = document.getElementById("quit");
const stars = document.querySelectorAll("#review .star");

let selectedStars = 0;

stars.forEach((star) => {
  star.addEventListener("click", () => {
    selectedStars = parseInt(star.dataset.value, 10);
    stars.forEach((s) => {
      if (parseInt(s.dataset.value, 10) <= selectedStars) {
        s.classList.add("selected");
      } else {
        s.classList.remove("selected");
      }
    });
  });
});

finishBtn.addEventListener("click", () => {
  localStorage.setItem("wevo_last_review", selectedStars);

  stars.forEach((star) => star.classList.remove("selected"));
  selectedStars = 0;
});

function sigma(x) {
  return 1 / (1 + Math.exp(-x));
}

/**
 * @param {number} E_prev
 * @param {number} A_prev
 * @param {number} N_prev
 * @param {number} alpha
 * @param {number} beta
 * @param {number} i
 * @returns {number}
 */
function updateCringeEstimation(E_prev, A_prev, N_prev, alpha, beta, i) {
  const denom = Math.abs(E_prev - A_prev) || 0.001; // évite la division par 0
  const delta = (alpha / (beta * i)) * ((2.5 - N_prev) / denom);
  return 100 * sigma(E_prev + delta);
}

function replaceNumbers(text) {
  return text.replace(/\[(\d+)_number_(\d+)\]/g, (_, a, b) => {
    const min = parseInt(a), max = parseInt(b);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  });
}

function replaceChoices(text, choices) {
  return text.replace(/\[([a-zA-ZÀ-ÿ_]+)\]/g, (match, key) => {
    if (choices && choices[key]) {
      const arr = choices[key];
      return arr[Math.floor(Math.random() * arr.length)];
    }
    return match;
  });
}

/**
 * @param {string}   text
 * @param {object}   player
 * @param {object[]} players
 * @returns {string}
 */
function replacePlayers(text, player, players) {
  const others = players.filter((p) => p.Name !== player.Name);

  /**
   * Pick a player from pool using relation weights from the current player.
   * Relation_with_<Name> on player gives the weight (0-10).
   * Missing relation defaults to 5.
   */
  function pickWeighted(pool) {
    if (!pool.length) return "???";
    const weights = pool.map(p => {
      const key = `Relation_with_${p.Name}`;
      const val = player[key];
      return (val !== undefined ? parseFloat(val) : 5) + 0.1; // +0.1 avoid zero-weight
    });
    const total = weights.reduce((s, w) => s + w, 0);
    let r = Math.random() * total;
    for (let i = 0; i < pool.length; i++) {
      r -= weights[i];
      if (r <= 0) return pool[i].Name;
    }
    return pool[pool.length - 1].Name;
  }

  text = text.replace(/\[player\]/g, player.Name);

  text = text.replace(/\[otherg\d*\]/g, () => {
    const pool = others.filter((p) => p.Gender === "male");
    return pickWeighted(pool.length ? pool : others);
  });

  text = text.replace(/\[otherw\d*\]/g, () => {
    const pool = others.filter((p) => p.Gender === "female");
    return pickWeighted(pool.length ? pool : others);
  });

  text = text.replace(/\[other\d*\]/g, () => pickWeighted(others));

  return text;
}

/**
 * @param {object} question
 * @param {object} player
 * @param {object} playerCat
 * @param {object} groupCat
 * @returns {number}
 */
function computeWeight(question, player, playerCat, groupCat) {
  const E_i = parseFloat(
    localStorage.getItem(`wevo_cringe_estimated_${player.Name}`) ?? 10
  );
  const C_g = E_i / 100;

  const C_q = sigma(question.Cringe ?? 50);

  const hardQ = question.Hard ?? 50;
  const D_q = sigma(hardQ);

  const playerHardLevel = playerCat ? playerCat["Hard level"] ?? 5 : 5;
  const groupHardLevel  = groupCat  ? groupCat["Hard level"]  ?? 4 : 4;
  const maxPlayerHL = 9, maxGroupHL = 7;

  const F_j_raw = (playerHardLevel / maxPlayerHL) * 10 - 5;
  const F_g_raw = (groupHardLevel  / maxGroupHL)  * 10 - 5;
  const F_j = sigma(F_j_raw);
  const F_g = sigma(F_g_raw);

  const P = groupCat ? (groupCat["Propagation"] ?? 1) : 1;

  function evalHardFn(fnStr, x) {
    try {
      return new Function("hardquestion", `return ${fnStr};`)(x);
    } catch {
      return x;
    }
  }

  const f_j_val = playerCat ? evalHardFn(playerCat["Hard function"], D_q * 100) : D_q * 100;
  const J = sigma(f_j_val);

  const f_g_val = groupCat ? evalHardFn(groupCat["Hard function"], D_q * 100) : D_q * 100;
  const G = sigma(f_g_val);

  const combined = (10 * F_j + P * F_g) / (10 + P);

  const hardFnQ = question["Hard function"] ?? question.Hard_function ?? "hardquestion";
  const f_f_val = evalHardFn(hardFnQ, combined * 100);
  const F = sigma(f_f_val);

  const weight = sigma(1 - Math.abs(C_g - C_q) + (J + G + F) / 3);
  return weight;
}

/**
 * @param {object}  question
 * @param {object}  player
 * @param {object|null} groupCat
 * @param {boolean} strictHard 
 * @param {object[]} players   full players list for relation checks
 */
function isQuestionEligible(question, player, groupCat, strictHard = true, players = []) {
  if (strictHard && groupCat) {
    const hard = question.Hard ?? 0;
    if (hard < groupCat.Minimum || hard > groupCat.Maximum) return false;
  }

  const gender = question.Gender ?? "random";
  if (gender === "guy"   && player.Gender !== "male")   return false;
  if (gender === "women" && player.Gender !== "female") return false;

  if (question.Alcohol === true && !player.Alcohol) return false;

  // Check Relation min constraints: "Relation min player-other1", "Relation min player-otherg1", etc.
  if (players.length > 0) {
    const others = players.filter(p => p.Name !== player.Name);

    const checkRelMin = (key, pool) => {
      const minRel = question[key];
      if (minRel === undefined) return true;
      // At least one player in the pool must meet the minimum relation
      return pool.some(p => {
        const rel = player[`Relation_with_${p.Name}`];
        return (rel !== undefined ? parseFloat(rel) : 5) >= minRel;
      });
    };

    if (!checkRelMin("Relation min player-other1", others)) return false;

    const guys = others.filter(p => p.Gender === "male");
    if (!checkRelMin("Relation min player-otherg1", guys.length ? guys : others)) return false;

    const women = others.filter(p => p.Gender === "female");
    if (!checkRelMin("Relation min player-otherw1", women.length ? women : others)) return false;
  }

  return true;
}


/**
 * @param {any[]}    items
 * @param {number[]} weights
 * @returns {any}
 */
function weightedRandom(items, weights) {
  const total = weights.reduce((s, w) => s + w, 0);
  let r = Math.random() * total;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i];
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
}
/**
 * @returns {{ text: string, raw: object, player: object } | null}
 */
function selectWeightedAction() {
  const appConfig    = JSON.parse(localStorage.getItem("wevo_app_json")    || "null");
  const systemJSON   = JSON.parse(localStorage.getItem("wevo_system_json") || "null");
  const selectedPlayer = JSON.parse(localStorage.getItem("wevo_selected_player") || "null");
  const choice       = localStorage.getItem("wevo_last_choice"); // "Truth" | "Dare"

  if (!appConfig || !systemJSON || !selectedPlayer || !choice) {
    console.warn("[Wevo] Missing data in localStorage.");
    return null;
  }

  const players    = appConfig.Players || [];
  const groupCatName = appConfig.Categorie;

  const groupCat = systemJSON.Group_categories?.find(
    (c) => c.Name === groupCatName
  ) ?? null;

  const playerCat = systemJSON.Individual_categories?.find(
    (c) => c.name === selectedPlayer.Categorie
  ) ?? null;

  const choiceKey = choice === "Dare" ? "Dares" : choice;
  const pool = systemJSON["Truth or dares"]?.[choiceKey] ?? [];

  let eligible = pool.filter((q) =>
    isQuestionEligible(q, selectedPlayer, groupCat, true, players)
  );

  let usedFallback = false;
  if (!eligible.length) {
    eligible = pool.filter((q) =>
      isQuestionEligible(q, selectedPlayer, groupCat, false, players)
    );
    usedFallback = true;
  }

  if (!eligible.length) {
    console.warn("[Wevo] No eligible questions for", selectedPlayer.Name, choice);
    showAlert("No questions available for this player !", "error");
    return null;
  }

  if (usedFallback) {
    console.info("[Wevo] Fallback Hard active : no questions in the group pillars.");
  }

  const weights = eligible.map((q) =>
    computeWeight(q, selectedPlayer, playerCat, groupCat)
  );

  const picked = weightedRandom(eligible, weights);

  let text = picked.content;
  text = replacePlayers(text, selectedPlayer, players);
  text = replaceNumbers(text);
  text = replaceChoices(text, systemJSON.Choices);

  return { text, raw: picked, player: selectedPlayer };
}


/**
 * @param {string} playerName
 * @param {number} actionCringe
 * @param {number} stars
 */
function updatePlayerCringe(playerName, actionCringe, stars) {
  const keyEst  = `wevo_cringe_estimated_${playerName}`;
  const keyLast = `wevo_cringe_last_action_${playerName}`;
  const keyIter = "iteration_algo_cringe_level";

  const alpha = parseFloat(localStorage.getItem("wevo_learning-speed")    ?? 6);
  const beta  = parseFloat(localStorage.getItem("wevo_reduction-coef")    ?? 0.5);
  const i     = Math.max(1, parseInt(localStorage.getItem(keyIter) ?? 0) + 1);

  const E_prev = parseFloat(localStorage.getItem(keyEst)  ?? 10);
  const A_prev = parseFloat(localStorage.getItem(keyLast) ?? actionCringe);

  const E_new = updateCringeEstimation(E_prev, A_prev, stars, alpha, beta, i);

  localStorage.setItem(keyEst,  E_new);
  localStorage.setItem(keyLast, actionCringe);
  localStorage.setItem(keyIter, i);
}

const actionDiv = document.getElementById("action");

saveBtn.addEventListener("click", () => {
  setTimeout(() => {
    const result = selectWeightedAction();
    if (result && actionDiv) {
      actionDiv.textContent = result.text;
      localStorage.setItem(
        "wevo_current_action_cringe",
        result.raw.Cringe ?? 50
      );
    }
  }, 0);
});

finishBtn.addEventListener("click", () => {
  const playerRaw = localStorage.getItem("wevo_selected_player");
  if (!playerRaw) return;

  const player      = JSON.parse(playerRaw);
  const actionCringe = parseFloat(
    localStorage.getItem("wevo_current_action_cringe") ?? 50
  );

  updatePlayerCringe(player.Name, actionCringe, selectedStars);
});