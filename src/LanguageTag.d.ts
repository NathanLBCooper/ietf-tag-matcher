export interface LanguageTag {
    language: string;
    extlang?: string;
    script?: string;
    region?: string;
    variant?: string;
    extension?: string;
    privateUse?: string;
}

export type LanguageTagField = "language" | "extlang" | "script" | "region" | "variant" | "extension" | "privateUse";
