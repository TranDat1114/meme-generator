"use client"

import type React from "react"
import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { X, Move } from "lucide-react"

interface TextPosition {
  id: number
  x: number
  y: number
  text: string
  size: number
  rotation: number
}

export default function MemeGenerator() {
  const [image, setImage] = useState<string | null>(null)
  const [text, setText] = useState("")
  const [textPositions, setTextPositions] = useState<TextPosition[]>([])
  const [selectedTextId, setSelectedTextId] = useState<number | null>(null)
  const [nextId, setNextId] = useState(0)
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e: ProgressEvent<FileReader>) => {
        const result = e.target?.result
        if (typeof result === "string") {
          const img = new Image()
          img.onload = () => {
            setCanvasSize({ width: img.width, height: img.height })
            setImage(result)
          }
          img.src = result
        }
      }
      reader.readAsDataURL(file)
    }
  }, [])

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current
      if (canvas) {
        const rect = canvas.getBoundingClientRect()
        const x = (e.clientX - rect.left) * (canvas.width / rect.width)
        const y = (e.clientY - rect.top) * (canvas.height / rect.height)

        // Check if we clicked on an existing text
        const clickedText = textPositions.find((pos) => Math.abs(pos.x - x) < 20 && Math.abs(pos.y - y) < 20)

        if (clickedText) {
          setSelectedTextId(clickedText.id)
        } else if (text) {
          const newText: TextPosition = { id: nextId, x, y, text, size: 30, rotation: 0 }
          setTextPositions((prev) => [...prev, newText])
          setSelectedTextId(nextId)
          setNextId((prevId) => prevId + 1)
          setText("") // Clear the text input after adding
        } else {
          setSelectedTextId(null)
        }
      }
    },
    [text, nextId, textPositions],
  )

  const removeText = useCallback((e: React.MouseEvent, id: number) => {
    e.stopPropagation() // Prevent canvas click
    setTextPositions((prev) => prev.filter((pos) => pos.id !== id))
    setSelectedTextId(null)
  }, [])

  const updateTextPosition = useCallback((id: number, x: number, y: number) => {
    setTextPositions((prev) => prev.map((pos) => (pos.id === id ? { ...pos, x, y } : pos)))
  }, [])

  const handleDragStart = useCallback(
    (e: React.MouseEvent, id: number) => {
      e.stopPropagation() // Prevent canvas click
      const canvas = canvasRef.current
      if (canvas) {
        const rect = canvas.getBoundingClientRect()
        const x = (e.clientX - rect.left) * (canvas.width / rect.width)
        const y = (e.clientY - rect.top) * (canvas.height / rect.height)
        const textPos = textPositions.find((pos) => pos.id === id)
        if (textPos) {
          setDragOffset({
            x: textPos.x - x,
            y: textPos.y - y,
          })
        }
      }
      setIsDragging(true)
      setSelectedTextId(id)
    },
    [textPositions],
  )

  const handleDrag = useCallback(
    (e: React.MouseEvent) => {
      if (isDragging && selectedTextId !== null) {
        const canvas = canvasRef.current
        if (canvas) {
          const rect = canvas.getBoundingClientRect()
          const x = (e.clientX - rect.left) * (canvas.width / rect.width) + dragOffset.x
          const y = (e.clientY - rect.top) * (canvas.height / rect.height) + dragOffset.y
          updateTextPosition(selectedTextId, x, y)
        }
      }
    },
    [isDragging, selectedTextId, updateTextPosition, dragOffset],
  )

  const handleDragEnd = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleTextSizeChange = useCallback(
    (value: number) => {
      if (selectedTextId !== null) {
        setTextPositions((prev) => prev.map((pos) => (pos.id === selectedTextId ? { ...pos, size: value } : pos)))
      }
    },
    [selectedTextId],
  )

  const handleTextRotationChange = useCallback(
    (value: number) => {
      if (selectedTextId !== null) {
        setTextPositions((prev) => prev.map((pos) => (pos.id === selectedTextId ? { ...pos, rotation: value } : pos)))
      }
    },
    [selectedTextId],
  )

  const generateMeme = useCallback(() => {
    const canvas = canvasRef.current
    if (canvas && image) {
      const ctx = canvas.getContext("2d")
      if (ctx) {
        const img = new Image()
        img.onload = () => {
          canvas.width = img.width
          canvas.height = img.height
          ctx.drawImage(img, 0, 0)
          textPositions.forEach((pos) => {
            ctx.save()
            ctx.translate(pos.x, pos.y)
            ctx.rotate((pos.rotation * Math.PI) / 180)
            ctx.font = `${pos.size}px Impact`
            ctx.fillStyle = "white"
            ctx.strokeStyle = "black"
            ctx.lineWidth = 2
            ctx.textAlign = "center"
            ctx.fillText(pos.text, 0, 0)
            ctx.strokeText(pos.text, 0, 0)
            ctx.restore()
          })
        }
        img.src = image
      }
    }
  }, [image, textPositions])

  const downloadMeme = useCallback(() => {
    const canvas = canvasRef.current
    if (canvas) {
      const link = document.createElement("a")
      link.download = "meme.png"
      link.href = canvas.toDataURL()
      link.click()
    }
  }, [])

  useEffect(() => {
    generateMeme()
  }, [generateMeme])

  const selectedText = textPositions.find((pos) => pos.id === selectedTextId)

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Meme Generator</h1>
      <div className="mb-4">
        <Label htmlFor="image-upload">Upload Image</Label>
        <Input id="image-upload" type="file" accept="image/*" onChange={handleImageUpload} ref={fileInputRef} />
      </div>
      <div className="mb-4">
        <Label htmlFor="text-input">Meme Text</Label>
        <Input
          id="text-input"
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter meme text"
        />
      </div>
      {selectedText && (
        <>
          <div className="mb-4">
            <Label htmlFor="text-size">Text Size</Label>
            <Slider
              id="text-size"
              min={10}
              max={100}
              step={1}
              value={[selectedText.size]}
              onValueChange={(value) => handleTextSizeChange(value[0])}
            />
          </div>
          <div className="mb-4">
            <Label htmlFor="text-rotation">Text Rotation</Label>
            <Slider
              id="text-rotation"
              min={-180}
              max={180}
              step={1}
              value={[selectedText.rotation]}
              onValueChange={(value) => handleTextRotationChange(value[0])}
            />
          </div>
        </>
      )}
      <div className="mb-4 relative">
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          onMouseMove={handleDrag}
          onMouseUp={handleDragEnd}
          onMouseLeave={handleDragEnd}
          className="border border-gray-300 cursor-crosshair"
          style={{ maxWidth: "100%", height: "auto" }}
          width={canvasSize.width}
          height={canvasSize.height}
        />
        {textPositions.map((pos) => (
          <div
            key={pos.id}
            style={{
              position: "absolute",
              left: `${(pos.x / canvasSize.width) * 100}%`,
              top: `${(pos.y / canvasSize.height) * 100}%`,
              transform: "translate(-50%, -50%)",
              cursor: isDragging && selectedTextId === pos.id ? "grabbing" : "grab",
              border: selectedTextId === pos.id ? "2px solid blue" : "none",
              padding: "10px",
            }}
            onMouseDown={(e) => handleDragStart(e, pos.id)}
          >
            <div className="w-6 h-6 bg-white rounded-full shadow-md flex items-center justify-center">
              <Move className="h-4 w-4 text-gray-600" />
            </div>
            {selectedTextId === pos.id && (
              <Button
                variant="destructive"
                size="icon"
                className="w-6 h-6 absolute top-0 right-0 transform translate-x-full -translate-y-full"
                onClick={(e) => removeText(e, pos.id)}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Button onClick={() => fileInputRef.current?.click()}>Choose Image</Button>
        <Button onClick={downloadMeme}>Download Meme</Button>
        <Button onClick={downloadMeme}>To BlockChain</Button>
      </div>
      <p className="mt-4 text-sm text-gray-600">
        Click on the image to add text. Drag the move handle to reposition text. Click on text to edit size and
        rotation.
      </p>
    </div>
  )
}

