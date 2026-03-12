# 🤖 Robot Delivery Simulator

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.0-2D3748?logo=prisma)](https://www.prisma.io/)

A comprehensive 3D robot delivery simulator with Unity WebGL integration, ROS/ROS2 support, and real-time sensor visualization. Perfect for educational purposes, robotics research, and algorithm development.

![Robot Simulator Preview](./docs/images/simulator-preview.png)

## 📖 Documentation

- [English Documentation](./README.en.md) (current)
- [Документация на русском](./README.md)

## ✨ Features

### 🎮 Simulation
- **Unity WebGL Integration** - Embedded 3D simulation environment
- **Real-time Sensor Data** - GPS, Lidar, IMU, Encoders at 10Hz
- **Physics-based Movement** - Realistic robot dynamics
- **Obstacle Detection** - Dynamic collision avoidance testing

### 🗺️ Visualization
- **OpenStreetMap Integration** - Real-world map rendering with Leaflet
- **3D Lidar Point Cloud** - Three.js powered visualization with distance color-coding
- **Real-time Robot Tracking** - Live position and trajectory display
- **Route Planning** - Visual path and waypoint system

### 📦 Delivery Scenarios
- **4 Built-in Missions** - Varying difficulty levels
- **Weather Conditions** - Sun, rain, snow simulation
- **Traffic Patterns** - Low, medium, high traffic
- **Obstacle Complexity** - Configurable obstacle density

### 📊 Analytics
- **Performance Charts** - Speed, battery, distance tracking
- **Session History** - Detailed delivery records
- **Success Rate Metrics** - User performance statistics
- **Collision Tracking** - Safety analysis

### 🔐 Authentication & Management
- **Role-based Access** - Student, Teacher, Admin roles
- **Password Recovery** - Secure reset flow
- **User Management** - Complete admin panel
- **Achievement System** - Gamification for students

### 🔌 Integration
- **WebSocket API** - Real-time data streaming (port 3003)
- **REST API** - Full CRUD operations
- **ROS/ROS2 Ready** - External control system support
- **Algorithm Testing** - Upload and test custom algorithms

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or bun
- SQLite (included)

### Installation

```bash
# Clone the repository
git clone https://github.com/QuadDarv1ne/robot-delivery-simulator.git
cd robot-delivery-simulator

# Install dependencies
npm install

# Setup database
npx prisma generate
npx prisma db push

# Create demo user
npm run seed

# Start development servers
npm run dev
```

### Running the Application

The application consists of two servers:

```bash
# Terminal 1: Main Next.js application (port 3000)
npm run dev

# Terminal 2: WebSocket server for sensor data (port 3003)
npm run websocket
```

Or run both together:

```bash
npm run dev:all
```

### Demo Credentials

- **Email:** demo@test.ru
- **Password:** demo123

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (Next.js 16)                    │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Simulator│  │   Map    │  │3D Lidar  │  │ Analytics│   │
│  │   View   │  │  View    │  │   View   │  │  Panel   │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
├─────────────────────────────────────────────────────────────┤
│                    API Layer (REST + WebSocket)              │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Auth Service │  │ User Service │  │Data Service  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
├─────────────────────────────────────────────────────────────┤
│                    Database (SQLite + Prisma)                │
└─────────────────────────────────────────────────────────────┘
```

## 📁 Project Structure

```
robot-delivery-simulator/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/                # API Routes
│   │   │   ├── admin/          # Admin endpoints
│   │   │   ├── auth/           # Authentication
│   │   │   └── user/           # User management
│   │   ├── page.tsx            # Main page
│   │   └── simulator-content.tsx
│   ├── components/
│   │   ├── ui/                 # shadcn/ui components
│   │   ├── admin-panel.tsx     # Admin dashboard
│   │   ├── analytics-panel.tsx # Analytics charts
│   │   ├── auth-form.tsx       # Login/Register
│   │   ├── delivery-scenarios.tsx
│   │   ├── lidar-3d.tsx        # Three.js visualization
│   │   ├── robot-map.tsx       # Leaflet map
│   │   └── user-profile.tsx
│   └── lib/
│       ├── auth.ts             # NextAuth configuration
│       ├── auth-context.tsx    # Auth provider
│       └── prisma.ts           # Database client
├── prisma/
│   └── schema.prisma           # Database schema
├── mini-services/
│   └── robot-simulator-server/ # WebSocket server
├── public/
│   └── images/
├── docs/
│   └── images/
├── docker/                     # Docker configurations
├── .github/                    # GitHub workflows
└── scripts/                    # Utility scripts
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="file:./dev.db"

# Authentication
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# Optional: External services
ROS_BRIDGE_URL="ws://localhost:9090"
UNITY_WEBGL_URL="http://localhost:8080"
```

### Database Schema

The application uses Prisma with SQLite. Key models:

- **User** - User accounts with roles (student/teacher/admin)
- **UserSession** - Session management
- **DeliveryResult** - Delivery mission records
- **Algorithm** - Custom algorithm storage
- **Achievement** - User achievements

## 🌐 API Reference

### Authentication

```http
POST /api/auth/login
POST /api/auth/register
POST /api/auth/logout
POST /api/auth/forgot-password
POST /api/auth/reset-password
```

### User Management

```http
GET  /api/user/me
PATCH /api/user/profile
```

### Admin Endpoints

```http
GET  /api/admin/stats
GET  /api/admin/users
PATCH /api/admin/users
DELETE /api/admin/users
```

### WebSocket Events

Connect to `ws://localhost:3003`

```javascript
// Received events
'sensor_data'      // GPS, Lidar, IMU, Encoders
'delivery_update'  // Mission progress
'robot_status'     // Battery, speed, state

// Emitted events
'start_mission'    // Begin delivery
'stop_mission'     // End current mission
'update_route'     // Modify path
```

## 🐳 Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up -d

# Or build manually
docker build -t robot-simulator .
docker run -p 3000:3000 -p 3003:3003 robot-simulator
```

## ☁️ Cloud Deployment

### Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/QuadDarv1ne/robot-delivery-simulator)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Railway

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/robot-simulator)

### Self-hosted

See [deployment guide](./docs/deployment.md) for detailed instructions.

## 🧪 Testing

```bash
# Run unit tests
npm run test

# Run e2e tests
npm run test:e2e

# Run with coverage
npm run test:coverage
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - React Framework
- [Three.js](https://threejs.org/) - 3D Graphics
- [Leaflet](https://leafletjs.com/) - Maps
- [shadcn/ui](https://ui.shadcn.com/) - UI Components
- [Prisma](https://www.prisma.io/) - Database ORM
- [ROS](https://www.ros.org/) - Robot Operating System

## 📞 Support

- 📧 Email: support@robotsimulator.dev
- 💬 Discord: [Join our community](https://discord.gg/robotsimulator)
- 📖 Documentation: [docs.robotsimulator.dev](https://docs.robotsimulator.dev)
- 🐛 Issues: [GitHub Issues](https://github.com/QuadDarv1ne/robot-delivery-simulator/issues)

## 🗺️ Roadmap

- [ ] Unity WebGL full integration
- [ ] ROS2 bridge support
- [ ] Multi-robot simulation
- [ ] Custom scenario editor
- [ ] Leaderboard system
- [ ] Mobile companion app
- [ ] AI-powered obstacle avoidance tutorials

---

Made with ❤️ by the Robot Simulator Team
