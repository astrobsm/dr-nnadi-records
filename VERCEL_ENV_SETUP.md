# ⚠️ CRITICAL: Add Environment Variables to Vercel

Your deployment is failing because the database credentials are not configured in Vercel.

## Step-by-Step Instructions:

### 1. Go to Vercel Dashboard
- Visit: https://vercel.com/dashboard
- Click on your project: **dr-nnadi-records**

### 2. Open Settings
- Click on the **Settings** tab at the top

### 3. Add Environment Variables
- Click on **Environment Variables** in the left sidebar
- Add the following variables:

#### Variable 1:
- **Name:** `POSTGRES_URL`
- **Value:** `postgres://34e6119e8ff1666d5455f2de517bff94d480ab799d8aa57adbd261ccf5df4613:sk_ARQfFhHaWf-k_3vNIoptT@db.prisma.io:5432/postgres?sslmode=require`
- **Environment:** Production, Preview, Development (check all 3)

#### Variable 2:
- **Name:** `POSTGRES_PRISMA_URL`
- **Value:** `prisma+postgres://accelerate.prisma-data.net/?api_key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqd3RfaWQiOjEsInNlY3VyZV9rZXkiOiJza19BUlFmRmhIYVdmLWtfM3ZOSW9wdFQiLCJhcGlfa2V5IjoiMDFLQ1I2OFlQUFBKU1lON1BIV1lUVjlWRkMiLCJ0ZW5hbnRfaWQiOiIzNGU2MTE5ZThmZjE2NjZkNTQ1NWYyZGU1MTdiZmY5NGQ0ODBhYjc5OWQ4YWE1N2FkYmQyNjFjY2Y1ZGY0NjEzIiwiaW50ZXJuYWxfc2VjcmV0IjoiMWFkNzQ2ZWItMDIwOS00MzU5LTg0YmEtOTYyNzM1MWY1OWU1In0.1GdJ9BO7gFK-_tiFB-vmwCsaTGgIT7hhkz2BtauIWFk`
- **Environment:** Production, Preview, Development (check all 3)

### 4. Redeploy
After adding the variables:
- Go to the **Deployments** tab
- Click on the latest deployment
- Click the **⋮** (three dots) menu
- Select **Redeploy**

### 5. Test
Once redeployed, open:
- https://dr-nnadi-records.vercel.app/upload-to-cloud.html

Follow the 3 steps on that page to:
1. Initialize the database tables
2. Upload your local data from browser storage
3. Verify the upload

## Alternative: Using Vercel CLI (if above fails)

```bash
vercel env add POSTGRES_URL
# Paste the POSTGRES_URL value when prompted

vercel env add POSTGRES_PRISMA_URL  
# Paste the POSTGRES_PRISMA_URL value when prompted

# Redeploy
vercel --prod
```

## After Setup

Your app will automatically:
- ✅ Store all new records in the Vercel Postgres database
- ✅ Sync across all your devices
- ✅ Work even when browser blocks localStorage (tracking prevention)
- ✅ Keep data safe in the cloud

## Troubleshooting

If you still see errors after adding environment variables:
1. Make sure you clicked "Save" on each variable
2. Make sure you selected all 3 environments (Production, Preview, Development)
3. Make sure you redeployed after adding variables
4. Check the Vercel deployment logs for any error messages
