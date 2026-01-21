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
            scriptUrl: '',
            lastSync: null
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
        if (this.state.googleSettings.scriptUrl) {
            document.getElementById('scriptUrl').value = this.state.googleSettings.scriptUrl;
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
        if (viewName === 'personal') this.updatePersonalStudentSelect();
    },

    // Student Management
    showAddStudentModal() {
        // Clear form for new student
        document.getElementById('editStudentId').value = '';
        document.getElementById('studentFirstName').value = '';
        document.getElementById('studentLastInitial').value = '';
        document.getElementById('studentNumber').value = '';
        document.getElementById('studentGender').value = '';
        document.getElementById('addStudentModalTitle').textContent = 'Add Student';
        
        document.getElementById('addStudentModal').classList.add('active');
    },

    addStudent() {
        const studentId = document.getElementById('editStudentId').value;
        const firstName = document.getElementById('studentFirstName').value.trim();
        const lastInitial = document.getElementById('studentLastInitial').value.trim().toUpperCase();
        const studentNumber = document.getElementById('studentNumber').value.trim();
        const gender = document.getElementById('studentGender').value;

        if (!firstName || !lastInitial) {
            alert('Please enter both first name and last initial');
            return;
        }

        if (studentId) {
            // Editing existing student
            const student = this.state.students.find(s => s.id === studentId);
            if (student) {
                student.firstName = firstName;
                student.lastInitial = lastInitial;
                student.fullName = `${firstName} ${lastInitial}.`;
                student.studentNumber = studentNumber;
                student.gender = gender;
            }
        } else {
            // Adding new student
            const student = {
                id: Date.now().toString(),
                firstName: firstName,
                lastInitial: lastInitial,
                fullName: `${firstName} ${lastInitial}.`,
                studentNumber: studentNumber,
                gender: gender
            };

            this.state.students.push(student);
            this.state.notes[student.id] = [];
        }

        this.saveState();
        this.renderStudents();
        this.closeModal('addStudentModal');
        
        // Clear form
        document.getElementById('editStudentId').value = '';
        document.getElementById('studentFirstName').value = '';
        document.getElementById('studentLastInitial').value = '';
        document.getElementById('studentNumber').value = '';
        document.getElementById('studentGender').value = '';

        this.syncData();
    },

    editStudent(studentId) {
        const student = this.state.students.find(s => s.id === studentId);
        if (!student) return;

        document.getElementById('editStudentId').value = student.id;
        document.getElementById('studentFirstName').value = student.firstName;
        document.getElementById('studentLastInitial').value = student.lastInitial;
        document.getElementById('studentNumber').value = student.studentNumber || '';
        document.getElementById('studentGender').value = student.gender || '';
        document.getElementById('addStudentModalTitle').textContent = 'Edit Student';
        
        document.getElementById('addStudentModal').classList.add('active');
    },

    deleteStudent(studentId) {
        const student = this.state.students.find(s => s.id === studentId);
        if (!student) return;

        if (!confirm(`Are you sure you want to delete ${student.fullName}? This will remove all their data including assessments, notes, and curriculum progress.`)) {
            return;
        }

        // Remove student
        this.state.students = this.state.students.filter(s => s.id !== studentId);
        
        // Remove associated data
        delete this.state.notes[studentId];
        delete this.state.curriculumProgress[studentId];
        delete this.state.personalEntries[studentId];
        
        // Remove from assessments
        this.state.assessments.forEach(assessment => {
            delete assessment.grades[studentId];
        });

        this.saveState();
        this.renderStudents();
        this.syncData();
    },

    renderStudents() {
        const grid = document.getElementById('studentGrid');
        grid.innerHTML = '';

        this.state.students.sort((a, b) => a.fullName.localeCompare(b.fullName)).forEach(student => {
            const card = document.createElement('div');
            card.className = 'student-card';
            card.innerHTML = `
                <h3>${student.fullName}</h3>
                ${student.studentNumber ? `<p style="color: #999; font-size: 12px;">ID: ${student.studentNumber}</p>` : ''}
                ${student.gender ? `<p style="color: #999; font-size: 12px;">${student.gender}</p>` : ''}
                <p style="color: #666; font-size: 14px;">${this.getStudentStats(student.id)}</p>
                <div class="student-card-actions">
                    <button class="btn-card-action" onclick="event.stopPropagation(); app.showStudentDetail('${student.id}')">View</button>
                    <button class="btn-card-action" onclick="event.stopPropagation(); app.editStudent('${student.id}')">Edit</button>
                    <button class="btn-card-action btn-card-delete" onclick="event.stopPropagation(); app.deleteStudent('${student.id}')">Delete</button>
                </div>
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

    deleteAssessment(assessmentId) {
        const assessment = this.state.assessments.find(a => a.id === assessmentId);
        if (!assessment) return;

        if (!confirm(`Are you sure you want to delete "${assessment.name}"? This will remove all recorded grades for this assessment.`)) {
            return;
        }

        this.state.assessments = this.state.assessments.filter(a => a.id !== assessmentId);
        this.saveState();
        this.renderAssessments();
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
                    <div class="assessment-actions">
                        <button onclick="app.showRecordGradeModal('${assessment.id}')" class="btn">Record Grades</button>
                        <button onclick="app.showAssessmentResults('${assessment.id}')" class="btn btn-secondary">View Results</button>
                        <button onclick="app.deleteAssessment('${assessment.id}')" class="btn btn-danger">Delete</button>
                    </div>
                </div>
            `;
        }).join('');
    },

    showAssessmentResults(assessmentId) {
        const assessment = this.state.assessments.find(a => a.id === assessmentId);
        if (!assessment) return;

        document.getElementById('assessmentResultsTitle').textContent = `${assessment.name} - Results`;
        
        // Create results table
        const studentsWithGrades = this.state.students
            .map(student => ({
                ...student,
                grade: assessment.grades[student.id] || 'Not recorded'
            }))
            .sort((a, b) => a.fullName.localeCompare(b.fullName));

        const tableHTML = `
            <table class="results-table">
                <thead>
                    <tr>
                        <th>Student</th>
                        ${studentsWithGrades[0]?.studentNumber ? '<th>Student ID</th>' : ''}
                        <th>Grade</th>
                    </tr>
                </thead>
                <tbody>
                    ${studentsWithGrades.map(student => `
                        <tr>
                            <td>${student.fullName}</td>
                            ${student.studentNumber ? `<td>${student.studentNumber}</td>` : ''}
                            <td class="${student.grade === 'Not recorded' ? 'no-grade' : 'has-grade'}">${student.grade}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            <div style="margin-top: 20px;">
                <p><strong>Subject:</strong> ${assessment.subject}</p>
                <p><strong>Date:</strong> ${new Date(assessment.date).toLocaleDateString()}</p>
                <p><strong>Grade Format:</strong> ${assessment.gradeFormat}</p>
                <p><strong>Completion:</strong> ${Object.keys(assessment.grades).length}/${this.state.students.length} students (${Math.round(Object.keys(assessment.grades).length / this.state.students.length * 100)}%)</p>
            </div>
        `;

        document.getElementById('assessmentResultsContent').innerHTML = tableHTML;
        document.getElementById('assessmentResultsModal').classList.add('active');
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
                const progressData = this.getCurriculumProgress(studentId, descriptor.code);
                const status = progressData.status;
                const note = progressData.note || '';
                
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
                    <div class="descriptor-note-section">
                        <textarea class="descriptor-note-input" id="note-${studentId}-${descriptor.code}" placeholder="Add notes about this descriptor..." rows="2">${note}</textarea>
                        <button class="btn-small" onclick="app.saveCurriculumNote('${studentId}', '${descriptor.code}')">Save Note</button>
                    </div>
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

    // Personal Tab Functions
    updatePersonalStudentSelect() {
        const select = document.getElementById('personalStudentSelect');
        if (!select) return;
        select.innerHTML = '<option value="">-- Select a student --</option>';
        
        this.state.students.sort((a, b) => a.fullName.localeCompare(b.fullName)).forEach(student => {
            const option = document.createElement('option');
            option.value = student.id;
            option.textContent = student.fullName;
            select.appendChild(option);
        });
    },

    loadPersonalEntries() {
        const studentId = document.getElementById('personalStudentSelect').value;
        if (!studentId) {
            document.getElementById('personalContent').innerHTML = '';
            return;
        }

        this.state.currentPersonalStudent = studentId;
        const student = this.state.students.find(s => s.id === studentId);
        
        if (!student) {
            document.getElementById('personalContent').innerHTML = '<p style="color: #999;">Student not found. Please try again.</p>';
            return;
        }
        
        if (!this.state.personalEntries[studentId]) {
            this.state.personalEntries[studentId] = {
                behaviour: [],
                events: [],
                social: [],
                interests: [],
                extracurricular: []
            };
        }

        const entries = this.state.personalEntries[studentId];
        
        const container = document.getElementById('personalContent');
        container.innerHTML = `
            <h2 style="margin-bottom: 20px; color: #667eea;">${student.fullName} - Personal Notes</h2>
            
            <div class="personal-section">
                <div class="personal-section-header">
                    <h3>Behaviour</h3>
                    <button class="btn" onclick="app.showAddPersonalEntry('behaviour')">+ Add Entry</button>
                </div>
                <div id="behaviour-entries" class="personal-entries">
                    ${this.renderPersonalEntries(entries.behaviour, 'behaviour')}
                </div>
            </div>

            <div class="personal-section">
                <div class="personal-section-header">
                    <h3>Events</h3>
                    <button class="btn" onclick="app.showAddPersonalEntry('events')">+ Add Entry</button>
                </div>
                <div id="events-entries" class="personal-entries">
                    ${this.renderPersonalEntries(entries.events, 'events')}
                </div>
            </div>

            <div class="personal-section">
                <div class="personal-section-header">
                    <h3>Social</h3>
                    <button class="btn" onclick="app.showAddPersonalEntry('social')">+ Add Entry</button>
                </div>
                <div id="social-entries" class="personal-entries">
                    ${this.renderPersonalEntries(entries.social, 'social')}
                </div>
            </div>

            <div class="personal-section">
                <div class="personal-section-header">
                    <h3>Interests</h3>
                    <button class="btn" onclick="app.showAddPersonalEntry('interests')">+ Add Entry</button>
                </div>
                <div id="interests-entries" class="personal-entries">
                    ${this.renderPersonalEntries(entries.interests, 'interests')}
                </div>
            </div>

            <div class="personal-section">
                <div class="personal-section-header">
                    <h3>Extra-Curricular</h3>
                    <button class="btn" onclick="app.showAddPersonalEntry('extracurricular')">+ Add Entry</button>
                </div>
                <div id="extracurricular-entries" class="personal-entries">
                    ${this.renderPersonalEntries(entries.extracurricular, 'extracurricular')}
                </div>
            </div>
        `;
    },

    renderPersonalEntries(entries, category) {
        if (!entries || entries.length === 0) {
            return '<p style="color: #999; font-style: italic;">No entries yet</p>';
        }

        return entries.sort((a, b) => new Date(b.lastEdited || b.date) - new Date(a.lastEdited || a.date)).map(entry => {
            const created = new Date(entry.date);
            const edited = entry.lastEdited ? new Date(entry.lastEdited) : null;
            const dateText = edited 
                ? `Created: ${created.toLocaleDateString()} ${created.toLocaleTimeString()} | Last edited: ${edited.toLocaleDateString()} ${edited.toLocaleTimeString()}`
                : `Created: ${created.toLocaleDateString()} ${created.toLocaleTimeString()}`;
            
            return `
                <div class="personal-entry">
                    <div class="personal-entry-header">
                        <span class="personal-entry-date">${dateText}</span>
                        <div>
                            <button class="btn-edit" onclick="app.editPersonalEntry('${category}', '${entry.id}')">Edit</button>
                            <button class="btn-delete" onclick="app.deletePersonalEntry('${category}', '${entry.id}')">Delete</button>
                        </div>
                    </div>
                    <div class="personal-entry-text">${entry.text}</div>
                </div>
            `;
        }).join('');
    },

    showAddPersonalEntry(category) {
        const categoryNames = {
            behaviour: 'Behaviour',
            events: 'Events',
            social: 'Social',
            interests: 'Interests',
            extracurricular: 'Extra-Curricular'
        };

        document.getElementById('personalEntryCategory').value = category;
        document.getElementById('personalEntryId').value = ''; // Clear ID for new entry
        document.getElementById('personalEntryTitle').textContent = `Add ${categoryNames[category]} Entry`;
        document.getElementById('personalEntryText').value = '';
        document.getElementById('addPersonalEntryModal').classList.add('active');
    },

    addPersonalEntry() {
        const category = document.getElementById('personalEntryCategory').value;
        const text = document.getElementById('personalEntryText').value.trim();
        const entryId = document.getElementById('personalEntryId').value;
        
        if (!text) {
            alert('Please enter some text');
            return;
        }

        const studentId = this.state.currentPersonalStudent;
        if (!studentId) return;

        if (!this.state.personalEntries[studentId]) {
            this.state.personalEntries[studentId] = {
                behaviour: [],
                events: [],
                social: [],
                interests: [],
                extracurricular: []
            };
        }

        if (entryId) {
            // Editing existing entry
            const entry = this.state.personalEntries[studentId][category].find(e => e.id === entryId);
            if (entry) {
                entry.text = text;
                entry.lastEdited = new Date().toISOString();
            }
        } else {
            // Creating new entry
            const entry = {
                id: Date.now().toString(),
                text: text,
                date: new Date().toISOString()
            };
            this.state.personalEntries[studentId][category].push(entry);
        }

        this.saveState();
        this.loadPersonalEntries();
        this.closeModal('addPersonalEntryModal');
        this.syncData();
    },

    editPersonalEntry(category, entryId) {
        const studentId = this.state.currentPersonalStudent;
        if (!studentId) return;

        const entry = this.state.personalEntries[studentId][category].find(e => e.id === entryId);
        if (!entry) return;

        const categoryNames = {
            behaviour: 'Behaviour',
            events: 'Events',
            social: 'Social',
            interests: 'Interests',
            extracurricular: 'Extra-Curricular'
        };

        document.getElementById('personalEntryCategory').value = category;
        document.getElementById('personalEntryId').value = entryId;
        document.getElementById('personalEntryTitle').textContent = `Edit ${categoryNames[category]} Entry`;
        document.getElementById('personalEntryText').value = entry.text;
        document.getElementById('addPersonalEntryModal').classList.add('active');
    },

    deletePersonalEntry(category, entryId) {
        if (!confirm('Are you sure you want to delete this entry?')) {
            return;
        }

        const studentId = this.state.currentPersonalStudent;
        if (!studentId) return;

        const entries = this.state.personalEntries[studentId][category];
        const index = entries.findIndex(e => e.id === entryId);
        
        if (index !== -1) {
            entries.splice(index, 1);
            this.saveState();
            this.loadPersonalEntries();
            this.syncData();
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

    // Google Sheets Integration (Apps Script)
    saveGoogleSettings() {
        this.state.googleSettings.scriptUrl = document.getElementById('scriptUrl').value.trim();
        this.saveState();
        alert('Google Script URL saved! Click "Test Connection" to verify, then "Sync Now" to upload your data.');
    },

    async testConnection() {
        const scriptUrl = this.state.googleSettings.scriptUrl;
        if (!scriptUrl) {
            alert('Please enter your Google Apps Script URL first');
            return;
        }

        this.updateSyncStatus('syncing');
        
        try {
            const response = await fetch(scriptUrl + '?action=test');
            const result = await response.json();
            
            if (result.status === 'ok') {
                alert('✓ Connection successful! Your Google Sheet is ready.');
                this.updateSyncStatus('synced');
            } else {
                alert('Connection failed. Please check your Script URL.');
                this.updateSyncStatus('error');
            }
        } catch (err) {
            alert('Error connecting to Google Sheets. Please check your Script URL and try again.');
            console.error('Connection error:', err);
            this.updateSyncStatus('error');
        }
    },

    async syncData() {
        const scriptUrl = this.state.googleSettings.scriptUrl;
        if (!scriptUrl) {
            console.log('Google Sheets not configured - data saved locally only');
            return;
        }

        this.updateSyncStatus('syncing');
        
        try {
            // Prepare data for sync
            const dataToSync = {
                students: this.state.students,
                assessments: this.state.assessments,
                curriculumProgress: this.state.curriculumProgress,
                notes: this.state.notes,
                personalEntries: this.state.personalEntries,
                lastSync: new Date().toISOString()
            };

            // Send to Google Sheets
            const response = await fetch(scriptUrl, {
                method: 'POST',
                mode: 'no-cors', // Required for Apps Script
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'save',
                    data: dataToSync
                })
            });

            // Note: no-cors mode means we can't read the response, but the data is sent
            this.state.googleSettings.lastSync = new Date().toISOString();
            this.saveState();
            this.updateSyncStatus('synced');
            
            console.log('Data synced to Google Sheets');
        } catch (err) {
            console.error('Sync error:', err);
            this.updateSyncStatus('error');
        }
    },

    async loadFromGoogleSheets() {
        const scriptUrl = this.state.googleSettings.scriptUrl;
        if (!scriptUrl) {
            alert('Please enter your Google Apps Script URL first');
            return;
        }

        if (!confirm('This will replace your current local data with data from Google Sheets. Continue?')) {
            return;
        }

        this.updateSyncStatus('syncing');
        
        try {
            const response = await fetch(scriptUrl + '?action=load');
            const result = await response.json();
            
            if (result.status === 'ok' && result.data) {
                // Update state with data from Google Sheets
                if (result.data.students) this.state.students = result.data.students;
                if (result.data.assessments) this.state.assessments = result.data.assessments;
                if (result.data.curriculumProgress) this.state.curriculumProgress = result.data.curriculumProgress;
                if (result.data.notes) this.state.notes = result.data.notes;
                if (result.data.personalEntries) this.state.personalEntries = result.data.personalEntries;
                
                this.state.googleSettings.lastSync = new Date().toISOString();
                this.saveState();
                
                // Refresh all views
                this.renderStudents();
                this.renderAssessments();
                this.updateCurriculumStudentSelect();
                this.updatePersonalStudentSelect();
                
                this.updateSyncStatus('synced');
                alert('✓ Data loaded from Google Sheets successfully!');
            } else {
                alert('No data found in Google Sheets. Use "Sync Now" to upload your local data first.');
                this.updateSyncStatus('error');
            }
        } catch (err) {
            alert('Error loading data from Google Sheets. Please check your connection.');
            console.error('Load error:', err);
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
