const LS_FAVORITES = "expense_favorites";
let favorites = JSON.parse(localStorage.getItem(LS_FAVORITES) || "[]");

const favoriteList = document.getElementById("favoriteList");
const favItemInput = document.getElementById("favItem");
const favAmountInput = document.getElementById("favAmount");
const favAddBtn = document.getElementById("favAddBtn");

document.getElementById("openFavoritesBtn").onclick = () => {
  document.getElementById("favoritesModal").style.display = "block";
};
document.getElementById("closeFavorites").onclick = () => {
  document.getElementById("favoritesModal").style.display = "none";
};

function saveFavorites() {
  localStorage.setItem(LS_FAVORITES, JSON.stringify(favorites));
}

function renderFavorites() {
  favoriteList.innerHTML = "";

  favorites.forEach((fav, idx) => {
    const wrapper = document.createElement("div");
    wrapper.className = "favorite-wrapper";

    const btn = document.createElement("button");
    btn.className = "favorite-btn";
    btn.textContent = `${
      fav.item || "항목없음"
    } (${fav.amount.toLocaleString()}원)`;

    btn.onclick = () => {
      addExpense(fav.item, fav.amount);
      closeFavorites();
    };

    const delBtn = document.createElement("span");
    delBtn.className = "fav-del";
    delBtn.textContent = "×";
    delBtn.onclick = (e) => {
      e.stopPropagation();
      if (confirm(`"${fav.item}" 즐겨찾기를 삭제할까요?`)) {
        favorites.splice(idx, 1);
        saveFavorites();
        renderFavorites();
      }
    };

    wrapper.appendChild(btn);
    wrapper.appendChild(delBtn);
    favoriteList.appendChild(wrapper);
  });
}

// 추가 버튼 이벤트
favAddBtn.onclick = () => {
  const item = favItemInput.value.trim();
  const amount = parseInt(favAmountInput.value, 10);
  if (!item || isNaN(amount) || amount <= 0) {
    alert("항목과 금액을 올바르게 입력하세요.");
    return;
  }
  favorites.push({ item, amount });
  saveFavorites();
  renderFavorites();
  favItemInput.value = "";
  favAmountInput.value = "";
};

// 모달 열고 닫기
const modal = document.getElementById("favoritesModal");
document.getElementById("openFavoritesBtn").onclick = () => {
  modal.style.display = "block";
};
document.getElementById("closeFavorites").onclick = closeFavorites;
window.onclick = (e) => {
  if (e.target === modal) closeFavorites();
};

function closeFavorites() {
  modal.style.display = "none";
}

// 초기 렌더
renderFavorites();
