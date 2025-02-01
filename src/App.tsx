import { useState, useEffect } from 'react';
import { Moon, Sun, Heart, UserRound as Rose, History, X, Backpack as Backspace } from 'lucide-react';

function App() {
  const [darkMode, setDarkMode] = useState(() =>
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );
  const [loveMode, setLoveMode] = useState(false);
  const [display, setDisplay] = useState('0');
  const [equation, setEquation] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showLoveNote, setShowLoveNote] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [animation, setAnimation] = useState('');
  const [isScientificMode, setIsScientificMode] = useState(false);

  useEffect(() => {
    const savedHistory = localStorage.getItem('calculatorHistory');
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
  }, []);

  const playSound = (type: 'button' | 'calculate' | 'clear') => {
    const frequencies: Record<string, number> = {
      button: 440,
      calculate: 660,
      clear: 330
    };

    const context = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(context.destination);

    oscillator.frequency.value = frequencies[type];
    gainNode.gain.value = 0.1;

    oscillator.start();
    gainNode.gain.exponentialRampToValueAtTime(0.00001, context.currentTime + 0.1);
    setTimeout(() => oscillator.stop(), 100);
  };

  const handleNumber = (num: string) => {
    playSound('button');
    setDisplay(prev => (prev === '0' ? num : prev + num));
    setEquation(prev => prev + num);
  };

  const handleOperator = (op: string) => {
    playSound('button');
    setEquation(prev => prev + ' ' + op + ' ');
    setDisplay('0');
  };

  const handleClear = () => {
    playSound('clear');
    setDisplay('0');
    setEquation('');
  };

  const handleBackspace = () => {
    setDisplay(prev => prev.slice(0, -1) || '0');
  };
  

  const handleError = (err: unknown) => {
    const errorMessage = err instanceof Error ? err.message : 'Calculation Error';
    setError(errorMessage);
    setTimeout(() => setError(null), 3000);
  };
  // Modify handleCalculate with better error handling
  const handleCalculate = () => {
    playSound('calculate');
    try {
      if (!equation.trim()) {
        throw new Error('Empty expression');
      }
      // Check for 1+1 and trigger love note
      if (equation.trim() === '1 + 1') {
        setLoveMode(true);
        setShowLoveNote(true);
        setAnimation('animate-heartbeat');
        setTimeout(() => {
          setShowLoveNote(false);
          setAnimation('');
        }, 5000);
      }

      if (equation.includes('/0')) {
        throw new Error('Division by zero');
      }

      const sanitizedEquation = equation.replace(/[^-()\d/*+.]/g, '');
      const result = new Function('return ' + sanitizedEquation)();

      if (!isFinite(result)) {
        throw new Error('Result is infinity');
      }

      const formattedResult = Number.isInteger(result) ?
        result.toString() :
        parseFloat(result.toFixed(6)).toString();

      setDisplay(formattedResult);
      setEquation(formattedResult);
      setHistory(prev => [`${equation} = ${formattedResult}${loveMode ? ' 💝' : ''}`, ...prev].slice(0, 10));
    } catch (err) {
      handleError(err);
      setDisplay('0');
      setEquation('');
    }
  };

  // Add this useEffect hook right after your other useEffect hooks
// Update the useEffect hook with the modified handleKeyPress function
useEffect(() => {
  const handleKeyPress = (event: KeyboardEvent) => {
    const key = event.key;

    // Numbers and decimal
    if (/^[0-9.]$/.test(key)) {
      handleNumber(key);
    }

    // Operators
    const operatorMap: Record<string, string> = {
      '+': '+',
      '-': '-',
      '*': '*',
      '/': '/',
      'x': '*',
      'X': '*',
    };

    if (key in operatorMap) {
      handleOperator(operatorMap[key]);
    }

    // Enter/Equal for calculation
    if (key === 'Enter' || key === '=') {
      event.preventDefault(); // Prevent form submission if within a form
      if (equation.trim()) { // Only calculate if there's an equation
        handleCalculate();
      }
    }

    // Backspace for single character deletion
    else if (key === 'Backspace') {
      event.preventDefault();
      handleBackspace();
    }

    // Clear with Delete or Escape
    else if (key === 'Delete' || key === 'Escape') {
      event.preventDefault();
      handleClear();
    }
  };

  window.addEventListener('keydown', handleKeyPress);

  return () => {
    window.removeEventListener('keydown', handleKeyPress);
  };
}, [equation]); // Add equation to dependencies


  const handleScientific = (operation: string) => {
    playSound('button');
    try {
      let result: number;
      const currentValue = parseFloat(display);

      switch (operation) {
        case 'sin':
          result = Math.sin(currentValue * Math.PI / 180);
          break;
        case 'cos':
          result = Math.cos(currentValue * Math.PI / 180);
          break;
        case 'tan':
          result = Math.tan(currentValue * Math.PI / 180);
          break;
        case 'sqrt':
          if (currentValue < 0) throw new Error('Cannot calculate square root of negative number');
          result = Math.sqrt(currentValue);
          break;
        case 'log':
          if (currentValue <= 0) throw new Error('Cannot calculate log of zero or negative number');
          result = Math.log10(currentValue);
          break;
        case 'pow2':
          result = Math.pow(currentValue, 2);
          break;
        default:
          throw new Error('Invalid operation');
      }

      const formattedResult = Number.isInteger(result) ? result.toString() : result.toFixed(6);
      setDisplay(formattedResult);
      setEquation(`${operation}(${currentValue}) = ${formattedResult}`);
      setHistory(prev => [`${operation}(${currentValue}) = ${formattedResult}`, ...prev].slice(0, 10));
    } catch (err) {
      handleError(err);
    }
  };

  const scientificButtons = [
    { label: 'sin', op: 'sin' },
    { label: 'cos', op: 'cos' },
    { label: 'tan', op: 'tan' },
    { label: '√', op: 'sqrt' },
    { label: 'log', op: 'log' },
    { label: 'x²', op: 'pow2' },
  ];

  return (
    <div className={`min-h-screen w-full transition-colors duration-300 ${darkMode
      ? loveMode
        ? 'bg-gradient-to-br from-[#4A1942] via-[#893168] to-[#C74B80]' // Dark love mode - deeper rose/burgundy
        : 'bg-gradient-to-br from-[#1A1A2E] via-[#16213E] to-[#0F3460]' // Dark mode
      : loveMode
        ? 'bg-gradient-to-br from-[#FF69B4] to-[#FFB6C1]' // Light love mode
        : 'bg-gradient-to-br from-[#FCC6FF] to-[#FFA09B]' // Light mode
      }`}>
      {showLoveNote && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-pink-100/90 backdrop-blur-sm p-6 rounded-3xl shadow-2xl animate-float text-center">
            <p className="text-xl text-pink-600 font-pixel">Found the hidder Easter! 💝</p>
            <p className="text-sm text-pink-500 mt-2">So 1+1 is 2 if protection not used 🌚</p>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8 min-h-screen flex flex-col items-center justify-center">
        {/* Main Calculator Container */}
        <div className="w-full max-w-md relative">
          {/* Top Control Bar */}
          <div className="flex justify-between items-center mb-6 px-2">
            <div className="flex gap-3">
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-3 rounded-xl backdrop-blur-sm transition-all hover:scale-110 bg-white/10"
              >
                {darkMode ?
                  <Sun size={24} className="text-purple-300" /> :
                  <Moon size={24} className="text-purple-400" />
                }
              </button>
              <button
                onClick={() => setIsScientificMode(!isScientificMode)}
                className="p-3 rounded-xl backdrop-blur-sm transition-all hover:scale-110 bg-white/10"
              >
                <span className={`text-xl font-bold ${darkMode ? 'text-purple-300' : 'text-purple-500'}`}>
                  {isScientificMode ? '123' : 'f(x)'}
                </span>
              </button>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="p-3 rounded-xl backdrop-blur-sm transition-all hover:scale-110 bg-white/10"
              >
                <History size={24} className={darkMode ? "text-purple-300" : "text-purple-500"} />
              </button>
              <button
                onClick={() => setLoveMode(!loveMode)}
                className={`p-3 rounded-xl backdrop-blur-sm transition-all hover:scale-110 bg-white/10 ${animation}`}
              >
                {loveMode ?
                  <Rose size={24} className="text-pink-400" /> :
                  <Heart size={24} className="text-pink-500" />
                }
              </button>
            </div>
          </div>

          {/* History Sidebar */}
          {showHistory && (
            <div className={`absolute right-0 top-20 w-64 p-4 rounded-xl shadow-xl z-50 backdrop-blur-md
              ${darkMode
                ? 'bg-[#2A2D3E]/90 text-blue-300'
                : 'bg-white/90 text-purple-600'}`}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">History</h3>
                <button onClick={() => setShowHistory(false)}>
                  <X size={20} />
                </button>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {history.map((item, index) => (
                  <div key={index} className={`p-2 rounded-lg ${darkMode
                    ? 'bg-blue-900/30'
                    : 'bg-purple-100/50'
                    }`}>
                    {item}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Calculator Body */}
          <div className={`rounded-3xl overflow-hidden shadow-2xl backdrop-blur-md 
  ${darkMode && loveMode
              ? 'bg-gradient-to-br from-[#2D1429]/90 via-[#461B3D]/90 to-[#6B2B5B]/90' // Dark love mode - rich burgundy
              : darkMode
                ? 'bg-gradient-to-br from-[#0A1931]/80 via-[#150F3F]/80 to-[#311D3F]/80' // Dark mode
                : loveMode
                  ? 'bg-gradient-to-br from-[#FFE6F3]/90 via-[#FFE6FF]/90 to-[#F8E6FF]/90' // Light love mode
                  : 'bg-gradient-to-br from-[#FFFFFF]/90 via-[#FFF5FA]/90 to-[#FFF0F7]/90'}`} // Pure light theme
          >


            {/* Calculator Display */}
            <div className={`p-6 ${darkMode ? 'bg-[#2C1B3D]/50' : 'bg-white/30'}`}>
              <div className="h-28 flex flex-col justify-between text-right font-pixel">
                <div className={`text-sm ${darkMode ? 'text-purple-300/70' : 'text-purple-600/70'}`}>
                  {history[0] || ''}
                </div>
                <div className={`text-5xl glow ${darkMode ? 'text-purple-200' : 'text-purple-700'}`}>
                  {display}
                </div>
              </div>
            </div>

            {/* Scientific Buttons */}
            {isScientificMode && (
              <div className="grid grid-cols-3 gap-3 px-6 pb-3">
                {scientificButtons.map(({ label, op }) => (
                  <button
                    key={op}
                    onClick={() => handleScientific(op)}
                    className={`py-4 rounded-2xl text-sm font-bold transition-all 
                      hover:scale-105 active:scale-95 shadow-inner
                      ${darkMode
                        ? 'bg-gray-700/50 hover:bg-gray-600/50 text-gray-200'
                        : loveMode
                          ? 'bg-purple-200/50 hover:bg-purple-300/50 text-purple-700'
                          : 'bg-orange-200/50 hover:bg-orange-300/50 text-gray-800'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}

            {/* Number Pad */}
            <div className="p-6 pt-3 grid gap-3">
              <div className="grid grid-cols-4 gap-3">
                {['C', '%', '÷', '×', '7', '8', '9', '-', '4', '5', '6', '+', '1', '2', '3', 'backspace', '=', '0', '.'].map((btn) => (
                  <button
                    key={btn}
                    onClick={() => {
                      if (btn === 'C') handleClear();
                      else if (btn === '=') handleCalculate();
                      else if (btn === 'backspace') handleBackspace();
                      else if (['+', '-', '×', '÷', '%'].includes(btn))
                        handleOperator(btn.replace('×', '*').replace('÷', '/'));
                      else handleNumber(btn);
                    }}
                    className={`${btn === '=' ? 'col-span-2' : ''} 
          py-4 rounded-2xl text-xl font-pixel transition-all 
          hover:scale-105 active:scale-95 shadow-inner
          ${['C', '+', '-', '×', '÷', '=', '%', 'backspace'].includes(btn)
                        ? darkMode && loveMode
                          ? 'bg-purple-900/50 hover:bg-purple-800/50 text-purple-200'
                          : darkMode
                            ? 'bg-gray-700/50 hover:bg-gray-600/50 text-gray-200'
                            : loveMode
                              ? 'bg-purple-400/50 hover:bg-purple-500/50 text-white'
                              : 'bg-orange-400/50 hover:bg-orange-500/50 text-white'
                        : darkMode && loveMode
                          ? 'bg-purple-800/30 hover:bg-purple-700/30 text-purple-200'
                          : darkMode
                            ? 'bg-gray-800/30 hover:bg-gray-700/30 text-gray-200'
                            : loveMode
                              ? 'bg-white/50 hover:bg-white/70 text-purple-700'
                              : 'bg-white/50 hover:bg-white/70 text-gray-800'}`}
                  >
                    {btn === '=' ? <Heart className="mx-auto w-6 h-6" /> :
                      btn === 'backspace' ? <Backspace className="mx-auto w-6 h-6" /> : btn}
                  </button>
                ))}
              </div>
            </div>
          </div>
          {error && (
            <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-red-500 text-white 
    px-6 py-3 rounded-full text-sm animate-fade-in shadow-lg z-50">
              {error}
            </div>
          )}
          <div className="fixed bottom-4 left-0 right-0 text-center backdrop-blur-sm">
            <a
              href="https://github.com/yourusername"
              target="_blank"
              rel="noopener noreferrer"
              className={`text-sm font-medium transition-all hover:scale-105 ${darkMode && loveMode
                ? 'text-purple-300 hover:text-purple-200'
                : darkMode
                  ? 'text-gray-300 hover:text-white'
                  : loveMode
                    ? 'text-pink-600 hover:text-pink-700'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
            >
              Made with {loveMode ? '💖' : '💻'} by @Souvik8426
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
