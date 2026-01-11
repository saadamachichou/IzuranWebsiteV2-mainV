# 🎵 Izuran Official Website - Complete Setup & Documentation

## 📋 Project Overview

**Izuran** is a comprehensive music platform website built with modern web technologies. It serves as an official website for a music label/collective featuring artists, events, podcasts, e-commerce, and ticketing systems.

### 🏗️ Architecture
- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Express.js + TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Passport.js + JWT + Google OAuth
- **Styling**: Tailwind CSS + Radix UI + Shadcn/ui
- **Payment**: PayPal + Stripe integration
- **File Storage**: Firebase Storage
- **Email**: Nodemailer with SMTP

### 🎯 Core Features
- **Artist Management**: Artist profiles, bios, social links
- **Event Management**: Event creation, ticketing, QR code validation
- **E-commerce**: Product catalog, shopping cart, payment processing
- **Podcast Platform**: Audio streaming, artist podcasts
- **Content Management**: Articles, gallery, knowledge base
- **User System**: Authentication, profiles, favorites
- **Admin Dashboard**: Complete backend management interface
- **Ticketing System**: Event tickets with QR codes and validation

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ 
- **PostgreSQL** database (local or cloud)
- **Git** for version control
- **npm** or **yarn** package manager

### 1. Clone & Install
```bash
git clone <repository-url>
cd IzuranWebsite
npm install
```

### 2. Environment Setup
Create a `.env` file in the project root:

```bash
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/izuran_db"

# JWT & Session Security
JWT_SECRET="your-super-secret-jwt-key-2024"
JWT_REFRESH_SECRET="your-jwt-refresh-secret-2024"
SESSION_SECRET="your-session-secret-key-2024"

# Email Configuration (Required for notifications)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"

# QR Code Security (Required for ticketing)
QR_SECRET_KEY="your-qr-code-secret-key-2024"

# PayPal Configuration
PAYPAL_CLIENT_ID="your-paypal-client-id"
PAYPAL_CLIENT_SECRET="your-paypal-client-secret"

# Stripe Configuration
STRIPE_SECRET_KEY="sk_test_your_stripe_secret_key"
STRIPE_PUBLISHABLE_KEY="pk_test_your_stripe_publishable_key"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Firebase Configuration
VITE_FIREBASE_API_KEY="your-firebase-api-key"
VITE_FIREBASE_PROJECT_ID="your-firebase-project-id"
VITE_FIREBASE_APP_ID="your-firebase-app-id"

# CMI Payment Gateway (if using)
CMI_MERCHANT_ID="your-cmi-merchant-id"
CMI_SECRET_KEY="your-cmi-secret-key"

# Resend Email Service (alternative to SMTP)
RESEND_API_KEY="your-resend-api-key"
```

### 3. Database Setup
```bash
# Push database schema
npm run db:push

# Seed initial data
npm run db:seed

# Setup session table
npx tsx db/setup-session.ts
```

### 4. Start Development Server
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## 📁 Project Structure

```
IzuranWebsite/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── context/       # React contexts
│   │   ├── hooks/         # Custom hooks
│   │   ├── lib/           # Utilities and configurations
│   │   ├── types/         # TypeScript type definitions
│   │   └── assets/        # Static assets
│   ├── public/            # Public assets
│   └── index.html         # HTML template
├── server/                # Express backend
│   ├── routes.ts          # API route definitions
│   ├── auth.ts            # Authentication logic
│   ├── paypal.ts          # PayPal integration
│   ├── jwt.ts             # JWT utilities
│   ├── storage.ts         # File storage utilities
│   └── services/          # Business logic services
├── shared/                # Shared code between client/server
│   └── schema.ts          # Database schema definitions
├── db/                    # Database utilities
│   ├── index.ts           # Database connection
│   ├── seed.ts            # Database seeding
│   └── migrations/        # Database migrations
├── public/                # Static file storage
├── attached_assets/       # Project assets
└── dist/                  # Build output
```

## 🗄️ Database Schema

### Core Entities
- **Users**: Authentication, roles, profiles
- **Artists**: Music artists with social links
- **Events**: Event management with ticketing
- **Products**: E-commerce product catalog
- **Podcasts**: Audio content management
- **Articles**: Blog/content management
- **Orders**: E-commerce order tracking
- **Tickets**: Event ticketing system

### Key Relationships
- Users can have multiple orders and tickets
- Events can have multiple ticket types and limits
- Products can be associated with artists
- Podcasts are linked to artists

## 🔐 Authentication System

### Supported Methods
1. **Local Authentication**: Username/password
2. **Google OAuth**: Social login
3. **JWT Tokens**: Stateless authentication
4. **Session Management**: Express sessions with PostgreSQL

### User Roles
- **User**: Basic access, can purchase tickets/products
- **Artist**: Enhanced profile, can manage own content
- **Admin**: Full system access, content management

## 🛒 E-commerce Features

### Product Management
- Physical and digital products
- Inventory tracking
- Category organization
- Artist associations

### Payment Processing
- **PayPal**: Direct integration
- **Stripe**: Credit card processing
- **CMI**: Local payment gateway
- **COD**: Cash on delivery

### Order Management
- Order tracking
- Delivery personnel management
- Status updates
- Customer notifications

## 🎟️ Ticketing System

### Features
- **Multi-tier Pricing**: Early bird, regular, VIP tickets
- **QR Code Generation**: Encrypted ticket validation
- **Email Delivery**: Automatic ticket emails
- **Admin Scanner**: QR code validation interface
- **Ticket Limits**: Availability management

### Setup Process
1. Create event ticket limits via admin API
2. Configure pricing tiers
3. Set maximum ticket quantities
4. Enable ticket sales

### Security Features
- Encrypted QR codes
- Unique ticket identifiers
- Validation logging
- Prevention of double usage

## 📧 Email System

### Configuration
- **SMTP**: Gmail, Outlook, custom providers
- **Resend**: Alternative email service
- **Templates**: Customizable email templates

### Email Types
- Ticket confirmations
- Order notifications
- Password resets
- Welcome emails

## 🎨 UI/UX Features

### Design System
- **Tailwind CSS**: Utility-first styling
- **Radix UI**: Accessible component primitives
- **Shadcn/ui**: Pre-built component library
- **Custom Theme**: Izuran brand colors and fonts

### Responsive Design
- Mobile-first approach
- Tablet and desktop optimization
- Touch-friendly interfaces

### Animations
- Framer Motion integration
- Smooth page transitions
- Loading states
- Interactive feedback

## 🔧 Development Workflow

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run check        # TypeScript type checking
npm run db:push      # Push database schema
npm run db:seed      # Seed database with initial data
```

### Code Quality
- **TypeScript**: Strict type checking
- **ESLint**: Code linting
- **Prettier**: Code formatting
- **Path Aliases**: Clean imports

## 🚀 Deployment

### Production Build
```bash
npm run build
```

### Environment Variables
Ensure all production environment variables are set:
- Database connection string
- JWT secrets
- Payment gateway credentials
- Email configuration
- Firebase credentials

### Server Requirements
- **Node.js** 18+
- **PostgreSQL** database
- **HTTPS** certificate
- **Environment variables** configured

## 📊 Admin Dashboard

### Available Sections
- **Dashboard**: Overview and analytics
- **Artists**: Artist management
- **Events**: Event and ticketing management
- **Products**: E-commerce management
- **Podcasts**: Audio content management
- **Articles**: Content management
- **Users**: User management
- **Orders**: Order tracking
- **Gallery**: Media management
- **Contact**: Message management

### Access Control
- Role-based permissions
- Secure admin routes
- Audit logging
- Session management

## 🔍 API Documentation

### Authentication Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout
- `GET /api/auth/profile` - Get user profile

### Public Endpoints
- `GET /api/artists` - List artists
- `GET /api/events` - List events
- `GET /api/products` - List products
- `GET /api/podcasts` - List podcasts

### Admin Endpoints
- `POST /api/admin/artists` - Create artist
- `PUT /api/admin/artists/:id` - Update artist
- `DELETE /api/admin/artists/:id` - Delete artist
- Similar patterns for events, products, etc.

### Ticketing Endpoints
- `GET /api/events/:id/tickets` - Get available tickets
- `POST /api/tickets/purchase` - Purchase tickets
- `GET /api/tickets/my-tickets` - User's tickets
- `POST /api/tickets/validate` - Validate QR codes

## 🛠️ Troubleshooting

### Common Issues

#### Database Connection
```bash
# Check database connection
npx tsx test-db.ts

# Reset database
npm run db:push --force
```

#### Email Configuration
- Verify SMTP credentials
- Check 2FA settings for Gmail
- Test email sending manually

#### Payment Integration
- Verify API credentials
- Check webhook configurations
- Test in sandbox mode first

#### Authentication Issues
- Clear browser cookies
- Check JWT secret configuration
- Verify session settings

### Debug Mode
```bash
# Enable debug logging
DEBUG=* npm run dev
```

## 📈 Performance Optimization

### Frontend
- Code splitting with lazy loading
- Image optimization
- Bundle size monitoring
- Caching strategies

### Backend
- Database query optimization
- Connection pooling
- Rate limiting
- Caching layers

### Database
- Index optimization
- Query performance monitoring
- Regular maintenance

## 🔒 Security Considerations

### Data Protection
- Input validation
- SQL injection prevention
- XSS protection
- CSRF protection

### Authentication Security
- Secure password hashing
- JWT token expiration
- Session security
- Rate limiting

### Payment Security
- PCI compliance
- Secure payment processing
- Transaction logging
- Fraud detection

## 📝 Contributing

### Development Guidelines
1. Follow TypeScript best practices
2. Use consistent code formatting
3. Write meaningful commit messages
4. Test changes thoroughly
5. Update documentation

### Code Review Process
1. Create feature branch
2. Implement changes
3. Write tests
4. Submit pull request
5. Code review and approval

## 📞 Support & Maintenance

### Regular Maintenance
- Database backups
- Security updates
- Performance monitoring
- Error logging

### Monitoring
- Application health checks
- Error tracking
- Performance metrics
- User analytics

## 🎉 Getting Started Checklist

- [ ] Clone repository
- [ ] Install dependencies
- [ ] Configure environment variables
- [ ] Set up database
- [ ] Run database migrations
- [ ] Seed initial data
- [ ] Start development server
- [ ] Test authentication
- [ ] Verify email configuration
- [ ] Test payment integration
- [ ] Configure admin user
- [ ] Test ticketing system

## 📚 Additional Resources

- [TICKETING_SETUP.md](./TICKETING_SETUP.md) - Detailed ticketing setup guide
- [API Documentation](./docs/api.md) - Complete API reference
- [Database Schema](./shared/schema.ts) - Database structure
- [Component Library](./client/src/components) - UI components

---

**Izuran Website** - A complete music platform solution built with modern web technologies.

*For technical support or questions, please refer to the troubleshooting section or contact the development team.*
