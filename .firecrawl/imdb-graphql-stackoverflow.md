##### Collectives™ on Stack Overflow

Find centralized, trusted content and collaborate around the technologies you use most.

[Learn more about Collectives](https://stackoverflow.com/collectives)

**Stack Internal**

Knowledge at work

Bring the best of human thought and AI automation together at your work.

[Explore Stack Internal](https://stackoverflow.co/internal/?utm_medium=referral&utm_source=stackoverflow-community&utm_campaign=side-bar&utm_content=explore-teams-compact-popover)

# [IMDb API GraphQL - query multiple names](https://stackoverflow.com/questions/78955570/imdb-api-graphql-query-multiple-names)

[Ask Question](https://stackoverflow.com/questions/ask)

Asked1 year, 6 months ago

Modified [1 year, 6 months ago](https://stackoverflow.com/questions/78955570/imdb-api-graphql-query-multiple-names?lastactivity "2024-09-06 06:17:19Z")

Viewed
233 times


This question shows research effort; it is useful and clear

0

Save this question.

[Timeline](https://stackoverflow.com/posts/78955570/timeline)

Show activity on this post.

I am using the IMDb API, and attempting to extract info using a GraphQL query. I wish to extract info for multiple actors using this query:

```
{
  names(ids: ["nm0000158", "nm0000226", "nm0000138"]) {
    id
    Name
    birthDate
  }
}
```

When I run this query in the IMDb GraphQL playground I get this message:

```
"errors": [\
    {\
      "message": "Cannot query field \"Name\" on type \"Name\".",\
      "locations": [\
        {\
          "line": 4,\
          "column": 5\
        }\
      ],\
      "extensions": {\
        "code": "GRAPHQL_VALIDATION_FAILED"\
      }\
    },\
    {\
      "message": "Cannot query field \"birthDate\" on type \"Name\".",\
      "locations": [\
        {\
          "line": 5,\
          "column": 5\
        }\
      ],\
      "extensions": {\
        "code": "GRAPHQL_VALIDATION_FAILED"\
      }\
    }\
  ],
  "data": null
}
```

Please share any suggestions or ideas. Thanks.

- [graphql](https://stackoverflow.com/questions/tagged/graphql "show questions tagged 'graphql'")
- [imdb](https://stackoverflow.com/questions/tagged/imdb "show questions tagged 'imdb'")

[Share](https://stackoverflow.com/q/78955570 "Short permalink to this question")

Share a link to this question

Copy link [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/ "The current license for this post: CC BY-SA 4.0")

[Improve this question](https://stackoverflow.com/posts/78955570/edit "")

Follow



Follow this question to receive notifications

asked Sep 6, 2024 at 4:10

[![gcarterIT's user avatar](https://www.gravatar.com/avatar/ef94c937ce6e3f4b21ffd4185b9d30b9?s=64&d=identicon&r=PG)](https://stackoverflow.com/users/2037506/gcarterit)

[gcarterIT](https://stackoverflow.com/users/2037506/gcarterit)

13511 gold badge44 silver badges1313 bronze badges

[Add a comment](https://stackoverflow.com/questions/78955570/imdb-api-graphql-query-multiple-names# "Use comments to ask for more information or suggest improvements. Avoid answering questions in comments.") \| [Expand to show all comments on this post](https://stackoverflow.com/questions/78955570/imdb-api-graphql-query-multiple-names# "Expand to show all comments on this post")

## 1 Answer 1

Sorted by:
[Reset to default](https://stackoverflow.com/questions/78955570/imdb-api-graphql-query-multiple-names?answertab=scoredesc#tab-top)

Highest score (default)

Trending (recent votes count more)

Date modified (newest first)

Date created (oldest first)


This answer is useful

0

Save this answer.

[Timeline](https://stackoverflow.com/posts/78955583/timeline)

Show activity on this post.

Fields you can query must match the fields service has defined, check out valid fields [here](https://imdbapi.dev/docs/graphql/schema/name)

[Share](https://stackoverflow.com/a/78955583 "Short permalink to this answer")

Share a link to this answer

Copy link [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/ "The current license for this post: CC BY-SA 4.0")

[Improve this answer](https://stackoverflow.com/posts/78955583/edit "")

Follow



Follow this answer to receive notifications

[edited Sep 6, 2024 at 6:17](https://stackoverflow.com/posts/78955583/revisions "show all edits to this post")

answered Sep 6, 2024 at 4:20

[![keria's user avatar](https://www.gravatar.com/avatar/c3e37dec4a653b259e071825c00eca8d?s=64&d=identicon&r=PG&f=y&so-version=2)](https://stackoverflow.com/users/8410090/keria)

[keria](https://stackoverflow.com/users/8410090/keria)

18155 bronze badges

Sign up to request clarification or add additional context in comments.


## Comments

Add a comment

## Your Answer

Draft saved

Draft discarded

### Sign up or [log in](https://stackoverflow.com/users/login?ssrc=question_page&returnurl=https%3a%2f%2fstackoverflow.com%2fquestions%2f78955570%2fimdb-api-graphql-query-multiple-names%23new-answer)

Sign up using Google


Sign up using Email and Password


Submit

### Post as a guest

Name

Email

Required, but never shown

Post Your Answer

Discard


By clicking “Post Your Answer”, you agree to our [terms of service](https://stackoverflow.com/legal/terms-of-service/public) and acknowledge you have read our [privacy policy](https://stackoverflow.com/legal/privacy-policy).


Start asking to get answers

Find the answer to your question by asking.

[Ask question](https://stackoverflow.com/questions/ask)

Explore related questions

- [graphql](https://stackoverflow.com/questions/tagged/graphql "show questions tagged 'graphql'")
- [imdb](https://stackoverflow.com/questions/tagged/imdb "show questions tagged 'imdb'")

See similar questions with these tags.