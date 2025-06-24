
import React, { useState, useEffect, useRef } from 'react';
import { XCircleIcon } from '../icons';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const Modal = ({ isOpen, onClose, title, children, size = 'md' }: ModalProps): JSX.Element | null => {
  const [showContent, setShowContent] = useState(false);
  const modalPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        setShowContent(true);
      }, 10); 
      return () => clearTimeout(timer);
    } else {
      setShowContent(false); 
    }
  }, [isOpen]);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalPanelRef.current && !modalPanelRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen && showContent) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, showContent, onClose]);


  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };

  const backdropBaseClasses = "fixed inset-0 bg-primary-900 bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4 z-50";
  const panelBaseClasses = `bg-accent-100 rounded-lg shadow-2xl w-full ${sizeClasses[size]} p-6 relative text-accent-900`;

  const backdropTransitionClasses = "transition-opacity duration-300 ease-out";
  const panelTransitionClasses = "transition-all duration-300 ease-out transform";

  const backdropDynamicClasses = showContent ? "opacity-100" : "opacity-0";
  const panelDynamicClasses = showContent ? "opacity-100 scale-100" : "opacity-0 scale-95";

  return (
    <div className={`${backdropBaseClasses} ${backdropTransitionClasses} ${backdropDynamicClasses}`}>
      <div ref={modalPanelRef} className={`${panelBaseClasses} ${panelTransitionClasses} ${panelDynamicClasses}`}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold text-primary-800">{title}</h2>
          <button
            onClick={onClose}
            className="text-primary-600 hover:text-primary-800 transition-colors"
            aria-label="Close modal"
          >
            <XCircleIcon className="w-8 h-8" />
          </button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
};

export default Modal;