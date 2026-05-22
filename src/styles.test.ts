import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const styles = readFileSync(resolve('src/styles.css'), 'utf8');

describe('global button styles', () => {
  it('disables the mobile tap highlight overlay', () => {
    expect(styles).toMatch(/button\s*\{[\s\S]*-webkit-tap-highlight-color:\s*transparent;/);
  });
});
