import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';

interface Equation {
  text: string;
  x: number;
  y: number;
  delay: number;
  duration: number;
}

interface CodeSnippet {
  lines: string[];
  x: number;
  y: number;
  delay: number;
  duration: number;
}

const MathPhysicsBackground: React.FC = () => {
  const [equations, setEquations] = useState<Equation[]>([]);
  const [codeSnippets, setCodeSnippets] = useState<CodeSnippet[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Math and Physics equations
  const equationList = [
    'E = mc²', 'F = ma', 'a² + b² = c²', '∫ f(x)dx', 'lim(x→∞)',
    'd/dx [f(x)]', '∑(n=1 to ∞)', 'e^(iπ) + 1 = 0', '∇²φ = 0',
    '∂²u/∂t² = c²∇²u', 'f(x) = ax² + bx + c', 'sin²θ + cos²θ = 1',
    'e^(ln x) = x', 'logₐ(xy) = logₐ(x) + logₐ(y)', '∫₀^∞ e^(-x²) dx = √π/2',
    'F = G(m₁m₂)/r²', 'E = hf', 'PV = nRT', 'E = ½mv²', 'F = -kx',
    'I = V/R', 'P = IV', 'λ = h/p', 'ΔE = mc²', 'v = u + at',
    's = ut + ½at²', 'v² = u² + 2as', 'τ = r × F', 'L = Iω',
    'E = ½Iω²', 'F = q(E + v × B)', '∇ × E = -∂B/∂t', '∇ · E = ρ/ε₀',
    'c = λf', 'n₁sin(θ₁) = n₂sin(θ₂)', 'ΔS = Q/T', 'W = ∫ F·ds',
  ];

  // Code snippets
  const codeTemplates = [
    ['function calculate() {', '  return x * y;', '}'],
    ['const result = [];', 'for (let i = 0; i < n; i++) {', '  result.push(i);', '}'],
    ['def solve_equation(a, b):', '    return (-b + sqrt(b**2 - 4*a*c)) / (2*a)'],
    ['class Solution:', '    def method(self):', '        pass'],
    ['if (condition) {', '    execute();', '}'],
    ['for i in range(n):', '    process(i)'],
    ['const data = {', '  key: value', '};'],
    ['import numpy as np', 'arr = np.array([1, 2, 3])'],
  ];

  useEffect(() => {
    // Generate random positions for equations
    const generateEquations = () => {
      const newEquations: Equation[] = [];
      for (let i = 0; i < 30; i++) {
        newEquations.push({
          text: equationList[Math.floor(Math.random() * equationList.length)],
          x: Math.random() * 100,
          y: Math.random() * 100,
          delay: Math.random() * 2,
          duration: 15 + Math.random() * 10,
        });
      }
      setEquations(newEquations);
    };

    // Generate code snippets
    const generateCodeSnippets = () => {
      const newSnippets: CodeSnippet[] = [];
      for (let i = 0; i < 8; i++) {
        const template = codeTemplates[Math.floor(Math.random() * codeTemplates.length)];
        newSnippets.push({
          lines: template,
          x: Math.random() * 80 + 10,
          y: Math.random() * 80 + 10,
          delay: Math.random() * 3,
          duration: 20 + Math.random() * 10,
        });
      }
      setCodeSnippets(newSnippets);
    };

    generateEquations();
    generateCodeSnippets();
  }, []);

  // Draw animated graphs on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    let animationFrame: number;
    let time = 0;

    const drawGraphs = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = 'rgba(139, 111, 71, 0.3)';
      ctx.lineWidth = 2;

      // Sine wave
      ctx.beginPath();
      for (let x = 0; x < canvas.width; x += 2) {
        const y = canvas.height * 0.3 + Math.sin((x * 0.01) + time) * 50;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Cosine wave
      ctx.beginPath();
      for (let x = 0; x < canvas.width; x += 2) {
        const y = canvas.height * 0.7 + Math.cos((x * 0.008) + time * 0.8) * 60;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Parabola
      ctx.beginPath();
      for (let x = 0; x < canvas.width; x += 2) {
        const centerX = canvas.width / 2;
        const centerY = canvas.height * 0.5;
        const y = centerY + ((x - centerX) ** 2) * 0.0001 * Math.sin(time);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Exponential curve
      ctx.beginPath();
      for (let x = 0; x < canvas.width * 0.6; x += 2) {
        const y = canvas.height * 0.8 - Math.exp(x * 0.01) * 0.5 * (1 + Math.sin(time));
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Grid lines
      ctx.strokeStyle = 'rgba(107, 142, 35, 0.15)';
      ctx.lineWidth = 1;
      for (let i = 0; i < canvas.width; i += 100) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
        ctx.stroke();
      }
      for (let i = 0; i < canvas.height; i += 100) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(canvas.width, i);
        ctx.stroke();
      }

      time += 0.02;
      animationFrame = requestAnimationFrame(drawGraphs);
    };

    drawGraphs();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Canvas for animated graphs */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 opacity-60"
        style={{ mixBlendMode: 'multiply' }}
      />

      {/* Animated equations */}
      {equations.map((eq, index) => (
        <motion.div
          key={index}
          className="absolute text-amber-900 dark:text-amber-700 text-sm sm:text-base md:text-lg font-mono select-none whitespace-nowrap"
          style={{
            left: `${eq.x}%`,
            top: `${eq.y}%`,
          }}
          initial={{ 
            opacity: 0,
            y: 100,
            rotate: -8 + Math.random() * 16,
            scale: 0.8 + Math.random() * 0.4,
          }}
          animate={{
            opacity: [0, 0.5, 0.5, 0],
            y: [100, -100],
            rotate: [-8 + Math.random() * 16, 8 + Math.random() * 16],
            scale: [0.8 + Math.random() * 0.4, 1 + Math.random() * 0.2],
          }}
          transition={{
            duration: eq.duration,
            delay: eq.delay,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          {eq.text}
        </motion.div>
      ))}

      {/* Code snippets */}
      {codeSnippets.map((snippet, index) => (
        <motion.div
          key={`code-${index}`}
          className="absolute backdrop-blur-sm bg-amber-50/30 dark:bg-amber-900/20 rounded-lg p-2 border border-amber-200/30 dark:border-amber-800/30"
          style={{
            left: `${snippet.x}%`,
            top: `${snippet.y}%`,
          }}
          initial={{
            opacity: 0,
            x: -50,
            rotate: -5,
          }}
          animate={{
            opacity: [0, 0.6, 0.6, 0],
            x: [0, 50],
            rotate: [-5, 5],
          }}
          transition={{
            duration: snippet.duration,
            delay: snippet.delay,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          {snippet.lines.map((line, lineIndex) => (
            <div
              key={lineIndex}
              className="text-xs sm:text-sm font-mono text-amber-900 dark:text-amber-200 whitespace-nowrap"
            >
              {line}
            </div>
          ))}
        </motion.div>
      ))}

      {/* Animated connecting lines */}
      {Array.from({ length: 15 }).map((_, i) => {
        const startX = Math.random() * 100;
        const startY = Math.random() * 100;
        const endX = startX + (Math.random() - 0.5) * 30;
        const endY = startY + (Math.random() - 0.5) * 30;
        
        return (
          <motion.svg
            key={`line-${i}`}
            className="absolute inset-0 w-full h-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.3, 0.3, 0] }}
            transition={{
              duration: 8 + Math.random() * 4,
              delay: Math.random() * 2,
              repeat: Infinity,
            }}
          >
            <motion.line
              x1={`${startX}%`}
              y1={`${startY}%`}
              x2={`${endX}%`}
              y2={`${endY}%`}
              stroke="rgba(107, 142, 35, 0.4)"
              strokeWidth="1.5"
              strokeDasharray="5,5"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: [0, 1, 1, 0] }}
              transition={{
                duration: 8 + Math.random() * 4,
                delay: Math.random() * 2,
                repeat: Infinity,
              }}
            />
          </motion.svg>
        );
      })}

      {/* Static decorative equations */}
      <div className="absolute inset-0">
        {Array.from({ length: 25 }).map((_, i) => {
          const randomEq = equationList[Math.floor(Math.random() * equationList.length)];
          return (
            <motion.div
              key={`static-${i}`}
              className="absolute text-amber-800/20 dark:text-amber-600/20 text-sm sm:text-base font-mono select-none whitespace-nowrap"
              style={{
                left: `${3 + (i * 3.8)}%`,
                top: `${2 + (i % 5) * 20}%`,
              }}
              initial={{
                rotate: -12 + Math.random() * 24,
                opacity: 0.15,
              }}
              animate={{
                rotate: [-12 + Math.random() * 24, 12 + Math.random() * 24],
                opacity: [0.1, 0.2, 0.1],
              }}
              transition={{
                duration: 20 + Math.random() * 10,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              {randomEq}
            </motion.div>
          );
        })}
      </div>

      {/* Decorative exam-related text */}
      <div className="absolute inset-0">
        {['EXAM', 'TEST', 'QUIZ', 'FINAL', 'PAPER'].map((text, i) => (
          <motion.div
            key={`exam-${i}`}
            className="absolute text-amber-900/10 dark:text-amber-800/10 text-7xl md:text-9xl font-bold select-none"
            style={{
              left: `${8 + i * 18}%`,
              top: `${12 + (i % 2) * 60}%`,
            }}
            initial={{
              rotate: -15 + i * 8,
              opacity: 0.1,
            }}
            animate={{
              rotate: [-15 + i * 8, -10 + i * 8],
              opacity: [0.08, 0.15, 0.08],
            }}
            transition={{
              duration: 15 + i * 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            {text}
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default MathPhysicsBackground;