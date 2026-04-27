import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Edit3 } from 'lucide-react';

interface Story {
  id: string;
  author_name: string;
  content: string;
  attached_photo_path: string | null;
  submitted_at: string;
}

export default function Stories() {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStories() {
      const { data, error } = await supabase
        .from('stories')
        .select('*')
        .eq('status', 'approved')
        .order('submitted_at', { ascending: false });

      if (error) {
        console.error('Error fetching stories:', error);
      } else {
        setStories(data || []);
      }
      setLoading(false);
    }
    
    fetchStories();
  }, []);

  const getPhotoUrl = (path: string) => {
    const { data } = supabase.storage.from('photos').getPublicUrl(path);
    return data.publicUrl;
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Shared Memories</h1>
        <p className="page-subtitle">Stories and condolences from friends and family.</p>
        <div className="mt-4">
          <Link to="/submit-story" className="btn btn-primary">
            <Edit3 size={18} />
            Share a Memory
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="text-center mt-8">Loading stories...</div>
      ) : stories.length === 0 ? (
        <div className="text-center mt-8 opacity-50">No stories have been shared yet.</div>
      ) : (
        <div className="grid grid-cols-2">
          {stories.map((story) => (
            <div key={story.id} className="card surface">
              {story.attached_photo_path && (
                <div className="mb-4 rounded overflow-hidden" style={{ borderRadius: '4px', overflow: 'hidden', marginBottom: '1rem' }}>
                  <img 
                    src={getPhotoUrl(story.attached_photo_path)} 
                    alt="Story attachment" 
                    className="w-full h-auto object-cover"
                    style={{ width: '100%', maxHeight: '300px', objectFit: 'cover' }} 
                  />
                </div>
              )}
              <div className="story-content">"{story.content}"</div>
              <div className="story-author">
                — {story.author_name}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
