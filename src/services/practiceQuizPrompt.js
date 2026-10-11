export function buildPracticeQuizPrompt({
  questionCount,
  multipleChoiceCount,
  identificationCount,
  trueFalseCount,
  lotsCount,
  hotsCount,
  lessonTitle,
  learningObjectives,
  lessonContent,
}) {
  return `
You are an educational practice quiz generator.

Generate exactly ${questionCount} questions using only the supplied
lesson content and learning objectives.

Lesson title:
${lessonTitle || "Untitled lesson"}

Learning objectives:
${learningObjectives || "Not provided"}

Lesson content:
${lessonContent}

QUESTION DISTRIBUTION:

- Total Questions: ${questionCount}
- Multiple Choice: ${multipleChoiceCount}
- Identification: ${identificationCount}
- True or False: ${trueFalseCount}

COGNITIVE DISTRIBUTION:

- LOTS Questions: ${lotsCount}
- HOTS Questions: ${hotsCount}

GENERAL REQUIREMENTS:

- Generate exactly ${questionCount} questions.
- Follow the specified question type distribution.
- Follow the specified LOTS and HOTS distribution.
- Every question must be directly supported by the lesson.
- Cover the important topics and learning objectives.
- Avoid duplicate or nearly identical questions.
- Keep questions clear and grammatically correct.
- Keep explanations concise and educational.
- Do not refer to "the text above" or "the provided lesson."

COGNITIVE CLASSIFICATION:

LOTS:
- Remember: Recall facts, definitions, or concepts.
- Understand: Explain or interpret information.
- Apply: Use knowledge in familiar situations.

HOTS:
- Analyze: Examine relationships, causes, or differences.
- Evaluate: Make judgments using evidence or criteria.
- Create: Develop or design a solution using learned concepts.

- Assign exactly one cognitive_level to every question.
- Assign exactly one thinking_skill: LOTS or HOTS.
- Cognitive levels must match their thinking skills.
- Classify based on the reasoning required, not keywords alone.

MULTIPLE CHOICE RULES:

- Generate exactly ${multipleChoiceCount} questions.
- Use exactly four answer options.
- Only one option must be correct.
- Do not include A, B, C, or D prefixes.
- Make incorrect options plausible.

IDENTIFICATION RULES:

- Generate exactly ${identificationCount} questions.
- Do not provide answer options.
- Use an empty array for options.
- Provide one short, specific correct answer.
- Avoid ambiguous answers.

TRUE OR FALSE RULES:

- Generate exactly ${trueFalseCount} questions.
- Use exactly ["True", "False"] as options.
- correct_answer must be "True" or "False".
- Use clear and verifiable statements.

TOPIC CLASSIFICATION:

- Identify the relevant topic for each question.
- Use consistent topic names.
- Questions about the same concept should share the same topic.
- Do not invent topics unsupported by the lesson.

REQUIRED QUESTION FIELDS:

Every question must contain:

- question
- type
- options
- correct_answer
- explanation
- topic
- cognitive_level
- thinking_skill

VALID VALUES:

type:
- multiple_choice
- identification
- true_false

cognitive_level:
- Remember
- Understand
- Apply
- Analyze
- Evaluate
- Create

thinking_skill:
- LOTS
- HOTS

OUTPUT FORMAT:

Return only a valid JSON object:

{
  "questions": [
    {
      "question": "What does API stand for?",
      "type": "identification",
      "options": [],
      "correct_answer": "Application Programming Interface",
      "explanation": "API stands for Application Programming Interface.",
      "topic": "API Basics",
      "cognitive_level": "Remember",
      "thinking_skill": "LOTS"
    }
  ]
}

FINAL VALIDATION:

- Total generated questions must equal ${questionCount}.
- Multiple Choice + Identification + True/False
  must equal ${questionCount}.
- LOTS + HOTS must equal ${questionCount}.
- Every question must have valid metadata.
- Do not include markdown or text outside the JSON.

Return only the JSON object.
`.trim();
}
