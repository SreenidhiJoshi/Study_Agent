/**
 * App Controller (main.js)
 * Manages view routing, file uploads, settings configurations,
 * and the animated "Agent Thinking" logs terminal.
 */

class StudyPlannerApp {
  constructor() {
    this.activeTab = "dashboard-tab";
  }

  /**
   * Initialize routing, logs, and form inputs
   */
  init() {
    this.bindNavigation();
    this.bindForms();
    this.bindAgentLogsListener();

    // Check if syllabus already exists, if so render immediately
    const state = window.memoryManager.state;
    if (state.syllabus && state.schedule && state.schedule.length > 0) {
      // Check for missed dates and replan automatically
      window.StudyPlanner.checkAndReplan();
      window.dashboardRenderer.renderAll();
    } else {
      // Prompt user to upload syllabus if empty
      this.switchTab("upload-tab");
    }

    this.renderLogsTerminal();
    this.populateSettingsForm();
    this.updateGreeting();
    this.updateGuardrailsAssessment();
  }

  /**
   * Router function to switch active tab view
   * @param {string} tabId - Target tab ID
   */
  switchTab(tabId) {
    this.activeTab = tabId;

    // Toggle navigation active class
    document.querySelectorAll(".nav-link").forEach(link => {
      if (link.getAttribute("data-tab") === tabId) {
        link.classList.add("active");
      } else {
        link.classList.remove("active");
      }
    });

    // Toggle content views
    document.querySelectorAll(".tab-content-view").forEach(view => {
      if (view.id === tabId) {
        view.classList.remove("d-none");
        view.classList.add("fade-in");
      } else {
        view.classList.add("d-none");
        view.classList.remove("fade-in");
      }
    });

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Refresh metrics on specific tab switches
    if (tabId === "dashboard-tab" || tabId === "planner-tab") {
      window.dashboardRenderer.renderAll();
    }
  }

  /**
   * Binds navigation links to router
   */
  bindNavigation() {
    document.querySelectorAll(".nav-link").forEach(link => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const tabTarget = link.getAttribute("data-tab");
        this.switchTab(tabTarget);
      });
    });
  }

  /**
   * Configures upload dropzones and input fields
   */
  bindForms() {
    // 1. Drag and Drop Syllabus Area
    const dropzone = document.getElementById("syllabus-dropzone");
    const fileInput = document.getElementById("syllabus-file");
    
    if (dropzone && fileInput) {
      dropzone.addEventListener("click", () => fileInput.click());
      
      dropzone.addEventListener("dragover", (e) => {
        e.preventDefault();
        dropzone.classList.add("dragover");
      });

      dropzone.addEventListener("dragleave", () => {
        dropzone.classList.remove("dragover");
      });

      dropzone.addEventListener("drop", (e) => {
        e.preventDefault();
        dropzone.classList.remove("dragover");
        if (e.dataTransfer.files.length > 0) {
          fileInput.files = e.dataTransfer.files;
          this.handleFileSelected(e.dataTransfer.files[0]);
        }
      });

      fileInput.addEventListener("change", (e) => {
        if (e.target.files.length > 0) {
          this.handleFileSelected(e.target.files[0]);
        }
      });
    }

    // Bind real-time inputs to update guardrails diagnostics
    const fallbackText = document.getElementById("syllabus-text-fallback");
    const examDateInput = document.getElementById("exam-date");
    const hoursInput = document.getElementById("daily-hours");
    const prioritySelect = document.getElementById("default-priority");

    [fallbackText, examDateInput, hoursInput, prioritySelect].forEach(input => {
      if (input) {
        input.addEventListener("input", () => this.updateGuardrailsAssessment());
        input.addEventListener("change", () => this.updateGuardrailsAssessment());
      }
    });

    // 2. Schedule Form Submit
    const planForm = document.getElementById("planner-config-form");
    if (planForm) {
      planForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        await this.handleGeneratePlanTrigger();
      });
    }

    // 3. Settings Form Submit
    const settingsForm = document.getElementById("settings-form");
    if (settingsForm) {
      settingsForm.addEventListener("submit", (e) => {
        e.preventDefault();
        this.saveProfileSettings();
      });
    }

    // 4. Force Replan Button
    const replanBtn = document.getElementById("force-replan-btn");
    if (replanBtn) {
      replanBtn.addEventListener("click", () => {
        window.memoryManager.addLog("Memory Adaptation", "Manual schedule replan triggered by user request.");
        window.StudyPlanner.generateSchedule();
        window.dashboardRenderer.renderAll();
        this.switchTab("planner-tab");
      });
    }

    // 5. Reset Data Button
    const resetBtn = document.getElementById("reset-data-btn");
    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        if (confirm("Are you sure you want to delete all study plans, streaks, and quiz results? This action cannot be undone.")) {
          window.memoryManager.clearAllData();
          location.reload();
        }
      });
    }
  }

  /**
   * Performs dynamic calculation of study load based on inputs and displays warnings/diagnostics
   */
  updateGuardrailsAssessment() {
    const textContent = document.getElementById("syllabus-text-fallback").value.trim();
    const examDateInput = document.getElementById("exam-date").value;
    const hoursInput = parseInt(document.getElementById("daily-hours").value) || 2;
    const priority = document.getElementById("default-priority").value;

    const assessmentContainer = document.getElementById("guardrails-dashboard-assessment");
    if (!assessmentContainer) return;

    if (!examDateInput) {
      assessmentContainer.innerHTML = `
        <div class="p-3 text-center border-glass text-secondary rounded">
          <p class="m-0 small">Enter an exam date and upload/paste syllabus to trigger guardrail diagnostics.</p>
        </div>
      `;
      return;
    }

    // 1. Calculate dates remaining
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const exam = new Date(examDateInput);
    exam.setHours(0, 0, 0, 0);
    const timeDiff = exam.getTime() - today.getTime();
    let daysRemaining = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
    
    // Account for revision block
    if (daysRemaining > 3) {
      daysRemaining -= 2; // reserve 2 days for revision
    }

    // 2. Parse topics count
    const topics = window.SyllabusParser.parseText(textContent, priority);
    const topicCount = topics.length;

    // 3. Validate
    const check = window.StudyGuardrails.validatePlan(topicCount, daysRemaining, hoursInput);

    let alertClass = "alert-warning-glass";
    if (check.severity === "success") {
      alertClass = "border-glass text-success";
    } else if (check.severity === "danger") {
      alertClass = "alert-warning-glass border-danger text-danger";
    }

    let recsHtml = "";
    if (check.recommendations.length > 0) {
      recsHtml = `
        <div class="mt-3">
          <span class="small fw-bold d-block mb-1 text-light">Recommendations:</span>
          <ul class="m-0 ps-3 small text-secondary">
            ${check.recommendations.map(r => `<li>${r}</li>`).join("")}
          </ul>
        </div>
      `;
    }

    assessmentContainer.innerHTML = `
      <div class="alert ${alertClass} p-3 m-0">
        <h5 class="fw-bold mb-1">${check.message}</h5>
        <p class="m-0 small text-secondary">${check.details}</p>
        ${recsHtml}
      </div>
    `;
  }

  /**
   * Processes uploaded files using the parser
   */
  async handleFileSelected(file) {
    const filenameSpan = document.getElementById("uploaded-filename");
    if (filenameSpan) {
      filenameSpan.textContent = `Selected: ${file.name}`;
      filenameSpan.classList.remove("d-none");
    }

    try {
      window.memoryManager.addLog("Syllabus Upload", `Selected file: ${file.name}`);
      const text = await window.SyllabusParser.extractTextFromFile(file);
      document.getElementById("syllabus-text-fallback").value = text;
      window.memoryManager.addLog("Syllabus Upload", `Text extraction finished. ${text.length} characters parsed.`);
      this.updateGuardrailsAssessment();
    } catch (err) {
      window.memoryManager.addLog("Syllabus Error", `Failed to parse file: ${err.message}`);
      alert(err.message);
    }
  }

  /**
   * Controls the AI Agent's Thinking steps animation and generates the study plan
   */
  async handleGeneratePlanTrigger() {
    const subjectInput = document.getElementById("subject-title").value.trim();
    const textContent = document.getElementById("syllabus-text-fallback").value.trim();
    const examDate = document.getElementById("exam-date").value;
    const hours = parseInt(document.getElementById("daily-hours").value);
    const priority = document.getElementById("default-priority").value;

    if (!subjectInput) {
      alert("Please enter a Subject Title.");
      return;
    }
    if (!textContent) {
      alert("Please upload a syllabus file or paste the syllabus topics in the text box.");
      return;
    }
    if (!examDate) {
      alert("Please select a target Exam Date.");
      return;
    }

    // Show AI Agent Thinking View overlay/terminal
    const terminalOverlay = document.getElementById("agent-thinking-overlay");
    if (terminalOverlay) {
      terminalOverlay.classList.remove("d-none");
    }

    // Clear previous logs to highlight new reasoning steps
    const terminalBody = document.getElementById("agent-terminal-body");
    if (terminalBody) terminalBody.innerHTML = "";

    // Step-by-step artificial delays to simulate an AI thinking stream
    const sleep = (ms) => new Promise(res => setTimeout(res, ms));

    try {
      window.memoryManager.addLog("Syllabus Parsing", `Initiating layout analysis for "${subjectInput}"...`);
      await sleep(600);
      
      const topics = window.SyllabusParser.parseText(textContent, priority);
      
      if (topics.length === 0) {
        throw new Error("Could not identify any topics from the text. Make sure topics are listed line-by-line or with numbers/bullets.");
      }

      window.memoryManager.addLog("Syllabus Parsing", `Extraction success! Found ${topics.length} topics.`);
      await sleep(600);

      // Save syllabus meta to memory
      window.memoryManager.state.syllabus = {
        subject: subjectInput,
        topics: topics
      };
      // Save profile metadata
      window.memoryManager.state.profile.examDate = examDate;
      window.memoryManager.state.profile.availableHours = hours;
      window.memoryManager.state.profile.defaultPriority = priority;
      window.memoryManager.saveState();

      window.memoryManager.addLog("Guardrails", "Checking syllabus load boundaries against exam timeline...");
      await sleep(600);

      // Generate Study Plan
      const scheduleCreated = window.StudyPlanner.generateSchedule();

      if (!scheduleCreated) {
        throw new Error("Failed to compile study plan. Check target dates.");
      }

      await sleep(800);
      window.memoryManager.addLog("Planning Core", "Optimizing sequence of topics. Mapping weak areas revision placeholders.");
      await sleep(600);
      
      // Update greeting and metrics
      this.updateGreeting();
      this.populateSettingsForm();
      window.dashboardRenderer.renderAll();

      // Hide overlay
      if (terminalOverlay) {
        terminalOverlay.classList.add("d-none");
      }

      // Routing swap
      this.switchTab("planner-tab");

    } catch (err) {
      if (terminalOverlay) {
        terminalOverlay.classList.add("d-none");
      }
      window.memoryManager.addLog("Planning Error", `Failed: ${err.message}`);
      alert(err.message);
    }
  }

  /**
   * Populates default profile settings from Local Storage
   */
  populateSettingsForm() {
    const profile = window.memoryManager.state.profile;
    
    const elName = document.getElementById("student-name-input");
    const elDate = document.getElementById("exam-date-settings");
    const elHours = document.getElementById("daily-hours-settings");

    if (elName) elName.value = profile.name;
    if (elDate) elDate.value = profile.examDate || "";
    if (elHours) elHours.value = profile.availableHours;
  }

  /**
   * Saves updated student profile parameters
   */
  saveProfileSettings() {
    const name = document.getElementById("student-name-input").value.trim() || "Student";
    const examDate = document.getElementById("exam-date-settings").value;
    const hours = parseInt(document.getElementById("daily-hours-settings").value) || 2;

    const state = window.memoryManager.state;
    const isExamDateChanged = state.profile.examDate !== examDate;
    const isHoursChanged = state.profile.availableHours !== hours;

    state.profile.name = name;
    state.profile.examDate = examDate;
    state.profile.availableHours = hours;
    window.memoryManager.saveState();

    window.memoryManager.addLog("Memory Configuration", `Profile settings updated. Student Name: ${name}`);

    // If critical parameters changed, trigger automatic reschedule
    if (state.syllabus && (isExamDateChanged || isHoursChanged)) {
      window.memoryManager.addLog("Memory Adaptation", "Target timeline changed in settings. Rescheduling study timetable automatically...");
      window.StudyPlanner.generateSchedule();
    }

    this.updateGreeting();
    window.dashboardRenderer.renderAll();
    alert("Settings saved successfully!");
    this.switchTab("dashboard-tab");
  }

  /**
   * Updates dashboard hello cards
   */
  updateGreeting() {
    const name = window.memoryManager.state.profile.name;
    const elGreeting = document.getElementById("dashboard-greeting");
    if (elGreeting) {
      elGreeting.innerHTML = `Welcome back, <span class="gradient-text fw-bold">${name}</span>!`;
    }
  }

  /**
   * Sets up log event listener to push logs dynamically to terminal UI component
   */
  bindAgentLogsListener() {
    window.addEventListener("agent-log-added", (e) => {
      this.appendLogToUI(e.detail);
    });
  }

  /**
   * Renders static logs in log tab on initial load
   */
  renderLogsTerminal() {
    const list = document.getElementById("agent-terminal-logs-list");
    if (!list) return;

    list.innerHTML = "";
    const logs = window.memoryManager.getLogs();
    logs.forEach(log => {
      this.appendLogToUI(log, "agent-terminal-logs-list");
    });
  }

  /**
   * Appends single reasoning log line to terminal windows
   */
  appendLogToUI(log, targetId = "agent-terminal-logs-list") {
    const targetElement = document.getElementById(targetId);
    const activeOverlayBody = document.getElementById("agent-terminal-body");

    let levelClass = "text-accent";
    if (log.phase.includes("Error") || log.phase.includes("Alert")) levelClass = "text-danger";
    else if (log.phase.includes("Guardrails")) levelClass = "text-warning";
    else if (log.phase.includes("Adaptation")) levelClass = "text-success";

    const logHtml = `
      <div class="terminal-line mb-1">
        <span class="text-secondary">[${log.timestamp}]</span>
        <span class="${levelClass} fw-bold">${log.phase}:</span>
        <span class="text-light">${log.message}</span>
      </div>
    `;

    // Append to logs view tab
    if (targetElement) {
      targetElement.insertAdjacentHTML("beforeend", logHtml);
      targetElement.scrollTop = targetElement.scrollHeight;
    }

    // Append to animated modal overlay if visible
    if (activeOverlayBody) {
      activeOverlayBody.insertAdjacentHTML("beforeend", logHtml);
      activeOverlayBody.scrollTop = activeOverlayBody.scrollHeight;
    }
  }
}

// Instantiate App
document.addEventListener("DOMContentLoaded", () => {
  window.app = new StudyPlannerApp();
  window.app.init();
});
