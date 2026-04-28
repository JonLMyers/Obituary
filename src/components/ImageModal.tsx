import { X } from 'lucide-react';
import { useEffect } from 'react';

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

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center animate-fade-in"
      onClick={onClose}
      style={{ 
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        zIndex: 9999,
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        padding: '1rem'
      }}
    >
      <div 
        className="relative max-w-full max-h-full flex items-center justify-center p-4"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors bg-black/50 p-2 rounded-full cursor-pointer z-10"
          aria-label="Close"
          style={{ zIndex: 10000 }}
        >
          <X size={24} />
        </button>
        <img 
          src={imageUrl} 
          alt="Expanded view" 
          className="max-w-full max-h-full object-contain rounded shadow-2xl" 
          style={{ 
            maxHeight: '90vh',
            maxWidth: '90vw',
            border: '2px solid rgba(255, 255, 255, 0.1)'
          }}
        />
      </div>
    </div>
  );
}
