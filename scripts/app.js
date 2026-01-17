class QuizApp {
    constructor() {
        this.currentScreen = 'splash-screen';
        this.quizDatabase = quizDatabase;
        this.quizManager = quizManager;
        this.currentQuizId = null;
        this.responsePassword = null;
    }

    // Initialize app
    init() {
        this.setupEventListeners();
        this.showScreen('splash-screen');
        this.updateOnlineStatus();
    }

    // Show specific screen
    showScreen(screenId) {
        // Hide all screens
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        
        // Show target screen
        const targetScreen = document.getElementById(screenId);
        if (targetScreen) {
            targetScreen.classList.add('active');
            this.currentScreen = screenId;
        }
        
        // Refresh data if needed
        if (screenId === 'view-responses') {
            this.clearResponsePassword();
        }
    }

    // Show mode selection
    showMode(mode) {
        if (mode === 'teacher') {
            this.showScreen('teacher-mode');
        } else if (mode === 'student') {
            this.showScreen('student-mode');
        }
    }

    // Add question to quiz
    addQuestion(type) {
        const container = document.getElementById('questions-container');
        const questionId = 'q' + Date.now();
        
        let questionHTML = '';
        
        if (type === 'mcq') {
            questionHTML = `
                <div class="question-container" id="${questionId}">
                    <div class="question-header">
                        <h4>Multiple Choice Question</h4>
                        <div class="question-actions">
                            <button onclick="moveQuestionUp('${questionId}')" class="btn-secondary">
                                <i class="fas fa-arrow-up"></i>
                            </button>
                            <button onclick="moveQuestionDown('${questionId}')" class="btn-secondary">
                                <i class="fas fa-arrow-down"></i>
                            </button>
                            <button onclick="removeQuestion('${questionId}')" class="btn-secondary">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Question Text:</label>
                        <textarea class="question-text" placeholder="Enter question text..." rows="3"></textarea>
                    </div>
                    <div class="form-group">
                        <label>Points:</label>
                        <input type="number" class="question-points" value="1" min="1">
                    </div>
                    <div class="mcq-options">
                        <div class="form-group">
                            <label>Option A:</label>
                            <input type="text" class="option-a" placeholder="Option A">
                        </div>
                        <div class="form-group">
                            <label>Option B:</label>
                            <input type="text" class="option-b" placeholder="Option B">
                        </div>
                        <div class="form-group">
                            <label>Option C:</label>
                            <input type="text" class="option-c" placeholder="Option C">
                        </div>
                        <div class="form-group">
                            <label>Option D:</label>
                            <input type="text" class="option-d" placeholder="Option D">
                        </div>
                        <div class="form-group">
                            <label>Correct Answer:</label>
                            <select class="correct-answer">
                                <option value="A">Option A</option>
                                <option value="B">Option B</option>
                                <option value="C">Option C</option>
                                <option value="D">Option D</option>
                            </select>
                        </div>
                    </div>
                </div>
            `;
        } else if (type === 'fill') {
            questionHTML = `
                <div class="question-container" id="${questionId}">
                    <div class="question-header">
                        <h4>Fill in the Blank</h4>
                        <div class="question-actions">
                            <button onclick="moveQuestionUp('${questionId}')" class="btn-secondary">
                                <i class="fas fa-arrow-up"></i>
                            </button>
                            <button onclick="moveQuestionDown('${questionId}')" class="btn-secondary">
                                <i class="fas fa-arrow-down"></i>
                            </button>
                            <button onclick="removeQuestion('${questionId}')" class="btn-secondary">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Question Text (use _____ for blank):</label>
                        <textarea class="question-text" placeholder="E.g., The capital of France is _____." rows="3"></textarea>
                    </div>
                    <div class="form-group">
                        <label>Points:</label>
                        <input type="number" class="question-points" value="1" min="1">
                    </div>
                    <div class="form-group">
                        <label>Correct Answer(s) (comma-separated if multiple):</label>
                        <input type="text" class="correct-answer" placeholder="E.g., Paris, paris, PARIS">
                    </div>
                    <div class="form-group">
                        <label>Hint (optional):</label>
                        <input type="text" class="question-hint" placeholder="Optional hint for students">
                    </div>
                </div>
            `;
        }
        
        container.insertAdjacentHTML('beforeend', questionHTML);
        container.scrollTop = container.scrollHeight;
    }

    // Remove question
    removeQuestion(questionId) {
        const question = document.getElementById(questionId);
        if (question) {
            question.remove();
        }
    }

    // Save quiz
    async saveQuiz() {
        const quizName = document.getElementById('quiz-name').value;
        const quizPassword = document.getElementById('quiz-password').value;
        const responsePassword = prompt('Set response encryption password:');
        
        if (!quizName || !quizPassword || !responsePassword) {
            this.showToast('Please fill all required fields', 'error');
            return;
        }
        
        const questions = [];
        const questionContainers = document.querySelectorAll('.question-container');
        
        questionContainers.forEach(container => {
            const questionText = container.querySelector('.question-text').value;
            const points = parseInt(container.querySelector('.question-points').value);
            
            if (container.querySelector('.correct-answer')) {
                const correctAnswer = container.querySelector('.correct-answer').value;
                
                if (container.querySelector('.option-a')) {
                    // MCQ
                    questions.push({
                        type: 'mcq',
                        text: questionText,
                        points: points,
                        options: {
                            A: container.querySelector('.option-a').value,
                            B: container.querySelector('.option-b').value,
                            C: container.querySelector('.option-c').value,
                            D: container.querySelector('.option-d').value
                        },
                        correctAnswer: correctAnswer
                    });
                } else {
                    // Fill in blank
                    questions.push({
                        type: 'fill',
                        text: questionText,
                        points: points,
                        correctAnswers: correctAnswer.split(',').map(a => a.trim()),
                        hint: container.querySelector('.question-hint')?.value || ''
                    });
                }
            }
        });
        
        if (questions.length === 0) {
            this.showToast('Please add at least one question', 'error');
            return;
        }
        
        try {
            const quizData = {
                name: quizName,
                questions: questions,
                responsePassword: responsePassword,
                createdAt: new Date().toISOString(),
                version: '1.0'
            };
            
            const result = await quizDatabase.saveQuizDatabase(quizData, quizPassword);
            
            this.showToast(`Quiz "${quizName}" saved successfully!`, 'success');
            
            // Clear form
            document.getElementById('quiz-name').value = '';
            document.getElementById('quiz-password').value = '';
            document.getElementById('questions-container').innerHTML = '';
            
            this.showScreen('teacher-mode');
            
        } catch (error) {
            this.showToast(`Error: ${error}`, 'error');
        }
    }

    // Load quiz for student
    async loadQuizForStudent() {
        const password = document.getElementById('db-password').value;
        
        if (!password) {
            this.showToast('Please enter the database password', 'error');
            return;
        }
        
        try {
            // Get all available quizzes
            const quizzes = await quizDatabase.getAllQuizzes();
            if (quizzes.length === 0) {
                this.showToast('No quizzes available', 'error');
                return;
            }
            
            // For demo, use the first quiz
            const quizId = quizzes[0].id;
            const quiz = await quizDatabase.loadQuizDatabase(quizId, password);
            
            if (quiz && quiz.responsePassword) {
                this.responsePassword = quiz.responsePassword;
            } else {
                // Use a default password for testing
                this.responsePassword = 'teacher123';
            }
            
            // Initialize quiz
            quizManager.startQuiz(quiz);
            
            // Show quiz container
            document.getElementById('quiz-container').style.display = 'block';
            document.getElementById('quiz-title').textContent = quiz.name;
            document.getElementById('total-questions').textContent = quiz.questions.length;
            
            this.displayCurrentQuestion();
            
            this.showToast('Quiz loaded successfully!', 'success');
            
        } catch (error) {
            console.error('Error loading quiz:', error);
            this.showToast(`Error: ${error}`, 'error');
        }
    }

    // Display current question
    displayCurrentQuestion() {
        const question = quizManager.getCurrentQuestion();
        if (!question) return;
        
        const container = document.getElementById('question-display');
        document.getElementById('current-question').textContent = question.number;
        
        let questionHTML = '';
        
        if (question.type === 'mcq') {
            questionHTML = `
                <div class="question-text">
                    <h4>${question.number}. ${question.text}</h4>
                    <p><small>Points: ${question.points}</small></p>
                </div>
                <div class="mcq-options">
                    ${Object.entries(question.options).map(([key, value]) => `
                        <div class="option" onclick="selectMCQOption('${key}')" id="option-${key}">
                            ${key}. ${value}
                        </div>
                    `).join('')}
                </div>
            `;
        } else if (question.type === 'fill') {
            questionHTML = `
                <div class="question-text">
                    <h4>${question.number}. ${question.text}</h4>
                    <p><small>Points: ${question.points}</small></p>
                    ${question.hint ? `<p class="hint"><small>Hint: ${question.hint}</small></p>` : ''}
                </div>
                <div class="form-group">
                    <label>Your Answer:</label>
                    <input type="text" class="fill-input" id="fill-answer" 
                           placeholder="Type your answer here...">
                </div>
            `;
        }
        
        container.innerHTML = questionHTML;
        
        // Restore previous answer if exists
        const currentAnswer = quizManager.studentAnswers[quizManager.currentQuestionIndex];
        if (currentAnswer) {
            if (question.type === 'mcq') {
                const option = document.getElementById(`option-${currentAnswer.answer}`);
                if (option) {
                    option.classList.add('selected');
                }
            } else if (question.type === 'fill') {
                const input = document.getElementById('fill-answer');
                if (input) {
                    input.value = currentAnswer.answer;
                }
            }
        }
        
        // Update navigation buttons
        this.updateNavigationButtons();
    }

    // Select MCQ option
    selectMCQOption(option) {
        // Remove selection from all options
        document.querySelectorAll('.option').forEach(opt => {
            opt.classList.remove('selected');
        });
        
        // Select current option
        const selectedOption = document.getElementById(`option-${option}`);
        if (selectedOption) {
            selectedOption.classList.add('selected');
        }
        
        // Save answer
        quizManager.submitAnswer(option);
    }

    // Update navigation buttons
    updateNavigationButtons() {
        const prevBtn = document.getElementById('prev-btn');
        const nextBtn = document.getElementById('next-btn');
        const submitBtn = document.getElementById('submit-btn');
        
        prevBtn.disabled = quizManager.currentQuestionIndex === 0;
        
        if (quizManager.isComplete()) {
            nextBtn.style.display = 'none';
            submitBtn.style.display = 'block';
        } else {
            nextBtn.style.display = 'block';
            submitBtn.style.display = 'none';
        }
    }

    // Next question
    nextQuestion() {
        const currentQuestion = quizManager.getCurrentQuestion();
        
        if (currentQuestion.type === 'fill') {
            const answer = document.getElementById('fill-answer').value;
            if (!answer.trim()) {
                this.showToast('Please enter an answer', 'error');
                return;
            }
            quizManager.submitAnswer(answer);
        }
        
        quizManager.nextQuestion();
        this.displayCurrentQuestion();
    }

    // Previous question
    prevQuestion() {
        quizManager.prevQuestion();
        this.displayCurrentQuestion();
    }

    // Submit quiz
    async submitQuiz() {
        const currentQuestion = quizManager.getCurrentQuestion();
        
        if (currentQuestion.type === 'fill') {
            const answer = document.getElementById('fill-answer').value;
            if (!answer.trim()) {
                this.showToast('Please enter an answer', 'error');
                return;
            }
            quizManager.submitAnswer(answer);
        }
        
        const answers = quizManager.getAllAnswers();
        
        try {
            const result = await quizDatabase.saveStudentResponse(
                answers.quizId,
                answers.studentId,
                answers.answers,
                this.responsePassword
            );
            
            // Download response file
            this.downloadResponse(result.downloadData, answers.quizName);
            
            this.showToast('Quiz submitted successfully!', 'success');
            
            // Reset quiz
            document.getElementById('quiz-container').style.display = 'none';
            document.getElementById('db-password').value = '';
            
            this.showScreen('student-mode');
            
        } catch (error) {
            this.showToast(`Error: ${error}`, 'error');
        }
    }

    // Download response file
    downloadResponse(data, quizName) {
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        
        const timestamp = new Date().toISOString().split('T')[0];
        a.href = url;
        a.download = `${quizName}_response_${timestamp}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // Load responses
    async loadResponses() {
        const password = document.getElementById('response-password').value;
        
        if (!password) {
            this.showToast('Please enter the response password', 'error');
            return;
        }
        
        try {
            const responses = await quizDatabase.loadResponses(password);
            this.displayResponses(responses);
            this.showToast(`Loaded ${responses.length} response(s)`, 'success');
        } catch (error) {
            this.showToast(`Error: ${error}`, 'error');
        }
    }

    // Display responses
    displayResponses(responses) {
        const container = document.getElementById('responses-container');
        
        if (responses.length === 0) {
            container.innerHTML = '<p class="no-responses">No responses found</p>';
            return;
        }
        
        let html = '';
        
        responses.forEach(response => {
            html += `
                <div class="response-item">
                    <div class="response-header">
                        <span>Student: ${response.studentId}</span>
                        <span>Date: ${new Date(response.timestamp).toLocaleDateString()}</span>
                    </div>
                    <div class="response-details">
                        <p>Quiz: ${response.quizName}</p>
                        <p>Score: ${response.score.correct}/${response.score.total} (${response.score.percentage.toFixed(1)}%)</p>
                        <div class="response-answers">
                            ${response.answers.map((answer, index) => `
                                <div class="response-answer">
                                    <strong>Q${index + 1}:</strong> ${answer.answer || 'No answer'}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
    }

    // Export quiz
    async exportQuiz() {
        const quizzes = await quizDatabase.getAllQuizzes();
        
        if (quizzes.length === 0) {
            this.showToast('No quizzes to export', 'error');
            return;
        }
        
        // For demo, export the first quiz
        const password = prompt('Enter quiz password to export:');
        if (!password) return;
        
        try {
            const quiz = await quizDatabase.loadQuizDatabase(quizzes[0].id, password);
            
            const exportData = {
                ...quiz,
                exportDate: new Date().toISOString(),
                version: '1.0'
            };
            
            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            
            a.href = url;
            a.download = `${quiz.name}_export_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            this.showToast('Quiz exported successfully!', 'success');
            
        } catch (error) {
            this.showToast(`Error: ${error}`, 'error');
        }
    }

    // Import quiz
    importQuiz() {
        document.getElementById('file-input').click();
    }

    // Handle file import
    async handleFileImport(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const password = prompt('Set password for imported quiz:');
        if (!password) return;
        
        try {
            const result = await quizDatabase.importQuiz(file, password);
            this.showToast(`Quiz "${result.name}" imported successfully!`, 'success');
        } catch (error) {
            this.showToast(`Error: ${error}`, 'error');
        }
        
        // Reset file input
        event.target.value = '';
    }

    // Clear response password
    clearResponsePassword() {
        document.getElementById('response-password').value = '';
        document.getElementById('responses-container').innerHTML = '';
    }

    // Show toast notification
    showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = `toast ${type}`;
        toast.classList.add('show');
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    // Update online status
    updateOnlineStatus() {
        const status = document.getElementById('offline-status');
        if (status) {
            if (navigator.onLine) {
                status.innerHTML = '<i class="fas fa-wifi"></i> Online';
                status.className = 'offline-status online';
            } else {
                status.innerHTML = '<i class="fas fa-wifi-slash"></i> Offline';
                status.className = 'offline-status offline';
            }
        }
    }

    // Setup event listeners
    setupEventListeners() {
        // File import
        document.getElementById('file-input').addEventListener('change', (e) => this.handleFileImport(e));
        
        // Online/offline events
        window.addEventListener('online', () => this.updateOnlineStatus());
        window.addEventListener('offline', () => this.updateOnlineStatus());
        
        // Initialize
        this.init();
    }
}

// Global functions for HTML onclick handlers
function showScreen(screenId) {
    app.showScreen(screenId);
}

function showMode(mode) {
    app.showMode(mode);
}

function addQuestion(type) {
    app.addQuestion(type);
}

function removeQuestion(questionId) {
    app.removeQuestion(questionId);
}

function moveQuestionUp(questionId) {
    const element = document.getElementById(questionId);
    const previous = element.previousElementSibling;
    if (previous) {
        element.parentNode.insertBefore(element, previous);
    }
}

function moveQuestionDown(questionId) {
    const element = document.getElementById(questionId);
    const next = element.nextElementSibling;
    if (next) {
        element.parentNode.insertBefore(next, element);
    }
}

function saveQuiz() {
    app.saveQuiz();
}

function loadQuizForStudent() {
    app.loadQuizForStudent();
}

function selectMCQOption(option) {
    app.selectMCQOption(option);
}

function nextQuestion() {
    app.nextQuestion();
}

function prevQuestion() {
    app.prevQuestion();
}

function submitQuiz() {
    app.submitQuiz();
}

function loadResponses() {
    app.loadResponses();
}

function exportQuiz() {
    app.exportQuiz();
}

function importQuiz() {
    app.importQuiz();
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new QuizApp();
});