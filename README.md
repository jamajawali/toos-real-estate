# TOOS REAL ESTATE website

A responsive property website with branded logo, sample property categories, a customer registration form and buyer/seller inquiry forms.

## Launch locally
1. Install Node.js 18 or later.
2. In the project folder run `npm install`.
3. Copy `.env.example` to `.env` and replace the placeholders with your real business email and SMTP provider details.
4. Run `npm start` and open http://localhost:3000.

## How it works
- Customer registration: POST `/api/register` stores customer details in `data/customers.json`, with passwords hashed using bcrypt. Registration is real server-side, but customer login, email verification and password resets are not implemented.
- Buy / sell inquiries: POST `/api/inquire` saves the inquiry in `data/inquiries.json` and attempts to email `BUSINESS_EMAIL` via your SMTP account. Without configured SMTP, the inquiry is saved but cannot be emailed and the customer sees an honest error message.
- Property images are illustrative (loaded via external Unsplash URLs); these are not real listings.

## Before publishing online
- Set real SMTP credentials and business email in `.env` (never share `.env`).
- Add HTTPS, appropriate privacy policy, consent notice, backups and data retention policy before gathering customer data.
- This starter site does not provide customer login, admin portal, property listing management, email verification, or advanced bot protection. Use a managed database and protected admin system for larger-scale deployment.
- Host the Node.js app on a provider that supports persistent storage or change storage to a managed database (many cloud deployments do not persist local files).
