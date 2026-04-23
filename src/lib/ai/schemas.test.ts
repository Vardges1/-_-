import { describe, expect, it } from "vitest";
import {
  llmCategorySuggestionSchema,
  llmDecomposeSchema,
  parseModelJsonObject,
  stripMarkdownFences,
} from "./schemas";

describe("stripMarkdownFences", () => {
  it("removes json code fences", () => {
    const raw = "```json\n{\"a\":1}\n```";
    expect(stripMarkdownFences(raw)).toBe('{"a":1}');
  });

  it("returns trimmed plain JSON unchanged", () => {
    const raw = '  {"a":1}  ';
    expect(stripMarkdownFences(raw)).toBe('{"a":1}');
  });
});

describe("parseModelJsonObject", () => {
  it("parses JSON after stripping fences", () => {
    const obj = parseModelJsonObject('```\n{"x":true}\n```');
    expect(obj).toEqual({ x: true });
  });
});

describe("llmCategorySuggestionSchema", () => {
  it("accepts valid category payload", () => {
    const parsed = llmCategorySuggestionSchema.safeParse({
      category: "Engineering",
      confidence: 0.82,
      reason: "Title mentions refactor and repository.",
    });
    expect(parsed.success).toBe(true);
  });

  it("normalizes confidence when model returns 0-100 scale", () => {
    const parsed = llmCategorySuggestionSchema.safeParse({
      category: "Ops",
      confidence: 80,
      reason: "Operational context.",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.confidence).toBe(0.8);
  });
});

describe("llmDecomposeSchema", () => {
  it("requires between 3 and 7 subtasks", () => {
    const ok = llmDecomposeSchema.safeParse({
      subtasks: [{ title: "a" }, { title: "b" }, { title: "c" }],
    });
    expect(ok.success).toBe(true);

    const tooFew = llmDecomposeSchema.safeParse({
      subtasks: [{ title: "a" }, { title: "b" }],
    });
    expect(tooFew.success).toBe(false);
  });
});
