# 🎬 Streamify — MERN Video Streaming Platform

## 🚀 Overview

**Streamify** is a full-stack video streaming platform built using the **MERN stack** with a **Next.js frontend** and **Express.js backend**.
It includes video upload, playback, comments, translation, downloads, premium plans, Razorpay payment integration, Firebase Google login, region-based OTP verification, custom video player gestures, and WebRTC video calling with screen sharing.

This project was developed as a **Full Stack Web Development Internship Project**.

---

## 🌐 Live Demo

### 🔗 Frontend

```txt
[https://mern-video-system-sglc.vercel.app/]
```

### 🔗 Backend

```txt
[https://mern-video-system.onrender.com/]
```

---

## ✨ Key Highlights

* 🎥 Video upload and streaming
* 🔐 Google login using Firebase
* 📍 Region-based OTP verification
* 🌗 Dynamic dark/light theme based on region and time
* 💬 Comment system with translation
* 👍 Like and dislike system
* ⬇️ Video download system
* 👑 Premium plan system
* 💳 Razorpay payment integration
* 📧 Email OTP and invoice support
* 📱 Twilio-ready SMS OTP integration
* 🎮 Custom video player gestures
* 📞 WebRTC video call with screen sharing
* 🚀 Deployed on Vercel and Render

---

## 🧩 Features

### 🔐 Authentication

* Google Sign-In using Firebase Authentication
* User profile saved in MongoDB
* Region-based OTP verification
* Email OTP using Gmail SMTP
* SMS OTP integration ready using Twilio
* Demo OTP mode for easy testing

---

### 🎥 Video Streaming

* Upload videos
* Fetch videos from MongoDB
* Play videos using custom video player
* Track views
* Like and dislike videos
* Display related videos
* Backend static file support for uploaded videos

---

### 💬 Comment System

* Add comments on videos
* Multi-language comment support
* Translate comments into English
* Like and dislike comments
* Auto-delete comments after 2 dislikes
* City/location display
* Special character validation

---

### ⬇️ Download System

* Download video feature
* Downloads page
* Downloaded videos shown as playable video cards
* Free users get 1 download per day
* Premium users get unlimited downloads

---

### 👑 Premium Plans

Plan-based access system:

| Plan   | Watch Limit |
| ------ | ----------- |
| Free   | 5 minutes   |
| Bronze | 7 minutes   |
| Silver | 10 minutes  |
| Gold   | Unlimited   |

Other premium features:

* Razorpay payment integration
* Demo premium activation
* Invoice email support
* Premium badge display

---

### 📍 Region-Based OTP and Theme

The app detects the user's location and applies OTP/theme rules.

| Condition                        | Result      |
| -------------------------------- | ----------- |
| South India + 10 AM to 12 PM IST | Light Theme |
| Other time/region                | Dark Theme  |
| South India user                 | Email OTP   |
| Other region user                | Mobile OTP  |

South India states supported:

* Tamil Nadu
* Kerala
* Karnataka
* Andhra Pradesh
* Telangana

---

### 🎮 Custom Video Player Controls

The video player includes custom gesture-based controls:

| Action            | Feature            |
| ----------------- | ------------------ |
| Single tap center | Play / Pause       |
| Double tap right  | Forward 10 seconds |
| Double tap left   | Rewind 10 seconds  |
| Triple tap center | Next video         |
| Triple tap left   | Open comments      |
| Triple tap right  | Close page         |
| Fullscreen button | Fullscreen mode    |
| Speed control     | Playback speed     |
| Fit/Fill button   | Video display mode |

---

### 📞 Video Calling

* Real-time video call room
* WebRTC peer connection
* Socket.IO signaling
* Camera and microphone support
* Screen sharing support
* Local recording support

---

## 🛠️ Tech Stack

### Frontend

* Next.js
* React.js
* TypeScript
* Tailwind CSS
* Axios
* Firebase Authentication
* Socket.IO Client
* Lucide React Icons

### Backend

* Node.js
* Express.js
* MongoDB
* Mongoose
* Socket.IO
* Razorpay
* Nodemailer
### Deployment

* Frontend: Vercel
* Backend: Render
* Database: MongoDB Atlas
* Authentication: Firebase

---

## 📁 Folder Structure

````txt
MERN-VIDEO-SYSTEM/
│
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── lib/
│   │   ├── pages/
│   │   └── styles/
│   ├── public/
│   ├── package.json
│   └── .env.local.example
│
├── server/
│   ├── controllers/
│   ├── routes/
│   ├── Modals/
│   ├── utils/
│   ├── socket/
│   ├── filehelper/
│   ├── uploads/
│   ├── index.js
│
- OpenStreetMap Nominatim API

### Deployment

- Frontend: Vercel
- Backend: Render
- Database: MongoDB Atlas
- Authentication: Firebase

---

## 📁 Folder Structure

```txt
MERN-VIDEO-SYSTEM/
│
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── lib/
│   │   ├── pages/
│   │   └── styles/
│   ├── public/
│   ├── package.json
│   └── .env.local.example
│
├── server/
│   ├── controllers/
│   ├── routes/
│     ├── package.json
│   └── .env.example
│
├── README.md
└── .gitignore
````

---

## ⚙️ Local Setup

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/MERN-VIDEO-SYSTEM.git
cd MERN-VIDEO-SYSTEM
```

---

## 🖥️ Backend Setup

### 1. Go to Server Folder

```bash
cd server
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Create `.env` File

Create a `.env` file inside the `server` folder.

```env
PORT=5000
DB_URL=your_mongodb_connection_string
CLIENT_URL=http://localhost:3000

RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
PREMIUM_AMOUNT=99

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_gmail_app_password
SMTP_FROM=Streamify <your_email@gmail.com>

TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number

DEMO_OTP=true
```

### 4. Start Backend

```bash
npm start
```

Backend will run on:

```txt
http://localhost:5000
```

---

## 🌍 Frontend Setup

### 1. Go to Client Folder

```bash
cd client
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Create `.env.local` File

Create a `.env.local` file inside the `client` folder.

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000

NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id
```

### 4. Start Frontend

```bash
npm run dev
```

Frontend will run on:

```txt
http://localhost:3000
```

---

## 🔥 Firebase Setup

1. Create a Firebase project.
2. Create a web app inside Firebase.
3. Enable Google Authentication.
4. Copy Firebase config values.
5. Add the values inside `client/.env.local`.
6. Add authorized domains.

For local testing:

```txt
localhost
```

For deployed frontend:

```txt
your-vercel-app.vercel.app
```

---

## 🔗 Important API Routes

### User Routes

```txt
POST /user/login
```

### Video Routes

```txt
POST /video/upload
GET /video/getall
```

### Comment Routes

```txt
POST /comment/add
GET /comment/:videoid
PUT /comment/like/:id
PUT /comment/dislike/:id
POST /comment/translate
```

## 🚀 Deployment

## Backend Deployment on Render

### Render Settings

```txt
Root Directory: server
Build Command: npm install
Start Command: npm start
```

### Render Environment Variables

```env
DB_URL=your_mongodb_connection_string
CLIENT_URL=https://your-vercel-app.vercel.app

RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
PREMIUM_AMOUNT=99

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_gmail_app_password
SMTP_FROM=Streamify <your_email@gmail.com>


DEMO_OTP=true
```

---

## Frontend Deployment on Vercel

### Vercel Environment Variables

```env
NEXT_PUBLIC_BACKEND_URL=https://your-render-backend.onrender.com

NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id
```

After adding environment variables, redeploy the frontend.

---

## 🔐 Security Notes

Do not push these files/folders to GitHub:

```txt
.env
.env.local
node_modules
.next
uploads
```

Use these files for public examples only:

```txt
server/.env.example
client/.env.local.example
```

Never expose:

* MongoDB connection string
* Razorpay secret key
* Gmail app password
* Twilio auth token
* Private environment files

---

## ⚠️ Important Deployment Note

If videos are stored in the local `server/uploads` folder, they may not persist permanently on Render after redeploys or restarts.

For production-level deployment, use cloud storage like:

* Cloudinary
* Firebase Storage
* AWS S3
* Render Persistent Disk

---

## ✅ Project Status

| Module                 | Status    |
| ---------------------- | --------- |
| Google Login           | Completed |
| MongoDB User Storage   | Completed |
| Video Upload           | Completed |
| Video Playback         | Completed |
| Comment System         | Completed |
| Comment Translation    | Completed |
| Like/Dislike           | Completed |
| Download System        | Completed |
| Premium Plans          | Completed |
| Razorpay Integration   | Completed |
| Email OTP              | Completed |
| Demo OTP               | Completed |
| Region-Based Theme     | Completed |
| Custom Player Gestures | Completed |
| Video Calling          | Completed |
| Screen Sharing         | Completed |
| Vercel Deployment      | Completed |
| Render Deployment      | Completed |

---

## 👨‍💻 Author

**Shashank Sharma**

B.Tech CSE-AIML
Full Stack Web Development Project

---

## 📌 Final Note

Streamify is built as a complete full-stack video streaming project with modern authentication, payment, video interaction, premium access, OTP verification, and real-time communication features.

This project demonstrates practical knowledge of:

* Full-stack development
* REST API integration
* Authentication
* Database management
* Payment gateway integration
* Real-time communication
* Cloud deployment
* Production environment configuration

---

## ⭐ Support

If you like this project, give it a star on GitHub.
