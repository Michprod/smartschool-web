# SmartSchool Web (SPA)

Frontend React découplé de l'API Laravel SmartSchool.

## Prérequis

- Node.js 20+
- API Laravel sur `http://localhost:8000` (voir `SmartSchool-full`)

## Installation

```bash
npm install
```

## Développement

Terminal 1 — API :
```bash
cd ../SmartSchool-full
php artisan serve
```

Terminal 2 — SPA :
```bash
npm run dev
```

Ouvrir http://localhost:5173

Compte de test (après `php artisan db:seed`) :
- Email : `admin@smartschool.cd`
- Mot de passe : `password`

## Build production

```bash
npm run build
```

Variables :
- `VITE_API_URL` — URL de l'API (ex. `https://api.smartschool.cd`). Vide en dev si proxy Vite est utilisé.
