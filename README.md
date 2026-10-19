# Who could they become? · ConnectEdu at Redefine Education 2026

The ConnectEdu talk deck as a website, with live audience voting built in (no Mentimeter needed).

- **Deck:** https://natethebuilder.github.io/redefine-2026/
- **Phone voting page:** https://natethebuilder.github.io/redefine-2026/vote/ (the QR codes on the slides open this)
- **Try it without the database:** https://natethebuilder.github.io/redefine-2026/?mock=demo

Built with [DECKIO](https://deckio.art) (React + Vite). Every slide is rebuilt from the PowerPoint on a 1280×720 stage, so it scales to any screen.

## Live slides

| Slide | Phones show | Big screen shows |
| --- | --- | --- |
| 2 · Who helped you? | Multiple choice (A–D) | Live percentage bars |
| 11 · Your career | Up to 3 words | Word cloud |
| 15 · Feedback | 1–5 "how likely" scale and up to 2 written roadblocks | Average with a bar chart, and an answer wall |

Voting is anonymous: phones get a random ID (kept on the phone), with no sign-in. People can change their answers. Rude words are dropped from the cloud and masked on the wall, and you can hide anything else by hand.

## Presenting

1. On the presenting laptop, open `https://natethebuilder.github.io/redefine-2026/?presenter=YOUR-KEY` once. That unlocks presenter controls in this browser (the key is remembered and removed from the address bar).
2. Go fullscreen with the button at the top right (move the mouse to show it). Arrow keys, Space, Page Up/Down and clickers all work.
3. When you reach a live slide, every phone switches to that question automatically.

| Key | Does |
| --- | --- |
| <kbd>Q</kbd> | Big QR code to the voting page (<kbd>Esc</kbd> or click to close) |
| <kbd>H</kbd> | Hide or show results, for example to collect votes before the reveal |
| <kbd>P</kbd> | Live panel: choose what phones show, hide written answers, reset a question, download a CSV of every answer, lock this device |

Add `?slide=N` to open on a slide (counting from 0). To rehearse without touching real votes, add `?mock` (or `?mock=demo` for sample votes). Mock mode keeps everything in your browser, so open the vote link in another tab to try voting; its presenter key is `demo`.

## One-time setup

### 1. Database (Supabase)

1. In the ConnectEdu Supabase project, open **SQL Editor → New query**.
2. Paste all of [`supabase/live_polls.sql`](supabase/live_polls.sql), replace `__PRESENTER_KEY__` near the top with your own private key (8+ characters), and click **Run**.

It only adds its own `live_poll_*` tables and functions. The tables are locked (row level security, no policies), so the site can only use the functions, and presenter actions need the key (stored as a bcrypt hash). Running the file again is safe: it keeps the votes, updates the questions and changes the key.

If you change a question's options or limits, update both [`src/live/polls.js`](src/live/polls.js) and the seed section at the end of the SQL file, then run the SQL again.

### 2. GitHub

The workflow in [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) builds and publishes the site to GitHub Pages on every push to `main` (Settings → Pages → Source: **GitHub Actions**). Under Settings → Secrets and variables → Actions it reads:

| Name | Kind | Value |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | Variable | `https://<project>.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Secret | The project's public anon key (it ships in the site's JavaScript, like any Supabase web app) |
| `VITE_VOTE_URL` | Variable, optional | A different address for the QR codes, such as a short link to the vote page |

Without the first two, the site still builds, with live voting turned off.

## After the event

Press <kbd>P</kbd> → **Download CSV** to keep the answers. To remove live voting from the database completely, run:

<!-- uninstall -->
```sql
drop table if exists public.live_poll_votes, public.live_poll_polls, public.live_poll_state, public.live_poll_admin;

do $$
declare f regprocedure;
begin
  for f in select oid::regprocedure from pg_proc
           where pronamespace = 'public'::regnamespace and proname like 'live\_poll\_%'
  loop
    execute format('drop function %s', f);
  end loop;
end
$$;
```

## Working on the deck

```bash
npm install
npm run dev     # http://localhost:5173 (add ?mock to try voting locally)
```

To use the real database locally, put `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env.local` (it is git-ignored).

| Path | What's there |
| --- | --- |
| `src/data/content.js` | All slide text |
| `src/slides/` | One component per slide; order is set in `deck.config.js` |
| `src/live/` | Live voting: database client, presenter panel, word cloud, bars, answer wall |
| `src/vote/`, `vote/index.html` | The phone voting page |
| `supabase/live_polls.sql` | Database tables and functions |

While `npm run dev` is running you can double-click text on a slide to edit it in place; edits are saved to `src/data/inline-edits.json`.

### Editing with GitHub Copilot

This repo includes DECKIO's instructions and skills (in `.github/`), so GitHub Copilot already knows how the deck is put together. Describe the change you want in Copilot Chat (Agent mode) or Copilot CLI, for example:

- `Make the Safety slide easier to scan.`
- `Add a slide about the 2027 pilot timeline that matches the rest of the deck.`
- `Inspect slide 11 and fix anything that looks off.`

Useful skills: `deck-add-slide`, `deck-delete-slide`, `deck-inspect`, `deck-validate-project`, `deck-sketch` and `deck-port-powerpoint`.
