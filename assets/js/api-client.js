const API_URL = window.location.origin.includes('localhost')
    ? 'http://localhost:5000/api'
    : `${window.location.origin}/api`;

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

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Something went wrong');
        }
        return data;
    },

    // Auth
    async login(email, password) {
        const data = await this.fetch('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
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
            body: JSON.stringify(adData),
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
    }
};

window.apiClient = apiClient;
