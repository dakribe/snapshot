import * as Alchemy from "alchemy";
import * as Cloudflare from "alchemy/Cloudflare";
import * as Effect from "effect/Effect";

export const Website = Cloudflare.Website.Vite("Website", {
  dev: {
    port: 3000,
  },
});

export default Alchemy.Stack(
  "SnapshotWebsite",
  {
    providers: Cloudflare.providers(),
    state: Cloudflare.state(),
  },
  Effect.gen(function* () {
    const worker = yield* Website;

    return {
      url: worker.url,
    };
  }),
);
