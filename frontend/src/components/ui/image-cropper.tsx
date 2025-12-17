"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from "react-image-crop";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Upload, Crop as CropIcon } from "lucide-react";
import 'react-image-crop/dist/ReactCrop.css';

interface ImageCropperProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImageCropped: (croppedImageFile: File) => void;
  title?: string;
  preSelectedFile?: File | null;
}

export function ImageCropper({
  open,
  onOpenChange,
  onImageCropped,
  title = "Crop Image",
  preSelectedFile = null
}: ImageCropperProps) {
  const [imgSrc, setImgSrc] = useState('');
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // This makes the crop a perfect square (1:1 aspect ratio)
  function centerAspectCrop(mediaWidth: number, mediaHeight: number, aspect: number) {
    return centerCrop(
      makeAspectCrop(
        {
          unit: '%',
          width: 30,
        },
        aspect,
        mediaWidth,
        mediaHeight,
      ),
      mediaWidth,
      mediaHeight,
    )
  }

  const handleFileSelect = useCallback((file: File) => {
    if (file && file.type.startsWith('image/')) {
      setOriginalFile(file);
      setCrop(undefined); // Makes crop preview update between images
      const reader = new FileReader();
      reader.onload = () => {
        setImgSrc(reader.result?.toString() || '');
      };
      reader.readAsDataURL(file);
    }
  }, []);

  // Handle pre-selected file when dialog opens
  useEffect(() => {
    if (open && preSelectedFile) {
      handleFileSelect(preSelectedFile);
    }
  }, [open, preSelectedFile, handleFileSelect]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget;
    setCrop(centerAspectCrop(width, height, 1)); // 1 = square aspect ratio
  }

  async function onCropComplete() {
    if (
      completedCrop?.width &&
      completedCrop?.height &&
      imgRef.current &&
      originalFile
    ) {
      const croppedImageFile = await getCroppedImg(
        imgRef.current,
        completedCrop,
        originalFile.name,
        originalFile.type
      );

      if (croppedImageFile) {
        onImageCropped(croppedImageFile);
        onOpenChange(false);
        resetState();
      }
    }
  }

  const resetState = () => {
    setImgSrc('');
    setCrop(undefined);
    setCompletedCrop(undefined);
    setOriginalFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCancel = () => {
    resetState();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!imgSrc ? (
            <div className="space-y-4">
              <div
                className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-muted-foreground/50 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">
                  Click to upload an image or drag and drop
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Drag the corners to crop your image to a perfect square.
              </div>

              <div className="flex justify-center">
                <ReactCrop
                  crop={crop}
                  onChange={(_, percentCrop) => setCrop(percentCrop)}
                  onComplete={(c) => setCompletedCrop(c)}
                  aspect={1} // Force 1:1 aspect ratio (perfect square)
                  minWidth={50}
                  minHeight={50}
                  circularCrop={false}
                  keepSelection={true}
                  className="max-w-full"
                >
                  <img
                    ref={imgRef}
                    alt="Crop me"
                    src={imgSrc}
                    onLoad={onImageLoad}
                    className="max-h-96 w-auto"
                  />
                </ReactCrop>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          {imgSrc && (
            <Button onClick={onCropComplete} className="gap-2">
              <CropIcon className="h-4 w-4" />
              Crop & Save
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * @param {HTMLImageElement} image - Image File Object
 * @param {Object} crop - crop Object
 * @param {String} fileName - Name of the returned file in Promise
 * @param {String} fileType - File type of the returned file
 */
async function getCroppedImg(
  image: HTMLImageElement,
  crop: PixelCrop,
  fileName: string,
  fileType: string
): Promise<File | null> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('No 2d context');
  }

  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;

  // Set fixed square canvas size for consistent output
  const outputSize = 400;
  canvas.width = outputSize;
  canvas.height = outputSize;

  // Clear canvas to transparent background
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Calculate source dimensions for the crop area
  const sourceX = crop.x * scaleX;
  const sourceY = crop.y * scaleY;
  const sourceWidth = crop.width * scaleX;
  const sourceHeight = crop.height * scaleY;

  // Draw the cropped image
  ctx.drawImage(
    image,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    0,
    0,
    outputSize,
    outputSize
  );

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        console.error('Canvas is empty');
        resolve(null);
        return;
      }
      const file = new File([blob], fileName, { type: fileType });
      resolve(file);
    }, fileType);
  });
}