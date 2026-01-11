# 🚀 Izuran Website Deployment Guide

## 📋 Overview

This guide covers deploying the Izuran website to various hosting platforms and environments. The application is a full-stack React/Express application with PostgreSQL database.

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   (React/Vite)  │◄──►│   (Express.js)  │◄──►│   (PostgreSQL)  │
│   Port: 3000    │    │   Port: 3000    │    │   Port: 5432    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🎯 Deployment Options

### 1. **Vercel** (Recommended for Frontend)
- **Pros**: Excellent React support, automatic deployments, global CDN
- **Cons**: Serverless functions limitations for backend

### 2. **Railway** (Recommended for Full-Stack)
- **Pros**: Easy PostgreSQL integration, automatic deployments, reasonable pricing
- **Cons**: Limited free tier

### 3. **Render** (Good Alternative)
- **Pros**: Free tier available, PostgreSQL support, easy setup
- **Cons**: Cold starts on free tier

### 4. **DigitalOcean App Platform**
- **Pros**: Reliable, scalable, managed databases
- **Cons**: More expensive, requires more configuration

### 5. **AWS/GCP/Azure** (Enterprise)
- **Pros**: Highly scalable, full control
- **Cons**: Complex setup, expensive

## 🚀 Quick Deployment (Railway)

### Step 1: Prepare Your Repository

1. **Ensure your repository is ready:**
   ```bash
   git add .
   git commit -m "Prepare for deployment"
   git push origin main
   ```

2. **Verify your `.env` file structure** (don't commit this file):
   ```bash
   # Database Configuration
   DATABASE_URL="postgresql://..."
   
   # JWT & Session Security
   JWT_SECRET="your-secret-key"
   JWT_REFRESH_SECRET="your-refresh-secret"
   SESSION_SECRET="your-session-secret"
   
   # Email Configuration
   SMTP_HOST="smtp.gmail.com"
   SMTP_PORT="587"
   SMTP_USER="your-email@gmail.com"
   SMTP_PASS="your-app-password"
   
   # QR Code Security
   QR_SECRET_KEY="your-qr-secret"
   
   # Payment Configuration
   PAYPAL_CLIENT_ID="your-paypal-client-id"
   PAYPAL_CLIENT_SECRET="your-paypal-client-secret"
   
   # Google OAuth
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"
   
   # Firebase Configuration
   VITE_FIREBASE_API_KEY="your-firebase-api-key"
   VITE_FIREBASE_PROJECT_ID="your-firebase-project-id"
   VITE_FIREBASE_APP_ID="your-firebase-app-id"
   ```

### Step 2: Deploy to Railway

1. **Visit [Railway.app](https://railway.app)**
2. **Sign up/Login** with your GitHub account
3. **Create New Project** → "Deploy from GitHub repo"
4. **Select your repository**
5. **Add PostgreSQL Database:**
   - Click "New" → "Database" → "PostgreSQL"
   - Railway will automatically set `DATABASE_URL`

6. **Configure Environment Variables:**
   - Go to your app's "Variables" tab
   - Add all environment variables from your `.env` file
   - **Important**: Update `DATABASE_URL` with Railway's provided URL

7. **Deploy:**
   - Railway will automatically detect your Node.js app
   - It will run `npm install` and `npm run build`
   - The app will be available at `https://your-app-name.railway.app`

### Step 3: Database Setup

1. **Access Railway PostgreSQL:**
   - Go to your PostgreSQL service in Railway
   - Click "Connect" → "PostgreSQL"
   - Use the connection details to connect via psql or a GUI tool

2. **Run Database Migrations:**
   ```bash
   # Connect to your Railway database
   psql "postgresql://username:password@host:port/database"
   
   # Or use Railway CLI
   railway run npm run db:push
   ```

3. **Seed Initial Data:**
   ```bash
   railway run npm run db:seed
   ```

4. **Setup Session Table:**
   ```bash
   railway run npx tsx db/setup-session.ts
   ```

## 🌐 Vercel Deployment (Frontend Only)

### Step 1: Prepare for Vercel

1. **Create `vercel.json` in your project root:**
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "server/index.ts",
         "use": "@vercel/node"
       }
     ],
     "routes": [
       {
         "src": "/api/(.*)",
         "dest": "server/index.ts"
       },
       {
         "src": "/(.*)",
         "dest": "server/index.ts"
       }
     ]
   }
   ```

2. **Update your `package.json` scripts:**
   ```json
   {
     "scripts": {
       "vercel-build": "npm run build",
       "start": "node dist/index.js"
     }
   }
   ```

### Step 2: Deploy to Vercel

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Deploy:**
   ```bash
   vercel
   ```

3. **Configure Environment Variables:**
   - Go to your Vercel dashboard
   - Navigate to your project → Settings → Environment Variables
   - Add all your environment variables

## 🐳 Docker Deployment

### Step 1: Create Dockerfile

```dockerfile
# Use Node.js 18 Alpine
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
RUN npm ci --only=production

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the application
RUN npm run build

# Production image, copy all the files and run the app
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["npm", "start"]
```

### Step 2: Create Docker Compose

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - JWT_SECRET=${JWT_SECRET}
      - SESSION_SECRET=${SESSION_SECRET}
      - SMTP_HOST=${SMTP_HOST}
      - SMTP_PORT=${SMTP_PORT}
      - SMTP_USER=${SMTP_USER}
      - SMTP_PASS=${SMTP_PASS}
      - QR_SECRET_KEY=${QR_SECRET_KEY}
      - PAYPAL_CLIENT_ID=${PAYPAL_CLIENT_ID}
      - PAYPAL_CLIENT_SECRET=${PAYPAL_CLIENT_SECRET}
      - GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
      - GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}
      - VITE_FIREBASE_API_KEY=${VITE_FIREBASE_API_KEY}
      - VITE_FIREBASE_PROJECT_ID=${VITE_FIREBASE_PROJECT_ID}
      - VITE_FIREBASE_APP_ID=${VITE_FIREBASE_APP_ID}
    depends_on:
      - db

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=izuran_db
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres_data:
```

### Step 3: Deploy with Docker

```bash
# Build and run
docker-compose up -d

# Run database migrations
docker-compose exec app npm run db:push

# Seed data
docker-compose exec app npm run db:seed
```

## 🔧 Environment-Specific Configurations

### Development Environment

```bash
# .env.development
NODE_ENV=development
DATABASE_URL="postgresql://localhost:5432/izuran_dev"
JWT_SECRET="dev-secret-key"
SESSION_SECRET="dev-session-secret"
SMTP_HOST="smtp.mailtrap.io"
SMTP_PORT="2525"
SMTP_USER="your-mailtrap-user"
SMTP_PASS="your-mailtrap-pass"
```

### Staging Environment

```bash
# .env.staging
NODE_ENV=staging
DATABASE_URL="postgresql://staging-db-url"
JWT_SECRET="staging-secret-key"
SESSION_SECRET="staging-session-secret"
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-staging-email@gmail.com"
SMTP_PASS="your-staging-app-password"
```

### Production Environment

```bash
# .env.production
NODE_ENV=production
DATABASE_URL="postgresql://production-db-url"
JWT_SECRET="production-secret-key"
SESSION_SECRET="production-session-secret"
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-production-email@gmail.com"
SMTP_PASS="your-production-app-password"
```

## 🔒 Security Checklist

### Before Deployment

- [ ] **Environment Variables**: All secrets are properly set
- [ ] **Database**: Production database is secured
- [ ] **HTTPS**: SSL certificate is configured
- [ ] **CORS**: Cross-origin requests are properly configured
- [ ] **Rate Limiting**: API rate limits are enabled
- [ ] **Input Validation**: All inputs are validated
- [ ] **SQL Injection**: Database queries are parameterized
- [ ] **XSS Protection**: Content Security Policy is set
- [ ] **CSRF Protection**: CSRF tokens are implemented

### Post-Deployment

- [ ] **Health Check**: `/api/health` endpoint is working
- [ ] **Database Connection**: Database is accessible
- [ ] **Email**: Email sending is working
- [ ] **Payments**: Payment gateways are configured
- [ ] **Authentication**: Login/register is working
- [ ] **File Uploads**: File uploads are working
- [ ] **Admin Panel**: Admin access is working

## 📊 Monitoring & Logging

### Application Monitoring

1. **Health Checks:**
   ```bash
   # Test health endpoint
   curl https://your-domain.com/api/health
   ```

2. **Database Monitoring:**
   ```bash
   # Test database connection
   curl https://your-domain.com/api/test/db
   ```

3. **Error Logging:**
   - Set up error tracking (Sentry, LogRocket)
   - Monitor application logs
   - Set up alerts for critical errors

### Performance Monitoring

1. **Frontend Performance:**
   - Lighthouse scores
   - Core Web Vitals
   - Bundle size analysis

2. **Backend Performance:**
   - API response times
   - Database query performance
   - Memory usage

## 🔄 CI/CD Pipeline

### GitHub Actions Example

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm test
    
    - name: Build application
      run: npm run build
    
    - name: Deploy to Railway
      uses: bervProject/railway-deploy@v1.0.0
      with:
        railway_token: ${{ secrets.RAILWAY_TOKEN }}
        service: ${{ secrets.RAILWAY_SERVICE }}
    
    - name: Run database migrations
      run: |
        railway run npm run db:push
        railway run npm run db:seed
```

## 🚨 Troubleshooting

### Common Deployment Issues

#### 1. **Build Failures**
```bash
# Check build logs
npm run build

# Verify dependencies
npm ci

# Check TypeScript errors
npm run check
```

#### 2. **Database Connection Issues**
```bash
# Test database connection
npx tsx test-db.ts

# Check environment variables
echo $DATABASE_URL

# Verify database is accessible
psql $DATABASE_URL -c "SELECT NOW();"
```

#### 3. **Environment Variable Issues**
```bash
# Check if all required variables are set
node -e "console.log(process.env.DATABASE_URL ? 'DB OK' : 'DB MISSING')"
node -e "console.log(process.env.JWT_SECRET ? 'JWT OK' : 'JWT MISSING')"
```

#### 4. **Port Issues**
```bash
# Check if port is available
lsof -i :3000

# Use different port
PORT=3001 npm start
```

#### 5. **Memory Issues**
```bash
# Increase Node.js memory limit
NODE_OPTIONS="--max-old-space-size=4096" npm start
```

### Performance Optimization

#### 1. **Database Optimization**
```sql
-- Create indexes for better performance
CREATE INDEX idx_events_date ON events(date);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_orders_user_id ON orders(user_id);
```

#### 2. **Caching Strategy**
```javascript
// Implement Redis caching for frequently accessed data
const redis = require('redis');
const client = redis.createClient();

// Cache artists data
app.get('/api/artists', async (req, res) => {
  const cached = await client.get('artists');
  if (cached) {
    return res.json(JSON.parse(cached));
  }
  
  const artists = await db.select().from(artists);
  await client.setex('artists', 3600, JSON.stringify(artists));
  res.json(artists);
});
```

#### 3. **CDN Configuration**
```javascript
// Serve static files with caching headers
app.use('/uploads', express.static('public/uploads', {
  maxAge: '1d',
  etag: true
}));
```

## 📈 Scaling Considerations

### Horizontal Scaling

1. **Load Balancer**: Use multiple instances behind a load balancer
2. **Database**: Consider read replicas for read-heavy operations
3. **Caching**: Implement Redis for session storage and caching
4. **CDN**: Use CDN for static assets and media files

### Vertical Scaling

1. **Memory**: Increase Node.js memory limit
2. **CPU**: Use more powerful instances
3. **Database**: Upgrade database instance size

## 🔄 Backup & Recovery

### Database Backups

```bash
# Automated backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump $DATABASE_URL > backup_$DATE.sql
gzip backup_$DATE.sql
aws s3 cp backup_$DATE.sql.gz s3://your-backup-bucket/
```

### File Backups

```bash
# Backup uploaded files
tar -czf uploads_backup_$DATE.tar.gz public/uploads/
aws s3 cp uploads_backup_$DATE.tar.gz s3://your-backup-bucket/
```

## 📞 Support & Maintenance

### Regular Maintenance Tasks

1. **Weekly:**
   - Check application logs
   - Monitor database performance
   - Review error rates

2. **Monthly:**
   - Update dependencies
   - Review security patches
   - Backup verification

3. **Quarterly:**
   - Performance audit
   - Security assessment
   - Capacity planning

### Emergency Procedures

1. **Application Down:**
   - Check health endpoints
   - Review recent deployments
   - Rollback if necessary

2. **Database Issues:**
   - Check connection pool
   - Review slow queries
   - Consider failover

3. **Security Breach:**
   - Rotate all secrets
   - Review access logs
   - Update security measures

---

**Remember**: Always test your deployment in a staging environment before going to production. Keep your secrets secure and never commit them to version control.
