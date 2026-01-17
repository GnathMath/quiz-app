class QuizDatabase {
    constructor() {
        this.dbName = 'OfflineQuizDB';
        this.version = 2;
        this.db = null;
        this.dbPromise = null;
    }

    // Initialize database - only once
    async init() {
        if (this.dbPromise) {
            return this.dbPromise;
        }
        
        this.dbPromise = new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);
            
            request.onerror = (event) => {
                console.error('Database error:', event.target.errorCode);
                reject('Database error: ' + event.target.errorCode);
            };
            
            request.onsuccess = (event) => {
                this.db = event.target.result;
                console.log('Database initialized successfully');
                resolve(this.db);
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Create object store for quiz databases
                if (!db.objectStoreNames.contains('quiz_databases')) {
                    const quizStore = db.createObjectStore('quiz_databases', { keyPath: 'id' });
                    quizStore.createIndex('name', 'name', { unique: false });
                    quizStore.createIndex('createdAt', 'createdAt', { unique: false });
                    console.log('Created quiz_databases store');
                }
                
                // Create object store for student responses
                if (!db.objectStoreNames.contains('student_responses')) {
                    const responseStore = db.createObjectStore('student_responses', { keyPath: 'id' });
                    responseStore.createIndex('quizId', 'quizId', { unique: false });
                    responseStore.createIndex('studentId', 'studentId', { unique: false });
                    responseStore.createIndex('timestamp', 'timestamp', { unique: false });
                    console.log('Created student_responses store');
                }
                
                // Create object store for response passwords (encrypted)
                if (!db.objectStoreNames.contains('response_passwords')) {
                    db.createObjectStore('response_passwords', { keyPath: 'responseId' });
                    console.log('Created response_passwords store');
                }
            };
        });
        
        return this.dbPromise;
    }

    // Save quiz database
    async saveQuizDatabase(quizData, password) {
        try {
            await this.init();
            
            // Encrypt the quiz data
            const encryptedData = await encryptionManager.encryptData(quizData, password);
            
            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction(['quiz_databases'], 'readwrite');
                const store = transaction.objectStore('quiz_databases');
                
                const quizRecord = {
                    id: this.generateId(),
                    name: quizData.name,
                    encryptedData: encryptedData.encrypted,
                    questionCount: quizData.questions.length,
                    createdAt: new Date().toISOString(),
                    metadata: encryptedData.metadata
                };
                
                // We'll store a hashed version of the password for verification
                encryptionManager.hashPassword(password).then(hash => {
                    quizRecord.passwordHash = hash;
                    
                    const request = store.add(quizRecord);
                    
                    request.onsuccess = () => {
                        console.log('Quiz saved successfully:', quizRecord.id);
                        resolve({
                            id: quizRecord.id,
                            name: quizRecord.name
                        });
                    };
                    
                    request.onerror = (event) => {
                        console.error('Error saving quiz:', event.target.error);
                        reject('Failed to save quiz: ' + event.target.error);
                    };
                }).catch(error => {
                    reject('Error hashing password: ' + error);
                });
                
                // Handle transaction completion
                transaction.oncomplete = () => {
                    console.log('Transaction completed');
                };
                
                transaction.onerror = (event) => {
                    console.error('Transaction error:', event.target.error);
                    reject('Transaction error: ' + event.target.error);
                };
            });
        } catch (error) {
            console.error('Error in saveQuizDatabase:', error);
            throw error;
        }
    }

    // Load quiz database with password
    async loadQuizDatabase(quizId, password) {
        try {
            await this.init();
            
            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction(['quiz_databases'], 'readonly');
                const store = transaction.objectStore('quiz_databases');
                const request = store.get(quizId);
                
                request.onsuccess = async (event) => {
                    const quizRecord = event.target.result;
                    
                    if (!quizRecord) {
                        reject('Quiz not found');
                        return;
                    }
                    
                    try {
                        // Verify password by trying to decrypt
                        const quizData = await encryptionManager.decryptData(
                            quizRecord.encryptedData,
                            password
                        );
                        
                        resolve({
                            ...quizData,
                            dbId: quizRecord.id
                        });
                    } catch (error) {
                        console.error('Decryption error:', error);
                        reject('Invalid password or corrupted data');
                    }
                };
                
                request.onerror = (event) => {
                    console.error('Error loading quiz:', event.target.error);
                    reject('Failed to load quiz: ' + event.target.error);
                };
            });
        } catch (error) {
            console.error('Error in loadQuizDatabase:', error);
            throw error;
        }
    }

    // Save student response
    async saveStudentResponse(quizId, studentId, responses, responsePassword) {
        try {
            await this.init();
            
            const responseId = this.generateId();
            const randomPassword = encryptionManager.generateRandomPassword();
            
            // Encrypt responses with random password
            const encryptedResponses = await encryptionManager.encryptData(
                {
                    quizId,
                    studentId,
                    responses,
                    timestamp: new Date().toISOString()
                },
                randomPassword
            );
            
            // Encrypt the random password with teacher's response password
            const encryptedPassword = await encryptionManager.encryptData(
                { password: randomPassword },
                responsePassword
            );
            
            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction(['student_responses', 'response_passwords'], 'readwrite');
                const responseStore = transaction.objectStore('student_responses');
                const passwordStore = transaction.objectStore('response_passwords');
                
                const responseRecord = {
                    id: responseId,
                    quizId,
                    studentId: studentId || 'anonymous',
                    encryptedData: encryptedResponses.encrypted,
                    timestamp: new Date().toISOString(),
                    metadata: encryptedResponses.metadata
                };
                
                const passwordRecord = {
                    responseId,
                    encryptedPassword: encryptedPassword.encrypted,
                    passwordMetadata: encryptedPassword.metadata
                };
                
                // Save response
                const responseRequest = responseStore.add(responseRecord);
                
                responseRequest.onsuccess = () => {
                    // Save password after response is saved
                    const passwordRequest = passwordStore.add(passwordRecord);
                    
                    passwordRequest.onsuccess = () => {
                        resolve({
                            responseId,
                            downloadData: this.createDownloadableResponse(responseRecord, passwordRecord)
                        });
                    };
                    
                    passwordRequest.onerror = (event) => {
                        reject('Failed to save password: ' + event.target.error);
                    };
                };
                
                responseRequest.onerror = (event) => {
                    reject('Failed to save response: ' + event.target.error);
                };
                
                transaction.oncomplete = () => {
                    console.log('Response saved successfully');
                };
                
                transaction.onerror = (event) => {
                    console.error('Transaction error:', event.target.error);
                    reject('Transaction error: ' + event.target.error);
                };
            });
        } catch (error) {
            console.error('Error in saveStudentResponse:', error);
            throw error;
        }
    }

    // Load responses with password
    async loadResponses(password) {
        try {
            await this.init();
            
            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction(['student_responses', 'response_passwords'], 'readonly');
                const responseStore = transaction.objectStore('student_responses');
                const passwordStore = transaction.objectStore('response_passwords');
                
                const responsesRequest = responseStore.getAll();
                const passwordsRequest = passwordStore.getAll();
                
                let responses = [];
                let passwords = [];
                
                responsesRequest.onsuccess = async (event) => {
                    responses = event.target.result;
                    
                    passwordsRequest.onsuccess = async (event) => {
                        passwords = event.target.result;
                        
                        // Close transaction before async decryption
                        transaction.oncomplete = async () => {
                            try {
                                const decryptedResponses = [];
                                
                                for (const response of responses) {
                                    const passwordRecord = passwords.find(p => p.responseId === response.id);
                                    
                                    if (passwordRecord) {
                                        try {
                                            // Decrypt the response password first
                                            const passwordData = await encryptionManager.decryptData(
                                                passwordRecord.encryptedPassword,
                                                password
                                            );
                                            
                                            // Decrypt the response data
                                            const responseData = await encryptionManager.decryptData(
                                                response.encryptedData,
                                                passwordData.password
                                            );
                                            
                                            decryptedResponses.push(responseData);
                                        } catch (error) {
                                            console.warn('Failed to decrypt response:', error);
                                            // Skip responses that can't be decrypted
                                        }
                                    }
                                }
                                
                                resolve(decryptedResponses);
                            } catch (error) {
                                reject('Error decrypting responses: ' + error);
                            }
                        };
                    };
                    
                    passwordsRequest.onerror = (event) => {
                        reject('Failed to get passwords: ' + event.target.error);
                    };
                };
                
                responsesRequest.onerror = (event) => {
                    reject('Failed to get responses: ' + event.target.error);
                };
                
                transaction.onerror = (event) => {
                    reject('Transaction error: ' + event.target.error);
                };
            });
        } catch (error) {
            console.error('Error in loadResponses:', error);
            throw error;
        }
    }

    // Get all quiz databases (metadata only)
    async getAllQuizzes() {
        try {
            await this.init();
            
            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction(['quiz_databases'], 'readonly');
                const store = transaction.objectStore('quiz_databases');
                const request = store.getAll();
                
                request.onsuccess = (event) => {
                    const quizzes = event.target.result.map(quiz => ({
                        id: quiz.id,
                        name: quiz.name,
                        questionCount: quiz.questionCount,
                        createdAt: quiz.createdAt
                    }));
                    resolve(quizzes);
                };
                
                request.onerror = (event) => {
                    reject('Failed to get quizzes: ' + event.target.error);
                };
            });
        } catch (error) {
            console.error('Error in getAllQuizzes:', error);
            throw error;
        }
    }

    // Get first quiz ID (for demo)
    async getFirstQuizId() {
        const quizzes = await this.getAllQuizzes();
        return quizzes.length > 0 ? quizzes[0].id : null;
    }

    // Create downloadable response file
    createDownloadableResponse(responseRecord, passwordRecord) {
        const exportData = {
            response: responseRecord,
            password: passwordRecord,
            exportDate: new Date().toISOString(),
            version: '1.0'
        };
        
        return JSON.stringify(exportData, null, 2);
    }

    // Import quiz from file
    async importQuiz(file, password) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = async (event) => {
                try {
                    const quizData = JSON.parse(event.target.result);
                    const result = await this.saveQuizDatabase(quizData, password);
                    resolve(result);
                } catch (error) {
                    console.error('Import error:', error);
                    reject('Invalid quiz file: ' + error.message);
                }
            };
            
            reader.onerror = () => {
                reject('Failed to read file');
            };
            
            reader.readAsText(file);
        });
    }

    // Utility function to generate unique ID
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Clear all data (for testing)
    async clearAllData() {
        try {
            await this.init();
            
            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction(['quiz_databases', 'student_responses', 'response_passwords'], 'readwrite');
                
                const quizStore = transaction.objectStore('quiz_databases');
                const responseStore = transaction.objectStore('student_responses');
                const passwordStore = transaction.objectStore('response_passwords');
                
                const quizRequest = quizStore.clear();
                const responseRequest = responseStore.clear();
                const passwordRequest = passwordStore.clear();
                
                transaction.oncomplete = () => {
                    console.log('All data cleared');
                    resolve(true);
                };
                
                transaction.onerror = (event) => {
                    console.error('Error clearing data:', event.target.error);
                    reject('Error clearing data: ' + event.target.error);
                };
            });
        } catch (error) {
            console.error('Error in clearAllData:', error);
            throw error;
        }
    }
}

// Export singleton instance
const quizDatabase = new QuizDatabase();