# Previewing order states without placing an order

For whoever is reviewing the order tracking screen — PM, tester, anyone
opening the Vercel preview link.

## The problem this solves

Nothing writes an order to the database yet. Placing an order is a backend
write that has not been built, so no customer has an order to track, and the
tracking screen would have nothing to show. Two of its six states have no
Figma frame either, so there is no picture of them to compare against.

So the screen renders a stand-in order, and **you pick which state it is in by
typing a word into the address bar**.

## How to use it

Open the tracking screen and add `?example=` plus a state name:

```
/orders/1042?example=cancelled
```

The number in the URL (`1042`) is ignored — put anything there.

## The six states

| Add to the URL | What you should see |
|---|---|
| `?example=received` | "WAITING FOR THE KITCHEN". First stage marked **Now**, the rest pending. **Cancel order is offered.** This is also what you get with no `?example=` at all. |
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
screen looked for a genuine order and found none. At that point the stand-in
file is deleted and these URLs stop working. Nothing else has to change.

For developers: everything above lives in `lib/orders/mock-tracked-order.ts`.
Deleting that one file is the off switch — the page stops compiling and
TypeScript points at the single line to remove.
