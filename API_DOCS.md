# 📖 Taggerly API Documentation

This document outlines the available API endpoints for the Taggerly platform. All requests should use the base URL: `http://localhost:5000/api`.

---

## 🔐 Authentication
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| POST | `/auth/signup` | Register a new user | No |
| POST | `/auth/login` | Login user and return JWT | No |
| POST | `/auth/google` | Google OAuth login | No |
| POST | `/auth/facebook` | Facebook OAuth login | No |
| POST | `/auth/forgot-password` | Send password reset email | No |
| POST | `/auth/reset-password/:token` | Reset password using token | No |
| POST | `/auth/verify-email` | Verify user email | Yes |

---

## 📢 Ads Management
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| GET | `/ads` | List ads (supports filters, sorting, pagination) | No |
| GET | `/ads/:id` | Get ad details by ID | No |
| POST | `/ads` | Create a new ad (Multipart/Form-Data) | Yes |
| PUT | `/ads/:id` | Update an existing ad | Yes (Owner) |
| DELETE | `/ads/:id` | Soft delete an ad | Yes (Owner/Admin) |
| POST | `/ads/:id/favorite` | Toggle ad in user favorites | Yes |
| GET | `/ads/my-ads` | Get ads posted by current user | Yes |

---

## 💬 Chat & Messages
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| POST | `/chat/start` | Start a new conversation for an ad | Yes |
| GET | `/chat/conversations` | Get all user conversations | Yes |
| GET | `/chat/messages/:convoId` | Get messages in a conversation | Yes |
| DELETE | `/chat/:convoId` | Delete/Archive a conversation | Yes |

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
| POST | `/payments/checkout` | Create Stripe Checkout Session | Yes |
| GET | `/payments/history` | Get user payment history | Yes |

---

## 👤 User Profile
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| GET | `/users/profile/:id` | Get public profile of a user | No |
| PUT | `/users/profile` | Update current user profile | Yes |
| GET | `/users/stats` | Get dashboard statistics for user | Yes |

---

## 👮 Admin Endpoints
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| GET | `/admin/ads/pending` | List ads awaiting moderation | Admin |
| PUT | `/admin/ads/:id/approve` | Approve a pending ad | Admin |
| PUT | `/admin/ads/:id/reject` | Reject a pending ad with reason | Admin |
| GET | `/admin/stats/overview` | Get platform-wide statistics | Admin |

---

## 🛠️ Errors & Status Codes
The API uses standard HTTP status codes:
- `200 OK`: Request successful.
- `201 Created`: Resource successfully created.
- `400 Bad Request`: Validation error or missing fields.
- `401 Unauthorized`: Authentication token missing or invalid.
- `403 Forbidden`: Insufficient permissions (Non-admin trying to access admin route).
- `404 Not Found`: Resource does not exist.
- `500 Server Error`: Internal server error.

---

*For detailed field documentation, please refer to the source code models in `/models`.*
