class QuizManager {
    constructor() {
        this.currentQuiz = null;
        this.currentQuestionIndex = 0;
        this.studentAnswers = [];
        this.studentId = null;
    }

    // Start a new quiz
    startQuiz(quizData, studentId = null) {
        this.currentQuiz = quizData;
        this.currentQuestionIndex = 0;
        this.studentAnswers = new Array(quizData.questions.length).fill(null);
        this.studentId = studentId || this.generateStudentId();
        
        return {
            quizName: quizData.name,
            totalQuestions: quizData.questions.length,
            studentId: this.studentId
        };
    }

    // Get current question
    getCurrentQuestion() {
        if (!this.currentQuiz || this.currentQuestionIndex >= this.currentQuiz.questions.length) {
            return null;
        }
        
        const question = this.currentQuiz.questions[this.currentQuestionIndex];
        return {
            ...question,
            number: this.currentQuestionIndex + 1,
            total: this.currentQuiz.questions.length
        };
    }

    // Submit answer for current question
    submitAnswer(answer) {
        if (this.currentQuestionIndex < this.currentQuiz.questions.length) {
            this.studentAnswers[this.currentQuestionIndex] = {
                questionId: this.currentQuiz.questions[this.currentQuestionIndex].id,
                answer: answer,
                timestamp: new Date().toISOString()
            };
            return true;
        }
        return false;
    }

    // Move to next question
    nextQuestion() {
        if (this.currentQuestionIndex < this.currentQuiz.questions.length - 1) {
            this.currentQuestionIndex++;
            return true;
        }
        return false;
    }

    // Move to previous question
    prevQuestion() {
        if (this.currentQuestionIndex > 0) {
            this.currentQuestionIndex--;
            return true;
        }
        return false;
    }

    // Check if quiz is complete
    isComplete() {
        return this.currentQuestionIndex >= this.currentQuiz.questions.length - 1;
    }

    // Get all answers
    getAllAnswers() {
        return {
            studentId: this.studentId,
            quizId: this.currentQuiz.dbId,
            quizName: this.currentQuiz.name,
            answers: this.studentAnswers,
            completedAt: new Date().toISOString(),
            score: this.calculateScore()
        };
    }

    // Calculate score
    calculateScore() {
        let correct = 0;
        let total = 0;
        
        this.currentQuiz.questions.forEach((question, index) => {
            const answer = this.studentAnswers[index];
            if (answer) {
                total++;
                if (this.checkAnswer(question, answer.answer)) {
                    correct++;
                }
            }
        });
        
        return {
            correct,
            total,
            percentage: total > 0 ? (correct / total) * 100 : 0
        };
    }

    // Check if answer is correct
    checkAnswer(question, studentAnswer) {
        if (question.type === 'mcq') {
            return studentAnswer === question.correctAnswer;
        } else if (question.type === 'fill') {
            // Case-insensitive comparison for fill in blanks
            const correctAnswers = question.correctAnswers.map(a => a.toLowerCase().trim());
            return correctAnswers.includes(studentAnswer.toLowerCase().trim());
        }
        return false;
    }

    // Generate student ID
    generateStudentId() {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substr(2, 5);
        return `STU_${timestamp}_${random}`.toUpperCase();
    }

    // Create question object
    createQuestion(type, data) {
        const question = {
            id: this.generateQuestionId(),
            type: type,
            text: data.text,
            points: data.points || 1,
            createdAt: new Date().toISOString()
        };
        
        if (type === 'mcq') {
            question.options = data.options;
            question.correctAnswer = data.correctAnswer;
        } else if (type === 'fill') {
            question.correctAnswers = data.correctAnswers || [data.correctAnswer];
            question.hint = data.hint || '';
        }
        
        return question;
    }

    generateQuestionId() {
        return 'Q_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
}

// Export singleton instance
const quizManager = new QuizManager();