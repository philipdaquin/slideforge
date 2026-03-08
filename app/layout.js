import './globals.css'

export const metadata = {
  title: 'TikTok Slide Generator',
  description: 'Generate TikTok carousel slides with AI',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
