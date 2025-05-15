document.addEventListener('DOMContentLoaded', function() {
    // Firebase configuration and initialization
    const firebaseConfig = {
        apiKey: "AIzaSyDnWA-iepD1CXH9sUGuyN5bWd5i_fM0MJo",
        authDomain: "ghanaelearn.firebaseapp.com",
        projectId: "ghanaelearn",
        storageBucket: "ghanaelearn.appspot.com",
        messagingSenderId: "111845940834",
        appId: "1:111845940834:web:95094b353f79775530fb3b",
        measurementId: "G-ENLMK15SJR"
    };

    // Initialize Firebase
    firebase.initializeApp(firebaseConfig);
    const db = firebase.firestore();
    const auth = firebase.auth();
    const analytics = firebase.analytics();

    // DOM Elements
    const navLinks = document.querySelectorAll('.navbar ul li a');
    const sections = document.querySelectorAll('.section');
    const mobileMenu = document.querySelector('.mobile-menu');
    const navbar = document.querySelector('.navbar');
    const loginLink = document.getElementById('login-link');
    const registerLink = document.getElementById('register-link');
    const loginModal = document.getElementById('login-modal');
    const registerModal = document.getElementById('register-modal');
    const paymentModal = document.getElementById('payment-modal');
    const closeModals = document.querySelectorAll('.close-modal');
    const switchToRegister = document.getElementById('switch-to-register');
    const switchToLogin = document.getElementById('switch-to-login');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const mobileMoneyForm = document.getElementById('mobile-money-form');
    const paystackBtn = document.getElementById('paystack-btn');
    const practiceLoadMore = document.getElementById('practice-load-more');
    const testNextBtn = document.getElementById('test-next-btn');
    const testSubmitBtn = document.getElementById('test-submit-btn');
    const testTimer = document.getElementById('test-timer');
    const testProgress = document.getElementById('test-progress');
    const testResultsContainer = document.getElementById('test-results-container');
    const questionUploadForm = document.getElementById('question-upload-form');
    const addOptionBtn = document.getElementById('add-option-btn');
    const adminTabs = document.querySelectorAll('.admin-tab');
    const adminContents = document.querySelectorAll('.admin-content');
    const paymentMethods = document.querySelectorAll('.payment-method');
    const paymentDetails = document.querySelectorAll('.payment-details');
    const takeTestBtn = document.getElementById('take-test-btn');
    const repeatQuestionsBtn = document.getElementById('repeat-questions-btn');
    const newQuestionsBtn = document.getElementById('new-questions-btn');
    const practiceSubjectBtns = document.querySelectorAll('#practice-subject-selection .subject-btn');
    const testSubjectBtns = document.querySelectorAll('#test-subject-selection .subject-btn');
    const loadingIndicator = document.createElement('div');
    
    // User state variables
    let currentUser = null;
    let isLoggedIn = false;
    let isPaidUser = false;

    // Practice questions variables
    let currentPracticeSet = 1;
    let totalPracticeSets = 0;
    let currentPracticeQuestions = [];
    let allPracticeQuestions = [];
    const questionsPerSet = 20;
    let practiceQuestionsCompleted = false;
    let currentPracticeSubject = 'social-studies';
    let practiceMode = 'untimed';
    let practiceTimeLeft = 0;
    let practiceTimerInterval;
    let userPracticeAnswers = {};
    let userSubjectProgress = {};

    // Test variables
    let testQuestions = [];
    let currentTestQuestion = 0;
    let userTestAnswers = [];
    let testTimeLeft = 0;
    let testTimerInterval;
    let currentTestSubject = 'social-studies';

    // Content Management Variables
    let currentAdminPage = 1;
    const adminItemsPerPage = 10;
    let allAdminQuestions = [];
    let filteredAdminQuestions = [];

    // Initialize Admin Portal
    function initAdminPortal() {
        loadAdminQuestionsFromFirebase();
        
        if (!document.getElementById('question-search').hasEventListener) {
            setupAdminEventListeners();
            document.getElementById('question-search').hasEventListener = true;
        }
    }

    // Load admin questions from Firebase
    function loadAdminQuestionsFromFirebase() {
        showLoadingIndicator();
        db.collection("questions").orderBy("createdAt", "desc").get()
            .then((querySnapshot) => {
                allAdminQuestions = [];
                querySnapshot.forEach((doc) => {
                    const question = doc.data();
                    question.id = doc.id;
                    allAdminQuestions.push(question);
                });
                filteredAdminQuestions = [...allAdminQuestions];
                loadAdminQuestions();
                hideLoadingIndicator();
            })
            .catch((error) => {
                console.error("Error getting questions: ", error);
                hideLoadingIndicator();
                alert("Error loading questions. Please try again.");
            });
    }

    // Set up admin event listeners
    function setupAdminEventListeners() {
        // Search and filter
        document.getElementById('question-search').addEventListener('input', filterAdminQuestions);
        document.getElementById('question-filter-subject').addEventListener('change', filterAdminQuestions);
        document.getElementById('question-filter-type').addEventListener('change', filterAdminQuestions);
        
        // Pagination
        document.getElementById('prev-page-btn').addEventListener('click', () => {
            if (currentAdminPage > 1) {
                currentAdminPage--;
                loadAdminQuestions();
            }
        });
        
        document.getElementById('next-page-btn').addEventListener('click', () => {
            const totalPages = Math.ceil(filteredAdminQuestions.length / adminItemsPerPage);
            if (currentAdminPage < totalPages) {
                currentAdminPage++;
                loadAdminQuestions();
            }
        });

        HTMLElement.prototype.hasEventListener = false;
        
        // Bulk upload
        document.getElementById('bulk-upload-btn').addEventListener('click', () => {
            showModal('bulk-upload-modal');
        });
        
        document.getElementById('bulk-upload-form').addEventListener('submit', handleBulkUpload);
    }

    // Filter questions based on search and filters
    function filterAdminQuestions() {
        const searchTerm = document.getElementById('question-search').value.toLowerCase();
        const subjectFilter = document.getElementById('question-filter-subject').value;
        const typeFilter = document.getElementById('question-filter-type').value;
        
        filteredAdminQuestions = allAdminQuestions.filter(q => {
            const matchesSearch = q.question.toLowerCase().includes(searchTerm) || 
                                (q.explanation && q.explanation.toLowerCase().includes(searchTerm));
            const matchesSubject = subjectFilter === 'all' || q.subject === subjectFilter;
            const matchesType = typeFilter === 'all' || q.type === typeFilter;
            
            return matchesSearch && matchesSubject && matchesType;
        });
        
        currentAdminPage = 1;
        loadAdminQuestions();
    }

    // Load questions for admin view
    function loadAdminQuestions() {
        const startIndex = (currentAdminPage - 1) * adminItemsPerPage;
        const endIndex = startIndex + adminItemsPerPage;
        const questionsToShow = filteredAdminQuestions.slice(startIndex, endIndex);
        
        const questionsList = document.getElementById('admin-questions-list');
        questionsList.innerHTML = '';
        
        if (questionsToShow.length === 0) {
            questionsList.innerHTML = '<div class="no-results">No questions found matching your criteria.</div>';
        } else {
            questionsToShow.forEach(q => {
                const questionEl = createAdminQuestionElement(q);
                questionsList.appendChild(questionEl);
            });
        }
        
        // Update pagination controls
        const totalPages = Math.ceil(filteredAdminQuestions.length / adminItemsPerPage);
        document.getElementById('page-info').textContent = `Page ${currentAdminPage} of ${totalPages}`;
        document.getElementById('prev-page-btn').disabled = currentAdminPage <= 1;
        document.getElementById('next-page-btn').disabled = currentAdminPage >= totalPages;
    }

    // Create question element for admin list
    function createAdminQuestionElement(question) {
        const questionEl = document.createElement('div');
        questionEl.className = 'question-list-item';
        questionEl.dataset.id = question.id;
        
        const subjectName = question.subject.split('-').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
        
        questionEl.innerHTML = `
            <span class="item-id">${question.id.substring(0, 8)}...</span>
            <span class="item-question">${question.question}</span>
            <span class="item-subject">${subjectName}</span>
            <span class="item-type">${question.type === 'practice' ? 'Practice' : 'Test'}</span>
            <span class="item-actions">
                <button class="btn-edit" data-id="${question.id}">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-delete" data-id="${question.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </span>
        `;
        
        questionEl.querySelector('.btn-edit').addEventListener('click', () => editQuestion(question.id));
        questionEl.querySelector('.btn-delete').addEventListener('click', () => deleteQuestion(question.id));
        
        return questionEl;
    }

    // Handle bulk upload
    function handleBulkUpload(e) {
        e.preventDefault();
        const fileInput = document.getElementById('bulk-file');
        const defaultSubject = document.getElementById('bulk-subject').value;
        const defaultType = document.getElementById('bulk-type').value;
        
        if (!fileInput.files.length) {
            alert('Please select a file to upload');
            return;
        }
        
        const file = fileInput.files[0];
        const reader = new FileReader();
        
        reader.onload = function(e) {
            const contents = e.target.result;
            const questions = parseCSV(contents, defaultSubject, defaultType);
            
            if (questions.length > 0) {
                const batch = db.batch();
                const questionsRef = db.collection("questions");
                
                questions.forEach(q => {
                    const newQuestionRef = questionsRef.doc();
                    batch.set(newQuestionRef, q);
                });
                
                batch.commit()
                    .then(() => {
                        alert(`Successfully uploaded ${questions.length} questions!`);
                        hideAllModals();
                        loadAdminQuestionsFromFirebase();
                    })
                    .catch(error => {
                        console.error("Error uploading questions: ", error);
                        alert("Error uploading questions. Please try again.");
                    });
            } else {
                alert('No valid questions found in the file.');
            }
        };
        
        reader.readAsText(file);
    }

    // Simple CSV parser
    function parseCSV(csvText, defaultSubject, defaultType) {
        const lines = csvText.split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        const questions = [];
        
        for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue;
            
            const values = lines[i].split(',');
            const question = {};
            
            for (let j = 0; j < headers.length; j++) {
                if (headers[j] && values[j]) {
                    question[headers[j]] = values[j].trim();
                }
            }
            
            const formattedQuestion = {
                question: question.question || '',
                subject: question.subject || defaultSubject,
                type: question.type || defaultType,
                options: [
                    question.option1 || '',
                    question.option2 || '',
                    question.option3 || question.option2 ? '' : undefined,
                    question.option4 || question.option3 ? '' : undefined
                ].filter(opt => opt !== undefined),
                correctAnswer: parseInt(question.correctAnswer) || 0,
                explanation: question.explanation || '',
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            if (question.imageUrl) formattedQuestion.image = question.imageUrl;
            if (question.audioUrl) formattedQuestion.audio = question.audioUrl;
            
            questions.push(formattedQuestion);
        }
        
        return questions;
    }

    // Edit question
    function editQuestion(questionId) {
        const question = allAdminQuestions.find(q => q.id === questionId);
        if (!question) return;
        
        document.getElementById('question-type').value = question.type;
        document.getElementById('question-text').value = question.question;
        document.getElementById('question-subject').value = question.subject;
        document.getElementById('question-explanation').value = question.explanation || '';
        document.getElementById('question-image').value = question.image || '';
        document.getElementById('question-audio').value = question.audio || '';
        
        const optionsContainer = document.querySelector('.options-container');
        optionsContainer.innerHTML = '';
        
        question.options.forEach((opt, i) => {
            const optionItem = document.createElement('div');
            optionItem.className = 'option-item';
            optionItem.innerHTML = `
                <input type="radio" name="correct-option" value="${i}" ${i === question.correctAnswer ? 'checked' : ''}>
                <input type="text" class="option-text" placeholder="Option ${i + 1}" value="${opt}" required>
            `;
            optionsContainer.appendChild(optionItem);
        });
        
        switchAdminTab('upload-questions');
        document.getElementById('question-upload-form').scrollIntoView({ behavior: 'smooth' });
        
        const form = document.getElementById('question-upload-form');
        form.dataset.editingId = questionId;
        form.querySelector('button[type="submit"]').textContent = 'Update Question';
    }

    // Delete question
    function deleteQuestion(questionId) {
        if (confirm('Are you sure you want to delete this question?')) {
            db.collection("questions").doc(questionId).delete()
                .then(() => {
                    allAdminQuestions = allAdminQuestions.filter(q => q.id !== questionId);
                    filteredAdminQuestions = filteredAdminQuestions.filter(q => q.id !== questionId);
                    loadAdminQuestions();
                })
                .catch(error => {
                    console.error("Error deleting question: ", error);
                    alert("Error deleting question. Please try again.");
                });
        }
    }

    // Load practice questions from Firebase
    function loadPracticeQuestionsFromFirebase(subject) {
        showLoadingIndicator();
        return db.collection("questions")
            .where("subject", "==", subject)
            .where("type", "==", "practice")
            .get()
            .then((querySnapshot) => {
                allPracticeQuestions = [];
                querySnapshot.forEach((doc) => {
                    const question = doc.data();
                    question.id = doc.id;
                    allPracticeQuestions.push(question);
                });
                totalPracticeSets = Math.ceil(allPracticeQuestions.length / questionsPerSet);
                currentPracticeSet = 1;
                loadPracticeQuestions();
                hideLoadingIndicator();
                updateProgressUI();
            })
            .catch((error) => {
                console.error("Error getting practice questions: ", error);
                hideLoadingIndicator();
                alert("Error loading practice questions. Please try again.");
            });
    }

    // Load test questions from Firebase
    function loadTestQuestionsFromFirebase(subject) {
        showLoadingIndicator();
        return db.collection("questions")
            .where("subject", "==", subject)
            .where("type", "==", "test")
            .get()
            .then((querySnapshot) => {
                testQuestions = [];
                querySnapshot.forEach((doc) => {
                    const question = doc.data();
                    question.id = doc.id;
                    testQuestions.push(question);
                });
                hideLoadingIndicator();
                startTest();
            })
            .catch((error) => {
                console.error("Error getting test questions: ", error);
                hideLoadingIndicator();
                alert("Error loading test questions. Please try again.");
            });
    }

    // Initialize the app
    function init() {
        // Check if user is logged in from Firebase Auth
        auth.onAuthStateChanged(user => {
            if (user) {
                // User is signed in
                currentUser = {
                    uid: user.uid,
                    email: user.email,
                    name: user.displayName || localStorage.getItem('ghanaELearnUserName') || 'User',
                    isPaid: localStorage.getItem('ghanaELearnUserPaid') === 'true'
                };
                isLoggedIn = true;
                isPaidUser = currentUser.isPaid;
                
                // Check if admin
                if (user.email === 'admin@ghanaelearn.com') {
                    document.getElementById('admin-nav-item').style.display = 'block';
                    
                    // If URL has #admin hash, show admin section immediately
                    if (window.location.hash === "#admin") {
                        showSection('admin-section', true);
                    }
                }
                
                updateAuthUI();
                loadUserProgress();
            } else {
                // User is signed out
                currentUser = null;
                isLoggedIn = false;
                isPaidUser = false;
                updateAuthUI();
            }
            
            // Initialize all practice questions
            loadPracticeQuestionsFromFirebase(currentPracticeSubject);
            
            // Set up event listeners
            setupEventListeners();
            
            // Show home section by default only if not showing admin section
            if (window.location.hash !== "#admin" || !(currentUser && currentUser.email === 'admin@ghanaelearn.com')) {
                showSection('home-section');
            }
        });
    }
    
    // Load user progress from Firestore
    function loadUserProgress() {
        if (!currentUser) return;
        
        db.collection("userProgress").doc(currentUser.uid).get()
            .then(doc => {
                if (doc.exists) {
                    userSubjectProgress = doc.data();
                } else {
                    const subjects = ['social-studies', 'mathematics', 'integrated-science', 'english'];
                    userSubjectProgress = {};
                    
                    subjects.forEach(subject => {
                        userSubjectProgress[subject] = {
                            totalQuestions: 0,
                            answered: 0,
                            correct: 0,
                            lastScore: 0,
                            bestScore: 0
                        };
                    });
                    
                    saveUserProgress();
                }
            })
            .catch(error => {
                console.error("Error loading user progress: ", error);
            });
    }
    
    // Save user progress to Firestore
    function saveUserProgress() {
        if (!currentUser) return;
        
        db.collection("userProgress").doc(currentUser.uid).set(userSubjectProgress)
            .catch(error => {
                console.error("Error saving user progress: ", error);
            });
    }
    
    // Update progress for a subject
    function updateSubjectProgress(subject, isCorrect) {
        if (!userSubjectProgress[subject]) {
            userSubjectProgress[subject] = {
                totalQuestions: 0,
                answered: 0,
                correct: 0,
                lastScore: 0,
                bestScore: 0
            };
        }
        
        userSubjectProgress[subject].answered++;
        if (isCorrect) {
            userSubjectProgress[subject].correct++;
        }
        
        const accuracy = Math.round((userSubjectProgress[subject].correct / userSubjectProgress[subject].answered) * 100);
        userSubjectProgress[subject].lastScore = accuracy;
        
        if (accuracy > userSubjectProgress[subject].bestScore) {
            userSubjectProgress[subject].bestScore = accuracy;
        }
        
        saveUserProgress();
        updateProgressUI();
    }
    
    // Update progress UI
    function updateProgressUI() {
        if (document.getElementById('practice-section').classList.contains('active')) {
            const progressContainer = document.createElement('div');
            progressContainer.className = 'progress-container';
            
            let html = `
                <h3>Your Progress in ${currentPracticeSubject.replace('-', ' ').toUpperCase()}</h3>
                <div class="progress-stats">
                    <div class="progress-item">
                        <span class="progress-label">Questions Answered:</span>
                        <span class="progress-value">${userSubjectProgress[currentPracticeSubject].answered}/${userSubjectProgress[currentPracticeSubject].totalQuestions}</span>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${(userSubjectProgress[currentPracticeSubject].answered / (userSubjectProgress[currentPracticeSubject].totalQuestions || 1)) * 100}%"></div>
                        </div>
                    </div>
                    <div class="progress-item">
                        <span class="progress-label">Accuracy:</span>
                        <span class="progress-value">${userSubjectProgress[currentPracticeSubject].lastScore}%</span>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${userSubjectProgress[currentPracticeSubject].lastScore}%"></div>
                        </div>
                    </div>
                    <div class="progress-item">
                        <span class="progress-label">Best Score:</span>
                        <span class="progress-value">${userSubjectProgress[currentPracticeSubject].bestScore}%</span>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${userSubjectProgress[currentPracticeSubject].bestScore}%"></div>
                        </div>
                    </div>
                </div>
            `;
            
            progressContainer.innerHTML = html;
            
            const existingProgress = document.querySelector('.progress-container');
            if (existingProgress) {
                existingProgress.remove();
            }
            
            const subjectSelection = document.querySelector('.subject-selection');
            if (subjectSelection) {
                subjectSelection.insertAdjacentElement('afterend', progressContainer);
            }
        }
    }

    // Set up event listeners
    function setupEventListeners() {
        // Navigation links
        navLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const sectionId = this.id.replace('-link', '-section');
                showSection(sectionId);
                navbar.classList.remove('active');
            });
        });
        
        // Footer navigation links
        document.querySelectorAll('.footer-home-link').forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                showSection('home-section');
            });
        });
        
        document.querySelectorAll('.footer-practice-link').forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                showSection('practice-section');
            });
        });
        
        document.querySelectorAll('.footer-test-link').forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                showSection('test-section');
            });
        });
        
        document.querySelectorAll('.footer-contact-link').forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                showSection('contact-section');
            });
        });
        
        // Mobile menu toggle
        mobileMenu.addEventListener('click', function() {
            navbar.classList.toggle('active');
        });
        
        // Modal controls
        loginLink.addEventListener('click', function(e) {
            e.preventDefault();
            showModal('login-modal');
        });
        
        registerLink.addEventListener('click', function(e) {
            e.preventDefault();
            showModal('register-modal');
        });
        
        closeModals.forEach(btn => {
            btn.addEventListener('click', function() {
                hideAllModals();
            });
        });
        
        switchToRegister.addEventListener('click', function(e) {
            e.preventDefault();
            hideAllModals();
            showModal('register-modal');
        });
        
        switchToLogin.addEventListener('click', function(e) {
            e.preventDefault();
            hideAllModals();
            showModal('login-modal');
        });
        
        // Auth links in notices
        document.getElementById('practice-register-link').addEventListener('click', function(e) {
            e.preventDefault();
            showModal('register-modal');
        });
        
        document.getElementById('practice-login-link').addEventListener('click', function(e) {
            e.preventDefault();
            showModal('login-modal');
        });
        
        document.getElementById('test-register-link').addEventListener('click', function(e) {
            e.preventDefault();
            showModal('register-modal');
        });
        
        document.getElementById('test-login-link').addEventListener('click', function(e) {
            e.preventDefault();
            showModal('login-modal');
        });
        
        // Hero buttons
        document.getElementById('hero-practice-btn').addEventListener('click', function(e) {
            e.preventDefault();
            showSection('practice-section');
        });
        
        document.getElementById('hero-test-btn').addEventListener('click', function(e) {
            e.preventDefault();
            showSection('test-section');
        });
        
        // Forms
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleLogin();
        });
        
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleRegister();
        });
        
        mobileMoneyForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleMobileMoneyPayment();
        });
        
        paystackBtn.addEventListener('click', function(e) {
            e.preventDefault();
            handlePaystackPayment();
        });
        
        // Practice questions
        practiceLoadMore.addEventListener('click', function() {
            if (!isLoggedIn) {
                showModal('register-modal');
                return;
            }
            
            if (!isPaidUser) {
                showModal('payment-modal');
                return;
            }
            
            loadMorePracticeQuestions();
        });
        
        // Test controls
        testNextBtn.addEventListener('click', function() {
            nextTestQuestion();
        });
        
        testSubmitBtn.addEventListener('click', function() {
            submitTest();
        });
        
        // Admin controls
        addOptionBtn.addEventListener('click', function() {
            addOptionField();
        });
        
        questionUploadForm.addEventListener('submit', function(e) {
            e.preventDefault();
            uploadQuestionToFirebase();
        });
        
        adminTabs.forEach(tab => {
            tab.addEventListener('click', function() {
                const tabId = this.getAttribute('data-tab');
                switchAdminTab(tabId);
            });
        });
        
        paymentMethods.forEach(method => {
            method.addEventListener('click', function() {
                const methodId = this.getAttribute('data-method');
                switchPaymentMethod(methodId);
            });
        });
        
        // Practice complete actions
        takeTestBtn.addEventListener('click', function(e) {
            e.preventDefault();
            showSection('test-section');
            loadTestQuestionsFromFirebase(currentPracticeSubject);
        });
        
        repeatQuestionsBtn.addEventListener('click', function(e) {
            e.preventDefault();
            repeatPracticeQuestions();
        });
        
        newQuestionsBtn.addEventListener('click', function(e) {
            e.preventDefault();
            loadNewPracticeQuestions();
        });
        
        // Subject selection buttons
        practiceSubjectBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                practiceSubjectBtns.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                currentPracticeSubject = this.getAttribute('data-subject');
                loadPracticeQuestionsFromFirebase(currentPracticeSubject);
            });
        });
        
        testSubjectBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                testSubjectBtns.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                currentTestSubject = this.getAttribute('data-subject');
                
                if (document.getElementById('test-section').classList.contains('active')) {
                    loadTestQuestionsFromFirebase(currentTestSubject);
                }
            });
        });

        // Admin link click handler
        const adminLink = document.getElementById('admin-link');
        if (adminLink) {
            adminLink.addEventListener('click', function(e) {
                e.preventDefault();
                showSection('admin-section');
                window.location.hash = "admin";
            });
        }
    }
    
    // Show loading indicator
    function showLoadingIndicator() {
        loadingIndicator.className = 'loading-indicator';
        loadingIndicator.innerHTML = '<div class="spinner"></div><p>Loading questions...</p>';
        loadingIndicator.style.display = 'flex';
        const container = document.getElementById('practice-questions-container');
        if (container) {
            container.innerHTML = '';
            container.appendChild(loadingIndicator);
        }
    }
    
    // Hide loading indicator
    function hideLoadingIndicator() {
        loadingIndicator.style.display = 'none';
    }
    
    // Show a specific section
    function showSection(sectionId, force = false) {
        // If trying to show admin section, verify admin status
        if (sectionId === 'admin-section' && !force) {
            if (!currentUser || currentUser.email !== 'admin@ghanaelearn.com') {
                showSection('home-section');
                alert('You must be an admin to access this section');
                return;
            }
        }
        
        // Hide all sections
        sections.forEach(section => {
            section.classList.remove('active');
        });
        
        // Show the requested section
        document.getElementById(sectionId).classList.add('active');
        
        // Update active nav link
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.id === sectionId.replace('-section', '-link')) {
                link.classList.add('active');
            }
        });
        
        // Special handling for sections
        if (sectionId === 'test-section') {
            loadTestQuestionsFromFirebase(currentTestSubject);
        } else if (sectionId === 'practice-section') {
            showLoadingIndicator();
            loadPracticeQuestionsFromFirebase(currentPracticeSubject);
        } else if (sectionId === 'admin-section') {
            initAdminPortal();
        } else {
            clearInterval(testTimerInterval);
            clearInterval(practiceTimerInterval);
        }
        
        // Scroll to top of the section
        document.getElementById(sectionId).scrollIntoView({ behavior: 'smooth' });
    }
    
    // Modal controls
    function showModal(modalId) {
        hideAllModals();
        document.getElementById(modalId).classList.add('active');
    }
    
    function hideAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('active');
        });
    }
    
    // Auth handlers
    function handleLogin() {
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        
        if (!email || !password) {
            alert('Please enter both email and password');
            return;
        }
        
        auth.signInWithEmailAndPassword(email, password)
            .then((userCredential) => {
                const user = userCredential.user;
                currentUser = {
                    uid: user.uid,
                    email: user.email,
                    name: user.displayName || localStorage.getItem('ghanaELearnUserName') || 'User',
                    isPaid: localStorage.getItem('ghanaELearnUserPaid') === 'true'
                };
                isLoggedIn = true;
                isPaidUser = currentUser.isPaid;
                
                if (user.email === 'admin@ghanaelearn.com') {
                    document.getElementById('admin-nav-item').style.display = 'block';
                }
                
                analytics.logEvent('login', { method: 'email' });
                
                if (isPaidUser) {
                    alert('Login successful! You have full access.');
                    hideAllModals();
                    updateAuthUI();
                    refreshQuestions();
                } else {
                    alert('Login successful! Please complete your payment for full access.');
                    hideAllModals();
                    showModal('payment-modal');
                    updateAuthUI();
                }
                
                loadUserProgress();
            })
            .catch((error) => {
                console.error("Login error: ", error);
                alert('Invalid email or password. Please try again.');
            });
    }
    
    function handleRegister() {
        const name = document.getElementById('register-name').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('register-confirm-password').value;
        const phone = document.getElementById('register-phone').value;
        
        if (!name || !email || !password || !confirmPassword) {
            alert('Please fill in all required fields');
            return;
        }
        
        if (password !== confirmPassword) {
            alert('Passwords do not match');
            return;
        }
        
        auth.createUserWithEmailAndPassword(email, password)
            .then((userCredential) => {
                const user = userCredential.user;
                
                return db.collection("users").doc(user.uid).set({
                    name: name,
                    email: email,
                    phone: phone,
                    isPaid: false,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            })
            .then(() => {
                currentUser = {
                    uid: auth.currentUser.uid,
                    email: email,
                    name: name,
                    phone: phone,
                    isPaid: false
                };
                isLoggedIn = true;
                
                localStorage.setItem('ghanaELearnUserName', name);
                localStorage.setItem('ghanaELearnUserPaid', 'false');
                
                analytics.logEvent('sign_up', { method: 'email' });
                
                if (window.innerWidth <= 768) {
                    hideAllModals();
                    showModal('login-modal');
                    alert('Registration successful! Please login with your credentials.');
                } else {
                    hideAllModals();
                    showModal('payment-modal');
                }
                updateAuthUI();
                
                loadUserProgress();
            })
            .catch((error) => {
                console.error("Registration error: ", error);
                if (error.code === 'auth/email-already-in-use') {
                    alert('This email is already registered. Please login instead.');
                    hideAllModals();
                    showModal('login-modal');
                } else {
                    alert('Registration failed. Please try again.');
                }
            });
    }
    
    function updateAuthUI() {
        if (isLoggedIn) {
            document.getElementById('login-link').style.display = 'none';
            document.getElementById('register-link').textContent = 'My Account';
            
            if (currentUser && currentUser.email === 'admin@ghanaelearn.com') {
                document.getElementById('register-link').addEventListener('click', function(e) {
                    e.preventDefault();
                    showSection('admin-section');
                    window.location.hash = "admin";
                });
            }
            
            document.querySelectorAll('.auth-notice').forEach(notice => {
                notice.style.display = 'none';
            });
        } else {
            document.getElementById('login-link').style.display = 'block';
            document.getElementById('register-link').textContent = 'Register';
            
            document.querySelectorAll('.auth-notice').forEach(notice => {
                notice.style.display = 'block';
            });
        }
    }
    
    // Payment handlers
    function handleMobileMoneyPayment() {
        const network = document.getElementById('mm-network').value;
        const number = document.getElementById('mm-number').value;
        
        if (!network || !number) {
            alert('Please select network and enter your mobile number');
            return;
        }
        
        simulatePaymentSuccess();
    }
    
    function handlePaystackPayment() {
        simulatePaymentSuccess();
    }
    
    function simulatePaymentSuccess() {
        db.collection("users").doc(currentUser.uid).update({
            isPaid: true,
            paymentDate: firebase.firestore.FieldValue.serverTimestamp()
        })
        .then(() => {
            isPaidUser = true;
            currentUser.isPaid = true;
            
            localStorage.setItem('ghanaELearnUserPaid', 'true');
            
            analytics.logEvent('purchase', { value: 50, currency: 'GHS' });
            
            alert('Payment successful! Thank you for subscribing.');
            hideAllModals();
            updateAuthUI();
            refreshQuestions();
        })
        .catch(error => {
            console.error("Error updating payment status: ", error);
            alert('Payment verification failed. Please try again.');
        });
    }
    
    function refreshQuestions() {
        if (document.getElementById('practice-section').classList.contains('active')) {
            loadPracticeQuestionsFromFirebase(currentPracticeSubject);
        }
        if (document.getElementById('test-section').classList.contains('active')) {
            loadTestQuestionsFromFirebase(currentTestSubject);
        }
    }
    
    function switchPaymentMethod(methodId) {
        paymentMethods.forEach(method => {
            method.classList.remove('active');
            if (method.getAttribute('data-method') === methodId) {
                method.classList.add('active');
            }
        });
        
        paymentDetails.forEach(detail => {
            detail.style.display = 'none';
            if (detail.id === `${methodId}-details`) {
                detail.style.display = 'block';
            }
        });
    }
    
    // Practice questions functions
    function updatePracticeStats() {
        if (document.getElementById('practice-stats')) {
            document.getElementById('questions-remaining').textContent = `Total Questions: ${allPracticeQuestions.length}`;
            document.getElementById('current-set').textContent = `Current Set: ${currentPracticeSet}/${totalPracticeSets}`;
        }
    }
    
    function startPracticeTimer() {
        clearInterval(practiceTimerInterval);
        practiceTimeLeft = 30 * 60;
        updatePracticeTimer();
        document.getElementById('practice-timer').style.display = 'block';
        practiceTimerInterval = setInterval(updatePracticeTimer, 1000);
    }
    
    function updatePracticeTimer() {
        if (practiceTimeLeft <= 0) {
            clearInterval(practiceTimerInterval);
            alert('Time is up! Your practice session has ended.');
            return;
        }
        
        practiceTimeLeft--;
        const minutes = Math.floor(practiceTimeLeft / 60);
        const seconds = practiceTimeLeft % 60;
        document.getElementById('practice-timer').textContent = `Time: ${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    }
    
    function loadPracticeQuestions() {
        const container = document.getElementById('practice-questions-container');
        container.innerHTML = '';
        
        if (!document.getElementById('practice-mode-selector')) {
            const modeSelector = document.createElement('div');
            modeSelector.className = 'practice-mode-selector';
            modeSelector.innerHTML = `
                <label for="practice-mode">Practice Mode:</label>
                <select id="practice-mode-selector">
                    <option value="untimed">Untimed</option>
                    <option value="timed">Timed (30 min)</option>
                </select>
                <span id="practice-timer" style="display: none;"></span>
            `;
            container.parentNode.insertBefore(modeSelector, container);
        }
        
        const startIndex = (currentPracticeSet - 1) * questionsPerSet;
        const endIndex = startIndex + questionsPerSet;
        currentPracticeQuestions = isPaidUser ? 
            allPracticeQuestions.slice(startIndex, endIndex) : 
            allPracticeQuestions.slice(0, 3);
        
        loadQuestionsLazily(currentPracticeQuestions, container, 'practice');
        
        if (currentPracticeSet >= totalPracticeSets && isPaidUser) {
            practiceQuestionsCompleted = true;
            document.getElementById('practice-actions').style.display = 'none';
            document.getElementById('practice-complete-actions').style.display = 'block';
        } else {
            practiceQuestionsCompleted = false;
            document.getElementById('practice-actions').style.display = 'block';
            document.getElementById('practice-complete-actions').style.display = 'none';
        }
        
        updatePracticeStats();
        updateProgressUI();
    }
    
    function loadQuestionsLazily(questions, container, type) {
        let loaded = 0;
        const batchSize = 5;
        
        const loadNextBatch = () => {
            const batchEnd = Math.min(loaded + batchSize, questions.length);
            
            for (let i = loaded; i < batchEnd; i++) {
                const questionEl = createQuestionElement(questions[i], i, type);
                container.appendChild(questionEl);
            }
            
            loaded = batchEnd;
            
            if (loaded < questions.length) {
                const loadMoreBtn = document.createElement('button');
                loadMoreBtn.className = 'btn-secondary load-more-batch';
                loadMoreBtn.textContent = 'Load More Questions';
                loadMoreBtn.addEventListener('click', () => {
                    loadMoreBtn.remove();
                    loadNextBatch();
                });
                
                container.appendChild(loadMoreBtn);
            }
        };
        
        loadNextBatch();
    }
    
    function loadMorePracticeQuestions() {
        if (!isLoggedIn) {
            showModal('register-modal');
            return;
        }
        
        if (!isPaidUser) {
            showModal('payment-modal');
            return;
        }
        
        if (practiceQuestionsCompleted) {
            document.getElementById('practice-actions').style.display = 'none';
            document.getElementById('practice-complete-actions').style.display = 'block';
            return;
        }
        
        currentPracticeSet++;
        loadPracticeQuestions();
        document.getElementById('practice-section').scrollIntoView({ behavior: 'smooth' });
    }
    
    function repeatPracticeQuestions() {
        loadPracticeQuestions();
        document.getElementById('practice-section').scrollIntoView({ behavior: 'smooth' });
    }
    
    function loadNewPracticeQuestions() {
        currentPracticeSet = 1;
        shuffleArray(allPracticeQuestions);
        loadPracticeQuestions();
        document.getElementById('practice-section').scrollIntoView({ behavior: 'smooth' });
    }
    
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
    
    function createQuestionElement(question, index, type) {
        const questionEl = document.createElement('div');
        questionEl.className = 'question-card';
        questionEl.dataset.id = question.id;
        
        let html = `
            <div class="question-text">${index + 1}. ${question.question}</div>
        `;
        
        if (question.image) {
            html += `
                <div class="question-image">
                    <img src="${question.image}" alt="Question image" loading="lazy">
                </div>
            `;
        }
        
        if (question.audio) {
            html += `
                <div class="question-audio">
                    <audio controls>
                        <source src="${question.audio}" type="audio/mpeg">
                        Your browser does not support the audio element.
                    </audio>
                </div>
            `;
        }
        
        html += `<div class="options-list">`;
        
        question.options.forEach((option, i) => {
            html += `
                <div class="option-item" data-correct="${i === question.correctAnswer}">
                    <input type="${type === 'test' ? 'radio' : 'checkbox'}" 
                           id="q${question.id}-opt${i}" 
                           name="q${question.id}" 
                           value="${i}">
                    <label for="q${question.id}-opt${i}">
                        <span class="option-text">${option}</span>
                        <span class="feedback-icon"></span>
                    </label>
                </div>
            `;
        });
        
        html += `</div>`;
        
        if (type === 'practice' && question.explanation) {
            html += `
                <div class="explanation">
                    <div class="explanation-title">Explanation:</div>
                    <p>${question.explanation}</p>
                </div>
            `;
        }
        
        questionEl.innerHTML = html;
        
        if (type === 'practice') {
            const inputs = questionEl.querySelectorAll('input[type="checkbox"]');
            inputs.forEach(input => {
                input.addEventListener('change', function() {
                    const optionItem = this.closest('.option-item');
                    const isCorrect = optionItem.dataset.correct === 'true';
                    const feedbackIcon = optionItem.querySelector('.feedback-icon');
                    
                    questionEl.querySelectorAll('.feedback-icon').forEach(icon => {
                        icon.innerHTML = '';
                        icon.className = 'feedback-icon';
                    });
                    
                    if (this.checked) {
                        if (isCorrect) {
                            feedbackIcon.innerHTML = '<i class="fas fa-check-circle"></i>';
                            feedbackIcon.className = 'feedback-icon correct';
                            updateSubjectProgress(currentPracticeSubject, true);
                        } else {
                            feedbackIcon.innerHTML = '<i class="fas fa-times-circle"></i>';
                            feedbackIcon.className = 'feedback-icon incorrect';
                            updateSubjectProgress(currentPracticeSubject, false);
                            
                            const correctOption = questionEl.querySelector('.option-item[data-correct="true"] .feedback-icon');
                            correctOption.innerHTML = '<i class="fas fa-check-circle"></i>';
                            correctOption.className = 'feedback-icon correct';
                        }
                        
                        const explanation = questionEl.querySelector('.explanation');
                        if (explanation) {
                            explanation.classList.add('show');
                        }
                    } else {
                        const anyChecked = Array.from(inputs).some(i => i.checked);
                        if (!anyChecked && explanation) {
                            explanation.classList.remove('show');
                        }
                    }
                });
            });
        }
        
        return questionEl;
    }
    
    // Test functions
    function startTest() {
        currentTestQuestion = 0;
        userTestAnswers = [];
        testTimeLeft = 15 * 60;
        testResultsContainer.classList.remove('show');
        document.getElementById('leaderboard-container').style.display = 'none';
        
        testQuestions = isPaidUser ? [...testQuestions] : testQuestions.slice(0, 3);
        
        loadTestQuestion();
        
        clearInterval(testTimerInterval);
        updateTestTimer();
        testTimerInterval = setInterval(updateTestTimer, 1000);
        
        updateTestButtons();
    }
    
    function loadTestQuestion() {
        const container = document.getElementById('test-questions-container');
        container.innerHTML = '';
        
        if (currentTestQuestion < testQuestions.length) {
            const question = testQuestions[currentTestQuestion];
            const questionEl = createQuestionElement(question, currentTestQuestion, 'test');
            container.appendChild(questionEl);
            
            testProgress.textContent = `Question ${currentTestQuestion + 1} of ${testQuestions.length}`;
        } else {
            submitTest();
        }
    }
    
    function nextTestQuestion() {
        const selectedOption = document.querySelector(`input[name="q${testQuestions[currentTestQuestion].id}"]:checked`);
        userTestAnswers[currentTestQuestion] = selectedOption ? parseInt(selectedOption.value) : null;
        
        currentTestQuestion++;
        
        loadTestQuestion();
        updateTestButtons();
    }
    
    function updateTestButtons() {
        if (currentTestQuestion === testQuestions.length - 1) {
            testNextBtn.style.display = 'none';
            testSubmitBtn.style.display = 'block';
        } else {
            testNextBtn.style.display = 'block';
            testSubmitBtn.style.display = 'none';
        }
    }
    
    function updateTestTimer() {
        if (testTimeLeft <= 0) {
            clearInterval(testTimerInterval);
            submitTest();
            return;
        }
        
        testTimeLeft--;
        const minutes = Math.floor(testTimeLeft / 60);
        const seconds = testTimeLeft % 60;
        testTimer.textContent = `Time: ${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    }
    
    function submitTest() {
        clearInterval(testTimerInterval);
        
        if (userTestAnswers[currentTestQuestion] === undefined) {
            const selectedOption = document.querySelector(`input[name="q${testQuestions[currentTestQuestion].id}"]:checked`);
            userTestAnswers[currentTestQuestion] = selectedOption ? parseInt(selectedOption.value) : null;
        }
        
        let score = 0;
        testQuestions.forEach((q, i) => {
            if (userTestAnswers[i] === q.correctAnswer) {
                score++;
            }
        });
        
        const percentage = Math.round((score / testQuestions.length) * 100);
        
        if (userSubjectProgress[currentTestSubject]) {
            userSubjectProgress[currentTestSubject].lastScore = percentage;
            if (percentage > userSubjectProgress[currentTestSubject].bestScore) {
                userSubjectProgress[currentTestSubject].bestScore = percentage;
            }
            saveUserProgress();
        }
        
        if (isLoggedIn && currentUser) {
            db.collection("testResults").add({
                userId: currentUser.uid,
                subject: currentTestSubject,
                score: percentage,
                totalQuestions: testQuestions.length,
                correctAnswers: score,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            })
            .catch(error => {
                console.error("Error saving test result: ", error);
            });
        }
        
        testResultsContainer.innerHTML = `
            <div class="result-summary">
                <h3>Test Completed!</h3>
                <div class="result-score">${percentage}%</div>
                <p>You answered ${score} out of ${testQuestions.length} questions correctly.</p>
            </div>
            <div class="result-details">
                <h4>Question Details</h4>
        `;
        
        testQuestions.forEach((q, i) => {
            const isCorrect = userTestAnswers[i] === q.correctAnswer;
            const userAnswer = userTestAnswers[i] !== null && userTestAnswers[i] !== undefined ? q.options[userTestAnswers[i]] : 'Not answered';
            const correctAnswer = q.options[q.correctAnswer];
            
            testResultsContainer.innerHTML += `
                <div class="result-item">
                    <div>
                        <strong>Q${i + 1}:</strong> ${q.question}<br>
                        <span class="${isCorrect ? 'text-success' : 'text-error'}">
                            Your answer: ${userAnswer} ${isCorrect ? '(Correct)' : '(Incorrect)'}
                        </span>
                    </div>
                    ${!isCorrect ? `<div>Correct answer: ${correctAnswer}</div>` : ''}
                </div>
            `;
        });
        
        if (isPaidUser) {
            testResultsContainer.innerHTML += `
                </div>
                <div class="test-actions" style="margin-top: 20px; justify-content: center;">
                    <button class="btn-primary" id="take-another-test-btn">Take Another Test</button>
                </div>
            `;
            
            document.getElementById('take-another-test-btn')?.addEventListener('click', function() {
                loadTestQuestionsFromFirebase(currentTestSubject);
                document.getElementById('test-section').scrollIntoView({ behavior: 'smooth' });
            });
        } else {
            testResultsContainer.innerHTML += `
                </div>
                <div class="test-actions" style="margin-top: 20px; justify-content: center;">
                    <button class="btn-primary" id="load-more-test-btn">Load More Questions</button>
                </div>
            `;
            
            document.getElementById('load-more-test-btn')?.addEventListener('click', function() {
                showModal('register-modal');
            });
        }
        
        testResultsContainer.classList.add('show');
        
        displayLeaderboard(percentage);
        
        if (percentage >= leaderboardData[19].score) {
            setTimeout(() => {
                alert("Congratulations! You are within the first 20. You now qualify for a reward. Customer care will contact you soon.");
            }, 1000);
        }
    }
    
    function displayLeaderboard(userScore) {
        const leaderboardContainer = document.getElementById('leaderboard-container');
        const leaderboard = document.getElementById('leaderboard');
        
        leaderboardContainer.style.display = 'block';
        leaderboard.innerHTML = '';
        
        db.collection("leaderboard")
            .orderBy("score", "desc")
            .limit(20)
            .get()
            .then((querySnapshot) => {
                const leaderboardData = [];
                querySnapshot.forEach((doc) => {
                    leaderboardData.push(doc.data());
                });
                
                if (currentUser && !leaderboardData.some(entry => entry.userId === currentUser.uid)) {
                    leaderboardData.push({
                        name: currentUser.name || "You",
                        score: userScore,
                        date: new Date().toISOString().split('T')[0],
                        isCurrentUser: true
                    });
                    leaderboardData.sort((a, b) => b.score - a.score);
                    leaderboardData.pop();
                }
                
                leaderboardData.forEach((entry, index) => {
                    const rankClass = index < 3 ? `rank-${index + 1}` : '';
                    const isCurrentUser = entry.isCurrentUser ? 'current-user' : '';
                    
                    leaderboard.innerHTML += `
                        <div class="leaderboard-entry ${rankClass} ${isCurrentUser}">
                            <div class="rank">${index + 1}</div>
                            <div class="name">${entry.name}</div>
                            <div class="score">${entry.score}%</div>
                            <div class="date">${entry.date}</div>
                        </div>
                    `;
                });
                
                setTimeout(() => {
                    leaderboardContainer.scrollIntoView({ behavior: 'smooth' });
                }, 500);
            })
            .catch(error => {
                console.error("Error loading leaderboard: ", error);
                leaderboard.innerHTML = '<div class="error">Error loading leaderboard. Please try again.</div>';
            });
    }
    
    // Admin functions
    function addOptionField() {
        const optionsContainer = document.querySelector('.options-container');
        const optionCount = optionsContainer.querySelectorAll('.option-item').length;
        
        if (optionCount >= 6) {
            alert('Maximum of 6 options allowed');
            return;
        }
        
        const newOption = document.createElement('div');
        newOption.className = 'option-item';
        newOption.innerHTML = `
            <input type="radio" name="correct-option" value="${optionCount}">
            <input type="text" class="option-text" placeholder="Option ${optionCount + 1}">
        `;
        
        optionsContainer.appendChild(newOption);
    }
    
   function uploadQuestionToFirebase() {
    const type = document.getElementById('question-type').value;
    const text = document.getElementById('question-text').value;
    const subject = document.getElementById('question-subject').value;
    const explanation = document.getElementById('question-explanation').value;
    const imageUrl = document.getElementById('question-image').value;
    const audioUrl = document.getElementById('question-audio').value;
    
    // Get options
    const optionItems = document.querySelectorAll('.option-item');
    const options = [];
    let correctAnswer = null;
    
    optionItems.forEach((item, index) => {
        const optionText = item.querySelector('.option-text').value;
        if (optionText) {
            options.push(optionText);
            
            // Check if this option is marked as correct
            const radio = item.querySelector('input[type="radio"]');
            if (radio.checked) {
                correctAnswer = index;
            }
        }
    });
    
    // Validation
    if (!type || !text || !subject || options.length < 2 || correctAnswer === null) {
        alert('Please fill all required fields and provide at least 2 options with one correct answer');
        return;
    }
    
    // Create new question object
    const newQuestion = {
        type: type,
        question: text,
        subject: subject,
        options: options,
        correctAnswer: correctAnswer,
        explanation: explanation || null,
        image: imageUrl || null,
        audio: audioUrl || null,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    // Show loading indicator
    const uploadButton = questionUploadForm.querySelector('button[type="submit"]');
    const originalButtonText = uploadButton.textContent;
    uploadButton.disabled = true;
    uploadButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';
    
    // Check if we're editing an existing question
    const isEditing = questionUploadForm.dataset.editingId;
    
    if (isEditing) {
        // Update existing question
        db.collection("questions").doc(isEditing).update(newQuestion)
            .then(() => {
                alert('Question updated successfully!');
                questionUploadForm.dataset.editingId = '';
                uploadButton.textContent = 'Upload Question';
                loadAdminQuestionsFromFirebase();
            })
            .catch(error => {
                console.error("Error updating question: ", error);
                alert("Error updating question. Please try again.");
            })
            .finally(() => {
                uploadButton.disabled = false;
                uploadButton.textContent = originalButtonText;
            });
    } else {
        // Add new question
        db.collection("questions").add(newQuestion)
            .then(() => {
                alert('Question uploaded successfully!');
                loadAdminQuestionsFromFirebase();
            })
            .catch(error => {
                console.error("Error uploading question: ", error);
                alert("Error uploading question. Please try again.");
            })
            .finally(() => {
                uploadButton.disabled = false;
                uploadButton.textContent = originalButtonText;
            });
    }
    
    // Reset form only on success (moved to .then() blocks)

        
        questionUploadForm.reset();
        document.querySelector('.options-container').innerHTML = `
            <div class="option-item">
                <input type="radio" name="correct-option" value="0" required>
                <input type="text" class="option-text" placeholder="Option 1" required>
            </div>
            <div class="option-item">
                <input type="radio" name="correct-option" value="1">
                <input type="text" class="option-text" placeholder="Option 2" required>
            </div>
        `;
    }
    
    function switchAdminTab(tabId) {
        adminTabs.forEach(tab => {
            tab.classList.remove('active');
            if (tab.getAttribute('data-tab') === tabId) {
                tab.classList.add('active');
            }
        });
        
        adminContents.forEach(content => {
            content.classList.remove('active');
            if (content.id === tabId) {
                content.classList.add('active');
            }
        });
    }
    
    // Initialize the app
    init();
});