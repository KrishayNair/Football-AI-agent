import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import ClientOnlyWrapper from './components/ClientOnlyWrapper'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Football Match Analysis AI',
  description: 'AI-powered analysis of football match videos',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className} suppressHydrationWarning={true}>
        <ClientOnlyWrapper>
          {children}
        </ClientOnlyWrapper>
      </body>
    </html>
  )
} 