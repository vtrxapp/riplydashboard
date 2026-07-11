# Supabase MCP (local only — do not commit real tokens)

Use a **Personal Access Token** so you can skip the broken OAuth flow.

## 1. Revoke the exposed token

GitHub blocked your push because a token was committed. Treat it as compromised:

1. Open [Supabase Access Tokens](https://supabase.com/dashboard/account/tokens)
2. **Revoke** the token you put in `.cursor/mcp.json`
3. **Generate a new token** (name: `Cursor MCP`)

## 2. Store the token outside git

**macOS / Linux** — add to your shell profile (`~/.zshrc` or `~/.bashrc`):

```bash
export SUPABASE_ACCESS_TOKEN="sbp_your_new_token_here"
```

Then restart Cursor (or run `source ~/.zshrc`).

**Windows** — set a user environment variable:

```
SUPABASE_ACCESS_TOKEN = sbp_your_new_token_here
```

Restart Cursor after setting it.

## 3. Create local MCP config (not committed)

```bash
cp .cursor/mcp.json.example .cursor/mcp.json
```

`.cursor/mcp.json` is gitignored. The example uses `${env:SUPABASE_ACCESS_TOKEN}` so the real token never lives in a file you might commit.

## 4. Restart Cursor

Settings → Tools & MCP → Supabase should show **Connected**.

## If you already committed the token

On your machine, remove it from git history before pushing:

```bash
# Stop tracking the file with secrets
git rm --cached .cursor/mcp.json

# Amend or reset the bad commit (if it was your latest commit)
git commit --amend

# Or reset main to before the bad commit, then recommit without mcp.json
git reset --soft HEAD~1
git restore --staged .cursor/mcp.json
```

Then push again. **Do not** use GitHub’s “unblock secret” link unless you intend to keep the exposed token in the repo (you shouldn’t).

## Verify

Ask the agent: “List Supabase tables using MCP” — it should work without pushing any secrets.
