# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Testing infrastructure with Jest and Playwright
  - Jest configuration (`jest.config.ts`) with ts-jest preset
  - Playwright E2E testing configuration (`playwright.config.ts`)
  - Unit tests for utility functions (`tests/utils.test.ts`)
  - API endpoint tests (`tests/api.test.ts`)
  - Component tests (`tests/components.test.ts`)
  - E2E smoke tests (`tests-e2e/smoke.test.ts`)
- Test coverage reporting with Codecov integration
- New npm scripts: `test:coverage` for coverage reports
- Testing dependencies:
  - `jest`, `ts-jest`, `@types/jest`
  - `@testing-library/react`, `@testing-library/jest-dom`
  - `@playwright/test`
  - `identity-obj-proxy` for CSS module mocking
- CI/CD improvements:
  - Updated test job to run with coverage
  - Added Prisma generation step before tests
  - Added Codecov upload step

### Changed
- Updated `.github/workflows/ci.yml` to run tests with coverage
- Enhanced test job to include Prisma client generation

### Fixed
- Removed `package-lock.json` from repository (now in `.gitignore`)

### Technical
- All tests passing (11 unit tests)
- Lint and type-check passing
- Build successful with no errors

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
