export type GroupableVariant = {
  id: string
  options?: Array<{
    option_id?: string | null
    value?: string | null
  }> | null
}

export const groupVariantsByColor = <T extends GroupableVariant>(
  variants: T[],
  colorOptionId?: string
) => {
  const groups = new Map<string, T[]>()

  variants.forEach((variant) => {
    const color = variant.options?.find(
      (option) => option.option_id === colorOptionId
    )?.value || "Other"
    groups.set(color, [...(groups.get(color) || []), variant])
  })

  return Array.from(groups, ([color, groupedVariants]) => ({
    color,
    variants: groupedVariants,
  }))
}
