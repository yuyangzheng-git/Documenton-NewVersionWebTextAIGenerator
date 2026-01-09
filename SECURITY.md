# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in this project, please report it responsibly.

### How to Report

Please send an email to: [security@example.com](mailto:security@example.com)

Include the following information:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if known)

### What to Expect

- We will acknowledge receipt of your report within 48 hours
- We will provide a detailed response within 7 days
- We will work with you to understand and resolve the issue
- We will notify you when the issue is fixed
- We will credit you for the discovery (unless you prefer anonymity)

### Security Best Practices

When using this project:

1. **Never commit sensitive data**
   - API keys should be stored in environment variables
   - Use `.env.local` for local development
   - Never commit `.env` files

2. **Keep dependencies updated**
   ```bash
   npm audit
   npm update
   ```

3. **Use HTTPS** in production

4. **Validate all user inputs**

5. **Keep your API keys secure**
   - Rotate them regularly
   - Use different keys for different environments
   - Monitor usage

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.x.x   | ✅        |
| < 1.0   | ❌        |

## Security Advisories

For a list of security advisories, please visit:
https://github.com/yuyangzheng-git/Documenton-NewVersionWebTextAIGenerator/security/advisories
