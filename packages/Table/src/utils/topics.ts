import { CATEGORICAL_FILTER_TYPES } from "../config";
import nlp from "compromise";

export const extractTopics = (text: string, filterType: string): string[] => {
    // ignore categorical filters
    if (CATEGORICAL_FILTER_TYPES.includes(filterType)) {
        return text ? text.split(" // ") : [];
    }

    if (!text) return [];
    const phrases = nlp(text).nouns().out("array");
    return [
        ...new Set(
            phrases
                .flatMap((phrase: string) => phrase.split(/[\[\]():;]/))
                .map((p: string) => p.trim())
                .filter(Boolean)
        ),
    ] as string[];
};
