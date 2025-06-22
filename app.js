// Application State
let appState = {
    currentSection: 'exam-info',
    currentTheme: 'light',
    examStarted: false,
    examStartTime: null,
    examTimer: null,
    studyProgress: {},
    practiceProgress: {},
    vulnerabilities: [],
    notes: {},
    currentPhase: 'information-gathering',
    nmapData: [],
    commands: []
};

// Application Data
const appData = {
    examInfo: {
        duration: "48 hours",
        passingScore: "70% (15/20 questions)",
        price: "$249 (includes 3 months INE)",
        domains: {
            assessmentMethodologies: 25,
            hostNetworkAuditing: 25,
            hostNetworkPentesting: 35,
            webApplicationPentesting: 15
        }
    },
    
    methodology: {
        phases: [
            {
                name: "Information Gathering",
                id: "information-gathering",
                description: "Collect information about the target",
                tasks: ["OSINT", "DNS enumeration", "Whois lookup", "Social media research"]
            },
            {
                name: "Network Discovery",
                id: "network-discovery", 
                description: "Identify live hosts and services",
                tasks: ["Host discovery", "Port scanning", "Service detection", "OS fingerprinting"]
            },
            {
                name: "Service Enumeration",
                id: "service-enumeration",
                description: "Enumerate services in detail", 
                tasks: ["Banner grabbing", "Service-specific enumeration", "Version detection", "Default credentials"]
            },
            {
                name: "Vulnerability Assessment",
                id: "vulnerability-assessment",
                description: "Identify vulnerabilities",
                tasks: ["Vulnerability scanning", "Manual testing", "CVE research", "Exploit availability"]
            },
            {
                name: "Exploitation",
                id: "exploitation",
                description: "Exploit identified vulnerabilities",
                tasks: ["Exploit development", "Payload generation", "Exploitation", "Shell access"]
            },
            {
                name: "Post-Exploitation", 
                id: "post-exploitation",
                description: "Activities after gaining access",
                tasks: ["System enumeration", "Privilege escalation", "Credential harvesting", "Persistence"]
            },
            {
                name: "Lateral Movement",
                id: "lateral-movement",
                description: "Move through the network", 
                tasks: ["Network discovery", "Pivoting", "Credential reuse", "Additional compromise"]
            }
        ]
    },

    commandTemplates: {
        http: [
            "gobuster dir -u http://{ip}:{port} -w /usr/share/wordlists/dirb/common.txt",
            "nikto -h http://{ip}:{port}",
            "curl -I http://{ip}:{port}",
            "whatweb http://{ip}:{port}"
        ],
        https: [
            "gobuster dir -u https://{ip}:{port} -w /usr/share/wordlists/dirb/common.txt -k",
            "nikto -h https://{ip}:{port}",
            "curl -I https://{ip}:{port} -k",
            "sslscan {ip}:{port}"
        ],
        ssh: [
            "ssh {ip} -p {port}",
            "hydra -l root -P /usr/share/wordlists/rockyou.txt {ip} ssh -s {port}",
            "nmap --script ssh-brute --script-args userdb=users.txt,passdb=passwords.txt {ip} -p {port}"
        ],
        ftp: [
            "ftp {ip} {port}",
            "hydra -l anonymous -P /usr/share/wordlists/rockyou.txt {ip} ftp -s {port}",
            "nmap --script ftp-anon,ftp-bounce,ftp-libopie,ftp-proftpd-backdoor,ftp-vsftpd-backdoor,ftp-vuln-cve2010-4221 {ip} -p {port}"
        ],
        smb: [
            "smbclient -L //{ip}",
            "enum4linux -a {ip}",
            "smbmap -H {ip}",
            "crackmapexec smb {ip}"
        ],
        mysql: [
            "mysql -h {ip} -P {port} -u root -p",
            "hydra -l root -P /usr/share/wordlists/rockyou.txt {ip} mysql -s {port}",
            "nmap --script mysql-enum,mysql-empty-password,mysql-users,mysql-info {ip} -p {port}"
        ],
        rdp: [
            "rdesktop {ip}:{port}",
            "hydra -l administrator -P /usr/share/wordlists/rockyou.txt {ip} rdp -s {port}",
            "nmap --script rdp-enum-encryption,rdp-vuln-ms12-020 {ip} -p {port}"
        ]
    }
};

// Initialize Application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    loadAppState();
    setupEventListeners();
    updateUI();
    setupMethodologyChecklist();
    showToast('Dashboard încărcat cu succes!', 'success');
}

// Event Listeners Setup
function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', handleNavigation);
    });

    // Theme toggle
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);

    // Export button
    document.getElementById('exportBtn').addEventListener('click', exportData);

    // Study plan checkboxes
    document.querySelectorAll('.resource-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', updateStudyProgress);
    });

    // Practice platform tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', handlePlatformTab);
    });

    // Practice progress checkboxes
    document.querySelectorAll('.room-completed, .module-completed, .machine-completed').forEach(checkbox => {
        checkbox.addEventListener('change', updatePracticeProgress);
    });

    // Tools categories
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', handleToolsCategory);
    });

    // Nmap file upload
    const nmapUpload = document.getElementById('nmapUpload');
    const nmapFile = document.getElementById('nmapFile');
    
    nmapUpload.addEventListener('click', () => nmapFile.click());
    nmapUpload.addEventListener('dragover', handleDragOver);
    nmapUpload.addEventListener('drop', handleFileDrop);
    nmapFile.addEventListener('change', handleFileSelect);

    // Command generator
    document.getElementById('generateCommands').addEventListener('click', generateCommands);

    // Vulnerability tracker
    document.getElementById('addVulnBtn').addEventListener('click', addVulnerability);

    // Notes methodology
    document.querySelectorAll('.phase-btn').forEach(btn => {
        btn.addEventListener('click', handlePhaseSwitch);
    });

    document.getElementById('saveNotesBtn').addEventListener('click', saveNotes);
    document.getElementById('clearNotesBtn').addEventListener('click', clearNotes);

    // Exam mode
    document.getElementById('startExamBtn').addEventListener('click', startExam);
    document.getElementById('pauseExamBtn').addEventListener('click', pauseExam);
    document.getElementById('resetExamBtn').addEventListener('click', resetExam);

    // Quick access tools
    document.querySelectorAll('.quick-tool-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const section = e.currentTarget.dataset.section;
            navigateToSection(section);
        });
    });

    // Auto-save notes
    document.getElementById('notesEditor').addEventListener('input', debounce(autoSaveNotes, 1000));
}

// Navigation
function handleNavigation(e) {
    e.preventDefault();
    const section = e.currentTarget.dataset.section;
    navigateToSection(section);
}

function navigateToSection(section) {
    // Update active nav item
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    document.querySelector(`[data-section="${section}"]`).classList.add('active');

    // Show corresponding section
    document.querySelectorAll('.content-section').forEach(section => section.classList.remove('active'));
    document.getElementById(section).classList.add('active');

    appState.currentSection = section;
    saveAppState();
}

// Theme Toggle
function toggleTheme() {
    const newTheme = appState.currentTheme === 'light' ? 'dark' : 'light';
    appState.currentTheme = newTheme;
    document.documentElement.setAttribute('data-color-scheme', newTheme);
    document.getElementById('themeToggle').textContent = newTheme === 'light' ? '🌙' : '☀️';
    saveAppState();
    showToast(`Tema schimbată la ${newTheme}`, 'info');
}

// Study Progress
function updateStudyProgress() {
    const checkboxes = document.querySelectorAll('.resource-checkbox');
    const phases = document.querySelectorAll('[data-phase]');
    
    phases.forEach(phaseEl => {
        const phaseNum = phaseEl.dataset.phase;
        const phaseCheckboxes = document.querySelectorAll(`[id^="resource-${phaseNum === '1' ? '' : (parseInt(phaseNum) - 1) * 3 + 1}"]`);
        
        let completed = 0;
        let total = 0;
        
        // Calculate based on phase ranges
        const startId = phaseNum === '1' ? 1 : (parseInt(phaseNum) - 1) * 3 + 1;
        const endId = parseInt(phaseNum) * 3;
        
        for (let i = startId; i <= endId; i++) {
            const checkbox = document.getElementById(`resource-${i}`);
            if (checkbox) {
                total++;
                if (checkbox.checked) completed++;
            }
        }
        
        const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
        phaseEl.style.width = `${percentage}%`;
        phaseEl.parentElement.nextElementSibling.textContent = `${percentage}% completat`;
        
        appState.studyProgress[`phase-${phaseNum}`] = percentage;
    });
    
    updateGlobalProgress();
    saveAppState();
}

// Practice Progress
function updatePracticeProgress() {
    const platforms = ['tryhackme', 'hackthebox', 'vulnhub'];
    
    platforms.forEach(platform => {
        const checkboxes = document.querySelectorAll(`#${platform} input[type="checkbox"]`);
        let completed = 0;
        
        checkboxes.forEach(checkbox => {
            if (checkbox.checked) completed++;
        });
        
        appState.practiceProgress[platform] = {
            completed: completed,
            total: checkboxes.length,
            percentage: Math.round((completed / checkboxes.length) * 100)
        };
    });
    
    updateGlobalProgress();
    saveAppState();
}

// Platform Tabs
function handlePlatformTab(e) {
    const platform = e.target.dataset.platform;
    
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    e.target.classList.add('active');
    
    // Show corresponding platform content
    document.querySelectorAll('.platform-tab').forEach(tab => tab.classList.remove('active'));
    document.getElementById(platform).classList.add('active');
}

// Tools Categories
function handleToolsCategory(e) {
    const category = e.target.dataset.category;
    
    // Update category buttons
    document.querySelectorAll('.category-btn').forEach(btn => btn.classList.remove('active'));
    e.target.classList.add('active');
    
    // Show corresponding category content
    document.querySelectorAll('.tools-category').forEach(cat => cat.classList.remove('active'));
    document.getElementById(category).classList.add('active');
}

// Copy to Clipboard
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showToast('Comandă copiată!', 'success');
    }).catch(() => {
        showToast('Eroare la copiere!', 'error');
    });
}

// Nmap Parser
function handleDragOver(e) {
    e.preventDefault();
    e.currentTarget.classList.add('dragover');
}

function handleFileDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('dragover');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        parseNmapFile(files[0]);
    }
}

function handleFileSelect(e) {
    const files = e.target.files;
    if (files.length > 0) {
        parseNmapFile(files[0]);
    }
}

function parseNmapFile(file) {
    if (!file.name.endsWith('.xml')) {
        showToast('Te rog să încarci un fișier XML valid!', 'error');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(e.target.result, 'text/xml');
            const hosts = parseNmapXML(xmlDoc);
            displayNmapResults(hosts);
            appState.nmapData = hosts;
            updateExamStats();
            saveAppState();
            showToast(`${hosts.length} host-uri procesate cu succes!`, 'success');
        } catch (error) {
            showToast('Eroare la parsarea fișierului XML!', 'error');
        }
    };
    reader.readAsText(file);
}

function parseNmapXML(xmlDoc) {
    const hosts = [];
    const hostElements = xmlDoc.querySelectorAll('host');
    
    hostElements.forEach(hostElement => {
        const status = hostElement.querySelector('status')?.getAttribute('state');
        if (status !== 'up') return;
        
        const addressElement = hostElement.querySelector('address[@addrtype="ipv4"]');
        const ip = addressElement?.getAttribute('addr');
        
        const hostnameElement = hostElement.querySelector('hostname');
        const hostname = hostnameElement?.getAttribute('name') || '';
        
        const osElement = hostElement.querySelector('osmatch');
        const os = osElement?.getAttribute('name') || '';
        
        const ports = [];
        const portElements = hostElement.querySelectorAll('port');
        
        portElements.forEach(portElement => {
            const portState = portElement.querySelector('state')?.getAttribute('state');
            if (portState === 'open') {
                const portId = portElement.getAttribute('portid');
                const protocol = portElement.getAttribute('protocol');
                const service = portElement.querySelector('service')?.getAttribute('name') || '';
                const version = portElement.querySelector('service')?.getAttribute('version') || '';
                
                ports.push({
                    port: portId,
                    protocol: protocol,
                    service: service,
                    version: version
                });
            }
        });
        
        if (ip && ports.length > 0) {
            hosts.push({
                ip: ip,
                hostname: hostname,
                os: os,
                ports: ports,
                status: status
            });
        }
    });
    
    return hosts;
}

function displayNmapResults(hosts) {
    const tbody = document.querySelector('#hostsTable tbody');
    tbody.innerHTML = '';
    
    hosts.forEach(host => {
        const row = document.createElement('tr');
        const portsText = host.ports.map(p => `${p.port}/${p.protocol} (${p.service})`).join(', ');
        
        row.innerHTML = `
            <td>${host.ip}</td>
            <td>${host.hostname}</td>
            <td><span class="status status--success">Up</span></td>
            <td>${portsText}</td>
            <td>${host.os}</td>
            <td>
                <button class="btn btn--sm btn--secondary" onclick="generateCommandsForHost('${host.ip}')">
                    Generează Comenzi
                </button>
            </td>
        `;
        
        tbody.appendChild(row);
    });
    
    document.getElementById('parsedResults').style.display = 'block';
}

// Command Generator
function generateCommands() {
    const ip = document.getElementById('targetIP').value.trim();
    const port = document.getElementById('targetPort').value.trim();
    const service = document.getElementById('serviceSelect').value;
    
    if (!ip || !port || !service) {
        showToast('Te rog să completezi toate câmpurile!', 'warning');
        return;
    }
    
    const templates = appData.commandTemplates[service];
    if (!templates) {
        showToast('Serviciu nerecunoscut!', 'error');
        return;
    }
    
    const commands = templates.map(template => 
        template.replace(/{ip}/g, ip).replace(/{port}/g, port)
    );
    
    displayGeneratedCommands(commands, service, ip, port);
    
    appState.commands.push({
        timestamp: new Date().toISOString(),
        service: service,
        ip: ip,
        port: port,
        commands: commands
    });
    
    saveAppState();
}

function generateCommandsForHost(ip) {
    const host = appState.nmapData.find(h => h.ip === ip);
    if (!host) return;
    
    document.getElementById('targetIP').value = ip;
    navigateToSection('command-generator');
    
    showToast(`Host ${ip} încărcat în generator!`, 'info');
}

function displayGeneratedCommands(commands, service, ip, port) {
    const container = document.getElementById('generatedCommands');
    container.innerHTML = '';
    
    const header = document.createElement('h4');
    header.textContent = `Comenzi pentru ${service.toUpperCase()} - ${ip}:${port}`;
    container.appendChild(header);
    
    commands.forEach(command => {
        const commandDiv = document.createElement('div');
        commandDiv.className = 'command-item';
        commandDiv.innerHTML = `
            <code>${command}</code>
            <button class="copy-btn" onclick="copyToClipboard('${command.replace(/'/g, "\\'")}')">📋</button>
        `;
        container.appendChild(commandDiv);
    });
    
    document.getElementById('commandsOutput').style.display = 'block';
}

// Vulnerability Tracker
function addVulnerability() {
    const host = document.getElementById('vulnHost').value.trim();
    const service = document.getElementById('vulnService').value.trim();
    const cve = document.getElementById('vulnCVE').value.trim();
    const severity = document.getElementById('vulnSeverity').value;
    
    if (!host || !service) {
        showToast('Host și serviciu sunt obligatorii!', 'warning');
        return;
    }
    
    const vulnerability = {
        id: Date.now(),
        host: host,
        service: service,
        cve: cve,
        severity: severity,
        timestamp: new Date().toISOString()
    };
    
    appState.vulnerabilities.push(vulnerability);
    displayVulnerabilities();
    updateExamStats();
    saveAppState();
    
    // Clear form
    document.getElementById('vulnHost').value = '';
    document.getElementById('vulnService').value = '';
    document.getElementById('vulnCVE').value = '';
    
    showToast('Vulnerabilitate adăugată!', 'success');
}

function displayVulnerabilities() {
    const container = document.querySelector('.vulns-container');
    container.innerHTML = '';
    
    appState.vulnerabilities.forEach(vuln => {
        const vulnDiv = document.createElement('div');
        vulnDiv.className = `vuln-item ${vuln.severity}`;
        vulnDiv.innerHTML = `
            <div class="vuln-info">
                <h4>${vuln.host} - ${vuln.service}</h4>
                <p>${vuln.cve ? `CVE: ${vuln.cve}` : 'Fără CVE identificat'}</p>
            </div>
            <div class="vuln-actions">
                <span class="vuln-severity ${vuln.severity}">${vuln.severity}</span>
                <button class="btn btn--sm btn--outline" onclick="removeVulnerability(${vuln.id})">
                    🗑️
                </button>
            </div>
        `;
        container.appendChild(vulnDiv);
    });
}

function removeVulnerability(id) {
    appState.vulnerabilities = appState.vulnerabilities.filter(v => v.id !== id);
    displayVulnerabilities();
    updateExamStats();
    saveAppState();
    showToast('Vulnerabilitate ștearsă!', 'info');
}

// Notes & Methodology
function handlePhaseSwitch(e) {
    const phase = e.target.dataset.phase;
    
    // Save current notes before switching
    saveCurrentNotes();
    
    // Update active phase button
    document.querySelectorAll('.phase-btn').forEach(btn => btn.classList.remove('active'));
    e.target.classList.add('active');
    
    // Update current phase
    appState.currentPhase = phase;
    
    // Update phase title
    const phaseData = appData.methodology.phases.find(p => p.id === phase);
    document.getElementById('currentPhaseTitle').textContent = phaseData.name;
    
    // Load notes for this phase
    const notes = appState.notes[phase] || '';
    document.getElementById('notesEditor').value = notes;
    
    saveAppState();
}

function saveNotes() {
    saveCurrentNotes();
    showToast('Note salvate!', 'success');
}

function saveCurrentNotes() {
    const notes = document.getElementById('notesEditor').value;
    appState.notes[appState.currentPhase] = notes;
    updateExamStats();
    saveAppState();
    updateLastSaved();
}

function autoSaveNotes() {
    saveCurrentNotes();
    showToast('Auto-salvare executată', 'info');
}

function clearNotes() {
    if (confirm('Ești sigur că vrei să ștergi notele pentru această fază?')) {
        document.getElementById('notesEditor').value = '';
        appState.notes[appState.currentPhase] = '';
        saveAppState();
        showToast('Note șterse!', 'warning');
    }
}

function setupMethodologyChecklist() {
    const container = document.getElementById('checklistContainer');
    container.innerHTML = '';
    
    appData.methodology.phases.forEach(phase => {
        const phaseDiv = document.createElement('div');
        phaseDiv.innerHTML = `<h4>${phase.name}</h4>`;
        
        phase.tasks.forEach((task, index) => {
            const taskDiv = document.createElement('div');
            taskDiv.className = 'checklist-item';
            taskDiv.innerHTML = `
                <input type="checkbox" id="task-${phase.id}-${index}" class="checklist-checkbox">
                <label for="task-${phase.id}-${index}">${task}</label>
            `;
            phaseDiv.appendChild(taskDiv);
        });
        
        container.appendChild(phaseDiv);
    });
    
    // Add event listeners for checklist items
    document.querySelectorAll('.checklist-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', saveAppState);
    });
}

// Exam Mode
function startExam() {
    appState.examStarted = true;
    appState.examStartTime = Date.now();
    
    document.getElementById('startExamBtn').style.display = 'none';
    document.getElementById('pauseExamBtn').style.display = 'inline-flex';
    
    startExamTimer();
    showToast('Examen început! Mult succes!', 'success');
    saveAppState();
}

function pauseExam() {
    if (appState.examTimer) {
        clearInterval(appState.examTimer);
        appState.examTimer = null;
        document.getElementById('pauseExamBtn').textContent = 'Continuă';
        showToast('Examen întrerupt', 'warning');
    } else {
        startExamTimer();
        document.getElementById('pauseExamBtn').textContent = 'Pauză';
        showToast('Examen reluat', 'info');
    }
}

function resetExam() {
    if (confirm('Ești sigur că vrei să resetezi timer-ul de examen?')) {
        if (appState.examTimer) {
            clearInterval(appState.examTimer);
        }
        
        appState.examStarted = false;
        appState.examStartTime = null;
        appState.examTimer = null;
        
        document.getElementById('startExamBtn').style.display = 'inline-flex';
        document.getElementById('pauseExamBtn').style.display = 'none';
        document.getElementById('examTimer').textContent = '48:00:00';
        
        showToast('Timer resetat!', 'info');
        saveAppState();
    }
}

function startExamTimer() {
    appState.examTimer = setInterval(updateExamTimer, 1000);
}

function updateExamTimer() {
    if (!appState.examStartTime) return;
    
    const elapsed = Date.now() - appState.examStartTime;
    const totalTime = 48 * 60 * 60 * 1000; // 48 hours in milliseconds
    const remaining = Math.max(0, totalTime - elapsed);
    
    if (remaining === 0) {
        clearInterval(appState.examTimer);
        showToast('Timpul pentru examen s-a încheiat!', 'error');
        return;
    }
    
    const hours = Math.floor(remaining / (60 * 60 * 1000));
    const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
    const seconds = Math.floor((remaining % (60 * 1000)) / 1000);
    
    const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    document.getElementById('examTimer').textContent = timeString;
    
    // Update progress bar based on time elapsed
    const progress = Math.min(100, ((totalTime - remaining) / totalTime) * 100);
    document.getElementById('globalProgress').style.width = `${progress}%`;
}

// Global Progress Update
function updateGlobalProgress() {
    let totalProgress = 0;
    let categories = 0;
    
    // Study progress
    const studyPhases = Object.values(appState.studyProgress);
    if (studyPhases.length > 0) {
        totalProgress += studyPhases.reduce((sum, val) => sum + val, 0) / studyPhases.length;
        categories++;
    }
    
    // Practice progress
    const practiceProgress = Object.values(appState.practiceProgress);
    if (practiceProgress.length > 0) {
        const avgPractice = practiceProgress.reduce((sum, platform) => sum + platform.percentage, 0) / practiceProgress.length;
        totalProgress += avgPractice;
        categories++;
    }
    
    // Additional progress factors
    if (appState.nmapData.length > 0) {
        totalProgress += 15; // Bonus for nmap data
        categories++;
    }
    
    if (appState.vulnerabilities.length > 0) {
        totalProgress += 10; // Bonus for vulnerabilities
        categories++;
    }
    
    const notesCount = Object.keys(appState.notes).filter(key => appState.notes[key].trim().length > 0).length;
    if (notesCount > 0) {
        totalProgress += (notesCount / appData.methodology.phases.length) * 20;
        categories++;
    }
    
    const finalProgress = categories > 0 ? Math.min(100, totalProgress / categories) : 0;
    
    if (!appState.examStarted) {
        document.getElementById('globalProgress').style.width = `${finalProgress}%`;
    }
    
    document.getElementById('progressText').textContent = `${Math.round(finalProgress)}% Completat`;
}

// Update Exam Stats
function updateExamStats() {
    document.getElementById('hostsScanned').textContent = appState.nmapData.length;
    document.getElementById('vulnsFound').textContent = appState.vulnerabilities.length;
    
    const notesCount = Object.keys(appState.notes).filter(key => appState.notes[key].trim().length > 0).length;
    document.getElementById('notesCount').textContent = notesCount;
}

// Export Data
function exportData() {
    const exportData = {
        timestamp: new Date().toISOString(),
        studyProgress: appState.studyProgress,
        practiceProgress: appState.practiceProgress,
        nmapData: appState.nmapData,
        vulnerabilities: appState.vulnerabilities,
        notes: appState.notes,
        commands: appState.commands,
        examStarted: appState.examStarted,
        examStartTime: appState.examStartTime
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `ejpt-dashboard-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    
    showToast('Date exportate cu succes!', 'success');
}

// Data Persistence
function saveAppState() {
    try {
        localStorage.setItem('ejptDashboard', JSON.stringify(appState));
        updateLastSaved();
    } catch (error) {
        showToast('Eroare la salvarea datelor!', 'error');
    }
}

function loadAppState() {
    try {
        const saved = localStorage.getItem('ejptDashboard');
        if (saved) {
            const parsedState = JSON.parse(saved);
            appState = { ...appState, ...parsedState };
            
            // Restore UI state
            if (appState.currentTheme === 'dark') {
                document.documentElement.setAttribute('data-color-scheme', 'dark');
                document.getElementById('themeToggle').textContent = '☀️';
            }
            
            // Restore exam timer if running
            if (appState.examStarted && !appState.examTimer) {
                startExamTimer();
                document.getElementById('startExamBtn').style.display = 'none';
                document.getElementById('pauseExamBtn').style.display = 'inline-flex';
            }
            
            // Restore checkboxes state
            restoreCheckboxStates();
            
            // Load notes for current phase
            const notes = appState.notes[appState.currentPhase] || '';
            if (document.getElementById('notesEditor')) {
                document.getElementById('notesEditor').value = notes;
            }
            
            // Display saved data
            if (appState.nmapData.length > 0) {
                displayNmapResults(appState.nmapData);
            }
            
            if (appState.vulnerabilities.length > 0) {
                displayVulnerabilities();
            }
        }
    } catch (error) {
        showToast('Eroare la încărcarea datelor salvate!', 'warning');
    }
}

function restoreCheckboxStates() {
    // Restore study progress checkboxes
    document.querySelectorAll('.resource-checkbox').forEach(checkbox => {
        const saved = localStorage.getItem(`checkbox-${checkbox.id}`);
        if (saved === 'true') {
            checkbox.checked = true;
        }
    });
    
    // Restore practice progress checkboxes
    document.querySelectorAll('.room-completed, .module-completed, .machine-completed').forEach(checkbox => {
        const saved = localStorage.getItem(`checkbox-${checkbox.id || checkbox.className}`);
        if (saved === 'true') {
            checkbox.checked = true;
        }
    });
    
    // Update progress after restoring states
    updateStudyProgress();
    updatePracticeProgress();
}

function updateLastSaved() {
    const now = new Date().toLocaleString('ro-RO');
    document.getElementById('lastSaved').textContent = now;
}

// UI Updates
function updateUI() {
    updateGlobalProgress();
    updateExamStats();
    
    // Set initial phase title
    const initialPhase = appData.methodology.phases.find(p => p.id === appState.currentPhase);
    if (initialPhase) {
        document.getElementById('currentPhaseTitle').textContent = initialPhase.name;
    }
}

// Toast Notifications
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type} fade-in`;
    toast.textContent = message;
    
    document.getElementById('toastContainer').appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 4000);
}

// Utility Functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Initialize on load
window.addEventListener('beforeunload', () => {
    saveAppState();
});

// Add checkbox state persistence
document.addEventListener('change', (e) => {
    if (e.target.type === 'checkbox') {
        localStorage.setItem(`checkbox-${e.target.id || e.target.className}`, e.target.checked);
    }
});