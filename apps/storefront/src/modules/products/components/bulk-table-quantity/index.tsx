import { MinusMini, PlusMini } from "@medusajs/icons"
import { IconButton, Input } from "@medusajs/ui"
import {
  decreaseSelectionQuantity,
  increaseSelectionQuantity,
  isValidSelectionQuantity,
  maximumSelectableQuantity,
  normalizeQuantity,
  normalizeSelectionQuantity,
} from "@/lib/selection/quote"
import { useEffect, useState } from "react"

type BulkTableQuantityProps = {
  variantId: string
  maxQuantity?: number
  value?: number
  onChange: (variantId: string, quantity: number) => void
}

const BulkTableQuantity = ({ variantId, maxQuantity, value, onChange }: BulkTableQuantityProps) => {
  const maximumQuantity = typeof maxQuantity === "undefined"
    ? undefined
    : maximumSelectableQuantity(maxQuantity)
  const initialQuantity = normalizeSelectionQuantity(value ?? 0, maxQuantity)
  const [quantity, setQuantity] = useState(initialQuantity.toString())
  const [lastValidQuantity, setLastValidQuantity] = useState(initialQuantity)
  const [quantityError, setQuantityError] = useState<string | null>(null)

  useEffect(() => {
    if (typeof value === "undefined") return

    const normalizedQuantity = normalizeSelectionQuantity(value, maxQuantity)
    setQuantity(normalizedQuantity.toString())
    setLastValidQuantity(normalizedQuantity)
    setQuantityError(null)
  }, [maxQuantity, value])

  const quantityHelp = maximumQuantity === undefined
    ? "Enter 0 or a multiple of 5."
    : `Enter 0, a multiple of 5, or all ${maximumQuantity} available pieces.`

  const commitQuantity = (nextValue: string) => {
    if (!isValidSelectionQuantity(nextValue, maxQuantity)) {
      setQuantity(lastValidQuantity.toString())
      setQuantityError(quantityHelp)
      return false
    }

    const normalizedQuantity = normalizeSelectionQuantity(nextValue, maxQuantity)
    setQuantity(normalizedQuantity.toString())
    setLastValidQuantity(normalizedQuantity)
    setQuantityError(null)
    onChange(variantId, normalizedQuantity)
    return true
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextValue = e.target.value
    setQuantity(nextValue)

    if (isValidSelectionQuantity(nextValue, maxQuantity)) {
      void commitQuantity(nextValue)
    } else {
      setQuantityError(quantityHelp)
    }
  }

  const handleAdd = () => {
    if (!isValidSelectionQuantity(quantity, maxQuantity)) {
      void commitQuantity(quantity)
      return
    }

    const q = increaseSelectionQuantity(normalizeQuantity(quantity), maxQuantity)
    void commitQuantity(q.toString())
  }

  const handleSubtract = () => {
    if (!isValidSelectionQuantity(quantity, maxQuantity)) {
      void commitQuantity(quantity)
      return
    }

    const q = decreaseSelectionQuantity(normalizeQuantity(quantity), maxQuantity)
    void commitQuantity(q.toString())
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowUp") {
      e.preventDefault()
      handleAdd()
    }

    if (e.key === "ArrowDown") {
      e.preventDefault()
      handleSubtract()
    }
  }

  return (
    <div className="w-full" data-testid={`quantity-control-${variantId}`}>
      <div className="flex items-center justify-between gap-2">
        <IconButton
          onClick={() => handleSubtract()}
          className="min-h-11 min-w-11 rounded-full hover:bg-neutral-200"
          variant="transparent"
          aria-label="Decrease quantity"
          disabled={lastValidQuantity === 0}
        >
          <MinusMini />
        </IconButton>
        <Input
          value={quantity}
          min="0"
          max={maximumQuantity}
          step="1"
          aria-invalid={Boolean(quantityError)}
          onBlur={() => void commitQuantity(quantity)}
          onChange={(e) => handleChange(e)}
          onKeyDown={handleKeyDown}
          type="number"
          className="h-11 min-w-14 flex-1 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        <IconButton
          onClick={() => handleAdd()}
          className="min-h-11 min-w-11 rounded-full hover:bg-neutral-200"
          variant="transparent"
          aria-label="Increase quantity"
          disabled={maximumQuantity !== undefined && lastValidQuantity >= maximumQuantity}
        >
          <PlusMini />
        </IconButton>
      </div>
      {quantityError && <p role="alert" className="mt-1 text-xs text-red-700">{quantityError}</p>}
    </div>
  )
}

export default BulkTableQuantity
