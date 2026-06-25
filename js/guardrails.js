/**
 * Guardrails Module (guardrails.js)
 * Implements strict checks to prevent unrealistic study schedules and guides
 * students with actionable, intelligent recommendations.
 */

class StudyGuardrails {
  // Average hours required to fully study, practice, and review a single topic
  static HOURS_PER_TOPIC = 1.5;

  /**
   * Check if a proposed study plan is realistic
   * @param {number} topicCount - Number of topics to schedule
   * @param {number} daysRemaining - Days available between now and the exam (excluding revision reserve days)
   * @param {number} hoursPerDay - Available study hours per day
   * @returns {{
   *   isRealistic: boolean,
   *   severity: 'success' | 'warning' | 'danger',
   *   message: string,
   *   details: string,
   *   recommendations: Array<string>
   * }}
   */
  static validatePlan(topicCount, daysRemaining, hoursPerDay) {
    // Edge case: No topics or immediate exam
    if (topicCount <= 0) {
      return {
        isRealistic: true,
        severity: "success",
        message: "No topics loaded.",
        details: "Please load a syllabus first to analyze.",
        recommendations: []
      };
    }

    if (daysRemaining <= 0) {
      return {
        isRealistic: false,
        severity: "danger",
        message: "Exam date is today or in the past!",
        details: "It is impossible to generate a study timetable for a past or immediate exam date.",
        recommendations: ["Select a future exam date in Settings or the Upload Syllabus page."]
      };
    }

    const totalHoursNeeded = topicCount * this.HOURS_PER_TOPIC;
    const totalHoursAvailable = daysRemaining * hoursPerDay;
    const ratio = totalHoursNeeded / totalHoursAvailable;

    const recommendations = [];

    // Severity levels based on ratio of required hours to available hours
    // Ratio <= 1.0: Perfect, plenty of time!
    // Ratio 1.0 - 1.4: Tight, but manageable with dedication (Warning)
    // Ratio > 1.4: Unrealistic, leading to burnout (Danger)
    if (ratio <= 1.0) {
      return {
        isRealistic: true,
        severity: "success",
        message: "Plan is highly realistic!",
        details: `Sufficient time exists. You need ~${totalHoursNeeded.toFixed(1)} hours in total, and you have ${totalHoursAvailable.toFixed(1)} hours available.`,
        recommendations: []
      };
    } else if (ratio > 1.0 && ratio <= 1.4) {
      // Calculate recommendations
      const suggestedHours = Math.ceil(totalHoursNeeded / daysRemaining);
      const suggestedDays = Math.ceil(totalHoursNeeded / hoursPerDay);
      const daysDifference = suggestedDays - daysRemaining;

      recommendations.push(`Increase your daily study hours from ${hoursPerDay}h to ${suggestedHours}h per day.`);
      recommendations.push(`Or postpone your exam date by at least ${daysDifference} day(s) to distribute workload.`);
      recommendations.push(`Or prioritize High & Medium topics and mark Low priority topics as 'Optional'.`);

      return {
        isRealistic: true, // Still allowed, but marked as warning
        severity: "warning",
        message: "Plan is tight and may be demanding.",
        details: `Workload is heavy. You need ~${totalHoursNeeded.toFixed(1)} hours of study, but only have ${totalHoursAvailable.toFixed(1)} hours available based on your current inputs.`,
        recommendations: recommendations
      };
    } else {
      // ratio > 1.4 - Dangerously unrealistic
      const suggestedHours = Math.ceil(totalHoursNeeded / daysRemaining);
      const suggestedDays = Math.ceil(totalHoursNeeded / hoursPerDay);
      const daysDifference = suggestedDays - daysRemaining;

      recommendations.push(`CRITICAL: Increase daily study hours to at least ${suggestedHours}h to cover all content.`);
      recommendations.push(`Or delay your target exam date by ${daysDifference} days to prevent academic burnout.`);
      recommendations.push(`Or reduce scope: focus only on critical chapters (high priority topics).`);

      return {
        isRealistic: false,
        severity: "danger",
        message: "Plan is highly UNREALISTIC!",
        details: `Your agent blocked this configuration. You need ${totalHoursNeeded.toFixed(1)} study hours, but you only have ${totalHoursAvailable.toFixed(1)} hours of total time allocated.`,
        recommendations: recommendations
      };
    }
  }

  /**
   * Check if a single day's topic list is overloaded
   * @param {number} dailyTopicsCount - Number of topics scheduled for a single day
   * @param {number} hoursPerDay - Available study hours
   * @returns {boolean} - True if overloaded
   */
  static isDayOverloaded(dailyTopicsCount, hoursPerDay) {
    const hoursNeeded = dailyTopicsCount * this.HOURS_PER_TOPIC;
    return hoursNeeded > (hoursPerDay + 1); // Allow a 1-hour buffer
  }
}

// Export guardrails
window.StudyGuardrails = StudyGuardrails;
