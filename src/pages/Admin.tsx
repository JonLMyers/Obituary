import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Shield, Check, X } from 'lucide-react';
import ImageModal from '../components/ImageModal';

export default function Admin() {
  const [session, setSession] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState<'stories' | 'photos'>('stories');
  
  const [pendingStories, setPendingStories] = useState<any[]>([]);
  const [pendingPhotos, setPendingPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchPendingData();
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchPendingData();
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchPendingData = async () => {
    setLoading(true);
    const { data: stories } = await supabase
      .from('stories')
      .select('*')
      .eq('status', 'pending')
      .order('submitted_at', { ascending: false });
    
    const { data: photos } = await supabase
      .from('photos')
      .select('*')
      .eq('status', 'pending')
      .order('submitted_at', { ascending: false });

    setPendingStories(stories || []);
    setPendingPhotos(photos || []);

    // Generate signed URLs for the private pending-photos bucket
    const urls: Record<string, string> = {};
    const pathsToSign = new Set<string>();
    
    (photos || []).forEach(p => pathsToSign.add(p.storage_path));
    (stories || []).forEach(s => { if (s.attached_photo_path && s.attached_photo_path.startsWith('pending/')) pathsToSign.add(s.attached_photo_path) });

    for (const path of Array.from(pathsToSign)) {
      const { data } = await supabase.storage.from('pending-photos').createSignedUrl(path, 3600);
      if (data) urls[path] = data.signedUrl;
    }
    setSignedUrls(urls);

    setLoading(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    await supabase.auth.signInWithPassword({ email, password });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const updateStoryStatus = async (id: string, status: 'approved' | 'rejected') => {
    if (status === 'rejected') {
      await supabase.from('stories').delete().eq('id', id);
    } else {
      await supabase.from('stories').update({ status, approved_at: new Date().toISOString() }).eq('id', id);
    }
    fetchPendingData();
  };

  const updatePhotoStatus = async (id: string, path: string, status: 'approved' | 'rejected') => {
    if (status === 'approved') {
      const newPath = path.replace('pending/', 'approved/');
      
      // Download from private pending-photos bucket
      const { data: fileData, error: downloadError } = await supabase.storage.from('pending-photos').download(path);
      if (!downloadError && fileData) {
        // Upload to public photos bucket
        await supabase.storage.from('photos').upload(newPath, fileData);
        await supabase.from('photos').update({ status, storage_path: newPath, approved_at: new Date().toISOString() }).eq('id', id);
        
        // Delete from pending-photos
        await supabase.storage.from('pending-photos').remove([path]);
        
        // Update any stories that might have been referencing the old pending path
        await supabase.from('stories').update({ attached_photo_path: newPath }).eq('attached_photo_path', path);
      }
    } else {
      // Permanently delete from storage and database
      await supabase.storage.from('pending-photos').remove([path]);
      await supabase.from('photos').delete().eq('id', id);
      
      // Remove the attachment from any stories that referenced it
      await supabase.from('stories').update({ attached_photo_path: null }).eq('attached_photo_path', path);
    }
    fetchPendingData();
  };

  const getPhotoUrl = (path: string) => {
    // If it's a pending path, use the signed URL
    if (path.startsWith('pending/') && signedUrls[path]) {
      return signedUrls[path];
    }
    // Otherwise it's already an approved public photo
    const { data } = supabase.storage.from('photos').getPublicUrl(path);
    return data.publicUrl;
  };

  if (!session) {
    return (
      <div className="animate-fade-in card surface mx-auto mt-8" style={{ maxWidth: '400px' }}>
        <div className="text-center mb-4">
          <Shield size={32} color="var(--color-accent-river)" className="mx-auto mb-2" />
          <h2>Admin Login</h2>
        </div>
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input type="email" required className="form-input" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input type="password" required className="form-input" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <button type="submit" className="btn btn-primary w-full">Sign In</button>
        </form>
      </div>
    );
  }

  return (
    <div className="animate-fade-in admin-container mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="page-title">Admin Dashboard</h1>
          <p className="page-subtitle">Review pending submissions</p>
        </div>
        <button onClick={handleLogout} className="btn btn-outline">Sign Out</button>
      </div>

      <div className="admin-tabs">
        <div 
          className={`admin-tab ${activeTab === 'stories' ? 'active' : ''}`}
          onClick={() => setActiveTab('stories')}
        >
          Pending Stories ({pendingStories.length})
        </div>
        <div 
          className={`admin-tab ${activeTab === 'photos' ? 'active' : ''}`}
          onClick={() => setActiveTab('photos')}
        >
          Pending Photos ({pendingPhotos.length})
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : activeTab === 'stories' ? (
        <div className="grid grid-cols-1">
          {pendingStories.length === 0 ? <p className="text-center opacity-50">No pending stories.</p> : null}
          {pendingStories.map(story => (
            <div key={story.id} className="card surface">
              <span className="status-badge status-pending mb-4">Pending</span>
              {story.attached_photo_path && (
                <div className="mb-4 rounded overflow-hidden" style={{ borderRadius: '4px', overflow: 'hidden', marginBottom: '1rem' }}>
                  <img 
                    src={getPhotoUrl(story.attached_photo_path)} 
                    alt="Pending story attachment" 
                    className="w-full h-auto object-cover"
                    onClick={() => setSelectedImage(getPhotoUrl(story.attached_photo_path))}
                    style={{ width: '100%', maxHeight: '200px', objectFit: 'cover', cursor: 'pointer' }} 
                  />
                  <p className="text-sm mt-1" style={{ fontSize: '0.8rem', color: '#64748b' }}>Attached photo: {story.attached_photo_path}</p>
                </div>
              )}
              <p className="mb-2"><strong>Author:</strong> {story.author_name} ({story.author_email || 'No email'})</p>
              <div className="story-content bg-gray-50 p-4 rounded mb-4" style={{ backgroundColor: '#f1f5f9' }}>
                {story.content}
              </div>
              <div className="admin-actions">
                <button onClick={() => updateStoryStatus(story.id, 'approved')} className="btn btn-primary bg-green-600">
                  <Check size={16} /> Approve
                </button>
                <button onClick={() => updateStoryStatus(story.id, 'rejected')} className="btn btn-outline text-red-600">
                  <X size={16} /> Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2">
          {pendingPhotos.length === 0 ? <p className="text-center opacity-50" style={{ gridColumn: 'span 2' }}>No pending photos.</p> : null}
          {pendingPhotos.map(photo => (
            <div key={photo.id} className="card surface">
              <span className="status-badge status-pending mb-4">Pending</span>
              <div className="gallery-image-wrapper mb-4">
                <img 
                  src={getPhotoUrl(photo.storage_path)} 
                  alt="Pending" 
                  className="gallery-image" 
                  onClick={() => setSelectedImage(getPhotoUrl(photo.storage_path))}
                  style={{ cursor: 'pointer' }}
                />
              </div>
              <p><strong>Submitted By:</strong> {photo.submitted_by}</p>
              {photo.caption && <p><strong>Caption:</strong> {photo.caption}</p>}
              
              <div className="admin-actions">
                <button onClick={() => updatePhotoStatus(photo.id, photo.storage_path, 'approved')} className="btn btn-primary bg-green-600">
                  <Check size={16} /> Approve
                </button>
                <button onClick={() => updatePhotoStatus(photo.id, photo.storage_path, 'rejected')} className="btn btn-outline text-red-600">
                  <X size={16} /> Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {selectedImage && (
        <ImageModal imageUrl={selectedImage} onClose={() => setSelectedImage(null)} />
      )}
    </div>
  );
}
