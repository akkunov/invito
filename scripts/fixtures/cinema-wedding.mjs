import {serveCollectionFixture} from "./collection-fixture.mjs";

const port = Number(process.env.VF04_FIXTURE_PORT ?? 4287);
const audioRef = "asset:9f71594c-5a5c-4afa-aeee-9d06a5a6d645";
serveCollectionFixture({
  name: "Cinema Wedding",
  slug: "cinema-wedding",
  port,
  appOrigin: new URL(process.env.VF04_APP_ORIGIN ?? "http://127.0.0.1:4288").origin,
  packagePath: process.argv[2] ?? new URL("../../templates/packages/cinema-wedding.v1.json",import.meta.url),
  version: "6eacc829-78b8-44ce-b3d1-01f02085bbfd",
  scenarios: ["-long", "-closed", "-unavailable", "-silent"],
  demoAudio: new URL("./media/qa-tone.mp3",import.meta.url),
  rsvpNode: "rsvp_response",
  configure(document,suffix) {
    if (suffix==="-long") {
      document.values.coupleNames.value = {
        ru:"Александра Константинопольская\n&\nТимур Абдрахманов",
        ky:"Айгүл Абдырахманова\n&\nТемир Кыдыралиев",
      };
      const copy=document.values.episode1Copy.value;
      for (const locale of ["ru","ky"]) copy[locale]+=" "+copy[locale].split("\n").at(-1).repeat(5);
    }
    if (suffix!=="-silent") {
      const player=document.nodes.rsvp_music;
      player.block.source=audioRef;
      player.block.caption={ru:"Тестовая мелодия",ky:"Сыноо обону"};
      return {[audioRef]:"http://127.0.0.1:"+port+"/qa-tone.mp3"};
    }
  },
});
