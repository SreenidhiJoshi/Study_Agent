/**
 * Question Bank Database and Dynamic Question Generator
 * Contains curated questions for common subjects and a fallback template-based generator
 * for custom user syllabus topics.
 */

const QUESTION_BANK = {
  "computer science": [
    {
      id: "cs_1",
      question: "Which data structure operates on a Last In First Out (LIFO) basis?",
      options: ["Queue", "Stack", "Array", "Linked List"],
      answer: 1,
      explanation: "A Stack is a LIFO (Last In First Out) structure because the last element added is the first one to be removed."
    },
    {
      id: "cs_2",
      question: "What is the time complexity of searching in a balanced Binary Search Tree (BST)?",
      options: ["O(1)", "O(n)", "O(log n)", "O(n log n)"],
      answer: 2,
      explanation: "Searching in a balanced Binary Search Tree splits the search space in half at each step, yielding logarithmic time complexity O(log n)."
    },
    {
      id: "cs_3",
      question: "Which protocol is responsible for resolving an IP address to a physical MAC address?",
      options: ["DNS", "DHCP", "ARP", "NAT"],
      answer: 2,
      explanation: "ARP (Address Resolution Protocol) resolves a known IPv4 address to its corresponding physical MAC hardware address."
    },
    {
      id: "cs_4",
      question: "In database design, what does normalization primary aim to eliminate?",
      options: ["Data redundancy", "Query speed issues", "Table relationships", "Index sizes"],
      answer: 0,
      explanation: "Database normalization is the process of structuring relational tables to reduce data redundancy and improve data integrity."
    },
    {
      id: "cs_5",
      question: "Which of the following is NOT a fundamental concept of Object-Oriented Programming (OOP)?",
      options: ["Encapsulation", "Polymorphism", "Recursion", "Inheritance"],
      answer: 2,
      explanation: "Recursion is a programming technique where a function calls itself. Encapsulation, Polymorphism, and Inheritance are OOP pillars (along with Abstraction)."
    }
  ],
  "physics": [
    {
      id: "phy_1",
      question: "Which of Newton's laws states that for every action, there is an equal and opposite reaction?",
      options: ["First Law", "Second Law", "Third Law", "Law of Gravitation"],
      answer: 2,
      explanation: "Newton's Third Law of Motion states that forces always occur in matched equal and opposite pairs."
    },
    {
      id: "phy_2",
      question: "What is the speed of light in a vacuum, approximately?",
      options: ["300,000 km/s", "150,000 km/s", "3,000 km/s", "30,000 km/s"],
      answer: 0,
      explanation: "The speed of light in a vacuum is approximately 299,792 kilometers per second, which rounds to 300,000 km/s."
    },
    {
      id: "phy_3",
      question: "What physical quantity does the area under a velocity-time graph represent?",
      options: ["Acceleration", "Displacement", "Force", "Work Done"],
      answer: 1,
      explanation: "The area under a velocity-time graph represents the product of velocity and time, which is displacement."
    },
    {
      id: "phy_4",
      question: "Which thermodynamic law states that entropy of an isolated system always increases over time?",
      options: ["Zeroth Law", "First Law", "Second Law", "Third Law"],
      answer: 2,
      explanation: "The Second Law of Thermodynamics states that the total entropy of an isolated system can never decrease over time."
    },
    {
      id: "phy_5",
      question: "What is the unit of electric potential difference?",
      options: ["Ampere", "Ohm", "Watt", "Volt"],
      answer: 3,
      explanation: "The Volt (V) is the SI unit of electromotive force or electric potential difference."
    }
  ],
  "mathematics": [
    {
      id: "math_1",
      question: "What is the value of log(base 10) of 1000?",
      options: ["1", "2", "3", "4"],
      answer: 2,
      explanation: "Since 10 raised to the power of 3 equals 1000, the logarithm base 10 of 1000 is 3."
    },
    {
      id: "math_2",
      question: "What is the derivative of sin(x) with respect to x?",
      options: ["cos(x)", "-cos(x)", "sin(x)", "-sin(x)"],
      answer: 0,
      explanation: "In calculus, the derivative of the sine function is the cosine function: d/dx(sin x) = cos x."
    },
    {
      id: "math_3",
      question: "In a right-angled triangle, if sides are 6 and 8, what is the length of the hypotenuse?",
      options: ["10", "12", "14", "sqrt(14)"],
      answer: 0,
      explanation: "By the Pythagorean theorem: a^2 + b^2 = c^2. 6^2 + 8^2 = 36 + 64 = 100. The square root of 100 is 10."
    },
    {
      id: "math_4",
      question: "What is the sum of interior angles of a regular hexagon?",
      options: ["360 degrees", "540 degrees", "720 degrees", "900 degrees"],
      answer: 2,
      explanation: "The sum of interior angles of a polygon with n sides is (n-2) * 180. For a hexagon (n=6): (6-2)*180 = 4 * 180 = 720 degrees."
    },
    {
      id: "math_5",
      question: "Which of the following numbers is prime?",
      options: ["21", "51", "87", "97"],
      answer: 3,
      explanation: "97 has no divisors other than 1 and itself, making it prime. 21=3x7, 51=3x17, 87=3x29."
    }
  ],
  "chemistry": [
    {
      id: "chem_1",
      question: "What is the chemical symbol for Gold?",
      options: ["Ag", "Au", "Gd", "Fe"],
      answer: 1,
      explanation: "The chemical symbol for Gold is Au, derived from the Latin word 'aurum' meaning shining dawn."
    },
    {
      id: "chem_2",
      question: "What is the pH level of pure water at room temperature?",
      options: ["0", "5", "7", "14"],
      answer: 2,
      explanation: "Pure water is neutral, neither acidic nor basic, and has a pH of exactly 7."
    },
    {
      id: "chem_3",
      question: "Which gas is most abundant in Earth's atmosphere?",
      options: ["Oxygen", "Carbon Dioxide", "Nitrogen", "Argon"],
      answer: 2,
      explanation: "Nitrogen makes up about 78% of Earth's atmosphere, followed by oxygen at approximately 21%."
    },
    {
      id: "chem_4",
      question: "What type of chemical bond involves the sharing of electron pairs between atoms?",
      options: ["Ionic bond", "Covalent bond", "Hydrogen bond", "Metallic bond"],
      answer: 1,
      explanation: "A covalent bond consists of the mutual sharing of one or more pairs of electrons between two atoms."
    },
    {
      id: "chem_5",
      question: "Which element has the atomic number 1?",
      options: ["Helium", "Hydrogen", "Carbon", "Oxygen"],
      answer: 1,
      explanation: "Hydrogen is the simplest and lightest element, with a single proton in its nucleus, atomic number 1."
    }
  ],
  "history": [
    {
      id: "hist_1",
      question: "In which year did World War I begin?",
      options: ["1912", "1914", "1918", "1939"],
      answer: 1,
      explanation: "World War I began on July 28, 1914, following the assassination of Archduke Franz Ferdinand of Austria."
    },
    {
      id: "hist_2",
      question: "Who was the first President of the United States?",
      options: ["Thomas Jefferson", "Abraham Lincoln", "George Washington", "John Adams"],
      answer: 2,
      explanation: "George Washington served as the first president of the United States from 1789 to 1797."
    },
    {
      id: "hist_3",
      question: "Which ancient civilization constructed the Great Pyramid of Giza?",
      options: ["Romans", "Greeks", "Egyptians", "Mesopotamians"],
      answer: 2,
      explanation: "The Great Pyramid of Giza was built as a tomb for the Fourth Dynasty Pharaoh Khufu by the ancient Egyptians."
    },
    {
      id: "hist_4",
      question: "The Magna Carta was signed in which year to limit the power of the English king?",
      options: ["1066", "1215", "1492", "1776"],
      answer: 1,
      explanation: "King John of England signed the Magna Carta at Runnymede in 15 June 1215, laying the foundations for constitutional law."
    },
    {
      id: "hist_5",
      question: "Who was the primary author of the United States Declaration of Independence?",
      options: ["Benjamin Franklin", "John Adams", "Thomas Jefferson", "Alexander Hamilton"],
      answer: 2,
      explanation: "Thomas Jefferson was the principal author of the Declaration of Independence in 1776."
    }
  ]
};

/**
 * Generates custom quiz questions dynamically using template rules for unknown topics
 * @param {string} topicName - Name of the topic
 * @param {string} subjectName - Subject category
 * @returns {Array} - Array of 3 generated question objects
 */
function generateDynamicQuestions(topicName, subjectName = "General Study") {
  const normalizedTopic = topicName.trim();
  
  return [
    {
      id: `dyn_1_${Date.now()}`,
      question: `Which of the following statements best describes the core concept of "${normalizedTopic}"?`,
      options: [
        `It is a foundational methodology used to analyze and structure systems related to ${subjectName}.`,
        `It is a temporary process designed exclusively for solving isolated mathematical proofs.`,
        `It refers to an deprecated physical theory that has been replaced by modern quantum mechanics.`,
        `It is a peripheral database term that relates to backup and recovery protocols.`
      ],
      answer: 0,
      explanation: `"${normalizedTopic}" is an essential topic in ${subjectName} that establishes foundational frameworks and standard practices.`
    },
    {
      id: `dyn_2_${Date.now()}`,
      question: `When implementing or studying "${normalizedTopic}", what is a primary objective to consider?`,
      options: [
        `To minimize electrical resistance in superconducting metals.`,
        `To understand its core parameters, relationships, and application rules within ${subjectName}.`,
        `To historical trace its origin back to early Mesopotamian legal codes.`,
        `To compile the source code into native binary machine commands.`
      ],
      answer: 1,
      explanation: `Understanding key parameters, variables, and contextual relationships is the primary objective when studying "${normalizedTopic}".`
    },
    {
      id: `dyn_3_${Date.now()}`,
      question: `What would be a direct consequence of misapplying or ignoring the principles of "${normalizedTopic}"?`,
      options: [
        `System crashes or calculation errors due to violating core logical rules.`,
        `An immediate increase in local atmospheric pressure.`,
        `A chemical reaction leading to rapid oxidation of surrounding materials.`,
        `It has no material impact, as the concept is purely theoretical and has no practical applications.`
      ],
      answer: 0,
      explanation: `Neglecting the rules or structures of "${normalizedTopic}" results in conceptual inconsistencies, application errors, or system failure in related fields.`
    }
  ];
}

// Export data for modular use
window.QUESTION_BANK = QUESTION_BANK;
window.generateDynamicQuestions = generateDynamicQuestions;
