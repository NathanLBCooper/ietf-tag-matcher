export interface LanguageTag extends Record<string,string | undefined> {
    language: string;
    extlang?: string;
    script?: string;
    region?: string;
    variant?: string;
    extension?: string;
    privateUse?: string;
}
