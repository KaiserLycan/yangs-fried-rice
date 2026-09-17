# Previewing order states without placing an order

For whoever is reviewing the order screens — PM, tester, anyone opening the
Vercel preview link.

Two screens use this: **the tracking screen** (`/orders/<id>`) and **the order
history** (`/orders`). Both work the same way — add `?example=` to the URL —
but each has its own list of words, below.

## The problem this solves

Nothing writes an order to the database yet. Placing an order is a backend
write that has not been built, so no customer has an order to track, and the
tracking screen would have nothing to show. Two of its six states have no
Figma frame either, so there is no picture of them to compare against.

So the screen renders a stand-in order, and **you pick which state it is in by
typing a word into the address bar**.

## The tracking screen — `/orders/<id>`

### How to use it

Open the tracking screen and add `?example=` plus a state name:

```
/orders/1042?example=cancelled
```

The number in the URL (`1042`) is ignored — put anything there.

### The six states

| Add to the URL | What you should see |
|---|---|
| `?example=received` | "WAITING FOR THE KITCHEN". First stage marked **Now**, the rest pending. **Cancel order is offered** — pressing Yes on an example shows a database error, because the example's id is not a real order; cancel works on an order placed from `/checkout`. This is also what you get with no `?example=` at all. |
| `?example=preparing` | "IN THE WOK NOW". First stage **Done**, second **Now**. **Cancel order is gone**, replaced by a dashed note explaining the kitchen has confirmed it. |
| `?example=out_for_delivery` | Third stage **Now**, first two **Done**. No cancel control. |
| `?example=delivered` | All four stages **Done**. No cancel control. |
| `?example=cancelled` | "ORDER CANCELLED". Timeline shown but empty — no stage is current. No cancel control and **no note**: the headline has already said what happened. |
| `?example=unknown` | "CHECKING THIS ORDER". Nothing is known about it, so the arrival line reads "Arrival time to be confirmed", no rider is named, and the timeline is empty. No cancel control and no note. |

**Four of these headlines are placeholders and need the PM's words.** Only
"WAITING FOR THE KITCHEN" and "IN THE WOK NOW" are drawn in Figma, in the
restaurant's voice. The other four fall back to the neutral stage wording —
"OUT FOR DELIVERY", "DELIVERED", "ORDER CANCELLED", "CHECKING THIS ORDER" —
rather than to invented copy in a voice nobody approved. Replacing them is a
one-file change whenever the real lines exist.

`cancelled` and `unknown` are the two with no Figma frame. They are not
oversights — a cancellation is a real thing that happens, and `unknown` is
what the screen shows when the stored status is a word it does not recognise
or is empty, which the database currently allows. If either looks wrong to
you, that is worth raising: nobody has designed them.

## The order history — `/orders`

The same trick on the list of past orders. Nothing has ever been ordered, so
without it the screen would be permanently empty.

```
/orders?example=empty
```

| Add to the URL | What you should see |
|---|---|
| `?example=populated` | The three cards the Figma frame draws — a delivered order rated five stars, a delivered order not yet rated, and a picked-up order rated four. This is also what you get with no `?example=` at all. |
| `?example=cancelled` | The same three, with a **cancelled** order added at the top. It shows "Cancelled" instead of "Delivered", has no stars, and offers Reorder. |
| `?example=empty` | "No past orders yet." and a link back to the menu. |

**Rating an example card doesn't work.** The star row on the unrated card
is the real control now — pressing one sends the score to the database — but
the example orders have made-up ids, so the database rejects them and a raw
error like *"invalid input syntax for type uuid"* appears in a toast. This
only happens on example cards; a real order rates fine. A friendlier "this is
a sample order" message is a possible follow-up once the fixture is worth
keeping that long — the expected end of it is deletion.

**Two of these have no Figma frame**: `cancelled` and `empty`. They are not
oversights. Ticket 07 built cancelling an order, so a cancelled order in the
history is the ordinary consequence of using it; and an empty history is what
every new customer sees on their first visit. If either looks wrong to you,
that is worth raising — nobody has designed them.

### The one action per card is a decision, not a trace

The Figma frame draws three different actions across its three cards —
Reorder, Rate order, View receipt — and nothing in the data says which card
gets which. So the screen uses a rule instead: **an order you have not rated
offers "Rate order", and everything else offers "Reorder"**. "View receipt" is
reached by pressing the items line, which opens that order's detail screen —
that screen already is the receipt.

**PM: this is the bit most worth a second opinion.** If View receipt is meant
to be a visible third action, say what decides when it appears and it goes
back on the card.

### Rating does not rate anything

Pressing a star raises a message saying the feature is not built yet. That is
the expected behaviour today, not a bug — inserting the `review` row belongs
to the backend developer and is written up in `ordering-flow-handoff.md` §9.
Reordering behaves the same way (§8).

## Things worth knowing before filing a bug

- **Spelling is forgiving.** `?example=Out For Delivery`,
  `?example=out-for-delivery` and `?example=out_for_delivery` all work.
- **A word it does not recognise falls back to `received` silently**, rather
  than showing an error. That is deliberate — this is a review tool, not a
  feature, and an error page would be a worse thing to land on. It does mean a
  typo looks like the first state, so check the headline matches what you
  asked for.
- **The map panel is a placeholder** in every state. Wiring a real map is its
  own ticket (US-07).
- **The order number is always #1042** and the address always 21 Mabini St,
  because those come from the Figma frame. Only the status changes between
  examples.
- **Cancelling does not cancel anything.** "Yes, cancel order" raises a
  message saying the feature is not built yet. That is the expected
  behaviour today, not a bug — the write belongs to the backend developer and
  is written up in `ordering-flow-handoff.md` §7.

## This is temporary

The moment placing an order writes a real row, a real order takes priority and
`?example=` stops having any effect on it — the switch only applies when the
screen looked for genuine orders and found none. At that point the stand-in
files are deleted and these URLs stop working. Nothing else has to change.

For developers: the tracking states live in `lib/orders/mock-tracked-order.ts`
and the history in `lib/orders/mock-past-orders.ts`. Deleting those two files
is the off switch — each page stops compiling and TypeScript points at the
single line to remove.
