// Save this as database-simple.js and replace the database.js reference in index.html
class SimpleDatabase {
    constructor() {
        this.storageKey = 'quizAppData';
    }
    
    async saveQuizDatabase(quizData, password) {
        try {
            const encryptedData = await encryptionManager.encryptData(quizData, password);
            
            // Get existing data
            let allData = JSON.parse(localStorage.getItem(this.storageKey) || '{"quizzes":[], "responses":[]}');
            
            const quizId = 'quiz_' + Date.now();
            
            allData.quizzes.push({
                id: quizId,
                name: quizData.name,
                encryptedData: encryptedData.encrypted,
                metadata: encryptedData.metadata,
                createdAt: new Date().toISOString()
            });
            
            localStorage.setItem(this.storageKey, JSON.stringify(allData));
            
            return {
                id: quizId,
                name: quizData.name
            };
        } catch (error) {
            console.error('Error saving quiz:', error);
            throw error;
        }
    }
    
    async loadQuizDatabase(quizId, password) {
        try {
            const allData = JSON.parse(localStorage.getItem(this.storageKey) || '{"quizzes":[], "responses":[]}');
            const quiz = allData.quizzes.find(q => q.id === quizId);
            
            if (!quiz) {
                throw new Error('Quiz not found');
            }
            
            const quizData = await encryptionManager.decryptData(quiz.encryptedData, password);
            return {
                ...quizData,
                dbId: quizId
            };
        } catch (error) {
            console.error('Error loading quiz:', error);
            throw error;
        }
    }
    
    async getAllQuizzes() {
        const allData = JSON.parse(localStorage.getItem(this.storageKey) || '{"quizzes":[], "responses":[]}');
        return allData.quizzes.map(quiz => ({
            id: quiz.id,
            name: quiz.name,
            createdAt: quiz.createdAt
        }));
    }
}

// Replace in index.html: change from quizDatabase to simpleDatabase
const simpleDatabase = new SimpleDatabase();