/**
 * Memory Manager (memory.js)
 * Manages all application state within Local Storage. Provides helper functions
 * for log capturing, profile editing, and study streak tracking.
 */

const STORAGE_KEY = "ai_study_planner_state";

const DEFAULT_STATE = {
  profile: {
    name: "Student",
    examDate: "",
    availableHours: 2,
    defaultPriority: "medium"
  },
  syllabus: null, // { subject: String, topics: Array<{ id, name, priority, completed, quizScore }> }
  schedule: [],   // Array<{ date: String, topicIds: Array<String>, completed: Array<String>, isRevision: Boolean }>
  quizzes: [],    // Array<{ topicId: String, score: Number, total: Number, date: String }>
  streak: {
    count: 0,
    lastActiveDate: ""
  },
  logs: []        // Array<{ timestamp: String, phase: String, message: String }>
};

class MemoryManager {
  constructor() {
    this.state = this.loadState();
  }

  /**
   * Load state from Local Storage
   */
  loadState() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        // Ensure defaults are merged in case schema expands
        return { ...DEFAULT_STATE, ...parsed };
      }
    } catch (e) {
      console.error("Error reading from Local Storage", e);
    }
    return JSON.parse(JSON.stringify(DEFAULT_STATE)); // deep copy default
  }

  /**
   * Save state to Local Storage
   */
  saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.error("Error writing to Local Storage", e);
    }
  }

  /**
   * Clear all application data
   */
  clearAllData() {
    this.state = JSON.parse(JSON.stringify(DEFAULT_STATE));
    this.saveState();
    this.addLog("Memory Reset", "Cleared all study history, syllabus data, and profile settings.");
  }

  /**
   * Add a log entry for the agent's thinking process
   * @param {string} phase - The step category (e.g. "Syllabus Parsing", "Planning", "Guardrails", "Adaptation")
   * @param {string} message - Description of the action/reasoning
   */
  addLog(phase, message) {
    const timestamp = new Date().toLocaleTimeString();
    if (!this.state.logs) {
      this.state.logs = [];
    }
    // Limit to last 100 logs to prevent storage bloat
    if (this.state.logs.length >= 100) {
      this.state.logs.shift();
    }
    this.state.logs.push({ timestamp, phase, message });
    this.saveState();
    
    // Dispatch custom event to notify main controller to update UI logs instantly
    window.dispatchEvent(new CustomEvent("agent-log-added", { detail: { timestamp, phase, message } }));
  }

  /**
   * Updates study streak count
   * Call this whenever a task is checked off or a quiz is completed.
   */
  updateStreak() {
    const todayStr = new Date().toISOString().split("T")[0];
    const streak = this.state.streak;

    if (!streak.lastActiveDate) {
      streak.count = 1;
      streak.lastActiveDate = todayStr;
      this.addLog("Memory Adaptation", "First study activity recorded! Streak initiated.");
    } else if (streak.lastActiveDate === todayStr) {
      // Already active today, streak stays the same
    } else {
      const lastDate = new Date(streak.lastActiveDate);
      const todayDate = new Date(todayStr);
      const diffTime = Math.abs(todayDate - lastDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        // Active on consecutive day
        streak.count += 1;
        this.addLog("Memory Adaptation", `Consecutive study day active. Streak increased to ${streak.count} days! 🔥`);
      } else if (diffDays > 1) {
        // Streak broken
        const oldStreak = streak.count;
        streak.count = 1;
        this.addLog("Memory Adaptation", `Study streak was broken after ${oldStreak} days. Re-initiating streak from 1.`);
      }
      streak.lastActiveDate = todayStr;
    }
    this.saveState();
  }

  /**
   * Retrieve all logs
   */
  getLogs() {
    return this.state.logs || [];
  }
}

// Instantiate globally
window.memoryManager = new MemoryManager();
