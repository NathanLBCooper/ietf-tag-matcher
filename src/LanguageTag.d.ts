export interface LanguageTag extends AllStringFields<LanguageTag> {
    language: string;
    extlang?: string;
    script?: string;
    region?: string;
    variant?: string;
    extension?: string;
    privateUse?: string;
}
