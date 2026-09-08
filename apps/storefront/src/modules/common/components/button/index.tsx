import { clx, Button as MedusaButton } from "@medusajs/ui"
type ButtonProps = React.ComponentProps<typeof MedusaButton>

const Button = ({
  children,
  className: classNameProp,
  ...props
}: ButtonProps): React.ReactNode => {
  const variant = props.variant ?? "primary"

  const className = clx(classNameProp, {
    "!shadow-none !border !border-zinc-300 !bg-white !text-zinc-950":
      variant === "secondary" || props.disabled,
    "!shadow-none !border !border-zinc-950 !bg-zinc-950 !text-white":
      variant === "primary" && !props.disabled,
    "!shadow-none !border-transparent !bg-transparent !text-zinc-950": variant === "transparent",
  })

  return (
    <MedusaButton
      className={`!min-h-11 !rounded-none !px-5 !text-xs !font-semibold !uppercase !tracking-[0.12em] ${className}`}
      variant={variant}
      {...props}
    >
      {children}
    </MedusaButton>
  )
}

export default Button
