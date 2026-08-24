// AuraMeet Edu - Live Speech Captions Module (Web Speech API)
class EduCaptions {
    constructor() {
        this.isListening = false;
        this.selectedLang = 'en-US';
        this.transcriptLog = [];
        this.recognition = null;
        this.init();
    }

    init() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            console.warn("SpeechRecognition API not supported in this browser.");
            return;
        }

        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = this.selectedLang;

        this.recognition.onresult = (event) => {
            let interim = '';
            let final = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const text = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    final += text + ' ';
                } else {
                    interim += text;
                }
            }

            if (final.trim()) {
                const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                this.transcriptLog.push({ text: final.trim(), timestamp });
                this.updateUI('', final.trim());
                if (window.eduAssistant) {
                    window.eduAssistant.updateTranscript(this.transcriptLog);
                }
            } else if (interim.trim()) {
                this.updateUI(interim, '');
            }
        };

        this.recognition.onerror = (err) => {
            console.error("Speech Recognition Error:", err);
            if (err.error === 'not-allowed') {
                this.stop();
            }
        };

        this.recognition.onend = () => {
            if (this.isListening) {
                try {
                    this.recognition.start();
                } catch (e) {}
            }
        };
    }

    toggle() {
        if (this.isListening) {
            this.stop();
        } else {
            this.start();
        }
    }

    start() {
        if (!this.recognition) return;
        try {
            this.recognition.lang = this.selectedLang;
            this.recognition.start();
            this.isListening = true;
            document.getElementById('edu-captions-bar')?.classList.remove('hidden');
            const btn = document.getElementById('toggle-captions-btn');
            if (btn) btn.classList.add('active');
        } catch (e) {
            console.error("Failed to start speech recognition:", e);
        }
    }

    stop() {
        if (!this.recognition) return;
        try {
            this.recognition.stop();
            this.isListening = false;
            document.getElementById('edu-captions-bar')?.classList.add('hidden');
            const btn = document.getElementById('toggle-captions-btn');
            if (btn) btn.classList.remove('active');
        } catch (e) {}
    }

    setLanguage(langCode) {
        this.selectedLang = langCode;
        if (this.isListening) {
            this.stop();
            setTimeout(() => this.start(), 300);
        }
    }

    updateUI(interim, final) {
        const displayEl = document.getElementById('edu-caption-text');
        if (!displayEl) return;

        if (final) {
            const recent = this.transcriptLog.slice(-2).map(t => `<p class="caption-line"><span class="caption-time">[${t.timestamp}]</span> ${t.text}</p>`).join('');
            displayEl.innerHTML = recent;
        } else if (interim) {
            displayEl.innerHTML += `<p class="caption-interim">${interim}...</p>`;
        }
    }
}

window.eduCaptions = new EduCaptions();
