import { AuthProvider } from '../contexts/AuthContext'
import './globals.css'

export const metadata = {
  title: 'Next.js App with Auth',
  description: 'Next.js application with authentication',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}

