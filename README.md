# DoodleLobby 🎨 — Real-Time Collaborative Whiteboard

> A sleek, high-performance, real-time multiplayer digital whiteboard and canvas studio built with Next.js 14, Tailwind CSS, Spring Boot, and Netty-SocketIO.

---

## ✨ Features

- **⚡ Real-Time Multi-User Stroke Sync**: Millisecond-level synchronization of pencil strokes, lines, rectangles, circles, and erasers across all connected artists.
- **🎯 Live Multiplayer Cursors**: Colored live pointer arrows with artist name tags showing everyone's movements in real time.
- **🔐 Protected Lobby Access**: Built-in authentication gate with password protection and artist handles.
- **⏱️ Auto-Cleaning Idle Rooms**: Intelligent 2-minute grace period automatically garbage-collects inactive rooms and purges memory when everyone leaves.
- **🖼️ High-Res Canvas PNG Export**: Instant single-click export of whiteboards with dark aesthetic backgrounds for easy team sharing.
- **🎨 Modern Dark Aesthetics**: Linear / V0.dev inspired design with glassmorphism, subtle grid texturing (`bg-grid-white/[0.03]`), vibrant gradient accents, and Lucide React icons.

---

## 🛠️ Tech Stack

### Frontend (`client/`)
- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Language**: JavaScript (ES6+ / React 18)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Real-Time Client**: [Socket.IO Client](https://socket.io/) (v2 protocol compatible)

### Backend (`server/`)
- **Language**: Java 17+
- **Framework**: [Spring Boot 3.2.2](https://spring.io/projects/spring-boot)
- **WebSocket Engine**: [Netty-SocketIO 1.7.25](https://github.com/mrniko/netty-socketio)
- **JSON Serialization**: Google Gson & FasterXML Jackson
- **Build Tool**: Apache Maven

---

## 📁 Repository Structure

```
DoodleLobby/
├── client/                     # Next.js frontend application
│   ├── src/
│   │   ├── app/                # App Router (layout, page, dynamic room route)
│   │   ├── components/         # AuthGate, Dashboard, Whiteboard, Toolbar, Canvas, Cursors
│   │   └── hooks/              # useSocket.js (SocketContext & SocketProvider)
│   ├── .env.example            # Client environment variable template
│   ├── .gitignore              # Client ignore rules
│   ├── package.json
│   └── tailwind.config.js
├── server/                     # Spring Boot & Netty-SocketIO backend
│   ├── src/main/java/com/doodlelobby/
│   │   ├── config/             # SocketIOConfig, RoomService
│   │   ├── model/              # Room, User, DrawData
│   │   └── socket/             # SocketModule (Event listeners & server lifecycle)
│   ├── src/main/resources/     # application.properties
│   ├── .gitignore              # Server ignore rules
│   └── pom.xml                 # Maven build configuration
├── .gitignore                  # Root ignore rules
└── README.md                   # Project documentation
```

---

## 🚀 Local Development Setup

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **JDK**: Java 17 or higher
- **Maven**: 3.8+ (or use installed `mvn`)

---

### 1. Backend Setup (`server/`)

1. Open a terminal and navigate to the `server/` directory:
   ```bash
   cd server
   ```

2. Compile and package the application:
   ```bash
   mvn clean package -DskipTests
   ```

3. Start the Spring Boot server:
   ```bash
   # Run directly via Maven:
   mvn spring-boot:run

   # OR run the packaged executable JAR:
   java -jar target/doodlelobby-server-1.0.0-SNAPSHOT.jar
   ```

4. The server will start on port `5000` (`http://localhost:5000`).

---

### 2. Frontend Setup (`client/`)

1. Open another terminal and navigate to the `client/` directory:
   ```bash
   cd client
   ```

2. Configure your environment variables:
   ```bash
   cp .env.example .env.local
   ```
   *(By default, `.env.example` points to `NEXT_PUBLIC_SOCKET_SERVER_URL=http://localhost:5000`)*

3. Install dependencies:
   ```bash
   npm install
   ```

4. Start the Next.js development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

### 🔑 Default Credentials
- **Artist Handle**: Any name between 3-15 characters (e.g., `Alex`, `Leonardo`)
- **Default Lobby Passcode**: `doodlelobby-secret` (or click **"Quick fill"**)

---

## ☁️ Deployment Guide

### Backend: Deploying to Render

1. Create a new **Web Service** on [Render](https://render.com/).
2. Connect your GitHub repository.
3. Configure the following settings:
   - **Root Directory**: `server`
   - **Runtime**: `Java` (or `Docker`)
   - **Build Command**: `mvn clean package -DskipTests`
   - **Start Command**: `java -jar target/doodlelobby-server-1.0.0-SNAPSHOT.jar`
4. Set Environment Variables:
   - `PORT`: `5000` (or leave default, Render sets this automatically)
   - `ROOM_SECRET_PASSWORD`: Your custom secure lobby passcode
   - `ROOM_IDLE_TIMEOUT`: `120` (seconds before auto-deleting empty rooms)
5. Copy your deployed service URL (e.g. `https://doodlelobby-server.onrender.com`).

---

### Frontend: Deploying to Vercel

1. Import your repository into [Vercel](https://vercel.com/).
2. Select the `client` directory as the **Root Directory**.
3. Set the Framework Preset to **Next.js**.
4. In **Environment Variables**, add:
   - **Key**: `NEXT_PUBLIC_SOCKET_SERVER_URL`
   - **Value**: Your backend URL (e.g. `https://doodlelobby-server.onrender.com`)
5. Click **Deploy**. Vercel will automatically build and publish your Next.js application.

---

## 🔒 Security & Environment Variables

| Variable | Scope | Default | Description |
|---|---|---|---|
| `NEXT_PUBLIC_SOCKET_SERVER_URL` | Client | `http://localhost:5000` | Target URL for backend WebSocket server |
| `PORT` | Server | `5000` | HTTP/Socket.IO port for backend |
| `ROOM_SECRET_PASSWORD` | Server | `doodlelobby-secret` | Shared secret passcode for lobby access |
| `ROOM_IDLE_TIMEOUT` | Server | `120` | Inactivity countdown (seconds) before destroying empty rooms |

---

## 📄 License
This project is licensed under the MIT License.
