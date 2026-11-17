/** The cover's fluid palette: wine, rust, gold, cream and a touch of night blue. */
const hex = (value: string, weight: number) => ({
  color: {
    r: parseInt(value.slice(1, 3), 16) / 255,
    g: parseInt(value.slice(3, 5), 16) / 255,
    b: parseInt(value.slice(5, 7), 16) / 255,
  },
  weight,
});

export const fluidPalette = [
  hex("#8c1c34", 34), // wine
  hex("#b46258", 18), // rust
  hex("#d6a64b", 20), // gold
  hex("#f4e7d3", 12), // cream
  hex("#2f4a86", 16), // night blue
];

/** The page background (ink), drawn under the dye. */
export const fluidBackground = { r: 36, g: 30, b: 28 };
