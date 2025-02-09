import "@/styles/globals.css"
import { Inter } from "next/font/google"
import type React from "react" // Import React

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "jMeme Generator",
  description: "jMeme Generator is a simple meme generator that allows you to create memes with ease.",

}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta name="apple-mobile-web-app-title" content="jMeme" />
      </head>
      <body className={inter.className}>
        {children}
      </body>
    </html>
  )
}

