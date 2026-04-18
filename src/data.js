export async function loadData() {
  const [launches, countries] = await Promise.all([
    fetch("./data/launches-by-country-year.json").then((r) => r.json()),
    fetch("./data/countries.geojson").then((r) => r.json()),
  ]);
  return { launches, countries };
}

// Map from our entity codes to the geojson `properties.name`.
// This geojson uses "USA" and "England" for US / UK; anything unmapped
// has no highlight polygon (e.g. EU, which is aggregate).
export const CODE_TO_GEOJSON_NAME = {
  RU: "Russia",
  US: "USA",
  CN: "China",
  JP: "Japan",
  IN: "India",
  FR: "France",
  GB: "England",
  IL: "Israel",
  IR: "Iran",
  KP: "North Korea",
  KR: "South Korea",
  AU: "Australia",
};
