// Authentication helper for OneVital API testing
import 'dotenv/config';

class AuthHelper {
  constructor() {
    this.sessions = new Map();
    this.credentials = this.parseCredentials();
    this.baseUrl = process.env.ONEVITAL_API_BASE_URL || 'https://onevital-backend-dev.azurewebsites.net';
  }

  parseCredentials() {
    const emails = process.env.USER_EMAIL?.split(',').map(email => email.trim()) || [];
    const passwords = process.env.USER_PASSWORD?.split(',').map(pass => pass.trim()) || [];
    
    if (emails.length !== passwords.length) {
      throw new Error('USER_EMAIL and USER_PASSWORD arrays must have the same length');
    }
    
    return emails.map((email, index) => ({
      email,
      password: passwords[index]
    }));
  }

  async login(userIndex = 0) {
    if (userIndex >= this.credentials.length) {
      throw new Error(`User index ${userIndex} out of range. Available users: 0-${this.credentials.length - 1}`);
    }

    const credential = this.credentials[userIndex];
    const sessionKey = `user_${userIndex}`;

    // Check if we already have a valid session
    if (this.sessions.has(sessionKey)) {
      const session = this.sessions.get(sessionKey);
      if (this.isTokenValid(session.token, session.expiresAt)) {
        return session.token;
      }
    }

    if (!credential) {
      return '';
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          email: credential.email,
          password: credential.password
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Authentication failed for user ${userIndex}: ${response.status} ${errorText}`);
      }

      const authData = await response.json();
      
      // Extract token from response (adjust based on actual API response structure)
      const token = authData.token || authData.access_token || authData.accessToken || authData.data.token || authData.data.access_token || authData.data.accessToken;
      if (!token) {
        throw new Error('No token found in authentication response');
      }

      // Calculate expiration time (assuming 1 hour if not provided)
      const expiresIn = authData.expires_in || authData.expiresIn || 3600;
      const expiresAt = Date.now() + (expiresIn * 1000);

      // Store session
      this.sessions.set(sessionKey, {
        token,
        expiresAt,
        userIndex,
        email: credential.email
      });

      return token;
    } catch (error) {
      throw new Error(`Login failed for user ${userIndex}: ${error.message}`);
    }
  }

  isTokenValid(token, expiresAt) {
    return token && expiresAt && Date.now() < (expiresAt - 60000); // 1 minute buffer
  }

  async getAuthHeaders(userIndex = 0) {
    const token = await this.login(userIndex);
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  }

  async makeAuthenticatedRequest(endpoint, options = {}, userIndex = 0) {
    const headers = await this.getAuthHeaders(userIndex);
    
    const requestOptions = {
      ...options,
      headers: {
        ...headers,
        ...options.headers
      }
    };

    const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;
    
    const maxRetries = parseInt(process.env.MAX_RETRY_ATTEMPTS) || 3;
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(url, requestOptions);
        
        // If unauthorized, try to refresh token and retry
        if (response.status === 401 && attempt < maxRetries) {
          this.clearSession(userIndex);
          const newHeaders = await this.getAuthHeaders(userIndex);
          requestOptions.headers = { ...newHeaders, ...options.headers };
          continue;
        }

        return response;
      } catch (error) {
        lastError = error;
        if (attempt === maxRetries) {
          throw new Error(`Request failed after ${maxRetries} attempts: ${error.message}`);
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }

    throw lastError;
  }

  clearSession(userIndex) {
    const sessionKey = `user_${userIndex}`;
    this.sessions.delete(sessionKey);
  }

  clearAllSessions() {
    this.sessions.clear();
  }

  getSessionInfo(userIndex = 0) {
    const sessionKey = `user_${userIndex}`;
    return this.sessions.get(sessionKey) || null;
  }

  getAllCredentials() {
    return this.credentials.map((cred, index) => ({
      index,
      email: cred.email,
      hasSession: this.sessions.has(`user_${index}`)
    }));
  }
}

// Export singleton instance
export const authHelper = new AuthHelper();

// Export class for testing
export { AuthHelper };