export type SourceCandidate = {
  url: string;
  title: string;
  excerpt: string;
};

export type SourceMatch = {
  url: string;
  title: string;
  confidence: number;
  reasoning: string;
};

export class InputParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InputParseError";
  }
}
