// AuraMeet Edu - AI Lecture Assistant & Quiz Engine (Gemini AI Powered)
class EduAssistant {
    constructor() {
        this.transcriptLog = [];
        this.currentNotes = null;
        this.quizAnswers = {};
        this.isSpeaking = false;
        this.isPreset = false;
        this.debounceTimer = null;
        document.addEventListener('DOMContentLoaded', () => this.init());
    }

    init() {
        this.setInitialState();
        this.bindEvents();
    }

    setInitialState() {
        this.isPreset = false;
        this.currentNotes = {
            title: "Awaiting Live Classroom Lecture...",
            summary: "Turn on Live Speech Captions (💬) in the toolbar and start speaking. Gemini AI will analyze your live spoken words, filter speech noise, generate a clean summary, and build intelligent quiz questions on your exact topic!",
            keyTakeaways: [
                "Enable Live Speech Captions (💬) to begin recording.",
                "Speak clearly into your microphone during class.",
                "Or click one of the demo preset buttons below to preview sample notes."
            ],
            quiz: []
        };
        this.quizAnswers = {};
        this.render();
    }

    bindEvents() {
        const modal = document.getElementById('edu-ai-modal');
        const openBtns = [
            document.getElementById('toggle-ai-assistant-btn'),
            document.getElementById('edu-ai-dropdown-btn')
        ];

        openBtns.forEach(btn => {
            if (btn && modal) {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    modal.style.display = 'flex';
                    this.render();
                });
            }
        });
    }

    updateTranscript(log) {
        this.transcriptLog = log;
        if (!this.isPreset && log && log.length > 0) {
            if (this.debounceTimer) clearTimeout(this.debounceTimer);
            this.debounceTimer = setTimeout(() => {
                this.generateFromLiveTranscript(log);
            }, 1500); // 1.5s debounce for real-time speech analysis
        }
    }

    async generateFromLiveTranscript(log) {
        const fullText = log.map(item => item.text).join(' ');
        if (!fullText.trim()) return;

        // Show analyzing indicator if modal is visible
        const titleEl = document.getElementById('edu-ai-title');
        if (titleEl && !this.isPreset) {
            titleEl.innerText = "✨ Gemini AI Analyzing Spoken Lecture...";
        }

        try {
            const response = await fetch('/api/ai/analyze-lecture', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ transcript: fullText })
            });

            if (response.ok) {
                const aiData = await response.json();
                this.currentNotes = aiData;
                this.quizAnswers = {};
                this.render();
            } else {
                console.warn("AI endpoint returned status:", response.status);
            }
        } catch (err) {
            console.error("Failed to connect to AI lecture endpoint:", err);
        }
    }

    loadSample(type) {
        this.isPreset = true;
        if (type === 'ai') {
            this.currentNotes = {
                title: "Demo Preset: Artificial Intelligence & Neural Networks",
                summary: "This lecture provides a comprehensive overview of fundamental machine learning paradigms, contrasting supervised and unsupervised learning, and breaking down the mathematical foundation of neural network training via backpropagation.",
                keyTakeaways: [
                    "Supervised Learning requires labeled training data; Unsupervised Learning finds clusters in unlabeled data.",
                    "Neural Networks optimize weights using Gradient Descent and Backpropagation.",
                    "Cost functions measure model prediction error during training steps.",
                    "Practical Assignment: Implement a multi-layer perceptron classifier."
                ],
                quiz: [
                    { id: 1, question: "What is required for Supervised Learning?", options: ["Labeled datasets", "Unlabeled data only", "Zero training samples", "Quantum hardware"], correct: 0 },
                    { id: 2, question: "Which algorithm updates neural network weights during training?", options: ["K-Means Clustering", "Backpropagation & Gradient Descent", "Linear Search", "Bubble Sort"], correct: 1 },
                    { id: 3, question: "What is the primary role of a Cost Function?", options: ["Measure execution speed", "Calculate dataset size", "Quantify model prediction error", "Encrypt student data"], correct: 2 }
                ]
            };
        } else if (type === 'climate') {
            this.currentNotes = {
                title: "Demo Preset: UN SDG 13 Climate Action & Smart Tech",
                summary: "An in-depth analysis of sustainable technology solutions focusing on high-efficiency renewable energy systems, circular economy practices, and IoT-enabled microgrids for smart cities.",
                keyTakeaways: [
                    "Perovskite tandem cells have elevated solar panel efficiency beyond 24%.",
                    "Smart microgrids leverage real-time IoT sensor telemetry for dynamic load balancing.",
                    "Circular economy models prioritize waste-to-resource transformations.",
                    "SDG 13 mandates urgent global action to combat climate change."
                ],
                quiz: [
                    { id: 1, question: "Which component boosted solar cell efficiency past 24%?", options: ["Silicon carbide", "Perovskite tandem cells", "Lead acid", "Standard glass"], correct: 1 },
                    { id: 2, question: "How do smart microgrids balance energy load?", options: ["Manual diesel generators", "Real-time IoT sensors", "Random power cuts", "Analogue dials"], correct: 1 },
                    { id: 3, question: "Which UN Sustainable Development Goal targets Climate Action?", options: ["SDG 4", "SDG 7", "SDG 10", "SDG 13"], correct: 3 }
                ]
            };
        }
        this.quizAnswers = {};
        const resEl = document.getElementById('edu-quiz-result');
        if (resEl) resEl.style.display = 'none';
        this.render();
    }

    render() {
        if (!this.currentNotes) return;
        const titleEl = document.getElementById('edu-ai-title');
        const summaryEl = document.getElementById('edu-ai-summary');
        const takeawaysEl = document.getElementById('edu-ai-takeaways');
        const quizEl = document.getElementById('edu-ai-quiz');

        if (titleEl) titleEl.innerText = this.currentNotes.title;
        if (summaryEl) summaryEl.innerText = this.currentNotes.summary;

        if (takeawaysEl) {
            takeawaysEl.innerHTML = this.currentNotes.keyTakeaways.map((point, idx) => `
                <div class="edu-takeaway-item">
                    <span class="edu-badge">${idx + 1}</span>
                    <p style="color:#e2e8f0;margin:0;font-size:0.85rem;">${point}</p>
                </div>
            `).join('');
        }

        if (quizEl) {
            if (!this.currentNotes.quiz || this.currentNotes.quiz.length === 0) {
                quizEl.innerHTML = `<p style="color:#94a3b8;font-size:0.85rem;font-style:italic;">No quiz generated yet. Speak a few sentences with Live Speech Captions enabled or select a demo preset above.</p>`;
            } else {
                quizEl.innerHTML = this.currentNotes.quiz.map((q, idx) => `
                    <div class="edu-quiz-card">
                        <p class="edu-quiz-q"><strong>Q${idx + 1}.</strong> ${q.question}</p>
                        <div class="edu-quiz-options">
                            ${q.options.map((opt, optIdx) => `
                                <button class="btn btn-sm edu-quiz-opt ${this.quizAnswers[q.id] === optIdx ? 'selected' : ''}" 
                                    onclick="window.eduAssistant.selectQuizOpt(${q.id}, ${optIdx})">
                                    ${opt}
                                </button>
                            `).join('')}
                        </div>
                    </div>
                `).join('');
            }
        }
    }

    selectQuizOpt(qId, optIdx) {
        this.quizAnswers[qId] = optIdx;
        this.render();
    }

    checkScore() {
        if (!this.currentNotes || !this.currentNotes.quiz || this.currentNotes.quiz.length === 0) return;
        let score = 0;
        this.currentNotes.quiz.forEach(q => {
            if (this.quizAnswers[q.id] === q.correct) score += 1;
        });
        const resEl = document.getElementById('edu-quiz-result');
        if (resEl) {
            resEl.style.display = 'block';
            resEl.innerText = `Score: ${score} / ${this.currentNotes.quiz.length} Correct!`;
        }
    }

    speakSummary() {
        if (!('speechSynthesis' in window)) return;
        if (this.isSpeaking) {
            window.speechSynthesis.cancel();
            this.isSpeaking = false;
            return;
        }

        const text = `${this.currentNotes.title}. ${this.currentNotes.summary}`;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.onend = () => { this.isSpeaking = false; };
        window.speechSynthesis.speak(utterance);
        this.isSpeaking = true;
    }

    exportMarkdown() {
        const md = `# ${this.currentNotes.title}\n\n## Summary\n${this.currentNotes.summary}\n\n## Key Takeaways\n${this.currentNotes.keyTakeaways.map(t => `- ${t}`).join('\n')}\n\n---\nGenerated by AuraMeet Edu AI Assistant`;
        const blob = new Blob([md], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${this.currentNotes.title.replace(/\s+/g, '_')}_Notes.md`;
        a.click();
        URL.revokeObjectURL(url);
    }
}

window.eduAssistant = new EduAssistant();
