import { AuthProvider } from "@/lib/auth-context"
import { ThemeProvider } from "@/lib/theme-context"
import { QuizProvider } from "@/lib/quiz-context"
import { FeatureFlagProvider } from "@/lib/feature-flag-context"
import AppContent from "./AppContent"

function App() {
  return (
    <ThemeProvider defaultTheme="light">
      <AuthProvider>
        <FeatureFlagProvider>
          <QuizProvider>
            <AppContent />
          </QuizProvider>
        </FeatureFlagProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
