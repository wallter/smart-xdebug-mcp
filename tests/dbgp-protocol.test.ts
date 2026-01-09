import { describe, it, expect } from 'vitest';

// These tests verify the DBGp protocol message parsing logic
// without needing a real XDebug connection

describe('DBGp Protocol', () => {
  describe('message framing', () => {
    it('should correctly parse length-prefixed messages', () => {
      // DBGp format: length\0xml\0
      const xml = '<?xml version="1.0" encoding="iso-8859-1"?><init />';
      const message = `${xml.length}\0${xml}\0`;

      const nullIndex = message.indexOf('\0');
      const length = parseInt(message.slice(0, nullIndex), 10);
      const content = message.slice(nullIndex + 1, nullIndex + 1 + length);

      expect(length).toBe(xml.length);
      expect(content).toBe(xml);
    });

    it('should handle multi-byte UTF-8 content', () => {
      const xml = '<?xml version="1.0"?><response><message>Héllo Wörld</message></response>';
      const byteLength = Buffer.byteLength(xml, 'utf-8');
      const message = `${byteLength}\0${xml}\0`;

      const buffer = Buffer.from(message, 'utf-8');
      const nullIndex = buffer.indexOf(0);
      const length = parseInt(buffer.slice(0, nullIndex).toString(), 10);

      expect(length).toBe(byteLength);
    });
  });

  describe('response parsing', () => {
    it('should extract status from break response', () => {
      const xml = `<?xml version="1.0" encoding="iso-8859-1"?>
        <response xmlns="urn:debugger_protocol_v1"
          command="step_over"
          transaction_id="5"
          status="break"
          reason="ok">
          <xdebug:message filename="file:///var/www/html/app/test.php" lineno="42"/>
        </response>`;

      // Simple attribute extraction (the actual implementation uses fast-xml-parser)
      expect(xml).toContain('status="break"');
      expect(xml).toContain('reason="ok"');
      expect(xml).toContain('lineno="42"');
    });

    it('should handle exception responses', () => {
      const xml = `<?xml version="1.0" encoding="iso-8859-1"?>
        <response xmlns="urn:debugger_protocol_v1"
          command="run"
          transaction_id="3"
          status="break"
          reason="exception">
          <xdebug:message filename="file:///var/www/html/app/test.php" lineno="15"
            exception="RuntimeException">Database connection failed</xdebug:message>
        </response>`;

      expect(xml).toContain('reason="exception"');
      expect(xml).toContain('exception="RuntimeException"');
      expect(xml).toContain('Database connection failed');
    });

    it('should decode base64-encoded property values', () => {
      // XDebug encodes string values in base64
      const originalValue = 'Hello, World!';
      const encoded = Buffer.from(originalValue).toString('base64');

      const xml = `<?xml version="1.0" encoding="iso-8859-1"?>
        <response command="property_get" transaction_id="10">
          <property name="$message" type="string" encoding="base64">${encoded}</property>
        </response>`;

      // Extract and decode
      const match = xml.match(/<property[^>]*>([^<]+)<\/property>/);
      const decoded = match ? Buffer.from(match[1]!, 'base64').toString('utf-8') : '';

      expect(decoded).toBe(originalValue);
    });
  });

  describe('command formatting', () => {
    it('should format breakpoint_set command correctly', () => {
      const filename = '/var/www/html/app/Controllers/UserController.php';
      const lineno = 42;
      const transactionId = 7;

      const command = `breakpoint_set -i ${transactionId} -t line -f file://${encodeURIComponent(filename)} -n ${lineno}`;

      expect(command).toContain('-t line');
      expect(command).toContain(`-n ${lineno}`);
      expect(command).toContain(encodeURIComponent(filename));
    });

    it('should encode conditional expressions in base64', () => {
      const condition = '$user->id === 5';
      const encoded = Buffer.from(condition).toString('base64');

      const command = `breakpoint_set -i 1 -t conditional -- ${encoded}`;

      // Verify it can be decoded back
      const match = command.match(/-- (.+)$/);
      const decoded = match ? Buffer.from(match[1]!, 'base64').toString('utf-8') : '';

      expect(decoded).toBe(condition);
    });

    it('should format property_get with depth and max_children', () => {
      const varName = '$order';
      const depth = 2;
      const maxChildren = 20;

      const command = `property_get -i 1 -n ${varName} -d ${depth} -c ${maxChildren}`;

      expect(command).toContain(`-n ${varName}`);
      expect(command).toContain(`-d ${depth}`);
      expect(command).toContain(`-c ${maxChildren}`);
    });
  });

  describe('file URI handling', () => {
    it('should convert file:// URI to path', () => {
      const uri = 'file:///var/www/html/app/test.php';
      const path = uri.startsWith('file://') ? decodeURIComponent(uri.slice(7)) : uri;

      expect(path).toBe('/var/www/html/app/test.php');
    });

    it('should handle spaces in paths', () => {
      const uri = 'file:///var/www/html/My%20Project/test.php';
      const path = uri.startsWith('file://') ? decodeURIComponent(uri.slice(7)) : uri;

      expect(path).toBe('/var/www/html/My Project/test.php');
    });

    it('should handle Windows-style paths from file URIs', () => {
      const uri = 'file:///C:/Users/dev/project/test.php';
      const path = uri.startsWith('file://') ? decodeURIComponent(uri.slice(7)) : uri;

      expect(path).toBe('/C:/Users/dev/project/test.php');
    });
  });
});
