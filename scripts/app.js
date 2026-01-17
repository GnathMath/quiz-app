class QuizApp {
    constructor() {
        this.currentQuiz = null;
        this.currentQuestionIndex = 0;
        this.studentAnswers = [];
        this.quizData = null;
        this.responsePassword = null;
        this.studentName = '';
        this.score = 0;
        this.totalQuestions = 0;
    }

    // Show screen
    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById(screenId).classList.add('active');
    }

    // Add question in teacher mode
    addQuestion(type) {
        const container = document.getElementById('questions-container');
        const questionId = Date.now() + Math.random().toString(36).substr(2, 5);
        
        let html = '';
        
        if (type === 'mcq') {
            html = `
                <div class="question-container" id="q_${questionId}">
                    <div class="question-header">
                        <h4><i class="fas fa-list-ol"></i> Multiple Choice Question</h4>
                        <div class="question-actions">
                            <button onclick="app.moveQuestionUp('q_${questionId}')">
                                <i class="fas fa-arrow-up"></i>
                            </button>
                            <button onclick="app.moveQuestionDown('q_${questionId}')">
                                <i class="fas fa-arrow-down"></i>
                            </button>
                            <button onclick="app.removeQuestion('q_${questionId}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    <textarea class="question-text" placeholder="Enter the question..." rows="3"></textarea>
                    <div class="mcq-options">
                        <div class="option-row">
                            <span class="option-label">A)</span>
                            <input type="text" class="option-input" placeholder="Option A" data-option="A">
                        </div>
                        <div class="option-row">
                            <span class="option-label">B)</span>
                            <input type="text" class="option-input" placeholder="Option B" data-option="B">
                        </div>
                        <div class="option-row">
                            <span class="option-label">C)</span>
                            <input type="text" class="option-input" placeholder="Option C" data-option="C">
                        </div>
                        <div class="option-row">
                            <span class="option-label">D)</span>
                            <input type="text" class="option-input" placeholder="Option D" data-option="D">
                        </div>
                    </div>
                    <div style="margin-top: 15px;">
                        <label>Correct Answer:</label>
                        <select class="correct-answer-select">
                            <option value="A">Option A</option>
                            <option value="B">Option B</option>
                            <option value="C">Option C</option>
                            <option value="D">Option D</option>
                        </select>
                    </div>
                    <div style="margin-top: 10px;">
                        <label>Points:</label>
                        <input type="number" class="points-input" value="1" min="1" style="width: 80px;">
                    </div>
                </div>
            `;
        } else if (type === 'fill') {
            html = `
                <div class="question-container" id="q_${questionId}">
                    <div class="question-header">
                        <h4><i class="fas fa-edit"></i> Fill in the Blank</h4>
                        <div class="question-actions">
                            <button onclick="app.moveQuestionUp('q_${questionId}')">
                                <i class="fas fa-arrow-up"></i>
                            </button>
                            <button onclick="app.moveQuestionDown('q_${questionId}')">
                                <i class="fas fa-arrow-down"></i>
                            </button>
                            <button onclick="app.removeQuestion('q_${questionId}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    <textarea class="question-text" placeholder="Enter the question (use _____ for blank)..." rows="3"></textarea>
                    <div style="margin-top: 15px;">
                        <label>Correct Answer:</label>
                        <input type="text" class="correct-answer-input" placeholder="Correct answer">
                    </div>
                    <div style="margin-top: 10px;">
                        <label>Alternative Answers (comma separated):</label>
                        <input type="text" class="alt-answers-input" placeholder="e.g., answer, Answer, ANSWER">
                    </div>
                    <div style="margin-top: 10px;">
                        <label>Points:</label>
                        <input type="number" class="points-input" value="1" min="1" style="width: 80px;">
                    </div>
                </div>
            `;
        } else if (type === 'tf') {
            html = `
                <div class="question-container" id="q_${questionId}">
                    <div class="question-header">
                        <h4><i class="fas fa-check-circle"></i> True/False</h4>
                        <div class="question-actions">
                            <button onclick="app.moveQuestionUp('q_${questionId}')">
                                <i class="fas fa-arrow-up"></i>
                            </button>
                            <button onclick="app.moveQuestionDown('q_${questionId}')">
                                <i class="fas fa-arrow-down"></i>
                            </button>
                            <button onclick="app.removeQuestion('q_${questionId}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    <textarea class="question-text" placeholder="Enter the statement..." rows="3"></textarea>
                    <div style="margin-top: 15px;">
                        <label>Correct Answer:</label>
                        <select class="correct-answer-select">
                            <option value="true">True</option>
                            <option value="false">False</option>
                        </select>
                    </div>
                    <div style="margin-top: 10px;">
                        <label>Points:</label>
                        <input type="number" class="points-input" value="1" min="1" style="width: 80px;">
                    </div>
                </div>
            `;
        }
        
        container.insertAdjacentHTML('beforeend', html);
        container.scrollTop = container.scrollHeight;
    }

    removeQuestion(id) {
        document.getElementById(id)?.remove();
    }

    moveQuestionUp(id) {
        const element = document.getElementById(id);
        const prev = element.previousElementSibling;
        if (prev) {
            element.parentNode.insertBefore(element, prev);
        }
    }

    moveQuestionDown(id) {
        const element = document.getElementById(id);
        const next = element.nextElementSibling;
        if (next) {
            element.parentNode.insertBefore(next, element);
        }
    }

    // Preview quiz before saving
    previewQuiz() {
        const questions = this.collectQuestions();
        if (questions.length === 0) {
            this.showToast('No questions added', 'error');
            return;
        }
        
        let preview = `Quiz Preview:\n\n`;
        questions.forEach((q, i) => {
            preview += `${i + 1}. ${q.text}\n`;
            if (q.type === 'mcq') {
                Object.entries(q.options).forEach(([key, value]) => {
                    preview += `   ${key}) ${value}\n`;
                });
                preview += `   Correct: ${q.correctAnswer}\n`;
            } else if (q.type === 'fill') {
                preview += `   Answer: ${q.correctAnswers[0]}\n`;
            } else if (q.type === 'tf') {
                preview += `   Answer: ${q.correctAnswer ? 'True' : 'False'}\n`;
            }
            preview += `   Points: ${q.points}\n\n`;
        });
        
        alert(preview);
    }

    // Collect all questions from form
    collectQuestions() {
        const questions = [];
        const containers = document.querySelectorAll('.question-container');
        
        containers.forEach(container => {
            const textarea = container.querySelector('.question-text');
            const pointsInput = container.querySelector('.points-input');
            
            if (!textarea || !textarea.value.trim()) return;
            
            const question = {
                id: container.id.replace('q_', ''),
                text: textarea.value.trim(),
                points: parseInt(pointsInput?.value || 1),
                type: this.getQuestionType(container)
            };
            
            // Get type-specific data
            if (question.type === 'mcq') {
                const options = {};
                container.querySelectorAll('.option-input').forEach(input => {
                    const option = input.dataset.option;
                    if (input.value.trim()) {
                        options[option] = input.value.trim();
                    }
                });
                
                const correctSelect = container.querySelector('.correct-answer-select');
                question.options = options;
                question.correctAnswer = correctSelect?.value || 'A';
                
            } else if (question.type === 'fill') {
                const correctInput = container.querySelector('.correct-answer-input');
                const altInput = container.querySelector('.alt-answers-input');
                
                const correctAnswers = [correctInput?.value?.trim() || ''];
                if (altInput?.value?.trim()) {
                    const alternatives = altInput.value.split(',').map(a => a.trim()).filter(a => a);
                    correctAnswers.push(...alternatives);
                }
                
                question.correctAnswers = correctAnswers;
                
            } else if (question.type === 'tf') {
                const correctSelect = container.querySelector('.correct-answer-select');
                question.correctAnswer = correctSelect?.value === 'true';
            }
            
            questions.push(question);
        });
        
        return questions;
    }

    getQuestionType(container) {
        const header = container.querySelector('h4');
        if (header.textContent.includes('Multiple Choice')) return 'mcq';
        if (header.textContent.includes('Fill')) return 'fill';
        if (header.textContent.includes('True/False')) return 'tf';
        return 'mcq';
    }

    // Save quiz as encrypted file
    async saveQuizFile() {
        const quizName = document.getElementById('quiz-name').value.trim();
        const quizPassword = document.getElementById('quiz-password').value;
        const responsePassword = document.getElementById('response-password').value;
        
        if (!quizName) {
            this.showToast('Please enter quiz name', 'error');
            return;
        }
        if (!quizPassword) {
            this.showToast('Please set quiz password', 'error');
            return;
        }
        if (!responsePassword) {
            this.showToast('Please set response password', 'error');
            return;
        }
        
        const questions = this.collectQuestions();
        if (questions.length === 0) {
            this.showToast('Please add at least one question', 'error');
            return;
        }
        
        try {
            // Prepare quiz data
            const quizData = {
                version: '1.0',
                name: quizName,
                questions: questions,
                responsePassword: responsePassword, // Encrypted along with quiz
                createdAt: new Date().toISOString(),
                metadata: {
                    totalPoints: questions.reduce((sum, q) => sum + q.points, 0),
                    questionCount: questions.length
                }
            };
            
            // Encrypt the quiz data
            const encryptedData = await fileEncryption.encrypt(quizData, quizPassword);
            
            // Create file content with header for identification
            const fileContent = JSON.stringify({
                type: 'QUIZ_FILE',
                version: '1.0',
                encryptedData: encryptedData,
                createdAt: new Date().toISOString()
            }, null, 2);
            
            // Download the file
            const filename = `${quizName.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.quiz`;
            fileEncryption.downloadFile(fileContent, filename, 'application/json');
            
            this.showToast(`Quiz file "${quizName}" downloaded!`, 'success');
            
            // Clear form
            document.getElementById('quiz-name').value = '';
            document.getElementById('quiz-password').value = '';
            document.getElementById('response-password').value = '';
            document.getElementById('questions-container').innerHTML = '';
            
            // Show instructions
            setTimeout(() => {
                alert(`Quiz file created successfully!\n\nInstructions:\n1. Share the .quiz file with students\n2. Give them the password: "${quizPassword}"\n3. Keep the response password secret: "${responsePassword}"\n\nStudents will need the quiz password to open the file.`);
            }, 1000);
            
        } catch (error) {
            console.error('Error saving quiz:', error);
            this.showToast('Failed to create quiz file', 'error');
        }
    }

    // Load quiz file (student)
    async loadQuizFile() {
        const fileInput = document.getElementById('quiz-file-input');
        const password = document.getElementById('student-password').value;
        
        if (!fileInput.files.length) {
            this.showToast('Please select a quiz file', 'error');
            return;
        }
        if (!password) {
            this.showToast('Please enter the quiz password', 'error');
            return;
        }
        
        try {
            const file = fileInput.files[0];
            
            // Read file
            const fileContent = await fileEncryption.readFile(file);
            const fileData = JSON.parse(fileContent);
            
            if (!fileData.encryptedData) {
                throw new Error('Invalid quiz file format');
            }
            
            // Decrypt the quiz data
            this.quizData = await fileEncryption.decrypt(fileData.encryptedData, password);
            this.responsePassword = this.quizData.responsePassword;
            
            // Initialize quiz
            this.currentQuestionIndex = 0;
            this.studentAnswers = new Array(this.quizData.questions.length).fill(null);
            this.totalQuestions = this.quizData.questions.length;
            this.score = 0;
            
            // Show quiz screen
            document.getElementById('quiz-title').textContent = this.quizData.name;
            document.getElementById('question-counter').textContent = `1/${this.totalQuestions}`;
            
            this.showScreen('quiz-screen');
            this.displayQuestion();
            
            this.showToast('Quiz loaded successfully!', 'success');
            
        } catch (error) {
            console.error('Error loading quiz:', error);
            this.showToast('Invalid password or corrupted file', 'error');
        }
    }

    // Display current question
    displayQuestion() {
        if (!this.quizData || this.currentQuestionIndex >= this.quizData.questions.length) {
            return;
        }
        
        const question = this.quizData.questions[this.currentQuestionIndex];
        const container = document.getElementById('question-display');
        
        // Update counter
        document.getElementById('question-counter').textContent = 
            `${this.currentQuestionIndex + 1}/${this.totalQuestions}`;
        
        let html = `
            <div class="question-card">
                <div class="question-text-large">
                    <strong>Q${this.currentQuestionIndex + 1}:</strong> ${question.text}
                </div>
        `;
        
        if (question.type === 'mcq') {
            html += `<div class="options-container">`;
            Object.entries(question.options).forEach(([key, value]) => {
                const isSelected = this.studentAnswers[this.currentQuestionIndex] === key;
                html += `
                    <button class="option-btn ${isSelected ? 'selected' : ''}" 
                            onclick="app.selectAnswer('${key}')">
                        <span class="option-letter">${key}</span>
                        ${value}
                    </button>
                `;
            });
            html += `</div>`;
            
        } else if (question.type === 'fill') {
            const currentAnswer = this.studentAnswers[this.currentQuestionIndex] || '';
            html += `
                <input type="text" class="fill-input" 
                       value="${currentAnswer}"
                       placeholder="Type your answer here..."
                       oninput="app.updateFillAnswer(this.value)">
            `;
            
        } else if (question.type === 'tf') {
            const currentAnswer = this.studentAnswers[this.currentQuestionIndex];
            html += `
                <div class="tf-options">
                    <button class="btn-primary ${currentAnswer === 'true' ? 'selected' : ''}" 
                            onclick="app.selectAnswer('true')">
                        <i class="fas fa-check"></i> True
                    </button>
                    <button class="btn-secondary ${currentAnswer === 'false' ? 'selected' : ''}" 
                            onclick="app.selectAnswer('false')">
                        <i class="fas fa-times"></i> False
                    </button>
                </div>
            `;
        }
        
        html += `</div>`;
        container.innerHTML = html;
        
        // Update navigation buttons
        this.updateNavigation();
    }

    // Handle answer selection
    selectAnswer(answer) {
        this.studentAnswers[this.currentQuestionIndex] = answer;
        this.displayQuestion();
    }

    updateFillAnswer(value) {
        this.studentAnswers[this.currentQuestionIndex] = value;
    }

    // Update navigation buttons
    updateNavigation() {
        const prevBtn = document.getElementById('prev-btn');
        const nextBtn = document.getElementById('next-btn');
        const finishBtn = document.getElementById('finish-btn');
        
        prevBtn.disabled = this.currentQuestionIndex === 0;
        
        if (this.currentQuestionIndex === this.totalQuestions - 1) {
            nextBtn.style.display = 'none';
            finishBtn.style.display = 'block';
        } else {
            nextBtn.style.display = 'block';
            finishBtn.style.display = 'none';
        }
    }

    // Next question
    nextQuestion() {
        if (this.currentQuestionIndex < this.totalQuestions - 1) {
            this.currentQuestionIndex++;
            this.displayQuestion();
        }
    }

    // Previous question
    prevQuestion() {
        if (this.currentQuestionIndex > 0) {
            this.currentQuestionIndex--;
            this.displayQuestion();
        }
    }

    // Finish quiz and show results
    finishQuiz() {
        // Calculate score
        let correct = 0;
        let totalPoints = 0;
        let earnedPoints = 0;
        
        this.quizData.questions.forEach((question, index) => {
            const studentAnswer = this.studentAnswers[index];
            totalPoints += question.points;
            
            if (studentAnswer) {
                let isCorrect = false;
                
                if (question.type === 'mcq') {
                    isCorrect = studentAnswer === question.correctAnswer;
                } else if (question.type === 'fill') {
                    isCorrect = question.correctAnswers.some(
                        ans => ans.toLowerCase().trim() === studentAnswer.toLowerCase().trim()
                    );
                } else if (question.type === 'tf') {
                    isCorrect = studentAnswer === question.correctAnswer.toString();
                }
                
                if (isCorrect) {
                    correct++;
                    earnedPoints += question.points;
                }
            }
        });
        
        this.score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
        
        // Display results
        document.getElementById('final-score').textContent = this.score;
        document.getElementById('correct-count').textContent = correct;
        document.getElementById('total-questions').textContent = this.totalQuestions;
        
        // Show detailed results
        const detailsContainer = document.getElementById('results-details');
        let detailsHtml = '<h4>Question Details:</h4>';
        
        this.quizData.questions.forEach((question, index) => {
            const studentAnswer = this.studentAnswers[index] || 'Not answered';
            let isCorrect = false;
            
            if (question.type === 'mcq') {
                isCorrect = studentAnswer === question.correctAnswer;
            } else if (question.type === 'fill') {
                isCorrect = question.correctAnswers.some(
                    ans => ans.toLowerCase().trim() === studentAnswer.toLowerCase().trim()
                );
            } else if (question.type === 'tf') {
                isCorrect = studentAnswer === question.correctAnswer.toString();
            }
            
            detailsHtml += `
                <div class="result-item ${isCorrect ? 'correct' : 'incorrect'}">
                    <strong>Q${index + 1}:</strong> ${question.text}<br>
                    <strong>Your Answer:</strong> ${studentAnswer}<br>
                    <strong>Correct Answer:</strong> ${question.type === 'mcq' ? question.correctAnswer : 
                                                      question.type === 'fill' ? question.correctAnswers[0] :
                                                      question.correctAnswer ? 'True' : 'False'}<br>
                    <strong>Points:</strong> ${isCorrect ? question.points : 0}/${question.points}
                </div>
            `;
        });
        
        detailsContainer.innerHTML = detailsHtml;
        
        // Show results screen
        this.showScreen('results-screen');
    }

    // Save response file
    async saveResponseFile() {
        if (!this.quizData || !this.responsePassword) {
            this.showToast('No quiz data found', 'error');
            return;
        }
        
        const studentName = document.getElementById('student-name').value.trim() || 'Anonymous';
        
        try {
            // Prepare response data
            const responseData = {
                version: '1.0',
                quizName: this.quizData.name,
                studentName: studentName,
                answers: this.studentAnswers,
                score: this.score,
                completedAt: new Date().toISOString(),
                metadata: {
                    totalQuestions: this.totalQuestions,
                    correctAnswers: this.studentAnswers.filter((answer, index) => {
                        const question = this.quizData.questions[index];
                        if (!answer) return false;
                        
                        if (question.type === 'mcq') {
                            return answer === question.correctAnswer;
                        } else if (question.type === 'fill') {
                            return question.correctAnswers.some(
                                ans => ans.toLowerCase().trim() === answer.toLowerCase().trim()
                            );
                        } else if (question.type === 'tf') {
                            return answer === question.correctAnswer.toString();
                        }
                        return false;
                    }).length
                }
            };
            
            // Encrypt response data
            const encryptedResponse = await fileEncryption.encrypt(responseData, this.responsePassword);
            
            // Create response file
            const fileContent = JSON.stringify({
                type: 'RESPONSE_FILE',
                version: '1.0',
                encryptedData: encryptedResponse,
                createdAt: new Date().toISOString()
            }, null, 2);
            
            // Download file
            const filename = `${this.quizData.name.replace(/[^a-z0-9]/gi, '_')}_${studentName}_${Date.now()}.response`;
            fileEncryption.downloadFile(fileContent, filename, 'application/json');
            
            this.showToast('Response file downloaded! Send to your teacher.', 'success');
            
        } catch (error) {
            console.error('Error saving response:', error);
            this.showToast('Failed to save response file', 'error');
        }
    }

    // Teacher: Open response file
    async openResponseFile() {
        const fileInput = document.getElementById('response-file-input');
        const password = document.getElementById('teacher-response-password').value;
        
        if (!fileInput.files.length) {
            this.showToast('Please select a response file', 'error');
            return;
        }
        if (!password) {
            this.showToast('Please enter the response password', 'error');
            return;
        }
        
        try {
            const file = fileInput.files[0];
            const fileContent = await fileEncryption.readFile(file);
            const fileData = JSON.parse(fileContent);
            
            if (!fileData.encryptedData) {
                throw new Error('Invalid response file');
            }
            
            // Decrypt response
            const responseData = await fileEncryption.decrypt(fileData.encryptedData, password);
            
            // Display response
            this.displayResponse(responseData);
            
            this.showToast('Response decrypted successfully!', 'success');
            
        } catch (error) {
            console.error('Error opening response:', error);
            this.showToast('Invalid password or corrupted file', 'error');
        }
    }

    // Display response for teacher
    displayResponse(responseData) {
        const container = document.getElementById('responses-container');
        
        const html = `
            <div class="response-card">
                <h3><i class="fas fa-user-graduate"></i> Student: ${responseData.studentName}</h3>
                <h4><i class="fas fa-file-alt"></i> Quiz: ${responseData.quizName}</h4>
                
                <div class="response-summary">
                    <p><i class="fas fa-calendar"></i> Completed: ${new Date(responseData.completedAt).toLocaleString()}</p>
                    <p><i class="fas fa-chart-line"></i> Score: ${responseData.score}%</p>
                    <p><i class="fas fa-check-circle"></i> Correct: ${responseData.metadata.correctAnswers}/${responseData.metadata.totalQuestions}</p>
                </div>
                
                <div class="response-answers">
                    <h4>Answers:</h4>
                    ${responseData.answers.map((answer, index) => `
                        <div class="answer-item">
                            <strong>Q${index + 1}:</strong> ${answer || 'Not answered'}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        container.innerHTML = html;
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
}

// Create global instance
const app = new QuizApp();

// Make functions available globally
window.app = app;
window.showScreen = (screenId) => app.showScreen(screenId);
window.addQuestion = (type) => app.addQuestion(type);
window.saveQuizFile = () => app.saveQuizFile();
window.loadQuizFile = () => app.loadQuizFile();
window.selectAnswer = (answer) => app.selectAnswer(answer);
window.updateFillAnswer = (value) => app.updateFillAnswer(value);
window.nextQuestion = () => app.nextQuestion();
window.prevQuestion = () => app.prevQuestion();
window.finishQuiz = () => app.finishQuiz();
window.saveResponseFile = () => app.saveResponseFile();
window.openResponseFile = () => app.openResponseFile();