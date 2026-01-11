# 🔌 Izuran Website API Documentation

## 📋 Overview

This document provides comprehensive API documentation for the Izuran website backend. All endpoints are prefixed with `/api` and return JSON responses.

**Base URL**: `http://localhost:3000/api` (development)

## 🔐 Authentication

### Authentication Methods
- **Session-based**: Uses Express sessions with PostgreSQL store
- **JWT Tokens**: For stateless authentication (Access token valid for 15 minutes, refresh token for 7 days)
- **Google OAuth**: Social login integration via Firebase

### Headers
```http
Content-Type: application/json
Authorization: Bearer <jwt-token>  # For protected routes
Cookie: connect.sid=<session-id>   # For session-based auth
Cookie: accessToken=<jwt-token>    # For JWT auth
Cookie: refreshToken=<refresh-token> # For token refresh
```

## 👤 Authentication Endpoints

### Register
```http
POST /api/auth/register
```

**Request Body:**
```json
{
  "username": "newuser",
  "email": "newuser@example.com",
  "password": "password123",
  "confirmPassword": "password123",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response:**
```json
{
  "message": "Registration successful",
  "user": {
    "id": 1,
    "username": "newuser",
    "email": "newuser@example.com",
    "role": "user",
    "firstName": "John",
    "lastName": "Doe",
    "createdAt": "2024-01-01T00:00:00Z"
  },
  "accessToken": "jwt-token-here"
}
```

### Login
```http
POST /api/auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "user": {
    "id": 1,
    "username": "user@example.com",
    "email": "user@example.com",
    "role": "user",
    "firstName": "John",
    "lastName": "Doe",
    "profilePictureUrl": "https://example.com/avatar.jpg"
  },
  "accessToken": "jwt-token-here"
}
```

### Logout
```http
POST /api/auth/logout
```

**Requires Authentication**

**Response:**
```json
{
  "message": "Logout successful"
}
```

### Get Current User
```http
GET /api/auth/me
```

**Response:**
```json
{
  "user": {
    "id": 1,
    "username": "user@example.com",
    "email": "user@example.com",
    "role": "user",
    "firstName": "John",
    "lastName": "Doe",
    "profilePictureUrl": "https://example.com/avatar.jpg"
  }
}
```

### Refresh Access Token
```http
POST /api/auth/refresh-token
```

**Description**: Generates a new access token using the refresh token stored in cookies.

**Response:**
```json
{
  "accessToken": "new-jwt-token-here"
}
```

### Google OAuth
```http
POST /api/auth/google
```

**Request Body:**
```json
{
  "providerId": "google-provider-id",
  "email": "user@gmail.com",
  "username": "user",
  "firstName": "John",
  "lastName": "Doe",
  "profilePictureUrl": "https://lh3.googleusercontent.com/...",
  "accessToken": "google-access-token"
}
```

**Response:**
```json
{
  "message": "Google authentication successful",
  "user": {
    "id": 1,
    "username": "user",
    "email": "user@gmail.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "user",
    "profilePictureUrl": "https://lh3.googleusercontent.com/...",
    "authProvider": "google"
  },
  "accessToken": "jwt-token-here"
}
```

### Upload Profile Picture
```http
POST /api/auth/profile-picture
```

**Requires Authentication**

**Content-Type**: `multipart/form-data`

**Request Body:**
```
profilePicture: [image file]
```

**Response:**
```json
{
  "profilePictureUrl": "/uploads/profile_pictures/user-1-1234567890.jpg"
}
```

### Change Password
```http
POST /api/auth/change-password
```

**Requires Authentication**

**Request Body:**
```json
{
  "currentPassword": "oldPassword123",
  "newPassword": "newPassword123",
  "confirmNewPassword": "newPassword123"
}
```

**Response:**
```json
{
  "message": "Password updated successfully"
}
```

## 🎵 Artists Endpoints

### Get All Artists
```http
GET /api/artists
```

**Query Parameters:**
- `limit`: Number of artists to return (default: 10)
- `offset`: Number of artists to skip (default: 0)
- `search`: Search term for artist name

**Response:**
```json
[
  {
    "id": 1,
    "name": "Artist Name",
    "slug": "artist-name",
    "description": "Artist description",
    "image_Url": "https://example.com/artist.jpg",
    "instagram": "https://instagram.com/artist",
    "soundcloud": "https://soundcloud.com/artist",
    "bandcamp": "https://artist.bandcamp.com",
    "linktree": "https://linktr.ee/artist",
    "facebook": "https://facebook.com/artist",
    "displayOrder": 1,
    "createdAt": "2024-01-01T00:00:00Z"
  }
]
```

### Get Artist by Slug
```http
GET /api/artists/:slug
```

**Response:**
Same as single artist object above.

### Create Artist (Admin)
```http
POST /api/artists
```

**Requires Admin Role**

**Request Body:**
```json
{
  "name": "New Artist",
  "description": "Artist description",
  "image_Url": "https://example.com/image.jpg",
  "instagram": "https://instagram.com/artist",
  "soundcloud": "https://soundcloud.com/artist",
  "bandcamp": "https://artist.bandcamp.com",
  "linktree": "https://linktr.ee/artist",
  "facebook": "https://facebook.com/artist",
  "displayOrder": 1
}
```

### Update Artist (Admin)
```http
PUT /api/artists/:id
```

**Requires Admin Role**

**Request Body:** Same as Create Artist

### Delete Artist (Admin)
```http
DELETE /api/admin/artists/:id
```

**Requires Admin Role**

### Get All Artists (Admin)
```http
GET /api/admin/artists
```

**Requires Admin Role**

### Get Artists Direct (Admin)
```http
GET /api/admin/artists/direct
```

**Requires Admin Role** - Returns raw database results without transformations.

### Get Artist Test (Admin)
```http
GET /api/admin/artists/test/:id
```

**Requires Admin Role** - Test endpoint for debugging artist data.

### Reorder Artists (Admin)
```http
PUT /api/admin/artists/reorder
```

**Requires Admin Role**

**Request Body:**
```json
{
  "artistIds": [3, 1, 2, 4]
}
```

### Upload Artist Image (Admin)
```http
POST /api/admin/artists/upload-image
```

**Requires Admin Role**

**Content-Type**: `multipart/form-data`

**Request Body:**
```
image: [image file]
```

**Response:**
```json
{
  "imageUrl": "/uploads/event_images/filename.jpg"
}
```

## 🎪 Events Endpoints

### Get All Events
```http
GET /api/events
```

**Query Parameters:**
- `status`: Filter by status (upcoming, past, featured)
- `limit`: Number of events to return
- `offset`: Number of events to skip

**Response:**
```json
[
  {
    "id": 1,
    "name": "Event Name",
    "slug": "event-name",
    "description": "Event description",
    "imageUrl": "https://example.com/event.jpg",
    "date": "2024-12-31T23:59:59Z",
    "endDate": "2025-01-01T02:00:00Z",
    "location": "Venue Name",
    "lineup": "Artist 1, Artist 2, Artist 3",
    "displayDate": "December 31, 2024",
    "status": "upcoming",
    "featured": true,
    "ticketPrice": "150.00",
    "earlyBirdPrice": "120.00",
    "earlyBirdEndDate": "2024-11-30T23:59:59Z",
    "secondPhasePrice": "140.00",
    "secondPhaseEndDate": "2024-12-15T23:59:59Z",
    "lastPhasePrice": "160.00"
  }
]
```

### Get Upcoming Events
```http
GET /api/events/upcoming
```

Returns only events with status "upcoming".

### Get Featured Events
```http
GET /api/events/featured
```

Returns only events marked as featured.

### Get Past Events
```http
GET /api/events/past
```

Returns only events with status "past".

### Get Event by Slug
```http
GET /api/events/:slug
```

### Get Event by ID (Admin)
```http
GET /api/admin/events/:id
```

**Requires Admin Role**

### Create Event (Admin)
```http
POST /api/admin/events
```

**Requires Admin Role**

**Request Body:**
```json
{
  "name": "New Event",
  "description": "Event description",
  "imageUrl": "https://example.com/event.jpg",
  "date": "2024-12-31T23:59:59Z",
  "endDate": "2025-01-01T02:00:00Z",
  "location": "Venue Name",
  "lineup": "Artist 1, Artist 2",
  "displayDate": "December 31, 2024",
  "status": "upcoming",
  "featured": false,
  "ticketPrice": "150.00",
  "earlyBirdPrice": "120.00",
  "earlyBirdEndDate": "2024-11-30T23:59:59Z",
  "secondPhasePrice": "140.00",
  "secondPhaseEndDate": "2024-12-15T23:59:59Z",
  "lastPhasePrice": "160.00"
}
```

### Update Event (Admin)
```http
PUT /api/admin/events/:id
```

**Requires Admin Role**

### Delete Event (Admin)
```http
DELETE /api/admin/events/:id
```

**Requires Admin Role**

### Update Event Statuses (Admin)
```http
POST /api/admin/events/update-statuses
```

**Requires Admin Role** - Automatically updates event statuses based on dates.

### Upload Event Image (Admin)
```http
POST /api/admin/events/upload-image
```

**Requires Admin Role**

**Content-Type**: `multipart/form-data`

**Request Body:**
```
image: [image file]
```

## 🎟️ Ticketing Endpoints

### Get Available Tickets for Event
```http
GET /api/events/:eventId/tickets
```

**Response:**
```json
{
  "event": {
    "id": 1,
    "name": "Event Name",
    "date": "2024-12-31T23:59:59Z"
  },
  "ticketTypes": [
    {
      "id": 1,
      "ticketType": "early_bird",
      "maxTickets": 50,
      "soldTickets": 25,
      "availableTickets": 25,
      "price": "120.00",
      "currency": "USD",
      "isActive": true
    }
  ]
}
```

### Purchase Tickets
```http
POST /api/tickets/purchase
```

**Requires Authentication**

**Request Body:**
```json
{
  "eventId": 1,
  "ticketType": "early_bird",
  "quantity": 2,
  "attendeeName": "John Doe",
  "attendeeEmail": "john@example.com",
  "attendeePhone": "+1234567890",
  "paymentMethod": "paypal"
}
```

**Response:**
```json
{
  "success": true,
  "orderId": 123,
  "tickets": [
    {
      "id": 1,
      "ticketId": "TKT-2024-001",
      "qrCodeData": "encrypted-qr-data",
      "attendeeName": "John Doe",
      "attendeeEmail": "john@example.com",
      "price": "120.00"
    }
  ],
  "paymentUrl": "https://paypal.com/checkout/..."
}
```

### Get User's Tickets
```http
GET /api/tickets/my-tickets
```

**Requires Authentication**

**Response:**
```json
[
  {
    "id": 1,
    "ticketId": "TKT-2024-001",
    "event": {
      "id": 1,
      "name": "Event Name",
      "date": "2024-12-31T23:59:59Z",
      "location": "Venue Name"
    },
    "ticketType": "early_bird",
    "status": "active",
    "price": "120.00",
    "attendeeName": "John Doe",
    "attendeeEmail": "john@example.com",
    "qrCodeData": "encrypted-qr-data",
    "createdAt": "2024-01-01T00:00:00Z"
  }
]
```

### Generate QR Code for Ticket
```http
GET /api/tickets/:ticketId/qr-code
```

**Requires Authentication**

**Response:**
```json
{
  "qrCodeData": "encrypted-qr-data",
  "qrCodeImage": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
}
```

### Validate Ticket QR Code
```http
POST /api/tickets/validate
```

**Request Body:**
```json
{
  "qrCodeData": "encrypted-qr-data",
  "scannerName": "Admin User"
}
```

**Response:**
```json
{
  "valid": true,
  "ticket": {
    "id": 1,
    "ticketId": "TKT-2024-001",
    "attendeeName": "John Doe",
    "attendeeEmail": "john@example.com",
    "status": "active",
    "event": {
      "name": "Event Name",
      "date": "2024-12-31T23:59:59Z"
    }
  }
}
```

### Mark Ticket as Used
```http
POST /api/tickets/:ticketId/use
```

**Request Body:**
```json
{
  "scannerName": "Admin User"
}
```

### Get Event Tickets (Admin)
```http
GET /api/admin/events/:eventId/tickets
```

**Requires Admin Role**

### Create Ticket Limits for Event (Admin)
```http
POST /api/admin/events/:eventId/ticket-limits
```

**Requires Admin Role**

**Request Body:**
```json
{
  "ticketType": "early_bird",
  "maxTickets": 100,
  "price": "120.00",
  "currency": "USD",
  "isActive": true
}
```

### Update Ticket Limits (Admin)
```http
PUT /api/admin/events/:eventId/ticket-limits/:limitId
```

**Requires Admin Role**

## 🛒 Products & E-commerce Endpoints

### Get All Products
```http
GET /api/products
```

**Query Parameters:**
- `category`: Filter by category (vinyl, digital, merch, clothing, accessories, other)
- `productType`: Filter by type (physical, digital)
- `artistName`: Filter by artist
- `search`: Search term
- `limit`: Number of products to return
- `offset`: Number of products to skip

**Response:**
```json
[
  {
    "id": 1,
    "name": "Product Name",
    "slug": "product-name",
    "description": "Product description",
    "imageUrl": "https://example.com/product.jpg",
    "price": "25.00",
    "currency": "USD",
    "category": "vinyl",
    "productType": "physical",
    "artistName": "Artist Name",
    "stockLevel": 10,
    "isNewRelease": true,
    "archived": false,
    "cmiProductId": "cmi-123",
    "paypalProductId": "paypal-456",
    "digitalFileUrl": "https://example.com/download/file.zip"
  }
]
```

### Get Product by Slug
```http
GET /api/products/:slug
```

### Create Product (Admin)
```http
POST /api/products
```

**Requires Admin Role**

**Request Body:**
```json
{
  "name": "New Product",
  "description": "Product description",
  "imageUrl": "https://example.com/product.jpg",
  "price": "25.00",
  "currency": "USD",
  "category": "vinyl",
  "productType": "physical",
  "artistName": "Artist Name",
  "stockLevel": 10,
  "isNewRelease": false,
  "digitalFileUrl": "https://example.com/download/file.zip"
}
```

### Update Product (Admin)
```http
PUT /api/products/:id
```

**Requires Admin Role**

### Delete Product (Admin)
```http
DELETE /api/products/:id
```

**Requires Admin Role**

### Get All Products (Admin)
```http
GET /api/admin/products
```

**Requires Admin Role**

### Get Product by ID (Admin)
```http
GET /api/admin/products/:id
```

**Requires Admin Role**

### Upload Product Image (Admin)
```http
POST /api/admin/products/upload-image
```

**Requires Admin Role**

**Content-Type**: `multipart/form-data`

**Request Body:**
```
image: [image file]
```

## 🛍️ Orders & Payment Endpoints

### Get Order History
```http
GET /api/orders/history
```

**Requires Authentication**

### Get Order Details
```http
GET /api/orders/details
```

**Query Parameters:**
- `orderId`: The order ID to retrieve

### Get Order by ID
```http
GET /api/orders/:id
```

**Requires Authentication**

### Download Digital Product
```http
GET /api/orders/:orderId/products/:productId/download
```

**Requires Authentication** - Downloads digital product file for purchased items.

### Create Order with COD (Cash on Delivery)
```http
POST /api/orders/cod
```

**Requires Authentication**

**Request Body:**
```json
{
  "items": [
    {
      "productId": 1,
      "quantity": 2
    }
  ],
  "customerName": "John Doe",
  "customerEmail": "john@example.com",
  "customerPhone": "+1234567890",
  "shippingAddress": "123 Main St, City, Country",
  "billingAddress": "123 Main St, City, Country",
  "notes": "Please call before delivery"
}
```

### Delete Order (User)
```http
DELETE /api/orders/:orderId
```

**Requires Authentication** - User can cancel their own pending orders.

### Delete Order (Admin)
```http
DELETE /api/admin/orders/:orderId
```

**Requires Admin Role**

### Get COD Orders (Admin)
```http
GET /api/admin/orders/cod
```

**Requires Admin Role** - Get all Cash on Delivery orders.

### Delete COD Order (Admin)
```http
DELETE /api/admin/orders/cod/:orderId
```

**Requires Admin Role**

### Assign Delivery Personnel to Order (Admin)
```http
PUT /api/admin/orders/:orderId/assign-delivery
```

**Requires Admin Role**

**Request Body:**
```json
{
  "deliveryPersonnelId": 1,
  "deliveryScheduledAt": "2024-12-31T10:00:00Z"
}
```

### Add Items to Order
```http
POST /api/orders/:orderId/items
```

**Request Body:**
```json
{
  "productId": 1,
  "quantity": 2
}
```

## 💳 Payment Gateway Endpoints

### PayPal Setup
```http
GET /api/paypal/setup
```

Returns PayPal client ID.

### Create PayPal Order
```http
POST /api/paypal/order
```

**Request Body:**
```json
{
  "items": [
    {
      "name": "Product Name",
      "quantity": 1,
      "price": "25.00"
    }
  ]
}
```

### Capture PayPal Payment
```http
POST /api/paypal/order/:orderID/capture
```

### Create CMI Payment Session
```http
POST /api/payments/cmi/create-session
```

**Request Body:**
```json
{
  "orderId": 123,
  "amount": "50.00",
  "currency": "USD"
}
```

### CMI Payment Callback
```http
POST /api/payments/cmi/callback
```

Webhook endpoint for CMI payment gateway.

### Create PayPal Payment
```http
POST /api/payments/paypal/create-payment
```

### Verify PayPal Payment
```http
POST /api/payments/paypal/verify
```

## 🚚 Delivery Personnel Endpoints

### Get All Delivery Personnel (Admin)
```http
GET /api/admin/delivery-personnel
```

**Requires Admin Role**

**Response:**
```json
[
  {
    "id": 1,
    "name": "Delivery Person Name",
    "phone": "+1234567890",
    "email": "delivery@example.com",
    "isActive": true,
    "vehicleInfo": "Toyota Corolla - ABC123",
    "createdAt": "2024-01-01T00:00:00Z"
  }
]
```

### Create Delivery Personnel (Admin)
```http
POST /api/admin/delivery-personnel
```

**Requires Admin Role**

**Request Body:**
```json
{
  "name": "Delivery Person Name",
  "phone": "+1234567890",
  "email": "delivery@example.com",
  "vehicleInfo": "Toyota Corolla - ABC123",
  "isActive": true
}
```

### Get Delivery Orders (Delivery Personnel)
```http
GET /api/delivery/orders
```

**Requires Authentication** - Returns orders assigned to the authenticated delivery person.

### Update Delivery Order Status (Delivery Personnel)
```http
PUT /api/delivery/orders/:orderId/status
```

**Requires Authentication**

**Request Body:**
```json
{
  "status": "out_for_delivery",
  "deliveryNotes": "Customer not available, will retry tomorrow",
  "cashCollectedAmount": "50.00"
}
```

**Status Options:**
- `out_for_delivery`
- `delivered`
- `delivered_paid`

## 🎧 Podcasts Endpoints

### Get All Podcasts
```http
GET /api/podcasts
```

**Query Parameters:**
- `artistName`: Filter by artist
- `genre`: Filter by genre
- `search`: Search term
- `limit`: Number of podcasts to return
- `offset`: Number of podcasts to skip

**Response:**
```json
[
  {
    "id": 1,
    "title": "Podcast Title",
    "slug": "podcast-title",
    "description": "Podcast description",
    "coverUrl": "https://example.com/cover.jpg",
    "audioUrl": "https://example.com/audio.mp3",
    "artistName": "Artist Name",
    "duration": "1:23:45",
    "genre": "Electronic",
    "displayOrder": 1,
    "createdAt": "2024-01-01T00:00:00Z"
  }
]
```

### Get Podcast by Slug
```http
GET /api/podcasts/:slug
```

### Create Podcast (Admin)
```http
POST /api/podcasts
```

**Requires Admin Role**

**Request Body:**
```json
{
  "title": "New Podcast",
  "description": "Podcast description",
  "coverUrl": "https://example.com/cover.jpg",
  "audioUrl": "https://example.com/audio.mp3",
  "artistName": "Artist Name",
  "duration": "1:23:45",
  "genre": "Electronic",
  "displayOrder": 1
}
```

### Get All Podcasts (Admin)
```http
GET /api/admin/podcasts
```

**Requires Admin Role**

### Get Podcast by ID (Admin)
```http
GET /api/admin/podcasts/:id
```

**Requires Admin Role**

### Update Podcast (Admin)
```http
PUT /api/admin/podcasts/:id
```

**Requires Admin Role**

### Delete Podcast (Admin)
```http
DELETE /api/admin/podcasts/:id
```

**Requires Admin Role**

### Reorder Podcasts (Admin)
```http
PUT /api/admin/podcasts/reorder
```

**Requires Admin Role**

**Request Body:**
```json
{
  "podcastIds": [3, 1, 2, 4]
}
```

### Upload Podcast Image (Admin)
```http
POST /api/admin/podcasts/upload-image
```

**Requires Admin Role**

**Content-Type**: `multipart/form-data`

**Request Body:**
```
image: [image file]
```

## ❤️ Favorites Endpoints

### Get User's Favorite Podcasts
```http
GET /api/favorites/podcasts
```

**Requires Authentication**

**Response:**
```json
[
  {
    "id": 1,
    "title": "Favorite Podcast",
    "slug": "favorite-podcast",
    "artistName": "Artist Name",
    "coverUrl": "https://example.com/cover.jpg"
  }
]
```

### Add Podcast to Favorites
```http
POST /api/favorites/podcasts/:podcastId
```

**Requires Authentication**

### Remove Podcast from Favorites
```http
DELETE /api/favorites/podcasts/:podcastId
```

**Requires Authentication**

### Check if Podcast is Favorited
```http
GET /api/favorites/podcasts/:podcastId/check
```

**Requires Authentication**

**Response:**
```json
{
  "isFavorite": true
}
```

## 📝 Articles Endpoints

### Get All Articles
```http
GET /api/articles
```

**Query Parameters:**
- `category`: Filter by category
- `search`: Search term
- `limit`: Number of articles to return
- `offset`: Number of articles to skip

**Response:**
```json
[
  {
    "id": 1,
    "title": "Article Title",
    "slug": "article-title",
    "content": "Article content...",
    "imageUrl": "https://example.com/article.jpg",
    "category": "News",
    "publishDate": "2024-01-01T00:00:00Z",
    "createdAt": "2024-01-01T00:00:00Z"
  }
]
```

### Get Article by Slug
```http
GET /api/articles/:slug
```

### Create Article (Admin)
```http
POST /api/articles
```

**Requires Admin Role**

**Request Body:**
```json
{
  "title": "New Article",
  "content": "Article content...",
  "imageUrl": "https://example.com/article.jpg",
  "category": "News",
  "publishDate": "2024-01-01T00:00:00Z"
}
```

### Update Article (Admin)
```http
PUT /api/articles/:id
```

**Requires Admin Role**

### Delete Article (Admin)
```http
DELETE /api/articles/:id
```

**Requires Admin Role**

### Get All Articles (Admin)
```http
GET /api/admin/articles
```

**Requires Admin Role**

### Get Article by ID (Admin)
```http
GET /api/admin/articles/:id
```

**Requires Admin Role**

### Upload Article Image (Admin)
```http
POST /api/admin/articles/upload-image
```

**Requires Admin Role**

**Content-Type**: `multipart/form-data`

**Request Body:**
```
image: [image file]
```

## 🖼️ Gallery Endpoints

### Get Gallery Items
```http
GET /api/gallery
```

**Query Parameters:**
- `type`: Filter by type (image, video, youtube)
- `limit`: Number of items to return
- `offset`: Number of items to skip

**Response:**
```json
[
  {
    "id": 1,
    "type": "image",
    "src": "https://example.com/image.jpg",
    "thumbnail": "https://example.com/thumbnail.jpg",
    "title": "Gallery Item Title",
    "description": "Gallery item description",
    "displayOrder": 1,
    "createdAt": "2024-01-01T00:00:00Z"
  }
]
```

### Get All Gallery Items (Admin)
```http
GET /api/admin/gallery
```

**Requires Admin Role**

### Create Gallery Item (Admin)
```http
POST /api/admin/gallery
```

**Requires Admin Role**

**Request Body:**
```json
{
  "type": "image",
  "src": "https://example.com/image.jpg",
  "thumbnail": "https://example.com/thumbnail.jpg",
  "title": "Gallery Item Title",
  "description": "Gallery item description",
  "displayOrder": 1
}
```

### Update Gallery Item (Admin)
```http
PUT /api/admin/gallery/:id
```

**Requires Admin Role**

### Delete Gallery Item (Admin)
```http
DELETE /api/admin/gallery/:id
```

**Requires Admin Role**

### Upload Gallery File (Admin)
```http
POST /api/admin/upload
```

**Requires Admin Role**

**Content-Type**: `multipart/form-data`

**Request Body:**
```
file: [image/video file]
```

## 📞 Contact Messages Endpoints

### Get All Contact Messages (Admin)
```http
GET /api/admin/contact-messages
```

**Requires Admin Role**

**Response:**
```json
[
  {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "subject": "General Inquiry",
    "message": "Hello, I have a question...",
    "status": "unread",
    "createdAt": "2024-01-01T00:00:00Z",
    "repliedAt": null,
    "adminReply": null
  }
]
```

### Create Contact Message (Admin)
```http
POST /api/admin/contact-messages
```

**Requires Admin Role**

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "subject": "General Inquiry",
  "message": "Hello, I have a question..."
}
```

### Mark Message as Read (Admin)
```http
PUT /api/admin/contact-messages/:id/read
```

**Requires Admin Role**

### Reply to Contact Message (Admin)
```http
PUT /api/admin/contact-messages/:id/reply
```

**Requires Admin Role**

**Request Body:**
```json
{
  "adminReply": "Thank you for your message. We'll get back to you soon."
}
```

### Delete Contact Message (Admin)
```http
DELETE /api/admin/contact-messages/:id
```

**Requires Admin Role**

## 👥 User Management Endpoints

### Get All Users (Admin)
```http
GET /api/admin/users
```

**Requires Admin Role**

**Query Parameters:**
- `role`: Filter by role (user, admin, artist)
- `search`: Search term
- `limit`: Number of users to return
- `offset`: Number of users to skip

### Update User (Admin)
```http
PUT /api/admin/users/:id
```

**Requires Admin Role**

**Request Body:**
```json
{
  "role": "artist",
  "artistType": "dj"
}
```

### Delete User (Admin)
```http
DELETE /api/admin/users/:id
```

**Requires Admin Role**

## 📊 Analytics & Stats Endpoints (Admin)

### Get Dashboard Stats
```http
GET /api/admin/stats
```

**Requires Admin Role**

**Response:**
```json
{
  "totalUsers": 150,
  "totalOrders": 45,
  "totalRevenue": "1250.00",
  "totalEvents": 8,
  "totalTickets": 120,
  "recentOrders": [...],
  "recentUsers": [...]
}
```

### Get Analytics
```http
GET /api/admin/analytics
```

**Requires Admin Role**

**Query Parameters:**
- `period`: Time period (day, week, month, year)
- `startDate`: Start date
- `endDate`: End date

## 🔧 Admin Utilities Endpoints

### Clear Cache (Admin)
```http
POST /api/admin/clear-cache
```

**Requires Admin Role**

**Response:**
```json
{
  "message": "Cache cleared successfully"
}
```

### Get Performance Metrics (Admin)
```http
GET /api/admin/performance
```

**Requires Admin Role**

**Response:**
```json
{
  "metrics": {
    "avgResponseTime": 125,
    "requestCount": 1500,
    "errorCount": 5
  }
}
```

### Clear Performance Metrics (Admin)
```http
POST /api/admin/performance/clear
```

**Requires Admin Role**

### Force Refresh (Admin)
```http
POST /api/admin/force-refresh
```

**Requires Admin Role** - Forces a refresh of cached data.

## 🔒 Role-Based Test Endpoints

### Admin Only Test
```http
GET /api/admin-only
```

**Requires Admin Role**

### Artist Only Test
```http
GET /api/artist-only
```

**Requires Artist Role**

### Artist or Admin Test
```http
GET /api/artist-or-admin
```

**Requires Artist or Admin Role**

## 🚨 Error Responses

### Standard Error Format
```json
{
  "message": "Error description",
  "error": "Detailed error message",
  "errors": [
    {
      "field": "fieldName",
      "message": "Field-specific error"
    }
  ]
}
```

### Common HTTP Status Codes
- `200 OK`: Successful request
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request data or validation error
- `401 Unauthorized`: Authentication required or invalid credentials
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

### Common Error Scenarios
- **Authentication Required**: `401` - User must be logged in
- **Admin Access Required**: `403` - User must have admin role
- **Artist Access Required**: `403` - User must have artist role
- **Resource Not Found**: `404` - Requested resource doesn't exist
- **Validation Error**: `400` - Input data doesn't meet requirements
- **Duplicate Entry**: `400` - Email/username already exists

## 📝 Data Models

### User Roles
- `user`: Regular user (default)
- `admin`: Administrator with full access
- `artist`: Artist with special permissions

### Artist Types
- `dj`: DJ
- `producer`: Music producer
- `hybrid`: DJ and producer

### Product Categories
- `vinyl`: Vinyl records
- `digital`: Digital downloads
- `merch`: Merchandise
- `clothing`: Clothing items
- `accessories`: Accessories
- `other`: Other products

### Product Types
- `physical`: Physical product requiring shipping
- `digital`: Digital product for download

### Ticket Types
- `early_bird`: Early bird tickets (first phase)
- `second_phase`: Second phase tickets
- `last_phase`: Last phase tickets (at the door)
- `vip`: VIP tickets

### Ticket Status
- `active`: Ticket is valid and not used
- `used`: Ticket has been scanned and used
- `cancelled`: Ticket has been cancelled
- `expired`: Ticket has expired

### Order Status
- `pending`: Order placed but not paid
- `paid`: Order paid successfully
- `shipped`: Order has been shipped
- `out_for_delivery`: Order is out for delivery
- `delivered`: Order delivered (COD, not yet paid)
- `delivered_paid`: Order delivered and paid (COD completed)
- `cancelled`: Order cancelled
- `refunded`: Order refunded

### Payment Methods
- `cmi`: CMI payment gateway
- `paypal`: PayPal
- `cod`: Cash on Delivery

### Payment Status
- `pending`: Payment not completed
- `completed`: Payment successful
- `failed`: Payment failed
- `refunded`: Payment refunded

### Event Status
- `upcoming`: Event is scheduled for the future
- `past`: Event has already occurred
- `featured`: Event is featured (can be upcoming or past)

### Contact Message Status
- `unread`: Message not yet read
- `read`: Message has been read
- `replied`: Admin has replied to message

### Gallery Item Types
- `image`: Static image
- `video`: Video file
- `youtube`: YouTube video embed

## 📝 Rate Limiting

- **Public endpoints**: 100 requests per minute
- **Authenticated endpoints**: 1000 requests per minute
- **Admin endpoints**: 500 requests per minute
- **File uploads**: 10 requests per minute

## 🔒 Security Features

### Security Headers
The API includes the following security headers:
- `Access-Control-Max-Age: 86400`
- `Cross-Origin-Opener-Policy: same-origin`
- `Cross-Origin-Embedder-Policy: credentialless`
- `Permissions-Policy: encrypted-media=*, microphone=*, camera=*, geolocation=*`

### Authentication Security
- Passwords are hashed using bcrypt with salt rounds of 10
- JWT access tokens expire after 15 minutes
- JWT refresh tokens expire after 7 days
- Session cookies are HTTP-only and secure in production
- CORS is configured for specific origins

### File Upload Limits
- Profile pictures: Max 5MB
- Event/Product/Article/Podcast images: Max 50MB (configurable)
- Accepted image formats: jpg, jpeg, png, gif, webp

## 📡 Session Management

### Session Configuration
- **Session Store**: PostgreSQL
- **Session Duration**: 30 days
- **Session Pruning**: Every 5 minutes
- **Cookie Name**: `izuran.sid`
- **Cookie Settings**:
  - `httpOnly`: true
  - `secure`: true (in production)
  - `sameSite`: 'lax'
  - `rolling`: true (session extends with each request)

---

**Note**: All timestamps are in ISO 8601 format (UTC). Monetary values are stored as decimal strings (e.g., "25.00"). File uploads should use `multipart/form-data` content type.

**Version**: 1.0.0  
**Last Updated**: October 27, 2025
