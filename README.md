# DoodleLobby 🎨 — Real-Time Collaborative Whiteboard

> A sleek, high-performance, real-time multiplayer digital whiteboard and canvas studio built with **Next.js 14**, **Tailwind CSS**, **Spring Boot**, and **Netty-SocketIO**.

---

## ✨ Features

- **⚡ Real-Time Multi-User Stroke Sync**: 60fps streaming synchronization of pencil strokes, lines, rectangles, circles, and erasers across all connected artists.
- **🎯 Transform-Synced Remote Cursors**: Live pointer arrows with artist name badges tinted in assigned colors, precisely synchronized with canvas scale and pan offsets.
- **📄 Fixed Sheet & Infinite Workspace Modes**:
  - **Infinite Space**: Unbounded fluid canvas for freeform brainstorming.
  - **Fixed Sheet (16:9 Widescreen)**: Standard 1920×1080 paper document mode.
  - **Fixed Sheet (A4 Portrait)**: Standard 1240×1754 printable document mode with boundary clamping.
- **🔍 Pointer-Anchored Pan & Zoom**: Smooth mouse wheel / trackpad zooming anchored directly at the cursor location, with Spacebar + drag panning.
- **🧹 Standardized Eraser Pipeline**: Normalized coordinate and stroke width scaling so erasers never deform or jump size on mouse release or remote screens.
- **↩️ Multi-User Undo / Redo**: Instant synchronous repainting and broadcasted history undo/redo stack with keyboard shortcuts (`Ctrl+Z` / `Ctrl+Y`).
- **🌓 Tactical Light & Dark Mode**: High-contrast modern interface with solid clean canvas surfaces and instant theme switching.
- **🔐 Protected Lobby Access**: Built-in authentication gate with passcode validation and artist handles.
- **⏱️ Auto-Cleaning Idle Rooms**: Intelligent 2-minute grace period automatically garbage-collects inactive rooms and purges memory when everyone leaves.
- **🖼️ Clean PNG Export**: Instant single-click export cropped to exact sheet dimensions or canvas drawing.

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
- **Containerization**: Docker (multi-stage JRE 17 build)

---

## 📁 Repository Structure

```
DoodleLobby/
├── client/                     # Next.js frontend application
│   ├── src/
│   │   ├── app/                # App Router (layout, page, dynamic room route)
│   │   ├── components/         # Dashboard, Whiteboard, Canvas, LiveCursors, Toolbar, Settings
│   │   ├── context/            # ThemeContext (Light / Dark mode)
│   │   └── hooks/              # useSocket.js (SocketContext & SocketProvider)
│   ├── .env.example            # Client environment template
│   ├── .gitignore              # Client ignore rules
│   ├── package.json
│   └── tailwind.config.js
├── server/                     # Spring Boot & Netty-SocketIO backend
│   ├── src/main/java/com/doodlelobby/
│   │   ├── config/             # SocketIOConfig, RoomService
│   │   ├── model/              # Room, User, DrawData
│   │   └── socket/             # SocketModule (Event listeners & room lifecycle)
│   ├── src/main/resources/     # application.properties
│   ├── Dockerfile              # Multi-stage Docker build for cloud deployments
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

## ☁️ Zero-Cost Cloud Deployment

### 1. Backend: Deploy to Render / Railway

#### Option A: Deploy via Dockerfile (Recommended)
1. Create a new **Web Service** on [Render](https://render.com/) or [Railway](https://railway.app/).
2. Connect your GitHub repository.
3. Configure the following settings:
   - **Root Directory**: `server`
   - **Environment / Runtime**: `Docker`
   - **Dockerfile Path**: `Dockerfile`
4. Set Environment Variables:
   - `PORT`: `5000` (Render sets `PORT` automatically; the server adapts dynamically)
   - `ROOM_SECRET_PASSWORD`: Your custom secure lobby passcode
   - `ROOM_IDLE_TIMEOUT`: `120` (seconds before auto-deleting empty rooms)
5. Copy your deployed service URL (e.g., `https://doodlelobby-backend.onrender.com`).

#### Option B: Deploy via Native Java Runtime
- **Root Directory**: `server`
- **Runtime**: `Java 17`
- **Build Command**: `mvn clean package -DskipTests`
- **Start Command**: `java -jar target/doodlelobby-server-1.0.0-SNAPSHOT.jar`

---

### 2. Frontend: Deploy to Vercel

1. Import your repository into [Vercel](https://vercel.com/).
2. Select the `client` directory as the **Root Directory**.
3. Set the Framework Preset to **Next.js**.
4. In **Environment Variables**, add:
   - **Key**: `NEXT_PUBLIC_SOCKET_SERVER_URL`
   - **Value**: Your deployed backend URL (e.g., `https://doodlelobby-backend.onrender.com`)
5. Click **Deploy**. Vercel will automatically build and publish your Next.js application with zero configuration.

---

## 🔒 Security & Environment Variables

| Variable | Scope | Default | Description |
|---|---|---|---|
| `NEXT_PUBLIC_SOCKET_SERVER_URL` | Client | `http://localhost:5000` | Target URL for backend WebSocket server |
| `PORT` | Server | `5000` | HTTP/Socket.IO port assigned by cloud host |
| `SOCKET_PORT` | Server | `${PORT}` | Explicit Socket.IO binding port |
| `ROOM_SECRET_PASSWORD` | Server | `doodlelobby-secret` | Shared secret passcode for lobby access |
| `ROOM_IDLE_TIMEOUT` | Server | `120` | Inactivity countdown (seconds) before destroying empty rooms |

---

## 📄 License
This project is licensed under the MIT License.
