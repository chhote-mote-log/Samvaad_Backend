// __tests__/RuleEngine.test.ts
import { RuleEngine, RuleViolationError } from '../RuleEngine';

const now = Date.now;

beforeEach(() => {
  jest.useFakeTimers().setSystemTime(now());
  // Reset in-memory state
  (global as any).debateSessions = {
    'test-session': {
      sessionId: 'test-session',
      type: 'text',
      category: 'professional',
      aiEnabled: false,
      durationMins: 10,
      status: 'in_progress',
      participants: {
        user1: { disqualified: false, userId: 'user1' },
        user2: { disqualified: false, userId: 'user2' },
      },
      currentTurn: 'user1',
      turnStartedAt: Date.now(),
      rules: {
        turnDurationSecs: 60,
        allowChat: true,
        allowVoice: false,
      },
      messages: [],
    },
  };
});


afterEach(() => {
  jest.useRealTimers();
(global as any).debateSessions = {};
});

describe('RuleEngine', () => {
  describe('canSpeak()', () => {
    it('should return true if it is user1’s valid turn', () => {
      expect(RuleEngine.canSpeak('test-session', 'user1')).toBe(true);
    });

    it('should return false if not user’s turn', () => {
      expect(RuleEngine.canSpeak('test-session', 'user2')).toBe(false);
    });

    it('should return false if turn expired', () => {
      (global as any).debateSessions['test-session'].turnStartedAt = Date.now() - 61000;
      expect(RuleEngine.canSpeak('test-session', 'user1')).toBe(false);
    });
  });

  describe('switchTurn()', () => {
    it('should switch turn to user2', () => {
      const next = RuleEngine.switchTurn('test-session');
      expect(next).toBe('user2');
      expect((global as any).debateSessions['test-session'].currentTurn).toBe('user2');
    });
  });

  describe('disqualifyUser()', () => {
    it('should mark user1 as disqualified', () => {
      RuleEngine.disqualifyUser('test-session', 'user1');
      expect((global as any).debateSessions['test-session'].participants.user1.disqualified).toBe(true);
    });
  });

  describe('isDebateOver()', () => {
    it('should return false for an active session', () => {
      expect(RuleEngine.isDebateOver('test-session')).toBe(false);
    });

    it('should return true if time has elapsed', () => {
      (global as any).debateSessions['test-session'].turnStartedAt = Date.now() - 11 * 60 * 1000;
      expect(RuleEngine.isDebateOver('test-session')).toBe(true);
    });

    it('should return true if a participant is disqualified', () => {
      RuleEngine.disqualifyUser('test-session', 'user1');
      expect(RuleEngine.isDebateOver('test-session')).toBe(true);
    });
  });

  describe('validateMessage()', () => {
    it('should allow valid message from user1', () => {
      const msg = {
        senderId: 'user1',
        content: 'This is a valid point.',
        timestamp: Date.now(),
        type: 'chat' as const,
      };

      expect(RuleEngine.validateMessage('test-session', msg)).toBe(true);
    });

    it('should throw if not user’s turn', () => {
      const msg = {
        senderId: 'user2',
        content: 'Not my turn',
        timestamp: Date.now(),
        type: 'chat' as const,
      };

      expect(() => RuleEngine.validateMessage('test-session', msg)).toThrow(RuleViolationError);
    });

    it('should throw for profanity', () => {
      const msg = {
        senderId: 'user1',
        content: 'This is shit',
        timestamp: Date.now(),
        type: 'chat' as const,
      };

      expect(() => RuleEngine.validateMessage('test-session', msg)).toThrow(/inappropriate language/i);
    });

    it('should throw for repeated message', () => {
      const session = (global as any).debateSessions['test-session'];
      session.messages.push({
        senderId: 'user1',
        content: 'repeat me',
        timestamp: Date.now(),
        type: 'chat',
      });

      const msg = {
        senderId: 'user1',
        content: 'repeat me',
        timestamp: Date.now(),
        type: 'chat' as const,
      };

      expect(() => RuleEngine.validateMessage('test-session', msg)).toThrow(/repeating the same message/i);
    });

    it('should throw for spamming characters', () => {
      const msg = {
        senderId: 'user1',
        content: '!!!!!!',
        timestamp: Date.now(),
        type: 'chat' as const,
      };

      expect(() => RuleEngine.validateMessage('test-session', msg)).toThrow(/repeated characters/i);
    });

    it('should throw for too short message', () => {
      const msg = {
        senderId: 'user1',
        content: 'hi',
        timestamp: Date.now(),
        type: 'chat' as const,
      };

      expect(() => RuleEngine.validateMessage('test-session', msg)).toThrow(/too short/i);
    });

    it('should throw if message sent too fast', () => {
      RuleEngine['lastMessageTimestamps']['user1'] = Date.now();
      const msg = {
        senderId: 'user1',
        content: 'fast message',
        timestamp: Date.now(),
        type: 'chat' as const,
      };

      expect(() => RuleEngine.validateMessage('test-session', msg)).toThrow(/wait at least/i);
    });

    it('should throw if max messages reached', () => {
      const session = (global as any).debateSessions['test-session'];
      for (let i = 0; i < 30; i++) {
        session.messages.push({
          senderId: 'user1',
          content: `Message ${i}`,
          timestamp: Date.now(),
          type: 'chat',
        });
      }

      const msg = {
        senderId: 'user1',
        content: 'Another one',
        timestamp: Date.now(),
        type: 'chat' as const,
      };

      expect(() => RuleEngine.validateMessage('test-session', msg)).toThrow(/maximum number of messages/i);
    });
  });
});
