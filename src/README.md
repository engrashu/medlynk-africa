# Medlynk Africa
**Connecting Healthcare Access — Douala, Cameroon**

Bilingual (French/English) mobile-first platform that helps patients
find authentic medicines at nearby verified pharmacies in real time.

> No patient in Cameroon should visit 3 pharmacies to find one medicine.

**Founder:** Ashu Bertrand ([@engrashu](https://github.com/engrashu))
**Started:** June 8, 2026 · Day 1 of 120
**Domain:** medlynk.me

## Stack
Node.js · SQL Server 2022 · React Native (Expo) · AWS Amplify

## API Modules
| Module | Status |
|---|---|
| Medicines & pharmacy search | ✅ Live |
| Phone OTP + JWT authentication | ✅ Live |
| User profiles — bilingual FR/EN | ✅ Live |
| Clinics, hospitals & labs | 🔄 Week 2 |
| SMS alerts (Africa's Talking) | ⏳ Month 2 |
| React Native mobile app | ⏳ Month 2 |

## Local Setup
```bash
npm install
cp .env.example .env
# Fill in your SQL Server details
npm run dev
```