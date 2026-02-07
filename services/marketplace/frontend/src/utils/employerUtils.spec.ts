import { describe, it, expect } from 'vitest';
import {
  employerInitials,
  getEmployerColor,
  avatarStyle,
  headerStyle,
  employerHeaderStyle,
} from './employerUtils';

describe('employerUtils', () => {
  describe('employerInitials', () => {
    it('returns first two letters of first two words', () => {
      expect(employerInitials('Acme Corp')).toBe('AC');
      expect(employerInitials('John Smith')).toBe('JS');
    });

    it('handles single word', () => {
      expect(employerInitials('Acme')).toBe('A');
    });

    it('handles multiple words', () => {
      expect(employerInitials('Acme Corporation Inc')).toBe('AC');
    });

    it('returns uppercase', () => {
      expect(employerInitials('acme corp')).toBe('AC');
    });

    it('handles empty string', () => {
      expect(employerInitials('')).toBe('');
    });
  });

  describe('getEmployerColor', () => {
    it('returns a hex color', () => {
      const color = getEmployerColor('Acme');
      expect(color).toMatch(/^#[0-9a-fA-F]{6}$/);
    });

    it('returns same color for same input', () => {
      expect(getEmployerColor('Acme')).toBe(getEmployerColor('Acme'));
    });

    it('returns different colors for different inputs', () => {
      const colors = new Set([
        getEmployerColor('A'),
        getEmployerColor('B'),
        getEmployerColor('C'),
        getEmployerColor('D'),
        getEmployerColor('E'),
        getEmployerColor('F'),
      ]);
      expect(colors.size).toBeGreaterThan(1);
    });
  });

  describe('avatarStyle', () => {
    it('returns backgroundColor from getEmployerColor', () => {
      const style = avatarStyle('Acme');
      expect(style).toEqual({ backgroundColor: getEmployerColor('Acme') });
    });
  });

  describe('headerStyle', () => {
    it('returns gradient with image when employerImage is provided', () => {
      const job = { employerName: 'Acme', employerImage: 'https://example.com/img.png' };
      const style = headerStyle(job);
      expect(style.backgroundImage).toContain('url(https://example.com/img.png)');
      expect(style.backgroundSize).toBe('cover');
      expect(style.backgroundPosition).toBe('center');
    });

    it('returns gradient with color when no employerImage', () => {
      const job = { employerName: 'Acme' };
      const style = headerStyle(job);
      expect(style.background).toMatch(/linear-gradient/);
      expect(style.background).toContain(getEmployerColor('Acme'));
    });
  });

  describe('employerHeaderStyle', () => {
    it('returns image styles when employerImage is provided', () => {
      const job = { employerName: 'Acme', employerImage: 'https://example.com/img.png' };
      const style = employerHeaderStyle(job);
      expect(style.backgroundImage).toBe('url(https://example.com/img.png)');
      expect(style.backgroundSize).toBe('cover');
      expect(style.backgroundPosition).toBe('center');
    });

    it('returns avatarStyle when no employerImage', () => {
      const job = { employerName: 'Acme' };
      const style = employerHeaderStyle(job);
      expect(style).toEqual(avatarStyle('Acme'));
    });
  });
});
