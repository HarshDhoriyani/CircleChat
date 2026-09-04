import { GoogleGenerativeAI } from '@google/generative-ai';
import { Message } from '../models/Message.js';
import { Conversation } from '../models/Conversation.js';
import { ApiError } from '../utils/apiError.js';
import { logger } from '../utils/logger.js';

export const aiService = {
  /**
   * Generates a structured Catch Me Up summary from conversation history
   */
  async generateCatchMeUpSummary(conversationId, userId, { unreadOnly = false, messageLimit = 50 }) {
    // 1. Verify user membership in the conversation
    const conv = await Conversation.findOne({
      _id: conversationId,
      participants: userId,
    });

    if (!conv) {
      throw ApiError.forbidden('You do not have access to this conversation');
    }

    // 2. Fetch relevant message history
    const query = { conversationId };
    if (unreadOnly) {
      query.readBy = { $ne: userId };
    }

    const limit = Math.min(60, Math.max(5, parseInt(messageLimit, 10) || 40));

    const messages = await Message.find(query)
      .populate('sender', 'name username')
      .sort({ createdAt: -1 })
      .limit(limit);

    if (!messages || messages.length === 0) {
      return {
        summary: 'No recent messages to summarize in this conversation.',
        decisions: [],
        actionItems: [],
        deadlines: [],
      };
    }

    // Chronological order for AI context
    const chronologicalMessages = messages.reverse();

    const formattedTranscript = chronologicalMessages
      .map((m) => {
        const sender = m.sender?.name || m.sender?.username || 'User';
        const time = new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const text = m.text || (m.attachments?.length ? `[Sent ${m.attachments.length} attachment(s)]` : '');
        return `[${time}] ${sender}: ${text}`;
      })
      .join('\n');

    // 3. Call Gemini AI API if valid Google AI Studio key provided, else use intelligent contextual synthesizer
    const apiKey = process.env.GEMINI_API_KEY?.trim();

    if (apiKey && apiKey.length > 10) {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.2,
          },
        });

        const prompt = `You are an AI collaboration assistant embedded inside a real-time team messaging platform.
Analyze the following conversation transcript from the group "${conv.name || 'Chat'}" and produce a concise, actionable JSON summary strictly based on the real content.
If there are no explicit decisions made, return an empty array for decisions.
If there are no actionable tasks or todos assigned, return an empty array for actionItems.
If there are no explicit deadlines or dates mentioned, return an empty array for deadlines.
Do NOT invent or hallucinate dummy data.

TRANSCRIPT:
${formattedTranscript}

You MUST return ONLY valid JSON matching this exact structure:
{
  "summary": "2-3 sentence executive recap of what was actually discussed.",
  "decisions": ["List of key decisions agreed upon, or empty if none"],
  "actionItems": [
    {
      "id": "act_1",
      "task": "Clear, actionable task description",
      "assignee": "Name of person responsible or 'Team'",
      "done": false
    }
  ],
  "deadlines": [
    {
      "id": "dl_1",
      "event": "Event or milestone description",
      "date": "Date or time specified in chat"
    }
  ]
}`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        const parsed = JSON.parse(responseText);

        logger.info('✨ Google Gemini synthesized Catch Me Up summary successfully');

        return {
          summary: parsed.summary || 'Summary synthesized from recent discussion.',
          decisions: Array.isArray(parsed.decisions) ? parsed.decisions : [],
          actionItems: Array.isArray(parsed.actionItems)
            ? parsed.actionItems.map((item, idx) => ({
                id: item.id || `act_${idx + 1}`,
                task: item.task || String(item),
                assignee: item.assignee || 'Team',
                done: Boolean(item.done),
              }))
            : [],
          deadlines: Array.isArray(parsed.deadlines)
            ? parsed.deadlines.map((dl, idx) => ({
                id: dl.id || `dl_${idx + 1}`,
                event: dl.event || String(dl),
                date: dl.date || 'TBD',
              }))
            : [],
        };
      } catch (err) {
        logger.info(`ℹ️ Gemini API unavailable (${err.message.split('\n')[0]}). Using contextual synthesis.`);
      }
    }

    // 4. Truthful contextual heuristic synthesizer (used when Gemini is unavailable or not configured)
    return this.generateHeuristicSummary(chronologicalMessages, conv.name);
  },

  generateHeuristicSummary(messages, convName = 'this channel') {
    const participants = new Set(
      messages.map((m) => m.sender?.name || m.sender?.username).filter(Boolean)
    );
    const participantList = Array.from(participants).join(', ') || 'participants';
    const latestTexts = messages.map((m) => m.text?.trim()).filter(Boolean);

    // Build truthful summary based on actual conversation messages
    let summary = '';
    if (latestTexts.length === 0) {
      summary = `No recent text messages found in ${convName} to summarize.`;
    } else if (latestTexts.length <= 3) {
      const excerpt = latestTexts
        .map((t) => `"${t.length > 50 ? t.substring(0, 47) + '...' : t}"`)
        .join(', ');
      summary = `Recent conversation in ${convName} between ${participantList} includes: ${excerpt}.`;
    } else {
      const firstText = latestTexts[0].substring(0, 50);
      const lastText = latestTexts[latestTexts.length - 1].substring(0, 50);
      summary = `The discussion in ${convName} involving ${participantList} includes ${latestTexts.length} recent messages, starting with "${firstText}..." and concluding around "${lastText}...".`;
    }

    // Extract genuine decisions (only if explicitly stated in text, no mock/demo items)
    const decisions = [];
    messages.forEach((m) => {
      const text = (m.text || '').trim();
      const lower = text.toLowerCase();
      if (
        (lower.startsWith('agreed') ||
          lower.startsWith('decided') ||
          lower.includes('agreed to') ||
          lower.includes('decided to') ||
          lower.includes('let\'s go with') ||
          lower.includes('we approved') ||
          lower.includes('confirmed that')) &&
        !text.includes('?') &&
        !text.includes('✨')
      ) {
        const cleanDecision = text.split('\n')[0].substring(0, 120);
        if (!decisions.includes(cleanDecision)) {
          decisions.push(cleanDecision);
        }
      }
    });

    // Extract genuine action items (only if actual tasks/todos, skip questions & recaps)
    const actionItems = [];
    messages.forEach((m) => {
      const text = (m.text || '').trim();
      const lower = text.toLowerCase();

      // Skip questions, recaps, and empty strings
      if (text.endsWith('?') || text.includes('✨') || lower.includes('ai recap') || text.length < 5) {
        return;
      }

      const isTaskPattern =
        lower.startsWith('todo:') ||
        lower.startsWith('task:') ||
        lower.includes('need to ') ||
        lower.includes('please check') ||
        lower.includes('please fix') ||
        lower.includes('please update') ||
        lower.includes('please send') ||
        lower.includes('can you please') ||
        lower.includes('action item:');

      if (isTaskPattern) {
        const cleanTask = text
          .split('\n')[0]
          .replace(/^(todo:|task:|action item:)\s*/i, '')
          .substring(0, 100);

        if (cleanTask.length > 5 && !actionItems.some((a) => a.task === cleanTask)) {
          actionItems.push({
            id: `act_${actionItems.length + 1}`,
            task: cleanTask,
            assignee: m.sender?.name || 'Team',
            done: false,
          });
        }
      }
    });

    // Extract genuine deadlines (only if date/time patterns actually appear in messages)
    const deadlines = [];
    const dateRegex = /\b(by\s+(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday|\d{1,2}[:/]\d{1,2}|\d{1,2}\s+(am|pm))|due\s+(today|tomorrow|monday|next\s+week|\d{1,2}[:/]\d{1,2})|deadline\s+(is\s+)?(today|tomorrow|next\s+week|\d{1,2}[:/]\d{1,2}))/i;

    messages.forEach((m) => {
      const text = (m.text || '').trim();
      const match = text.match(dateRegex);
      if (match) {
        const firstLine = text.split('\n')[0].substring(0, 80);
        deadlines.push({
          id: `dl_${deadlines.length + 1}`,
          event: firstLine,
          date: match[0],
        });
      }
    });

    return {
      summary,
      decisions: decisions.slice(0, 4),
      actionItems: actionItems.slice(0, 5),
      deadlines: deadlines.slice(0, 3),
    };
  },
};

export default aiService;
