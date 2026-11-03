---
name: grill-me
description: Stress-test an idea, plan, or decision through dependency-aware rounds of clarifying questions. Use only when the user explicitly invokes `/grill-me`, says "grill me", or asks for a rigorous pre-planning interview; do not use for ordinary implementation, review, or status requests.
---

# Grill Me

Turn an underspecified idea into decisions the user can explain and defend. This
is a conversation, not authorization to create a plan, edit files, or implement
the result.

Adapted for LLHelper from Matt Pocock's
[`grill-me`](https://github.com/mattpocock/skills/tree/main/skills/productivity/grill-me)
and
[`grilling`](https://github.com/mattpocock/skills/tree/main/skills/productivity/grilling)
skills.

## Interview loop

1. State the subject and the boundary of the decision in one or two sentences.
   If the subject is too broad for one session, propose a smaller slice and get
   the user's agreement before continuing.
2. Model the subject as a decision tree. A question belongs to the current
   frontier only when every decision it depends on is already settled.
3. Resolve repository or external facts with the available read-only tools
   instead of asking the user. Follow the active delegation policy; this skill
   does not itself authorize sub-agents or external mutations.
4. Ask one coherent, manageable round from the current frontier. Number the
   questions. For each question, explain why it matters and give a recommended
   answer with its trade-off. Keep alternatives genuinely selectable; do not
   phrase the question so passive agreement automatically accepts the model's
   recommendation.
5. Wait for the user's answers. Treat disagreement and "I don't know" as useful
   results, update the tree, and ask the next newly unblocked round.
6. Stop when the frontier is empty, the user asks to stop, or the remaining
   question cannot be answered by discussion. For an evidence, interaction, or
   visual-design question, recommend the smallest research task or throwaway
   prototype needed instead of extending the interview with guesses.

## Completion

Summarize:

- decisions made and the user's stated reasons;
- assumptions that were rejected or changed;
- unresolved questions and what evidence would resolve them;
- the next artifact, if any, that the user may separately ask to create.

Ask the user to confirm the summary. Do not silently convert the conversation
into a specification or begin implementation.
