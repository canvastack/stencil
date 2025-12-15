import { useState, useEffect } from 'react';

interface TypingEffectProps {
  texts: string[];
  typingSpeed?: number;
  deletingSpeed?: number;
  delayBetweenTexts?: number;
}

export const TypingEffect = ({ 
  texts, 
  typingSpeed = 100, 
  deletingSpeed = 50, 
  delayBetweenTexts = 2000 
}: TypingEffectProps) => {
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [currentText, setCurrentText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const targetText = texts?.[currentTextIndex] || '';
    
    if (!isDeleting && currentText === targetText) {
      const timeout = setTimeout(() => setIsDeleting(true), delayBetweenTexts);
      return () => clearTimeout(timeout);
    }
    
    if (isDeleting && currentText === '') {
      setIsDeleting(false);
      setCurrentTextIndex((prev) => (prev + 1) % texts.length);
      return;
    }
    
    const timeout = setTimeout(() => {
      setCurrentText(prev => 
        isDeleting 
          ? targetText.substring(0, prev.length - 1)
          : targetText.substring(0, prev.length + 1)
      );
    }, isDeleting ? deletingSpeed : typingSpeed);
    
    return () => clearTimeout(timeout);
  }, [currentText, isDeleting, currentTextIndex, texts, typingSpeed, deletingSpeed, delayBetweenTexts]);

  return (
    <span className="inline-block">
      <span>{currentText}</span>
      <span className="animate-pulse ml-1">|</span>
    </span>
  );
};

export default TypingEffect;