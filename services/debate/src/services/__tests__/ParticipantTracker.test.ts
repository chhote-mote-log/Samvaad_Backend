import { ParticipantTracker, DebateParticipant } from '../ParticipantTracker';
import { dbConnector } from '../DBConnector';

jest.mock('../DBConnector');

const mockDb = dbConnector as jest.Mocked<typeof dbConnector>;

describe('ParticipantTracker', () => {
  let tracker: ParticipantTracker;
  const sessionId = 'session-123';
  const participant: DebateParticipant = {
    id: 'user-1',
    name: 'Alice',
    role: 'pro',
    isConnected: true,
    score: 0,
  };

  beforeEach(() => {
    tracker = new ParticipantTracker();
    jest.clearAllMocks();
  });

  test('adds participant and persists in DB', async () => {
    const addSpy = jest.fn();
    tracker.on('participant_added', addSpy);

    await tracker.addParticipant(sessionId, participant);

    expect(tracker.isParticipantInSession(sessionId, participant.id)).toBe(true);
    expect(mockDb.addParticipant).toHaveBeenCalledWith(sessionId, expect.objectContaining({
      id: participant.id,
      name: participant.name,
      role: participant.role,
      isConnected: true,
    }));
    expect(addSpy).toHaveBeenCalledWith(sessionId, participant.id);
  });

  test('throws error when adding duplicate participant', async () => {
    await tracker.addParticipant(sessionId, participant);
    await expect(tracker.addParticipant(sessionId, participant)).rejects.toThrow();
  });

test('markConnected updates status and calls DB (debounced)', async () => {
  const sessionId = 'session-123';
 const participant: DebateParticipant = {
  id: 'user-1',
  name: 'Alice',
  role: 'pro', // ✅ valid value
  isConnected: false,
  score: 0,
};
  await tracker.addParticipant(sessionId, participant);
  await tracker.markConnected(sessionId, participant.id);

  expect(tracker.isConnected(sessionId, participant.id)).toBe(true);

  jest.runAllTimers(); // Flush debounce
  await Promise.resolve();

  expect(mockDb.markParticipantConnected).toHaveBeenCalledWith(participant.id);
});


  test('markDisconnected updates status and calls DB (debounced)', async () => {
    await tracker.addParticipant(sessionId, participant);
    const disconnectSpy = jest.fn();
    tracker.on('participant_disconnected', disconnectSpy);

    tracker.markDisconnected(sessionId, participant.id);

    expect(tracker.isConnected(sessionId, participant.id)).toBe(false);
    expect(mockDb.markParticipantDisconnected).toHaveBeenCalledWith(participant.id);


    jest.runAllTimers(); // Flush debounce
    await Promise.resolve();
    expect(mockDb.markParticipantDisconnected).toHaveBeenCalledWith(participant.id);
  });

  test('getSessionStatus returns full status object', async () => {
    await tracker.addParticipant(sessionId, participant);
    const status = tracker.getSessionStatus(sessionId);
    expect(status[participant.id].isConnected).toBe(true);
  });

  test('removeSession clears state and calls DB', async () => {
    await tracker.addParticipant(sessionId, participant);
    const removeSpy = jest.fn();
    tracker.on('session_removed', removeSpy);

    await tracker.removeSession(sessionId);

    expect(tracker.getSessionStatus(sessionId)).toEqual({});
    expect(mockDb.removeParticipantsBySession).toHaveBeenCalledWith(sessionId);
    expect(removeSpy).toHaveBeenCalledWith(sessionId);
  });

  test('isConnected returns false for unknown participants', () => {
    expect(tracker.isConnected('non-existent', 'user-x')).toBe(false);
  });

  test('isParticipantInSession returns false for unknown session/participant', () => {
    expect(tracker.isParticipantInSession('nope', 'nobody')).toBe(false);
  });
});
jest.useFakeTimers();
