# Astra Proposal AI — Hostinger MySQL Deployment Guide

This guide is drafted for senior full-stack architects and developers. It details the step-by-step instructions to deploy the Astra Proposal AI database, connect the Node.js/Express backend server, and map the multi-relational structures.

---

## 1. Database Creation (Hostinger hPanel)

Follow these steps to provision and configure your Hostinger MySQL Instance:
1. **Login to Hostinger:** Navigate to the [Hostinger hPanel](https://hpanel.hostinger.com/).
2. **Locate Databases:** Scroll down to the **Databases** group and click on **MySQL Databases**.
3. **Provision a New Database:**
   - **MySQL Database name:** enter a suffix (e.g., `_astra` resulting in `u123456789_astra`).
   - **MySQL Username:** enter your database user suffix (e.g., `_user` resulting in `u123456789_user`).
   - **Password:** Generate a secure, high-entropy password (ensure it contains no special characters that would cause URL parsing issues, or escape them).
4. Click **Create**. Hostinger will configure this instance immediately on standard port `3306`.

---

## 2. Table Creation and Seeding via phpMyAdmin

Once created, populate your tables using the SQL script we designed:
1. In Hostinger hPanel, look at your newly created database in the **List of Current MySQL Databases**.
2. Click **Enter phpMyAdmin** next to the database.
3. Once phpMyAdmin loads:
   - Click the **SQL** tab in the main navigation banner.
   - Open your project `/astra_proposal_ai.sql` file.
   - Copy the entire contents of the SQL script.
   - Paste the SQL statements into the phpMyAdmin query field.
4. Click **Go** (bottom right).
5. All 9 tables with strict foreign key constraints, optimal indexes, and seed records will be established.

---

## 3. Environment Variables Setup (`.env.local`)

To link your application server to Hostinger, add these configurations to your `.env` or `.env.local` files:

```env
# ----------------------------------------------------
# 🔌 Hostinger MySQL Connection Parameters
# ----------------------------------------------------
DB_HOST="your-hostinger-mysql-ip-or-subdomain"       # Found under "MySQL Server" in hPanel
DB_PORT=3306                                         # Default MySQL Port
DB_NAME="your_database_full_name_from_hpanel"        # e.g., u123456789_astra
DB_USER="your_database_full_user_from_hpanel"        # e.g., u123456789_user
DB_PASSWORD="your-strong-hostinger-mysql-password"
DB_CONNECTION_LIMIT=10                               # Pooling thresholds
DB_SSL=false                                         # Set to true if SSL mode is enabled in Hostinger
```

> ⚠️ **Security Warning:** NEVER commit secrets or your Hostinger configurations to your institutional Git branches. Keep these variables restricted to your deployment environment's dashboard or uncommitted local files.

---

## 4. Entity-Relationship Diagram (ERD) Structure

The schema contains 9 interlocked tables with strict matching relationships:

```
  ┌──────────────┐                        ┌──────────────┐
  │    USERS     │                        │   CLIENTS    │
  └──────┬───────┘                        └──────┬───────┘
         │ (1)                                   │ (1)
         │                                       │
         ├──────────────────┐                    │
         │ (1..N)           │ (1..N)             │ (1..N)
  ┌──────▼───────┐   ┌──────▼───────┐     ┌──────▼───────┐
  │ ACTIVITY_LOG │   │  PROPOSALS   ├────►│ CRM_PIPELINE │
  └──────────────┘   └─────┬──┬──┬──┘     └──────────────┘
                           │  │  │ 
        ┌──────────────────┘  │  └──────────────────┐
        │ (1)                 │ (1)                 │ (1)
        │                     │                     │
 ┌──────▼───────┐      ┌──────▼───────┐      ┌──────▼───────┐
 │ VERSION_HIST │      │ ATTACHMENTS  │      │NOTIFICATIONS │
 └──────────────┘      └──────────────┘      └──────────────┘
```

### Table Dictionary Reference

1. **USERS:** Administrative accounts and session credentials (Auth/CRM).
2. **CLIENTS:** Client business registries, locations, and corporate emails.
3. **PROPOSALS:** Core container of branding parameters, website specifications, milestones, and costs.
4. **PROPOSAL_TEMPLATES:** Modular preset documents used to prefill creation wizards.
5. **PROPOSAL_VERSION_HISTORY:** Detailed snapshots of previous proposal iterations supporting instant reverts.
6. **CRM_PIPELINE:** Metric registers translating proposal values/statuses into active pipeline deal values.
7. **ACTIVITY_LOG:** Security-hardened system audits tracing all logins, saves, deletes, and profile edits.
8. **FILE_ATTACHMENTS:** Remote storage links mapped to relevant client proposals.
9. **NOTIFICATIONS:** Status messages and automated daily email timeline alerts.

---

## 5. Deployment Commands & Setup Checklist

When launching on your Hostinger Node.js Cloud environment:
- **Build/Compile Command:** `npm run build`
- **Start/Run Command:** `npm run start`

The compiled server outputs a single backend bundle located at `dist/server.cjs` and standard Vite static production assets at `dist/`, ensuring lightning-fast startup and smooth asset mapping.
