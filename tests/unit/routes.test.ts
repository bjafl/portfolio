import { describe, expect, test } from 'vitest';
import {
  alternatePath,
  getLocaleFromPath,
  localizePath,
} from '../../src/i18n/routes';

describe('localizePath', () => {
  test('projects', () => {
    expect(localizePath('projects', 'nb')).toBe('/prosjekter/');
    expect(localizePath('projects', 'en')).toBe('/en/projects/');
  });

  test('project detail', () => {
    expect(localizePath('project', 'en', 'e2ee-drop')).toBe('/en/projects/e2ee-drop/');
  });

  test('about and home', () => {
    expect(localizePath('about', 'nb')).toBe('/om/');
    expect(localizePath('home', 'en')).toBe('/en/');
  });
});

describe('getLocaleFromPath', () => {
  test('detects locale from prefix', () => {
    expect(getLocaleFromPath('/en/about/')).toBe('en');
    expect(getLocaleFromPath('/om/')).toBe('nb');
    expect(getLocaleFromPath('/')).toBe('nb');
  });
});

describe('alternatePath', () => {
  test('nb project list to en', () => {
    expect(alternatePath('/prosjekter/stillas/', 'en')).toBe('/en/projects/stillas/');
  });

  test('en about to nb', () => {
    expect(alternatePath('/en/about/', 'nb')).toBe('/om/');
  });

  test('falls back to project list when project is unavailable in target locale', () => {
    expect(alternatePath('/prosjekter/x/', 'en', () => false)).toBe('/en/projects/');
  });

  test('unknown path falls back to home of target locale', () => {
    expect(alternatePath('/foo/', 'en')).toBe('/en/');
  });
});
