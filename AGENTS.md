<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Application structure
- Keep the client-only 3D world at `/` with the existing town and local save formats to preserve imported gameplay.
- Keep home walking and zone rules in plain TypeScript; the scene uses a waypoint path through the corridor, and studio editing depends on the avatar's actual zone.
- Use `src/game/studio/motion.functions.ts` for AI motion assistance through the generated Gateway SDK contracts; do not restore unused legacy provider wrappers.
- Keep the source VRM on Lovable Assets and load its committed pointer so model files do not inflate the repository.
- Reuse `window.__home.state()` and `window.__home.sim(seconds)` in development to verify walking under software WebGL; these hooks are never available in production.
- Hide the studio's camera-facing entrance wall only while the avatar is in the studio and frame the stage clear of the editor; cutaway architecture keeps editing visible without changing walking rules.
