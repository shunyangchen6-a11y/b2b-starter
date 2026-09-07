import { MinusMini, PlusMini } from "@medusajs/icons"
import { IconButton, Input } from "@medusajs/ui"
import {
  maximumSelectableQuantity,
  normalizeQuantity,
  normalizeSelectionQuantity,
} from "@/lib/selection/quote"
import { useState } from "react"

type BulkTableQuantityProps = {
  variantId: string
  maxQuantity?: number
  onChange: (variantId: string, quantity: number) => void
}

const BulkTableQuantity = ({ variantId, maxQuantity, onChange }: BulkTableQuantityProps) => {
  const [quantity, setQuantity] = useState("0")
  const maximumQuantity = typeof maxQuantity === "undefined"
    ? undefined
    : maximumSelectableQuantity(maxQuantity)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const normalizedQuantity = normalizeSelectionQuantity(e.target.value, maxQuantity)
    setQuantity(normalizedQuantity.toString())
    onChange(variantId, normalizedQuantity)
  }

  const handleAdd = () => {
    const q = normalizeSelectionQuantity(normalizeQuantity(quantity) + 5, maxQuantity)
    setQuantity(q.toString())
    onChange(variantId, q)
  }

  const handleSubtract = () => {
    const q = Math.max(normalizeSelectionQuantity(quantity, maxQuantity) - 5, 0)
    setQuantity(q.toString())
    onChange(variantId, q)
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
    <div className="flex w-full items-center justify-between gap-2" data-testid={`quantity-control-${variantId}`}>
      <IconButton
        onClick={() => handleSubtract()}
        className="min-h-11 min-w-11 rounded-full hover:bg-neutral-200"
        variant="transparent"
        aria-label="Decrease quantity"
      >
        <MinusMini />
      </IconButton>
      <Input
        value={quantity}
        min="0"
        max={maximumQuantity}
        step="5"
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
      >
        <PlusMini />
      </IconButton>
    </div>
  )
}

export default BulkTableQuantity
