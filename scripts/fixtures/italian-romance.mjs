import {serveCollectionFixture} from "./collection-fixture.mjs";

const port = Number(process.env.VF03_FIXTURE_PORT ?? 4285);
const audio = new URL("./media/qa-tone.mp3", import.meta.url);
const audioRef = "asset:9f71594c-5a5c-4afa-aeee-9d06a5a6d645";

serveCollectionFixture({
  name: "Italian Romance",
  slug: "italian-romance",
  port,
  appOrigin: new URL(process.env.VF03_APP_ORIGIN ?? "http://127.0.0.1:4286").origin,
  packagePath: process.argv[2] ?? new URL("../../templates/packages/italian-romance.v1.json", import.meta.url),
  version: "4a3887dd-875e-4933-b80f-4d247231847b",
  scenarios: ["-long", "-closed", "-unavailable", "-silent", "-leap", "-gallery-1", "-gallery-2", "-gallery-4"],
  demoAudio: audio,
  configure(document, suffix) {
    if (suffix === "-long") {
      document.values.coupleNames.value = {
        ru: "Александра Константинопольская\n&\nТимур Абдрахманов",
        ky: "Айгүл Абдырахманова\n&\nТемир Кыдыралиев",
      };
    }
    if (suffix === "-leap") document.values.ceremonyDate.value = "2028-02-29T17:00:00+06:00";
    const gallery = document.nodes.gallery_polaroidGallery.block;
    const galleryCount = Number(suffix.slice("-gallery-".length));
    if (suffix.startsWith("-gallery-")) {
      gallery.assetIds = galleryCount === 4
        ? [...gallery.assetIds, document.nodes.gallery_venuePhoto.assetId]
        : gallery.assetIds.slice(0, galleryCount);
    }
    const player = document.nodes.rsvpPage_musicCard;
    if (player && suffix !== "-silent") {
      player.block.source = audioRef;
      player.block.caption = {ru: "Тестовая мелодия", ky: "Сыноо обону"};
      return {[audioRef]: "http://127.0.0.1:" + port + "/qa-tone.mp3"};
    }
  },
});
