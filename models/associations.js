const User = require('./User');
const Ad = require('./Ad');
const Favorite = require('./Favorite');
const Message = require('./Message');
const Conversation = require('./Conversation');
const ChatMessage = require('./ChatMessage');
const Review = require('./Review');

// User - Ad
User.hasMany(Ad, { foreignKey: 'userId', as: 'ads' });
Ad.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// User - Favorite - Ad
User.belongsToMany(Ad, { through: Favorite, foreignKey: 'userId', as: 'favoriteAds' });
Ad.belongsToMany(User, { through: Favorite, foreignKey: 'adId', as: 'favoritedBy' });

// Chat Associations
User.hasMany(Conversation, { foreignKey: 'buyerId', as: 'buyerConversations' });
User.hasMany(Conversation, { foreignKey: 'sellerId', as: 'sellerConversations' });
Conversation.belongsTo(User, { foreignKey: 'buyerId', as: 'buyer' });
Conversation.belongsTo(User, { foreignKey: 'sellerId', as: 'seller' });

Ad.hasMany(Conversation, { foreignKey: 'adId', as: 'conversations' });
Conversation.belongsTo(Ad, { foreignKey: 'adId', as: 'ad' });

Conversation.hasMany(ChatMessage, { foreignKey: 'conversationId', as: 'messages' });
ChatMessage.belongsTo(Conversation, { foreignKey: 'conversationId' });

User.hasMany(ChatMessage, { foreignKey: 'senderId', as: 'sentMessages' });
ChatMessage.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });

// Review Associations
User.hasMany(Review, { foreignKey: 'sellerId', as: 'receivedReviews' });
User.hasMany(Review, { foreignKey: 'reviewerId', as: 'givenReviews' });
Review.belongsTo(User, { foreignKey: 'sellerId', as: 'seller' });
Review.belongsTo(User, { foreignKey: 'reviewerId', as: 'reviewer' });
Review.belongsTo(Ad, { foreignKey: 'adId', as: 'ad' });
Ad.hasMany(Review, { foreignKey: 'adId', as: 'reviews' });

module.exports = {
    User,
    Ad,
    Favorite,
    Message,
    Conversation,
    ChatMessage,
    Review
};
