import '@testing-library/jest-dom'

/**
 * jsdom ships `<dialog>` the element but not its modal methods, so any test
 * that renders `components/ui/dialog.tsx` dies on `showModal is not a
 * function` before it can assert anything.
 *
 * This stands in for them at the only level the tests care about: whether the
 * element is open. The things the real implementation gives us — focus
 * movement, inertness, top-layer stacking — are browser behaviour, and a fake
 * that pretended to provide them would be claiming more than it can check.
 */
type DialogElement = HTMLDialogElement & { returnValue: string }

if (
  typeof HTMLDialogElement !== 'undefined' &&
  !HTMLDialogElement.prototype.showModal
) {
  const open = function open(this: DialogElement) {
    this.open = true
  }

  HTMLDialogElement.prototype.show = open
  HTMLDialogElement.prototype.showModal = open
  HTMLDialogElement.prototype.close = function close(
    this: DialogElement,
    returnValue?: string,
  ) {
    this.open = false
    if (returnValue !== undefined) this.returnValue = returnValue
    this.dispatchEvent(new Event('close'))
  }
}
