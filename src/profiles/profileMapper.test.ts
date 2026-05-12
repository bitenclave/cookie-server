import { describe, expect, it } from 'vitest';

import { extractDomains, toProfileInsert } from './profileMapper.js';

describe('profileMapper', () => {
  it('extracts unique normalized domains', () => {
    expect(
      extractDomains([
        { domain: '.Example.com' },
        { domain: 'example.com' },
        { domain: 'accounts.example.com' },
      ]),
    ).toEqual(['accounts.example.com', 'example.com']);
  });

  it('adds searchable metadata to profile inserts', () => {
    const profile = toProfileInsert({
      name: 'Session',
      group: 'Work',
      cookies: [{ domain: '.example.com' }, { name: 'token' }],
    });

    expect(profile.name).toBe('Session');
    expect(profile.groupName).toBe('Work');
    expect(profile.cookieCount).toBe(2);
    expect(profile.domains).toEqual(['example.com']);
  });

  it('preserves incoming timestamps for full-list sync', () => {
    const profile = toProfileInsert({
      name: 'Session',
      group: 'Work',
      cookies: [],
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-02T00:00:00.000Z',
    });

    expect(profile.createdAt?.toISOString()).toBe('2026-01-01T00:00:00.000Z');
    expect(profile.updatedAt?.toISOString()).toBe('2026-01-02T00:00:00.000Z');
  });
});
