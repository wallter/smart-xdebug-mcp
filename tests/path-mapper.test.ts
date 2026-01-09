import { describe, it, expect, beforeEach } from 'vitest';
import { PathMapper } from '../src/debug/path-mapper.js';

describe('PathMapper', () => {
  let mapper: PathMapper;

  beforeEach(() => {
    mapper = new PathMapper('/home/user/project');
  });

  describe('toLocal', () => {
    it('should translate remote container path to local path', async () => {
      await mapper.loadMappings([
        { local: '/home/user/project', remote: '/var/www/html' },
      ]);

      const result = mapper.toLocal('/var/www/html/app/Controllers/UserController.php');
      expect(result).toBe('/home/user/project/app/Controllers/UserController.php');
    });

    it('should handle file:// URIs', async () => {
      await mapper.loadMappings([
        { local: '/home/user/project', remote: '/var/www/html' },
      ]);

      const result = mapper.toLocal('file:///var/www/html/app/Models/User.php');
      expect(result).toBe('/home/user/project/app/Models/User.php');
    });

    it('should return path unchanged if no mapping matches', async () => {
      await mapper.loadMappings([
        { local: '/home/user/project', remote: '/var/www/html' },
      ]);

      const result = mapper.toLocal('/some/other/path/file.php');
      expect(result).toBe('/some/other/path/file.php');
    });

    it('should URL-decode encoded paths', async () => {
      await mapper.loadMappings([
        { local: '/home/user/project', remote: '/var/www/html' },
      ]);

      const result = mapper.toLocal('file:///var/www/html/path%20with%20spaces/file.php');
      expect(result).toBe('/home/user/project/path with spaces/file.php');
    });
  });

  describe('toRemote', () => {
    it('should translate local path to remote container path', async () => {
      await mapper.loadMappings([
        { local: '/home/user/project', remote: '/var/www/html' },
      ]);

      const result = mapper.toRemote('app/Controllers/UserController.php');
      expect(result).toBe('/var/www/html/app/Controllers/UserController.php');
    });

    it('should handle absolute local paths', async () => {
      await mapper.loadMappings([
        { local: '/home/user/project', remote: '/var/www/html' },
      ]);

      const result = mapper.toRemote('/home/user/project/app/Models/User.php');
      expect(result).toBe('/var/www/html/app/Models/User.php');
    });
  });

  describe('loadMappings', () => {
    it('should use explicit mappings when provided', async () => {
      await mapper.loadMappings([
        { local: '/custom/path', remote: '/container/path' },
      ]);

      const mappings = mapper.getMappings();
      expect(mappings).toHaveLength(1);
      expect(mappings[0]).toEqual({
        local: '/custom/path',
        remote: '/container/path',
      });
    });

    it('should use default mapping when no config found', async () => {
      mapper.setProjectRoot('/nonexistent/project');
      await mapper.loadMappings();

      const mappings = mapper.getMappings();
      expect(mappings).toHaveLength(1);
      expect(mappings[0]?.remote).toBe('/var/www/html');
    });
  });
});
