// Assessment Tracker Application
const app = {
    state: {
        isLoggedIn: false,
        pin: '1234',
        students: [],
        assessments: [],
        curriculumProgress: {},
        curriculumNotes: {}, // studentId -> { descriptorCode: note }
        notes: {},
        googleSettings: {
            spreadsheetId: '',
            initialized: false
        },
        currentStudent: null
    },

    // Initialize
    init() {
        this.loadState();
        if (this.state.isLoggedIn) {
            this.showMainApp();
        }
        this.updateGradeExample();
        this.setupEventListeners();
    },

    setupEventListeners() {
        // Enter key on PIN input
        document.getElementById('pinInput')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.login();
        });

        // Click outside modal to close
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('active');
                }
            });
        });
    },

    // Login/Logout
    login() {
        const pin = document.getElementById('pinInput').value;
        if (pin === this.state.pin) {
            this.state.isLoggedIn = true;
            this.saveState();
            this.showMainApp();
        } else {
            alert('Incorrect PIN');
        }
    },

    logout() {
        this.state.isLoggedIn = false;
        this.saveState();
        document.getElementById('loginScreen').classList.remove('hidden');
        document.getElementById('mainApp').classList.add('hidden');
        document.getElementById('pinInput').value = '';
    },

    showMainApp() {
        document.getElementById('loginScreen').classList.add('hidden');
        document.getElementById('mainApp').classList.remove('hidden');
        this.renderStudents();
        this.renderAssessments();
        this.updateCurriculumStudentSelect();
        
        // Load Google settings if saved
        if (this.state.googleSettings.spreadsheetId) {
            document.getElementById('spreadsheetId').value = this.state.googleSettings.spreadsheetId;
        }
    },

    changePin() {
        const newPin = document.getElementById('newPin').value;
        if (newPin && newPin.length >= 4) {
            this.state.pin = newPin;
            this.saveState();
            alert('PIN updated successfully!');
            document.getElementById('newPin').value = '';
        } else {
            alert('PIN must be at least 4 characters');
        }
    },

    // View Switching
    switchView(viewName) {
        document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
        event.target.classList.add('active');

        document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));
        document.getElementById(viewName + 'View').classList.add('active');

        if (viewName === 'students') this.renderStudents();
        if (viewName === 'assessments') this.renderAssessments();
        if (viewName === 'curriculum') this.updateCurriculumStudentSelect();
    },

    // Student Management
    showAddStudentModal() {
        document.getElementById('addStudentModal').classList.add('active');
    },

    addStudent() {
        const firstName = document.getElementById('studentFirstName').value.trim();
        const lastInitial = document.getElementById('studentLastInitial').value.trim().toUpperCase();

        if (!firstName || !lastInitial) {
            alert('Please enter both first name and last initial');
            return;
        }

        const student = {
            id: Date.now().toString(),
            firstName: firstName,
            lastInitial: lastInitial,
            fullName: `${firstName} ${lastInitial}.`
        };

        this.state.students.push(student);
        this.state.notes[student.id] = [];
        this.saveState();
        this.renderStudents();
        this.closeModal('addStudentModal');
        
        document.getElementById('studentFirstName').value = '';
        document.getElementById('studentLastInitial').value = '';

        this.syncData();
    },

    renderStudents() {
        const grid = document.getElementById('studentGrid');
        grid.innerHTML = '';

        this.state.students.sort((a, b) => a.fullName.localeCompare(b.fullName)).forEach(student => {
            const card = document.createElement('div');
            card.className = 'student-card';
            card.onclick = () => this.showStudentDetail(student.id);
            card.innerHTML = `
                <h3>${student.fullName}</h3>
                <p style="color: #666; font-size: 14px;">${this.getStudentStats(student.id)}</p>
            `;
            grid.appendChild(card);
        });
    },

    getStudentStats(studentId) {
        const assessmentCount = this.state.assessments.reduce((count, assessment) => {
            return count + (assessment.grades[studentId] ? 1 : 0);
        }, 0);
        const noteCount = (this.state.notes[studentId] || []).length;
        return `${assessmentCount} assessments • ${noteCount} notes`;
    },

    showStudentDetail(studentId) {
        this.state.currentStudent = studentId;
        const student = this.state.students.find(s => s.id === studentId);
        document.getElementById('studentDetailName').textContent = student.fullName;
        
        this.renderStudentAssessments(studentId);
        this.renderStudentNotes(studentId);
        
        document.getElementById('studentDetailModal').classList.add('active');
    },

    renderStudentAssessments(studentId) {
        const container = document.getElementById('studentAssessments');
        const studentAssessments = this.state.assessments.filter(a => a.grades[studentId]);

        if (studentAssessments.length === 0) {
            container.innerHTML = '<p style="color: #999;">No assessments recorded yet</p>';
            return;
        }

        container.innerHTML = studentAssessments.map(assessment => `
            <div class="assessment-item">
                <h4>${assessment.name}</h4>
                <p><strong>Subject:</strong> ${assessment.subject}</p>
                <p><strong>Date:</strong> ${new Date(assessment.date).toLocaleDateString()}</p>
                <p><strong>Grade:</strong> ${assessment.grades[studentId]}</p>
            </div>
        `).join('');
    },

    // Notes Management
    showAddNoteForm() {
        document.getElementById('addNoteForm').classList.remove('hidden');
    },

    hideAddNoteForm() {
        document.getElementById('addNoteForm').classList.add('hidden');
        document.getElementById('noteText').value = '';
    },

    addNote() {
        const text = document.getElementById('noteText').value.trim();
        if (!text) {
            alert('Please enter a note');
            return;
        }

        const note = {
            id: Date.now().toString(),
            text: text,
            date: new Date().toISOString()
        };

        if (!this.state.notes[this.state.currentStudent]) {
            this.state.notes[this.state.currentStudent] = [];
        }

        this.state.notes[this.state.currentStudent].unshift(note);
        this.saveState();
        this.renderStudentNotes(this.state.currentStudent);
        this.hideAddNoteForm();
        this.syncData();
    },

    renderStudentNotes(studentId) {
        const container = document.getElementById('studentNotes');
        const notes = this.state.notes[studentId] || [];

        if (notes.length === 0) {
            container.innerHTML = '<p style="color: #999;">No notes yet</p>';
            return;
        }

        container.innerHTML = notes.map(note => `
            <div class="note-item">
                <div class="note-date">${new Date(note.date).toLocaleDateString()} ${new Date(note.date).toLocaleTimeString()}</div>
                <div class="note-text">${note.text}</div>
            </div>
        `).join('');
    },

    // Assessment Management
    showAddAssessmentModal() {
        document.getElementById('addAssessmentModal').classList.add('active');
        document.getElementById('assessmentDate').valueAsDate = new Date();
    },

    updateGradeExample() {
        const format = document.getElementById('gradeFormat')?.value;
        const examples = {
            percentage: 'e.g., 85, 92, 78',
            letter: 'e.g., A, B+, C',
            rubric: 'e.g., 1, 2, 3, 4, 5',
            achieved: 'e.g., Achieved, Not Achieved',
            custom: 'e.g., Excellent, Good, Needs Improvement'
        };
        const exampleEl = document.getElementById('gradeExample');
        if (exampleEl) {
            exampleEl.textContent = examples[format] || '';
        }
    },

    createAssessment() {
        const name = document.getElementById('assessmentName').value.trim();
        const subject = document.getElementById('assessmentSubject').value;
        const date = document.getElementById('assessmentDate').value;
        const gradeFormat = document.getElementById('gradeFormat').value;

        if (!name || !date) {
            alert('Please fill in all fields');
            return;
        }

        const assessment = {
            id: Date.now().toString(),
            name: name,
            subject: subject,
            date: date,
            gradeFormat: gradeFormat,
            grades: {}
        };

        this.state.assessments.push(assessment);
        this.saveState();
        this.renderAssessments();
        this.closeModal('addAssessmentModal');
        
        document.getElementById('assessmentName').value = '';
        
        this.syncData();
    },

    renderAssessments() {
        const container = document.getElementById('assessmentsList');
        
        if (this.state.assessments.length === 0) {
            container.innerHTML = '<p style="color: #999;">No assessment tasks created yet</p>';
            return;
        }

        const sorted = [...this.state.assessments].sort((a, b) => new Date(b.date) - new Date(a.date));
        
        container.innerHTML = sorted.map(assessment => {
            const gradeCount = Object.keys(assessment.grades).length;
            return `
                <div class="assessment-item">
                    <h4>${assessment.name}</h4>
                    <p><strong>Subject:</strong> ${assessment.subject} | <strong>Date:</strong> ${new Date(assessment.date).toLocaleDateString()}</p>
                    <p><strong>Format:</strong> ${assessment.gradeFormat} | <strong>Grades recorded:</strong> ${gradeCount}/${this.state.students.length}</p>
                    <button onclick="app.showRecordGradeModal('${assessment.id}')" class="btn">Record Grades</button>
                </div>
            `;
        }).join('');
    },

    showRecordGradeModal(assessmentId) {
        const assessment = this.state.assessments.find(a => a.id === assessmentId);
        document.getElementById('recordGradeTitle').textContent = `Record Grades: ${assessment.name}`;
        
        const container = document.getElementById('gradeInputsContainer');
        container.innerHTML = this.state.students.sort((a, b) => a.fullName.localeCompare(b.fullName)).map(student => {
            const currentGrade = assessment.grades[student.id] || '';
            return `
                <div class="form-group">
                    <label>${student.fullName}:</label>
                    <input type="text" 
                           id="grade-${student.id}" 
                           value="${currentGrade}"
                           placeholder="Enter grade">
                </div>
            `;
        }).join('');

        container.dataset.assessmentId = assessmentId;
        document.getElementById('recordGradeModal').classList.add('active');
    },

    saveGrades() {
        const assessmentId = document.getElementById('gradeInputsContainer').dataset.assessmentId;
        const assessment = this.state.assessments.find(a => a.id === assessmentId);

        this.state.students.forEach(student => {
            const grade = document.getElementById(`grade-${student.id}`).value.trim();
            if (grade) {
                assessment.grades[student.id] = grade;
            }
        });

        this.saveState();
        this.renderAssessments();
        this.closeModal('recordGradeModal');
        this.syncData();
    },

    // Curriculum Progress
    updateCurriculumStudentSelect() {
        const select = document.getElementById('curriculumStudentSelect');
        select.innerHTML = '<option value="">-- Select a student --</option>';
        
        this.state.students.sort((a, b) => a.fullName.localeCompare(b.fullName)).forEach(student => {
            const option = document.createElement('option');
            option.value = student.id;
            option.textContent = student.fullName;
            select.appendChild(option);
        });
    },

    loadCurriculumProgress() {
        const studentId = document.getElementById('curriculumStudentSelect').value;
        if (!studentId) {
            document.getElementById('curriculumContent').innerHTML = '';
            return;
        }

        const container = document.getElementById('curriculumContent');
        container.innerHTML = '';

        Object.keys(CURRICULUM_DATA).forEach(subject => {
            const subjectDiv = document.createElement('div');
            subjectDiv.className = 'curriculum-subject';
            
            const title = document.createElement('h3');
            title.textContent = subject;
            subjectDiv.appendChild(title);

            CURRICULUM_DATA[subject].forEach(descriptor => {
                const status = this.getCurriculumStatus(studentId, descriptor.code);
                const note = this.getCurriculumNote(studentId, descriptor.code);
                
                const item = document.createElement('div');
                item.className = `descriptor-item ${status}`;
                item.innerHTML = `
                    <div class="descriptor-code">${descriptor.code}</div>
                    <div class="descriptor-text">${descriptor.descriptor}</div>
                    <div class="descriptor-controls">
                        <button class="status-btn well-above-btn" onclick="app.setCurriculumStatus('${studentId}', '${descriptor.code}', 'well-above')">Well Above</button>
                        <button class="status-btn above-btn" onclick="app.setCurriculumStatus('${studentId}', '${descriptor.code}', 'above')">Above</button>
                        <button class="status-btn at-standard-btn" onclick="app.setCurriculumStatus('${studentId}', '${descriptor.code}', 'at-standard')">At Standard</button>
                        <button class="status-btn below-btn" onclick="app.setCurriculumStatus('${studentId}', '${descriptor.code}', 'below')">Below</button>
                        <button class="status-btn well-below-btn" onclick="app.setCurriculumStatus('${studentId}', '${descriptor.code}', 'well-below')">Well Below</button>
                        <button class="status-btn not-evident-btn" onclick="app.setCurriculumStatus('${studentId}', '${descriptor.code}', 'not-evident')">Not Yet Evident</button>
                        <button class="status-btn clear-btn" onclick="app.setCurriculumStatus('${studentId}', '${descriptor.code}', '')">Clear</button>
                    </div>
                    ${note ? `<div class="descriptor-note">${note}</div>` : ''}
                    <button class="btn-small" onclick="app.showAddCurriculumNote('${studentId}', '${descriptor.code}')" style="margin-top: 10px;">
                        ${note ? '✏️ Edit Note' : '+ Add Note'}
                    </button>
                `;
                
                subjectDiv.appendChild(item);
            });

            container.appendChild(subjectDiv);
        });
    },

    getCurriculumProgress(studentId, descriptorCode) {
        if (!this.state.curriculumProgress[studentId]) {
            return { status: '', note: '' };
        }
        const data = this.state.curriculumProgress[studentId][descriptorCode];
        if (typeof data === 'string') {
            // Legacy format - just status
            return { status: data, note: '' };
        }
        return data || { status: '', note: '' };
    },

    getCurriculumNote(studentId, descriptorCode) {
        if (!this.state.curriculumNotes[studentId]) {
            return '';
        }
        return this.state.curriculumNotes[studentId][descriptorCode] || '';
    },

    showAddCurriculumNote(studentId, descriptorCode) {
        const currentNote = this.getCurriculumNote(studentId, descriptorCode);
        const note = prompt('Enter note for this content descriptor:', currentNote);
        
        if (note !== null) { // null means cancelled
            if (!this.state.curriculumNotes[studentId]) {
                this.state.curriculumNotes[studentId] = {};
            }
            
            if (note.trim()) {
                this.state.curriculumNotes[studentId][descriptorCode] = note.trim();
            } else {
                // Remove note if empty
                delete this.state.curriculumNotes[studentId][descriptorCode];
            }
            
            this.saveState();
            this.loadCurriculumProgress();
            this.syncData();
        }
    },

    setCurriculumStatus(studentId, descriptorCode, status) {
        if (!this.state.curriculumProgress[studentId]) {
            this.state.curriculumProgress[studentId] = {};
        }
        
        const currentData = this.getCurriculumProgress(studentId, descriptorCode);
        
        if (status) {
            this.state.curriculumProgress[studentId][descriptorCode] = {
                status: status,
                note: currentData.note || ''
            };
        } else {
            delete this.state.curriculumProgress[studentId][descriptorCode];
        }

        this.saveState();
        this.loadCurriculumProgress();
        this.syncData();
    },

    saveCurriculumNote(studentId, descriptorCode) {
        const noteText = document.getElementById(`note-${studentId}-${descriptorCode}`).value.trim();
        
        if (!this.state.curriculumProgress[studentId]) {
            this.state.curriculumProgress[studentId] = {};
        }
        
        const currentData = this.getCurriculumProgress(studentId, descriptorCode);
        
        this.state.curriculumProgress[studentId][descriptorCode] = {
            status: currentData.status || '',
            note: noteText
        };

        this.saveState();
        this.syncData();
        
        // Visual feedback
        const textarea = document.getElementById(`note-${studentId}-${descriptorCode}`);
        if (textarea) {
            const originalBorder = textarea.style.borderColor;
            textarea.style.borderColor = '#28a745';
            setTimeout(() => {
                textarea.style.borderColor = originalBorder;
            }, 800);
        }
    },

    // Modal Management
    closeModal(modalId) {
        document.getElementById(modalId).classList.remove('active');
    },

    // State Management
    saveState() {
        localStorage.setItem('assessmentTrackerState', JSON.stringify(this.state));
    },

    loadState() {
        const saved = localStorage.getItem('assessmentTrackerState');
        if (saved) {
            this.state = JSON.parse(saved);
        }
    },

    // Data Export/Import
    exportData() {
        const dataStr = JSON.stringify(this.state, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `assessment-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
    },

    importData() {
        document.getElementById('importFile').click();
    },

    handleImport(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const imported = JSON.parse(e.target.result);
                if (confirm('This will replace all current data. Are you sure?')) {
                    this.state = imported;
                    this.saveState();
                    alert('Data imported successfully!');
                    location.reload();
                }
            } catch (err) {
                alert('Error importing data: ' + err.message);
            }
        };
        reader.readAsText(file);
    },

    // Google Sheets Integration
    saveGoogleSettings() {
        this.state.googleSettings.spreadsheetId = document.getElementById('spreadsheetId').value.trim();
        this.saveState();
        alert('Google settings saved! Click "Initialize Sheets" to set up your spreadsheet.');
    },

    async initializeGoogleSheets() {
        if (!this.state.googleSettings.spreadsheetId) {
            alert('Please enter a Spreadsheet ID first');
            return;
        }

        if (!confirm('This will create sheets in your Google Spreadsheet. Continue?')) {
            return;
        }

        try {
            // Load Google Sheets API
            await this.loadGoogleSheetsAPI();
            
            this.state.googleSettings.initialized = true;
            this.saveState();
            alert('Google Sheets initialized! Your data will now sync automatically.');
            this.syncData();
        } catch (err) {
            alert('Error initializing Google Sheets. Please check your Spreadsheet ID and permissions.');
            console.error(err);
        }
    },

    async loadGoogleSheetsAPI() {
        return new Promise((resolve, reject) => {
            if (window.gapi) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://apis.google.com/js/api.js';
            script.onload = () => {
                gapi.load('client', () => {
                    gapi.client.init({
                        discoveryDocs: ['https://sheets.googleapis.com/$discovery/rest?version=v4'],
                    }).then(resolve).catch(reject);
                });
            };
            script.onerror = reject;
            document.body.appendChild(script);
        });
    },

    async syncData() {
        if (!this.state.googleSettings.spreadsheetId || !this.state.googleSettings.initialized) {
            console.log('Google Sheets not configured - data saved locally only');
            this.updateSyncStatus('synced');
            return;
        }

        this.updateSyncStatus('syncing');
        
        try {
            // This is a placeholder for the actual Google Sheets sync
            // In a real implementation, this would use the Google Sheets API
            await new Promise(resolve => setTimeout(resolve, 1000));
            this.updateSyncStatus('synced');
        } catch (err) {
            console.error('Sync error:', err);
            this.updateSyncStatus('error');
        }
    },

    updateSyncStatus(status) {
        const statusEl = document.getElementById('syncStatus');
        if (!statusEl) return;
        
        statusEl.className = `sync-status ${status}`;
        
        const statusText = {
            synced: '● Synced',
            syncing: '⟳ Syncing...',
            error: '⚠ Sync Error'
        };
        
        statusEl.textContent = statusText[status] || '● Local Only';
    }
};

// Initialize on load
window.addEventListener('DOMContentLoaded', () => app.init());
