# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take the security of Robot Delivery Simulator seriously. If you discover a security vulnerability, please follow these steps:

### How to Report

1. **DO NOT** open a public issue
2. Email us at: security@robotsimulator.dev
3. Include the following information:
   - Description of the vulnerability
   - Steps to reproduce
   - Affected versions
   - Possible impact
   - Suggested fix (if any)

### What to Expect

- **Acknowledgment**: Within 24 hours
- **Initial Assessment**: Within 72 hours
- **Status Updates**: Every 7 days until resolved
- **Resolution**: Depending on severity:
  - Critical: 1-3 days
  - High: 7 days
  - Medium: 14 days
  - Low: 30 days

### Disclosure Policy

- We follow responsible disclosure
- We will credit you (if desired) after the fix is released
- We ask that you do not disclose the vulnerability publicly until a fix is available

## Security Best Practices

When deploying Robot Delivery Simulator:

1. **Environment Variables**
   - Never commit `.env` files
   - Use strong, unique `NEXTAUTH_SECRET`
   - Rotate secrets periodically

2. **Database**
   - Use connection pooling in production
   - Regular backups
   - Restrict database access

3. **Network**
   - Use HTTPS in production
   - Configure CORS properly
   - Use a reverse proxy (nginx)

4. **Authentication**
   - Enforce strong passwords
   - Enable rate limiting
   - Monitor for suspicious activity

## Security Features

This project includes:

- Password hashing with bcrypt
- Session-based authentication with NextAuth.js
- CSRF protection
- Input validation with Zod
- SQL injection prevention via Prisma
- XSS prevention via React
- Security headers (X-Frame-Options, CSP, etc.)

## Security Updates

Security updates are released as patch versions and are announced through:
- GitHub Security Advisories
- Release notes
- Discord announcements

## Contact

- Security Email: security@robotsimulator.dev
- PGP Key: [Download](https://robotsimulator.dev/pgp-key.txt)
