"use client"

export const ContentWrapper = ({ children }) => {
  return (
    <main className="min-h-full px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl">{children}</div>
    </main>
  )
}