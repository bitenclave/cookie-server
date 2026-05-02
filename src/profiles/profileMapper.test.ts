import { describe, expect, it } from 'vitest';

import { extractDomains, toProfileInsert } from './profileMapper.js';

describe('profileMapper', () => {
  it('extracts unique normalized domains', () => {
    expect(
      extractDomains([
        { domain: '.Example.com' },
        { domain: 'example.com' },
        { domain: 'accounts.example.com' },
      ])
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
});
