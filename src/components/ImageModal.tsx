import { X } from 'lucide-react';
import { useEffect } from 'react';
import { createPortal } from 'react-dom';

interface ImageModalProps {
  imageUrl: string;
  onClose: () => void;
}

export default function ImageModal({ imageUrl, onClose }: ImageModalProps) {
  // Prevent scrolling when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  if (!imageUrl) return null;

  const modalContent = (
    <div 
      className="fixed inset-0 flex items-center justify-center animate-fade-in"
      onClick={onClose}
      style={{ 
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        zIndex: 9999,
        padding: '1rem'
      }}
    >
      <button 
        onClick={onClose}
        className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors bg-black/50 p-2 rounded-full cursor-pointer z-10"
        aria-label="Close"
      >
        <X size={24} />
      </button>
      <img 
        src={imageUrl} 
        alt="Expanded view" 
        onClick={(e) => e.stopPropagation()}
        className="max-w-full max-h-full object-contain rounded shadow-2xl relative" 
        style={{ 
          maxHeight: '90vh',
          maxWidth: '90vw',
          border: '2px solid rgba(255, 255, 255, 0.1)'
        }}
      />
    </div>
  );

  return createPortal(modalContent, document.body);
}
