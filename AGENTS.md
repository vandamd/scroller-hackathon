# Scroller

- Use British English.
- Use Bun for JavaScript/TypeScript dependencies and scripts.
- If using Python, use uv.
- Do not write tests unless explicitly requested.
- Run `bun run check` after changing the app or its configuration.
- Keep credentials and personal feed data out of tracked files and demo content.
- Use Public Sans Regular (400); vary size and spacing for hierarchy.
- Use white surfaces, soft grey borders and cobalt blue for primary actions.
  Light mode is the default and current design focus; retain dark mode.
- Buttons are pills. Primary buttons are filled. Keep copy brief and functional.

`bun run dev` runs TanStack Start and the Convex development watcher together.
`bun run dev:web` runs only the web app at `http://localhost:3000`.
`bun run dev:convex` syncs the backend to the selected development deployment.

<!-- convex-ai-start -->

This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read
`convex/_generated/ai/guidelines.md` first** for important guidelines on
how to correctly use Convex APIs and patterns. The file contains rules that
override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running
`npx convex ai-files install`.

<!-- convex-ai-end -->
