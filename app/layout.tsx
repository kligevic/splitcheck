import type { ReactNode } from 'react'
import './globals.css'

export const metadata = {
  title: 'Сплит-Чек',
  description: 'Интерактивный прототип разделения чека',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  )
}
