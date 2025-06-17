// src/services/TimerController.ts
import { EventEmitter } from 'events';

type TimerState = 'running' | 'paused' | 'stopped';

interface TimerData {
  timeoutId: NodeJS.Timeout | null;
  remainingTimeMs: number;
  startTimestamp: number; // Timestamp when timer started or resumed
  state: TimerState;
}

export class TimerController extends EventEmitter {
  private timers: Map<string, TimerData>; // key = sessionId
  private readonly defaultTurnTimeMs: number;

  constructor(defaultTurnTimeSeconds = 120) {
    super();
    this.timers = new Map();
    this.defaultTurnTimeMs = defaultTurnTimeSeconds * 1000; // default 2 minutes
  }

  /**
   * Starts or restarts the timer for a debate session turn
   * @param sessionId - unique id of the debate session
   * @param durationMs - optional custom duration in milliseconds (defaults to defaultTurnTimeMs)
   */
  startTimer(sessionId: string, durationMs?: number) {
    // Clear existing timer if any
    this.clearTimer(sessionId);

    const time = durationMs ?? this.defaultTurnTimeMs;
    const startTimestamp = Date.now();

    // Create timeout to emit turn_timeout when time expires
    const timeoutId = setTimeout(() => {
      this.emit('turn_timeout', sessionId);
      this.clearTimer(sessionId); // clear after timeout
    }, time);

    // Store timer data
    this.timers.set(sessionId, {
      timeoutId,
      remainingTimeMs: time,
      startTimestamp,
      state: 'running',
    });

    this.emit('timer_started', sessionId, time);
  }

  /**
   * Pauses the timer for a given session
   * Calculates remaining time and clears current timeout
   */
  pauseTimer(sessionId: string) {
    const timer = this.timers.get(sessionId);
    if (!timer || timer.state !== 'running') return; // only running timers can be paused

    const elapsed = Date.now() - timer.startTimestamp;
    timer.remainingTimeMs = Math.max(timer.remainingTimeMs - elapsed, 0);

    if (timer.timeoutId) clearTimeout(timer.timeoutId);
    timer.timeoutId = null;
    timer.state = 'paused';

    this.emit('timer_paused', sessionId, timer.remainingTimeMs);
  }

  /**
   * Resumes a paused timer for a given session
   */
  resumeTimer(sessionId: string) {
    const timer = this.timers.get(sessionId);
    if (!timer || timer.state !== 'paused') return; // only paused timers can be resumed

    const startTimestamp = Date.now();

    const timeoutId = setTimeout(() => {
      this.emit('turn_timeout', sessionId);
      this.clearTimer(sessionId);
    }, timer.remainingTimeMs);

    timer.timeoutId = timeoutId;
    timer.startTimestamp = startTimestamp;
    timer.state = 'running';

    this.emit('timer_resumed', sessionId, timer.remainingTimeMs);
  }

  /**
   * Stops and clears the timer for a given session
   */
  clearTimer(sessionId: string) {
    const timer = this.timers.get(sessionId);
    if (timer && timer.timeoutId) {
      clearTimeout(timer.timeoutId);
    }
    this.timers.delete(sessionId);
    this.emit('timer_cleared', sessionId);
  }

  /**
   * Get remaining time in ms for a session timer (0 if none)
   */
  getRemainingTime(sessionId: string): number {
    const timer = this.timers.get(sessionId);
    if (!timer) return 0;

    if (timer.state === 'running') {
      const elapsed = Date.now() - timer.startTimestamp;
      return Math.max(timer.remainingTimeMs - elapsed, 0);
    } else if (timer.state === 'paused') {
      return timer.remainingTimeMs;
    }
    return 0;
  }

  /**
   * Check if timer is running for session
   */
 isRunning(sessionId: string): boolean {
  const timer = this.timers.get(sessionId);
  return timer?.state === 'running';  // Already boolean, no need for ?? false
}
}
