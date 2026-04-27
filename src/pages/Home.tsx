import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Link } from 'react-router-dom';
import obituaryData from '../content/obituary.json';
import bioContent from '../content/bio.md?raw';
import { supabase } from '../supabaseClient';

interface Story {
  id: string;
  author_name: string;
  content: string;
  attached_photo_path?: string;
}

interface Photo {
  id: string;
  storage_path: string;
  caption: string;
  submitted_by: string;
}

export default function Home() {
  const [recentStories, setRecentStories] = useState<Story[]>([]);
  const [recentPhotos, setRecentPhotos] = useState<Photo[]>([]);

  useEffect(() => {
    async function fetchRecentData() {
      const { data: stories } = await supabase
        .from('stories')
        .select('*')
        .eq('status', 'approved')
        .order('submitted_at', { ascending: false })
        .limit(2);

      const { data: photos } = await supabase
        .from('photos')
        .select('*')
        .eq('status', 'approved')
        .order('submitted_at', { ascending: false })
        .limit(3);

      if (stories) setRecentStories(stories);
      if (photos) setRecentPhotos(photos);
    }
    
    fetchRecentData();
  }, []);

  const getPhotoUrl = (path: string) => {
    const { data } = supabase.storage.from('photos').getPublicUrl(path);
    return data.publicUrl;
  };

  return (
    <div className="animate-fade-in">
      <div className="obituary-hero mb-8">
        <div 
          className="obituary-banner"
          style={{ 
            backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.7)), url(${import.meta.env.BASE_URL}images/background.jpg)`
          }}
        >
          <div className="profile-image-container">
            <img 
              src={`${import.meta.env.BASE_URL}${obituaryData.profilePicture.startsWith('/') ? obituaryData.profilePicture.slice(1) : obituaryData.profilePicture}`} 
              alt={obituaryData.name} 
              className="profile-image" 
            />
          </div>
          <h1 className="obituary-name">{obituaryData.name}</h1>
          <p className="obituary-dates" style={{ color: '#e2e8f0' }}>{obituaryData.dates}</p>
          <p className="obituary-location" style={{ color: '#cbd5e1' }}>{obituaryData.location}</p>
        </div>
        
        <div className="obituary-bio delay-1">
          <ReactMarkdown
            components={{
              img: ({node, ...props}) => {
                const src = props.src?.startsWith('/') 
                  ? `${import.meta.env.BASE_URL}${props.src.slice(1)}`
                  : props.src;
                return (
                  <img 
                    {...props} 
                    src={src} 
                    style={{ 
                      maxWidth: '100%', 
                      height: 'auto', 
                      borderRadius: '8px', 
                      marginTop: '2rem', 
                      marginBottom: '2rem',
                      display: 'block',
                      marginLeft: 'auto',
                      marginRight: 'auto'
                    }} 
                  />
                );
              }
            }}
          >
            {bioContent}
          </ReactMarkdown>
        </div>
      </div>

      {recentStories.length > 0 && (
        <div className="mt-8 delay-2 animate-fade-in mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2>Recent Memories</h2>
            <Link to="/stories" className="btn btn-outline">View All Stories</Link>
          </div>
          <div className="grid grid-cols-2">
            {recentStories.map((story) => (
              <div key={story.id} className="card surface">
                {story.attached_photo_path && (
                  <div className="mb-4 rounded overflow-hidden" style={{ borderRadius: '4px', overflow: 'hidden', marginBottom: '1rem' }}>
                    <img 
                      src={getPhotoUrl(story.attached_photo_path)} 
                      alt="Story attachment" 
                      className="w-full h-auto object-cover"
                      style={{ width: '100%', maxHeight: '200px', objectFit: 'cover' }} 
                    />
                  </div>
                )}
                <div className="story-content">"{story.content}"</div>
                <div className="story-author">— {story.author_name}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {recentPhotos.length > 0 && (
        <div className="mt-8 delay-3 animate-fade-in">
          <div className="flex justify-between items-center mb-4">
            <h2>Gallery Highlights</h2>
            <Link to="/gallery" className="btn btn-outline">View Full Gallery</Link>
          </div>
          <div className="grid grid-cols-3">
            {recentPhotos.map((photo) => (
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
        </div>
      )}
    </div>
  );
}
