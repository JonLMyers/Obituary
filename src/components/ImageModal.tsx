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
      className="animate-fade-in"
      onClick={onClose}
      style={{ 
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
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
      <button 
        onClick={onClose}
        aria-label="Close"
        style={{
          position: 'absolute',
          top: '1rem',
          right: '1rem',
          color: 'white',
          backgroundColor: 'rgba(0,0,0,0.5)',
          padding: '0.5rem',
          borderRadius: '9999px',
          border: 'none',
          cursor: 'pointer',
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <X size={24} />
      </button>
      <img 
        src={imageUrl} 
        alt="Expanded view" 
        onClick={(e) => e.stopPropagation()}
        style={{ 
          position: 'relative',
          maxHeight: '90vh',
          maxWidth: '90vw',
          objectFit: 'contain',
          borderRadius: '8px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          border: '2px solid rgba(255, 255, 255, 0.1)'
        }}
      />
    </div>
  );

  return createPortal(modalContent, document.body);
}
