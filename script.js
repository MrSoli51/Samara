// ---- Card model ----
// Each slot is one of:
//   { kind: "unknown" }            -> "?"
//   { kind: "empty" }              -> thrown out, "-"
//   { kind: "card", label, points, red }
//
// Scoring: A=1, 2..10 face, J=11, Q=12, black K=13, red K=0.
// Unknown and empty count as 0 toward the total.

const RANKS = [
  { label: "A", points: 1 },
  { label: "2", points: 2 },
  { label: "3", points: 3 },
  { label: "4", points: 4 },
  { label: "5", points: 5 },
  { label: "6", points: 6 },
  { label: "7", points: 7 },
  { label: "8", points: 8 },
  { label: "9", points: 9 },
  { label: "10", points: 10 },
  { label: "J", points: 11 },
  { label: "Q", points: 12 },
];

const KINGS = [
  { label: "K\u2665", points: 0, red: true },   // red king = 0 (best)
  { label: "K\u2660", points: 13, red: false }, // black king = 13 (worst)
];

let hand = [
  { kind: "unknown" },
  { kind: "unknown" },
  { kind: "unknown" },
  { kind: "unknown" },
];

let mode = "idle";      // "idle" | "swap"
let swapFirst = null;
let editing = null;     // index being edited

// ---- Elements ----
const cardsEl = document.getElementById("cards");
const hintEl = document.getElementById("hint");
const totalValEl = document.getElementById("totalVal");
const swapBtn = document.getElementById("swapBtn");
const backdrop = document.getElementById("backdrop");
const sheet = document.getElementById("sheet");
const sheetLabel = document.getElementById("sheetLabel");
const picker = document.getElementById("picker");

// ---- Scoring ----
function slotPoints(slot) {
  return slot.kind === "card" ? slot.points : 0;
}
function totalPoints() {
  return hand.reduce((sum, s) => sum + slotPoints(s), 0);
}

// ---- Render ----
function render() {
  cardsEl.innerHTML = "";
  hand.forEach((slot, i) => {
    const card = document.createElement("button");
    card.className = "card";
    if (mode === "swap" && swapFirst === i) card.classList.add("selected");
    if (slot.kind === "empty") card.classList.add("empty");

    const num = document.createElement("span");
    num.className = "slot-num";
    num.textContent = i + 1;
    card.appendChild(num);

    const face = document.createElement("span");
    face.className = "face";
    if (slot.kind === "unknown") {
      face.classList.add("unknown");
      face.textContent = "?";
    } else if (slot.kind === "empty") {
      face.classList.add("empty");
      face.textContent = "\u2014";
    } else {
      face.textContent = slot.label;
      if (slot.red) face.classList.add("red");
    }
    card.appendChild(face);

    if (slot.kind === "card") {
      const pts = document.createElement("span");
      pts.className = "pts";
      pts.textContent = slot.points + " pt";
      card.appendChild(pts);
    }

    card.addEventListener("click", () => onCardClick(i));
    cardsEl.appendChild(card);
  });
  totalValEl.textContent = totalPoints();
}

// ---- Card click ----
function onCardClick(i) {
  if (mode === "swap") {
    handleSwapTap(i);
    return;
  }
  openSheet(i);
}

function handleSwapTap(i) {
  if (swapFirst === null) {
    swapFirst = i;
    hintEl.textContent = "Now tap the card to swap with #" + (i + 1) + ".";
    render();
  } else if (swapFirst === i) {
    swapFirst = null;
    hintEl.textContent = "Tap two cards to swap.";
    render();
  } else {
    const t = hand[swapFirst];
    hand[swapFirst] = hand[i];
    hand[i] = t;
    exitSwap();
    hintEl.textContent = "Swapped.";
    render();
  }
}

// ---- Sheet (picker) ----
function buildPicker() {
  picker.innerHTML = "";
  RANKS.forEach((r) => {
    const b = document.createElement("button");
    b.className = "pick";
    b.innerHTML =
      "<span>" + r.label + "</span><span class='pk-pts'>" + r.points + "</span>";
    b.addEventListener("click", () =>
      setCard({ kind: "card", label: r.label, points: r.points, red: false })
    );
    picker.appendChild(b);
  });
  KINGS.forEach((k) => {
    const b = document.createElement("button");
    b.className = "pick " + (k.red ? "king-red" : "king-black");
    b.innerHTML =
      "<span>" + k.label + "</span><span class='pk-pts'>" + k.points + "</span>";
    b.addEventListener("click", () =>
      setCard({ kind: "card", label: k.label, points: k.points, red: k.red })
    );
    picker.appendChild(b);
  });
}

function openSheet(i) {
  editing = i;
  sheetLabel.textContent = "Card " + (i + 1);
  backdrop.hidden = false;
  sheet.hidden = false;
}
function closeSheet() {
  backdrop.hidden = true;
  sheet.hidden = true;
  editing = null;
}
function setCard(slot) {
  if (editing === null) return;
  hand[editing] = slot;
  closeSheet();
  hintEl.textContent = "Tap a card to set it.";
  render();
}

// ---- Swap mode toggle ----
function enterSwap() {
  mode = "swap";
  swapFirst = null;
  swapBtn.classList.add("active");
  hintEl.textContent = "Tap two cards to swap.";
}
function exitSwap() {
  mode = "idle";
  swapFirst = null;
  swapBtn.classList.remove("active");
}

// ---- Buttons ----
swapBtn.addEventListener("click", () => {
  closeSheet();
  if (mode === "swap") {
    exitSwap();
    hintEl.textContent = "Tap a card to set it.";
  } else {
    enterSwap();
  }
  render();
});

document.getElementById("resetBtn").addEventListener("click", () => {
  hand = [
    { kind: "unknown" },
    { kind: "unknown" },
    { kind: "unknown" },
    { kind: "unknown" },
  ];
  exitSwap();
  closeSheet();
  hintEl.textContent = "Tap a card to set it.";
  render();
});

document.getElementById("endBtn").addEventListener("click", () => {
  const known = hand.filter((s) => s.kind === "card");
  const total = totalPoints();
  let msg = "Round total: " + total + " point" + (total === 1 ? "" : "s") + ".";
  const unknowns = hand.filter((s) => s.kind === "unknown").length;
  if (unknowns > 0) {
    msg += " (" + unknowns + " card" + (unknowns === 1 ? "" : "s") + " still unknown.)";
  }
  hintEl.textContent = msg;
});

document.getElementById("closeSheet").addEventListener("click", closeSheet);
backdrop.addEventListener("click", closeSheet);
document.getElementById("unknownBtn").addEventListener("click", () =>
  setCard({ kind: "unknown" })
);
document.getElementById("deleteBtn").addEventListener("click", () =>
  setCard({ kind: "empty" })
);

// ---- Init ----
buildPicker();
render();
