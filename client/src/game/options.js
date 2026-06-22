export const tagMaps = {
  classic: "TAG Playground"
};

export const tagRoundOptions = [60, 90, 120];

export const spyWordDifficulties = [
  { id: "easy", label: "Easy" },
  { id: "medium", label: "Medium" },
  { id: "hard", label: "Hard" }
];

export const boostDefaultNames = [
  "Perambalur",
  "Ariyalur",
  "Trichy",
  "Kovai",
  "Madurai"
];

export function resizeBoostNames(names, count) {
  return Array.from(
    { length: count },
    (_entry, index) => names[index] || boostDefaultNames[index] || `Card ${index + 1}`
  );
}
