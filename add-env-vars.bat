@echo off
echo Adding environment variables to Vercel...
echo.

REM Add POSTGRES_URL
echo Adding POSTGRES_URL...
echo postgres://34e6119e8ff1666d5455f2de517bff94d480ab799d8aa57adbd261ccf5df4613:sk_ARQfFhHaWf-k_3vNIoptT@db.prisma.io:5432/postgres?sslmode=require | vercel env add POSTGRES_URL production

echo.
echo Adding POSTGRES_PRISMA_URL...
echo prisma+postgres://accelerate.prisma-data.net/?api_key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqd3RfaWQiOjEsInNlY3VyZV9rZXkiOiJza19BUlFmRmhIYVdmLWtfM3ZOSW9wdFQiLCJhcGlfa2V5IjoiMDFLQ1I2OFlQUFBKU1lON1BIV1lUVjlWRkMiLCJ0ZW5hbnRfaWQiOiIzNGU2MTE5ZThmZjE2NjZkNTQ1NWYyZGU1MTdiZmY5NGQ0ODBhYjc5OWQ4YWE1N2FkYmQyNjFjY2Y1ZGY0NjEzIiwiaW50ZXJuYWxfc2VjcmV0IjoiMWFkNzQ2ZWItMDIwOS00MzU5LTg0YmEtOTYyNzM1MWY1OWU1In0.1GdJ9BO7gFK-_tiFB-vmwCsaTGgIT7hhkz2BtauIWFk | vercel env add POSTGRES_PRISMA_URL production

echo.
echo Environment variables added!
echo Now redeploying...
vercel --prod

echo.
echo Done! Your app should now work with cloud database.
pause
