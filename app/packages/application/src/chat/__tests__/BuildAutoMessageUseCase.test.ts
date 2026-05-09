import { describe, it, expect } from 'vitest';
import { BuildAutoMessageUseCase } from '../BuildAutoMessageUseCase';

describe('BuildAutoMessageUseCase', () => {
  const uc = new BuildAutoMessageUseCase();

  it('renders the Hebrew template with the post title', () => {
    expect(uc.execute({ postTitle: 'ספה תלת מושבית' })).toBe(
      'היי! ראיתי את הפוסט שלך על ספה תלת מושבית. אשמח לדעת עוד.',
    );
  });

  it('trims whitespace around the title', () => {
    expect(uc.execute({ postTitle: '  כיסא משרדי  ' })).toBe(
      'היי! ראיתי את הפוסט שלך על כיסא משרדי. אשמח לדעת עוד.',
    );
  });
});
