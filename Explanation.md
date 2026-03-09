# Explanation

## What was the bug?

In `src/httpClient.ts`, the `request()` method's token-refresh condition failed to handle the case where `oauth2Token` is a plain object (i.e., `Record<string, unknown>`) rather than an `OAuth2Token` class instance. When the token was a plain object, the condition `!this.oauth2Token` evaluated to `false` (the object is truthy), and the `instanceof OAuth2Token` check also evaluated to `false`, so the expired check was skipped entirely. As a result, `refreshOAuth2()` was never called, and since the subsequent `instanceof` guard on line 28 also failed, no `Authorization` header was set.

## Why did it happen?

The original condition used `&&` to combine the `instanceof` check with the `.expired` check:

```typescript
!this.oauth2Token ||
(this.oauth2Token instanceof OAuth2Token && this.oauth2Token.expired)
```

This logic only refreshed in two cases: (1) token is `null`, or (2) token is an `OAuth2Token` instance **and** it is expired. A plain object — which is truthy but not an `OAuth2Token` instance — fell through both branches without triggering a refresh.

## Why does your fix solve it?

The fix restructures the condition to three independent checks using `||`:

```typescript
!this.oauth2Token ||
!(this.oauth2Token instanceof OAuth2Token) ||
this.oauth2Token.expired
```

Now the token is refreshed when it is: (1) `null`/falsy, (2) not an `OAuth2Token` instance (covers the plain-object case), or (3) an expired `OAuth2Token`. This correctly handles all three `TokenState` variants.

## One realistic case / edge case the tests still don't cover

The tests do not cover concurrent or rapid sequential calls to `request()` where the token might expire between the refresh check and the `asHeader()` call (a TOCTOU race condition). In a real async application, one request could read the token as valid, but by the time it formats the header, the token has already expired. This is unlikely in the current synchronous code but would be relevant in an async version.
