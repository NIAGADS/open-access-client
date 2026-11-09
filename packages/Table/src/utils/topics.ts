import nlp from "compromise";

export const extractTopics = (text: string): string => {
    const normalizedText = nlp(text)
        .normalize({
            plurals: true,
            parentheses: true,
            possessives: true,
            punctuation: true,
            unicode: false,
            whitespace: true,
        })
        .text();

    const phrases = nlp(normalizedText).nouns().out("array");
    return [...new Set(phrases.map((phrase: string) => phrase.trim()).filter(Boolean))].join(" // ");
};
