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

## Method signature:

    findBestMatchIfExists(wanted: TEntity, tags: TEntity[]): TEntity | undefined

This method in the matcher takes the tag you want to match and the tags you have and outputs a suitable tag if one is found.

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

Let's first look at the construction method `Matcher.createFromKeys`:

    createFromKeys<LanguageTag>(
            ["language"],
            ["script", "region"],
            [ interceptChinese]
        );

Here we're saying, in order to match two tags, the `language` fields must match.

> **essential:** The `essentialFields` must be equal for a tag to match another.

It's preferred that `script` and `region` also match, where `script` comes first because matching it is more important.

> **optionalDescendingPriority:** It's preferred that these fields match, but it's not essential for tags to match. They are compared in the priority they are passed. Secondary to that priority, it is preferred that the non-matching field (and the fields following that field) are null in the tag that isn't the wanted tag.

All the other fields on our tag do not matter and will not be checked by the matcher.

We've also passed the `LanguageTag` object, because it's possible to use the matcher on objects we have extended from `LanguageTag`, or even ones we have created.

And one `interceptor` has been added.

> #### interceptors
> Before tags are compared, they are both "intercepted": they are passed through the functions provided in this parameter.
>
> Interceptors are used to add extra information to aid comparison. They should take a `LanguageTag` and return a new `LanguageTag` without mutating the original.
>
> Everything an interceptor does can be done by mutating all the tag inputs before passing them to the matcher, but an interceptor can keep the logic and mutations hidden within the matcher.
>
> This is how chinese language comparsion works by default. There is no special code in the matcher that knows `zh-CN` is a type of `zh-hans` and that `zh-HK` is a type of `zh-hant`. But an interceptor knows, and it adds the script to the tags before comparison.


Now let's look at the most maximally customized matcher it's possible to make:

    const complexMatcherWithWeirdUselessBehaviour = new Matcher<LanguageTag>(
            [{
                areEqual: (left, right) => left.language.toLowerCase() === right.language.toLowerCase()
            }],
            [
                {
                    // Do a case sensitive comparison
                    areEqual: (left, right) => left.script === right.script,
                    // Catch Null and empty, but treat "  " as a meaningful value
                    isEmpty: value => value.script == null || value.script === ""
                },
                // Do the sensible default comparisons on region
                createEqualityAndEmptyCheck("region")
            ],
            [
                // Re-implement the already provided interceptChinese() but the wrong way around
                tag => {
                    if (tag.language?.toLowerCase() != "zh" || !isNullOrWhitespace(tag.script) || isNullOrWhitespace(tag.region)) {
                        return tag;
                    }

                    const region = (<string>tag.region).toLowerCase();

                    if (["cn", "sg", "my"].includes(region)) {
                        return {...tag, script: "hant" };
                    } else if (["tw", "hk", "mo"].includes(region)) {
                        return {...tag, script: "hans" };
                    }

                    return tag;
                }
            ]
        );

In this matcher, the caller controllers what equality means, what it means for a field to be empty and how they'd like tags to be changed before they are compared.

There's a lot of space between `default()` and the absolute power of the raw constructor. The best thing to do is to look at the static creation methods in `Matcher.ts` to try and figure out a sensible middle ground for your use-case.
