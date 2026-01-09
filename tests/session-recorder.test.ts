import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SessionRecorder } from '../src/debug/session-recorder.js';
import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

describe('SessionRecorder', () => {
  let recorder: SessionRecorder;
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'xdebug-test-'));
    recorder = new SessionRecorder(tempDir);
  });

  afterEach(() => {
    recorder.close();
    rmSync(tempDir, { recursive: true, force: true });
  });

  describe('session lifecycle', () => {
    it('should initialize a new session', async () => {
      await recorder.initSession('test-session-1');

      // Session should be created - no error means success
      expect(true).toBe(true);
    });

    it('should finalize session with summary', async () => {
      await recorder.initSession('test-session-2');

      await recorder.recordStep('test-session-2', 1, {
        file: '/app/test.php',
        line: 10,
      }, 'breakpoint_hit');

      await recorder.recordVariable(
        'test-session-2',
        1,
        { file: '/app/test.php', line: 10 },
        '$message',
        'Hello World'
      );

      const summary = await recorder.finalizeSession('test-session-2');

      expect(summary).not.toBeNull();
      expect(summary?.sessionId).toBe('test-session-2');
      expect(summary?.totalSteps).toBe(1);
      expect(summary?.breakpointsHit).toBe(1);
      expect(summary?.variablesInspected).toContain('$message');
    });
  });

  describe('step recording', () => {
    it('should record execution steps', async () => {
      await recorder.initSession('test-session-3');

      await recorder.recordStep('test-session-3', 1, {
        file: '/app/UserController.php',
        line: 42,
        function: 'store',
      }, 'breakpoint_hit');

      await recorder.recordStep('test-session-3', 2, {
        file: '/app/UserController.php',
        line: 43,
      }, 'step_complete');

      const summary = await recorder.finalizeSession('test-session-3');

      expect(summary?.totalSteps).toBe(2);
      expect(summary?.executionPath).toHaveLength(2);
      expect(summary?.executionPath[0]).toMatchObject({
        file: '/app/UserController.php',
        line: 42,
        function: 'store',
      });
    });

    it('should count exceptions separately', async () => {
      await recorder.initSession('test-session-4');

      await recorder.recordStep('test-session-4', 1, {
        file: '/app/test.php',
        line: 10,
      }, 'breakpoint_hit');

      await recorder.recordStep('test-session-4', 2, {
        file: '/app/test.php',
        line: 20,
      }, 'exception');

      const summary = await recorder.finalizeSession('test-session-4');

      expect(summary?.breakpointsHit).toBe(1);
      expect(summary?.exceptionsThrown).toBe(1);
    });
  });

  describe('variable history', () => {
    it('should record and retrieve variable history', async () => {
      await recorder.initSession('test-session-5');

      // Record variable at step 1
      await recorder.recordVariable(
        'test-session-5',
        1,
        { file: '/app/test.php', line: 10 },
        '$counter',
        0
      );

      // Record same variable at step 2 with different value
      await recorder.recordVariable(
        'test-session-5',
        2,
        { file: '/app/test.php', line: 15 },
        '$counter',
        5
      );

      // Record same variable at step 3
      await recorder.recordVariable(
        'test-session-5',
        3,
        { file: '/app/test.php', line: 20 },
        '$counter',
        10
      );

      // Query history from step 3
      const history = await recorder.getVariableHistory('test-session-5', '$counter', 3, 10);

      expect(history).toHaveLength(3);
      // Should be ordered by step descending
      expect((history[0] as { step: number }).step).toBe(3);
      expect((history[0] as { value: number }).value).toBe(10);
      expect((history[2] as { step: number }).step).toBe(1);
      expect((history[2] as { value: number }).value).toBe(0);
    });

    it('should return empty array for unrecorded variables', async () => {
      await recorder.initSession('test-session-6');

      const history = await recorder.getVariableHistory('test-session-6', '$nonexistent', 10, 5);

      expect(history).toHaveLength(0);
    });

    it('should respect limit parameter', async () => {
      await recorder.initSession('test-session-7');

      // Record 5 values
      for (let i = 1; i <= 5; i++) {
        await recorder.recordVariable(
          'test-session-7',
          i,
          { file: '/app/test.php', line: i * 10 },
          '$value',
          i * 100
        );
      }

      const history = await recorder.getVariableHistory('test-session-7', '$value', 5, 2);

      expect(history).toHaveLength(2);
    });

    it('should handle complex values (objects/arrays)', async () => {
      await recorder.initSession('test-session-8');

      const complexValue = {
        name: 'John',
        orders: [
          { id: 1, total: 99.99 },
          { id: 2, total: 149.99 },
        ],
      };

      await recorder.recordVariable(
        'test-session-8',
        1,
        { file: '/app/test.php', line: 10 },
        '$user',
        complexValue
      );

      const history = await recorder.getVariableHistory('test-session-8', '$user', 1, 1);

      expect(history).toHaveLength(1);
      expect((history[0] as { value: typeof complexValue }).value).toEqual(complexValue);
    });
  });
});
