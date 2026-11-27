import {serveCollectionFixture} from "./collection-fixture.mjs";

serveCollectionFixture({
  name: "Vogue Wedding",
  slug: "vogue-wedding",
  port: Number(process.env.VF02_FIXTURE_PORT ?? 4283),
  appOrigin: new URL(process.env.VF02_APP_ORIGIN ?? "http://127.0.0.1:4282").origin,
  packagePath: process.argv[2] ?? new URL("../../templates/packages/vogue-wedding.v1.json", import.meta.url),
  version: "9aa5a875-fff4-4d92-ba35-a7f43e00a306",
  scenarios: ["-long", "-closed", "-unavailable"],
  configure(document, suffix) {
    if (suffix === "-long") {
      document.values.coupleNames.value = {
        ru: "Александра Константинопольская\nи Тимур Абдрахманов",
        ky: "Айгүл Абдырахманова\nжана Темир Кыдыралиев",
      };
    }
  },
});
