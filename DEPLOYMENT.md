# Deployment

Every push to `main` builds the static export in GitHub Actions and rsyncs it to
the server. Pull requests run lint/typecheck/build but do **not** deploy.

The server keeps the last 5 releases and serves whichever one the `current`
symlink points at, so activating a build — or rolling one back — is an atomic
symlink swap. Nginx never serves a half-copied directory.

## Server layout (already set up)

```
/usr/share/nginx/
├── joint -> joint-deploy/current          # what the Nginx server block points at
└── joint-deploy/                          # DEPLOY_ROOT
    ├── current -> releases/20260720012102-manualtest
    └── releases/
        ├── 20260720012102-manualtest/     # newest
        ├── 20260720012009-initial/        # snapshot of the pre-CI/CD site
        └── ...                            # 5 kept, older pruned automatically
```

`/usr/share/nginx/joint` was a real directory; it is now a symlink into the
release tree. **This means no Nginx config change was needed** — the existing
server block still points at `/usr/share/nginx/joint` and resolves through the
symlink chain. `disable_symlinks` is not set, so Nginx follows it.

The original directory is preserved as
`/usr/share/nginx/joint.pre-cicd-20260720012009` in case you ever want the
untouched pre-migration files.

### Relevant Nginx config

`/etc/nginx/sites-available/joint-account-manager` — unchanged, listed here for
reference. The site listens on `127.0.0.1:8443` behind the xray SNI router, and
`/api` proxies to the backend container:

```nginx
location / {
    root /usr/share/nginx/joint;     # -> joint-deploy/current
    index index.html;
    try_files $uri $uri/ =404;
}

location /api {
    proxy_pass http://172.20.0.35:8080;
}
```

Because the app is a single page, `try_files $uri $uri/ =404` is sufficient —
`/` resolves to `index.html` via the `index` directive.

> The deploy user `xiaokai` owns `/usr/share/nginx`, so deploys need **no sudo**.

---

## Remaining one-time setup

Two steps need credentials or root and must be done by you. Both are quick.

### 1. Authorize the deploy key on the server

A dedicated keypair has been generated at `~/.ssh/joint_deploy` (private) and
`~/.ssh/joint_deploy.pub` (public). It is not yet authorized, because
`~/.ssh/authorized_keys` on the server is root-owned and requires sudo.

Run this and enter your sudo password when prompted:

```bash
cat ~/.ssh/joint_deploy.pub | ssh -t -i ~/Documents/vps_xiaokai -o IdentitiesOnly=yes xiaokai@sv.hxwang.xyz \
  "sudo tee -a /home/xiaokai/.ssh/authorized_keys >/dev/null"
```

Then confirm the new key works on its own:

```bash
ssh -i ~/.ssh/joint_deploy -o IdentitiesOnly=yes xiaokai@sv.hxwang.xyz 'echo deploy key OK'
```

> Consider restricting the key in `authorized_keys` by prefixing the line with
> `restrict,pty` — it only ever needs to run `rsync`, `mkdir`, `ln`, `mv`, `ls`.

### 2. Add the GitHub secrets and variables

**Settings → Secrets and variables → Actions.**

Secrets:

| Secret | Value |
| --- | --- |
| `SSH_PRIVATE_KEY` | Contents of `~/.ssh/joint_deploy` — the whole file, including the BEGIN/END lines |
| `SSH_KNOWN_HOSTS` | `sv.hxwang.xyz ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIHbn9l87u2qwh3+z0QxKbjwBRmS4D4NOLpbZuLg156Ur` |
| `SSH_HOST` | `sv.hxwang.xyz` |
| `SSH_USER` | `xiaokai` |
| `DEPLOY_ROOT` | `/usr/share/nginx/joint-deploy` |

`SSH_PORT` is optional and defaults to `22`.

Variables:

| Variable | Value |
| --- | --- |
| `NEXT_PUBLIC_API_BASE_URL` | `https://joint.hxwang.xyz` |
| `SITE_URL` | `https://joint.hxwang.xyz` |

`NEXT_PUBLIC_*` values are **baked into the client bundle at build time** and are
publicly visible in the shipped JavaScript. Only put non-secret values there.

If you install the `gh` CLI (`brew install gh && gh auth login`), the whole set
can be done from a terminal:

```bash
gh secret set SSH_PRIVATE_KEY  < ~/.ssh/joint_deploy
gh secret set SSH_KNOWN_HOSTS --body "$(ssh-keyscan -t ed25519 sv.hxwang.xyz 2>/dev/null)"
gh secret set SSH_HOST    --body "sv.hxwang.xyz"
gh secret set SSH_USER    --body "xiaokai"
gh secret set DEPLOY_ROOT --body "/usr/share/nginx/joint-deploy"

gh variable set NEXT_PUBLIC_API_BASE_URL --body "https://joint.hxwang.xyz"
gh variable set SITE_URL                 --body "https://joint.hxwang.xyz"
```

### 3. Optional: require approval before deploying

The `deploy` job declares `environment: production`. Under **Settings →
Environments → production** you can add yourself as a required reviewer, and
deploys will then pause for a manual approval click.

---

## Rolling back

List releases and repoint the symlink at an earlier one:

```bash
ssh -i ~/Documents/vps_xiaokai -o IdentitiesOnly=yes xiaokai@sv.hxwang.xyz \
  'ls -1dt /usr/share/nginx/joint-deploy/releases/*/'

ssh -i ~/Documents/vps_xiaokai -o IdentitiesOnly=yes xiaokai@sv.hxwang.xyz \
  'D=/usr/share/nginx/joint-deploy; ln -sfn $D/releases/<older> $D/current.tmp && mv -Tf $D/current.tmp $D/current'
```

No Nginx reload needed — it resolves the symlink per request. This has been
tested end to end: rolling back to the pre-CI/CD snapshot and forward again both
took effect immediately.

Reverting the commit on `main` and letting CI redeploy achieves the same thing
and keeps git as the source of truth; the manual swap is for when you need the
site fixed in seconds.

---

## Local development

```bash
npm install
npm run dev        # http://localhost:3000
```

To point the frontend at a local backend, create `.env.local`:

```
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
```

Before pushing:

```bash
npm run lint
npm run typecheck
npm run build      # writes out/
```
