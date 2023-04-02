function getRandomPastelColor() {
  const randomBaseColor = () => Math.floor(Math.random() * 128) + 127; // Generate a random number between 127 and 255
  const mixWithWhite = (baseColor) => Math.floor((baseColor + 255) / 2);

  const r = mixWithWhite(randomBaseColor());
  const g = mixWithWhite(randomBaseColor());
  const b = mixWithWhite(randomBaseColor());

  const pastelColor =
    "#" + ((r << 16) | (g << 8) | b).toString(16).padStart(6, "0");
  return pastelColor;
}

module.exports = { getRandomPastelColor };
