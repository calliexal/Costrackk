# Source Code Structure

Folder `src` berisi semua source code backend aplikasi CostTrack.

## Struktur Folder

```
src/
├── config/          # Konfigurasi aplikasi
│   └── database.js  # Konfigurasi MongoDB connection
├── controllers/     # Business logic & request handlers
│   ├── hpeController.js
│   ├── komponenController.js
│   ├── kursController.js
│   ├── produkController.js
│   ├── riwayatController.js
│   └── statsController.js
├── models/          # Mongoose schemas & models
│   ├── Komponen.js
│   ├── Kurs.js
│   ├── Produk.js
│   └── Riwayat.js
├── routes/          # API route definitions
│   ├── hpeRoutes.js
│   ├── komponenRoutes.js
│   ├── kursRoutes.js
│   ├── produkRoutes.js
│   └── riwayatRoutes.js
├── utils/           # Helper functions & utilities
│   ├── hpeCalculator.js
│   └── jisdorService.js
├── app.js           # Express app configuration
└── server.js        # Server entry point
```

## File Descriptions

### config/
- **database.js**: MongoDB connection configuration

### controllers/
- **hpeController.js**: HPE calculation logic
- **komponenController.js**: Component CRUD operations
- **kursController.js**: Exchange rate management
- **produkController.js**: Product CRUD operations
- **riwayatController.js**: Procurement history management
- **statsController.js**: Dashboard statistics

### models/
- **Komponen.js**: Component data model
- **Kurs.js**: Exchange rate data model
- **Produk.js**: Product data model
- **Riwayat.js**: Procurement history data model

### routes/
- API route definitions for each resource

### utils/
- **hpeCalculator.js**: HPE calculation utilities
- **jisdorService.js**: JISDOR API integration

### Core Files
- **app.js**: Express application setup & middleware
- **server.js**: Server initialization & startup

## Running the Application

```bash
# Development
npm run dev

# Production
npm start

# Old structure (fallback)
npm run start:old
```
