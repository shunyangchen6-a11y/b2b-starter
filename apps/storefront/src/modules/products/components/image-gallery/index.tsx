"use client"

import { ArrowLeftMini, ArrowRightMini } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import { clx, IconButton } from "@medusajs/ui"
import Image from "next/image"
import { useCallback, useEffect, useMemo, useState } from "react"

import {
  getProductImageUrl,
  WHOLESALE_PLACEHOLDER_IMAGE,
} from "@/lib/util/product-image"

type ImageGalleryProps = {
  product: HttpTypes.StoreProduct
}

const ImageGallery = ({ product }: ImageGalleryProps) => {
  const thumbnail = product?.thumbnail
  const images = useMemo(() => product?.images || [], [product])

  const [selectedImage, setSelectedImage] = useState(
    images[0] || {
      url: thumbnail,
      id: "thumbnail",
    }
  )
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [selectedImageSource, setSelectedImageSource] = useState(() =>
    getProductImageUrl(selectedImage.url)
  )

  useEffect(() => {
    setSelectedImageSource(getProductImageUrl(selectedImage.url))
  }, [selectedImage])

  const handleArrowClick = useCallback(
    (direction: "left" | "right") => {
      if (
        images.length === 0 ||
        (selectedImageIndex === 0 && direction === "left") ||
        (selectedImageIndex === images.length - 1 && direction === "right")
      ) {
        return
      }

      if (direction === "left") {
        setSelectedImageIndex((prev) => prev - 1)
        setSelectedImage(images[selectedImageIndex - 1])
      } else {
        setSelectedImageIndex((prev) => prev + 1)
        setSelectedImage(images[selectedImageIndex + 1])
      }
    },
    [images, selectedImageIndex]
  )

  const handleImageClick = useCallback(
    (image: HttpTypes.StoreProductImage) => {
      setSelectedImage(image)
      setSelectedImageIndex(images.findIndex((img) => img.id === image.id))
    },
    [images]
  )

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement instanceof HTMLInputElement) {
        return
      }

      if (e.key === "ArrowLeft") {
        handleArrowClick("left")
      } else if (e.key === "ArrowRight") {
        handleArrowClick("right")
      }
    }

    window.addEventListener("keydown", handleKeyDown)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [handleArrowClick])

  return (
    <div className="flex h-full w-full min-w-0 max-w-full flex-col items-center justify-end gap-6">
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-rounded" id={selectedImage.id}>
        <div aria-hidden className="absolute inset-0 bg-neutral-100" />
        <Image
          src={selectedImageSource}
          priority
          className="absolute inset-0 h-full w-full object-contain object-center"
          alt={(selectedImage.metadata?.alt as string) || "Wholesale product image"}
          fill
          quality={85}
          sizes="(max-width: 576px) 100vw, (max-width: 768px) 50vw, 800px"
          onError={() => setSelectedImageSource(WHOLESALE_PLACEHOLDER_IMAGE)}
        />
      </div>
      <div className="flex w-full min-w-0 max-w-full flex-col-reverse justify-between gap-y-3 small:flex-row">
        {images.length > 1 && (
          <div className="flex flex-row gap-x-2 self-end small:self-auto">
            <IconButton
              disabled={selectedImageIndex === 0}
              className="rounded-full items-center justify-center"
              onClick={() => handleArrowClick("left")}
            >
              <ArrowLeftMini />
            </IconButton>
            <IconButton
              disabled={selectedImageIndex === images.length - 1}
              className="rounded-full items-center justify-center"
              onClick={() => handleArrowClick("right")}
            >
              <ArrowRightMini />
            </IconButton>
          </div>
        )}
        <ul className="flex min-w-0 max-w-full flex-row gap-x-4 overflow-x-auto">
          {images.map((image, index) => (
            <li
              key={image.id}
              className="relative flex w-12 aspect-[4/5] shrink-0 overflow-hidden rounded-rounded"
              onClick={() => handleImageClick(image)}
              role="button"
            >
              <div aria-hidden className="absolute inset-0 bg-neutral-100" />
              <Image
                src={getProductImageUrl(image.url)}
                alt={(image.metadata?.alt as string) || "Wholesale product image"}
                fill
                quality={65}
                sizes="48px"
                className={clx(
                  index === selectedImageIndex ? "opacity-100" : "opacity-40",
                  "absolute inset-0 h-full w-full object-contain object-center hover:opacity-100"
                )}
                onError={(event) => {
                  event.currentTarget.src = WHOLESALE_PLACEHOLDER_IMAGE
                }}
              />
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default ImageGallery
