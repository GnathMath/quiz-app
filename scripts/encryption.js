class EncryptionManager {
    constructor() {
        this.algorithm = {
            name: 'AES-GCM',
            length: 256
        };
    }

    // Generate encryption key from password
    async generateKeyFromPassword(password, salt) {
        const encoder = new TextEncoder();
        const passwordBuffer = encoder.encode(password);
        
        // Import password as key
        const baseKey = await crypto.subtle.importKey(
            'raw',
            passwordBuffer,
            { name: 'PBKDF2' },
            false,
            ['deriveKey']
        );
        
        // Derive key using PBKDF2
        const key = await crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: salt,
                iterations: 100000,
                hash: 'SHA-256'
            },
            baseKey,
            this.algorithm,
            false,
            ['encrypt', 'decrypt']
        );
        
        return key;
    }

    // Encrypt data
    async encryptData(data, password) {
        try {
            const salt = crypto.getRandomValues(new Uint8Array(16));
            const iv = crypto.getRandomValues(new Uint8Array(12));
            
            const key = await this.generateKeyFromPassword(password, salt);
            const encoder = new TextEncoder();
            const dataBuffer = encoder.encode(JSON.stringify(data));
            
            const encryptedContent = await crypto.subtle.encrypt(
                {
                    name: 'AES-GCM',
                    iv: iv
                },
                key,
                dataBuffer
            );
            
            // Combine salt, iv, and encrypted data
            const encryptedArray = new Uint8Array(
                salt.byteLength + iv.byteLength + encryptedContent.byteLength
            );
            
            encryptedArray.set(salt, 0);
            encryptedArray.set(iv, salt.byteLength);
            encryptedArray.set(new Uint8Array(encryptedContent), salt.byteLength + iv.byteLength);
            
            // Convert to base64 for storage
            const base64String = btoa(String.fromCharCode.apply(null, encryptedArray));
            
            return {
                encrypted: base64String,
                metadata: {
                    salt: Array.from(salt),
                    iv: Array.from(iv),
                    timestamp: new Date().toISOString()
                }
            };
        } catch (error) {
            console.error('Encryption error:', error);
            throw error;
        }
    }

    // Decrypt data
    async decryptData(encryptedData, password) {
        try {
            // Convert from base64
            const binaryString = atob(encryptedData);
            const encryptedArray = new Uint8Array(binaryString.length);
            
            for (let i = 0; i < binaryString.length; i++) {
                encryptedArray[i] = binaryString.charCodeAt(i);
            }
            
            // Extract salt, iv, and encrypted content
            const salt = encryptedArray.slice(0, 16);
            const iv = encryptedArray.slice(16, 28);
            const encryptedContent = encryptedArray.slice(28);
            
            const key = await this.generateKeyFromPassword(password, salt);
            
            const decryptedContent = await crypto.subtle.decrypt(
                {
                    name: 'AES-GCM',
                    iv: iv
                },
                key,
                encryptedContent
            );
            
            const decoder = new TextDecoder();
            const decryptedString = decoder.decode(decryptedContent);
            
            return JSON.parse(decryptedString);
        } catch (error) {
            console.error('Decryption error:', error);
            throw new Error('Invalid password or corrupted data');
        }
    }

    // Generate random password for response files
    generateRandomPassword(length = 32) {
        const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
        let password = '';
        const randomValues = new Uint8Array(length);
        
        crypto.getRandomValues(randomValues);
        
        for (let i = 0; i < length; i++) {
            password += charset[randomValues[i] % charset.length];
        }
        
        return password;
    }

    // Hash password (for verification without decryption)
    async hashPassword(password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hash = await crypto.subtle.digest('SHA-256', data);
        
        // Convert to hex string
        const hashArray = Array.from(new Uint8Array(hash));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
}

// Export singleton instance
const encryptionManager = new EncryptionManager();