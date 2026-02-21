const body = document.body;
const burgerBtn = document.getElementById("burgerBtn");
const burgerIcon = document.getElementById("burgerIcon");
const notifBtn = document.getElementById("notifBtn");

burgerBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  const open = body.classList.toggle("menu-open");
  body.classList.remove("menu-notif-open");
  burgerIcon.src = open ? burgerIcon.dataset.open : burgerIcon.dataset.closed;
});

notifBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  body.classList.toggle("menu-notif-open");
  body.classList.remove("menu-open");
});

document.addEventListener("click", () => {
  body.classList.remove("menu-open", "menu-notif-open");
});

function showAlert(type, message) {
  const container = document.getElementById("alerts");

  const alert = document.createElement("div");
  alert.className = `ui-alert ${type}`;

  alert.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="9"></circle>
      <line x1="12" y1="10.5" x2="12" y2="16"></line>
      <circle class="small-dot" cx="12" cy="7.3" r="0.6"></circle>
    </svg>
    <span>${message}</span>
  `;

  container.appendChild(alert);

  setTimeout(() => {
    alert.style.opacity = "0";
    alert.style.transform = "translateX(20px)";
    setTimeout(() => alert.remove(), 300);
  }, 3500);
}

function populateFormFromJSON(json) {
  if (!json || !json.Players) return;

  const userForms = usersContainer.querySelectorAll(".user-form");

  json.Players.forEach((player, index) => {
    const formDiv = userForms[index];
    if (!formDiv) return;

    const i = index + 1;

    const nameInput = formDiv.querySelector(`input[name="user_${i}_name"]`);
    if (nameInput) nameInput.value = player.Name || "";

    const alcoholInput = formDiv.querySelector(
      `input[name="user_${i}_alcohol"]`,
    );
    if (alcoholInput) alcoholInput.checked = !!player.Alcohol;

    const genderInput = formDiv.querySelector(
      `input[name="user_${i}_gender"][value="${player.Gender}"]`,
    );
    if (genderInput) genderInput.checked = true;

    const likeMale = formDiv.querySelector(`input[name="user_${i}_like_male"]`);
    const likeFemale = formDiv.querySelector(
      `input[name="user_${i}_like_female"]`,
    );

    if (likeMale && likeFemale) {
      likeMale.checked = false;
      likeFemale.checked = false;

      if (player.Orientation === "hetero") {
        if (player.Gender === "male") likeFemale.checked = true;
        if (player.Gender === "female") likeMale.checked = true;
      } else if (player.Orientation === "homo") {
        if (player.Gender === "male") likeMale.checked = true;
        if (player.Gender === "female") likeFemale.checked = true;
      } else if (player.Orientation === "bi") {
        likeMale.checked = true;
        likeFemale.checked = true;
      }
    }

    const carouselContainer = formDiv.querySelector(`#carousel_user_${i}`);
    if (carouselContainer && player.Categorie) {
      const cards = carouselContainer.querySelectorAll(".carousel-card");
      cards.forEach((card) => {
        if (card.textContent.includes(player.Categorie)) {
          card.classList.add("selected");
        }
      });
    }
  });

  // Populate relations after all names are set
  setTimeout(() => {
    updateRelationFields();

    json.Players.forEach((player, index) => {
      const i = index + 1;
      // Find all Relation_with_* keys
      Object.keys(player).forEach(key => {
        if (!key.startsWith("Relation_with_")) return;
        const targetName = key.replace("Relation_with_", "");
        const targetIndex = json.Players.findIndex(p => p.Name === targetName) + 1;
        if (targetIndex === 0) return;

        const slider = document.querySelector(`input[name="relation_${i}_${targetIndex}"]`);
        if (slider) {
          slider.value = player[key];
          const display = slider.closest(".relation-row")?.querySelector(".relation-value-display");
          if (display) display.textContent = player[key];
        }
      });
    });
  }, 80);

  if (json.Categorie) {
    const groupContainer = document.getElementById("carrousel_group");
    if (groupContainer) {
      const groupCards = groupContainer.querySelectorAll(".carousel-card");
      groupCards.forEach((card) => {
        if (card.textContent.includes(json.Categorie)) {
          card.classList.add("selected");
        }
      });
    }
  }
}

const userCountInput = document.getElementById("userCount");
const usersContainer = document.getElementById("usersContainer");
const countValue = document.getElementById("countValue");

function generateForms(count) {
  usersContainer.innerHTML = "";

  for (let i = 1; i <= count; i++) {
    const userDiv = document.createElement("div");
    userDiv.className = "user-form";

    userDiv.innerHTML = `
      <h3>Player ${i}</h3>

      <label>Name</label>
      <input type="text" name="user_${i}_name" placeholder="Enter name">

      <label class="checkbox-row">
        <input type="checkbox" name="user_${i}_alcohol">
        Takes alcohol
      </label>

      <fieldset>
        <legend>Orientation</legend>
        <label class="checkbox-row">
          <input type="checkbox" name="user_${i}_like_male">
          Guy
        </label>
        <label class="checkbox-row">
          <input type="checkbox" name="user_${i}_like_female">
          Women
        </label>
      </fieldset>

      <fieldset>
        <legend>Gender</legend>
        <label class="checkbox-row">
          <input type="radio" name="user_${i}_gender" value="male">
          Guy
        </label>
        <label class="checkbox-row">
          <input type="radio" name="user_${i}_gender" value="female">
          Women
        </label>
        <label class="checkbox-row">
          <input type="radio" name="user_${i}_gender" value="other">
          Other
        </label>
      </fieldset>

      <div class="carousel-user" id="carousel_user_${i}"></div>
      <div class="relations-section" id="relations_user_${i}">
        <label class="relations-title">Relations avec les autres joueurs</label>
        <div class="relations-container" id="relations_container_${i}"></div>
      </div>
    `;

    usersContainer.appendChild(userDiv);
  }

  updateRelationFields();

  if (window.systemJSON) {
    loadCarouselsFromJSON();
  }
}

userCountInput.addEventListener("input", () => {
  const count = parseInt(userCountInput.value);
  countValue.textContent = count;
  generateForms(count);
});

generateForms(userCountInput.value);

function updateRelationFields() {
  const count = parseInt(userCountInput.value);
  const names = [];

  for (let i = 1; i <= count; i++) {
    const nameInput = usersContainer.querySelector(`input[name="user_${i}_name"]`);
    names.push({ index: i, name: nameInput?.value?.trim() || `Joueur ${i}` });
  }

  for (let i = 1; i <= count; i++) {
    const container = document.getElementById(`relations_container_${i}`);
    if (!container) continue;
    container.innerHTML = "";

    const others = names.filter(n => n.index !== i);
    if (others.length === 0) {
      container.innerHTML = `<span class="no-relations">Ajoutez d'autres joueurs pour définir les relations.</span>`;
      continue;
    }

    others.forEach(other => {
      const row = document.createElement("div");
      row.className = "relation-row";
      const existingInput = document.querySelector(`input[name="relation_${i}_${other.index}"]`);
      const currentVal = existingInput ? existingInput.value : 5;

      row.innerHTML = `
        <label class="relation-label">
          Avec <strong>${other.name}</strong>
          <span class="relation-value-display">${currentVal}</span>/10
        </label>
        <input type="range" min="0" max="10" step="1" value="${currentVal}"
          name="relation_${i}_${other.index}"
          data-player="${i}" data-other="${other.index}"
          class="relation-slider">
      `;

      const slider = row.querySelector(".relation-slider");
      const display = row.querySelector(".relation-value-display");
      slider.addEventListener("input", () => {
        display.textContent = slider.value;
      });

      container.appendChild(row);
    });
  }
}

// Refresh relations when a name changes
usersContainer.addEventListener("input", (e) => {
  if (e.target && e.target.type === "text" && e.target.name?.includes("_name")) {
    updateRelationFields();
  }
});

function createCarousel(title, categories, container) {
  if (!categories || !container) return;

  const wrapper = document.createElement("div");
  wrapper.classList.add("carousel-wrapper");

  const titleEl = document.createElement("div");
  titleEl.classList.add("carousel-title");
  titleEl.textContent = title;

  const carousel = document.createElement("div");
  carousel.classList.add("carousel");

  categories.forEach((cat) => {
    const card = document.createElement("div");
    card.classList.add("carousel-card");
    card.innerHTML = `
      <strong>${cat.Name || cat.name}</strong><br>
      ${cat["Hard level"] !== undefined ? "Level: " + cat["Hard level"] : ""}
    `;

    card.addEventListener("click", () => {
      const allCards = carousel.querySelectorAll(".carousel-card");
      allCards.forEach((c) => c.classList.remove("selected"));

      card.classList.add("selected");
    });

    carousel.appendChild(card);
  });

  wrapper.appendChild(titleEl);
  wrapper.appendChild(carousel);
  container.appendChild(wrapper);
}

function loadCarouselsFromJSON() {
  if (!window.systemJSON) return;

  const groupContainer = document.getElementById("carrousel_group");
  groupContainer.innerHTML = "";
  if (window.systemJSON.Group_categories) {
    createCarousel(
      "Group Categories",
      window.systemJSON.Group_categories,
      groupContainer,
    );
  }

  const userCount = parseInt(userCountInput.value);
  for (let i = 1; i <= userCount; i++) {
    const container = document.getElementById(`carousel_user_${i}`);
    if (!container) continue;
    container.innerHTML = "";
    if (window.systemJSON.Individual_categories) {
      createCarousel(
        "Individual Categories",
        window.systemJSON.Individual_categories,
        container,
      );
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const jsonModal = document.getElementById("jsonModal");
  const successModal = document.getElementById("successModal");
  const selectBtn = document.getElementById("selectJsonBtn");
  const continueBtn = document.getElementById("continueBtn");

  const storedSystemJSON = localStorage.getItem("wevo_system_json");
  if (storedSystemJSON) {
    window.systemJSON = JSON.parse(storedSystemJSON);
    jsonModal.classList.add("hidden");
  } else {
    jsonModal.classList.remove("hidden");
  }

  selectBtn.addEventListener("click", () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json,application/json";

    input.onchange = (event) => {
      const file = event.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const parsed = JSON.parse(e.target.result);
          window.systemJSON = parsed;
          localStorage.setItem("wevo_system_json", JSON.stringify(parsed));
          jsonModal.classList.add("hidden");
          successModal.classList.remove("hidden");
          loadCarouselsFromJSON();

          showAlert("Old config successfully loaded", "success");
        } catch {
          showAlert("Invalid JSON", "error");
        }
      };
      reader.readAsText(file);
    };
    input.click();
  });

  continueBtn?.addEventListener("click", () => {
    successModal.classList.add("hidden");
  });
});

function saveConfigToLocalStorage() {
  const playersArray = [];
  const userForms = document.querySelectorAll(".user-form");

  userForms.forEach((form, index) => {
    const i = index + 1;

    const name =
      form.querySelector(`input[name="user_${i}_name"]`)?.value || "";
    const alcohol =
      form.querySelector(`input[name="user_${i}_alcohol"]`)?.checked || false;
    const gender =
      form.querySelector(`input[name="user_${i}_gender"]:checked`)?.value ||
      "other";

    const likeMale =
      form.querySelector(`input[name="user_${i}_like_male"]`)?.checked || false;
    const likeFemale =
      form.querySelector(`input[name="user_${i}_like_female"]`)?.checked ||
      false;

    let orientation = "bi";
    if (likeMale && !likeFemale) orientation = "homo";
    else if (!likeMale && likeFemale) orientation = "hetero";

    let selectedCategory = "";
    const selectedCard = form.querySelector(".carousel-card.selected");
    if (selectedCard) {
      selectedCategory =
        selectedCard.querySelector("strong")?.textContent || "";
    }

    const count2 = parseInt(userCountInput.value);
    const relationObj = {};
    for (let j = 1; j <= count2; j++) {
      if (j === i) continue;
      const slider = document.querySelector(`input[name="relation_${i}_${j}"]`);
      if (slider) {
        const otherNameInput = usersContainer.querySelector(`input[name="user_${j}_name"]`);
        const otherName = otherNameInput?.value?.trim() || `Joueur ${j}`;
        relationObj[`Relation_with_${otherName}`] = parseInt(slider.value);
      }
    }

    playersArray.push({
      Name: name,
      Alcohol: alcohol,
      Gender: gender,
      Orientation: orientation,
      Categorie: selectedCategory,
      ...relationObj,
    });
  });

  let groupCategory = "";
  const selectedGroup = document.querySelector(
    "#carrousel_group .carousel-card.selected",
  );
  if (selectedGroup) {
    groupCategory = selectedGroup.querySelector("strong")?.textContent || "";
  }

  const configObj = {
    Categorie: groupCategory,
    Players: playersArray,
  };

  localStorage.setItem("wevo_app_json", JSON.stringify(configObj));
  showAlert("Configuration sauvegardée", "success");
}

const usersForm = document.getElementById("usersForm");

if (usersForm) {
  usersForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const playersArray = [];
    const userForms = document.querySelectorAll(".user-form");

    userForms.forEach((form, index) => {
      const i = index + 1;

      const name =
        form.querySelector(`input[name="user_${i}_name"]`)?.value || "";
      const alcohol =
        form.querySelector(`input[name="user_${i}_alcohol"]`)?.checked || false;
      const gender =
        form.querySelector(`input[name="user_${i}_gender"]:checked`)?.value ||
        "other";

      const likeMale =
        form.querySelector(`input[name="user_${i}_like_male"]`)?.checked ||
        false;
      const likeFemale =
        form.querySelector(`input[name="user_${i}_like_female"]`)?.checked ||
        false;

      let orientation = "bi";
      if (likeMale && !likeFemale) orientation = "homo";
      else if (!likeMale && likeFemale) orientation = "hetero";

      const selectedCard = form.querySelector(".carousel-card.selected");
      const category = selectedCard?.querySelector("strong")?.textContent || "";

      const relationObj = {};
      const count = parseInt(userCountInput.value);
      for (let j = 1; j <= count; j++) {
        if (j === i) continue;
        const slider = document.querySelector(`input[name="relation_${i}_${j}"]`);
        if (slider) {
          const otherNameInput = usersContainer.querySelector(`input[name="user_${j}_name"]`);
          const otherName = otherNameInput?.value?.trim() || `Joueur ${j}`;
          relationObj[`Relation_with_${otherName}`] = parseInt(slider.value);
        }
      }

      playersArray.push({
        Name: name,
        Alcohol: alcohol,
        Gender: gender,
        Orientation: orientation,
        Categorie: category,
        ...relationObj,
      });
    });

    const groupSelected = document.querySelector(
      "#carrousel_group .carousel-card.selected",
    );
    const groupCategory =
      groupSelected?.querySelector("strong")?.textContent || "";

    const configObj = {
      Categorie: groupCategory,
      Players: playersArray,
    };

    localStorage.setItem("wevo_app_json", JSON.stringify(configObj));
    showAlert("Configuration créée", "success");

    const successModal = document.getElementById("successModal");
    if (successModal) successModal.classList.add("hidden");
  });
}

document.querySelector(".load-config-btn")?.addEventListener("click", () => {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".json,application/json";

  input.onchange = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target.result);

        if (!Array.isArray(json.Players)) {
          showAlert("JSON invalide : champ 'Players' manquant", "error");
          return;
        }

        const count = json.Players.length;
        userCountInput.value = count;
        countValue.textContent = count;

        generateForms(count);
        loadCarouselsFromJSON();

        setTimeout(() => {
          populateFormFromJSON(json);
        }, 50);

        showAlert("Configuration chargée depuis fichier", "success");
      } catch {
        showAlert("JSON invalide", "error");
      }
    };

    reader.readAsText(file);
  };

  input.click();
});

const newRoundBtn = document.getElementById("random-choice-btn");
const choicePopUp = document.getElementById("choice-pop-up");
const closeChoiceBtn = document.getElementById("close-choice");
const youAreGonePopUp = document.getElementById("you-are-gone-pop-up");
const quitBtn = document.getElementById("quit");

function openPopup(popup) {
  if (popup) popup.classList.add("show");
}

function closePopup(popup) {
  if (popup) popup.classList.remove("show");
}

newRoundBtn.addEventListener("click", () => {
  openPopup(choicePopUp);
});

closeChoiceBtn.addEventListener("click", () => {
  closePopup(choicePopUp);
  openPopup(youAreGonePopUp);
});

quitBtn.addEventListener("click", () => {
  closePopup(youAreGonePopUp);
});

const truthBtn = document.getElementById("Truth");
const dareBtn = document.getElementById("Dare");

function selectChoice(selectedBtn, otherBtn) {
  selectedBtn.classList.add("selected");
  otherBtn.classList.remove("selected");
}

truthBtn.addEventListener("click", () => {
  selectChoice(truthBtn, dareBtn);
});

dareBtn.addEventListener("click", () => {
  selectChoice(dareBtn, truthBtn);
});