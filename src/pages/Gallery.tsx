import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Camera } from 'lucide-react';

interface Photo {
  id: string;
  storage_path: string;
  caption: string;
  submitted_by: string;
}

export default function Gallery() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPhotos() {
      const { data, error } = await supabase
        .from('photos')
        .select('*')
        .eq('status', 'approved')
        .order('submitted_at', { ascending: false });

      if (error) {
        console.error('Error fetching photos:', error);
      } else {
        setPhotos(data || []);
      }
      setLoading(false);
    }
    
    fetchPhotos();
  }, []);

  const getPhotoUrl = (path: string) => {
    const { data } = supabase.storage.from('photos').getPublicUrl(path);
    return data.publicUrl;
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Photo Gallery</h1>
        <p className="page-subtitle">Moments captured in time.</p>
        <div className="mt-4">
          <Link to="/upload-photo" className="btn btn-primary">
            <Camera size={18} />
            Upload a Photo
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="text-center mt-8">Loading photos...</div>
      ) : photos.length === 0 ? (
        <div className="text-center mt-8 opacity-50">No photos have been uploaded yet.</div>
      ) : (
        <div className="grid grid-cols-3">
          {photos.map((photo) => (
            <div key={photo.id} className="card surface" style={{ padding: '0.75rem' }}>
              <div className="gallery-image-wrapper">
                <img 
                  src={getPhotoUrl(photo.storage_path)} 
                  alt={photo.caption || 'Gallery photo'} 
                  className="gallery-image"
                  loading="lazy"
                />
              </div>
              {photo.caption && <p className="gallery-caption">{photo.caption}</p>}
              <p className="gallery-meta">Shared by {photo.submitted_by}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
