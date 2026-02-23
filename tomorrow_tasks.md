# Tasks for February 24, 2026 - Taggerly Project

## 1. Chat Enhancements
- [ ] **Delete/Archive Conversations**: Add a "Delete" button to the conversation list to allow users to hide or remove chats.
- [ ] **Typing Indicators**: Show "typing..." status when the other user is typing in the chat window using socket.io events.
- [ ] **Read Receipts**: Visual confirmation (like double ticks) when a message is read.

## 2. Ad Management (Dashboard)
- [ ] **Edit Ad**: Create `edit-ad.html` to allow users to update their existing listings (price, description, images).
- [ ] **Delete Ad**: Implement a safe deletion flow for ads.
- [ ] **Mark as Sold**: Add a status toggle to show ads as "Sold" instead of just active/inactive.

## 3. User Experience & Social
- [ ] **Seller Reviews & Ratings**: Allow buyers to rate their experience with a seller.
- [ ] **Profile Stats**: Show total views and number of inquiries for each ad in the user's dashboard.
- [ ] **Search Filters**: Implement the "Sort by" (Price, Date) and "Radius search" if possible.

## 4. Technical Debt/Polish
- [ ] **Image Optimization**: Ensure uploaded images are resized/compressed for faster loading.
- [ ] **Security Review**: Check that only owners can edit/delete their own ads.
