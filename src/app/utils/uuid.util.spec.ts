import { UuidUtil } from './uuid.util';

describe('UuidUtil', () => {
  describe('generate()', () => {
    it('should return a string', () => {
      expect(typeof UuidUtil.generate()).toBe('string');
    });

    it('should match UUID v4 format', () => {
      const uuid = UuidUtil.generate();
      const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(uuid).toMatch(uuidV4Regex);
    });

    it('should generate unique values', () => {
      const ids = new Set(Array.from({ length: 100 }, () => UuidUtil.generate()));
      expect(ids.size).toBe(100);
    });

    it('should always have version 4 in the correct position', () => {
      for (let i = 0; i < 10; i++) {
        const uuid = UuidUtil.generate();
        expect(uuid[14]).toBe('4');
      }
    });

    it('should always have a valid variant character', () => {
      for (let i = 0; i < 10; i++) {
        const uuid = UuidUtil.generate();
        expect(['8', '9', 'a', 'b']).toContain(uuid[19]);
      }
    });
  });
});
