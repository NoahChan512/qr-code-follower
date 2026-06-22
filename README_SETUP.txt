# QR Tracker Website

A small Netlify website that turns links into tracked QR codes.

## What it does

- Create a QR code from any link
- Give each QR code a name
- Add notes / remarks
- Track scan count
- View recent scans: time, device, browser, IP, country/referrer when available
- Export scan records as CSV

## Privacy reality

This cannot truly know the real person who scanned unless the scanner logs in or fills in a form. It records technical scan data only: time, IP, device, browser, referrer.

## Deploy

1. Create a GitHub repo, e.g. `qr-tracker`.
2. Upload all files in this folder to the repo root.
3. Netlify → Add new site → Import from GitHub.
4. Build command: leave blank or `npm install` if Netlify asks.
5. Publish directory: `public`.
6. Functions directory is already set in `netlify.toml`.
7. Netlify → Site configuration → Environment variables → add:
   - `ADMIN_PASSWORD` = your private dashboard password
8. Deploy.

## How to use

- Open your Netlify site URL.
- Enter admin password.
- Create a QR with name, destination link, optional custom code and notes.
- Use the tracked link or QR image.
- Scans go through `/q/<code>` and then redirect to the destination.

## Important

- Do not share the admin password.
- If `ADMIN_PASSWORD` is not set, the default is `changeme`; change it before public use.
- QR image generation uses `api.qrserver.com` for quick free QR images.
