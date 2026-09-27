# Publishing clixa-core

Written for the first time you do this. Everything in part one happens once,
ever. After that, releasing is three commands.

## Part one: the npm side, once

### 1. An account

Go to [npmjs.com/signup](https://www.npmjs.com/signup). Username, email,
password. Verify the email, or publishing will be refused later with a message
that does not explain itself.

### 2. Two-factor authentication

npm requires 2FA to publish. Settings, then Two-Factor Authentication, and pick
**Authorization and writes**. Use any authenticator app.

Turn this on before you try to publish. Enabling it halfway through is more
annoying than doing it first.

### 3. There is no step three

`clixa-core` is an **unscoped** package, so there is no organisation to create
and nothing to pay for. Unscoped packages are public by default.

This was deliberate. The scoped name `@clixa/core` needed an organisation
called `clixa`, and that name was already taken. Rather than settle for a
longer scope, the package dropped the scope entirely: `npm install clixa-core`
is shorter than `npm install @clixa/core` anyway, and your npm username never
appears anywhere a consumer sees.

If you later want a scope, publishing unscoped now does not block it. You would
publish `@something/core` as a new package and deprecate this one.

A note on usernames, since it comes up: **npm usernames cannot be changed.**
There is no rename. The only route is a new account and transferring ownership
of the package to it. Pick one you can live with at signup. It does not appear
in the install line, only on the package page as the publisher.

## Part two: this machine, once

```bash
npm login
```

It opens a browser, you sign in, you are done. Check it worked:

```bash
npm whoami
```

That should print your username. If it prints an error, you are not logged in.

## Part three: publishing

From `/home/binyam/products/clixa-core`:

```bash
pnpm build
pnpm test
npm publish
```

`npm publish` will ask for your 2FA code. That is the whole thing.

You do not strictly need the first two commands. `prepublishOnly` runs both for
you and refuses to publish if either fails, so `npm publish` on its own is the
complete sequence. Running them yourself first just means you see a failure
sooner, before npm asks for your 2FA code.

`npm pack --dry-run` below is **optional**. It previews the tarball and sends
nothing. Skipping it does not leave anything undone.

### What gets uploaded

Only `dist`. The `files` field in `package.json` says so, and `src`, `test` and
the golden snapshot stay out of the tarball. Check before you publish if you
want to be sure:

```bash
npm pack --dry-run
```

It lists every file that would go up, and the total size. Nothing is sent.

## Releasing again

```bash
npm version patch   # 0.1.0 -> 0.1.1
npm publish
```

`npm version` edits `package.json`, makes a commit and tags it. Push the tag so
the repository records which commit produced which version:

```bash
git push --follow-tags
```

Which of the three to use:

| Command | When | Example |
| --- | --- | --- |
| `npm version patch` | A fix that does not change how anything is called | correcting a formula, better error text |
| `npm version minor` | Something new, nothing broken | a new calculator, a new export |
| `npm version major` | Existing code will break | renaming an export, changing what a function returns |

Adding a calculator is almost always `minor`. Renaming a field on `CalcResult`
is `major`, because every consumer has to change.

## You will not be publishing every day

This is worth being clear about, because the friction sounds worse than it is.

Day-to-day work never touches npm. Point the consuming app at the local folder
and both products see your changes the moment you save:

```bash
# in hakim-web, once
pnpm add file:../../clixa-core
```

Add a calculator, save, and it is there. No version, no publish, no waiting.

You publish when you are about to deploy. For clinical arithmetic that
deliberate step is worth having: a version number is a record of exactly which
formulas a given build contained, which matters the day someone asks why a
number differed last month.

## When something goes wrong

**`403 Forbidden`**
Someone else owns that package name, or you are signed in as a different
account from the one that owns it. `npm whoami` tells you who npm thinks you
are.

**`402 Payment Required`**
Only happens with scoped packages on a private plan. `clixa-core` is unscoped
and public, so you should not see it.

**`You must verify your email before publishing`**
Check your inbox for the verification link from signup.

**`Cannot publish over previously published version`**
That version is already on npm and versions are permanent. Bump and publish
again.

**You published something broken**
Within 72 hours you can remove it:

```bash
npm unpublish clixa-core@0.1.1
```

After 72 hours you cannot. Deprecate instead, which leaves it installable but
warns anyone who does:

```bash
npm deprecate clixa-core@0.1.1 "Broken eGFR rounding, use 0.1.2"
```

Publishing a fixed version is almost always better than unpublishing a bad one.
Removing a version breaks every build that pinned it.

## Automating it later

Once the first few are done by hand, a GitHub Action can publish on a tag. It
needs a granular access token from
[npmjs.com/settings/~/tokens](https://www.npmjs.com/settings/~/tokens) with
write access to this package only, stored as a repository secret.

Leave that until publishing by hand feels tedious. It is a small amount of
setup and it is easier to debug once you have seen the manual path work.
