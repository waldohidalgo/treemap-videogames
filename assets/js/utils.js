function darkenColor(color, amount) {
  // Convertir el color hexadecimal a RGB
  let r = parseInt(color.slice(1, 3), 16);
  let g = parseInt(color.slice(3, 5), 16);
  let b = parseInt(color.slice(5, 7), 16);

  // Reducir la intensidad de los valores RGB
  r = Math.max(0, r - amount);
  g = Math.max(0, g - amount);
  b = Math.max(0, b - amount);

  // Convertir los valores RGB de nuevo a hexadecimal
  r = r.toString(16).padStart(2, "0");
  g = g.toString(16).padStart(2, "0");
  b = b.toString(16).padStart(2, "0");

  return `#${r}${g}${b}`;
}

export { darkenColor };
