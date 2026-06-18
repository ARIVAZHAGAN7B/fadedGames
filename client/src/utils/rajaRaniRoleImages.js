import bishopImage from "../images/optimized/bishop.webp";
import kingImage from "../images/optimized/king.webp";
import policeImage from "../images/optimized/police.webp";
import queenImage from "../images/optimized/queen.webp";
import thiefImage from "../images/optimized/thief.webp";

const roleImages = {
  manthiri: bishopImage,
  police: policeImage,
  raja: kingImage,
  rani: queenImage,
  thirudan: thiefImage
};

export function getRajaRaniRoleImage(roleId) {
  return roleImages[roleId] || "";
}
