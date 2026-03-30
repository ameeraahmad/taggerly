const API_URL = '/api';

const apiClient = {
    async fetch(endpoint, options = {}) {
        const token = localStorage.getItem('token');
        const headers = {
            ...options.headers,
        };

        if (!(options.body instanceof FormData)) {
            headers['Content-Type'] = 'application/json';
        }

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers,
        });

        // Try to parse as JSON, but handle HTML error responses gracefully
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Something went wrong');
            }
            return data;
        } else {
            // Handle non-JSON response (likely an HTML error page)
            const text = await response.text();
            console.error('Server returned non-JSON response:', text);
            throw new Error(`Server Error: ${response.status} ${response.statusText}`);
        }
    },

    // Auth
    async login(email, password, captchaToken = null) {
        const body = { email, password };
        if (captchaToken) body.captchaToken = captchaToken;

        const data = await this.fetch('/auth/login', {
            method: 'POST',
            body: JSON.stringify(body),
        });
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.data));
        return data;
    },

    async googleLogin(tokenId) {
        const data = await this.fetch('/auth/google', {
            method: 'POST',
            body: JSON.stringify({ tokenId })
        });
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.data));
        return data;
    },

    async facebookLogin(accessToken) {
        const data = await this.fetch('/auth/facebook', {
            method: 'POST',
            body: JSON.stringify({ accessToken })
        });
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.data));
        return data;
    },

    async register(userData) {
        const data = await this.fetch('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData),
        });
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.data));
        return data;
    },

    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'login.html';
    },

    // Ads
    async getAds(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.fetch(`/ads?${queryString}`);
    },

    async getAd(id) {
        return this.fetch(`/ads/${id}`);
    },

    async createAd(adData) {
        return this.fetch('/ads', {
            method: 'POST',
            body: adData instanceof FormData ? adData : JSON.stringify(adData),
        });
    },

    async updateAd(id, adData) {
        return this.fetch(`/ads/${id}`, {
            method: 'PUT',
            body: adData instanceof FormData ? adData : JSON.stringify(adData),
        });
    },

    async deleteAd(id) {
        return this.fetch(`/ads/${id}`, {
            method: 'DELETE',
        });
    },

    async toggleFavorite(adId) {
        return this.fetch(`/ads/${adId}/favorite`, {
            method: 'POST',
        });
    },

    async getFavorites() {
        return this.fetch('/ads/favorites');
    },

    async getMyAds() {
        return this.fetch('/ads/my-ads');
    },

    // Chat
    async startConversation(adId) {
        return this.fetch('/chat/conversation', {
            method: 'POST',
            body: JSON.stringify({ adId }),
        });
    },

    async getConversations() {
        return this.fetch('/chat/conversations');
    },

    async sendMessage(conversationId, message, imageFile = null) {
        if (imageFile) {
            const formData = new FormData();
            formData.append('conversationId', conversationId);
            if (message) formData.append('message', message);
            formData.append('image', imageFile);

            return this.fetch('/chat/message', {
                method: 'POST',
                body: formData
            });
        }

        return this.fetch('/chat/message', {
            method: 'POST',
            body: JSON.stringify({ conversationId, message }),
        });
    },

    async getChatMessages(conversationId) {
        return this.fetch(`/chat/messages/${conversationId}`);
    },

    async getUnreadCount() {
        return this.fetch('/chat/unread-count');
    },

    // Reviews
    async createReview(reviewData) {
        return this.fetch('/reviews', {
            method: 'POST',
            body: JSON.stringify(reviewData)
        });
    },

    async getSellerReviews(sellerId) {
        return this.fetch(`/reviews/seller/${sellerId}`);
    },

    // User Profile
    async getProfile() {
        return this.fetch('/users/profile');
    },

    async getPublicProfile(id) {
        return this.fetch(`/users/public/${id}`);
    },

    async getMyPayments() {
        return this.fetch('/payments/my-payments');
    },

    async updateProfile(profileData) {
        return this.fetch('/users/profile', {
            method: 'PUT',
            body: profileData instanceof FormData ? profileData : JSON.stringify(profileData)
        });
    },

    async updatePassword(passwordData) {
        return this.fetch('/users/update-password', {
            method: 'PUT',
            body: JSON.stringify(passwordData)
        });
    }
};

window.apiClient = apiClient;
