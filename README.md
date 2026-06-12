# Medlynk Africa
**Connecting Healthcare Access — Douala, Cameroon**

Bilingual (French/English) mobile-first platform that helps patients
find authentic medicines at nearby verified pharmacies in real time.

> No patient in Cameroon should visit 3 pharmacies to find one medicine.

## Founder
Ashu Bertrand ([@engrashu](https://github.com/engrashu))
Started: June 8, 2026 — Day 1 of 120

## Tech Stack
- **Backend:** Node.js + Express
- **Database:** SQL Server 2022 (local dev) → AWS (production)
- **Mobile App:** React Native + Expo (Month 2)
- **Auth:** Phone OTP + JWT tokens
- **SMS:** Africa's Talking — MTN/Orange Cameroon (+237)
- **Maps:** Google Maps API
- **WhatsApp:** Omnichannel intake — text, voice, ordonnance photo
- **Domain:** [medlynk.me](https://medlynk.me)

## API Modules
| Module | Status |
|---|---|
| Medicines & pharmacy search | Done |
| Phone OTP authentication | Done |
| User profiles — bilingual FR/EN | Done |
| Clinics, hospitals & labs | This week |
| SMS — Africa's Talking | Month 2 |
| React Native mobile app | Month 2 |
| WhatsApp Business intake | Stage 2 |
| Voice + ordonnance OCR | Stage 3 |

## Local Setup
```bash
npm install
cp .env.example .env
npm run dev
```

## Mission
No patient in Cameroon should visit 3 pharmacies to find one medicine.
Built for Cameroon — low bandwidth, bilingual, community-first.
