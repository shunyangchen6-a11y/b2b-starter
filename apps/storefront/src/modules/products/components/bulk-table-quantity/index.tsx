import { MinusMini, PlusMini } from "@medusajs/icons"
import { IconButton, Input } from "@medusajs/ui"
import { normalizeQuantity } from "@/lib/selection/quote"
import { useEffect, useState } from "react"

type BulkTableQuantityProps = {
  variantId: string
  maxQuantity?: number
  onChange: (variantId: string, quantity: number) => void
}

const BulkTableQuantity = ({ variantId, maxQuantity, onChange }: BulkTableQuantityProps) => {
  const [quantity, setQuantity] = useState("0")
  const [shiftPressed, setShiftPressed] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const normalizedQuantity = Math.min(
      normalizeQuantity(e.target.value),
      maxQuantity ?? Number.MAX_SAFE_INTEGER
    )
    setQuantity(normalizedQuantity.toString())
    onChange(variantId, normalizedQuantity)
  }

  const handleAdd = () => {
    const q = Math.min(
      normalizeQuantity(quantity) + (shiftPressed ? 10 : 1),
      maxQuantity ?? Number.MAX_SAFE_INTEGER
    )
    setQuantity(q.toString())
    onChange(variantId, q)
  }

  const handleSubtract = () => {
    const q = Math.max(
      normalizeQuantity(quantity) - (shiftPressed ? 10 : 1),
      0
    )
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Shift") {
        setShiftPressed(true)
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Shift") {
        setShiftPressed(false)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
    }
  }, [])

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
        max={maxQuantity}
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
