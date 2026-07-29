<p align="center">
  <img src="docs/logo.png" alt="Medlynk Africa" width="280">
</p>

<h1 align="center">Medlynk Africa</h1>
<h3 align="center">Connecting Healthcare Access — Douala, Cameroon</h3>

<p align="center">
  <strong>Digital health infrastructure platform connecting patients, pharmacies, clinics, hospitals and laboratories across Cameroon and Central Africa.</strong>
</p>

<p align="center">
  <a href="https://medlynk.me">Website</a> •
  <a href="mailto:founder@medlynk.me">Contact</a> •
  <a href="https://linkedin.com/in/bashu24">LinkedIn</a>
</p>

---

## The Problem

Patients in Cameroon visit 3 to 5 pharmacies per prescription with no way to know which one has their medicine in stock. Healthcare information is fragmented — clinics, labs and specialists exist but patients cannot find them. Medical records are paper-based and frequently lost. In emergencies, patients do not know which hospital is nearest with the services they need.

## The Solution

Medlynk is a multi-tenant healthcare platform where every user — patient, pharmacy, clinic, hospital, laboratory, government or insurer — downloads one app, chooses their account type, and gets a role-based dashboard powered by the same API.

Patients search for medicines and facilities for free. Healthcare providers manage their operations through paid dashboards. No facility can buy preferential placement. Ranking is by proximity, availability and verification only.

## Platform Architecture

MEDLYNK
           Same Login Screen
                  │
         Identity + Tenant + Role
                  │
┌─────────┬───────┬───────┬──────────┬───────────┐
│         │       │       │          │           │
Patient Pharmacy Hospital Lab   Government    Insurance
Dashboard Dashboard Dashboard Dashboard Dashboard Dashboard

## Tech Stack

| Layer | Technology |
|---|---|
| Backend API | Node.js + Express.js |
| Database | SQL Server 2022 (dev) → AWS RDS (production) |
| Mobile App | React Native + Expo (in development) |
| Authentication | Phone OTP + JWT — Cameroon +237 numbers |
| SMS | Africa's Talking — MTN & Orange Cameroon |
| Maps | Google Maps API |
| Cloud | AWS — $1,000 Activate credits secured |
| Future: WhatsApp | Meta Business API — text, voice, ordonnance photo |
| Future: AI | OpenAI Whisper (voice) + GPT-4 Vision (prescription OCR) |

## API Endpoints (22 live)

### Medicines (3)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/medicines` | All medicines — autocomplete |
| GET | `/api/medicines/search?name=&city=&lat=&lng=` | Search + GPS distance |
| GET | `/api/medicines/categories` | 8 medicine categories |

### Pharmacies (5)
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/pharmacies` | Register pharmacy |
| GET | `/api/pharmacies` | List — filter city, verified |
| GET | `/api/pharmacies/:id` | One pharmacy + stock |
| PUT | `/api/pharmacies/:id/stock` | Update stock |
| PUT | `/api/pharmacies/:id/verify` | Admin verify |

### Users (4)
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/users/request-otp` | Send OTP to phone |
| POST | `/api/users/verify-otp` | Verify → JWT token |
| GET | `/api/users/profile` | Get profile (protected) |
| PUT | `/api/users/profile` | Update profile (protected) |

### Facilities (7)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/facilities` | Search — type, emergency, GPS |
| GET | `/api/facilities/:id` | Facility + specialisations + labs |
| GET | `/api/facilities/types` | 7 facility types |
| GET | `/api/facilities/specialisations` | 15 specialisations |
| POST | `/api/facilities` | Register (protected) |
| POST | `/api/facilities/:id/specialisations` | Add specialisation |
| POST | `/api/facilities/:id/lab-services` | Add lab service |

### Home Screen (1)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/home?city=&lat=&lng=&language=` | Everything near patient in one call |

### Multi-Tenant Dashboard (1)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/dashboard` | Role-based modules (protected) |

### Health Check (1)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | API status |

## Database — 14 Tables

`medicine_categories` · `medicines` · `pharmacies` · `pharmacy_hours` · `pharmacy_stock` · `users` · `search_logs` · `facility_types` · `specialisations` · `facilities` · `facility_specialisations` · `lab_services`

## Brand Colors

| Color | Hex | Use |
|---|---|---|
| Medlynk Green | `#00C896` | Primary |
| Teal | `#0D9488` | Secondary |
| Deep Forest | `#0A2A24` | Dark backgrounds |
| Emergency Red | `#DC2626` | Ambulance, fire, alerts |
| Clean White | `#FFFFFF` | Light backgrounds |

## Project Status

| Milestone | Status |
|---|---|
| Backend API — 22 endpoints | ✅ Complete |
| Multi-tenant dashboard foundation | ✅ Complete |
| Phone OTP + JWT auth | ✅ Complete |
| SMS — Africa's Talking sandbox | ✅ Working |
| GPS distance sorting | ✅ Complete |
| medlynk.me website | ✅ Live |
| AWS Activate — $1,000 credits | ✅ Secured |
| founder@medlynk.me | ✅ Active |
| React Native mobile app | 🔄 In progress |
| AWS deployment | 🔄 This week |
| Real pharmacy onboarding | ⏳ Month 3 |
| WhatsApp Business intake | ⏳ Stage 2 |
| Voice + prescription OCR | ⏳ Stage 3 |

## Local Setup

```bash
git clone https://github.com/engrashu/medlynk-africa.git
cd medlynk-africa
npm install
cp .env.example .env
# Fill in SQL Server and Africa's Talking credentials
npm run dev
```

## Founder

**Ashu Betrand Njoh** — IT professional and community leader based in Douala, Cameroon. Community pastor in Mambanda since 2019. Founded Medlynk after witnessing a patient unable to find prescribed medicine at a Douala hospital.

- 📧 founder@medlynk.me
- 🌐 [medlynk.me](https://medlynk.me)
- 💼 [LinkedIn](https://linkedin.com/in/bashu24)

## License

Proprietary — Medlynk Africa SARL · Douala, Cameroon · 2026