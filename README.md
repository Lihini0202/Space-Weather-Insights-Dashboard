# 🌌 NASA-Space & Weather Insights Dashboard

A  web application that brings the cosmos to your fingertips! This dashboard aggregates real-time astronomical data, global weather updates, and space exploration news. Users get a secure personal dashboard to fetch live data from external APIs and save, edit, or delete records in their own database.

---

## 🚀 Project Overview

The **Cosmic Dashboard** allows users to:

- 🔐 **Authenticate:** Secure login using Google OAuth 2.0.
- 🌠 **Explore Space:** View the Astronomy Picture of the Day (APOD) from NASA.
- ☁️ **Check Weather:** Get real-time weather updates for any city worldwide.
- 📰 **Read News:** Stay updated with the latest space exploration articles via the Spaceflight News API.
- 💾 **Manage Data:** Save favorite findings to MongoDB, edit JSON structures, and delete old entries.

---

## 🛠️ Tech Stack

**Frontend:**

- HTML5 & CSS3: Responsive design with Glassmorphism UI ✨
- JavaScript (ES6+): DOM manipulation & state management 🖥️
- AJAX (Fetch API): Asynchronous communication with the backend ⚡

**Backend:**

- Node.js & Express: RESTful API architecture 🔧
- MongoDB & Mongoose: Flexible NoSQL database 💾
- Passport.js: Google OAuth authentication 🔑

**External APIs Used:**

- 🌌 NASA API: Astronomy Picture of the Day (APOD)
- ☀️ OpenWeatherMap API: Current weather, humidity, wind speed
- 🚀 Spaceflight News API (v4): Latest space exploration articles

The backend acts as a proxy server to secure API keys and handle CORS. Frontend requests go through the backend.

---

## ⚙️ Installation & Setup

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/space-dashboard.git
cd space-dashboard
````

### 2. Install dependencies

```bash
npm install
```

### 3. Create a `.env` file in the root directory

```env
PORT=4000
MONGODB_URI=mongodb://localhost:27017/spaceDB
SESSION_SECRET=your_random_secret_string
FRONTEND_URL=http://localhost:5500  # Or wherever your HTML is hosted

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:4000/auth/google/callback

# External API Keys
NASA_API_KEY=your_nasa_key
OPENWEATHER_API_KEY=your_openweather_key
SPACE_FLIGHT_NEWS_API_KEY=news_key

# Internal App Security
API_KEY=app_key
```

### 4. Run the server

```bash
node server.js
```

### 5. Open the app

Open `index.html` in your browser (or serve via Live Server) 🌐

---

## 📡 API Reference & HTTP Methods

### Authentication

| Method | Endpoint     | Description                 |
| ------ | ------------ | --------------------------- |
| GET    | /auth/google | Initiates Google login      |
| GET    | /auth/user   | Checks if user is logged in |
| GET    | /auth/logout | Logs out the user           |

### Data Proxy (AJAX Fetch)

| Method | Endpoint           | Query Params | Description                   |
| ------ | ------------------ | ------------ | ----------------------------- |
| GET    | /api/proxy/nasa    | count=5      | Fetch random NASA APOD images |
| GET    | /api/proxy/weather | city=London  | Fetch weather for a city      |
| GET    | /api/proxy/news    | N/A          | Fetch latest space news       |

### User Records (CRUD)

> Protected routes requiring `X-API-Key` and a valid session.

| Method | Endpoint         | Description                         |
| ------ | ---------------- | ----------------------------------- |
| GET    | /api/records     | Load saved records for user         |
| POST   | /api/records     | Save current NASA/Weather/News data |
| PUT    | /api/records/:id | Update a specific record JSON       |
| DELETE | /api/records/:id | Delete a record                     |

---

## 💡 Key Features

* ⏳ **Asynchronous Loading:** Dashboard shows spinners while fetching data
* ✏️ **JSON Editing:** Edit saved record JSON before updating
* 🛡️ **Security:**

  * `ensureAuth` middleware protects database routes
  * `ensureApiKey` adds an extra layer of API security

---

## 📂 Project Structure

```
space-dashboard/
│
├── backend/
│   ├── server.js (or index.js)
│   ├── routes/
│   ├── models/
│   ├── package.json
│   ├── .env
│   └── node_modules/
│
├── frontend/
│   ├── index.html
│   ├── dashboard.html
│   ├── script.js
│   ├── style.css
│   └── space.gif
│
└── README.md
```

---



Do you want me to add that too?
```
