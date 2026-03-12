# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Health check script (`scripts/health-check.js`)
- npm scripts: `validate`, `clean`, `healthcheck`
- GitHub Pages workflow for documentation
- Russian issue templates
- Projects configuration guide
- TODO.md with project roadmap

### Changed
- Updated CI/CD workflow to use `dev` branch instead of `develop`
- Added `--legacy-peer-deps` to CI installation
- README made Russian by default (English moved to `README.en.md`)

### Fixed
- TypeScript errors in core modules:
  - `src/lib/auth.ts` - Added proper type extensions for NextAuth
  - `src/lib/auth-context.tsx` - Added missing user properties
  - `src/app/api/leaderboard/route.ts` - Added LeaderboardUser interface
  - `src/app/api/reports/export/route.ts` - Fixed variable scoping and types
  - `src/app/simulator-content.tsx` - Fixed useEffect cleanup
  - `src/components/analytics-panel.tsx` - Fixed icon and color types
  - `src/components/user-profile.tsx` - Fixed undefined checks
- ESLint configuration for Next.js 16

### Removed
- Old README.ru.md (merged into README.md)

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
