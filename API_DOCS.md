# 📖 Taggerly API Documentation

This document outlines the available API endpoints for the Taggerly platform. All requests should use the base URL: `http://localhost:5000/api`.

---

## 🔐 Authentication
| Method | Endpoint | Description | Auth Required | Captcha Required |
| :--- | :--- | :--- | :--- | :--- |
| POST | `/auth/register` | Register a new user | No | Yes |
| POST | `/auth/login` | Login user and return JWT | No | Yes |
| POST | `/auth/google` | Google OAuth login | No | No |
| POST | `/auth/facebook` | Facebook OAuth login | No | No |
| POST | `/auth/forgot-password` | Send password reset email | No | No |
| PATCH | `/auth/reset-password/:token` | Reset password using token | No | No |
| GET | `/auth/verify-email/:token` | Verify user email | No | No |
| POST | `/auth/resend-verification` | Resend verification email | Yes | No |
| GET | `/auth/me` | Get current user info | Yes | No |

---

## 📢 Ads Management
| Method | Endpoint | Description | Auth Required | Captcha Required |
| :--- | :--- | :--- | :--- | :--- |
| GET | `/ads` | List ads (supports filters) | No | No |
| GET | `/ads/:id` | Get ad details by ID | No | No |
| POST | `/ads` | Create a new ad | Yes | Yes |
| PUT | `/ads/:id` | Update an existing ad | Yes (Owner) | No |
| DELETE | `/ads/:id` | Soft delete an ad | Yes (Owner/Admin) | No |
| POST | `/ads/:id/favorite` | Toggle ad in user favorites | Yes | No |
| GET | `/ads/favorites` | Get current user's favorite ads | Yes | No |
| GET | `/ads/my-ads` | Get ads posted by current user | Yes | No |
| GET | `/ads/stats/dashboard` | Get current user's dashboard stats | Yes | No |

### Ad Creation Fields (POST `/ads`)
- `title` (String, required)
- `description` (Text, required)
- `price` (Number, required)
- `category` (Enum: Motors, Property, Classifieds, Jobs, Services, Furniture, Mobiles, Electronics)
- `subCategory` (String, optional)
- `city` (String, required)
- `country` (String, default: 'uae')
- `images` (Multipart files, max 5)
- **Motors Specific**: `year`, `kilometers`
- **Property Specific**: `bedrooms`, `bathrooms`, `propertyType` (Apartment, Villa, etc.), `area` (Sq Ft)
- `itemCondition` (String: New, Used)
- `phone` (String, optional)
- `captchaToken` (String, required)

---

## 💬 Chat & Messages
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| POST | `/chat/conversation` | Start/Get conversation for ad | Yes |
| GET | `/chat/conversations` | Get all user conversations | Yes |
| GET | `/chat/messages/:convoId` | Get messages in a conversation | Yes |
| POST | `/chat/message` | Send message (Multipart for image) | Yes |
| DELETE | `/chat/conversation/:convoId` | Delete/Archive a conversation | Yes |

---

## 🔔 Notifications
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| GET | `/notifications` | Get all user notifications | Yes |
| PUT | `/notifications/:id/read` | Mark a notification as read | Yes |
| PUT | `/notifications/read-all` | Mark all notifications as read | Yes |

---

## 💳 Payments & Subscription
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| GET | `/payments/plans` | List available subscription plans | No |
| POST | `/payments/create-checkout-session` | Create Stripe Session | Yes |
| GET | `/payments/my-payments` | Get user payment history | Yes |
| GET | `/payments/verify-session/:sessionId` | Verify Stripe Checkout Session | Yes |
| GET | `/payments/all` | Get all payments (Admin only) | Admin |
| POST | `/payments/webhook` | Stripe payment webhook | No (Stripe) |

---

## 👤 User Profile
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| GET | `/users/profile` | Get current user profile | Yes |
| GET | `/users/public/:id` | Get public profile of a user | No |
| PUT | `/users/profile` | Update current user profile | Yes |
| PUT | `/users/update-password` | Update user password | Yes |

### Profile Update Fields (PUT `/users/profile`)
- `name` (String)
- `phone` (String)
- `bio` (Text)
- `location` (String)
- `avatar` (File, multipart)
- `emailNotifications` (Boolean)
- `chatNotifications` (Boolean)

---

## 🚩 Reports & Moderation
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| POST | `/reports` | Submit a report (for ad or user) | Yes |
| GET | `/reports` | List all reports (Admin only) | Admin |
| PUT | `/reports/:id` | Review and update report status | Admin |

### Report Fields (POST `/reports`)
- `adId` (Integer, required)
- `reason` (String, required)
- `description` (Text, optional)

---

## ⭐ Reviews & Ratings
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| POST | `/reviews` | Submit a review for a seller | Yes |
| GET | `/reviews/seller/:sellerId` | Get all reviews for a specific seller | No |

### Review Fields (POST `/reviews`)
- `sellerId` (Integer, required)
- `rating` (Integer, 1-5, required)
- `comment` (Text, optional)
- `adId` (Integer, optional)

---

## 👮 Admin Endpoints
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| GET | `/admin/stats` | Platform-wide overview stats | Admin |
| GET | `/admin/analytics` | Data for charts (Users, Ads, Revenue) | Admin |
| GET | `/admin/revenue` | Revenue and financial summary | Admin |
| GET | `/admin/ads` | List all ads with detailed info | Admin |
| GET | `/admin/ads/pending` | List ads awaiting moderation | Admin |
| PUT | `/admin/ads/:id/approve` | Approve a pending ad | Admin |
| PUT | `/admin/ads/:id/reject` | Reject a pending ad with reason | Admin |
| PUT | `/admin/ads/:id/feature` | Toggle "Featured" status of an ad | Admin |
| DELETE | `/admin/ads/:id` | Permenant delete an ad | Admin |
| GET | `/admin/users` | List all users | Admin |
| PUT | `/admin/users/:id/ban` | Toggle ban status for a user | Admin |
| PUT | `/admin/users/:id/promote` | Promote user to Admin status | Admin |
| DELETE | `/admin/users/:id` | Permenant delete a user | Admin |
| GET | `/admin/reports` | List and manage reports | Admin |
| PUT | `/admin/reports/:id` | Review and resolve a report | Admin |

---

## 🛠️ Errors & Status Codes
The API uses standard HTTP status codes:
- `200 OK`: Request successful.
- `201 Created`: Resource successfully created.
- `400 Bad Request`: Validation error, missing fields, or **Captcha failure**.
- `401 Unauthorized`: Authentication token missing or invalid.
- `403 Forbidden`: Insufficient permissions.
- `404 Not Found`: Resource does not exist.
- `500 Server Error`: Internal server error.

---

*For detailed field documentation, please refer to the source code models in `/models`.*
