/**
 * Bootcamp TECHNOVA 2026 - Registration Logic
 * Premium Version with robust validation and smooth UX
 */

// --- CONFIGURATION ---
const supabaseUrl = 'https://qkvywqgnnfmgcbozaeqc.supabase.co';
const supabaseKey = 'sb_publishable_KoLXhGkTKB6kM70cnKZxyw_y_ZQQvCO'; 
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

// --- STATE MANAGEMENT ---
const STATE = {
    currentStep: 1,
    totalSteps: 4,
    isSubmitting: false,
    formData: {}
};

// --- QUIZ DATA ---
const QUIZ_DATA = [
    {
        category: "🔐 Cybersécurité",
        questions: [
            { q: "1. Un mot de passe sécurisé doit contenir :", options: ["Seulement des chiffres", "Lettres + chiffres + symboles", "Seulement des lettres"], correct: 1 },
            { q: "2. Le phishing est :", options: ["Un virus", "Une tentative de vol d'informations", "Un logiciel antivirus"], correct: 1 }
        ]
    },
    {
        category: "💻 Informatique générale",
        questions: [
            { q: "3. Que signifie 'CPU' ?", options: ["Central Processing Unit", "Computer Personal Unit", "Control Program Unit"], correct: 0 },
            { q: "4. Un système d'exploitation est :", options: ["Un logiciel de base", "Un jeu vidéo", "Un antivirus"], correct: 0 }
        ]
    }
];

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    initRealtimeValidation();
});

// --- NAVIGATION ---
function startForm() {
    transitionScreens('intro', 'form-container');
    updateProgress();
}

function transitionScreens(fromId, toId) {
    const fromEl = document.getElementById(fromId);
    const toEl = document.getElementById(toId);

    fromEl.style.opacity = '0';
    fromEl.style.transform = 'translateY(-20px)';

    setTimeout(() => {
        fromEl.classList.remove('active');
        fromEl.classList.add('hidden');
        
        toEl.classList.remove('hidden');
        toEl.style.display = 'block';
        
        // Force reflow
        toEl.offsetHeight;
        
        toEl.classList.add('active');
        toEl.style.opacity = '1';
        toEl.style.transform = 'translateY(0)';
    }, 400);
}

function updateProgress() {
    const progressPercent = ((STATE.currentStep - 1) / (STATE.totalSteps - 1)) * 100;
    const bar = document.getElementById('progress-bar');
    if (bar) {
        bar.style.width = `${progressPercent}%`;
        bar.setAttribute('aria-valuenow', progressPercent);
    }
    
    const stepNum = document.getElementById('current-step-num');
    if (stepNum) stepNum.textContent = STATE.currentStep;
}

function changeStep(direction) {
    if (direction === 1 && !validateCurrentStep()) return;

    const currentStepEl = document.querySelector(`.form-step[data-step="${STATE.currentStep}"]`);
    const nextStepNum = STATE.currentStep + direction;
    const nextStepEl = document.querySelector(`.form-step[data-step="${nextStepNum}"]`);

    if (!nextStepEl) return;

    // Transition steps
    currentStepEl.style.opacity = '0';
    currentStepEl.style.transform = 'translateY(-10px)';
    
    setTimeout(() => {
        currentStepEl.classList.remove('active');
        currentStepEl.classList.add('hidden');
        
        // Reset inline styles for the entering element
        nextStepEl.style.opacity = '';
        nextStepEl.style.transform = '';
        
        nextStepEl.classList.remove('hidden');
        nextStepEl.classList.add('active');
        
        STATE.currentStep = nextStepNum;
        updateProgress();
        
        // Scroll to top of form
        document.getElementById('app-container').scrollIntoView({ behavior: 'smooth' });
    }, 300);
}

// --- VALIDATION ---
function initRealtimeValidation() {
    const inputs = document.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        input.addEventListener('blur', () => validateField(input));
        input.addEventListener('input', () => {
            if (input.closest('.input-field').classList.contains('error')) {
                validateField(input);
            }
        });
    });
}

function validateField(input) {
    const fieldContainer = input.closest('.input-field') || input.closest('.terms-area');
    if (!fieldContainer) return true;

    let isValid = input.checkValidity();
    
    // Custom email validation
    if (input.type === 'email' && isValid) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        isValid = emailRegex.test(input.value);
    }

    if (!isValid) {
        fieldContainer.classList.add('error');
    } else {
        fieldContainer.classList.remove('error');
    }
    
    return isValid;
}

function validateCurrentStep() {
    const currentStepEl = document.querySelector(`.form-step[data-step="${STATE.currentStep}"]`);
    const inputs = currentStepEl.querySelectorAll('input[required], select[required], textarea[required]');
    let isStepValid = true;

    inputs.forEach(input => {
        if (!validateField(input)) {
            isStepValid = false;
        }
    });

    if (!isStepValid) {
        // Find first error and focus it
        const firstError = currentStepEl.querySelector('.input-field.error input, .input-field.error select, .input-field.error textarea');
        if (firstError) firstError.focus();
    }

    return isStepValid;
}

// --- SUBMISSION ---
const form = document.getElementById('multiStepForm');

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (!validateCurrentStep()) return;
    if (STATE.isSubmitting) return;

    setLoading(true);

    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    
    // Process multi-select domains
    data.domaines = Array.from(document.querySelectorAll('input[name="domaines"]:checked')).map(el => el.value);
    
    // Process checkbox engagement
    data.confirm = document.querySelector('input[name="confirm"]').checked;

    try {
        const { error } = await supabaseClient
            .from('registrations')
            .insert([{
                nom: data.nom,
                sexe: data.sexe,
                age: parseInt(data.age),
                phone: data.phone,
                email: data.email,
                ville: data.ville,
                niveau: data.niveau,
                ecole: data.ecole || null,
                motivation: data.motivation,
                experience: data.experience,
                attentes: data.attentes,
                domaines: data.domaines,
                dispo: data.dispo,
                active: data.active,
                confirm: data.confirm
            }]);

        if (error) throw error;

        // Success!
        transitionToQuiz();

    } catch (error) {
        console.error('Supabase Error:', error);
        showToast('Erreur lors de l\'inscription. Veuillez vérifier votre connexion.', 'error');
    } finally {
        setLoading(false);
    }
});

function setLoading(isLoading) {
    STATE.isSubmitting = isLoading;
    const btn = document.getElementById('submitBtn');
    if (isLoading) {
        btn.innerHTML = '<span class="loader"></span> Envoi en cours...';
        btn.disabled = true;
    } else {
        btn.innerHTML = "Finaliser l'inscription";
        btn.disabled = false;
    }
}

// --- QUIZ LOGIC ---
function transitionToQuiz() {
    transitionScreens('form-container', 'quizSection');
    renderQuiz();
}

function renderQuiz() {
    const container = document.getElementById('quizContent');
    if (!container) return;

    container.innerHTML = ""; 

    QUIZ_DATA.forEach((section, sIndex) => {
        let sectionHtml = `<div class="quiz-category">${section.category}</div>`;
        
        section.questions.forEach((q, qIndex) => {
            const inputName = `q_${sIndex}_${qIndex}`;
            sectionHtml += `
                <div class="q-block">
                    <p>${q.q}</p>
                    <div class="quiz-options">
                        ${q.options.map((opt, i) => `
                            <label>
                                <input type="radio" name="${inputName}" value="${i}"> 
                                <span>${opt}</span>
                            </label>
                        `).join('')}
                    </div>
                </div>
            `;
        });
        container.innerHTML += sectionHtml;
    });
}

function submitQuiz() {
    // Collect answers
    const answers = [];
    QUIZ_DATA.forEach((section, sIndex) => {
        section.questions.forEach((_, qIndex) => {
            const selected = document.querySelector(`input[name="q_${sIndex}_${qIndex}"]:checked`);
            answers.push(selected ? parseInt(selected.value) : null);
        });
    });

    // Check if all answered
    if (answers.includes(null)) {
        showToast('Veuillez répondre à toutes les questions avant de terminer.', 'warning');
        return;
    }

    showToast("Inscription et Quiz terminés ! Merci de votre participation.", "success");
    
    setTimeout(() => {
        // Rediriger ou rafraîchir
        window.location.reload();
    }, 3000);
}

// --- UTILS ---
function showToast(message, type = 'info') {
    // Simple alert for now, could be a custom toast component
    alert(message);
}