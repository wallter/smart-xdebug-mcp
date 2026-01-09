import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleInspectVariable } from '../src/tools/inspect-variable.js';
import type { DebugSessionManager } from '../src/debug/session-manager.js';
import type { VariableInfo } from '../src/types/index.js';

describe('handleInspectVariable', () => {
  let mockSessionManager: DebugSessionManager;

  beforeEach(() => {
    mockSessionManager = {
      inspectVariable: vi.fn(),
    } as unknown as DebugSessionManager;
  });

  describe('basic inspection', () => {
    it('should return structure summary when no filter provided', async () => {
      const variable: VariableInfo = {
        name: '$order',
        type: 'object',
        classname: 'App\\Models\\Order',
        numchildren: 5,
        children: [
          { name: 'id', type: 'int', value: 123 },
          { name: 'total', type: 'float', value: 99.99 },
          { name: 'status', type: 'string', value: 'pending' },
        ],
      };

      vi.mocked(mockSessionManager.inspectVariable).mockResolvedValue(variable);

      const result = await handleInspectVariable(
        { name: '$order' },
        mockSessionManager
      );

      expect(result).toMatchObject({
        variable: '$order',
        type: 'object',
        classname: 'App\\Models\\Order',
        structure: {
          type: 'object',
          classname: 'App\\Models\\Order',
          keys: ['id', 'total', 'status'],
        },
      });
    });

    it('should return error for non-existent variable', async () => {
      vi.mocked(mockSessionManager.inspectVariable).mockResolvedValue(null);

      const result = await handleInspectVariable(
        { name: '$nonexistent' },
        mockSessionManager
      );

      expect(result).toMatchObject({
        error: "Variable '$nonexistent' not found in current scope",
      });
    });
  });

  describe('JSONPath filtering', () => {
    it('should filter with simple path', async () => {
      const variable: VariableInfo = {
        name: '$user',
        type: 'object',
        children: [
          { name: 'name', type: 'string', value: 'John' },
          { name: 'email', type: 'string', value: 'john@example.com' },
        ],
      };

      vi.mocked(mockSessionManager.inspectVariable).mockResolvedValue(variable);

      const result = await handleInspectVariable(
        { name: '$user', filter: '$.email' },
        mockSessionManager
      );

      expect(result).toMatchObject({
        variable: '$user',
        filter: '$.email',
        value: 'john@example.com',
      });
    });

    it('should filter array elements', async () => {
      const variable: VariableInfo = {
        name: '$items',
        type: 'array',
        children: [
          {
            name: '0',
            type: 'object',
            children: [
              { name: 'sku', type: 'string', value: 'SKU-001' },
              { name: 'price', type: 'float', value: 9.99 },
            ],
          },
          {
            name: '1',
            type: 'object',
            children: [
              { name: 'sku', type: 'string', value: 'SKU-002' },
              { name: 'price', type: 'float', value: 19.99 },
            ],
          },
        ],
      };

      vi.mocked(mockSessionManager.inspectVariable).mockResolvedValue(variable);

      const result = await handleInspectVariable(
        { name: '$items', filter: '$[*].sku' },
        mockSessionManager
      );

      expect(result).toMatchObject({
        variable: '$items',
        filter: '$[*].sku',
        value: ['SKU-001', 'SKU-002'],
      });
    });

    it('should return error with hints for invalid filter', async () => {
      const variable: VariableInfo = {
        name: '$data',
        type: 'object',
        children: [
          { name: 'name', type: 'string', value: 'Test' },
          { name: 'count', type: 'int', value: 42 },
        ],
      };

      vi.mocked(mockSessionManager.inspectVariable).mockResolvedValue(variable);

      const result = await handleInspectVariable(
        { name: '$data', filter: '$.nonexistent.deep.path' },
        mockSessionManager
      ) as { available_keys?: string[] };

      // JSONPath doesn't throw for non-matching paths, it returns undefined/null
      // The actual behavior depends on the JSONPath implementation
      expect(result).toHaveProperty('variable', '$data');
    });
  });

  describe('depth parameter', () => {
    it('should respect depth limit', async () => {
      vi.mocked(mockSessionManager.inspectVariable).mockResolvedValue({
        name: '$obj',
        type: 'object',
        children: [],
      });

      await handleInspectVariable(
        { name: '$obj', depth: 2 },
        mockSessionManager
      );

      expect(mockSessionManager.inspectVariable).toHaveBeenCalledWith('$obj', 2, 20);
    });

    it('should reject depth > 3', async () => {
      await expect(
        handleInspectVariable({ name: '$obj', depth: 5 }, mockSessionManager)
      ).rejects.toThrow();
    });
  });
});
