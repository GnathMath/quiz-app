// Simple encryption for quiz files
class FileEncryption {
    constructor() {
        this.algorithm = {
            name: 'AES-GCM',
            length: 256
        };
    }

    // Generate key from password
    async deriveKey(password, salt) {
        const encoder = new TextEncoder();
        const passwordBuffer = encoder.encode(password);
        
        const baseKey = await crypto.subtle.importKey(
            'raw',
            passwordBuffer,
            { name: 'PBKDF2' },
            false,
            ['deriveKey']
        );
        
        return await crypto.subtle.deriveKey(
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
    }

    // Encrypt data for file
    async encrypt(data, password) {
        try {
            const salt = crypto.getRandomValues(new Uint8Array(16));
            const iv = crypto.getRandomValues(new Uint8Array(12));
            
            const key = await this.deriveKey(password, salt);
            const encoder = new TextEncoder();
            const dataBuffer = encoder.encode(JSON.stringify(data));
            
            const encrypted = await crypto.subtle.encrypt(
                {
                    name: 'AES-GCM',
                    iv: iv
                },
                key,
                dataBuffer
            );
            
            // Combine salt + iv + encrypted data
            const encryptedArray = new Uint8Array(salt.byteLength + iv.byteLength + encrypted.byteLength);
            encryptedArray.set(salt, 0);
            encryptedArray.set(iv, salt.byteLength);
            encryptedArray.set(new Uint8Array(encrypted), salt.byteLength + iv.byteLength);
            
            // Convert to base64 for file storage
            return btoa(String.fromCharCode.apply(null, encryptedArray));
            
        } catch (error) {
            console.error('Encryption error:', error);
            throw new Error('Encryption failed');
        }
    }

    // Decrypt data from file
    async decrypt(encryptedBase64, password) {
        try {
            // Convert from base64
            const binaryString = atob(encryptedBase64);
            const encryptedArray = new Uint8Array(binaryString.length);
            
            for (let i = 0; i < binaryString.length; i++) {
                encryptedArray[i] = binaryString.charCodeAt(i);
            }
            
            // Extract salt (16 bytes) and iv (12 bytes)
            const salt = encryptedArray.slice(0, 16);
            const iv = encryptedArray.slice(16, 28);
            const encryptedData = encryptedArray.slice(28);
            
            const key = await this.deriveKey(password, salt);
            
            const decrypted = await crypto.subtle.decrypt(
                {
                    name: 'AES-GCM',
                    iv: iv
                },
                key,
                encryptedData
            );
            
            const decoder = new TextDecoder();
            return JSON.parse(decoder.decode(decrypted));
            
        } catch (error) {
            console.error('Decryption error:', error);
            throw new Error('Invalid password or corrupted file');
        }
    }

    // Create a download link for encrypted file
    downloadFile(data, filename, type = 'application/octet-stream') {
        const blob = new Blob([data], { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // Read file as text
    readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject('Failed to read file');
            reader.readAsText(file);
        });
    }
}

// Create global instance
const fileEncryption = new FileEncryption();