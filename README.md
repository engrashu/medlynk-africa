# Medlynk Africa

**Connecting Healthcare Access — Douala, Cameroon**

Bilingual (French/English) mobile-first platform that helps patients find authentic medicines at nearby verified pharmacies in real time.

> No patient in Cameroon should visit 3 pharmacies to find one medicine.

**Founder:** Ashu Bertrand ([@engrashu](https://github.com/engrashu))
**Domain:** [medlynk.me](https://medlynk.me)
**Email:** founder@medlynk.me

## Stack

Node.js · Express · SQL Server 2022 · React Native · AWS

## API Modules

| Module | Endpoints | Status |
|---|---|---|
| Medicines & pharmacy search | 3 endpoints | Done |
| Pharmacies — register, stock, verify | 5 endpoints | Done |
| Users — OTP auth, JWT, profiles | 4 endpoints | Done |
| Facilities — clinics, hospitals, labs | 7 endpoints | Done |
| Home screen summary | 1 endpoint | Done |
| SMS — Africa's Talking | OTP working (sandbox) | Done |

## Features

- Search medicines by name in French or English
- Find nearest pharmacy with stock — GPS distance sorting
- Find nearest hospital, clinic or lab — emergency filter
- Phone OTP login — Cameroon numbers (+237) normalized
- Bilingual responses — French and English
- WhatsApp stock update fallback for pharmacies
- Home screen — one API call returns everything near a patient

## Local Setup

```bash
git clone https://github.com/engrashu/medlynk-africa.git
cd medlynk-africa
npm install
cp .env.example .env
# Fill in your SQL Server and Africa's Talking credentials
npm run dev
```

## License

Proprietary — Medlynk Africa SARL