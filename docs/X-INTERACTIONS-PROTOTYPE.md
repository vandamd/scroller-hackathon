# Frequently liked/bookmarked authors

```sh
# X_SESSION_FILE and optional X_AUTH_TOKEN_FILE point to private session files.
bun run prototype:x-affinity --history <private-four-month-history.json>
```

Here an interaction means a like or bookmark. Replies, mentions and outgoing
posts are not used. The input is the bounded liked/bookmarked history filtered
to posts published within four months, as selected by the user.

Group posts by stable X author ID and resolve the top 20 current usernames for
display. Usernames can change; they are not the identity key. New history pulls
also retain `author_username` so most display handles are available immediately.

Count liked posts, bookmarked posts and distinct source posts separately. A post
both liked and bookmarked counts once in the distinct-post total. The initial
ordering uses distinct posts, with bookmark count as a tie-breaker. These counts
need no language model and incur no OpenAI charges.

All usernames, IDs and supporting post references stay under the ignored private
`.local/x-affinity/<timestamp>/` directory. `REPORT.md` lists the top authors;
`authors.json` contains the counts and limits. This is a bounded retrieved
sample, not guaranteed complete four-month activity. Likes and bookmarks show
repeated interest, not friendship, endorsement or sentiment.

Use author familiarity as a small additional signal alongside content taste.
An author the user often saves should still need to publish a post that fits
the current selection rules. A single interaction should not create a strong
author preference.

Source: [emusks user lookup API](https://emusks.tiago.zip/users/users).
