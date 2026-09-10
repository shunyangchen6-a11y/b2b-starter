"use client"

import { HttpTypes } from "@medusajs/types"
import { clx } from "@medusajs/ui"
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
  const [zoomOpen, setZoomOpen] = useState(false)

  useEffect(() => {
    setSelectedImageSource(getProductImageUrl(selectedImage.url))
  }, [selectedImage])

  useEffect(() => {
    if (!zoomOpen) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [zoomOpen])

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
      if (e.key === "Escape" && zoomOpen) {
        setZoomOpen(false)
        return
      }

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
  }, [handleArrowClick, zoomOpen])

  return (
    <>
      <div className="grid w-full min-w-0 max-w-full grid-cols-1 gap-4 large:grid-cols-[72px_minmax(0,1fr)] large:items-start">
        <div className="order-2 min-w-0 large:order-1 large:sticky large:top-[116px] large:max-h-[calc(100vh-132px)] large:overflow-y-auto">
          <ul className="flex min-w-0 max-w-full gap-2 overflow-x-auto pb-1 large:flex-col large:overflow-x-hidden large:pb-0" aria-label="Product images">
            {images.map((image, index) => (
              <li key={image.id} className="shrink-0">
                <button
                  type="button"
                  className={clx(
                    "relative block aspect-[4/5] w-14 overflow-hidden bg-neutral-100 large:w-[72px]",
                    index === selectedImageIndex
                      ? "border border-zinc-950"
                      : "border border-transparent"
                  )}
                  onClick={() => handleImageClick(image)}
                  aria-label={`View product image ${index + 1}`}
                  aria-current={index === selectedImageIndex ? "true" : undefined}
                >
                  <Image
                    src={getProductImageUrl(image.url)}
                    alt={(image.metadata?.alt as string) || `Wholesale product image ${index + 1}`}
                    fill
                    quality={65}
                    sizes="72px"
                    className="h-full w-full object-contain object-center"
                    onError={(event) => {
                      event.currentTarget.src = WHOLESALE_PLACEHOLDER_IMAGE
                    }}
                  />
                </button>
              </li>
            ))}
          </ul>
        </div>

        <button
          type="button"
          className="group relative order-1 aspect-[4/5] w-full min-w-0 cursor-zoom-in overflow-hidden bg-neutral-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-950 large:order-2"
          id={selectedImage.id}
          onClick={() => setZoomOpen(true)}
          aria-label="Enlarge product image"
        >
          <Image
            src={selectedImageSource}
            priority
            className="h-full w-full object-contain object-center"
            alt={(selectedImage.metadata?.alt as string) || "Wholesale product image"}
            fill
            quality={85}
            sizes="(max-width: 1023px) 100vw, 58vw"
            onError={() => setSelectedImageSource(WHOLESALE_PLACEHOLDER_IMAGE)}
          />
          <span className="absolute bottom-4 right-4 bg-white/90 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
            View larger
          </span>
        </button>
      </div>

      {zoomOpen && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/85 p-4 md:p-8"
          role="dialog"
          aria-modal="true"
          aria-label="Enlarged product image"
          onClick={(event) => {
            if (event.target === event.currentTarget) setZoomOpen(false)
          }}
        >
          <button
            type="button"
            aria-label="Close enlarged image"
            onClick={() => setZoomOpen(false)}
            className="absolute right-4 top-4 flex min-h-11 min-w-11 items-center justify-center bg-white text-2xl text-zinc-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            ×
          </button>
          <div className="relative h-full w-full max-w-6xl">
            <Image
              src={selectedImageSource}
              alt={(selectedImage.metadata?.alt as string) || "Enlarged wholesale product image"}
              fill
              quality={95}
              sizes="100vw"
              className="object-contain object-center"
            />
          </div>
        </div>
      )}
    </>
  )
}

export default ImageGallery
