# ietf-tag-matcher

Match a single IETF Language tag with the best language from a collection of tags.

This may be useful when you have a limited number of translation files for a limited number of tags, but care deeply about providing the most localized experience and want to provide the best possible file to fit any requested language tag.

eg:

1) You have files for `[ en-GB, en-CA, sv-SE, sv ]`. You want to give the possible language to someone who speaks `sv-FI`. The answer is `sv`.

2) You have `[ zh-HK (hong kong chinese), zh-CN (mainland chinese) ]`. What's the best fit for `zh-TW (taiwanese chinese)`? The answer is `zh-HK`. Because both hong kong use traditional chinese, whereas the mainland uses simplified. 


But of course IETF Language tags can get more complex than that. Here is a description of the data they might hold:

> language-extlang-script-region-variant-extension-privateuse

More detail about IETF Language tags can be found in [this article on w3.org](https://www.w3.org/International/articles/language-tags/).

So, for example, `en` has just the `language` part. `en-GB` is `language-region`. `zh-hant` is `language-script`.

The IETF Language tag are represented here by the `LanguageTag` interface. These are the inputs for the *matcher*. Parsing a string like `en-GB` into an object is not a concern of this library.

## Let's look at some example usages:

The *matcher* is the core of this library. We're going to use the simple default configuration of the *matcher* for now, which is created by calling `Matcher.Default()`. And then use it to find the best match for our desired language. Here is our first example from earlier:

    const matcher = Matcher.Default();
    const myTranslationFiles = [{ language: "en", region: "gb" }, { language: "en", region: "ca" }, { language: "sv", region: "se" }, { language: "sv" }];

    const languageToUse = matcher.findBestMatchIfExists({ language: "sv", region: "fi" }, myTranslationFiles);

    expect(languageToUser).equals({ language: "sv" });

In this example, we have swedish and english files. These aren't any good someone wanting danish, so we fall back to english.

    const matcher = Matcher.Default();
    const english = { language: "en" };
    const languageToUse = matcher.findBestMatchIfExists({ language: "da" }, [{ language: "sv", region: "se" }, english]) || english;

    expect(languageToUser).equals(english);


## Having more control over the matcher

A matcher can be created with a configuration of your choice by calling the constructor instead of just creating it via `Default()`.

Let's look at the class name and constructor signature: 

    Matcher<TEntity>

    constructor(
        essentialFields: (keyof TEntity)[],
        optionalFieldsOrderedByDescendingPriority: (keyof TEntity)[],
        interceptors: ((tag: TEntity) => TEntity)[]
    )

> #### TEntity
> The matcher doesn't particular care about `LanguageTag`. The advantage of this is that if you want to extend `LanguageTag` to add more fields not found in the IETF Language definition, you can. But otherwise `LanguageTag` is a very sensible choice of TEntity. For the sake is documentation, we'll assume `TEntity` is `LanguageTag`.

> #### essentialFields:
> The `essentialFields` must be equal for a tag to match another.
>
>For example, in the default setup `language` is essential, so danish will never match with swedish. On the other hand `Script` isn't essential by default. But if it's added to essential fields traditional and simplified chinese will stop matching each other.

> #### optionalFieldsOrderedByDescendingPriority:
> It's preferred that these fields match, but it's not essential for tags to match.
>
> For example, it's preferred to match `sv-SE` with `sv-SE`, but `sv-FI` or `sv` will do. So `region` should appear in this array.


Any field that doesn't appear in `essentialFields` or `optionalFieldsOrderedByDescendingPriority` doesn't matter and will not be factored into any of the comparisons made by the matcher.

> #### interceptors
> Before tags are compared, they are both "intercepted": they are passed through the functions provided in this parameter.
>
> Interceptors are used to add extra information to aid comparison. They should take a `LanguageTag` and return a new `LanguageTag` without mutating the original.
>
> Everything an interceptor does can be done by mutating all the tag inputs before passing them to the matcher, but an interceptor can keep the logic and mutations hidden within the matcher.
>
> This is actually how chinese language comparsion works by default. There is no special code in the matcher that knows `zh-CN` is a type of `zh-hans` and that `zh-HK` is a type of `zh-hant`. But an interceptor knows, and it adds the script to the tags before comparison.
