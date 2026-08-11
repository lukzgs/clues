/**
 * i18n Translation System — Stress Tests
 *
 * Objective: break the i18n feature by finding structural bugs,
 * type mismatches, missing keys, and runtime logic errors.
 *
 * @vitest-environment node
 */

import { translations } from '../../src/i18n/translations';

// ============================================
// HELPERS
// ============================================

type NestedObj = Record<string, unknown>;

/**
 * Recursively collects all leaf-key paths from an object.
 * Functions are treated as leaves.
 * E.g. { a: { b: 'x', c: (n: number) => '' } } → ['a.b', 'a.c']
 */
function getLeafPaths(obj: NestedObj, prefix = ''): string[] {
  const paths: string[] = [];
  for (const key of Object.keys(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    const val = obj[key];
    if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
      paths.push(...getLeafPaths(val as NestedObj, fullKey));
    } else {
      paths.push(fullKey);
    }
  }
  return paths;
}

/**
 * Get a nested value by dot-path.
 */
function getByPath(obj: NestedObj, path: string): unknown {
  return path.split('.').reduce((acc: unknown, key) => {
    if (acc && typeof acc === 'object') return (acc as NestedObj)[key];
    return undefined;
  }, obj);
}

// ============================================
// 1. STRUCTURAL PARITY — every EN key must exist in PT and vice-versa
// ============================================

describe('Translation structural parity', () => {
  const enPaths = getLeafPaths(translations.en as unknown as NestedObj);
  const ptPaths = getLeafPaths(translations.pt as unknown as NestedObj);

  it('EN and PT should have the exact same number of keys', () => {
    expect(enPaths.length).toBe(ptPaths.length);
  });

  it.each(enPaths)('PT should have key: %s', (path) => {
    const ptVal = getByPath(translations.pt as unknown as NestedObj, path);
    expect(ptVal).toBeDefined();
  });

  it.each(ptPaths)('EN should have key: %s', (path) => {
    const enVal = getByPath(translations.en as unknown as NestedObj, path);
    expect(enVal).toBeDefined();
  });
});

// ============================================
// 2. TYPE PARITY — if EN value is string, PT must be string; if function, function
// ============================================

describe('Translation type parity', () => {
  const enPaths = getLeafPaths(translations.en as unknown as NestedObj);

  it.each(enPaths)('EN and PT should have same type for key: %s', (path) => {
    const enVal = getByPath(translations.en as unknown as NestedObj, path);
    const ptVal = getByPath(translations.pt as unknown as NestedObj, path);
    expect(typeof ptVal).toBe(typeof enVal);
  });
});

// ============================================
// 3. NO EMPTY STRINGS — every string value must be non-empty
// ============================================

describe('No empty translation strings', () => {
  const languages = ['en', 'pt'] as const;

  for (const lang of languages) {
    const paths = getLeafPaths(translations[lang] as unknown as NestedObj);

    it.each(paths)(`[${lang}] key "%s" should not be empty`, (path) => {
      const val = getByPath(translations[lang] as unknown as NestedObj, path);
      if (typeof val === 'string') {
        expect(val.trim().length).toBeGreaterThan(0);
      }
    });
  }
});

// ============================================
// 4. TEMPLATE FUNCTIONS — should return correct interpolated strings
// ============================================

describe('Template function correctness', () => {
  describe('lobby.minPlayers', () => {
    it('EN: should contain the number', () => {
      const result = translations.en.lobby.minPlayers(3);
      expect(result).toContain('3');
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(1);
    });

    it('PT: should contain the number', () => {
      const result = translations.pt.lobby.minPlayers(3);
      expect(result).toContain('3');
      expect(typeof result).toBe('string');
    });
  });

  describe('gameOver.winner', () => {
    it('EN: should contain the player name', () => {
      const result = translations.en.gameOver.winner('Alice');
      expect(result).toContain('Alice');
    });

    it('PT: should contain the player name', () => {
      const result = translations.pt.gameOver.winner('Alice');
      expect(result).toContain('Alice');
    });

    it('EN: should NOT return the same string as PT for the same input', () => {
      const en = translations.en.gameOver.winner('Alice');
      const pt = translations.pt.gameOver.winner('Alice');
      expect(en).not.toBe(pt);
    });

    it('EN: should contain "won"', () => {
      const result = translations.en.gameOver.winner('X');
      expect(result.toLowerCase()).toContain('won');
    });

    it('PT: should contain "venceu"', () => {
      const result = translations.pt.gameOver.winner('X');
      expect(result.toLowerCase()).toContain('venceu');
    });
  });

  describe('modals.kick.message', () => {
    it('EN: should contain the player name', () => {
      const result = translations.en.modals.kick.message('Bob');
      expect(result).toContain('Bob');
    });

    it('PT: should contain the player name', () => {
      const result = translations.pt.modals.kick.message('Bob');
      expect(result).toContain('Bob');
    });

    it('EN: calling with empty string should still return a string', () => {
      const result = translations.en.modals.kick.message('');
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });
  });
});

// ============================================
// 5. NO CROSS-LANGUAGE CONTAMINATION
//    EN values should not contain known PT-only words and vice-versa
// ============================================

describe('No cross-language contamination', () => {
  // Known PT-only words that should NEVER appear in EN translations
  const ptOnlyWords = [
    'você',
    'jogador',
    'pista',
    'sala',
    'iniciar',
    'aguardando',
    'votação',
    'narrador',
  ];
  // Known EN-only words that should NEVER appear in PT translations
  const enOnlyWords = ['player', 'waiting', 'choose', 'spectator', 'narrator'];

  const enPaths = getLeafPaths(translations.en as unknown as NestedObj);
  const ptPaths = getLeafPaths(translations.pt as unknown as NestedObj);

  describe('EN should not contain Portuguese words', () => {
    for (const path of enPaths) {
      const val = getByPath(translations.en as unknown as NestedObj, path);
      if (typeof val !== 'string') continue;

      it(`EN key "${path}" should not contain PT words`, () => {
        const lower = val.toLowerCase();
        for (const ptWord of ptOnlyWords) {
          expect(lower).not.toContain(ptWord);
        }
      });
    }
  });

  describe('PT should not contain English words', () => {
    // Be more targeted — skip keys that legitimately share words
    const skipPaths = new Set([
      'lobby.addBot', // "ADD BOT" is a gaming term kept in EN
      'common.pts', // "Pts" is universal
      'join.title', // "Story Weaver" is the app name
    ]);

    for (const path of ptPaths) {
      if (skipPaths.has(path)) continue;
      const val = getByPath(translations.pt as unknown as NestedObj, path);
      if (typeof val !== 'string') continue;

      it(`PT key "${path}" should not contain EN words`, () => {
        const lower = val.toLowerCase();
        for (const enWord of enOnlyWords) {
          expect(lower).not.toContain(enWord.toLowerCase());
        }
      });
    }
  });
});

// ============================================
// 6. LANGUAGE ENUM — only 'en' and 'pt' should exist
// ============================================

describe('Language keys', () => {
  it('translations object should have exactly 2 languages', () => {
    expect(Object.keys(translations)).toHaveLength(2);
  });

  it('translations should have "en" key', () => {
    expect(translations).toHaveProperty('en');
  });

  it('translations should have "pt" key', () => {
    expect(translations).toHaveProperty('pt');
  });
});

// ============================================
// 7. SECTION COMPLETENESS — each language should have all sections
// ============================================

describe('Section completeness', () => {
  const expectedSections = [
    'common',
    'join',
    'connecting',
    'lobby',
    'game',
    'results',
    'gameOver',
    'modals',
    'afk',
  ];

  for (const section of expectedSections) {
    it(`EN should have section: ${section}`, () => {
      expect(translations.en).toHaveProperty(section);
    });

    it(`PT should have section: ${section}`, () => {
      expect(translations.pt).toHaveProperty(section);
    });
  }
});

// ============================================
// 8. FUNCTION ARITY PARITY — template functions should have the same parameter count
// ============================================

describe('Template function arity parity', () => {
  const enPaths = getLeafPaths(translations.en as unknown as NestedObj);

  for (const path of enPaths) {
    const enVal = getByPath(translations.en as unknown as NestedObj, path);
    const ptVal = getByPath(translations.pt as unknown as NestedObj, path);

    if (typeof enVal === 'function' && typeof ptVal === 'function') {
      it(`function "${path}" should have same arity in EN and PT`, () => {
        expect((ptVal as Function).length).toBe((enVal as Function).length);
      });
    }
  }
});
