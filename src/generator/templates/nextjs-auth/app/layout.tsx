'use client'

import { AuthProvider } from 'oidc-react'
import { oidcConfig } from '../config/oidc.config'
import './globals.css'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider {...oidcConfig}>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}

