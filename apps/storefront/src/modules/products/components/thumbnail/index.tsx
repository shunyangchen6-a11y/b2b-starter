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
  framed?: boolean
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
  framed = false,
}) => {
  const initialImage = getProductImageUrl(thumbnail || images?.[0]?.url)

  return (
    <div
      className={clx("relative w-full", className, {
        "h-full": framed,
        "overflow-hidden": !framed,
        "aspect-[11/14]": !framed && isFeatured,
        "aspect-[9/16]": !framed && !isFeatured && size !== "square",
        "aspect-[1/1]": !framed && size === "square",
        "w-[180px]": size === "small",
        "w-[290px]": size === "medium",
        "w-[440px]": size === "large",
        "w-full": size === "full",
      })}
      data-testid={dataTestid}
    >
      <ImageOrPlaceholder image={initialImage} size={size} type={type} framed={framed} />
    </div>
  )
}

const ImageOrPlaceholder = ({
  image,
  size,
  type,
  framed = false,
}: Pick<ThumbnailProps, "size" | "type" | "framed"> & {
  image?: string
}) => {
  const [imageSource, setImageSource] = useState(getProductImageUrl(image))

  useEffect(() => {
    setImageSource(getProductImageUrl(image))
  }, [image])

  if (framed) {
    return (
      <>
        <Image
          src={imageSource}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full scale-110 object-cover blur-md opacity-40"
          draggable={false}
          quality={35}
          sizes="(max-width: 576px) 50vw, (max-width: 992px) 33vw, 25vw"
          fill
        />
        <Image
          src={imageSource}
          alt="Thumbnail"
          className="absolute inset-0 h-full w-full object-contain object-center"
          draggable={false}
          quality={75}
          sizes="(max-width: 576px) 50vw, (max-width: 992px) 33vw, 25vw"
          fill
          onError={() => setImageSource(WHOLESALE_PLACEHOLDER_IMAGE)}
        />
      </>
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
