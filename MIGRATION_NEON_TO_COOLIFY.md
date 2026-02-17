# Complete Guide: Deploy Database in Coolify & Migrate from Neon

This guide walks you through deploying PostgreSQL on Coolify and migrating your data from Neon.

---

## Part 1: Deploy PostgreSQL on Coolify

### Step 1: Create PostgreSQL Database

1. Log into your **Coolify** dashboard
2. Click **+ New Resource**
3. Select **Database** → **PostgreSQL**
4. Choose your **Server** and **Project**
5. Give it a name (e.g. `izuran-db`)
6. Click **Deploy** and wait for it to start

### Step 2: Get the Connection URL

After deployment, Coolify shows two URLs:

| URL Type | When to Use |
|----------|-------------|
| **Internal** | For your app when deployed on the same Coolify server (e.g. `postgres://...@hostname:5432/postgres`) |
| **Public** | For running migrations from your local machine, or when app is on a different server |

**Important:** To run `npm run db:import` from your computer, you need the **Public URL**. Enable **"Accessible over the internet"** in the PostgreSQL service settings if needed.

Copy the connection URL. It looks like:
```
postgres://postgres:YOUR_PASSWORD@hostname:5432/postgres
```

---

## Part 2: Migrate from Neon to Coolify

### Step 1: Export Data from Neon (while you still have access)

1. Set `DATABASE_URL` in `.env` to your **Neon** URL
2. Run the export:

```powershell
npm run db:export
```

This creates `backups/neon_backup_YYYY-MM-DDTHH-MM-SS.sql` with all your data.

### Step 2: Point to Coolify

1. Update `DATABASE_URL` in `.env` to your **Coolify PostgreSQL** URL:

```
DATABASE_URL=postgres://postgres:YOUR_PASSWORD@your-coolify-host:5432/postgres
```

### Step 3: Import Schema + Data

Run the import (pushes schema and imports the backup):

```powershell
npm run db:import
```

This will:
1. Push the Drizzle schema to Coolify
2. Import all data from the latest backup file

### Step 4: Verify

```powershell
npx tsx test-db.ts
```

You should see your products, and `scripts/check-artists.ts` can verify artists.

---

## Part 3: App Already on Coolify

If your app is already deployed on Coolify:

1. Go to your **App** service in Coolify
2. Open **Environment Variables**
3. Set `DATABASE_URL` = **Internal URL** from your Coolify PostgreSQL (e.g. `postgres://...@kkk080kwg4oksgg8okwsw484:5432/postgres`)
4. **Redeploy** the app so it picks up the new database

Using the internal hostname keeps the app and database on the same network (faster, no public exposure).

### URL Summary

| Where | Use This URL |
|-------|--------------|
| **Local dev / migrations** | Public URL (so you can reach it from your PC) |
| **App on Coolify** | Internal URL (better performance, same network) |

---

## Quick Reference: npm Scripts

| Command | What it does |
|---------|--------------|
| `npm run db:export` | Export data from current DATABASE_URL to `backups/` |
| `npm run db:import` | Push schema + import latest backup to DATABASE_URL |
| `npx tsx test-db.ts` | Test database connection |
| `npx tsx scripts/check-artists.ts` | Check artists in database |

---

## Troubleshooting

### "ENOTFOUND" or "getaddrinfo" error
- You're using the **internal** Coolify hostname from your local machine
- Use the **Public URL** instead, or enable "Accessible over the internet" on the PostgreSQL service

### Import shows "0 insert statements"
- Check that the backup file exists in `backups/`
- Re-run `npm run db:export` with Neon URL, then `npm run db:import` with Coolify URL

### App can't connect to database
- Ensure the app uses the **Internal URL** when deployed on Coolify
- Confirm both app and database are in the same Coolify project/network
