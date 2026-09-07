"use client"

import { clx } from "@medusajs/ui"
import Image from "next/image"
import React, { useEffect, useState } from "react"

import {
  getProductImageUrl,
  WHOLESALE_PLACEHOLDER_IMAGE,
} from "@/lib/util/product-image"

type ThumbnailProps = {
  thumbnail?: string | null
  // TODO: Fix image typings
  images?: any[] | null
  size?: "small" | "medium" | "large" | "full" | "square"
  isFeatured?: boolean
  className?: string
  type?: "preview" | "full"
  natural?: boolean
  "data-testid"?: string
}

const Thumbnail: React.FC<ThumbnailProps> = ({
  thumbnail,
  images,
  size = "small",
  isFeatured,
  className,
  "data-testid": dataTestid,
  type,
  natural = false,
}) => {
  const initialImage = getProductImageUrl(thumbnail || images?.[0]?.url)

  return (
    <div
      className={clx("relative w-full", className, {
        "overflow-hidden": !natural,
        "aspect-[11/14]": !natural && isFeatured,
        "aspect-[9/16]": !natural && !isFeatured && size !== "square",
        "aspect-[1/1]": !natural && size === "square",
        "w-[180px]": size === "small",
        "w-[290px]": size === "medium",
        "w-[440px]": size === "large",
        "w-full": size === "full",
      })}
      data-testid={dataTestid}
    >
      <ImageOrPlaceholder image={initialImage} size={size} type={type} natural={natural} />
    </div>
  )
}

const ImageOrPlaceholder = ({
  image,
  size,
  type,
  natural = false,
}: Pick<ThumbnailProps, "size" | "type" | "natural"> & {
  image?: string
}) => {
  const [imageSource, setImageSource] = useState(getProductImageUrl(image))

  useEffect(() => {
    setImageSource(getProductImageUrl(image))
  }, [image])

  if (natural) {
    return (
      <img
        src={imageSource}
        alt="Thumbnail"
        className="block h-auto w-full object-contain"
        draggable={false}
        onError={() => setImageSource(WHOLESALE_PLACEHOLDER_IMAGE)}
      />
    )
  }

  return (
    <Image
      src={imageSource}
      alt="Thumbnail"
      className={clx("absolute inset-0 h-full w-full object-contain", {
        "p-4": type === "full",
        "p-2": type === "preview",
      })}
      draggable={false}
      quality={50}
      sizes="(max-width: 576px) 280px, (max-width: 768px) 360px, (max-width: 992px) 480px, 800px"
      fill
      onError={() => setImageSource(WHOLESALE_PLACEHOLDER_IMAGE)}
    />
  )
}

export default Thumbnail
