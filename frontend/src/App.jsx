import { AuthProvider } from "@/lib/auth-context"
import { ThemeProvider } from "@/lib/theme-context"
import { QuizProvider } from "@/lib/quiz-context"
import AppContent from "./AppContent"

function App() {
  return (
    <ThemeProvider defaultTheme="light">
      <AuthProvider>
        <QuizProvider>
          <AppContent />
        </QuizProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
