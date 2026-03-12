# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Unity WebGL integration placeholder
- OpenStreetMap integration with Leaflet
- 3D Lidar visualization with Three.js
- Delivery scenarios system (4 missions)
- Analytics panel with charts
- Student authorization system
- Password recovery functionality
- Admin panel with user management
- WebSocket server for real-time sensor data
- REST API endpoints
- Database models with Prisma

## [1.0.0] - 2024-01-01

### Added
- Initial release
- Basic robot simulation interface
- GPS, Lidar, IMU, Encoder sensor panels
- Real-time data visualization
- User authentication with NextAuth.js
- Role-based access control (student/teacher/admin)
- SQLite database with Prisma ORM
- Docker support
- Vercel/Netlify deployment configurations

### Security
- Password hashing with bcrypt
- Session-based authentication
- CSRF protection
- Input validation

[Unreleased]: https://github.com/QuadDarv1ne/robot-delivery-simulator/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/QuadDarv1ne/robot-delivery-simulator/releases/tag/v1.0.0
