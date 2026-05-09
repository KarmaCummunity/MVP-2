/** FR-CHAT-005 AC1 — render the auto-message for a post-anchored chat entry. */
export interface BuildAutoMessageInput {
  postTitle: string;
}

export class BuildAutoMessageUseCase {
  execute(input: BuildAutoMessageInput): string {
    const title = input.postTitle.trim();
    return `היי! ראיתי את הפוסט שלך על ${title}. אשמח לדעת עוד.`;
  }
}
